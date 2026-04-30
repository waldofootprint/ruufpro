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

// ── Robotic deflection phrases (banned everywhere) ────────────────────────
// Riley #16: Transparency Moments — catch scripted-sounding "I don't know" phrases
const ROBOTIC_DEFLECTION: { pattern: RegExp; replacement: string }[] = [
  { pattern: /would know best/gi, replacement: "would be the right ones to ask" },
  { pattern: /I'm just an AI/gi, replacement: "that's outside what I have info on" },
  { pattern: /I'm only an AI/gi, replacement: "that's beyond what I can pull up" },
  { pattern: /as an AI,? I (?:can't|cannot|don't|do not) [^.!?]*/gi, replacement: "I don't have the details on that, but the team can help" },
  // Permission-asking lead-form offers: "you can (also) let me pull up..." → "want me to pull up..."
  { pattern: /you can (?:also )?let me pull up a (?:quick )?form(?:\s+(?:for you|so [^.!?]*))?/gi, replacement: "want me to pull up a quick form for you" },
  { pattern: /(?:if you'?d (?:like|prefer),?\s+)?you can (?:also )?let me\b/gi, replacement: "want me to" },
];

// ── Projected skepticism (banned everywhere) ─────────────────────────────────
// Riley #15: Proactive Skepticism Handling — never project emotions about accuracy.
// Catch "I know you might be worried/uncertain/skeptical" and replace with factual framing.
const PROJECTED_SKEPTICISM: { pattern: RegExp; replacement: string }[] = [
  { pattern: /I know you might be (?:worried|uncertain|skeptical|concerned|wondering)[^.!?]*/gi, replacement: "This is a satellite-based ballpark — a free in-person inspection pins down the final cost" },
  { pattern: /you(?:'re| are) probably (?:wondering|thinking|worried|concerned|skeptical)[^.!?]*/gi, replacement: "This is a satellite-based ballpark to give you a starting point" },
  { pattern: /I understand (?:the|your|any) (?:uncertainty|skepticism|concern|hesitation)[^.!?]*/gi, replacement: "A free inspection pins down the final cost, no strings attached" },
  { pattern: /you might be (?:asking yourself|thinking|wondering)[^.!?]*/gi, replacement: "The estimate is satellite-based — a free inspection gets the final cost dialed in" },
];

// ── Timeline overpromise (banned everywhere) ──────────────────────────────
// Riley #21: specific timelines = binding-quote liability (Air Canada precedent).
// Catch numeric ranges, "few days/weeks", "a week or two" — replace with hedge.
// Sentence-level strip: if a sentence contains a concrete timeframe, drop the
// number clause and keep the factors language.
const TIMELINE_SPECIFIC: RegExp[] = [
  // Range: "2 to 5 days", "1-3 weeks", "a few days to a week", "few to several days"
  /(?:a\s+few|a\s+couple\s+of|several|\d+)\s*(?:days?|weeks?|months?)?\s*(?:to|up\s+to|[-–])\s*(?:a\s+few|a\s+couple\s+of|several|\d+)\s*(?:days?|weeks?|months?)/i,
  // "a day or two" / "a week or two" / "a month or two"
  /a\s+(?:day|week|month)\s+or\s+two/i,
  // "takes X days/weeks" / "take 3 days" / "takes a few days"
  /(?:takes?|take|taking|lasts?|lasting|run|runs|running)\s+(?:about\s+|around\s+|roughly\s+|typically\s+|usually\s+|only\s+)?(?:a\s+few|a\s+couple\s+of|several|\d+)\s*(?:days?|weeks?|months?)/i,
  // "usually/typically/most X days"
  /(?:usually|typically|most|generally|normally|often)\s+(?:a\s+few|a\s+couple\s+of|several|\d+)\s*(?:days?|weeks?|months?)/i,
  // Bare "in X days/weeks" / "within 3 days"
  /(?:in|within|over)\s+(?:a\s+few|a\s+couple\s+of|several|\d+)\s*(?:days?|weeks?|months?)/i,
];

const TIMELINE_HEDGE = "timing really depends on roof size, weather, and materials — a free inspection gets you a window specific to your roof";

// ── Estimate accuracy overpromise (banned everywhere) ──────────────────────
// The satellite estimate is a BALLPARK RANGE, never "exact" or "precise" numbers.
const ESTIMATE_OVERPROMISE: { pattern: RegExp; replacement: string }[] = [
  { pattern: /(?:an?\s+)?exact\s+numbers?/gi, replacement: "a ballpark estimate" },
  { pattern: /(?:an?\s+)?exact\s+estimate/gi, replacement: "a ballpark estimate" },
  { pattern: /(?:an?\s+)?precise\s+(?:numbers?|estimate|quote)/gi, replacement: "a ballpark estimate" },
  { pattern: /(?:an?\s+)?accurate\s+(?:numbers?|estimate|quote)/gi, replacement: "a ballpark estimate" },
  { pattern: /(?:an?\s+)?real\s+numbers?/gi, replacement: "a ballpark range" },
  { pattern: /(?:an?\s+)?solid\s+numbers?/gi, replacement: "a rough idea" },
  { pattern: /(?:an?\s+)?exact\s+(?:cost|price|pricing|quote)/gi, replacement: "a ballpark range" },
  // "numbers/estimate to compare" implies quote-equivalent — reframe as starting point
  { pattern: /(?:numbers?|estimate|pricing|figures?)\s+to\s+compare\b/gi, replacement: "a starting point" },
  { pattern: /compare\s+against\s+(?:other\s+)?quotes?\b/gi, replacement: "get a rough idea of cost" },
];

// ── ALL CAPS words (banned in responses to homeowners) ─────────────────────
const ALL_CAPS_WORD = /\b[A-Z]{2,}\b/g;
// Whitelist: abbreviations and acronyms that are legitimately uppercase
const CAPS_WHITELIST = new Set([
  "AI", "BBB", "GAF", "TPO", "EPDM", "LLC", "OK", "FL", "PM", "AM",
]);

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
  /** Current detected situation — emergencies override stage-based lead push blocking */
  situation?: string;
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
  //    Exception: emergencies should ALWAYS push to lead form regardless of stage
  if ((options.stage === "greeting" || options.stage === "discovery") && options.situation !== "emergency") {
    result = stripLeadPush(result);
  }

  // 3. Fix robotic deflection phrases
  result = fixRoboticDeflection(result);

  // 4. Strip projected skepticism (emotion-projecting accuracy disclaimers)
  result = fixProjectedSkepticism(result);

  // 5. Replace estimate overpromise language
  result = fixEstimateOverpromise(result);

  // 5b. Strip specific timeline claims (Riley #21)
  result = fixTimelineOverpromise(result);

  // 6. Fix ALL CAPS words (except whitelisted acronyms)
  result = fixAllCaps(result);

  // 7. Strip filler phrases from start of response
  result = stripFillers(result);

  // 8. Cap credentials at 2 per response
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

function fixRoboticDeflection(text: string): string {
  let result = text;
  for (const { pattern, replacement } of ROBOTIC_DEFLECTION) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function fixProjectedSkepticism(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PROJECTED_SKEPTICISM) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function fixEstimateOverpromise(text: string): string {
  let result = text;
  for (const { pattern, replacement } of ESTIMATE_OVERPROMISE) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function fixTimelineOverpromise(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text;

  let hedgeAdded = false;
  const kept: string[] = [];

  for (const sentence of sentences) {
    const hasLeak = TIMELINE_SPECIFIC.some((p) => p.test(sentence));
    if (!hasLeak) {
      kept.push(sentence);
      continue;
    }
    // Drop the offending sentence; inject hedge once per response
    if (!hedgeAdded) {
      kept.push(TIMELINE_HEDGE.charAt(0).toUpperCase() + TIMELINE_HEDGE.slice(1) + ".");
      hedgeAdded = true;
    }
  }

  return kept.join(" ");
}

function fixAllCaps(text: string): string {
  return text.replace(ALL_CAPS_WORD, (match) => {
    if (CAPS_WHITELIST.has(match)) return match;
    // Title-case the word instead
    return match.charAt(0) + match.slice(1).toLowerCase();
  });
}

function splitSentences(text: string): string[] {
  // Split on .!? followed by whitespace. Preserves punctuation on each sentence.
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
