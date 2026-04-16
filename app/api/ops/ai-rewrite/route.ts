// AI Rewrite — polishes raw enrichment data into professional website copy + email draft.
// Uses Claude Haiku (~$0.01/prospect). One API call per prospect.
// Input: prospect with enriched Google/FB data.
// Output: about_text, services, hero_headline, email_subject, email_body.
// Called by Inngest auto-enrich chain after enrichment completes.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";
import { checkSpending, recordSpending, API_COSTS } from "@/lib/spending-guard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface AIRewriteResult {
  about_text: string;
  services: string[];
  hero_headline: string;
  email_subject: string;
  email_body: string;
}

const DEFAULT_SERVICES = [
  "Roof Replacement",
  "Roof Repair",
  "Storm Damage Repair",
  "Roof Inspections",
];

function buildPrompt(prospect: Record<string, unknown>): string {
  const reviews = (prospect.google_reviews as any[]) || [];
  const services = (prospect.extracted_services as string[]) || [];
  const fbAbout = (prospect.facebook_about as string) || "";
  const photos = (prospect.photos as any[]) || [];
  const fbPhotos = (prospect.facebook_photos as any[]) || [];
  const licenseType = (prospect.fl_license_type as string) || "";

  const reviewText = reviews
    .filter((r: any) => r.text && r.text.length > 10)
    .slice(0, 5)
    .map((r: any) => `- "${r.text}" — ${r.author} (${r.rating}★)`)
    .join("\n");

  return `You are writing professional website copy and a cold outreach email for a roofing contractor. Use ONLY the data provided — never invent facts, services, or claims.

BUSINESS DATA:
- Name: ${prospect.business_name}
- City: ${prospect.city}, ${prospect.state}
- Google Rating: ${prospect.rating} stars (${prospect.reviews_count} reviews)
- Services found in reviews: ${services.length > 0 ? services.join(", ") : "None detected"}
- Photos available: ${photos.length + fbPhotos.length}
- Facebook About: ${fbAbout || "None available"}
- FL License: ${licenseType || "Not verified"}

CUSTOMER REVIEWS:
${reviewText || "No review text available"}

INSTRUCTIONS:
1. Write an "about" paragraph (2-3 sentences) for their website. Professional but warm. Mention their city. Reference specific things customers praised in reviews. If no review text available, write a generic but honest paragraph using just their name and city.
2. Clean up the services list. If services were detected from reviews, return them cleaned up. If not, return these defaults: ["Roof Replacement", "Roof Repair", "Storm Damage Repair", "Roof Inspections"].
3. Write a hero headline (under 8 words). Something like "Trusted Roofing in [City]" or reference their top specialty if clear from reviews.
4. Write a cold email subject line (under 50 chars) — curiosity-driven, no spam words.
5. Write a cold email body (under 80 words). The pitch: "I built you a free professional website using your real Google reviews and photos. Here's the preview: {preview_url}. It's yours to keep — no strings attached. If you want to add an instant estimate tool for your customers, that's $149/mo." Keep it casual, direct, contractor-friendly. Use {first_name}, {business_name}, {city}, {preview_url} as template variables.

Return ONLY valid JSON with this exact structure:
{
  "about_text": "...",
  "services": ["..."],
  "hero_headline": "...",
  "email_subject": "...",
  "email_body": "..."
}`;
}

async function callHaiku(prompt: string): Promise<AIRewriteResult | null> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Haiku API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    // Validate required fields exist
    if (!parsed.about_text || !parsed.hero_headline || !parsed.email_subject || !parsed.email_body) {
      return null;
    }
    // Ensure services is an array
    if (!Array.isArray(parsed.services) || parsed.services.length === 0) {
      parsed.services = DEFAULT_SERVICES;
    }
    return parsed as AIRewriteResult;
  } catch {
    return null;
  }
}

// ── POST /api/ops/ai-rewrite ──────────────────────────────────────
// Body: { batch_id?, prospect_ids? }
// Rewrites enriched prospect data into polished website copy + email draft.
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { batch_id, prospect_ids } = await req.json();

    if (!batch_id && !prospect_ids?.length) {
      return NextResponse.json({ error: "batch_id or prospect_ids required" }, { status: 400 });
    }

    // Get enriched prospects that haven't been AI-rewritten yet
    let query = supabase
      .from("prospect_pipeline")
      .select("*")
      .eq("stage", "enriched")
      .is("ai_rewritten_at", null);

    if (prospect_ids?.length) {
      query = query.in("id", prospect_ids);
    } else {
      query = query.eq("batch_id", batch_id);
    }

    const { data: prospects, error: fetchErr } = await query;

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!prospects?.length) {
      return NextResponse.json({
        success: true,
        rewritten: 0,
        message: "No prospects need AI rewrite",
      });
    }

    // Spending guard
    const estimatedCost = prospects.length * API_COSTS.anthropic_chat;
    const spending = await checkSpending(estimatedCost);
    if (!spending.allowed) {
      return NextResponse.json({
        error: "Daily spending cap reached",
        detail: spending.reason,
        estimated_cost: `$${estimatedCost.toFixed(2)}`,
      }, { status: 429 });
    }

    let rewritten = 0;
    let apiCalls = 0;
    const errors: string[] = [];

    for (const prospect of prospects) {
      try {
        const prompt = buildPrompt(prospect);
        const result = await callHaiku(prompt);
        apiCalls++;

        if (!result) {
          errors.push(`${prospect.business_name}: AI returned invalid output`);
          continue;
        }

        // Save AI output + advance stage
        const { error: updateErr } = await supabase
          .from("prospect_pipeline")
          .update({
            ai_about_text: result.about_text,
            ai_services: result.services,
            ai_hero_headline: result.hero_headline,
            ai_email_subject: result.email_subject,
            ai_email_body: result.email_body,
            ai_rewritten_at: new Date().toISOString(),
            stage: "ai_rewritten",
            stage_entered_at: new Date().toISOString(),
          })
          .eq("id", prospect.id);

        if (updateErr) {
          errors.push(`${prospect.business_name}: DB update failed — ${updateErr.message}`);
        } else {
          rewritten++;
        }

        // Brief pause between API calls
        if (prospects.indexOf(prospect) < prospects.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (err: any) {
        apiCalls++;
        errors.push(`${prospect.business_name}: ${err.message}`);
      }
    }

    // Record spending
    if (apiCalls > 0) {
      await recordSpending("anthropic_chat", apiCalls, API_COSTS.anthropic_chat, `ai-rewrite: ${batch_id || "manual"}`);
    }

    return NextResponse.json({
      success: true,
      rewritten,
      total: prospects.length,
      api_calls: apiCalls,
      actual_cost: `$${(apiCalls * API_COSTS.anthropic_chat).toFixed(2)}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("AI rewrite error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
