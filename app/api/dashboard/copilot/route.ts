// Streaming chat endpoint for Copilot — the AI business assistant in the roofer's dashboard.
// Uses Vercel AI SDK + Claude Haiku. Auth via Supabase session cookies (dashboard auth).
// Tools: getLeads, getLeadDetails, draftFollowup, getBusinessSnapshot.

import { NextRequest, NextResponse } from "next/server";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  COPILOT_SYSTEM_PROMPT_STABLE,
  buildCopilotContextBlock,
} from "@/lib/copilot-system-prompt";
import {
  getLeadsForCopilot,
  getLeadDetailsForCopilot,
  getBusinessSnapshotForCopilot,
  getReviewStatsForCopilot,
  findUnreviewedCustomersForCopilot,
  sendBatchReviewRequestsForCopilot,
  draftReviewResponseForCopilot,
  getLeadEngagementForCopilot,
  getMaterialSwitchesForCopilot,
} from "@/lib/copilot-tools";

// ---------------------------------------------------------------------------
// Rate limiting — reuses same pattern as Riley chat route
// ---------------------------------------------------------------------------
const MAX_PER_CONTRACTOR_DAY = 50; // 50 copilot messages per contractor per day
const MAX_GLOBAL_DAILY = 5000;     // Shared global cap with Riley
const DAY_MS = 86_400_000;

// In-memory fast-path
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedLocal(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

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
    return isRateLimitedLocal(key, max, windowMs);
  }
}

// Track copilot usage separately from Riley
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAndIncrementCopilotUsage(supabase: any): Promise<boolean> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("api_usage_daily")
      .select("chat_messages, copilot_messages")
      .eq("date", today)
      .maybeSingle();

    const chatTotal = (existing?.chat_messages ?? 0) + (existing?.copilot_messages ?? 0);
    if (chatTotal >= MAX_GLOBAL_DAILY) return true;

    const copilotCount = existing?.copilot_messages ?? 0;
    await supabase
      .from("api_usage_daily")
      .upsert(
        { date: today, copilot_messages: copilotCount + 1, updated_at: new Date().toISOString() },
        { onConflict: "date" }
      );
    return false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Get current copilot usage count for display in UI
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCopilotUsageToday(supabase: any, contractorId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", `copilot-contractor:${contractorId}`)
      .maybeSingle();
    if (!data || new Date(data.reset_at) < new Date()) return 0;
    return data.count;
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  // ---------------------------------------------------------------------------
  // Auth: Supabase session cookies (dashboard auth, not public)
  // ---------------------------------------------------------------------------
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
    }
  );

  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role client for DB operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up contractor for this user
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, city, state, owner_first_name")
    .eq("user_id", user.id)
    .single();

  if (!contractor) {
    return NextResponse.json({ error: "Contractor not found" }, { status: 403 });
  }

  const contractorId = contractor.id;

  // Rate limit by contractor (daily)
  if (await isRateLimitedDb(supabase, `copilot-contractor:${contractorId}`, MAX_PER_CONTRACTOR_DAY, DAY_MS)) {
    const usage = await getCopilotUsageToday(supabase, contractorId);
    return NextResponse.json(
      { error: "Daily copilot limit reached", usage, limit: MAX_PER_CONTRACTOR_DAY },
      { status: 429 }
    );
  }

  // Global daily cap (shared with Riley)
  if (await checkAndIncrementCopilotUsage(supabase)) {
    return NextResponse.json(
      { error: "Copilot is temporarily unavailable due to high demand." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { messages, sessionId } = body;

    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Guard against oversized payloads
    if (messages.length > 25) {
      return NextResponse.json({ error: "Conversation too long" }, { status: 400 });
    }
    const lastMsg = messages[messages.length - 1];
    const lastContent = typeof lastMsg?.content === "string" ? lastMsg.content : "";
    if (lastContent.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    // Build system prompt — split into stable (cached) + volatile (per-request)
    // Stable part (~1500 tokens): rules, tool docs, formatting, examples
    // Volatile part (~50 tokens): business name, city, date
    // Cache saves ~90% on the stable portion for repeated requests
    const volatileContext = buildCopilotContextBlock({
      businessName: contractor.business_name,
      city: contractor.city,
      state: contractor.state,
      ownerFirstName: contractor.owner_first_name,
    });

    // Get current usage for response header
    const usage = await getCopilotUsageToday(supabase, contractorId);

    // Stream response with tools + prompt caching
    // The @ai-sdk/anthropic provider maps providerOptions.anthropic.cacheControl
    // to Anthropic's cache_control API. The stable system prompt (~1500 tokens)
    // is cached for 5 min (0.1x cost on reads). Volatile context (name, date, city)
    // is appended after the cache boundary so it doesn't invalidate the cache.
    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: [
        {
          role: "system" as const,
          content: COPILOT_SYSTEM_PROMPT_STABLE,
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        {
          role: "system" as const,
          content: volatileContext,
        },
      ],
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1024,
      temperature: 0.3, // Lower than Riley — data-driven, more deterministic
      tools: {
        getLeads: tool({
          description:
            "Search and filter the contractor's leads. Call this for ANY question about leads, " +
            "including 'show me leads', 'who came in today', 'hot leads', 'uncontacted leads', etc.",
          inputSchema: z.object({
            status: z
              .enum(["new", "contacted", "appointment_set", "quoted", "won", "completed", "lost"])
              .optional()
              .describe("Filter by lead status"),
            temperature: z
              .enum(["hot", "warm", "browsing"])
              .optional()
              .describe("Filter by lead temperature/urgency"),
            dateRange: z
              .enum(["today", "this_week", "this_month", "all"])
              .optional()
              .describe("Filter by when the lead came in"),
            uncontacted: z
              .boolean()
              .optional()
              .describe("Set true to show only leads that haven't been contacted yet"),
            limit: z
              .number()
              .optional()
              .describe("Max number of leads to return, default 10"),
          }),
          execute: async (filters) => {
            return getLeadsForCopilot(supabase, contractorId, filters);
          },
        }),

        getLeadDetails: tool({
          description:
            "Look up a specific lead by name or ID. Call this when the user mentions " +
            "a person by name or asks about a specific lead. Supports partial name matching.",
          inputSchema: z.object({
            nameOrId: z
              .string()
              .describe("The lead's name (partial match OK) or UUID"),
          }),
          execute: async ({ nameOrId }) => {
            const lead = await getLeadDetailsForCopilot(supabase, contractorId, nameOrId);
            if (!lead) return { found: false, message: "No lead found matching that name." };
            return { found: true, lead };
          },
        }),

        draftFollowup: tool({
          description:
            "Generate context for drafting a follow-up message to a lead. Call this when the user " +
            "asks you to write, draft, or compose a follow-up text or email. You will use the " +
            "returned lead data to write the message yourself.",
          inputSchema: z.object({
            leadName: z
              .string()
              .describe("Name of the lead to follow up with"),
            channel: z
              .enum(["text", "email"])
              .optional()
              .describe("Whether to draft a text message or email, default text"),
          }),
          execute: async ({ leadName }) => {
            const lead = await getLeadDetailsForCopilot(supabase, contractorId, leadName);
            if (!lead) return { found: false, message: "No lead found matching that name." };
            return {
              found: true,
              lead,
              businessName: contractor.business_name,
              ownerName: contractor.owner_first_name,
            };
          },
        }),

        getBusinessSnapshot: tool({
          description:
            "Get an overview of the contractor's business metrics — total leads, leads today/this week, " +
            "breakdown by status and temperature, average response time, pipeline value, conversion rate, " +
            "and uncontacted leads count. Call this for 'how am I doing', 'give me an overview', or " +
            "any general business performance question.",
          inputSchema: z.object({}),
          execute: async () => {
            return getBusinessSnapshotForCopilot(supabase, contractorId);
          },
        }),

        // ── Review / Reputation Tools ──────────────────────────────────

        getReviewStats: tool({
          description:
            "Get review request metrics — how many sent, clicked, reviewed, conversion rates, " +
            "and recent activity. Call this for 'how are my reviews doing', 'review stats', " +
            "'review performance', or any question about reviews.",
          inputSchema: z.object({}),
          execute: async () => {
            return getReviewStatsForCopilot(supabase, contractorId);
          },
        }),

        findUnreviewedCustomers: tool({
          description:
            "Find completed/won jobs that haven't been asked for a review yet. Call this for " +
            "'who hasn't left a review', 'unreviewed customers', 'who should I ask for reviews'.",
          inputSchema: z.object({}),
          execute: async () => {
            return findUnreviewedCustomersForCopilot(supabase, contractorId);
          },
        }),

        sendReviewRequests: tool({
          description:
            "Send review request emails to one or more completed-job customers. Call this when " +
            "the user says 'send review requests to all of them', 'ask them for reviews', or confirms " +
            "sending after seeing the unreviewed list. IMPORTANT: Always confirm with the user before calling this.",
          inputSchema: z.object({
            leadIds: z
              .array(z.string())
              .describe("Array of lead UUIDs to send review requests to (max 10)"),
          }),
          execute: async ({ leadIds }) => {
            return sendBatchReviewRequestsForCopilot(supabase, contractorId, leadIds);
          },
        }),

        draftReviewResponse: tool({
          description:
            "Help draft a professional response to a Google review. Call this when the user asks " +
            "'help me reply to this review', 'draft a response', or pastes a review they received. " +
            "Returns guidelines — you compose the actual response.",
          inputSchema: z.object({
            reviewText: z.string().describe("The text of the Google review to respond to"),
            starRating: z.number().min(1).max(5).describe("The star rating (1-5)"),
          }),
          execute: async ({ reviewText, starRating }) => {
            return draftReviewResponseForCopilot(reviewText, starRating, contractor.business_name);
          },
        }),

        // ── Engagement / Replay Count ─────────────────────────────────

        getLeadEngagement: tool({
          description:
            "Check how many times a lead has viewed their estimate — both the initial widget " +
            "and the living estimate page. Call when asked about lead engagement, interest level, " +
            "'how interested is [name]', 'are they checking their estimate', or replay count.",
          inputSchema: z.object({
            nameOrId: z
              .string()
              .describe("The lead's name (partial match OK) or UUID"),
          }),
          execute: async ({ nameOrId }) => {
            return getLeadEngagementForCopilot(supabase, contractorId, nameOrId);
          },
        }),

        getMaterialSwitches: tool({
          description:
            "Check if a lead compared different material options (asphalt, metal, tile, cedar) " +
            "in the estimate widget or living estimate. Call for material comparison, preference, " +
            "'what materials did they look at', or 'did they compare options'.",
          inputSchema: z.object({
            nameOrId: z
              .string()
              .describe("The lead's name (partial match OK) or UUID"),
          }),
          execute: async ({ nameOrId }) => {
            return getMaterialSwitchesForCopilot(supabase, contractorId, nameOrId);
          },
        }),
      },
      stopWhen: stepCountIs(2),
    });

    // Save conversation (fire-and-forget)
    supabase
      .from("chat_conversations")
      .upsert(
        {
          contractor_id: contractorId,
          session_id: sessionId,
          type: "copilot",
          messages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      )
      .then(({ error: saveErr }) => {
        if (saveErr) console.error("Failed to save copilot conversation:", saveErr);
      });

    // Return streaming response with usage header
    const response = result.toUIMessageStreamResponse();
    response.headers.set("X-Copilot-Usage", String(usage + 1));
    response.headers.set("X-Copilot-Limit", String(MAX_PER_CONTRACTOR_DAY));
    return response;
  } catch (err: unknown) {
    console.error("Copilot API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
