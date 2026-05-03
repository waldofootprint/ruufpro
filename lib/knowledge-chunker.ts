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
export function isLikelyJunkPage(markdown: string, sourceUrl?: string): boolean {
  const t = markdown.trim().toLowerCase();
  if (t.length < 100) return true;
  if (t.includes("404") && t.length < 500) return true;
  if (t.includes("page not found") && t.length < 500) return true;
  if (t.startsWith("thank you for your submission") && t.length < 800) return true;
  // Junk URL patterns — blog/tag/category archives, feeds, date archives, CMS guts.
  // Riley should never train on blog content (per 2026-05-03 hallucination audit).
  if (sourceUrl) {
    const junkUrlPatterns = [
      /\/(tag|tags|category|categories|author|archive|archives)\//i,
      /\/(blog|news|articles?|posts?)(\/|$)/i,
      /\/(feed|rss|sitemap)(\/|\.xml|$)/i,
      /\/wp-(content|admin|json|includes)\//i,
      /\/\d{4}\/\d{1,2}(\/|$)/, // date archives /2024/06/
      /\/page\/\d+/i,           // pagination /page/2/
      /\?s=|\?p=\d+/i,           // search/post-id query strings
    ];
    if (junkUrlPatterns.some((p) => p.test(sourceUrl))) return true;
  }
  return false;
}

// Post-chunk filter: drops chunks that are nav/footer/cookie-banner/link-soup
// even when the surrounding page is real. Empirical from session-8 Q&A: cookie
// boilerplate, "skip to content" nav, image-filename URL soup, and pure cart
// links repeatedly outranked real content at sim 0.40-0.50.
export function isLikelyJunkChunk(text: string): boolean {
  const t = text.trim();
  if (t.length < 80) return true;

  const lower = t.toLowerCase();

  // Cookie-banner boilerplate.
  if (
    lower.includes("receive-cookie-deprecation") ||
    /cookie[^.]{0,80}duration[^.]{0,40}\d/.test(lower) ||
    (lower.includes("cookie") && lower.includes("consent") && t.length < 600)
  ) {
    return true;
  }

  // Pure navigation chunks.
  if (lower.includes("skip to content") && t.length < 400) return true;

  // Strip markdown links/images and ask: is there any real prose left?
  // [text](url) → text · ![alt](url) → "" · raw urls → ""
  const stripped = t
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1") // links → keep visible text
    .replace(/https?:\/\/\S+/g, " ") // bare urls
    .replace(/\s+/g, " ")
    .trim();
  // If <40% of original chars survive after stripping URLs/images, it was URL soup.
  if (stripped.length < t.length * 0.4) return true;
  // After stripping, must have enough real prose to be useful.
  if (stripped.length < 120) return true;

  // Image-filename garbage signature: "down-net_http20251016-160-e3gnfr-768x432.jpg"
  // Many hyphenated image-style tokens with no spaces.
  const imgFilenameMatches = t.match(/[a-z0-9]+[-_]\d{6,}[-_a-z0-9]*\.(jpg|jpeg|png|webp|gif)/gi);
  if (imgFilenameMatches && imgFilenameMatches.length >= 3) return true;

  return false;
}
