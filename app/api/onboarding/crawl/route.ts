// Riley URL-crawl onboarding endpoint.
//
// POST /api/onboarding/crawl  body: { url: string }  → SSE stream
//
// Pipeline:
//   1. Auth (logged-in contractor required, same pattern as dashboard routes)
//   2. Validate URL — block social/yelp/GMB hosts
//   3. Run tools/crawl-roofer-site.mjs (multi-page crawl, 45s budget)
//   4. Run lib/scrape-to-chatbot-config.ts:mapScrapeToConfig → 4 patches
//   5. Run lib/riley-faq-generator.ts on About+Services text
//   6. Merge generated FAQs into custom_faqs via mergeGeneratedFaqs
//   7. Stream `complete` event with the full payload
//
// Does NOT write to DB. The review-screen Save handler (Step 6) persists.
// Hard 45s budget — partial results are still streamed as `complete`.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  mapScrapeToConfig,
  mergeGeneratedFaqs,
  type ScraperOutput,
  type MapResult,
} from "@/lib/scrape-to-chatbot-config";
import { generateRileyFaqs } from "@/lib/riley-faq-generator";

// Importing the .mjs from a .ts route is supported by Next/SWC. The module itself
// uses dynamic Playwright launch so it stays out of the build's static analysis.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — .mjs has no .d.ts; types are loose at the boundary
import { crawlRooferSite } from "@/tools/crawl-roofer-site.mjs";

const HARD_BUDGET_MS = 45000;

const BLOCKED_HOST_PATTERNS = [
  { rx: /(?:^|\.)facebook\.com$/i, name: "Facebook" },
  { rx: /(?:^|\.)instagram\.com$/i, name: "Instagram" },
  { rx: /(?:^|\.)yelp\.com$/i, name: "Yelp" },
  { rx: /(?:^|\.)business\.google\.com$/i, name: "Google Business Profile" },
  { rx: /(?:^|\.)g\.page$/i, name: "Google Business Profile" },
  { rx: /(?:^|\.)linkedin\.com$/i, name: "LinkedIn" },
];

function validateUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  if (!raw || typeof raw !== "string") {
    return { ok: false, message: "URL is required." };
  }
  let normalized = raw.trim();
  if (!normalized) return { ok: false, message: "URL is required." };
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, message: "That doesn't look like a valid URL." };
  }

  const host = parsed.hostname.toLowerCase();
  for (const { rx, name } of BLOCKED_HOST_PATTERNS) {
    if (rx.test(host)) {
      return {
        ok: false,
        message: `That's a ${name} page — paste your website URL instead. No website? Skip this step.`,
      };
    }
  }
  return { ok: true, url: normalized };
}

// Onboarding crawl runs BEFORE the contractor row is inserted (publish step), so
// auth requires only a logged-in Supabase user. The recrawl endpoint (Step 7)
// keeps the strict contractor-row check.
async function getAuthedUser() {
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
          } catch { /* read-only context */ }
        },
      },
    },
  );

  const { data: { user } } = await authSupabase.auth.getUser();
  return user ?? null;
}

// Build the about+services+differentiators text to feed Haiku.
function buildFaqInput(scrape: ScraperOutput): string {
  const parts: string[] = [];
  if (scrape.tagline) parts.push(scrape.tagline);
  if (scrape.about_text) parts.push(scrape.about_text);
  if (scrape.team_description && scrape.team_description !== scrape.about_text) {
    parts.push(scrape.team_description);
  }
  if (scrape.services?.length) parts.push(`Services: ${scrape.services.join(", ")}`);
  if (scrape.differentiators_bullets?.length) {
    parts.push(`Why us: ${scrape.differentiators_bullets.join(" | ")}`);
  }
  if (scrape.warranty_excerpt) parts.push(`Warranty: ${scrape.warranty_excerpt}`);
  if (scrape.financing_brand) parts.push(`Financing: ${scrape.financing_brand}`);
  if (scrape.payment_methods?.length) parts.push(`Payment: ${scrape.payment_methods.join(", ")}`);
  if (scrape.emergency_excerpt) parts.push(`Emergency: ${scrape.emergency_excerpt}`);
  if (scrape.business_hours) parts.push(`Hours: ${scrape.business_hours}`);
  if (scrape.service_areas?.length) parts.push(`Service areas: ${scrape.service_areas.join(", ")}`);
  if (scrape.founded_year) parts.push(`Founded: ${scrape.founded_year}`);
  return parts.join("\n\n");
}

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateUrl(body.url ?? "");
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }
  const targetUrl = validation.url;

  const startedAt = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const finish = (cause: string) => {
        try { controller.close(); } catch {}
        if (process.env.NODE_ENV !== "production") {
          console.log(`[onboarding/crawl] finished (${cause}) in ${Date.now() - startedAt}ms`);
        }
      };

      try {
        send("progress", { stage: "fetching", message: "Reading your homepage..." });

        // Step 3 wrapper. Hard budget enforced inside, but we also race here
        // so an unresponsive Playwright doesn't outlive the route timeout.
        const crawlPromise = crawlRooferSite(targetUrl, { timeoutMs: HARD_BUDGET_MS });
        const crawlResult: { ok: boolean; reason?: string; scrape?: ScraperOutput; partial?: boolean } =
          await Promise.race([
            crawlPromise,
            new Promise((resolve) =>
              setTimeout(
                () => resolve({ ok: false, reason: "route_timeout" }),
                HARD_BUDGET_MS + 2000,
              ),
            ),
          ]) as never;

        if (!crawlResult.ok || !crawlResult.scrape) {
          const reason = crawlResult.reason ?? "unknown";
          send("error", {
            stage: reason === "robots_disallow" ? "robots" :
                   reason === "blocked_host" ? "blocked_host" :
                   reason === "homepage_fetch_failed" ? "fetch_failed" : "crawl_failed",
            message:
              reason === "robots_disallow"
                ? "Your site blocks crawlers — let's set Riley up manually."
                : reason === "blocked_host"
                  ? "That's a social or directory page — paste your website URL instead."
                  : reason === "homepage_fetch_failed"
                    ? "Couldn't reach your site — check the URL and try again."
                    : "Something went wrong reading your site. Try again or skip.",
          });
          finish(`crawl_fail:${reason}`);
          return;
        }

        const scrape = crawlResult.scrape;

        send("progress", {
          stage: "scraping",
          message: `Found ${scrape.services?.length ?? 0} services across ${scrape.pages_crawled?.length ?? 1} page${(scrape.pages_crawled?.length ?? 1) === 1 ? "" : "s"}`,
        });

        // Step 4: shared mapper builds the 4 patches from the scrape.
        const mapped: MapResult = mapScrapeToConfig(scrape);

        // Step 5: Haiku-generated FAQs from About + Services text.
        const faqInput = buildFaqInput(scrape);
        let generated: Awaited<ReturnType<typeof generateRileyFaqs>> = [];

        if (faqInput.length >= 100) {
          send("progress", {
            stage: "faq_gen",
            message: "Drafting FAQs from your About page",
          });
          generated = await generateRileyFaqs(faqInput);
        } else {
          send("progress", {
            stage: "faq_gen",
            message: "Site too thin for auto-FAQs — you can add them yourself",
          });
        }

        // Step 6: merge generated into mapper-produced custom_faqs (cap 20, first 5 generated pre-checked).
        const mergedFaqs = mergeGeneratedFaqs(
          mapped.chatbotConfig.custom_faqs ?? [],
          generated,
        );
        mapped.chatbotConfig.custom_faqs = mergedFaqs;

        send("complete", {
          patch: {
            chatbotConfig: mapped.chatbotConfig,
            sites: mapped.sites,
            contractors: mapped.contractors,
          },
          crawlState: mapped.crawlState,
          pagesCrawled: scrape.pages_crawled ?? [],
          generatedFaqCount: generated.length,
          partial: !!crawlResult.partial,
          elapsedMs: Date.now() - startedAt,
        });
        finish("ok");
      } catch (err) {
        console.error("[onboarding/crawl] uncaught:", err instanceof Error ? err.stack : err);
        send("error", {
          stage: "uncaught",
          message: "Something went wrong. Try again or skip.",
        });
        finish("uncaught");
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
