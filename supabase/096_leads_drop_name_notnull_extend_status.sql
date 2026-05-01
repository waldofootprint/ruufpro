-- Phase 1 shippable calculator (2026-05-01) — drop the contact-info gate on
-- the public estimate API. We now write a leads row for every estimate
-- request, even when the homeowner only supplied an address and never typed
-- a name or email. Two schema changes:
--
--   1. leads.name was `not null` since 001_initial_schema.sql, back when every
--      lead source required a name. Address-only lead writes need this nullable.
--      (leads.email has been nullable since 001 — no change required.)
--
--   2. leads_status_check (last extended in 036_kanban_dashboard.sql) gets a
--      new `address_only_followup` value to mark leads that came in without
--      contact info, so the roofer can sort/filter them separately from
--      regular `new` leads in the kanban dashboard.

alter table leads alter column name drop not null;

alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in (
    'new',
    'contacted',
    'appointment_set',
    'quoted',
    'won',
    'completed',
    'lost',
    'address_only_followup'
  ));
