// Instantly.ai API client for cold email outreach.
// Handles: reading replies, sending replies, campaign management.
// Docs: https://developer.instantly.ai/

const INSTANTLY_API_BASE = "https://api.instantly.ai/api/v1";

function getApiKey(): string {
  const key = process.env.INSTANTLY_API_KEY;
  if (!key) throw new Error("INSTANTLY_API_KEY not set");
  return key;
}

// ─── Types ───────────────────────────────────────────────

export interface InstantlyReply {
  id: string;
  from_email: string;
  from_name: string;
  to_email: string;
  subject: string;
  body: string;
  timestamp: string;
  campaign_id: string;
  lead_email: string;
}

export interface InstantlySendParams {
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  reply_to_message_id?: string;
}

// ─── API Helpers ─────────────────────────────────────────

async function instantlyFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${INSTANTLY_API_BASE}${endpoint}`;
  const separator = endpoint.includes("?") ? "&" : "?";
  const urlWithKey = `${url}${separator}api_key=${getApiKey()}`;

  const res = await fetch(urlWithKey, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Instantly API error: ${res.status} ${text}`);
    throw new Error(`Instantly API ${res.status}: ${text}`);
  }

  return res;
}

// ─── Get Recent Replies ──────────────────────────────────

export async function getRecentReplies(
  campaignId?: string
): Promise<InstantlyReply[]> {
  try {
    const endpoint = campaignId
      ? `/unibox/emails?campaign_id=${campaignId}&reply_type=received`
      : `/unibox/emails?reply_type=received`;

    const res = await instantlyFetch(endpoint);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching Instantly replies:", error);
    return [];
  }
}

// ─── Send Reply ──────────────────────────────────────────

export async function sendReply(
  params: InstantlySendParams
): Promise<{ success: boolean; error?: string }> {
  try {
    await instantlyFetch("/unibox/emails/reply", {
      method: "POST",
      body: JSON.stringify({
        reply_to_uuid: params.reply_to_message_id,
        from: params.from_email,
        to: params.to_email,
        subject: params.subject,
        body: {
          text: params.body,
          html: params.body.replace(/\n/g, "<br>"),
        },
      }),
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending Instantly reply:", message);
    return { success: false, error: message };
  }
}

// ─── Add to Suppression List ─────────────────────────────

export async function addToSuppressionList(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await instantlyFetch("/lead/delete", {
      method: "POST",
      body: JSON.stringify({
        delete_list: [email],
        delete_from_all_campaigns: true,
      }),
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding to suppression list:", message);
    return { success: false, error: message };
  }
}

// ─── Get Lead Context (for enriching replies) ────────────

export async function getLeadInfo(
  email: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await instantlyFetch(`/lead/get?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}
