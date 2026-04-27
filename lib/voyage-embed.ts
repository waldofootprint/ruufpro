// Voyage AI embeddings helper.
//
// Used by both the chunk-and-embed-page Inngest function (write path) and
// retrieveKnowledgeChunks (read path). Model: voyage-3-large, 1024 dims.
//
// Batches: Voyage allows up to 128 inputs per request. We cap at 64 to stay
// safely under per-token-per-request limits (~10K tokens).

const VOYAGE_BASE = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3-large";
const DIMS = 1024;
const MAX_BATCH = 64;

export type EmbedInputType = "document" | "query";

export type EmbedResult =
  | { ok: true; vectors: number[][]; tokenCount: number }
  | { ok: false; reason: string };

export async function embedTexts(
  texts: string[],
  inputType: EmbedInputType = "document",
): Promise<EmbedResult> {
  if (!process.env.VOYAGE_API_KEY) return { ok: false, reason: "missing_voyage_key" };
  if (texts.length === 0) return { ok: true, vectors: [], tokenCount: 0 };

  const allVectors: number[][] = [];
  let tokenCount = 0;

  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const res = await fetch(VOYAGE_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: batch,
        model: MODEL,
        input_type: inputType,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        reason: `voyage_http_${res.status}:${text.slice(0, 200)}`,
      };
    }

    const json = (await res.json().catch(() => null)) as
      | {
          data?: Array<{ embedding?: number[] }>;
          usage?: { total_tokens?: number };
        }
      | null;

    if (!json?.data || !Array.isArray(json.data)) {
      return { ok: false, reason: "voyage_bad_response" };
    }

    for (const row of json.data) {
      if (!row.embedding || row.embedding.length !== DIMS) {
        return { ok: false, reason: `voyage_bad_dims:${row.embedding?.length}` };
      }
      allVectors.push(row.embedding);
    }
    tokenCount += json.usage?.total_tokens ?? 0;
  }

  return { ok: true, vectors: allVectors, tokenCount };
}

// Format a vector for pgvector literal (e.g. "[0.1,0.2,...]").
export function toPgVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export const VOYAGE_DIMS = DIMS;
export const VOYAGE_MODEL = MODEL;
