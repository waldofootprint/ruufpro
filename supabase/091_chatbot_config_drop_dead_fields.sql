-- 091: drop dead chatbot_config fields.
-- typical_timeline_days + financing_terms were added in 049 but never wired:
--   - never exposed in app/dashboard/settings/tabs/RileyTab.tsx (roofer can't input)
--   - never referenced in lib/chat-system-prompt.ts (Riley never sees them)
--   - timeline guard in lib/riley-post-process.ts strips any specific timeline
--     anyway (Air Canada precedent)
-- Confirmed zero references via grep across .ts/.tsx/.sql/.js/.mjs.

ALTER TABLE chatbot_config DROP COLUMN IF EXISTS typical_timeline_days;
ALTER TABLE chatbot_config DROP COLUMN IF EXISTS financing_terms;
