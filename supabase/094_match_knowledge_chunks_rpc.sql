-- pgvector cosine-similarity retrieval function.
-- Returns top-N chunks for a contractor with similarity = 1 - cosine_distance.

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  p_contractor_id   uuid,
  p_query_embedding vector(1024),
  p_match_count     int DEFAULT 3
)
RETURNS TABLE (
  chunk_text  text,
  source_url  text,
  page_title  text,
  similarity  float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.chunk_text,
    c.source_url,
    c.page_title,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM chatbot_knowledge_chunks c
  WHERE c.contractor_id = p_contractor_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

GRANT EXECUTE ON FUNCTION match_knowledge_chunks(uuid, vector, int) TO service_role;
