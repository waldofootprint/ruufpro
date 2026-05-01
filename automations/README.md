# RuufPro Automations Registry

Single source of truth for every recurring job in the system. Hannah asks "what's running?" → Claude reads this file. Updated whenever an automation is added, changed, or removed.

**Conventions:**
- All cron times are **UTC** (Vercel default).
- ET column is approximate (handles DST poorly — UTC is the truth).
- Status: 🟢 active · 🟡 deployed but not validated end-to-end · 🔴 disabled

---

## Vercel Cron Jobs

Defined in [`vercel.json`](../vercel.json) under `"crons"`. Each one hits an internal API route guarded by `CRON_SECRET`.

| # | UTC | ET (approx) | Path | Purpose | Status | Owner module |
|---|-----|-------------|------|---------|--------|---|
| 1 | 06:30 | 02:30 AM | `/api/cron/ingest-iem-lsr` | Pull last 7d FL storm reports from Iowa Mesonet → `storm_events`. Idempotent on `event_id`. | 🟡 | Property Pipeline |
| 2 | 08:00 | 04:00 AM | `/api/cron/chat-cleanup` | Trim stale chat sessions / Riley conversation noise. | 🟢 | Riley |
| 3 | 09:00 | 05:00 AM | `/api/cron/scrape-cleanup` | Mark expired scrape previews consumed; delete empty pending batches >2hr old. | 🟢 | Outreach pipeline |
| 4 | 10:00 | 06:00 AM | `/api/cron/expire-trials` | Move 14-day trial accounts past expiry into expired state. | 🟢 | Billing |
| 5 | 11:00 | 07:00 AM | `/api/cron/morning-summary` | Daily morning digest email to Hannah. | 🟢 | Internal ops |
| 6 | 12:00 | 08:00 AM | `/api/cron/daily-digest` | Customer-facing daily activity digest. | 🟢 | Customer comms |
| 7 | 13:00 | 09:00 AM | `/api/cron/check-10dlc-status` | Poll Twilio 10DLC brand/campaign approval state per contractor. | 🟢 | SMS / 10DLC |
| 8 | 14:00 | 10:00 AM | `/api/cron/review-followups` | Send review-request follow-up emails per contractor's review automation rules. | 🟢 | Review automation |
| 9 | 15:00 | 11:00 AM | `/api/email/onboarding` | Onboarding drip sequence next-step email. | 🟢 | Onboarding |

---

## Backfill / one-shot scripts

Not on cron — run manually when needed.

| Script | Purpose | When to run |
|---|---|---|
| `tools/ingest-iem-lsr.mjs --backfill 5` | 5-year FL storm event backfill | Once at PP statewide-expansion launch (done 2026-05-01: 18,238 events) |
| `tools/dryrun-pp-signals.mjs` | Print sample of candidates with computed tags | When eyeballing tag logic changes |
| `tools/run-migration-mgmt.mjs <sql>` | Apply a SQL migration via Management API | Every new `supabase/NNN_*.sql` file |

---

## How to add a new automation

1. Build the cron route at `app/api/cron/<name>/route.ts` with the `CRON_SECRET` bearer guard (copy `app/api/cron/scrape-cleanup/route.ts` as a template).
2. Add the schedule to `vercel.json` `"crons"`. **UTC times.** Don't double-book a slot — see table above for what's taken.
3. Add a row to this file in the table above.
4. Deploy: `vercel --prod --force` then alias.

---

## How Claude reports status to Hannah

When Hannah asks "what daily automations are running?" or similar:
1. Read this file.
2. Summarize the table — group by status, flag anything 🟡 or 🔴.
3. Don't claim something is running just because it's listed — if status is 🟡, say "deployed, not yet validated end-to-end."

---

_Last verified: 2026-05-01_
