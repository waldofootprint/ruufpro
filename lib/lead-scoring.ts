// Lead scoring — analyzes chat messages to determine temperature.
// Hot: emergency, ready to buy, insurance claim
// Warm: pricing questions, timeline questions, comparing quotes
// Browsing: general info, few messages, no urgency signals

import type { LeadTemperature } from "@/lib/types";

interface ChatMessage {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

const HOT_KEYWORDS = [
  // Emergency / urgency
  "leak", "leaking", "water coming", "emergency", "urgent", "asap", "right now",
  "storm damage", "tree fell", "hole in roof", "caving in", "flooding",
  // Ready to buy
  "when can you start", "how soon", "ready to go", "let's do it", "schedule",
  "book", "appointment", "come out", "this week", "tomorrow",
  // Insurance claim
  "insurance claim", "adjuster", "claim number", "filed a claim",
];

const WARM_KEYWORDS = [
  // Pricing intent
  "how much", "cost", "price", "estimate", "quote", "budget", "afford",
  "financing", "payment plan", "monthly payment",
  // Comparison shopping
  "other quotes", "comparing", "competitor", "another company", "better deal",
  // Timeline planning
  "timeline", "how long", "when would", "planning to", "thinking about",
  "next month", "this year", "spring", "summer", "fall",
  // Specific questions (shows real interest)
  "warranty", "materials", "shingles", "metal roof", "tile",
  "insurance", "deductible",
];

function getMessageText(msg: ChatMessage): string {
  if (msg.parts) {
    return msg.parts.filter((p) => p.type === "text" && p.text).map((p) => p.text).join("");
  }
  return msg.content || "";
}

export function scoreLeadFromChat(messages: ChatMessage[]): LeadTemperature {
  const userMessages = messages.filter((m) => m.role === "user");
  const allText = userMessages.map(getMessageText).join(" ").toLowerCase();

  // Check hot keywords first
  const hotHits = HOT_KEYWORDS.filter((kw) => allText.includes(kw)).length;
  if (hotHits >= 1) return "hot";

  // Check warm keywords
  const warmHits = WARM_KEYWORDS.filter((kw) => allText.includes(kw)).length;

  // High message count (5+) + warm keywords = warm
  if (warmHits >= 2) return "warm";
  if (warmHits >= 1 && userMessages.length >= 4) return "warm";

  // Engaged but no signals
  if (userMessages.length >= 5) return "warm";

  return "browsing";
}
