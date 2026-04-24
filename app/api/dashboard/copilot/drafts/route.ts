// Generate AI-powered draft responses for a lead in 3 tones (direct/warm/formal).
// Uses Claude Haiku with prompt caching. Falls back gracefully on API errors.
// Auth via Supabase session cookies (dashboard auth).

import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// Rate limit: drafts are AI-generated — cap to prevent spam abuse.
// Separate bucket from /api/dashboard/copilot chat (50/day) because drafts
// are a discrete click action, not conversational turns.
const MAX_DRAFTS_PER_CONTRACTOR_DAY = 100;
const DAY_MS = 86_400_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isRateLimitedDb(supabase: any, key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at) < now) {
      await supabase
        .from("rate_limits")
        .upsert({ key, count: 1, reset_at: resetAt.toISOString() }, { onConflict: "key" });
      return false;
    }

    const newCount = existing.count + 1;
    await supabase
      .from("rate_limits")
      .update({ count: newCount, updated_at: now.toISOString() })
      .eq("key", key);
    return newCount > max;
  } catch {
    return false; // fail open on DB error — don't block the dashboard
  }
}

// Reuse the auth pattern from leads route
async function getAuthedContractor(cookieStore: ReturnType<typeof cookies>) {
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
    }
  );

  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, owner_first_name, city, state")
    .eq("user_id", user.id)
    .single();

  return contractor ? { supabase, contractor } : null;
}

// Stable prompt for draft generation — cached across requests
const DRAFT_SYSTEM_PROMPT = `You are a copywriter for a roofing contractor. Generate 3 follow-up message drafts for a homeowner lead — one in each tone:

## Tones
- **direct**: Get straight to the point. Confident, brief. "Hey [name], [reason for reaching out]. Can I come take a look [time]?"
- **warm**: Friendly and empathetic. Acknowledge their situation. "Hi [name], thanks for reaching out — I know [situation] can be stressful..."
- **formal**: Professional and polished. "Dear [name], thank you for contacting [business]. We would be pleased to..."

## Rules
1. For texts: HARD LIMIT 130 characters per draft. If it's over 130, cut words. Brevity wins.
2. For emails: 2-3 short sentences max.
3. Use the lead's FIRST NAME only.
4. Reference ONE specific detail (material, address, or how they found you).
5. End with a clear next step (inspection, call, time suggestion).
6. Never promise discounts, timelines, or binding prices.
7. Sound like a real person texting, not a marketing bot.

## Status-specific behavior
- **new/contacted**: Introduce yourself, reference their request, suggest inspection time.
- **quoted**: Gentle nudge about the estimate. "Any questions?" Not a re-pitch.
- **completed**: The job is DONE. Ask for a Google review or referral. Do NOT pitch more work.
- **won**: Congratulate, confirm next steps.`;

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const auth = await getAuthedContractor(cookieStore);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (await isRateLimitedDb(auth.supabase, `copilot-drafts:${auth.contractor.id}`, MAX_DRAFTS_PER_CONTRACTOR_DAY, DAY_MS)) {
    return NextResponse.json(
      { error: "Daily draft limit reached", limit: MAX_DRAFTS_PER_CONTRACTOR_DAY },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { leadId, channel } = body;

  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  // Fetch the lead
  const { data: lead } = await auth.supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("contractor_id", auth.contractor.id)
    .single();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Build lead context for the AI
  const hoursAgo = Math.round((Date.now() - new Date(lead.created_at).getTime()) / 3600000);
  const estimateStr = lead.estimate_low && lead.estimate_high
    ? `$${lead.estimate_low.toLocaleString()} – $${lead.estimate_high.toLocaleString()}`
    : lead.estimate_low ? `$${lead.estimate_low.toLocaleString()}`
    : "no estimate yet";

  const leadContext = `Lead data:
- Name: ${lead.name}
- Status: ${lead.status}
- Source: ${lead.source === "ai_chatbot" ? "AI chat conversation" : lead.source === "estimate_widget" ? "estimate widget on your website" : "contact form"}
- Estimate: ${estimateStr}
- Material: ${lead.estimate_material || "not specified"}
- Address: ${lead.address || "not provided"}
- Phone: ${lead.phone ? "yes" : "no"}
- Email: ${lead.email ? "yes" : "no"}
- When: ${hoursAgo < 1 ? "just now" : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`}
- Notes: ${lead.notes || "none"}
- Channel: ${channel === "email" ? "email (can be longer, 2-3 sentences)" : "text message (under 160 chars)"}

Business: ${auth.contractor.business_name}, ${auth.contractor.city}, ${auth.contractor.state}
Owner: ${auth.contractor.owner_first_name || "the owner"}`;

  try {
    const result = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: DRAFT_SYSTEM_PROMPT,
      prompt: leadContext,
      schema: z.object({
        direct: z.string().describe("Direct tone — brief, confident, under 130 chars for texts"),
        warm: z.string().describe("Warm tone — friendly, empathetic, under 130 chars for texts"),
        formal: z.string().describe("Formal tone — professional, polished, under 130 chars for texts"),
      }),
      temperature: 0.7, // Some creativity in drafts
      maxOutputTokens: 512,
    });

    return NextResponse.json({
      drafts: result.object,
      leadId,
    });
  } catch (err: unknown) {
    console.error("Draft generation failed:", err);
    const msg = err instanceof Error ? err.message : "Draft generation failed";
    return NextResponse.json({ error: msg, fallback: true }, { status: 500 });
  }
}
