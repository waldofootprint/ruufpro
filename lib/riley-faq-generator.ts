// Riley FAQ generator — Haiku 4.5, strict JSON schema, prompt caching on system block.
//
// Used by app/api/onboarding/crawl to suggest 10 FAQs from a roofer's About + Services
// + Why-Choose-Us text. The API route is responsible for tagging/merging via
// `mergeGeneratedFaqs()` from lib/scrape-to-chatbot-config.ts (handles cap + pre-check
// state). This module just calls Haiku and returns a clean array.
//
// Why prompt caching: the system prompt is long + static across every contractor's
// onboarding. With ephemeral cache, repeated invocations within 5 min hit the cache
// at ~10x cost reduction (Anthropic prompt caching). The user-message body is
// volatile and lives outside the cache boundary.

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

export type GeneratedFaq = {
  q: string;
  a: string;
  source_excerpt?: string;
};

const INPUT_CAP = 8000;

// Verbatim from the Session 2 handoff §4. Long + stable → ideal cache target.
const SYSTEM_PROMPT = `You are extracting FAQs a homeowner would actually ask. Output strict JSON: {faqs: [{q, a, source_excerpt}]}. Use ONLY facts from the provided text. Never invent prices, timelines, or warranty terms not stated. Cap 10 entries. Each \`a\` ≤200 chars, plain language, first-person ("we").

Examples of good Q/A pairs to draw from a roofer's About + Services text:
- "How long have you been in business?" → uses founded_year or years_in_business if mentioned
- "Do you do free inspections?" → only if "free inspection/estimate/quote" appears in source
- "What materials do you install?" → from services list, only specific brands if named
- "Do you handle insurance claims?" → only if insurance work is mentioned
- "Do you offer financing?" → only if a financing brand or "financing" is mentioned
- "What areas do you serve?" → only if cities/regions are listed in source
- "Are you licensed and insured?" → only if mentioned in source
- "What's your warranty?" → only paraphrase warranty span actually present in source

Hard rules:
- If the source text doesn't mention something, do NOT generate a FAQ about it.
- Never make up phone numbers, prices, dollar amounts, response times, or warranty year counts.
- Never use "the company" — always "we".
- Each \`source_excerpt\` must be a verbatim ≤120-char snippet from the input that supports the answer.
- If the input is too thin to support 10 FAQs, return fewer. Quality over count.
- Output JSON only. No prose, no markdown.`;

const ResponseSchema = z.object({
  faqs: z.array(
    z.object({
      q: z.string().min(5).max(200),
      a: z.string().min(5).max(220),
      source_excerpt: z.string().max(160).optional(),
    }),
  ),
});

/**
 * Generate up to 10 FAQs from a roofer's website text.
 * Returns [] on any error — caller should surface "FAQ generator was busy" UX.
 *
 * @param siteText - Concatenated About + Services + Why-Choose-Us text. Auto-capped at 8K chars.
 * @param opts.signal - AbortSignal for upstream timeout (e.g. SSE 45s budget).
 */
export async function generateRileyFaqs(
  siteText: string,
  opts: { signal?: AbortSignal } = {},
): Promise<GeneratedFaq[]> {
  if (!siteText || siteText.trim().length < 100) return [];

  const truncated = siteText.length > INPUT_CAP ? siteText.slice(0, INPUT_CAP) : siteText;

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: ResponseSchema,
      // Pass system as a messages entry so we can attach cacheControl. Per existing
      // pattern in app/api/dashboard/copilot/route.ts.
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        {
          role: "user",
          content: `Roofer website text:\n\n${truncated}`,
        },
      ],
      maxOutputTokens: 2048,
      temperature: 0.3,
      abortSignal: opts.signal,
    });

    return object.faqs.slice(0, 10).map((f) => ({
      q: f.q.trim(),
      a: f.a.trim(),
      source_excerpt: f.source_excerpt?.trim(),
    }));
  } catch (err) {
    console.error("[riley-faq-generator] Haiku call failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
