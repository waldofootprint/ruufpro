# Riley Chatbot Data Audit — April 11, 2026

## What Was Built (Riley v1)
- Floating chat widget on all 6 contractor templates
- Claude Haiku streaming via Vercel AI SDK v6
- Lead capture flow (nudge at 3 messages, cap at 10)
- Conversation persistence in `chat_conversations` table
- Dashboard toggle on settings page (Pro+ gated)
- Rate limiting (20/IP/hr, 50/contractor/day)
- Theme-matched per template

## What Riley CAN Answer Today
- Services offered (from services array — names only)
- Service area (from service_area_cities)
- Licensed/insured/certifications (from trust signals)
- Financing available (yes/no only)
- Warranty (years only, no details)
- Customer reviews (top 3)
- Business hours
- About the business

## What Riley CANNOT Answer (the gaps)
1. "How much does a new roof cost?" — deflects every time
2. "Do you do free inspections?" — no data
3. "How long will it take?" — no data
4. "What shingles do you use?" — no data
5. "What's your process?" — no data
6. "Do you work with insurance?" — no data
7. "What financing terms?" — no data
8. "What does your warranty actually cover?" — no data
9. "Can you come today?" — no data
10. "Why should I pick you?" — no data

## Top 20 Homeowner Questions (Research — Ranked by Frequency)
1. How much does a new roof cost / what's my estimate?
2. Do I need a repair or full replacement?
3. How long will the job take?
4. Are you licensed and insured?
5. Do you offer free inspections?
6. Is my damage covered by insurance?
7. Should I call my insurance company or a roofer first?
8. What is my deductible and do I have to pay it?
9. What's the difference between ACV and RCV on my policy?
10. What materials/shingles do you use?
11. Do you offer financing or payment plans?
12. What warranty comes with the roof?
13. Can you help me with my insurance claim / meet the adjuster?
14. What's a "supplement" and why would I need one?
15. Will filing a claim raise my premiums?
16. How long does the insurance claim process take?
17. Can you install new shingles over the old ones?
18. How do I know if I have storm/hail damage?
19. What's your service area / do you work in my zip code?
20. What are your reviews / can I see past work?

## New Data Schema — chatbot_config table

### Tier 1 — Top 5 Questions (Must Have)
| Field | Type | Example |
|-------|------|---------|
| price_range_low | integer | 8000 |
| price_range_high | integer | 25000 |
| offers_free_inspection | boolean | true |
| typical_timeline_days | text | "1-3 days for replacement, same-day for repairs" |
| materials_brands | text[] | ["GAF Timberline HDZ", "Owens Corning Duration"] |
| process_steps | text | "1. Free inspection 2. Written estimate 3. Schedule 4. Install 5. Walkthrough" |

### Tier 2 — Insurance + Financing + Warranty (High Value)
| Field | Type | Example |
|-------|------|---------|
| does_insurance_work | boolean | true |
| insurance_description | text | "We handle the entire claim process" |
| financing_provider | text | "Acorn Finance" |
| financing_terms | text | "0% APR for 18 months, loans up to $100K" |
| warranty_description | text | "10-year workmanship + 50-year manufacturer warranty" |
| emergency_available | boolean | true |
| emergency_description | text | "Emergency tarping within 24 hours for active leaks" |

### Tier 3 — Stickiness + Differentiation
| Field | Type | Example |
|-------|------|---------|
| custom_faqs | jsonb | [{"q": "...", "a": "..."}] |
| differentiators | text | "Only roofer in Tampa with in-house sheet metal crew" |
| team_description | text | "Owner-operated by Mike (25 years experience)" |
| payment_methods | text[] | ["Cash", "Check", "Credit Card", "Financing"] |
| current_promotions | text | "10% off for first responders and military" |
| referral_program | text | "$250 referral bonus for every neighbor" |

## Architecture Decision
- **New `chatbot_config` table** (1:1 with contractors)
- JSONB for custom_faqs only (variable structure)
- All other fields are structured columns
- Dedicated "Train Riley" dashboard page at /dashboard/chatbot
- Smart pre-fill: scrape contractor's existing website to populate fields

## Stickiness Strategy
- More data filled out → smarter Riley → more leads → harder to leave
- Custom FAQs = contractor's unique knowledge locked in RuufPro
- Conversation history accumulates over time
- CRM integration means data flows both ways
- Alivo charges $500-999/mo for similar capability — we include it in $149/mo Pro

## What's Next
1. Plan the chatbot_config migration
2. Build "Train Riley" dashboard page (guided sections, progress bar, completion %)
3. Build website scraper for smart pre-fill
4. Update system prompt to use all new fields
5. Test Riley with full data
6. Wire up demo page with real contractor
