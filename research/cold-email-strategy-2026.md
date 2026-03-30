# Cold Email Strategy Research for RuufPro (2026)

Research compiled March 29, 2026. Focused on high-volume cold outreach to roofing contractors, marketing agencies, and roofing supply companies.

---

## 1. Volume & Infrastructure: The Math to Send 1,000+ Emails/Day

### The Core Formula

To send 1,000 emails/day safely, you need to distribute volume across many mailboxes at low per-inbox volume:

| Target Daily Volume | Emails/Inbox/Day | Mailboxes Needed | Domains Needed (2-3 inboxes each) |
|---|---|---|---|
| 200/day | 30 | 7 | 3 |
| 500/day | 30 | 17 | 6-8 |
| 1,000/day | 30 | 34 | 12-17 |
| 2,000/day | 30 | 67 | 23-34 |

**Key numbers:**
- **30 emails per inbox per day** is the safe ceiling during ramp. Some push to 50/day on mature inboxes, but 30 is the consensus safe number in 2026.
- **2-3 mailboxes per domain** maximum. More than that and you risk cross-contamination if one inbox gets flagged.
- **Never use your primary brand domain.** Buy secondary domains (e.g., ruufpro-info.com, getruufpro.com, joinruufpro.com).
- Domain variants should look legitimate and be close to your brand, but isolated from your main domain's reputation.

### Domain Setup Checklist (Per Domain)

1. Register domain (Namecheap, Google Domains, Cloudflare)
2. Set up Google Workspace or Microsoft 365 (Google Workspace preferred for warm-up compatibility)
3. Create 2-3 mailboxes per domain (e.g., hannah@, hello@, team@)
4. Configure DNS records:
   - **SPF** - Authorizes your sending servers
   - **DKIM** - Digitally signs messages to prove authenticity
   - **DMARC** - Set to at least `p=none` with alignment to SPF or DKIM (preferably both)
   - **Custom tracking domain** - Avoids shared tracking domain flags
5. Warm up each inbox for 2-4 weeks before sending any cold emails

### Warm-Up Timeline (2026 Best Practices)

| Week | Daily Volume/Inbox | Activity |
|---|---|---|
| Week 1 | 5-10 emails | Warm-up only (automated conversations with warm-up network) |
| Week 2 | 10-20 emails | Continue warm-up, monitor placement |
| Week 3 | 20-30 emails | Begin small cold campaigns (50-100 total/day) |
| Week 4 | 30-40 emails | Scale cold campaigns gradually |
| Week 5-6 | 40-50 emails | Full production volume |
| Week 8-10 | 50+ emails | Only on mature, high-reputation inboxes |

**Critical warm-up rules:**
- Brand-new domains need 30-60 days for safe scaling
- Dormant domains can reactivate in 3-4 weeks
- Never use the same inbox for both warm-up and active campaigns simultaneously
- Sending 100 emails with zero replies is now a negative signal. 20 emails with 10 replies is a massive positive signal.
- Warm-up must be continuous (keep running even after you start cold campaigns)
- If using shared IPs (Instantly, Smartlead), you only need domain warm-up, not IP warm-up

### Top Sending Platforms (2026)

| Platform | Starting Price | Key Strength |
|---|---|---|
| **Instantly** | $30/mo (Growth) | Unlimited mailboxes, 4.2M+ warm-up network, 450M+ contact database. Best for solo founders/small teams. |
| **Smartlead** | $39/mo | Unlimited mailboxes, AI-adjusted warm-up that detects spam triggers, human-like sending patterns. |
| **Lemlist** | $55/mo per seat | Strong personalization features, multi-channel (email + LinkedIn). More expensive at scale. |
| **Salesforge** | $48/mo | AI email writing, multi-language support. |

**Cost comparison for 20 mailboxes:**
- Instantly: $144/month
- Apollo: $980/month
- Lemlist: $1,100/month

**Recommendation for RuufPro:** Start with Instantly. Best price-to-feature ratio for a solo founder. Unlimited mailboxes on the Growth plan, built-in warm-up, and a massive contact database via SuperSearch.

### Infrastructure Providers (Mailbox Hosting)

Instead of setting up Google Workspace for every domain ($7/user/month adds up fast), consider bulk infrastructure providers:

- **Mailforge** - Bulk domain + mailbox creation, automated DNS setup
- **Mailscale** - Quick provisioning, integrates with Instantly/Smartlead
- **Infraforge** - Automated domain purchasing and setup

These cut per-mailbox costs from $7/mo to $1-3/mo at scale.

---

## 2. Deliverability: What Kills You and What Saves You

### The 2025-2026 Rules (Gmail, Outlook, Yahoo)

**Gmail (enforced November 2025):**
- Messages from non-compliant domains are now actively **rejected**, not just filtered to spam
- Bulk senders (5,000+ emails/day to Gmail accounts) must have SPF, DKIM, DMARC alignment AND one-click unsubscribe
- Spam complaint rate must stay below 0.3% (ideally under 0.1%)

**Outlook/Microsoft (enforced May 2025):**
- High-volume non-compliant domains routed to Junk folder
- Moving toward outright rejection (similar to Gmail)
- Requires SPF, DKIM, DMARC for bulk senders

**As of March 2026:**
- Emails from domains without properly configured DMARC, DKIM, and SPF are **rejected by major email providers** -- not sent to spam, rejected entirely

### What Kills Deliverability

| Killer | Threshold | What Happens |
|---|---|---|
| **Spam complaints** | >0.3% | Gmail rejects messages outright. Yahoo degrades deliverability. Outlook routes to Junk. |
| **Bounce rate** | >2% | Domain reputation tanks. Aim for <1%. |
| **No authentication** | Missing SPF/DKIM/DMARC | Emails rejected entirely (not spam-filtered -- rejected) |
| **HTML-heavy emails** | Complex HTML, images | Bounce rate +652% compared to plain text |
| **Links in first email** | Tracked links, multiple URLs | Triggers spam filters. Avoid in first touch. |
| **Tracking pixels** | Open tracking | Known spam indicator. Disable in cold emails. |
| **Inconsistent volume** | Spiky sending patterns | Looks automated. Maintain steady daily volume. |
| **Shared tracking domains** | Default provider domains | Use custom tracking domain or disable tracking entirely. |
| **Sending too fast** | Blasting hundreds in minutes | Spread sends throughout the day. |

### What Maintains Deliverability

1. **SPF + DKIM + DMARC on every domain** (non-negotiable in 2026)
2. **Plain text emails only** for cold outreach
3. **Verify every email address before sending** (reduces bounces to <1%)
4. **Keep volume steady** -- teams with consistent patterns see 15-20% higher reply rates
5. **Keep warm-up running continuously** (even during active campaigns)
6. **Use secondary domains** -- never risk your primary brand domain
7. **Monitor and remove bounced addresses immediately**
8. **Include physical address** (CAN-SPAM requirement)
9. **Include easy unsubscribe** (now required by Gmail for bulk senders)
10. **Maintain high reply rates** -- engagement is a positive signal to ESPs

---

## 3. Sequence Design: Structure That Gets Replies

### Optimal Sequence Length

- **4-7 touchpoints** is the sweet spot (Instantly 2026 Benchmark Report)
- Fewer than 4 abandons prospects too early
- Beyond 7 shows diminishing returns
- **4+ emails in a sequence more than triples unsubscribe and spam complaint rates** -- so lean toward 4-5 for cold email

### Recommended Sequence Structure

| Step | Timing | Purpose | Length |
|---|---|---|---|
| Email 1 | Day 0 | Initial outreach. Hook + value prop + soft CTA | 50-80 words |
| Email 2 | Day 3 | "Bump" follow-up. Feel like a reply, not a reminder. | 30-50 words |
| Email 3 | Day 7-10 | New angle or social proof | 50-80 words |
| Email 4 | Day 17 | Breakup/final value add | 30-50 words |

**Key timing insight:** The 3-7-7 cadence (Day 0, Day 3, Day 10, Day 17) captures **93% of total replies by Day 10.** After that, additional follow-ups produce marginal or negative returns.

### Where Replies Come From

- **58% of all replies** come from Email 1
- **42% of replies** come from follow-ups (Steps 2-7)
- First follow-up alone adds **40-50% more replies** vs. single email
- A single follow-up increased replies by **65.8%** in a 12-million-email study

### Subject Lines That Work

**Top performers:**
- "Hi {{first_name}}" -- 45.36% open rate
- Questions: "Are you the right person to talk with?" -- 46% open rate
- Personalized with company name: +22% open rate
- Numbers in subject line: +113% increase in opens

**Rules:**
- 4-7 words or under 60 characters
- Lowercase, casual tone (like a real person wrote it)
- No ALL CAPS, no excessive punctuation, no salesy language
- Personalized subject lines: 46% open rate vs. 35% without

### Email Format Rules

- **Plain text only.** HTML emails see bounce rates +652% higher than plain text.
- **No images.** Click-through rates drop 21-51% with images.
- **No links in first email.** Add a link in follow-up 2 or 3 if needed.
- **No tracking pixels.** Known spam trigger.
- **50-80 words optimal.** Messages between 50-125 words achieve the highest reply rates.
- **One clear CTA.** Binary question format works best: "Would you have a couple minutes to chat about this over the next few days?"
- **Step 2 should feel like a reply, not a reminder** -- this alone gives a ~30% performance lift.

---

## 4. Personalization at Scale

### The Spectrum: Spray-and-Pray vs. Personalized at Scale

| Approach | Reply Rate | Effort/Email | Daily Volume |
|---|---|---|---|
| Generic blast (no personalization) | 0.5-2% | 0 seconds | Unlimited |
| Basic variables (first name, company) | 3-5% | 0 seconds | Unlimited |
| Segment-level personalization (industry, role, pain point) | 5-10% | 5 seconds | 500-1,000 |
| AI-generated personalized first lines + segments | 6-14% | 0 seconds (automated) | 500-1,000 |
| Manual deep personalization | 15-25% | 5-15 minutes | 20-50 |

**The sweet spot for high volume:** AI-generated personalized first lines + strong segment-level copy. Gets you 6-14% reply rates at 500-1,000 emails/day.

### Variables That Matter Most

**High impact:**
- {{first_name}} -- basic but essential
- {{company_name}} -- in subject line, +22% open rate
- {{industry_specific_pain_point}} -- "I know roofing companies struggle with..."
- {{competitor_or_tool_they_use}} -- "I noticed you're using Angi leads..."
- {{city/region}} -- "roofing contractors in the Dallas area"
- {{company_size_signal}} -- "as a crew of 5-10" vs. "as a growing operation"

**Lower impact but useful:**
- {{recent_news_or_activity}} -- recently won an award, new Google review
- {{tech_stack}} -- what website platform they use, if they have a website at all
- {{review_count_or_rating}} -- "I saw your 4.8 stars on Google"

### The Clay + Instantly Stack (Best Practice 2026)

**How it works:**
1. **Build list** in Apollo, Outscraper, or Google Maps scraper
2. **Enrich in Clay** using waterfall enrichment (pulls from 75+ data providers). Gets 85-92% email accuracy vs. 70-80% from any single provider.
3. **AI-generate personalized lines** in Clay using GPT/Claude prompts constrained to verified data fields
4. **Push enriched contacts + personalized fields to Instantly** via integration
5. **Instantly runs the sequence** with mail merge variables

**AI prompt example for Clay:**
```
Write a 1-sentence personalized opening for a cold email to {{first_name}} at {{company_name}},
a roofing company in {{city}}. Reference their {{google_rating}} star rating and {{review_count}}
Google reviews. Keep it under 20 words. Only use the provided fields. Never invent facts.
```

**Critical rule:** Treat AI as an assistant that drafts concise, factual openings from verified fields. Supply fields like {{Industry}}, {{City}}, {{ReviewCount}}, {{WebsiteStatus}}. Instruct the AI to use ONLY these fields and never invent facts.

---

## 5. List Building for Roofing Contractors

### Best Tools for Finding Roofers (2026)

| Tool | Best For | Pricing | Notes |
|---|---|---|---|
| **Outscraper** | Google Maps scraping by category + location | Pay per result | Scrape "Roofers in [city]", get name, phone, email, website, rating, reviews. Then run Email & Contacts Scraper on websites. |
| **Scrap.io** | Pre-built contractor database | ~$0.05/contact | 225,659 contractors, 147,821 with construction as primary. Updated daily from Google Maps. TX, CA, FL = 31% of all contractors. |
| **Apollo.io** | All-in-one prospecting + sequencing | Free tier available | 275M+ contacts, 65+ filters. Best for early-stage SaaS under $1M ARR. |
| **Clay** | Data enrichment + waterfall verification | Credits-based | Not a database -- it aggregates from 75+ providers. 85-92% email accuracy via waterfall. |
| **Google Maps Scraper (Apify/Omkarcloud)** | DIY scraping | Free or low-cost | Open-source option: github.com/omkarcloud/google-maps-scraper. Extracts 50+ data points including emails. |
| **D7 Lead Finder** | Small business email finding | Low-cost | Good for finding local business owners who aren't on LinkedIn. |

### Strategy for Roofers Specifically

Roofing contractors are often small business owners (1-15 employees) who do NOT have LinkedIn profiles. Traditional B2B databases (ZoomInfo, LinkedIn Sales Navigator) will miss most of them. Instead:

1. **Google Maps is your primary source.** Search "Roofing contractors in [city]" and scrape every result.
2. **Scrape by geography:** Start with high-density roofing markets (TX, FL, CA, NC, GA, OH, PA, MI, IL, AZ).
3. **Extract from their websites:** After getting website URLs from Google Maps, scrape contact pages for owner emails.
4. **Google Business Profile data** gives you: business name, phone, website, address, rating, review count, claimed status.
5. **Enrich with Clay** to find owner names and verified emails via waterfall enrichment.
6. **Verify every email** with a tool like NeverBounce, ZeroBounce, or Instantly's built-in verification before sending.

### List Size Targets

- There are ~100,000+ roofing companies in the US
- Scrap.io alone has 225K+ contractors (not all roofing, but roofing is a top segment)
- **Realistic target:** Build a list of 10,000-20,000 verified roofing contractor emails over 4-6 weeks
- At 1,000 emails/day, that's 10-20 days of sending before you need fresh leads

### List Hygiene

- Verify all emails before sending (bounce rate must stay under 2%, ideally under 1%)
- Remove duplicates across campaigns
- Remove anyone who bounces, unsubscribes, or marks as spam
- Re-verify lists every 90 days (emails decay at ~25% annually)

---

## 6. Copy That Converts: Frameworks & Examples

### Framework Comparison

| Framework | Structure | Best For | Expected Lift |
|---|---|---|---|
| **PAS** (Problem-Agitate-Solve) | Name the problem -> Make it worse -> Offer solution | Pain-point-aware prospects | Gong.io went from 6% to 14% reply rate using PAS |
| **AIDA** (Attention-Interest-Desire-Action) | Grab attention -> Build interest -> Create desire -> CTA | Product-led pitches | Chili Piper went from 3% to 12% reply rate |
| **BAB** (Before-After-Bridge) | Where they are now -> Where they could be -> Your solution bridges the gap | Aspirational sells | Good for showing transformation |
| **QVC** (Question-Value-CTA) | Ask about a problem -> State your value -> CTA | Short, direct emails | Best for follow-ups |

### The Difference Between 1% and 10%+ Reply Rates

**1% reply rate emails:**
- Talk about themselves ("We are the leading platform for...")
- Long (200+ words)
- Generic ("Dear Business Owner")
- Salesy CTAs ("Book a demo today!")
- HTML formatted with logos and images
- Multiple links and CTAs

**10%+ reply rate emails:**
- Talk about the prospect's problem
- Short (50-80 words)
- Personalized opening line referencing something specific
- Soft CTA ("Worth a quick chat?")
- Plain text, looks like a real person wrote it
- Zero or one link, zero images

### Example Cold Email for RuufPro (PAS Framework)

```
Subject: {{first_name}} - quick question about your website

Hi {{first_name}},

I noticed {{company_name}} has great reviews ({{rating}} stars) but
{{pain_point_variable: no website / an outdated website / no way for
homeowners to get estimates online}}.

Most roofers I talk to say they're losing jobs to competitors who let
homeowners get instant estimates online. It's frustrating when you do
great work but lose the lead before you even get a chance to bid.

We built RuufPro specifically for roofing contractors -- a free
professional website with a built-in estimate calculator that captures
leads 24/7. No setup fees, no tech skills needed.

Would it be worth a 5-minute look?

{{your_name}}
```

*~85 words. Plain text. One CTA. Personalized opening. PAS framework.*

### Winning CTA Formulas (2026)

- "Would you have a couple minutes to chat about this over the next few days?"
- "Worth a quick look?"
- "Would this be useful for {{company_name}}?"
- "Should I send over a quick demo?"
- "Is this something you'd want to explore?"

**Avoid:** "Book a demo", "Schedule a call", "Click here", "Sign up now"

---

## 7. Follow-Up Strategy

### How Many Follow-Ups

- **Optimal: 3-4 follow-ups** (total sequence of 4-5 emails)
- 4-9 follow-ups captures the most replies per lemlist's analysis of millions of campaigns
- BUT: 4+ emails in a sequence **triples unsubscribe and spam complaint rates**
- **Recommendation:** 3 follow-ups (4 total emails). Balances persistence with deliverability.

### Where Replies Come From

| Email # | % of Total Replies | Cumulative |
|---|---|---|
| Email 1 | 58% | 58% |
| Email 2 | ~20% | ~78% |
| Email 3 | ~10% | ~88% |
| Email 4 | ~5% | ~93% |
| Email 5+ | ~7% | ~100% |

**93% of total replies arrive by Day 10.** Additional follow-ups after that produce marginal or negative returns.

### Same Thread vs. New Thread

**Keep follow-ups in the same thread.** Breaking the thread forces prospects to rebuild context. Threading keeps all interactions in one conversation, reducing cognitive load and making it easy to see the full conversation history.

Exception: If you want to try a completely new angle or subject line (like a "breakup email"), a new thread can work for the final email.

### What Follow-Ups Should Look Like

**Follow-up 1 (Day 3):** Short bump. Should feel like a reply, not a reminder.
```
Hi {{first_name}},

Just floating this back up -- I know roofing season keeps you busy.
Would a free website for {{company_name}} be worth a quick look?

{{your_name}}
```

**Follow-up 2 (Day 7-10):** New angle or social proof.
```
{{first_name}} -- one more thought.

We just launched a site for a roofer in {{nearby_city}} and they got
3 estimate requests in their first week. Happy to set up something
similar for {{company_name}} -- takes about 10 minutes.

{{your_name}}
```

**Follow-up 3 (Day 17):** Breakup / final value.
```
Hi {{first_name}},

Last note from me. If a free professional website with online estimates
isn't a fit right now, no worries at all.

If things change, I'm at {{email}}. Good luck this season.

{{your_name}}
```

---

## 8. Metrics & Benchmarks

### What to Expect (2026 B2B SaaS Cold Email)

| Metric | Poor | Average | Good | Elite |
|---|---|---|---|---|
| **Open rate** | <20% | 27-35% | 40-50% | 50%+ |
| **Reply rate** | <2% | 3-5% | 5-10% | 10-15%+ |
| **Positive reply rate** | <30% of replies | 40-50% of replies | 50-60% of replies | 60%+ of replies |
| **Meeting booking rate** | <0.5% of sent | 1-2% of sent | 2-3% of sent | 3%+ of sent |
| **Bounce rate** | >3% | 2-3% | 1-2% | <1% |
| **Spam complaint rate** | >0.3% | 0.1-0.3% | <0.1% | <0.05% |
| **Unsubscribe rate** | >3% | 2-3% | 1-2% | <1% |

### RuufPro-Specific Projections

Assuming 1,000 emails/day with moderate personalization:

| Stage | Per 1,000 Emails | Per Month (20 working days) |
|---|---|---|
| Emails sent | 1,000 | 20,000 |
| Opens (35%) | 350 | 7,000 |
| Replies (5%) | 50 | 1,000 |
| Positive replies (50% of replies) | 25 | 500 |
| Meetings/signups (2% of sent) | 20 | 400 |
| Conversions to free site | ~10 | ~200 |

**With better personalization (8% reply rate):** 80 replies/day, 1,600/month, potentially 320+ signups/month.

### Key Benchmark from Instantly's 2026 Report

- Top performers (top 10%) get **10.7%+ reply rates**
- The "numbers hook" delivered 8.57% reply rate, 61.76% positive reply rate, and 1.86% meeting rate
- Timeline-based hooks outperform problem-statement hooks by **2.3x** (10.01% vs. 4.39% reply rate)
- Best days: **Monday** for launching sequences, **Wednesday** for peak engagement
- **75% of cold emails are opened within the first hour**
- Best send time for replies: **1-3 PM** recipient's local time

---

## 9. Case Studies

### Case Study 1: SaaS to $100K ARR via Cold Email

**Product:** Node-app.com (SaaS tool for SMBs in beer/spirits industry)
**Volume:** 1,200+ prospects emailed over one summer
**Approach:** Initially spray-and-pray, evolved to segmented outreach
**Results:**
- Open rates: 40%+ consistently
- Reply rates: 12-33% depending on template
- Most replies came after 2nd-3rd follow-up
- Reached $100K ARR

**Key lessons:**
- 4 sentences max in opening emails
- Emphasize prospect's pain points, not your accomplishments
- "Optimization > personalization" -- iterating on copy based on data beats spending time on deep personalization
- Conversational English, no jargon

### Case Study 2: B2B SaaS Playbook (Jonathan Rintala / Univid)

**Product:** Univid (webinar software)
**Volume:** ~900 enrolled contacts
**Results:**
- Open rate: 48%
- Reply rate: 17.6%
- Click rate: 5.9%
- Meeting booking rate: 1.7%
- **15 meetings booked from 900 contacts**

**Key lessons:**
- Target people already doing the activity your product improves (e.g., companies already running webinars, not companies you want to convince to start)
- Max 3 stakeholders per company enrolled simultaneously
- Longer initial email followed by shorter follow-ups
- Subject line "Simply {{first_name}}?" works surprisingly well
- Most meetings booked from Email #2
- Used specific competitor comparisons, localized by language

### Case Study 3: Lemon.io's 4-Email Sequence

**Product:** Lemon.io (developer marketplace)
**Approach:** 4-email sequence with distinct purposes:
1. **Differentiation** - Pattern interrupt opening ("Did you make me an Upwork profile?")
2. **Pain point validation** - Aligns with prospect's known preferences
3. **Objection handling** - Directly addresses "How can you be cheaper?"
4. **Urgency** - Shows how fast the matching process moves

**Key lesson:** Each email in the sequence serves a distinct strategic purpose. Don't just "follow up" -- add new angles, handle objections, create urgency.

### Applying Case Studies to RuufPro

The winning pattern across all case studies:
1. **Tight ICP targeting** -- for RuufPro: roofing contractors with poor/no websites, positive Google reviews (proving they do good work), in active roofing markets
2. **Short, pain-focused copy** -- 50-80 words, about THEIR problem
3. **3-4 email sequences** -- most conversions on email 2
4. **Iterate on data** -- A/B test subject lines, opening hooks, CTAs. Run tests on 100-200 contacts per variation over 3-5 days. Declare winners at 95% confidence.

---

## 10. Legal Compliance

### CAN-SPAM (United States) -- The Main One for RuufPro

B2B cold email is **legal in the US** under CAN-SPAM. It's an opt-out model: you can email a stranger without permission if you follow these rules:

**Required:**
- Accurate "From" and "Reply-To" headers
- Non-deceptive subject line
- Your **physical mailing address** in every email (street address, P.O. Box, or registered commercial mail-receiving agency)
- Clear way to opt out / unsubscribe (must be honored within 10 business days)
- Identify the message as an ad (if applicable)

**Penalties:**
- **$53,088 per individual email** that violates CAN-SPAM (2025 inflation-adjusted FTC figure)
- Aggravated cases can reach **$2,000,000 total**
- Washington state: misleading subject lines carry **$500 penalty per recipient per email** (Brown v. Old Navy, 2025)

**Practical risk for B2B cold email:** Low, as long as you include your address, have an unsubscribe mechanism, don't use deceptive subject lines, and honor opt-outs promptly. The FTC primarily goes after egregious consumer spam, not legitimate B2B outreach.

### GDPR (European Union)

Only relevant if you email EU-based prospects.

- B2B cold email is **allowed** under "legitimate interest" basis (no explicit consent required)
- Must complete a Legitimate Interest Assessment
- Must use professional (not personal) email addresses
- Must disclose how you obtained their data
- Must provide easy opt-out
- **Cumulative fines: EUR 5.88 billion by January 2025.** 35% from consent-related violations.
- Spain alone: 1,000+ fines totaling ~EUR 120 million as of September 2025

**For RuufPro:** Unless you're emailing roofers in Europe, GDPR doesn't apply. Focus on CAN-SPAM compliance.

### CASL (Canada)

If emailing Canadian contractors:
- Requires **implied consent** for B2B (you can email if there's a reasonable business relationship)
- Must identify yourself and your business
- Must include contact information
- Must include unsubscribe mechanism
- Consent expires after 2 years without engagement

### Practical Compliance Checklist for RuufPro

1. Include your physical address in every email footer
2. Include an unsubscribe link or "Reply STOP to unsubscribe" in every email
3. Honor opt-outs within 10 business days (immediately is better)
4. Don't use deceptive subject lines
5. Keep a suppression list of everyone who unsubscribes -- never email them again
6. Document where you sourced every email address (in case challenged)
7. Verify email lists from third-party vendors -- buying bad data can be a violation even if you didn't scrape it yourself
8. Only 24% of email marketers fully comply with current standards -- being compliant is a competitive advantage, not a burden

---

## Action Plan for RuufPro

### Phase 1: Infrastructure Setup (Weeks 1-2)

- [ ] Buy 5 secondary domains (e.g., ruufpro-sites.com, getruufpro.com, joinruufpro.com, tryruufpro.com, helloruufpro.com)
- [ ] Set up Google Workspace on each (2 mailboxes per domain = 10 mailboxes)
- [ ] Configure SPF, DKIM, DMARC on all domains
- [ ] Sign up for Instantly (Growth plan, $30/mo)
- [ ] Connect all 10 mailboxes to Instantly
- [ ] Start warm-up on all inboxes

### Phase 2: List Building (Weeks 2-4, overlap with warm-up)

- [ ] Use Outscraper or Scrap.io to scrape "Roofing contractors" from Google Maps, starting with TX, FL, CA, NC, GA
- [ ] Enrich with Clay for owner names + verified emails (waterfall enrichment)
- [ ] Verify all emails through Instantly or NeverBounce
- [ ] Build initial list of 5,000+ verified roofing contractor emails
- [ ] Segment by: has website vs. no website, review count, city/state

### Phase 3: First Campaign (Weeks 4-5)

- [ ] Write 2-3 email variations using PAS framework
- [ ] Set up 4-email sequence (Day 0, Day 3, Day 10, Day 17)
- [ ] Start sending at 50-100/day total
- [ ] Monitor open rates, reply rates, bounce rates, spam complaints daily
- [ ] A/B test subject lines on first 200 contacts

### Phase 4: Scale (Weeks 6-10)

- [ ] Ramp to 500/day by week 6
- [ ] Add 5 more domains (total 10 domains, 20-30 mailboxes) for 1,000/day target
- [ ] Scale to 1,000/day by week 8-10
- [ ] Continue building lists (next 5 states, marketing agencies, supply companies)
- [ ] Optimize based on data: kill underperforming variations, double down on winners
- [ ] Set up Clay + Instantly integration for AI-personalized first lines

### Budget Estimate (Monthly, at Scale)

| Item | Monthly Cost |
|---|---|
| Instantly Growth | $30 |
| 10 domains (annual / 12) | ~$15 |
| Google Workspace (20 mailboxes) OR bulk provider | $50-140 |
| Clay (enrichment credits) | $50-150 |
| Outscraper/Scrap.io (list building) | $30-100 |
| Email verification | $20-50 |
| **Total** | **$195-485/month** |

For under $500/month, you can run 1,000+ cold emails/day to roofing contractors with solid personalization and deliverability.

---

## Sources

- [Instantly - 90%+ Cold Email Deliverability in 2026](https://instantly.ai/blog/how-to-achieve-90-cold-email-deliverability-in-2025/)
- [Instantly - Cold Email Benchmark Report 2026](https://instantly.ai/cold-email-benchmark-report-2026)
- [Instantly - Send 1,000+ Personalized Cold Emails Per Week](https://instantly.ai/blog/send-high-volume-personalized-cold-emails/)
- [Instantly - Best Cold Email Software for Agencies 2026](https://instantly.ai/blog/best-cold-email-software-for-agencies-2026/)
- [Instantly - AI-Powered Cold Email Personalization](https://instantly.ai/blog/ai-powered-cold-email-personalization-safe-patterns-prompt-examples-workflow-for-founders/)
- [Instantly - Follow-Up vs. No Follow-Up](https://instantly.ai/blog/follow-up-emails-vs-no-followup/)
- [Instantly - Cold Email Reply Rate Benchmarks](https://instantly.ai/blog/cold-email-reply-rate-benchmarks/)
- [Smartlead - 27 Cold Email Statistics 2025](https://www.smartlead.ai/blog/cold-email-stats)
- [Smartlead vs Instantly 2026](https://blog.seraleads.com/kb/sales-tool-reviews/smartlead-vs-instantly-2026/)
- [Microsoft - Outlook New Requirements for High-Volume Senders](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)
- [Gmail Enforcement 2025 - PowerDMARC](https://powerdmarc.com/gmail-enforcement-email-rejection/)
- [Proofpoint - Stricter Gmail Enforcement November 2025](https://www.proofpoint.com/us/blog/email-and-cloud-threats/clock-ticking-stricter-email-authentication-enforcements-google-start)
- [Email-Check.app - 2025-2026 Email Deliverability Crisis](https://email-check.app/blog/2025-email-deliverability-crisis-gmail-outlook-requirements)
- [Allegrow - Cold Email Sequences Guide 2026](https://www.allegrow.co/knowledge-base/cold-email-sequences)
- [Belkins - B2B Cold Email Response Rates 2025](https://belkins.io/blog/cold-email-response-rates)
- [Belkins - Sales Follow-Up Statistics 2025](https://belkins.io/blog/sales-follow-up-statistics)
- [Lemlist - How Many Cold Email Follow-Ups](https://www.lemlist.com/blog/how-many-cold-email-follow-ups)
- [SalesBread - Data-Driven Guide to Cold Email Cadences](https://salesbread.com/cold-email-cadence/)
- [Salesforge - Cold Email Frameworks](https://www.salesforge.ai/blog/cold-email-frameworks)
- [Salesforge - Domain Warm-Up Best Practices 2026](https://www.salesforge.ai/blog/best-practices-for-domain-warm-up)
- [Clay - 24 AI Email Personalization Examples](https://www.clay.com/blog/ai-email-personalization-examples)
- [Clay vs Apollo vs ZoomInfo 2026](https://formanorden.com/blog/clay-vs-apollo-vs-zoominfo/)
- [Scrap.io - Contractor Email List Guide](https://scrap.io/contractor-email-list-complete-guide)
- [Scrap.io - Cold Email Compliance](https://scrap.io/cold-email-compliance)
- [Outscraper - Google Maps Scraper](https://outscraper.com/google-maps-scraper/)
- [Martal - B2B Cold Email Statistics 2026](https://martal.ca/b2b-cold-email-statistics-lb/)
- [Oppora - Cold Email Benchmarks 2026](https://oppora.ai/blog/cold-email-benchmarks/)
- [Warmforge - Plain Text vs HTML in Cold Emails](https://www.warmforge.ai/blog/plain-text-vs-html-in-cold-emails)
- [Warmforge - Spam Complaint Thresholds](https://www.warmforge.ai/blog/spam-complaint-thresholds-what-you-need-to-know)
- [Mailforge - HTML vs Plain Text Deliverability](https://www.mailforge.ai/blog/html-vs-plain-text-best-format-for-deliverability)
- [Mailpool - Perfect Cold Email Setup 2026](https://www.mailpool.ai/blog/the-anatomy-of-a-perfect-cold-email-setup-for-2026)
- [Mailivery - Domain Warm-Up 30-Day Schedule](https://mailivery.io/blog/how-to-warm-up-a-domain)
- [Prospeo - Spam Rate Thresholds 2026](https://prospeo.io/s/spam-rate-threshold)
- [Digital Bloom - Cold Email Reply-Rate Benchmarks 2025](https://thedigitalbloom.com/learn/cold-outbound-reply-rate-benchmarks/)
- [Jonathan Rintala - B2B SaaS Cold Email Playbook](https://jonathanrintala.com/blog/outbound-b2b-saas-cold-email-playbook/)
- [Medium - SaaS to $100K ARR Using Cold Emails](https://arminsworld.medium.com/how-we-got-our-saas-startup-to-100k-arr-using-cold-emails-74d7127330d4)
- [ProductLed - Cold Emails at Scale Case Study](https://productled.com/blog/do-cold-emails-work-at-scale-case-study)
- [Outbound Republic - Google's Spam Changes for B2B Cold Email](https://outboundrepublic.com/blog/what-googles-spam-changes-mean-for-b2b-cold-email-in-2025/)
- [OutreachBloom - Cold Email Compliance 101](https://outreachbloom.com/cold-email-compliance)
- [GrowLeads - Is Cold Email Legal 2026](https://growleads.io/blog/is-cold-email-legal-gdpr-can-spam-2026/)
- [Salesforge - Cold Email Laws](https://www.salesforge.ai/blog/cold-email-laws)
