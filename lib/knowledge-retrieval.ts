// RAG retrieval — query embedding → pgvector cosine similarity → top-K chunks.
//
// Used by the chat route to inject contractor-specific knowledge (excerpts
// from their website) into Riley's system prompt at query time.

import { createClient } from "@supabase/supabase-js";
import { embedTexts, toPgVectorLiteral } from "@/lib/voyage-embed";

const DEFAULT_K = 8;
// 2026-04-27 session 6: lowered 0.55 → 0.40. Empirical probe across 4
// real-roofer sites showed correct chunks consistently scoring 0.45–0.55
// with voyage-3-large on marketing-content vs question pairs. At 0.55,
// even the literal "Financing is available" chunk (sim 0.548) was filtered
// out. Per Hannah: prefer keeping marginal chunks over losing real answers.
const MIN_SIMILARITY = 0.40;
// 2026-05-03: a SECOND threshold for confidence. Chunks above 0.40 enter the
// prompt (so the model can use them as soft context), but if NO chunk crosses
// HIGH_CONFIDENCE, we flag the retrieval as WEAK and inject a hard prompt
// directive forcing the safe-deflect template.
//
// Threshold tuning (data from 2026-05-03 audit, voyage-3-large embeddings):
//   Fabricated answers had top sim ≈ 0.58 (Baker materials — chunks were generic
//   /about/ pages, model invented "asphalt + metal + tile")
//   Correct answers from real RAG had top sim ≥ 0.66 (Premium services 0.72,
//   Premium materials 0.67, Baker services 0.66, BlueCollar materials/services
//   similar). The "noise band" 0.55–0.60 catches semantic overlap on generic
//   roofing language without actual topical content. 0.60 separates them.
const HIGH_CONFIDENCE = 0.60;
const MAX_TOTAL_CHARS = 8000; // ~2000 tokens

export type RetrievedChunk = {
  chunkText: string;
  sourceUrl: string;
  pageTitle: string | null;
  similarity: number;
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  /** Highest similarity across all returned chunks (0 if none). */
  topSimilarity: number;
  /** True when at least one chunk crossed HIGH_CONFIDENCE. False = "weak retrieval". */
  hasHighConfidenceMatch: boolean;
};

export function isWeakRetrieval(result: RetrievalResult): boolean {
  return !result.hasHighConfidenceMatch;
}

export async function retrieveKnowledgeChunks(
  contractorId: string,
  question: string,
  k: number = DEFAULT_K,
): Promise<RetrievedChunk[]> {
  const result = await retrieveKnowledgeChunksWithMeta(contractorId, question, k);
  return result.chunks;
}

export async function retrieveKnowledgeChunksWithMeta(
  contractorId: string,
  question: string,
  k: number = DEFAULT_K,
): Promise<RetrievalResult> {
  const empty: RetrievalResult = { chunks: [], topSimilarity: 0, hasHighConfidenceMatch: false };
  if (!question || question.trim().length < 3) return empty;
  if (!process.env.VOYAGE_API_KEY) return empty;

  // Embed the question.
  const embedded = await embedTexts([question], "query");
  if (!embedded.ok || embedded.vectors.length === 0) return empty;
  const vec = embedded.vectors[0];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // pgvector cosine: smaller distance = more similar. Similarity = 1 - distance.
  // Use the rpc-less raw SQL via from().select() with order by embedding <=> vec.
  // Supabase JS doesn't natively support vector ordering; use rpc or REST query.
  // Cleaner: a SQL function. But to keep this self-contained, we use a
  // postgres function call we'll create lazily — fallback: use .rpc().
  // For now, do it via rpc and ship the function in a migration if missing.
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    p_contractor_id: contractorId,
    p_query_embedding: toPgVectorLiteral(vec),
    p_match_count: k,
  });

  if (error || !data) {
    if (error) console.warn("[knowledge-retrieval] rpc error:", error.message);
    return empty;
  }

  type Row = {
    chunk_text: string;
    source_url: string;
    page_title: string | null;
    similarity: number;
  };

  const rows = data as Row[];
  const topSimilarity = rows.length > 0 ? Math.max(...rows.map((r) => r.similarity)) : 0;
  const hasHighConfidenceMatch = rows.some((r) => r.similarity >= HIGH_CONFIDENCE);
  const filtered = rows.filter((r) => r.similarity >= MIN_SIMILARITY);

  // Token-budget cap.
  let budget = MAX_TOTAL_CHARS;
  const out: RetrievedChunk[] = [];
  for (const r of filtered) {
    if (budget - r.chunk_text.length < 0) break;
    out.push({
      chunkText: r.chunk_text,
      sourceUrl: r.source_url,
      pageTitle: r.page_title,
      similarity: r.similarity,
    });
    budget -= r.chunk_text.length;
  }
  return { chunks: out, topSimilarity, hasHighConfidenceMatch };
}

export function formatChunksForPrompt(chunks: RetrievedChunk[], businessName: string): string {
  if (chunks.length === 0) return "";

  const lines = [
    `## Knowledge from ${businessName}'s website`,
    `The following excerpts come from the contractor's actual website. Use them to answer the homeowner's question with specifics. If a relevant excerpt is below, prefer its facts over generic answers. If an excerpt below conflicts with the structured fields above (services list, service area, location), the excerpt wins — it was scraped from the live site and is the source of truth. Do NOT fabricate details that aren't here.`,
    "",
  ];

  for (const c of chunks) {
    const titleLabel = c.pageTitle ? `${c.pageTitle} — ${c.sourceUrl}` : c.sourceUrl;
    lines.push(`[Page: ${titleLabel}]`);
    lines.push(c.chunkText);
    lines.push("");
  }

  return lines.join("\n");
}
