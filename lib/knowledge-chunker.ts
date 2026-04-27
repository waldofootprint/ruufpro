// Markdown → ~500-token chunks with 50-token overlap.
//
// Naive splitter: paragraphs first, pack greedily, then sentence-split any
// over-long paragraph. Token estimate = ceil(chars / 4) — close enough for
// chunking purposes and avoids pulling in tiktoken.

const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const MAX_CHARS_PER_CHUNK = TARGET_TOKENS * 4;
const OVERLAP_CHARS = OVERLAP_TOKENS * 4;
const MIN_CHARS_PER_CHUNK = 50 * 4;

export type Chunk = {
  text: string;
  index: number;
  estimatedTokens: number;
};

function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

function splitOversizedParagraph(p: string): string[] {
  // Split on sentence boundaries, then pack to MAX_CHARS_PER_CHUNK.
  const sentences = p.split(/(?<=[.!?])\s+(?=[A-Z])/);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length + 1 > MAX_CHARS_PER_CHUNK && buf.length > 0) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf = buf.length > 0 ? `${buf} ${s}` : s;
    }
  }
  if (buf.trim().length > 0) out.push(buf.trim());
  return out;
}

export function chunkMarkdown(markdown: string): Chunk[] {
  const trimmed = markdown.trim();
  if (trimmed.length < MIN_CHARS_PER_CHUNK) return [];

  // Split on blank lines (paragraph boundaries).
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Expand any paragraph that's already over-size.
  const units: string[] = [];
  for (const p of paragraphs) {
    if (p.length > MAX_CHARS_PER_CHUNK) {
      units.push(...splitOversizedParagraph(p));
    } else {
      units.push(p);
    }
  }

  // Greedy pack with overlap.
  const chunks: string[] = [];
  let current = "";
  for (const u of units) {
    const candidate = current.length > 0 ? `${current}\n\n${u}` : u;
    if (candidate.length > MAX_CHARS_PER_CHUNK && current.length > 0) {
      chunks.push(current);
      // Overlap: last OVERLAP_CHARS of previous chunk become preamble.
      const tail = current.slice(-OVERLAP_CHARS);
      current = `${tail}\n\n${u}`;
      if (current.length > MAX_CHARS_PER_CHUNK) {
        chunks.push(current);
        current = "";
      }
    } else {
      current = candidate;
    }
  }
  if (current.trim().length >= MIN_CHARS_PER_CHUNK) {
    chunks.push(current);
  }

  return chunks.map((text, index) => ({
    text: text.trim(),
    index,
    estimatedTokens: estimateTokens(text),
  }));
}

// Quick filter for obvious junk pages — applied before chunking to avoid
// embedding worthless content.
export function isLikelyJunkPage(markdown: string): boolean {
  const t = markdown.trim().toLowerCase();
  if (t.length < 100) return true;
  if (t.includes("404") && t.length < 500) return true;
  if (t.includes("page not found") && t.length < 500) return true;
  if (t.startsWith("thank you for your submission") && t.length < 800) return true;
  return false;
}
