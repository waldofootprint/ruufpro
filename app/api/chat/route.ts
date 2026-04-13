// Streaming chat endpoint for Riley — the AI chatbot on contractor websites.
// Uses Vercel AI SDK + Claude Haiku. Rate limited per IP and per contractor.

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
import { buildChatSystemPrompt } from "@/lib/chat-system-prompt";
import { getTierFromContractor } from "@/lib/types";
import type { ContractorSiteData } from "@/components/contractor-sections/types";

// ---------------------------------------------------------------------------
// Rate limiting (same pattern as /api/notify)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 3_600_000; // 1 hour
const MAX_PER_IP = 20;                  // 20 messages per IP per hour
const MAX_PER_CONTRACTOR_DAY = 50;      // 50 messages per contractor per day
const DAY_MS = 86_400_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, max: number, windowMs: number = RATE_LIMIT_WINDOW_MS): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  });
}, 5 * 60_000);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`chat-ip:${ip}`, MAX_PER_IP)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Service role key — bypasses RLS so we can read chatbot_config (no public policy).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { messages, contractorId, sessionId } = body;

    // Validate inputs
    if (!contractorId || !UUID_REGEX.test(contractorId)) {
      return NextResponse.json({ error: "Invalid contractorId" }, { status: 400 });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Rate limit by contractor (daily)
    if (isRateLimited(`chat-contractor:${contractorId}`, MAX_PER_CONTRACTOR_DAY, DAY_MS)) {
      return NextResponse.json({ error: "Daily chat limit reached" }, { status: 429 });
    }

    // Fetch contractor — must exist and have chatbot enabled
    const { data: contractor } = await supabase
      .from("contractors")
      .select("*, sites(services, reviews, hero_headline, hero_subheadline, about_text)")
      .eq("id", contractorId)
      .eq("has_ai_chatbot", true)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Not found" }, { status: 403 });
    }

    // Fetch chatbot config if the contractor has trained Riley
    const { data: chatbotConfig } = await supabase
      .from("chatbot_config")
      .select("*")
      .eq("contractor_id", contractorId)
      .maybeSingle();

    // Look up existing conversation for message count and lead status
    const { data: existingConvo } = await supabase
      .from("chat_conversations")
      .select("messages, lead_captured")
      .eq("session_id", sessionId)
      .single();

    const messageCount = existingConvo?.messages?.length ?? messages.length;
    const leadCaptured = existingConvo?.lead_captured ?? false;

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
      heroSubheadline: site?.hero_subheadline ?? null,
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
      businessHours: contractor.business_hours ?? null,
    };

    // Build system prompt
    const systemPrompt = buildChatSystemPrompt(templateData, messageCount, leadCaptured, chatbotConfig ?? null);

    // Stream response using Claude Haiku
    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: systemPrompt,
      messages,
      maxOutputTokens: 512,
      temperature: 0.7,
    });

    // Save conversation (fire-and-forget — don't block the stream)
    supabase
      .from("chat_conversations")
      .upsert(
        {
          contractor_id: contractorId,
          session_id: sessionId,
          messages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      )
      .then(() => {});

    const response = result.toUIMessageStreamResponse();
    // Add CORS headers to streaming response for external embeds
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
