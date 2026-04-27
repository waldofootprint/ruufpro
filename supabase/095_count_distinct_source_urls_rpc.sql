-- Count distinct source URLs (= pages indexed) for a contractor.
-- Used by the RileyTab status banner.

CREATE OR REPLACE FUNCTION count_distinct_source_urls(p_contractor_id uuid)
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT source_url)::int
  FROM chatbot_knowledge_chunks
  WHERE contractor_id = p_contractor_id;
$$;

GRANT EXECUTE ON FUNCTION count_distinct_source_urls(uuid) TO service_role;
