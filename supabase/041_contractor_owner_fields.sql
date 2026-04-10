-- Add owner name fields to contractors table for 10DLC registration.
-- The registration API needs a real person's name (not the business name)
-- for the authorized representative in Twilio Trust Hub.

alter table contractors
  add column if not exists owner_first_name text,
  add column if not exists owner_last_name text;

-- Note: ein, address, zip, legal_entity_type already exist from migration 017.
