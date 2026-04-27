-- Onboarding rebuild §7 — background full-site crawl + RAG
-- Adds pgvector + per-contractor knowledge chunks + crawl-job tracking.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chatbot_knowledge_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id   uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  source_url      text NOT NULL,
  page_title      text,
  chunk_index     int  NOT NULL,
  chunk_text      text NOT NULL,
  embedding       vector(1024),
  token_count     int,
  crawl_batch_id  uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chatbot_knowledge_chunks_contractor_idx
  ON chatbot_knowledge_chunks(contractor_id);

CREATE INDEX IF NOT EXISTS chatbot_knowledge_chunks_batch_idx
  ON chatbot_knowledge_chunks(contractor_id, crawl_batch_id);

CREATE INDEX IF NOT EXISTS chatbot_knowledge_chunks_embedding_idx
  ON chatbot_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE TABLE IF NOT EXISTS chatbot_knowledge_crawl_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id     uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  firecrawl_job_id  text NOT NULL UNIQUE,
  crawl_batch_id    uuid NOT NULL DEFAULT gen_random_uuid(),
  status            text NOT NULL CHECK (status IN ('queued','running','completed','failed')),
  pages_total       int,
  pages_completed   int DEFAULT 0,
  error_message     text,
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS chatbot_knowledge_crawl_jobs_contractor_idx
  ON chatbot_knowledge_crawl_jobs(contractor_id, started_at DESC);

ALTER TABLE chatbot_knowledge_chunks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge_crawl_jobs   ENABLE ROW LEVEL SECURITY;

-- Service role only; webhook + Inngest write via service key, chat reads via service key too.
-- No anon access (chunks may contain proprietary site content).
CREATE POLICY chatbot_knowledge_chunks_service_all
  ON chatbot_knowledge_chunks
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY chatbot_knowledge_crawl_jobs_service_all
  ON chatbot_knowledge_crawl_jobs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
