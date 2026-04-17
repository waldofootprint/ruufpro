// Intent Detection Engine for Riley — multi-signal intent classification.
// Replaces flat keyword matching with structured intent analysis.
// Pure, deterministic. Zero API calls. Runs server-side and client-side.

import type { LeadTemperature } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

/** What kind of question the homeowner is asking */
export type QuestionType =
  | "price_seeking"
  | "timeline_seeking"
  | "trust_seeking"
  | "emergency"
  | "insurance"
  | "comparison"
  | "general_info"
  | "scheduling";

/** Where the homeowner is in their buying journey (legacy — use ConversationStage) */
export type TopicProgression = "browsing" | "comparing" | "deciding";

/** Conversation stage — drives lead form timing + prompt behavior */
export type ConversationStage =
  | "greeting"       // First 1-2 messages, no real question yet
  | "discovery"      // Asking general questions, exploring
  | "consideration"  // Comparing options, asking about price/materials/timeline
  | "decision"       // Ready to act — scheduling, providing address, using estimate tool
  | "close";         // Lead captured or conversation capped

/** Detected situation for tone adaptation */
export type Situation =
  | "emergency"
  | "insurance_claim"
  | "price_shopping"
  | "planning_ahead"
  | "just_browsing";

/** Reasons the lead form should show (consumed by feature #10) */
export type CaptureSignal =
  | "provided_address"
  | "asked_scheduling"
  | "emergency_detected"
  | "repeated_price_question"
  | "used_estimate_tool"
  | "high_engagement"
  | "deciding_stage";

export interface ConversationIntent {
  /** All question types detected across the conversation (deduplicated) */
  questionTypes: QuestionType[];
  /** Dominant question type in the most recent user message */
  latestQuestionType: QuestionType | null;
  /** Topic progression: browsing → comparing → deciding (legacy) */
  topicProgression: TopicProgression;
  /** Conversation stage — drives lead form timing + prompt behavior */
  stage: ConversationStage;
  /** Detected homeowner situation (for tone adaptation) */
  situation: Situation;
  /** Engagement signals */
  engagement: {
    messageCount: number;
    usedEstimateTool: boolean;
    providedAddress: boolean;
    mentionedSpecifics: boolean;
    questionBreadth: number;
  };
  /** Reasons the lead form should show */
  captureSignals: CaptureSignal[];
  /** Backward-compatible temperature derivation */
  temperature: LeadTemperature;
}

// ---------------------------------------------------------------------------
// Keyword maps — organized by question type, not temperature
// ---------------------------------------------------------------------------

const QUESTION_KEYWORDS: Record<QuestionType, string[]> = {
  emergency: [
    "leak", "leaking", "water coming", "emergency", "urgent", "asap",
    "right now", "storm damage", "tree fell", "hole in roof", "caving in",
    "flooding", "water damage", "active leak",
  ],
  scheduling: [
    "when can you start", "how soon", "ready to go", "let's do it",
    "schedule", "book", "appointment", "come out", "this week", "tomorrow",
    "set up a time", "come by",
  ],
  insurance: [
    "insurance claim", "adjuster", "claim number", "filed a claim",
    "insurance company", "deductible", "insurance process",
  ],
  price_seeking: [
    "how much", "cost", "price", "estimate", "quote", "budget", "afford",
    "financing", "payment plan", "monthly payment", "ballpark",
  ],
  comparison: [
    "other quotes", "comparing", "competitor", "another company",
    "better deal", "other roofer", "other estimate", "shopping around",
  ],
  timeline_seeking: [
    "timeline", "how long", "when would", "planning to", "thinking about",
    "next month", "this year", "spring", "summer", "fall", "how many days",
  ],
  trust_seeking: [
    "warranty", "licensed", "insured", "reviews", "bbb", "how long in business",
    "years of experience", "certif", "accredited", "reputation", "references",
  ],
  general_info: [
    "what services", "do you do", "what kind", "tell me about",
    "what types", "can you help",
  ],
};

const SPECIFIC_MENTIONS = [
  "shingles", "metal roof", "tile", "flat roof", "tpo", "epdm",
  "gaf", "owens corning", "certainteed", "standing seam",
  "asphalt", "slate", "cedar", "architectural",
];

// Simple street address pattern: number + street name + type
const ADDRESS_REGEX = /\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|dr|drive|rd|road|ln|lane|ct|court|way|pl|place|cir|circle)\b/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getMessageText(msg: ChatMessage): string {
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }
  return msg.content || "";
}

function classifyMessage(text: string): QuestionType[] {
  const lower = text.toLowerCase();
  const types: QuestionType[] = [];
  for (const [type, keywords] of Object.entries(QUESTION_KEYWORDS) as [QuestionType, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) {
      types.push(type);
    }
  }
  return types;
}

function hasEstimateToolCall(messages: ChatMessage[]): boolean {
  return messages.some(
    (m) => m.parts?.some((p) => p.type === "tool-getEstimate") ?? false
  );
}

// ---------------------------------------------------------------------------
// Core detection
// ---------------------------------------------------------------------------

export interface DetectIntentOptions {
  /** Whether the homeowner has already submitted the lead form */
  leadCaptured?: boolean;
}

export function detectIntent(messages: ChatMessage[], options: DetectIntentOptions = {}): ConversationIntent {
  const userMessages = messages.filter((m) => m.role === "user");
  const allUserText = userMessages.map(getMessageText).join(" ").toLowerCase();

  // --- Per-message classification ---
  const allTypes = new Set<QuestionType>();
  let latestQuestionType: QuestionType | null = null;

  for (const msg of userMessages) {
    const text = getMessageText(msg);
    const types = classifyMessage(text);
    types.forEach((t) => allTypes.add(t));
    if (types.length > 0) {
      latestQuestionType = types[0]; // first match = strongest signal
    }
  }

  const questionTypes = Array.from(allTypes);

  // --- Engagement signals ---
  const usedEstimateTool = hasEstimateToolCall(messages);
  const providedAddress = ADDRESS_REGEX.test(allUserText);
  const mentionedSpecifics = SPECIFIC_MENTIONS.some((s) => allUserText.includes(s));
  const questionBreadth = questionTypes.length;

  const engagement = {
    messageCount: userMessages.length,
    usedEstimateTool,
    providedAddress,
    mentionedSpecifics,
    questionBreadth,
  };

  // --- Topic progression ---
  let topicProgression: TopicProgression = "browsing";

  const hasComparisonSignals = allTypes.has("comparison") || questionBreadth >= 2;
  const hasDecidingSignals =
    allTypes.has("scheduling") || providedAddress || usedEstimateTool;

  if (hasDecidingSignals) {
    topicProgression = "deciding";
  } else if (hasComparisonSignals) {
    topicProgression = "comparing";
  }

  // --- Situation (priority order) ---
  let situation: Situation = "just_browsing";

  if (allTypes.has("emergency")) {
    situation = "emergency";
  } else if (allTypes.has("insurance")) {
    situation = "insurance_claim";
  } else if (allTypes.has("comparison") || allTypes.has("price_seeking")) {
    situation = "price_shopping";
  } else if (
    allTypes.has("timeline_seeking") ||
    allTypes.has("scheduling") ||
    allTypes.has("trust_seeking")
  ) {
    situation = "planning_ahead";
  }

  // --- Capture signals ---
  const captureSignals: CaptureSignal[] = [];

  if (providedAddress) captureSignals.push("provided_address");
  if (allTypes.has("scheduling")) captureSignals.push("asked_scheduling");
  if (allTypes.has("emergency")) captureSignals.push("emergency_detected");
  if (usedEstimateTool) captureSignals.push("used_estimate_tool");
  if (topicProgression === "deciding") captureSignals.push("deciding_stage");

  // Repeated price question: price_seeking appeared in 2+ separate user messages
  const priceMessageCount = userMessages.filter(
    (m) => classifyMessage(getMessageText(m)).includes("price_seeking")
  ).length;
  if (priceMessageCount >= 2) captureSignals.push("repeated_price_question");

  // High engagement: 5+ messages with at least one warm signal
  if (userMessages.length >= 5 && questionBreadth >= 1) {
    captureSignals.push("high_engagement");
  }

  // --- Conversation stage ---
  let stage: ConversationStage = "greeting";

  if (options.leadCaptured || userMessages.length >= 12) {
    stage = "close";
  } else if (hasDecidingSignals) {
    stage = "decision";
  } else if (hasComparisonSignals || allTypes.has("price_seeking") || allTypes.has("trust_seeking")) {
    stage = "consideration";
  } else if (questionTypes.length > 0 || userMessages.length >= 2) {
    stage = "discovery";
  }
  // else: greeting (first 1-2 messages with no real question)

  // --- Temperature derivation ---
  let temperature: LeadTemperature = "browsing";

  if (allTypes.has("emergency") || allTypes.has("scheduling")) {
    temperature = "hot";
  } else if (topicProgression === "deciding") {
    temperature = "hot";
  } else if (topicProgression === "comparing") {
    temperature = "warm";
  } else if (
    questionBreadth >= 2 ||
    (questionBreadth >= 1 && userMessages.length >= 4) ||
    userMessages.length >= 5
  ) {
    temperature = "warm";
  }

  return {
    questionTypes,
    latestQuestionType,
    topicProgression,
    stage,
    situation,
    engagement,
    captureSignals,
    temperature,
  };
}
