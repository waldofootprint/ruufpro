// POST /api/firecrawl/webhook?contractor_id=<uuid>&secret=<hex>
//
// Firecrawl posts crawl events here. We:
//   1. Verify the secret query param (and HMAC header if Firecrawl sends one).
//   2. Update chatbot_knowledge_crawl_jobs row keyed by Firecrawl job id.
//   3. For each `crawl.page` event, send an Inngest event to
//      `firecrawl/page.crawled` so chunking + embedding runs out-of-band.
//
// Why query-param auth: Firecrawl's webhook signing schemes vary; the secret
// in the URL gives a deterministic guarantee. Firecrawl signs the body with
// its own dashboard-configured secret which we don't share, so we cannot
// validate `x-firecrawl-signature` here — query-param secret is the trust
// anchor.
//
// Must respond <10s or Firecrawl retries. Do NOT chunk/embed inline — enqueue
// to Inngest.

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";

type FirecrawlEvent =
  | "crawl.started"
  | "crawl.page"
  | "crawl.completed"
  | "crawl.failed";

type FirecrawlWebhookPayload = {
  type?: FirecrawlEvent;
  // some Firecrawl variants use "event"; accept both
  event?: FirecrawlEvent;
  id?: string; // crawl/job id
  jobId?: string;
  data?: {
    // single-page payload on crawl.page
    url?: string;
    metadata?: { title?: string; sourceURL?: string };
    markdown?: string;
    // crawl.completed summary
    total?: number;
    completed?: number;
    error?: string;
  } | Array<{
    url?: string;
    metadata?: { title?: string; sourceURL?: string };
    markdown?: string;
  }>;
  metadata?: { title?: string; sourceURL?: string };
  markdown?: string;
  url?: string;
  total?: number;
  completed?: number;
  error?: string;
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const contractorId = url.searchParams.get("contractor_id");
  const presentedSecret = url.searchParams.get("secret");
  const expectedSecret = process.env.FIRECRAWL_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  if (!contractorId || !presentedSecret) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }
  // Constant-time compare on the query-param secret.
  if (
    presentedSecret.length !== expectedSecret.length ||
    !crypto.timingSafeEqual(Buffer.from(presentedSecret), Buffer.from(expectedSecret))
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();

  let payload: FirecrawlWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // Firecrawl sends event names with or without a "crawl." prefix depending on
  // dashboard config. Normalize so the switch matches either form.
  const rawEvent = (payload.type ?? payload.event) as string | undefined;
  const eventType = (rawEvent && !rawEvent.includes(".")
    ? (`crawl.${rawEvent}` as FirecrawlEvent)
    : (rawEvent as FirecrawlEvent | undefined));
  const jobId = payload.id ?? payload.jobId;

  if (!jobId) {
    // Firecrawl sometimes posts page events without a top-level job id.
    // We still need it to look up the contractor. If it's missing, log+ack.
    console.warn("[firecrawl/webhook] missing jobId; event:", eventType);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Find or create the job row.
  const { data: job } = await supabase
    .from("chatbot_knowledge_crawl_jobs")
    .select("id, contractor_id, crawl_batch_id, status, pages_completed, pages_total")
    .eq("firecrawl_job_id", jobId)
    .maybeSingle();

  if (!job) {
    // Webhook fired before the trigger endpoint inserted the row (race).
    // Insert a stub.
    await supabase.from("chatbot_knowledge_crawl_jobs").insert({
      contractor_id: contractorId,
      firecrawl_job_id: jobId,
      status: "running",
    });
  }

  if (job && job.contractor_id !== contractorId) {
    // contractor_id mismatch — refuse silently (don't leak which is real).
    return NextResponse.json({ ok: true, ignored: true });
  }

  const batchId = job?.crawl_batch_id ?? null;

  switch (eventType) {
    case "crawl.started": {
      await supabase
        .from("chatbot_knowledge_crawl_jobs")
        .update({ status: "running" })
        .eq("firecrawl_job_id", jobId);
      break;
    }

    case "crawl.page": {
      // Single-page or batch payload — normalize.
      const pages: Array<{ url?: string; markdown?: string; title?: string }> = [];
      const data = payload.data;
      if (Array.isArray(data)) {
        for (const p of data) {
          pages.push({
            url: p.url ?? p.metadata?.sourceURL,
            markdown: p.markdown,
            title: p.metadata?.title,
          });
        }
      } else if (data) {
        pages.push({
          url: data.url ?? data.metadata?.sourceURL,
          markdown: data.markdown,
          title: data.metadata?.title,
        });
      } else {
        // Some Firecrawl variants put fields at the top level.
        pages.push({
          url: payload.url ?? payload.metadata?.sourceURL,
          markdown: payload.markdown,
          title: payload.metadata?.title,
        });
      }

      // Fire-and-forget Inngest events; don't block webhook ack.
      const events = pages
        .filter((p) => p.url && p.markdown && p.markdown.length >= 100)
        .map((p) => ({
          name: "firecrawl/page.crawled" as const,
          data: {
            contractorId,
            jobId,
            crawlBatchId: batchId,
            sourceUrl: p.url!,
            pageTitle: p.title ?? null,
            markdown: p.markdown!,
          },
        }));

      if (events.length > 0) {
        try {
          const sendResult = await inngest.send(events);
          console.log("[firecrawl/webhook] inngest.send ok:", {
            jobId,
            count: events.length,
            ids: Array.isArray(sendResult?.ids) ? sendResult.ids.length : "n/a",
          });
        } catch (err) {
          console.error("[firecrawl/webhook] inngest.send failed:", err);
        }
      } else {
        console.warn("[firecrawl/webhook] no events to send", {
          jobId,
          rawPagesCount: pages.length,
        });
      }

      // Increment counter — best-effort.
      if (job) {
        await supabase
          .from("chatbot_knowledge_crawl_jobs")
          .update({ pages_completed: (job.pages_completed ?? 0) + pages.length })
          .eq("firecrawl_job_id", jobId);
      }
      break;
    }

    case "crawl.completed": {
      const total = (payload.data && !Array.isArray(payload.data) && payload.data.total) ?? payload.total ?? null;
      await supabase
        .from("chatbot_knowledge_crawl_jobs")
        .update({
          status: "completed",
          pages_total: total,
          completed_at: new Date().toISOString(),
        })
        .eq("firecrawl_job_id", jobId);
      break;
    }

    case "crawl.failed": {
      const errorMessage =
        (payload.data && !Array.isArray(payload.data) && payload.data.error) ??
        payload.error ??
        "unknown";
      await supabase
        .from("chatbot_knowledge_crawl_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("firecrawl_job_id", jobId);
      break;
    }

    default:
      console.warn("[firecrawl/webhook] unknown event:", eventType);
  }

  return NextResponse.json({ ok: true });
}
