// GET /api/dashboard/riley/crawl-status
//
// Returns the latest chatbot_knowledge_crawl_jobs row + a chunk count.
// Used by the RileyTab status banner to poll background-crawl progress.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

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

export async function GET() {
  const auth = await getAuthedContractor();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: job } = await auth.supabase
    .from("chatbot_knowledge_crawl_jobs")
    .select("id, firecrawl_job_id, status, pages_total, pages_completed, error_message, started_at, completed_at")
    .eq("contractor_id", auth.contractorId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ status: "none" });
  }

  // Count indexed chunks (= pages with content). Useful for the "trained on N pages" line.
  let indexedPages: number | null = null;
  if (job.status === "completed") {
    const { data: distinctPages } = await auth.supabase.rpc("count_distinct_source_urls", {
      p_contractor_id: auth.contractorId,
    });
    indexedPages = (distinctPages as number | null) ?? null;
  }

  return NextResponse.json({
    status: job.status,
    pagesTotal: job.pages_total,
    pagesCompleted: job.pages_completed,
    indexedPages,
    errorMessage: job.error_message,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  });
}
