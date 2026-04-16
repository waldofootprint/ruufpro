---
name: direct-mail
description: >
  Generates personalized direct mail letters for roofing contractor prospects. Assigns NFC
  Google Review cards using the scoring system in lib/nfc-scoring.ts. Generates QR codes
  linking to preview sites. Outputs print-ready letters with personalization variables filled
  from prospect data. Trigger when the user says "direct mail", "mail letters", "NFC cards",
  "assign cards", "print letters", or asks about physical outreach to roofer prospects.
---

# Direct Mail Skill

You generate personalized direct mail letters for roofing contractor outreach. Each letter includes a QR code linking to a free preview site we already built for them, and an NFC Google Review card enclosed as a gift.

---

## The System

1. **Prospect scoring** — `lib/nfc-scoring.ts` ranks prospects: Platinum/Gold/Silver/Skip
2. **Only Gold+ get physical mail** — NFC cards are limited (~200 remaining)
3. **Preview sites** — already built at `ruufpro.com/site/{random-slug}` using their Google data
4. **NFC cards** — redirect to the roofer's Google Review page via Netlify dynamic links
5. **QR codes** — link to their preview site with a "Claim This Site" button

## Letter Template — Version F (Current)

```
Hey {{first_name}},

I was looking up roofers in {{city}} and came across {{business_name}}.
{{rating}} stars on Google. Your customers clearly like working with you.

I build free websites for local roofing companies, and I put one
together for yours. Your Google photos, your reviews, your phone
number. All set up.

Nobody can find it unless you share the link. It's on a private URL.
Scan this to take a look:

[ QR CODE — {{site_url}} ]

If you like it, claim it and it goes live. If not, no worries.

The site comes with a free 14-day trial of AI tools built for roofers:

- AI roof estimate calculator — homeowners get an instant ballpark
  price on your site. You get their name, number, and address
  without lifting a finger.

- AI chatbot — answers homeowner questions and captures leads 24/7.
  Even when you're on a roof and can't pick up the phone. (If you
  don't respond to a lead in 5 minutes, there's an 80% chance they
  call someone else.)

- Automatic review requests — emails your customers after a completed
  job asking for a Google review. More five-star reviews = more calls
  from Google.

After 14 days the tools are $149/mo if you want them. The website and
the review card are yours forever either way.

There's a Google Review card in this envelope. Hand it to your next
happy customer. They tap their phone on it and your review page opens.
No app, no link to remember.

I wanted to lead with value, not a pitch. If nothing else, I hope the
card helps you stack up a few more five-star reviews.

Thanks for checking it out.

Hannah
RuufPro · Florida
```

## Alternate Version E (Softer / Shorter)

```
Hey {{first_name}},

I was looking up roofers in {{city}} and came across {{business_name}}.
{{rating}} stars on Google. Your customers clearly like working with you.

I build free websites for local roofing companies, and I put one
together for yours. Your Google photos, your reviews, your phone
number. All set up.

Nobody can find it unless you share the link. It's on a private URL
that isn't indexed by Google. Scan this to take a look:

[ QR CODE — {{site_url}} ]

If you like it, claim it and it goes live. If not, no worries. It
just sits there.

The site comes loaded with tools you can try free for 14 days:

- Estimate calculator — homeowners get a ballpark roof price on your
  site. You get their contact info.

- AI assistant — answers questions and captures leads while you're
  on a job

- Automatic review requests — emails your customers after a job
  asking for a Google review

After 14 days the tools are $149/mo. The website and the review card
are yours forever either way.

Speaking of — there's a Google Review card in this envelope. Hand it
to your next happy customer. They tap their phone on it and your
Google review page opens. No app, no link to remember.

I wanted to lead with value, not a pitch. If nothing else, I hope the
card helps you stack up a few more five-star reviews.

Thanks for checking it out.

Hannah
RuufPro · Florida
```

## Opening Line Variants (by review count)

| Reviews | Opening |
|---------|---------|
| 50+ | "{{rating}} stars across {{review_count}} reviews. That kind of reputation takes years." |
| 10-49 (default) | "{{rating}} stars on Google. Your customers clearly like working with you." |
| 3-9 | "I could tell from your reviews that you do solid work." |
| 0-2 | Skip the review line. "I came across {{business_name}} while looking up roofers in {{city}}." |

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
  AND nfc_card_assigned IS NULL
  AND site_slug IS NOT NULL
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

- NFC scoring: `lib/nfc-scoring.ts`
- QR generator: `tools/generate-qr.mjs`
- Letter research: `research/direct-mail-letter-research.md`
- Letter drafts: `research/direct-mail-letter-drafts.md`
- Vault prompt: `vault/083-direct-mail-letter-prompt.md`
