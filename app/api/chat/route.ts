// Streaming chat endpoint for Riley — the AI chatbot on contractor websites.
// Uses Vercel AI SDK + Claude Haiku. Rate limited per IP and per contractor.
// Supports tool calls: getEstimate (satellite roof measurement + pricing).

import { NextRequest, NextResponse } from "next/server";
import { streamText, tool, stepCountIs, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { buildChatSystemPrompt } from "@/lib/chat-system-prompt";
import { detectIntent } from "@/lib/intent-detection";
import { runChatEstimate } from "@/lib/chat-estimate";
import { getTierFromContractor } from "@/lib/types";
import { postProcessRileyResponse, type PostProcessOptions } from "@/lib/riley-post-process";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

// ---------------------------------------------------------------------------
// Rate limiting — Supabase-backed for serverless persistence (ZL-001)
// In-memory Map is kept as a fast-path cache (warm instance optimization).
// Supabase table `rate_limits` is the authoritative source.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 3_600_000; // 1 hour
const MAX_PER_IP = 20;                  // 20 messages per IP per hour
const MAX_PER_CONTRACTOR_DAY = 200;     // 200 messages per contractor per day
const MAX_GLOBAL_DAILY = 5000;          // Global daily cap — circuit breaker (ZL-003)
const DAY_MS = 86_400_000;

// In-memory fast-path (same-instance optimization, not authoritative)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedLocal(key: string, max: number, windowMs: number = RATE_LIMIT_WINDOW_MS): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

// Supabase-backed rate limit check (authoritative, uses direct upsert)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isRateLimitedDb(
  supabase: any,
  key: string,
  max: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): Promise<boolean> {
  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    // Check existing entry
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at) < now) {
      // Expired or new — reset
      await supabase
        .from("rate_limits")
        .upsert({ key, count: 1, reset_at: resetAt.toISOString() }, { onConflict: "key" });
      return false;
    }

    // Increment
    const newCount = existing.count + 1;
    await supabase
      .from("rate_limits")
      .update({ count: newCount, updated_at: now.toISOString() })
      .eq("key", key);

    return newCount > max;
  } catch {
    // Fallback to local on DB error
    return isRateLimitedLocal(key, max, windowMs);
  }
}

// Global daily usage counter — check and increment (ZL-003)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAndIncrementDailyUsage(supabase: any): Promise<boolean> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from("api_usage_daily")
      .select("chat_messages")
      .eq("date", today)
      .maybeSingle();

    const currentCount = existing?.chat_messages ?? 0;

    if (currentCount >= MAX_GLOBAL_DAILY) {
      return true; // Over limit
    }

    // Increment (or insert)
    await supabase
      .from("api_usage_daily")
      .upsert(
        { date: today, chat_messages: currentCount + 1, updated_at: new Date().toISOString() },
        { onConflict: "date" }
      );

    return false;
  } catch {
    return false; // Don't block on DB errors
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// CORS: allow ruufpro.com + contractor external sites (ZL-002)
function getCorsHeaders(origin?: string | null) {
  const allowed = origin && (
    origin.endsWith(".ruufpro.com") ||
    origin === "https://ruufpro.com" ||
    origin === "http://localhost:3000"
  );
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://ruufpro.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const CORS_HEADERS = getCorsHeaders(origin);

  // Service role key — bypasses RLS so we can read chatbot_config (no public policy).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Rate limit by IP (DB-backed for serverless persistence — ZL-001)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await isRateLimitedDb(supabase, `chat-ip:${ip}`, MAX_PER_IP)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS_HEADERS });
  }

  // Global daily cost ceiling (ZL-003)
  if (await checkAndIncrementDailyUsage(supabase)) {
    return NextResponse.json(
      { error: "Riley is temporarily unavailable due to high demand. Please try again later." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await request.json();
    const { messages, contractorId, sessionId, testMode } = body;

    // Validate inputs
    if (!contractorId || !UUID_REGEX.test(contractorId)) {
      return NextResponse.json({ error: "Invalid contractorId" }, { status: 400, headers: CORS_HEADERS });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400, headers: CORS_HEADERS });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId required" }, { status: 400, headers: CORS_HEADERS });
    }
    // Validate session ID format — must be UUID-UUID (contractorId-randomUUID)
    const SESSION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!SESSION_ID_REGEX.test(sessionId)) {
      return NextResponse.json({ error: "Invalid sessionId format" }, { status: 400, headers: CORS_HEADERS });
    }

    // Guard against oversized payloads (cost protection)
    if (messages.length > 25) {
      return NextResponse.json({ error: "Conversation too long" }, { status: 400, headers: CORS_HEADERS });
    }
    const lastMsg = messages[messages.length - 1];
    const lastContent = typeof lastMsg?.content === "string" ? lastMsg.content : "";
    if (lastContent.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400, headers: CORS_HEADERS });
    }
    // Server-side message cap — enforce 12 user messages max (ZL-031)
    const userMsgCount = messages.filter((m: { role: string }) => m.role === "user").length;
    if (userMsgCount > 12) {
      return NextResponse.json({ error: "Conversation limit reached" }, { status: 400, headers: CORS_HEADERS });
    }

    // Rate limit by contractor (daily, DB-backed)
    if (await isRateLimitedDb(supabase, `chat-contractor:${contractorId}`, MAX_PER_CONTRACTOR_DAY, DAY_MS)) {
      return NextResponse.json({ error: "Daily chat limit reached" }, { status: 429, headers: CORS_HEADERS });
    }

    // testMode: preview from Settings before turning Riley on — requires session auth
    // that proves the caller owns this contractor.
    let bypassEnabledCheck = false;
    if (testMode === true) {
      const cookieStore = cookies();
      const authed = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() { /* read-only */ },
          },
        }
      );
      const { data: { user } } = await authed.auth.getUser();
      if (user) {
        const { data: owned } = await supabase
          .from("contractors")
          .select("id")
          .eq("id", contractorId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (owned) bypassEnabledCheck = true;
      }
      if (!bypassEnabledCheck) {
        return NextResponse.json({ error: "Unauthorized test" }, { status: 401, headers: CORS_HEADERS });
      }
    }

    // Fetch contractor — must exist and have chatbot enabled (unless in authenticated testMode)
    const contractorQuery = supabase
      .from("contractors")
      .select("*, sites(services, reviews, hero_headline, about_text)")
      .eq("id", contractorId);
    if (!bypassEnabledCheck) contractorQuery.eq("has_ai_chatbot", true);
    const { data: contractor } = await contractorQuery.single();

    if (!contractor) {
      return NextResponse.json({ error: "Not found" }, { status: 403, headers: CORS_HEADERS });
    }

    // Look up existing conversation for message count, lead status, and cached config
    const { data: existingConvo } = await supabase
      .from("chat_conversations")
      .select("messages, lead_captured, config_snapshot")
      .eq("session_id", sessionId)
      .single();

    const messageCount = existingConvo?.messages?.length ?? messages.length;
    const leadCaptured = existingConvo?.lead_captured ?? false;

    // Fetch chatbot config — use cached version from conversation if available (ZL-020)
    // This prevents mid-conversation pricing contradictions when roofer updates config
    let chatbotConfig = existingConvo?.config_snapshot ?? null;
    if (!chatbotConfig) {
      const { data } = await supabase
        .from("chatbot_config")
        .select("*")
        .eq("contractor_id", contractorId)
        .maybeSingle();
      chatbotConfig = data;
    }

    // Business name (sanitized) — used in system prompt + post-processor
    const biz = contractor.business_name.replace(/[`<>]/g, "").trim();

    // Build ContractorSiteData for the system prompt
    const site = Array.isArray(contractor.sites) ? contractor.sites[0] : contractor.sites;
    const templateData: ContractorSiteData = {
      tier: getTierFromContractor(contractor),
      businessName: contractor.business_name,
      phone: contractor.phone,
      city: contractor.city,
      state: contractor.state,
      tagline: contractor.tagline,
      heroHeadline: site?.hero_headline ?? null,
      heroSubheadline: null,
      heroCta: null,
      heroImage: null,
      aboutText: site?.about_text ?? null,
      services: site?.services ?? [],
      reviews: site?.reviews ?? [],
      isLicensed: contractor.is_licensed,
      isInsured: contractor.is_insured,
      gafMasterElite: contractor.gaf_master_elite,
      owensCorningPreferred: contractor.owens_corning_preferred,
      certainteedSelect: contractor.certainteed_select,
      bbbAccredited: contractor.bbb_accredited,
      bbbRating: contractor.bbb_rating,
      offersFinancing: contractor.offers_financing,
      warrantyYears: contractor.warranty_years,
      yearsInBusiness: contractor.years_in_business,
      serviceAreaCities: contractor.service_area_cities ?? [],
      hasEstimateWidget: contractor.has_estimate_widget,
      hasAiChatbot: true,
      contractorId: contractor.id,
      urgencyBadge: null,
      slug: "",
      address: contractor.address,
      zip: contractor.zip,
      logoUrl: contractor.logo_url,
      licenseNumber: contractor.license_number,
      galleryImages: [],
      businessHours: contractor.business_hours ?? null,
    };

    // Check if contractor has estimate widget enabled (for tool availability)
    const hasEstimateWidget = contractor.has_estimate_widget;

    // Count prior estimate tool calls in this session (ZL-006 — max 3 per session)
    const MAX_ESTIMATES_PER_SESSION = 3;
    let estimateCallCount = 0;
    if (existingConvo?.messages && Array.isArray(existingConvo.messages)) {
      estimateCallCount = existingConvo.messages.filter(
        (m: { role?: string; parts?: Array<{ type?: string }> }) =>
          m.parts?.some((p) => p.type === "tool-getEstimate")
      ).length;
    }

    // Compute intent from conversation messages
    const intent = detectIntent(messages, { leadCaptured });

    // Build system prompt (with intent signals for context)
    const systemPrompt = buildChatSystemPrompt(templateData, messageCount, leadCaptured, chatbotConfig ?? null, hasEstimateWidget, intent);

    // Stream response using Claude Haiku — with estimate tool when available
    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1024,
      temperature: 0.7,
      ...(hasEstimateWidget
        ? {
            tools: {
              getEstimate: tool({
                description:
                  "Get a satellite-measured roofing estimate for a homeowner's address. " +
                  "Call this ONLY when the homeowner has provided a street address and wants a ballpark estimate. " +
                  "Do NOT call this if they only mentioned a city or asked about pricing in general.",
                inputSchema: z.object({
                  address: z
                    .string()
                    .describe("The homeowner's full street address including city and state"),
                }),
                execute: async ({ address }: { address: string }) => {
                  // Rate limit estimates per session (ZL-006)
                  if (estimateCallCount >= MAX_ESTIMATES_PER_SESSION) {
                    return {
                      success: false,
                      error: "estimate_limit",
                      fallbackMessage: "I've looked up a few addresses for you already — for more detailed estimates, the team can help directly. Want me to connect you?",
                    };
                  }
                  estimateCallCount++;
                  return runChatEstimate(contractorId, address);
                },
              }),
            },
            stopWhen: stepCountIs(2), // Allow model to respond after tool execution
          }
        : {}),
    });

    // Save conversation (fire-and-forget — don't block the stream)
    // Include config_snapshot on first save so pricing stays consistent mid-conversation (ZL-020)
    supabase
      .from("chat_conversations")
      .upsert(
        {
          contractor_id: contractorId,
          session_id: sessionId,
          messages,
          ...(messageCount <= 1 && chatbotConfig ? { config_snapshot: chatbotConfig } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      )
      .then(({ error: saveErr }) => {
        if (saveErr) console.error("Failed to save chat conversation:", saveErr);
      });

    // Post-process Riley's response — deterministic enforcement of filler ban,
    // credential cap (2 max), and insurance compliance. Zero API cost.
    const lastUserContent = lastContent.toLowerCase();
    const isInsuranceQuery =
      intent?.situation === "insurance_claim" ||
      /insurance|adjuster|claim|deductible/.test(lastUserContent);

    const postProcessOpts: PostProcessOptions = {
      isInsuranceQuery,
      stage: intent.stage,
      situation: intent.situation,
      insuranceCannedResponse: isInsuranceQuery
        ? `${chatbotConfig?.does_insurance_work ? `${biz} has experience working with insurance companies and can help you understand the process. Every claim is different though — the` : "The"} best next step is a free inspection — ${biz} can assess the damage and help you figure out your options from there.`
        : undefined,
    };

    // Consume UI message stream, collect text, post-process, rebuild stream.
    // This buffers the full response (~1-2s for Riley's short replies) to ensure
    // deterministic enforcement of filler ban, credential cap, and insurance guard.
    const uiStream = result.toUIMessageStream();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunks: any[] = [];
    let rawText = "";

    for await (const chunk of uiStream) {
      chunks.push(chunk);
      if (chunk.type === "text-delta") {
        rawText += chunk.delta;
      }
    }

    const processed = postProcessRileyResponse(rawText, postProcessOpts);

    // Rebuild stream with processed text
    const outputStream = createUIMessageStream({
      execute: async ({ writer }) => {
        let textReplaced = false;
        for (const chunk of chunks) {
          if (chunk.type === "text-delta") {
            if (!textReplaced) {
              writer.write({ ...chunk, delta: processed });
              textReplaced = true;
            }
            // Skip subsequent text deltas (merged into single processed chunk)
          } else {
            writer.write(chunk);
          }
        }
      },
    });

    const response = createUIMessageStreamResponse({
      stream: outputStream,
      headers: CORS_HEADERS,
    });
    return response;
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    // Retry once for transient Anthropic errors (ZL-016)
    const status = (err as { status?: number })?.status;
    const message = (err as { message?: string })?.message || "";
    if (status === 429 || status === 503 || message.includes("overloaded")) {
      try {
        await new Promise((r) => setTimeout(r, 1000));
        // Re-throw to caller — the retry would need to re-run the full streamText call
        // For now, log and return a more helpful error
        console.error("Chat API transient error, retry not yet implemented for streaming");
      } catch { /* ignore retry errors */ }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
