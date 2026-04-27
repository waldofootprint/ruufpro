// POST /api/onboarding/full-crawl
//
// Kicks off the async Firecrawl spider against the roofer's full site.
// Called fire-and-forget from Screen 4 handlePublish AFTER contractor row +
// chatbot_config exist. Per-page results stream back via Firecrawl webhook
// → /api/firecrawl/webhook → Inngest chunk+embed.
//
// Auth: logged-in contractor (must own the contractor row).
// URL source: chatbot_config.source_website_url (NOT request body).
// Idempotent-ish: if a non-failed job exists from the last 5 min, returns it.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { triggerFullSiteCrawl } from "@/lib/firecrawl-crawl";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";

function getWebhookBaseUrl(req: NextRequest): string {
  // Prefer explicit env (avoids preview deploys firing webhooks back to prod
  // and vice versa). Fall back to request host.
  const explicit = process.env.FULL_CRAWL_WEBHOOK_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "ruufpro.com";
  return `${proto}://${host}`;
}

async function getAuthedContractor() {
  const cookieStore = cookies();
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* read-only */ }
        },
      },
    },
  );

  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return contractor ? { supabase, contractorId: contractor.id as string } : null;
}

export async function POST(request: NextRequest) {
  const auth = await getAuthedContractor();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const webhookSecret = process.env.FIRECRAWL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Server misconfigured: FIRECRAWL_WEBHOOK_SECRET" }, { status: 500 });
  }

  const { data: cfg } = await auth.supabase
    .from("chatbot_config")
    .select("source_website_url")
    .eq("contractor_id", auth.contractorId)
    .maybeSingle();

  const sourceUrl = cfg?.source_website_url as string | undefined;
  if (!sourceUrl) {
    return NextResponse.json(
      { error: "No website URL on file. Run the URL crawl in onboarding first." },
      { status: 400 },
    );
  }

  // Dedupe: if there's a queued/running job in the last 5 min, return it.
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: existing } = await auth.supabase
    .from("chatbot_knowledge_crawl_jobs")
    .select("id, firecrawl_job_id, status, started_at")
    .eq("contractor_id", auth.contractorId)
    .in("status", ["queued", "running"])
    .gte("started_at", fiveMinAgo)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      reused: true,
      jobId: existing.firecrawl_job_id,
      status: existing.status,
    });
  }

  const trigger = await triggerFullSiteCrawl({
    url: sourceUrl,
    contractorId: auth.contractorId,
    webhookSecret,
    webhookBaseUrl: getWebhookBaseUrl(request),
  });

  if (!trigger.ok) {
    return NextResponse.json({ error: trigger.reason }, { status: 502 });
  }

  const { error: insertErr } = await auth.supabase
    .from("chatbot_knowledge_crawl_jobs")
    .insert({
      contractor_id: auth.contractorId,
      firecrawl_job_id: trigger.jobId,
      status: "queued",
    });

  if (insertErr) {
    console.error("[full-crawl] failed to insert job row:", insertErr);
    // Don't fail the whole request — webhook will create row if needed.
  }

  // Schedule the poll-completion safety net. Firecrawl's `crawl.completed`
  // webhook is unreliable — polling /v1/crawl/{id} is the source of truth.
  try {
    await inngest.send({
      name: "firecrawl/crawl.poll",
      data: { jobId: trigger.jobId, contractorId: auth.contractorId },
    });
  } catch (err) {
    console.error("[full-crawl] failed to schedule poll:", err);
  }

  return NextResponse.json({ ok: true, jobId: trigger.jobId });
}
