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
const MAX_TOTAL_CHARS = 8000; // ~2000 tokens

export type RetrievedChunk = {
  chunkText: string;
  sourceUrl: string;
  pageTitle: string | null;
  similarity: number;
};

export async function retrieveKnowledgeChunks(
  contractorId: string,
  question: string,
  k: number = DEFAULT_K,
): Promise<RetrievedChunk[]> {
  if (!question || question.trim().length < 3) return [];
  if (!process.env.VOYAGE_API_KEY) return [];

  // Embed the question.
  const embedded = await embedTexts([question], "query");
  if (!embedded.ok || embedded.vectors.length === 0) return [];
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
    return [];
  }

  type Row = {
    chunk_text: string;
    source_url: string;
    page_title: string | null;
    similarity: number;
  };

  const rows = data as Row[];
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
  return out;
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
