-- 054: Add custom greeting message to chatbot_config
-- Contractors can personalize Riley's opening message.
-- NULL = use default greeting.

ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS greeting_message text;
