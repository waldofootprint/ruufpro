---
name: direct-mail
description: >
  Generates personalized direct mail letters for roofing contractor prospects. Assigns NFC
  Google Review cards. Generates QR codes linking to demo pages. Uses scoring from
  lib/demo-prospect-scoring.ts. Trigger when the user says "direct mail", "mail letters",
  "NFC cards", "assign cards", "print letters", or asks about physical outreach to roofer prospects.
---

# Direct Mail Skill

You generate personalized direct mail letters for roofing contractor outreach. Each letter includes a QR code linking to a personalized demo page showcasing RuufPro's AI tools (estimate widget + Riley chatbot trained on their business data), and an NFC Google Review card enclosed as a gift.

---

## The System

1. **Prospect scoring** — `lib/demo-prospect-scoring.ts` ranks prospects: Platinum/Gold/Silver/Skip
2. **Targets roofers WITH websites** — more data = better Riley AI training
3. **Auto-skips** — competitor tools (Roofle/Roofr/chatbots/Podium), franchises, multi-state, review automation
4. **Only Gold+ get physical mail** — NFC cards are limited (~200 remaining)
5. **Demo pages** — at `ruufpro.com/demo/{random-slug}` with working estimate widget + Riley chatbot
6. **NFC cards** — redirect to the roofer's Google Review page via Netlify dynamic links
7. **QR codes** — link to their demo page with a "Claim This" CTA

## Letter Template — Version G (Current — Demo Page Pitch)

Template will be written in Phase 5. Core pitch: "I trained an AI that knows your business."

Key changes from Version F:
- Opening references something specific from their website (top service, founding year)
- Core offer: AI assistant + estimate widget trained on THEIR data
- QR code links to `/demo/[slug]` (not `/site/[slug]`)
- CTA: "Scan the QR code to see your AI tools in action"
- If owner name found: addressed to "{{first_name}}" not "Owner"

## Opening Line Variants (by review count)

> ICP locked at 20-100 reviews; <20 and >100 are auto-skipped by `lib/demo-prospect-scoring.ts`.
> Anything outside the rows below should not be in the mail batch — flag and re-score.

| Reviews | Opening |
|---------|---------|
| 61-100 | "{{rating}} stars across {{review_count}} reviews. That kind of reputation takes years." |
| 30-60 (sweet-spot default) | "{{rating}} stars on Google. Your customers clearly like working with you." |
| 20-29 | "I could tell from your reviews that you do solid work." |

## Personalization Variables

| Variable | Source | Required |
|----------|--------|----------|
| `{{first_name}}` | prospect_pipeline.owner_name (first) | Yes |
| `{{city}}` | prospect_pipeline.city | Yes |
| `{{business_name}}` | prospect_pipeline.business_name | Yes |
| `{{rating}}` | prospect_pipeline.google_rating | Yes |
| `{{review_count}}` | prospect_pipeline.review_count | Yes |
| `{{site_url}}` | contractor_sites.slug → ruufpro.com/site/{slug} | Yes |

## Process

### Step 1: Select Prospects
```
SELECT * FROM prospect_pipeline
WHERE nfc_tier IN ('platinum', 'gold')
  AND nfc_card_number IS NULL
  AND demo_page_url IS NOT NULL
ORDER BY nfc_score DESC
LIMIT 25;
```

### Step 2: Assign NFC Cards
- Each card has a unique ID tracked in the Netlify redirects repo
- Map card ID → prospect → Google review URL
- Update prospect_pipeline.nfc_card_id

### Step 3: Generate QR Codes
- QR target: `https://ruufpro.com/site/{{slug}}`
- Generate using `tools/generate-qr.mjs` or equivalent

### Step 4: Generate Letters
- Fill template with prospect data
- Choose opening variant based on review_count
- Output as print-ready format (PDF or formatted text)

### Step 5: Output for Hannah
- Print the letters
- Match each letter to its NFC card by prospect name
- Handwrite envelopes (Hannah's handwriting)
- Mail from Florida

## Copy Rules

- No em-dashes. Periods or line breaks instead.
- Max 2-sentence paragraphs. Bullets for feature lists.
- "Hey" not "Dear". Casual, peer-to-peer.
- Lead with THEM (their reviews, their city), not with RuufPro.
- One ask: scan the QR code.
- Be specific: "your 4.8 rating" not "your online presence."
- Honest about business model. Don't hide the $149/mo.
- "AI tools built for roofers" — AI is a selling word in 2026.
- The site is PRIVATE until they claim it. Always mention this.

## Key Files

- Prospect scoring: `lib/demo-prospect-scoring.ts`
- NFC card assignment: `tools/assign-nfc-cards.mjs`
- QR generator: `tools/generate-qr-codes.mjs`
- Letter research: `research/direct-mail-letter-research.md`
- Letter drafts: `research/direct-mail-letter-drafts.md`
- Vault prompt: `vault/083-direct-mail-letter-prompt.md`
- Implementation plan: `decisions/demo-page-pivot-plan-apr16.md`
