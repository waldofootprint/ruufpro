# Outreach Pipeline Deep Audit — Apr 14, 2026

> Pre-launch audit. Emails go out Apr 16. Every finding prioritized by blast radius.

## Severity Guide
- **CRITICAL** — Blocks launch. Must fix before Apr 16.
- **HIGH** — Day-1 failure risk. Fix within 24 hours of launch.
- **MEDIUM** — Causes friction. Fix within first week.
- **LOW** — Nice to have. Fix when convenient.

---

## 1. CRITICAL — Blocks Launch

### C1: ALL /api/ops/* routes have ZERO server-side auth
**What:** Every API route in `/api/ops/` (scrape, enrich, build-sites, pipeline, gates, send-emails, submit-forms, detect-forms, draft-reply, advance) relies on "Auth is handled by the /ops layout (admin email check)." But the layout is a **client-side React component** — it only guards the UI, not the API. Anyone with the URL can POST to `/api/ops/scrape` and burn through your Google API credits, or POST to `/api/ops/send-emails` and send cold emails to anyone.
**Why it matters:** A bot, a competitor, or a script kiddie can scrape 10,000 leads, send unlimited emails, or delete pipeline data. This is a $0-to-$10K damage vector.
**Fix:** Add server-side auth check to every `/api/ops/*` route. Check the session cookie via `createAuthSupabase()`, verify the user's email is in ADMIN_EMAILS, return 401 if not.
**Effort:** 1-2 hours.

### C2: /api/replies/inbound has NO webhook verification
**What:** The Instantly webhook endpoint (`/api/replies/inbound`) accepts any POST body with no signature verification, no shared secret, no IP allowlist. Anyone can send fake replies that get stored in your database, pushed to Slack, and alter pipeline state.
**Why it matters:** Fake replies can mark real prospects as "unsubscribed" (removing them from your pipeline), inject spam into Slack, or create fake "interested" leads.
**Fix:** Add webhook signature verification (Instantly supports HMAC) or at minimum a shared secret header check (`X-Webhook-Secret`).
**Effort:** 30 minutes.

### C3: /api/replies/form-inbound has NO webhook verification
**What:** Same issue as C2 but for the Resend inbound webhook. No signature check.
**Fix:** Resend sends a `svix-signature` header. Verify it.
**Effort:** 30 minutes.

### C4: Claim page says "already claimed" for ALL prospect sites
**What:** The claim page checks `if (contractor.user_id)` — but the scrape endpoint sets `user_id` to Hannah's admin user ID on every contractor record (line 179 of scrape/route.ts: `user_id: userId`). So every prospect contractor already has a user_id, meaning the claim page shows "This site has already been claimed" for every prospect. **The entire claim flow is broken.**
**Why it matters:** This is the conversion funnel. Roofer clicks claim link → sees "already claimed" → leaves. Zero conversions possible.
**Fix:** Prospect contractors should NOT have a real user_id. Use a dedicated `prospect_owner_id` or set `user_id` to null for prospects. The claim API then sets the real user_id on claim.
**Effort:** 1-2 hours (scrape route + build-sites route + migration to null out existing prospect user_ids).

### C5: INSTANTLY_DEFAULT_CAMPAIGN_ID not set
**What:** The dashboard says this env var needs to be set in Vercel. Without it, approve-and-send marks email leads as `outreach_approved` but doesn't actually send them. The `emailed = -1` signal is returned.
**Why it matters:** You click "Approve & Send" thinking emails went out. They didn't. Leads sit at outreach_approved forever.
**Fix:** Hannah: create the Instantly campaign, grab the campaign ID, add to Vercel env vars.
**Effort:** 15 minutes (Hannah manual step).

### C6: Resend inbound webhook not configured
**What:** `/api/replies/form-inbound` exists in code but Resend MX records for `forms@getruufpro.com` haven't been set up. Form replies have nowhere to go.
**Why it matters:** Roofers who reply to contact form outreach get no response. You lose warm leads.
**Fix:** Hannah: set up MX → Resend, create inbound webhook pointing to `https://ruufpro.com/api/replies/form-inbound`.
**Effort:** 20 minutes (Hannah manual step).

### C7: Enrich endpoint doesn't advance stage for no-email leads
**What:** When Apollo returns no email match (line 98-101 of enrich/route.ts), the lead stays at `scraped` stage with only `enriched_at` set. But build-sites picks up leads at `scraped` OR `enriched` stage. A lead with no email that's been through Apollo will get a site built, but will be stuck at outreach_approval with no way to send — no email AND possibly no form.
**Why it matters:** These leads clog the outreach approval gate. Hannah has to manually reject each one.
**Fix:** When Apollo returns no email, set stage to `enriched` (so it's clear it was processed). In outreach approval, show clear indicator "No email — form only" or auto-skip.
**Effort:** 30 minutes.

---

## 2. HIGH — Day-1 Failure Risk

### H1: Double-click protection missing on ALL batch operations
**What:** If Hannah clicks "Build Sites", "Enrich Photos", or "Scrape More" twice, the second request processes the same leads again. Build-sites has a `preview_site_url IS NULL` guard, but scrape does not prevent duplicate contractors (only checks within the same batch). Enrich-photos has a `photos_enriched_at IS NULL` guard (good). But enrich (Apollo) has no guard — clicking twice burns 50 more credits.
**Why it matters:** Wasted API credits ($), duplicate records, orphaned contractors.
**Fix:** 
- UI: Disable buttons on click (already done for most — good).
- API: Add idempotency checks. Enrich should check `enriched_at IS NOT NULL` before calling Apollo.
- Scrape: Check duplicates across ALL batches, not just the current batch.
**Effort:** 1 hour.

### H2: Scrape creates duplicate contractors across batches
**What:** Dedup check only looks within the current batch (line 161-167). If Tampa roofer "ABC Roofing" was scraped in Batch 1, scraping Tampa again in Batch 2 creates a second contractor record + second pipeline entry.
**Why it matters:** Same roofer gets multiple emails. Looks spammy. CAN-SPAM risk.
**Fix:** Check dedup across ALL prospect_pipeline records, not just the current batch.
**Effort:** 30 minutes.

### H3: Build-sites creates contractor records even when scrape already did
**What:** Scrape creates a contractor + pipeline entry. Build-sites then checks `prospect.contractor_id` and if it exists, updates it. But if it doesn't exist (which shouldn't happen after scrape), it creates a NEW contractor. This dual-creation path is a recipe for orphaned records.
**Why it matters:** Data integrity. Orphaned contractors with no pipeline entries.
**Fix:** Build-sites should ALWAYS expect contractor_id to exist (scrape creates it). If it doesn't, log error and skip, don't create a new one.
**Effort:** 20 minutes.

### H4: Pipeline GET fetches ALL pipeline entries with no pagination
**What:** `pipeline/route.ts` line 28: `supabase.from("prospect_pipeline").select("batch_id, stage")` — no limit. At 500 leads/week, after 4 weeks that's 2,000 rows loaded on every dashboard refresh (every 60 seconds).
**Why it matters:** Slow dashboard, high Supabase bandwidth, potential timeouts.
**Fix:** Filter to only active batches' leads, or aggregate stage counts at the DB level using a Supabase function.
**Effort:** 30 minutes.

### H5: Scrape timeout risk for large batches
**What:** Scraping 100 leads makes ~200 Google API calls, each with network latency + 2s delay for page tokens. That's potentially 400+ seconds. Vercel serverless functions have a 60-second timeout (Hobby) or 300-second (Pro).
**Why it matters:** Scraping 50+ leads will timeout and partially complete with no error recovery. Some leads scraped, some not, batch count wrong.
**Fix:** Cap scrape at 25 per request. For larger batches, split into multiple calls from the dashboard (or use Inngest for background processing).
**Effort:** 30 minutes for cap + UI messaging. Inngest solution: 2 hours.

### H6: Email templates contain placeholder links
**What:** Reply templates in `lib/reply-ai.ts` contain `[CALENDAR_LINK]`, `[PREVIEW_LINK]`, `[LOOM_LINK]`, and `[ANSWER_PLACEHOLDER]`. These are sent to real prospects if Hannah doesn't edit the draft.
**Why it matters:** Sending "[CALENDAR_LINK]" to a real roofer makes you look unprofessional and automated.
**Fix:** Either replace placeholders with real URLs, or add a validation check that blocks sending if placeholders are detected.
**Effort:** 30 minutes.

### H7: No CAN-SPAM unsubscribe link in cold emails
**What:** The 15 email templates in `lib/outreach-templates.ts` have no unsubscribe link or physical address. CAN-SPAM requires both.
**Why it matters:** Legal liability. Instantly may handle this at send time (adding footer), but we should verify.
**Fix:** Verify that Instantly adds CAN-SPAM footer. If not, add to templates.
**Effort:** 15 minutes to verify, 30 minutes to add if needed.

### H8: Preview site URLs are relative paths, not full URLs
**What:** `preview_site_url` is stored as `/site/p-abc123` (relative). The email templates use `{preview_url}` which gets this relative path. Roofer receives email with `ruufpro.com` nowhere — just `/site/p-abc123`.
**Why it matters:** Broken links in emails. Roofer can't click to see their site.
**Fix:** Store as full URL (`https://ruufpro.com/site/p-abc123`) or prepend domain when generating email variables.
**Effort:** 15 minutes.

---

## 3. MEDIUM — Causes Friction

### M1: No individual prospect search/filter in dashboard
**What:** No search bar. No way to find a specific roofer by name, city, or email. Must expand batch → expand stage → scroll.
**Fix:** Add search input that filters across all batches.
**Effort:** 1 hour.

### M2: Button order doesn't enforce pipeline sequence
**What:** All 6 action buttons (Scrape More, Enrich Emails, Detect Forms, Photos, Build Sites) show on every batch regardless of state. Hannah could click "Build Sites" before photos are enriched.
**Fix:** Disable buttons that don't apply to current batch state. Show tooltip: "Enrich photos first."
**Effort:** 1 hour.

### M3: No error retry for failed enrichments
**What:** If enrich-photos fails for 5 leads (API error, invalid place_id), errors are returned in the response but there's no way to retry just those 5.
**Fix:** Add "Retry Failed" button that re-runs enrichment for leads where `photos_enriched_at IS NULL AND google_place_id IS NOT NULL`.
**Effort:** 30 minutes.

### M4: Form action result banner is shared across batches
**What:** `formActionResult` is a single string state. If Hannah runs enrich on Batch 1, then switches to Batch 2, Batch 2 shows Batch 1's result message.
**Fix:** Key the result to batch_id.
**Effort:** 15 minutes.

### M5: Gate items_pending count can desync
**What:** The gate's `items_pending` is set when the gate is created but not recalculated on each view. If a lead is manually advanced or a new lead enters the gate stage, the count is wrong.
**Fix:** Calculate items_pending dynamically from actual stage counts instead of storing it.
**Effort:** 30 minutes.

### M6: No monitoring for Inngest function failures
**What:** Form submissions and form detection run via Inngest. If they fail, the only signal is in the Inngest dashboard. No Slack alert, no ops dashboard indicator.
**Fix:** Add Inngest failure handler that posts to Slack `#ops-alerts`.
**Effort:** 30 minutes.

### M7: Channel filter pills don't actually filter pipeline totals
**What:** The channel filter pills (All/Email/Form) exist but only filter the lead table. The totals bar and batch stage counts show all channels regardless. The comment even says: `showing all channels`.
**Fix:** Apply channel filter to all views consistently, or remove the filter claim from totals.
**Effort:** 30 minutes.

### M8: SiteReviewPanel "Approve All" doesn't respect individual selections
**What:** The "Approve All" button calls `onApprove()` which triggers `handleGateApproval` with `approve_all` action — ignoring the per-card approved/rejected states. The "Reject Selected" button exists but has no onClick handler.
**Fix:** Wire up the approve/reject to use the per-card states. Send `approve_selected` with approved IDs and `reject_selected` with rejected IDs.
**Effort:** 45 minutes.

### M9: LeadRow component defined but never used
**What:** `LeadRow` component (line 1728) with expandable detail rows is defined but the `BatchLeadTable` doesn't use it — it renders its own inline rows. Dead code.
**Fix:** Either use LeadRow or remove it.
**Effort:** 10 minutes.

---

## 4. LOW — Nice to Have

### L1: No batch archiving/completion flow
**What:** Batches have a `status` field but there's no UI to mark a batch as "completed" or archive old ones.

### L2: Revenue page not wired to real data
**What:** `/ops/revenue` exists but likely shows placeholder data until prospects convert.

### L3: No export capability
**What:** No way to export lead data as CSV for analysis or backup.

### L4: Keyboard shortcuts for gate review
**What:** Reviewing 50 sites one-by-one is tedious. Arrow keys + A/R/S shortcuts would speed it up 10x.

### L5: Batch naming is "Week 16" format only
**What:** No custom batch names. When running multiple batches per week (which the unique constraint prevents anyway), naming is confusing.

---

## 5. OUTREACH MESSAGE QUALITY REVIEW

### Email Templates (lib/outreach-templates.ts)
- **no_website** (5 emails): Solid. Problem-led, conversational, good cadence. The "3 roofers in {city}" social proof email is strong. **Issue:** Email 3 references a "$14,000 reroof job" — this is fabricated social proof. Remove or replace with honest framing.
- **bad_website** (5 emails): Good angle. "62% of homeowners search on phone" stat is good. **Issue:** Email 4 says "It took 6 seconds to load" — this is a generic claim, not measured. Either measure actual load time per prospect or soften to "most sites like yours."
- **no_widget** (5 emails): Strong positioning vs Roofle. Price comparison is compelling. **Issue:** Email 1 says "Google added an 'Online Estimates' filter in December" — verify this is accurate and still current.

### Form Message (lib/outreach-templates.ts:233)
- Short, direct, has claim URL. Good for form length limits. No issues.

### Reply Templates (lib/reply-ai.ts)
- Well-categorized, natural tone. **Issues:** Placeholder links (see H6). The competitor comparison reply mentioning Roofle pricing ($350/mo + $2K setup) should be verified as current.

### Claim Page (app/claim/[slug])
- Clean, gift-first framing. **Issue:** Shows `{slug}.ruufpro.com →` as the preview URL but the actual URL is `ruufpro.com/site/{slug}` — misleading. Also, C4 makes this entire flow broken.

---

## 6. WHAT'S MISSING ENTIRELY

### Missing: Instantly webhook configuration
Instantly needs to be configured to send reply webhooks to `https://ruufpro.com/api/replies/inbound`. Without this, no cold email replies are captured.

### Missing: Trial reminder emails
Day 1 welcome, day 3 "set up widget", day 10 warning, day 13 last chance. These are tracked as TODO but not built. First claimed contractor gets zero follow-up.

### Missing: Email send tracking / bounce handling
No mechanism to track which emails bounced, which were opened, which links were clicked. Instantly provides this data but we're not pulling it.

### Missing: Rate limiting on outreach volume
No daily cap on emails sent or forms submitted. Could accidentally blast 500 prospects in one click.

### Missing: Prospect-level notes
No way for Hannah to add notes to individual prospects ("Called, left voicemail" or "Met at trade show").

### Missing: Undo/rollback capability
If Hannah accidentally approves all sites or sends all emails, there's no undo. Stage transitions are one-way.

---

## FIX PRIORITY ORDER

1. **C4** — Claim flow broken (blocks entire conversion funnel)
2. **C1** — API auth (security)
3. **C5** — INSTANTLY_DEFAULT_CAMPAIGN_ID (Hannah manual step)
4. **C6** — Resend inbound setup (Hannah manual step)
5. **C2/C3** — Webhook verification
6. **C7** — Enrich stage advancement
7. **H8** — Preview URLs need full domain
8. **H6** — Placeholder links in reply templates
9. **H7** — CAN-SPAM compliance check
10. **H1** — Double-click protection
11. **H2** — Cross-batch dedup
12. **H5** — Scrape timeout cap
13. **H3** — Remove dual contractor creation
14. **H4** — Pipeline pagination
15. **M8** — Wire up SiteReviewPanel selections

---

*Audit performed: Apr 14, 2026*
*Auditor: Claude (Session E)*
*Files reviewed: 25+ API routes, lib files, and UI components*
*Total findings: 7 CRITICAL, 8 HIGH, 9 MEDIUM, 5 LOW*
