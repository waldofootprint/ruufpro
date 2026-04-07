# Cold Email Outreach Workflow

**Trigger:** When asked to find prospects, generate emails, create mockups, or manage outreach campaigns for RuufPro contractor acquisition.

## Overview

This workflow covers the full cold email pipeline: finding roofing contractors, researching their online presence, generating personalized email sequences, creating site preview mockups, and tracking outreach status. Each step has a dedicated tool.

## Infrastructure (Set Up Once)

### Sending Domains
- `getruufpro.com` — hannah@ + hello@
- `joinruufpro.com` — hannah@ + hello@
- `ruufprohq.com` — hannah@ + hello@

### Stack
| Layer | Tool |
|-------|------|
| Domain registrar | Porkbun |
| Email provider | Google Workspace Starter ($7.20/mailbox) |
| Sending/warmup | Instantly Growth ($30/mo) |
| Lead sourcing | Apollo free tier + Google Maps + manual research |
| Email verification | Instantly built-in + NeverBounce as backup |
| Reputation monitoring | Google Postmaster Tools |

### DNS Records (Per Domain)
- **SPF:** `v=spf1 include:_spf.google.com ~all`
- **DKIM:** Generated in Google Workspace Admin → Apps → Gmail → Authenticate Email
- **DMARC:** `v=DMARC1; p=none; rua=mailto:hannah@getruufpro.com`

## The Pipeline

### Step 1: Find Prospects
**Tool:** `tools/find_prospects.py`

Finds roofing contractors in a target metro area and enriches with:
- Business name, owner name (if findable), phone, email
- Whether they have a website (and quality assessment)
- Google review count and rating
- A personalized observation for the cold email first line

**Input:** City or metro area name, radius, number of results
**Output:** CSV file in `.tmp/prospects/` with all fields populated

**How to run:**
```bash
python tools/find_prospects.py --metro "Dallas-Fort Worth" --limit 100
```

### Step 2: Enrich Prospects (Email + Owner Name)
**Tool:** `tools/enrich_prospects.py`

Takes the CSV from Step 1 and calls Apollo People Enrichment API to fill in owner names and email addresses. Free tier = 50 credits/month (1 credit per lookup).

**Input:** Prospect CSV from Step 1
**Output:** Enriched CSV in `.tmp/prospects/` with `_enriched_` suffix

**How to run:**
```bash
# Always dry-run first to check credit usage
python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv --dry-run

# Enrich all prospects
python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv

# Enrich only first 10 (to test)
python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv --limit 10

# Skip rows that already have an email
python tools/enrich_prospects.py --csv .tmp/prospects/dallas_tx_20260407.csv --skip-has-email
```

**Credit management:** Free tier = 50/month. Start with `--limit 10` to test hit rate before burning credits on the full list. If hit rate is low (<30%), consider AnyMailFinder as a supplement.

### Step 3: Generate Site Preview Mockups
**Tool:** `tools/generate-site-preview.mjs`

Creates a personalized screenshot of what the contractor's RuufPro website would look like using one of our 3 templates (Modern Clean, Chalkboard, or Blueprint).

**Input:** Business name, phone number, city, tagline (optional), template choice (optional)
**Output:** Screenshot PNG in `.tmp/mockups/`

**How to run:**
```bash
python tools/generate_site_preview.py --name "Joe's Roofing" --phone "(214) 555-0123" --city "Dallas" --template chalkboard
```

**When to use:** Generate mockups for your top 50 highest-priority prospects. These go in Email 2 of the sequence. This is the highest-converting email in the sequence — worth the extra effort.

### Step 4: Generate Email Sequences
**Tool:** `tools/generate_email_sequence.py`

Creates a personalized 5-email sequence for each prospect using proven frameworks:

| Email | Framework | Angle |
|-------|-----------|-------|
| 1 | PAS (Problem-Agitate-Solution) | "I searched for roofers in {{city}} and {{company}} doesn't show up" |
| 2 | Screenshot/Mockup | "I mocked up what a site could look like for {{company}}" |
| 3 | Before-After-Bridge | Social proof from another contractor |
| 4 | Observation | Reference their Google listing, reviews, or Facebook page |
| 5 | Breakup | "Won't reach out again, but the offer stands" |

**Input:** Prospect CSV from Step 1 (or individual prospect data)
**Output:** CSV/JSON of email sequences ready for Instantly import, saved to `.tmp/sequences/`

**How to run:**
```bash
python tools/generate_email_sequence.py --prospects .tmp/prospects/dfw_roofers.csv --output .tmp/sequences/dfw_batch_1.csv
```

### Step 5: Track Outreach
**Tool:** `tools/track_outreach.py`

Logs prospect status, tracks which emails have been sent, records replies and outcomes.

**Input:** Prospect ID + status update
**Output:** Updated tracking CSV in `.tmp/outreach/`

**How to run:**
```bash
python tools/track_outreach.py --update "joes-roofing" --status "replied-interested"
```

**Statuses:** `queued`, `warmup`, `sending`, `replied-interested`, `replied-not-now`, `replied-unsubscribe`, `converted-free`, `converted-paid`, `no-response`, `bounced`

## Email Rules (Non-Negotiable)

1. **Plain text only.** No HTML, no images, no logos, no signatures.
2. **75-100 words max.** Contractors read on their phones between jobs.
3. **One CTA per email.** Always framed as a question.
4. **No links in Email 1.** Max 1 link in follow-ups.
5. **Subject lines:** Lowercase, 1-5 words, no punctuation. Best performers: `{{company_name}}`, `quick question`, `saw your Google listing`.
6. **Send from "Hannah Waldo" or "Hannah from RuufPro"** — never "RuufPro Team."
7. **Never say "free" in subject line** (spam trigger). Say it in the body instead.
8. **Lead with the free website, NOT the $99/mo widget.** The widget pitch comes after they're a user.
9. **Each follow-up adds a new angle** — never just "bumping this up."
10. **All follow-ups reply to the original thread** (same email chain).

## Send Timing

| Window | Why |
|--------|-----|
| Tue-Thu, 6:00-7:00 AM Central | Before they head to job sites |
| Tue-Thu, 7:30-9:00 PM Central | After dinner, doing admin — highest reply rate |
| Saturday, 7:00-9:00 AM Central | Many roofers work Saturdays |
| **Avoid** | 10AM-5PM weekdays, Friday after 2PM, Sunday |

## Volume Limits

- **Per mailbox:** Max 30-50 emails/day (real sends + warmup combined)
- **Ramp schedule:** 5/day week 1 → 15/day week 2 → 30/day week 3+
- **Keep warmup running** even after starting real sends (~10 warmup emails/day ongoing)
- **Bounce rate must stay under 3%.** Verify every email before sending.
- **Spam complaint rate must stay under 0.1%.** If it spikes, pause sends immediately.

## Customer Segments (Priority Order)

1. **New roofers (1-3 years, no website)** — Easiest sell. They need everything. Lead with free website.
2. **Established small roofers (bad/outdated website)** — Show them what a better site looks like (mockup email).
3. **Google-filter-aware roofers** — They know about the Online Estimates filter. Lead with widget ($99 vs Roofle's $350).
4. **Marketing agencies** — White-label pitch. Different copy, different sequence. Do NOT mix with roofer campaigns.
5. **Roofing material suppliers** — Distribution partnership. Different copy. Do NOT mix with roofer campaigns.

**Start with segments 1 and 2 only.** Refine messaging before expanding.

## Deliverability Checklist

- [ ] SPF, DKIM, DMARC configured for all 3 domains
- [ ] Custom tracking domain set up in Instantly (e.g., `track.getruufpro.com`)
- [ ] Google Postmaster Tools monitoring all 3 domains
- [ ] All prospect emails verified before sending
- [ ] Unsubscribe link in every email (Instantly handles this)
- [ ] Physical mailing address included (PO Box or virtual office)
- [ ] No URL shorteners (bit.ly etc.)
- [ ] No image attachments in any email

## Realistic Projections (DFW Launch)

- 200 emails/week (conservative with 6 mailboxes)
- 50% open rate → 100 opens
- 10% reply rate → 20 replies/week
- 50% positive → 10 interested/week
- 50% convert to free site → 5 new free sites/week
- 20-30% of free users convert to $99/mo widget over time
- **Month 1 target: ~20 free sites, 4-6 paying customers ($400-600 MRR)**

## Error Handling

- **High bounce rate (>3%):** Stop sending immediately. Review email list quality. Run all remaining emails through NeverBounce before resuming.
- **Spam complaints spike (>0.1%):** Pause all sends. Review email copy for spam triggers. Check if emails are landing in spam (send test to a personal Gmail). May need to adjust content or slow down volume.
- **Domain blacklisted:** Check MXToolbox. If blacklisted, stop using that domain. Switch sends to remaining domains. Apply for delisting. This is why we have 3 domains — redundancy.
- **Low open rates (<30%):** Subject line problem. A/B test new subjects on next batch.
- **Low reply rates (<3%):** Email body problem. Test different frameworks, different personalization, different CTAs.
- **Instantly account issues:** Contact Instantly support. Keep a backup of all prospect data and sequences locally in `.tmp/`.
