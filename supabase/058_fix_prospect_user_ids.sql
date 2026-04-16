-- Fix C4: Prospect contractors should NOT have a user_id.
-- user_id is set when a roofer CLAIMS the site via /claim/[slug].
-- Scrape was incorrectly setting user_id to the admin account,
-- which made every claim page show "already claimed."
--
-- This nulls out user_id on all prospect contractors
-- (identified by placeholder email pattern).

UPDATE contractors
SET user_id = NULL
WHERE email LIKE 'prospect-%@placeholder.com'
  AND user_id IS NOT NULL;
