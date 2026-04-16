-- 048: AI Chatbot (Riley) for Pro+ contractor websites
-- Adds feature flag, conversation log, and extends lead source constraint.

-- 1. Feature flag on contractors
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS has_ai_chatbot boolean DEFAULT false;

-- 2. Conversation log table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  session_id    text NOT NULL UNIQUE,
  messages      jsonb NOT NULL DEFAULT '[]',
  lead_captured boolean DEFAULT false,
  lead_id       uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 3. Indexes for dashboard queries and session lookups
CREATE INDEX IF NOT EXISTS chat_conversations_contractor_idx
  ON chat_conversations(contractor_id, created_at DESC);

-- 4. RLS — contractors read own conversations; public can insert/update for chat widget
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can read own conversations"
  ON chat_conversations FOR SELECT
  USING (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can insert conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update conversations by session"
  ON chat_conversations FOR UPDATE
  USING (true);

-- 5. Extend leads.source to include ai_chatbot
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('contact_form', 'estimate_widget', 'external_widget', 'ai_chatbot'));
