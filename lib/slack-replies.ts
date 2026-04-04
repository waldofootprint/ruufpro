// Slack integration for the reply handler.
// Posts interactive Block Kit messages to #reply-queue channel.
// Handles: sending notifications, updating messages after actions.

// ─── Types ───────────────────────────────────────────────

export interface ReplyNotification {
  id: string; // outreach_replies row ID
  prospectName: string;
  prospectCompany: string;
  prospectCity?: string;
  prospectState?: string;
  prospectScore?: number;
  prospectTier?: string;
  channel: string; // 'instantly' | 'linkedin' | 'facebook'
  category: string; // 'interested' | 'question' | 'objection' | 'not_now' | 'unsubscribe'
  confidence: string; // 'high' | 'medium' | 'low'
  inboundText: string; // their reply
  originalOutreach?: string; // what we sent
  draftReply: string; // AI-generated draft
}

// ─── Config ──────────────────────────────────────────────

function getSlackConfig() {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_REPLY_CHANNEL;
  if (!token) throw new Error("SLACK_BOT_TOKEN not set");
  if (!channel) throw new Error("SLACK_REPLY_CHANNEL not set");
  return { token, channel };
}

// ─── Helpers ─────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  interested: "🔴",
  question: "🟡",
  objection: "⚪",
  not_now: "🔵",
  unsubscribe: "⛔",
};

const CATEGORY_LABEL: Record<string, string> = {
  interested: "INTERESTED",
  question: "QUESTION",
  objection: "OBJECTION",
  not_now: "NOT NOW",
  unsubscribe: "UNSUBSCRIBE",
};

const CHANNEL_EMOJI: Record<string, string> = {
  instantly: "📧",
  linkedin: "💼",
  facebook: "📘",
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

// ─── Build Block Kit Message ─────────────────────────────

function buildBlocks(notification: ReplyNotification) {
  const {
    id,
    prospectName,
    prospectCompany,
    prospectCity,
    prospectState,
    prospectScore,
    prospectTier,
    channel,
    category,
    confidence,
    inboundText,
    originalOutreach,
    draftReply,
  } = notification;

  const emoji = CATEGORY_EMOJI[category] || "⚪";
  const label = CATEGORY_LABEL[category] || category.toUpperCase();
  const channelEmoji = CHANNEL_EMOJI[channel] || "📧";
  const location = [prospectCity, prospectState].filter(Boolean).join(", ");
  const tierDisplay = prospectTier ? prospectTier.toUpperCase() : "—";
  const scoreDisplay = prospectScore ? `${prospectScore}` : "—";
  const confidenceNote =
    confidence === "low"
      ? "\n⚠️ _Low confidence — I'm not sure how to read this one. Check my categorization._"
      : "";

  const blocks: Record<string, unknown>[] = [
    // Header
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} NEW REPLY — ${label}`,
        emoji: true,
      },
    },
    // Prospect card
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Prospect:*\n${prospectName}` },
        { type: "mrkdwn", text: `*Company:*\n${prospectCompany || "—"}` },
        { type: "mrkdwn", text: `*Location:*\n${location || "—"}` },
        {
          type: "mrkdwn",
          text: `*Channel:*\n${channelEmoji} ${channel}`,
        },
        { type: "mrkdwn", text: `*Score:*\n${scoreDisplay}` },
        { type: "mrkdwn", text: `*Tier:*\n${tierDisplay}` },
      ],
    },
    { type: "divider" },
    // Their reply
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Their Reply:*\n>${inboundText.split("\n").join("\n>")}${confidenceNote}`,
      },
    },
  ];

  // Original outreach (if available, truncated)
  if (originalOutreach) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📤 *Original outreach:* ${truncate(originalOutreach, 200)}`,
        },
      ],
    });
  }

  blocks.push({ type: "divider" });

  // Draft reply
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Draft Reply:*\n\`\`\`${draftReply}\`\`\``,
    },
  });

  // Action buttons
  blocks.push({
    type: "actions",
    block_id: `reply_actions_${id}`,
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "✅ Send", emoji: true },
        style: "primary",
        action_id: "reply_send",
        value: id,
      },
      {
        type: "button",
        text: { type: "plain_text", text: "✏️ Edit", emoji: true },
        action_id: "reply_edit",
        value: id,
      },
      {
        type: "button",
        text: { type: "plain_text", text: "⏭ Skip", emoji: true },
        action_id: "reply_skip",
        value: id,
      },
      {
        type: "button",
        text: { type: "plain_text", text: "🗑 Remove", emoji: true },
        style: "danger",
        action_id: "reply_remove",
        value: id,
        confirm: {
          title: { type: "plain_text", text: "Remove prospect?" },
          text: {
            type: "mrkdwn",
            text: "This will add them to the suppression list and remove from all campaigns.",
          },
          confirm: { type: "plain_text", text: "Remove" },
          deny: { type: "plain_text", text: "Cancel" },
        },
      },
    ],
  });

  return blocks;
}

// ─── Post to Slack ───────────────────────────────────────

export async function postReplyNotification(
  notification: ReplyNotification
): Promise<{ success: boolean; messageTs?: string; error?: string }> {
  try {
    const { token, channel } = getSlackConfig();
    const blocks = buildBlocks(notification);

    const emoji = CATEGORY_EMOJI[notification.category] || "⚪";
    const label = CATEGORY_LABEL[notification.category] || "REPLY";
    const fallbackText = `${emoji} ${label} from ${notification.prospectName} (${notification.prospectCompany}): "${truncate(notification.inboundText, 100)}"`;

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text: fallbackText,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("Slack API error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true, messageTs: data.ts };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error posting to Slack:", message);
    return { success: false, error: message };
  }
}

// ─── Update Slack Message After Action ───────────────────

export async function updateReplyMessage(
  messageTs: string,
  action: "sent" | "skipped" | "removed" | "editing",
  editedReply?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { token, channel } = getSlackConfig();

    const statusText: Record<string, string> = {
      sent: "✅ *Sent* by Hannah",
      skipped: "⏭ *Skipped*",
      removed: "🗑 *Removed* — added to suppression list",
      editing: "✏️ *Editing* — reply in thread with your version, then click Send",
    };

    const res = await fetch("https://slack.com/api/chat.update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        ts: messageTs,
        text: statusText[action],
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${statusText[action]}${editedReply ? `\n\n*Sent:*\n\`\`\`${editedReply}\`\`\`` : ""}`,
            },
          },
        ],
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Slack update error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ─── Post Thread Reply (for Edit flow) ───────────────────

export async function postThreadMessage(
  parentTs: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { token, channel } = getSlackConfig();

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        thread_ts: parentTs,
        text,
      }),
    });

    const data = await res.json();
    if (!data.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
