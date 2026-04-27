// Riley on-demand re-crawl endpoint (Step 7).
//
// POST /api/dashboard/riley/recrawl  → SSE stream
//
// Mirrors /api/onboarding/crawl with these differences:
//   - Auth: dashboard auth — must be a logged-in contractor (strict)
//   - URL source: read from chatbot_config.source_website_url (NOT from body)
//   - 400 if no source_website_url on file
//   - Output payload identical to onboarding/crawl `complete` event so the same
//     <CrawlReview /> component can render it (with conflict-diff UI when
//     existing crawl_state.fields[name].manually_edited === true).
//
// Decision #4: on-demand only — no cron.
// Decision #5: no Inngest install — HTTP-triggered only.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  mapScrapeToConfig,
  mergeGeneratedFaqs,
  type ScraperOutput,
  type MapResult,
} from "@/lib/scrape-to-chatbot-config";
import { generateRileyFaqs } from "@/lib/riley-faq-generator";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — .mjs has no .d.ts; types are loose at the boundary
import { crawlRooferSite } from "@/tools/crawl-roofer-site.mjs";

const HARD_BUDGET_MS = 45000;

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
          } catch { /* read-only context */ }
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
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  return contractor ? { supabase, contractor } : null;
}

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

export async function POST(_request: NextRequest) {
  const auth = await getAuthedContractor();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pull source URL from chatbot_config — never from request body
  const { data: cfg } = await auth.supabase
    .from("chatbot_config")
    .select("source_website_url")
    .eq("contractor_id", auth.contractor.id)
    .maybeSingle();

  const sourceUrl = cfg?.source_website_url as string | undefined;
  if (!sourceUrl) {
    return NextResponse.json(
      { error: "No website URL on file. Run the URL crawl in onboarding first." },
      { status: 400 },
    );
  }

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
          console.log(`[riley/recrawl] finished (${cause}) in ${Date.now() - startedAt}ms`);
        }
      };

      try {
        send("progress", { stage: "fetching", message: "Reading your homepage..." });

        const crawlResult: { ok: boolean; reason?: string; scrape?: ScraperOutput; partial?: boolean } =
          await Promise.race([
            crawlRooferSite(sourceUrl, { timeoutMs: HARD_BUDGET_MS }),
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
                ? "Your site blocks crawlers — re-crawl unavailable."
                : reason === "homepage_fetch_failed"
                  ? "Couldn't reach your site — check the URL on file."
                  : "Something went wrong reading your site. Try again.",
          });
          finish(`crawl_fail:${reason}`);
          return;
        }

        const scrape = crawlResult.scrape;
        send("progress", {
          stage: "scraping",
          message: `Found ${scrape.services?.length ?? 0} services across ${scrape.pages_crawled?.length ?? 1} page${(scrape.pages_crawled?.length ?? 1) === 1 ? "" : "s"}`,
        });

        const mapped: MapResult = mapScrapeToConfig(scrape);

        const faqInput = buildFaqInput(scrape);
        let generated: Awaited<ReturnType<typeof generateRileyFaqs>> = [];
        if (faqInput.length >= 100) {
          send("progress", { stage: "faq_gen", message: "Drafting FAQs from your About page" });
          generated = await generateRileyFaqs(faqInput);
        }

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
        console.error("[riley/recrawl] uncaught:", err instanceof Error ? err.stack : err);
        send("error", { stage: "uncaught", message: "Something went wrong. Try again." });
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
