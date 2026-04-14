-- 056: Drop public INSERT on chat_conversations
-- The chat API route uses service role key to insert/upsert conversations,
-- so public INSERT is not needed. Leaving it open lets anyone with the
-- anon key insert fake conversations into any contractor's account.

DROP POLICY IF EXISTS "Public can insert conversations" ON chat_conversations;
