// Post-processor for Riley responses — deterministic enforcement of rules
// that the LLM sometimes ignores despite explicit prompt instructions.
// Runs on the full response text BEFORE it reaches the homeowner.
// Zero API cost — pure string logic.

// ── Filler phrases (banned everywhere) ──────────────────────────────────────
// Each pattern matches the filler phrase + rest of that sentence (up to .!? or —).
// This prevents fragments like "That concern." when stripping "I totally understand".
const FILLER_PATTERNS: RegExp[] = [
  /^I'd love to help get you\b[^.!?—]*[.!?—]?\s*/i,
  /^I'd love to help\b[^.!?—]*[.!?—]?\s*/i,
  /^Great question\b[^.!?—]*[.!?—]?\s*/i,
  /^I totally get that\b[^.!?—]*[.!?—]?\s*/i,
  /^I totally understand\b[^.!?—]*[.!?—]?\s*/i,
  /^I hear you\b[^.!?—]*[.!?—]?\s*/i,
  /^I completely understand\b[^.!?—]*[.!?—]?\s*/i,
  /^Here's the thing\b[^.!?—]*[.!?—]?\s*/i,
  /^Here's the good news\b[^.!?—]*[.!?—]?\s*/i,
  /^That's a great point\b[^.!?—]*[.!?—]?\s*/i,
  /^That's a really good question\b[^.!?—]*[.!?—]?\s*/i,
  /^I appreciate you asking\b[^.!?—]*[.!?—]?\s*/i,
];

// ── Credential types (each match = 1 credential) ───────────────────────────
const CREDENTIAL_TYPES: { name: string; pattern: RegExp }[] = [
  { name: "google_rating", pattern: /\d+\.?\d*\s*(?:rating|stars?)\s*(?:on\s+)?Google|Google\s*(?:rating|stars?|reviews?)|on\s+Google/i },
  { name: "gaf", pattern: /GAF/i },
  { name: "owens_corning", pattern: /Owens\s*Corning/i },
  { name: "certainteed", pattern: /CertainTeed/i },
  { name: "bbb", pattern: /BBB/i },
  { name: "years_business", pattern: /\d+\s*years?\s*(?:in\s+business|of\s+experience)|in\s+business\s+(?:for\s+)?(?:over\s+)?\d+/i },
  { name: "warranty", pattern: /\d+-year\s*(?:workmanship\s+)?warranty|workmanship\s+warranty/i },
  { name: "insured", pattern: /fully\s+insured/i },
  { name: "licensed", pattern: /state[\s-]licensed|licensed\s+contractor/i },
];

// ── Insurance banned terms ──────────────────────────────────────────────────
const INSURANCE_BANNED: RegExp[] = [
  /in the meantime/i,
  /adjuster/i,
  /claims?\s+process/i,
  /deductible/i,
  /coverage\s+(?:amount|detail)/i,
  /file\s+a\s+claim/i,
  /your\s+insurance\s+(?:will|should|might|can|could)/i,
];

const MAX_CREDENTIALS = 2;

// ── Lead capture push phrases (banned in early stages) ─────────────────────
const LEAD_PUSH_PATTERNS: RegExp[] = [
  /let me pull up a (?:quick )?form/i,
  /want me to have .+ (?:follow up|reach out|get in touch)/i,
  /let me (?:connect|get) you (?:with|to) the team/i,
  /have (?:them|the team) reach out/i,
  /pull up a form so they can/i,
  /set (?:that|this) up for you/i,
];

export interface PostProcessOptions {
  isInsuranceQuery?: boolean;
  insuranceCannedResponse?: string;
  /** Current conversation stage — used to block lead capture push in early stages */
  stage?: string;
}

/**
 * Post-process Riley's response before sending to homeowner.
 * Order matters: insurance guard → filler strip → credential cap.
 */
export function postProcessRileyResponse(
  text: string,
  options: PostProcessOptions = {},
): string {
  if (!text || text.trim().length === 0) return text;

  let result = text;

  // 1. Insurance guard — hard-replace if banned terms found
  if (options.isInsuranceQuery && options.insuranceCannedResponse) {
    const hasBanned = INSURANCE_BANNED.some((p) => p.test(result));
    if (hasBanned) {
      result =
        options.insuranceCannedResponse +
        " Let me pull up a quick form so they can reach out to you about scheduling that inspection.";
    }
  }

  // 2. Strip lead capture push in greeting/discovery stages
  if (options.stage === "greeting" || options.stage === "discovery") {
    result = stripLeadPush(result);
  }

  // 3. Strip filler phrases from start of response
  result = stripFillers(result);

  // 4. Cap credentials at 2 per response
  result = capCredentials(result);

  return result.trim();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripLeadPush(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text;
  // Drop any sentence that matches a lead capture push pattern
  const kept = sentences.filter(
    (s) => !LEAD_PUSH_PATTERNS.some((p) => p.test(s))
  );
  if (kept.length > 0) return kept.join(" ");
  // All sentences were lead push — replace with neutral closer
  return "What else can I help you with?";
}

function stripFillers(text: string): string {
  let result = text;
  for (const pattern of FILLER_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, "");
      // Capitalize first char of remaining text
      if (result.length > 0) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
      }
      break; // Only one filler at the start
    }
  }
  return result;
}

function capCredentials(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text;

  const seenCredentials = new Set<string>();
  const kept: string[] = [];

  for (const sentence of sentences) {
    // Find which credential types appear in this sentence
    const credsHere = new Set<string>();
    for (const { name, pattern } of CREDENTIAL_TYPES) {
      if (pattern.test(sentence)) {
        credsHere.add(name);
      }
    }

    if (credsHere.size === 0) {
      // No credentials — always keep
      kept.push(sentence);
      continue;
    }

    // Would adding this sentence exceed the cap?
    const combined = new Set(
      Array.from(seenCredentials).concat(Array.from(credsHere)),
    );
    if (combined.size <= MAX_CREDENTIALS) {
      kept.push(sentence);
      credsHere.forEach((c) => seenCredentials.add(c));
    }
    // else: drop the sentence (exceeds credential cap)
  }

  return kept.join(" ");
}

function splitSentences(text: string): string[] {
  // Split on .!? followed by whitespace. Preserves punctuation on each sentence.
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
