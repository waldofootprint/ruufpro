// Firecrawl async /v1/crawl helper.
//
// Used by /api/onboarding/full-crawl to kick off a full-site spider after the
// contractor finishes onboarding. Crawl runs server-side at Firecrawl, posts
// per-page events back to /api/firecrawl/webhook.
//
// Returns Firecrawl's job id so we can persist it in chatbot_knowledge_crawl_jobs.

const FIRECRAWL_BASE = "https://api.firecrawl.dev";

export type CrawlTriggerInput = {
  url: string;
  contractorId: string;
  webhookSecret: string;
  webhookBaseUrl: string; // e.g. "https://ruufpro.com"
  limit?: number;
};

export type CrawlTriggerResult =
  | { ok: true; jobId: string; rawResponse: unknown }
  | { ok: false; reason: string; status?: number };

export async function triggerFullSiteCrawl(input: CrawlTriggerInput): Promise<CrawlTriggerResult> {
  if (!process.env.FIRECRAWL_API_KEY) {
    return { ok: false, reason: "missing_firecrawl_key" };
  }

  // Pass contractor_id + secret as query params on the webhook URL so the
  // webhook receiver can authenticate and route per-page events without an
  // extra DB lookup. Firecrawl will append `?id=<jobId>` etc. — we keep our
  // params first so they survive.
  const webhookUrl = new URL(`${input.webhookBaseUrl}/api/firecrawl/webhook`);
  webhookUrl.searchParams.set("contractor_id", input.contractorId);
  webhookUrl.searchParams.set("secret", input.webhookSecret);

  const body = {
    url: input.url,
    limit: input.limit ?? 100,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
    // Object form is required to subscribe to per-page events. The bare URL
    // form silently delivers nothing on v1 — found 2026-04-27 session 6.
    webhook: {
      url: webhookUrl.toString(),
      events: ["started", "page", "completed", "failed"],
    },
    excludePaths: [
      "/blog/.*",
      "/wp-admin/.*",
      "/cart/.*",
      "/checkout/.*",
      "/my-account/.*",
      "/feed/.*",
      "/wp-json/.*",
    ],
  };

  let response: Response;
  try {
    response = await fetch(`${FIRECRAWL_BASE}/v1/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      reason: `network_error:${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, reason: `http_${response.status}:${text.slice(0, 200)}`, status: response.status };
  }

  const json = (await response.json().catch(() => null)) as
    | { id?: string; success?: boolean; url?: string }
    | null;

  if (!json || !json.id) {
    return { ok: false, reason: "no_job_id_in_response" };
  }

  return { ok: true, jobId: json.id, rawResponse: json };
}

// Fetch crawl-job status from Firecrawl. Used by /api/dashboard/riley/crawl-status
// as a fallback when our local row is stale.
export async function getCrawlStatus(jobId: string): Promise<{
  ok: boolean;
  status?: "scraping" | "completed" | "failed";
  total?: number;
  completed?: number;
  reason?: string;
}> {
  if (!process.env.FIRECRAWL_API_KEY) return { ok: false, reason: "missing_firecrawl_key" };

  const res = await fetch(`${FIRECRAWL_BASE}/v1/crawl/${jobId}`, {
    headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
  });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const json = (await res.json().catch(() => null)) as
    | { status?: string; total?: number; completed?: number }
    | null;
  if (!json) return { ok: false, reason: "bad_json" };
  return {
    ok: true,
    status: json.status as "scraping" | "completed" | "failed" | undefined,
    total: json.total,
    completed: json.completed,
  };
}
