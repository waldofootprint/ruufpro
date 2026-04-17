// Post-processor for Riley responses — deterministic enforcement of rules
// that the LLM sometimes ignores despite explicit prompt instructions.
// Runs on the full response text BEFORE it reaches the homeowner.
// Zero API cost — pure string logic.

// ── Filler phrases (banned everywhere) ──────────────────────────────────────
const FILLER_PATTERNS: RegExp[] = [
  /^I'd love to help get you\b[^.!?]*[.!?]?\s*/i,
  /^I'd love to help\b[^.!?]*[.!?]?\s*/i,
  /^Great question!\s*/i,
  /^Absolutely!\s*/i,
  /^I totally get that[.!,]?\s*/i,
  /^I totally understand[.!,]?\s*/i,
  /^I hear you[.!,]?\s*/i,
  /^I completely understand[.!,]?\s*/i,
  /^Here's the thing[—:,.!]?\s*/i,
  /^Here's the good news[—:,.!]?\s*/i,
  /^That's a great point[.!,]?\s*/i,
  /^That's a really good question[.!,]?\s*/i,
  /^I appreciate you asking[.!,]?\s*/i,
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

export interface PostProcessOptions {
  isInsuranceQuery?: boolean;
  insuranceCannedResponse?: string;
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

  // 2. Strip filler phrases from start of response
  result = stripFillers(result);

  // 3. Cap credentials at 2 per response
  result = capCredentials(result);

  return result.trim();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Stream transform ────────────────────────────────────────────────────────
// Wraps the Vercel AI SDK UI message stream to post-process text content.
// Buffers all chunks, replaces text deltas with post-processed version,
// preserves tool call and finish protocol messages.

export function createPostProcessTransform(
  options: PostProcessOptions = {},
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new TransformStream({
    transform(chunk) {
      // Buffer everything — flush handles the processing
      buffer += decoder.decode(chunk, { stream: true });
    },
    flush(controller) {
      // Flush any remaining bytes from the decoder
      buffer += decoder.decode();

      const lines = buffer.split("\n");
      let collectedText = "";

      // First pass: extract all text from 0: lines
      for (const line of lines) {
        if (line.startsWith("0:")) {
          try {
            collectedText += JSON.parse(line.slice(2));
          } catch {
            // Malformed JSON — keep raw
            collectedText += line.slice(2);
          }
        }
      }

      // Post-process
      const processed = postProcessRileyResponse(collectedText, options);

      // Second pass: rebuild stream with processed text
      let textEmitted = false;
      for (const line of lines) {
        if (line.startsWith("0:")) {
          if (!textEmitted) {
            controller.enqueue(
              encoder.encode(`0:${JSON.stringify(processed)}\n`),
            );
            textEmitted = true;
          }
          // Skip subsequent 0: lines (merged into single processed chunk)
        } else if (line.length > 0) {
          controller.enqueue(encoder.encode(line + "\n"));
        }
      }

      // Edge case: text existed but no 0: lines were found
      if (!textEmitted && processed) {
        controller.enqueue(
          encoder.encode(`0:${JSON.stringify(processed)}\n`),
        );
      }
    },
  });
}
