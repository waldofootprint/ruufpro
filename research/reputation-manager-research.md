# Reputation Manager — Competitive Research

> Research date: April 15, 2026
> Sources: 8 Brave Search queries across competitor pricing, NiceJob features, Google review impact, AI response drafting
> Purpose: Inform the Reputation Manager feature build

---

## Competitive Landscape

| Tool | Price/mo | Key Features | Threat |
|------|----------|-------------|--------|
| **Podium** | $249-300+ | Review requests, webchat, payments, multi-channel | High price, overkill for small crews |
| **Birdeye** | $299+ | Multi-platform monitoring, AI responses, analytics | Enterprise-focused |
| **NiceJob** | $75 | 1 SMS + 3 email drip, auto-reply to 3+ stars, referral nudges | Closest model to ours |
| **Reputigo** | $39 | Basic review collection | Too basic |
| **ReviewTrackers** | $119+ | Traditional monitoring | Not for small contractors |
| **Thryv** | $200+ | Full platform with review mgmt bundled | Overkill |

**Key insight:** Roofers pay $199-299/mo for review management on average. We bundle it FREE in $149 Pro.

## NiceJob Deep Dive (Our Template)

- Set-and-forget automated review collection
- 1 SMS + 3 email drip sequence (pre-written, proven for performance)
- Auto-reply to positive reviews (3+ stars)
- Happy reviewers invited into referral sequence (4-part SMS/email)
- CRM integrations auto-enroll customers
- Result: customers get 4x more reviews
- $75/mo for Grow plan

**What we add that NiceJob doesn't:**
- AI review response drafting (Copilot)
- Conversational interface ("Who hasn't left a review?")
- Bundled with lead management, estimate widget, website
- No separate subscription

## Google Reviews — Why They Matter for Roofers

- Average roofing contractor has only ~22 Google reviews
- 70%+ of homeowners check reviews before hiring a roofer
- Reviews directly impact Google Local Pack ranking (top 3 map results)
- Reviews power Google Local Service Ads ranking
- 18% review request → actual review conversion rate achievable with automation
- One contractor: went from $0 to $2.2M revenue in 18 months partly from review strategy

## AI Review Response Best Practices

- **Positive (4-5 stars):** Thank genuinely, mention specific detail from review, keep under 3 sentences
- **Negative (1-3 stars):** Acknowledge, apologize, offer offline resolution, never be defensive
- **Google is testing AI review replies** built into Google Business Profile (April 2026)
- **SEO benefit:** Responding to reviews with relevant keywords improves local search visibility
- Auto-reply bots exist (Zapier agents, Easy-Peasy.AI) but none are roofing-specific

## What We Built

### Phase 1: Fixed broken foundation
- Migration 070: email customization columns + status constraint fix (reminder_sent was silently failing)
- Custom email templates wired into sendReviewRequest() with {{business_name}} substitution
- Timing delay via Inngest step.sleep() (immediate/1hr/1day/3days)

### Phase 2: Analytics + batch send
- Review stats API with funnel data (sent/clicked/reviewed + conversion rates)
- Batch review request endpoint (up to 20 per batch, duplicate-safe)

### Phase 3: Copilot tools (4 new)
- getReviewStats — "How are my reviews doing?"
- findUnreviewedCustomers — "Who hasn't left a review?"
- sendReviewRequests — "Send to all of them" (with confirmation gate)
- draftReviewResponse — "Help me reply to this 3-star review"

### Phase 4: Dashboard upgrade
- 3 stat cards (Sent/Clicked/Reviewed with rates)
- Batch CTA banner for unrequested completed jobs
- Recent activity list with color-coded status badges
