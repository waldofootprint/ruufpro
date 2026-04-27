-- 092: chatbot_config additions for URL-crawl onboarding.
-- crawl_state holds per-field provenance: which fields were auto-filled,
-- from what source URL, with what confidence, the raw excerpt for audit, and whether
-- the roofer has manually edited the field (so re-crawls don't clobber human edits).
-- business_hours surfaced as a typed text field.
-- service_area_cities denormalized here so Riley's prompt builder doesn't need a
-- contractors join (contractors remains the source of truth — write to both on save).
--
-- crawl_state jsonb shape:
-- {
--   "fields": {
--     "owner_name":     { "source_url": "https://example.com/about", "confidence": "med",  "auto_filled": false, "manually_edited": false, "raw_excerpt": "Meet Mike, our owner..." },
--     "services":       { "source_url": "https://example.com/services", "confidence": "high", "auto_filled": true,  "manually_edited": false, "raw_excerpt": "..." }
--   },
--   "scrape_completed_at": "2026-04-27T...",
--   "scrape_pages_crawled": 4
-- }

ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS crawl_state          jsonb DEFAULT '{}'::jsonb;
ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS business_hours       text;
ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS service_area_cities  text[];
ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS source_website_url   text;
ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS last_crawled_at      timestamptz;
