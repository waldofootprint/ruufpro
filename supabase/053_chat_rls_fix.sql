-- 052: Tighten RLS on chat_conversations
-- Previously: public could UPDATE any row (USING true). Vulnerability: any Supabase
-- anon-key user could modify any conversation.
-- Fix: lead_captured update moved to server-side /api/notify (uses service role).
-- Public only needs INSERT (chat widget creates conversations via service role too,
-- but keeping INSERT for defense-in-depth).
-- UPDATE restricted to contractor owners only.

-- Drop old permissive UPDATE policy
DROP POLICY IF EXISTS "Public can update conversations by session" ON chat_conversations;

-- Contractors can update own conversations (e.g. dashboard use)
CREATE POLICY "Contractors can update own conversations"
  ON chat_conversations FOR UPDATE
  USING (contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  ));
