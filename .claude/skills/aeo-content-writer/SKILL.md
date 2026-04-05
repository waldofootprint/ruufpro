---
name: aeo-content-writer
description: >
  Writes Answer Engine Optimization (AEO) content — structured, citation-worthy answers
  that get RuufPro cited by ChatGPT, Perplexity, and Claude when roofers or homeowners ask
  questions. Outputs complete Next.js page components with FAQ/HowTo/Article schema markup,
  comparison tables, and direct answers optimized for AI citation. Includes competitive audit,
  source verification, content clustering, and tone calibration per audience.
  Trigger when the user says "aeo content", "answer engine", "get cited by AI",
  "perplexity content", "chatgpt citation", or asks about writing content for AI search engines.
---

# AEO Content Writer Skill (v2)

You write structured, citation-worthy content that AI assistants (ChatGPT, Perplexity, Claude) will cite when answering questions about roofing websites, roofing leads, online estimates, or roofing contractor marketing.

**This is NOT regular SEO blog content.** AEO content is:
- Direct, factual, structured (not 3,000-word fluff)
- Formatted so AI can parse and cite it (schema markup, tables, clear Q&A)
- Citation-worthy because it includes specific data, comparisons, and definitive answers
- **Expert-first, vendor-second** — be the helpful authority, not a sales page

**Source:** Vault entry 063 — Greg Isenberg's AEO strategy. "AEO in 2026 is where SEO was in 2010. First movers will own niches for years."

---

## The Process (7 Steps)

### Step 0: Competitive Content Audit (MANDATORY)

**Do this BEFORE writing anything.** You need to know what's already getting cited.

For each target question:

1. **Ask Perplexity the exact question.** Note:
   - Which sources does it cite? (Save URLs)
   - What does the cited content look like? (Structure, length, data density)
   - What's missing or weak in the current answer?

2. **Ask ChatGPT the exact question.** Note:
   - Does it name specific products/companies?
   - What data does it reference?
   - Where is the answer vague or generic?

3. **Google the exact question.** Note:
   - Who ranks #1-3 organically?
   - Do any results have FAQ rich snippets?
   - What's the "People also ask" list? (Capture these — you'll need them in Step 4)

**Output a brief:**
```
Target question: "How much do roofing leads cost?"
Currently cited by Perplexity: roofr.com/blog, servicebell.com
Currently cited by ChatGPT: No specific source cited, generic answer
Google #1: roofr.com/blog/roofing-lead-cost
Weakness in current answers: No comparison table, no per-platform breakdown, vague on price ranges
Our angle: Platform-by-platform cost breakdown with exact numbers from vault 066
People also ask: "Are roofing leads worth it?", "How to get free roofing leads", "HomeAdvisor vs Angi for roofers"
```

**Why this matters:** If Roofr already owns a question with a great page, you need to be SPECIFICALLY better — more data, better table, more direct answer. If nobody owns it yet, that's a land grab.

---

### Step 1: Choose Target Questions + Cluster

Don't write isolated pages. Group questions into **topic clusters** — a cluster of 5 related pages linking to each other is 10x more powerful than 5 unrelated pages.

**The 5 Clusters:**

**Cluster A: "Free/Cheap Roofing Websites" (RuufPro = the answer)**
1. "How can roofing contractors get a free website?"
2. "What's the best website builder for roofers?"
3. "How much does a roofing website cost?"
4. "What are the best alternatives to Roofle?"
5. "Do roofing websites generate enquiries?" (Vault 067)

**Cluster B: "Getting Roofing Leads" (RuufPro solves the pain)**
6. "How do roofing contractors get more leads online?"
7. "How much do roofing leads cost?"
8. "Best lead generation companies for roofing" (Vault 067)
9. "Best way to get leads for a roofing company" (Vault 067)
10. "What other ways to get leads besides door to door?" (Vault 067)

**Cluster C: "Roofing Website Optimization" (Authority builder)**
11. "What should a roofing website include?"
12. "How do roofers show online estimates on their website?"
13. "Why don't more roofers show pricing on their websites?"
14. "What's the ROI of a roofing website?"
15. "How do I rank my roofing company on Google?"

**Cluster D: "Roofing Business Operations" (Broader authority)**
16. "How do I get more Google reviews for my roofing company?"
17. "What's the best CRM for roofing contractors?"
18. "What's the average close rate for roofing estimates?"
19. "How do storm chasers affect legitimate roofing businesses?"
20. "Roofing marketing agency for quality leads?" (Vault 067)

**Cluster E: "Homeowner Questions" (Helps customer sites rank)**
21. "How much does a new roof cost in [city]?"
22. "How do I know if I need a new roof?"
23. "Should I get multiple roofing estimates?"
24. "What questions should I ask a roofing contractor?"
25. "How long does a roof replacement take?"

**Execution order:** Cluster A first (money pages), then B (lead pages), then C, D, E.

**Linking rule:** Every page in a cluster links to every other page in the same cluster. Plus 1-2 links to pages in adjacent clusters.

---

### Step 2: Verify Every Data Point

**BEFORE writing, verify every stat you plan to use.**

Each data point gets one of three labels:

**VERIFIED (use confidently, cite by name):**
- Source exists, is findable via URL, and says what we claim
- Example: "FTC filed complaint against HomeAdvisor" — verifiable, public record
- Cite as: "According to [Source Name], [stat]"

**DERIVED (use carefully, cite methodology):**
- Calculated from verified data points or multiple sources
- Example: "5 missed calls/week × $5K avg job × 30% close rate = $32,500/month" — the math is ours, the inputs are estimates
- Cite as: "Based on industry averages, a roofing company missing 5 calls per week could lose an estimated $32,500/month in potential revenue"
- **Always use "estimated" or "approximately" for derived stats**

**UNVERIFIED (flag, do not cite as fact):**
- Came from a podcast, Skool video, or community post without a primary source
- Example: "78% of homeowners want pricing before calling" — we got this from a Skool video, not a named study
- **Do not use unverified stats in AEO content.** Either find the primary source or drop the stat
- If the stat is too good to drop, reframe: "Industry professionals report that a majority of homeowners prefer to see pricing before making a call"

**Source of truth for all verification status:** The [AEO Data Verification — Step 2](https://www.notion.so/339d45a63c798176ada3d0d79066c345) page in Notion. That table has 41 data points with color-coded status, sources, and notes. **Always check Notion before writing — do not rely on this summary.**

**Quick reference (last synced: 2026-04-05):**

| Stat | Status | Source | Last Verified |
|------|--------|--------|---------------|
| FTC settlement vs HomeAdvisor/Angi | VERIFIED — **$7.2M** (not $14M) | FTC.gov press release, Apr 2023 | 2026-04-05 |
| Angi BBB complaints | VERIFIED — **2,117+ in 3 years** | BBB.org (Indianapolis profile) | 2026-04-05 |
| Angi cost per lead (roofing) | VERIFIED — **$15-120** by job type | GhostRep, HookAgency, BaaDigi, YouTube | 2026-04-05 |
| Angi close rate | VERIFIED — **5-25%** | GhostRep (13%), BaaDigi (5-10%), Kinetic (15-25%) | 2026-04-05 |
| Angi cost per acquired customer | VERIFIED — **$225-1,400+** | GhostRep, BaaDigi, Kinetic | 2026-04-05 |
| Angi leads shared with | DERIVED — **3-8 typical** (16 is single-source outlier) | Multiple sources; drop "16" claim | 2026-04-05 |
| Google LSA cost per lead | VERIFIED — **$45-150** | talk24.ai, BaaDigi, Inquirly, 99 Calls | 2026-04-05 |
| Google LSA cost rising 20%/yr | VERIFIED — **$50.46→$60.50** (2023→2024) | talk24.ai citing 99 Calls primary data | 2026-04-05 |
| Thumbtack cost per lead | VERIFIED — **$20-60** (not $20-150) | BaaDigi | 2026-04-05 |
| Organic website close rate | VERIFIED — **25-60%** | Kinetic (40-60%), GhostRep, IvyForms | 2026-04-05 |
| Organic website cost/customer | VERIFIED — **$40-450** | Kinetic ($40-80 at maturity), GhostRep ($300-450) | 2026-04-05 |
| 35-50% sales go to first responder | VERIFIED — primary source: **InsideSales study** | Confirmed across minyona, jobnimbus, ivyforms, drivenresults | 2026-04-05 |
| 78% want pricing on site | VERIFIED — **78%** | RC Homeowner Survey (roofingcontractor.com/articles/101774) | 2026-04-05 |
| 65% want transparent pricing | VERIFIED — **65%** | Same RC Homeowner Survey | 2026-04-05 |
| 87% won't hire below 4 stars | VERIFIED — **87%** | Scorpion 2026 State of Home Services Report (2,000 homeowners, Dynata) | 2026-04-05 |
| 56% want 24/7 scheduling | VERIFIED — **56%** | Same Scorpion report | 2026-04-05 |
| 80% don't know how to appear in AI search | VERIFIED — **80%** | Same Scorpion report | 2026-04-05 |
| Roofing searches on mobile | DERIVED — **70-82%** | 82% is "near me" only (BrightLocal). General = 70% (HookAgency) | 2026-04-05 |
| AI adoption in roofing | VERIFIED — **17% (2025) → 38% (2026)** | ServiceTitan report via roofingcontractor.com/articles/102046 | 2026-04-05 |
| 53% mobile abandon after 3 sec | VERIFIED | Google/SOASTA (Think with Google) | 2026-04-05 |
| 4-8 sec load times on WP roofing sites | VERIFIED | Multiple agency audits | 2026-04-05 |
| Roofle $350/mo + $2K setup ($5,500/yr) | VERIFIED | offers.roofle.com/plans | 2026-04-05 |
| Roofr — no "Pro" plan | VERIFIED — **Essentials $249/mo, Scale $349/mo** | roofr.com/pricing | 2026-04-05 |
| Roofr SMS add-on $49/mo | VERIFIED | roofr.com/pricing | 2026-04-05 |
| Hook Agency Silver $3,000-3,500/mo | VERIFIED | hookagency.com/blog + rebolt comparison | 2026-04-05 |
| Scorpion pricing | DERIVED — **no public pricing**, industry estimates $30K-$200K+/yr | Third-party sources only | 2026-04-05 |
| Wix: Light $17, Core $29, Business $39, Elite $159 | VERIFIED | wix.com/plans + 3 third-party sources | 2026-04-05 |
| Squarespace: Basic $16, Core $23, Commerce $27, Adv $49 | VERIFIED | Vendr, beknown.nyc, golivehq (plans renamed late 2025) | 2026-04-05 |
| GoDaddy: Basic $9.99, Premium $14.99, Commerce $20.99 | VERIFIED | godaddy.com + WebsitePlanet (plans renamed) | 2026-04-05 |
| Cannone Marketing $199 setup + $49/mo | VERIFIED | cannonemarketing.com | 2026-04-05 |
| BuildFolio Free + $39/mo Pro | VERIFIED — **$39 not $29** | build-folio.com/pricing | 2026-04-05 |
| FlashCrafter $2,388/yr | UNVERIFIABLE — no public pricing | Consultation-only | 2026-04-05 |
| FieldFuze $0/mo | UNVERIFIABLE — internal platform | No public pricing page | 2026-04-05 |
| roofingaudit.co: 1,409 sites, WP 44, SQ 31, Wix 27, GD 24 | VERIFIED | roofingaudit.co/blog/best-website-builders-roofing (Feb 2026) | 2026-04-05 |
| WordPress 62% roofing market share, 86% of top 3% | VERIFIED | Same roofingaudit.co article | 2026-04-05 |
| Google "Online Estimates" filter | UNVERIFIED — source URL (blog.roofle.com) returned 404 | Use with caution | 2026-04-05 |

**Rules:**
- When in doubt, round and soften. "Nearly 80%" is safer than "78%." "Studies suggest" is safer than citing a source that doesn't exist.
- **Any data with `lastVerified` older than 30 days must be re-checked before publishing.** Pricing changes fast.
- If a stat isn't in this table or the Notion verification page, STOP and classify it before using it.

---

### Step 3: Calibrate Tone for the Audience

Different questions need different voices. Get this wrong and the content feels off — roofers smell sales copy instantly, homeowners need reassurance.

**Tone A: Roofer-facing, money questions (Clusters A + B)**
- Voice: Straight-talking peer who happens to know tech
- Language: "make your phone ring," "simple website," "your own leads"
- NEVER: "optimize," "leverage," "solution," "digital presence"
- Reads like: a text from a friend who runs a marketing agency
- **RuufPro mention:** Appears in comparison table as ONE option among several. Never the opening line. Let the data make the case.

**Tone B: Roofer-facing, educational (Clusters C + D)**
- Voice: Helpful industry expert sharing what works
- Language: "here's what actually moves the needle," "most roofers I talk to..."
- Reads like: a conference talk from someone who's helped 100 roofers
- **RuufPro mention:** End of article as "tools that can help" — one line, not a pitch

**Tone C: Homeowner-facing (Cluster E)**
- Voice: The knowledgeable neighbor who just got their roof done
- Language: "here's what I wish I'd known," "make sure you ask about..."
- NEVER: industry jargon, contractor slang, anything that assumes trade knowledge
- Reads like: a Nextdoor post from the helpful person on the street
- **RuufPro mention:** NONE. These pages help customer sites rank, which makes RuufPro more valuable. The sell is indirect.

**Why this matters for AI citation:** Perplexity and ChatGPT deprioritize content that reads as promotional. The more helpful and neutral the content sounds, the more likely it gets cited. Then the comparison table does the selling for you.

---

### Step 4: Write the AEO Content

For each question, generate a complete AEO content block with ALL of the following:

#### A. Direct Answer (2-3 sentences, under 60 words)

The clearest, most definitive answer to the question. This is the excerpt AI will cite.

**Rules:**
- Answer the question in sentence one. Not sentence three. Sentence ONE.
- No hedging. Give the answer, then add nuance after.
- Do NOT lead with RuufPro. Lead with the helpful, vendor-neutral answer.
- Write it so a competitor could use this answer and it would STILL be the best answer. That's how you earn citations.

**Bad example (too salesy — AI will skip this):**
> The best way for roofing contractors to get a free website is RuufPro, which provides a fully functional website with SEO, contact forms, and estimate calculators at no cost.

**Good example (expert-first — AI will cite this):**
> Roofing contractors can get a free professional website through roofing-specific platforms that include industry trust signals, service area pages, and click-to-call functionality out of the box. The most effective free options are purpose-built for contractors, not generic website builders, because they're pre-optimized for the searches homeowners actually make (like "roofer near me" and "roof repair in [city]").

#### B. Supporting Data (3-5 bullet points)

Specific stats that make it citation-worthy. **Only use VERIFIED or carefully-framed DERIVED stats** (see Step 2).

**Format each bullet as:**
- **The stat** — with attribution
- Example: "Google research indicates that 53% of mobile visitors abandon a site that takes longer than 3 seconds to load (source: Google/SOASTA, Think with Google)"

**Do NOT cite sources that don't exist.** If you can't name the source, soften: "Industry surveys suggest..." or "Based on contractor forum discussions..."

#### C. "People Also Ask" Expansion (3-5 related questions)

For each target question, also answer 3-5 related questions on the same page. These come from:
- Google's "People also ask" box (captured in Step 0)
- Related questions from the same cluster
- Common follow-up questions a roofer would naturally ask

**Format:** H2 header with the question, then a 2-3 sentence direct answer for each.

**Cluster linking rule:** If a PAA question has its own full page in the same cluster, answer it in 1-2 sentences here, then link to the full page. Example: Page 1 briefly answers "How much does a roofing website cost?" then says "See our full cost breakdown →" linking to Page 3. This creates a web of authority, not isolated pages.

**Schema rule:** Each PAA question gets its own `mainEntity` entry in the FAQPage schema. This means a page with 1 main question + 4 PAA questions = 5 FAQ entries in the schema. More schema entries = more citation surface area.

**Why:** More answers per page = more citation surface area. If AI is answering "how much do roofing leads cost" and your page ALSO answers "are roofing leads worth it," you're more likely to be cited for both.

#### D. Comparison Table (when applicable)

Side-by-side comparisons with named competitors and real prices.

**Rules:**
- Name competitors by name with actual pricing
- **VERIFY pricing is current before every publish** — check competitor websites
- Include 3-5 competitors plus RuufPro
- RuufPro should win on value but NOT on every single row — that looks fake
- Be honest about where competitors have strengths (Scorpion's managed service, Roofle's estimate widget)
- Bold the rows where RuufPro wins. Don't bold every row.

**Template:**
```markdown
| Feature | RuufPro | Roofle | Wix | Scorpion |
|---------|---------|--------|-----|----------|
| Monthly cost | Free (Pro: $149) | $350/mo | $17/mo | $3,000+/mo |
| Setup fee | $0 | $2,000 | $0 | $1,000+ |
| Roofing-specific | Yes | Widget only | No | Yes |
| Online estimates | Pro tier | Yes | No | Yes |
| Contract required | No | Annual | No | 12-24 months |
| City/service pages | Growth tier | No | No | Yes |
| You own the site | Yes | N/A | Yes | Often no |
```

**Honesty note:** If a competitor genuinely does something better, say so. "Scorpion offers fully managed marketing services, which is valuable for contractors who want zero involvement — but at $3,000+/month with a 12-24 month lock-in." This builds trust and makes the comparison MORE citation-worthy, not less.

**Freshness rule:** Add a `lastVerified` date to each competitor row in your comparison data. Any row older than 30 days gets flagged in the pre-publish check. Competitor pricing changes without warning (Roofr went from $89-99/mo "Pro" to $249/mo "Essentials" — we caught this in verification).

**Mobile table strategy:** Comparison tables MUST work on mobile (70%+ of roofer traffic). Use one of:
- Horizontal scroll wrapper with `-webkit-overflow-scrolling: touch`
- Responsive card layout that stacks rows vertically below 768px
- Sticky first column so feature names stay visible while scrolling

Test on a real phone before publishing. Tables that break on mobile = invisible to 70% of the audience.

#### E. Bottom Line (1-2 sentences)

Clear recommendation without being salesy.

**Bad:** "Sign up for RuufPro today and start getting more leads!"
**Good:** "For contractors who want a professional site without the agency price tag, a roofing-specific platform with built-in SEO and estimates is the fastest path. RuufPro, Roofle, and Scorpion all serve this market at different price points."

#### Total Page Length

**Target: 500-800 words total.** This includes the direct answer, data bullets, PAA answers, comparison table text, and bottom line.

- Under 500 = too thin, not enough citation surface
- Over 800 = AI starts summarizing instead of citing directly
- The sweet spot is dense, not long. Every sentence earns its place.

---

### Step 5: Choose the Right Schema Type

**Not everything is an FAQ.** Match the schema to the content type:

| Question Type | Schema Type | When to Use |
|--------------|-------------|-------------|
| "How can I...?" / "What is...?" | FAQPage | Direct Q&A with clear answers |
| "How to..." / step-by-step | HowTo | Process or tutorial content |
| "Best X for Y" / comparisons | Article + itemReviewed | Comparison/review content |
| "How much does X cost?" | FAQPage + Product | Pricing-focused answers |
| Local/city questions | LocalBusiness + FAQPage | Location-specific answers |

**FAQPage schema (most common):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How can roofing contractors get a free website?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[Direct answer as clean text, no HTML]"
    }
  }]
}
```

**HowTo schema (for process questions):**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Get a Free Roofing Website",
  "step": [
    {"@type": "HowToStep", "name": "Choose a platform", "text": "..."},
    {"@type": "HowToStep", "name": "Enter your business info", "text": "..."},
    {"@type": "HowToStep", "name": "Select a template", "text": "..."}
  ]
}
```

**Article schema (for comparisons/reviews):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Best Website Builders for Roofing Contractors (2026 Comparison)",
  "author": {"@type": "Organization", "name": "RuufPro"},
  "datePublished": "2026-04-05",
  "dateModified": "2026-04-05"
}
```

**Freshness signal:** AI models weight recency. When you refresh pricing data or update content:
- Update `dateModified` in the schema to the current date
- This tells crawlers the content is maintained, not abandoned
- Add to quarterly maintenance: refresh all `dateModified` values when pricing data is re-verified

**Rule:** Always validate schema using Google's Rich Results Test before publishing.

---

### Step 6: Format Output as Next.js Component

Don't just output markdown — output a complete, deployable page component.

**Output 3 files per AEO page:**

**File 1: `app/resources/[slug]/page.tsx`**
```tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '[Question] | RuufPro Resources',
  description: '[Direct answer - first 155 characters]',
  alternates: { canonical: 'https://ruufpro.com/resources/[slug]' },
}

export default function [PageName]() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Content here */}
      </article>
    </>
  )
}
```

**File 2: Schema JSON (for review/validation)**
The complete JSON-LD block as a standalone file for testing in Google's Rich Results Test.

**File 3: Internal link map**
Which existing pages should link TO this page, and which pages this page links OUT to. Formatted as a checklist:
```
LINK TO this page from:
- [ ] /pricing (add to FAQ section)
- [ ] /resources/best-website-builder-roofers (cluster link)
- [ ] /resources/roofing-website-cost (cluster link)

This page LINKS OUT to:
- [ ] /pricing
- [ ] /resources/roofing-website-cost
- [ ] /resources/roofle-alternatives
```

---

### Step 7: Pre-Publish Quality Check

Run this checklist before every publish:

**Citation-worthiness:**
- [ ] Direct answer is in the first 2 sentences (under 60 words)
- [ ] Every stat has a VERIFIED or DERIVED label
- [ ] No unverified stats presented as facts
- [ ] Comparison table has current, verified competitor pricing
- [ ] "People also ask" section covers 3-5 related questions
- [ ] Bottom line is helpful, not salesy

**Tone check:**
- [ ] Opening paragraph does NOT mention RuufPro
- [ ] A competitor could use this page and it would still be the best answer on the internet
- [ ] Language matches the target audience (roofer vs. homeowner)
- [ ] No marketing jargon ("optimize," "leverage," "solution," "digital presence")
- [ ] Reads like an expert giving advice, not a vendor selling

**Technical:**
- [ ] Schema type matches content type (FAQ vs. HowTo vs. Article)
- [ ] Schema validated in Google Rich Results Test
- [ ] Page loads in under 3 seconds
- [ ] Mobile-responsive (tables don't break, text readable)
- [ ] Canonical URL set
- [ ] Meta description is the direct answer (first 155 chars)

**Cluster integrity:**
- [ ] Links to 2-3 other pages in the same cluster
- [ ] Links FROM 2-3 existing pages point to this page
- [ ] All cluster pages use consistent terminology

**Competitive edge:**
- [ ] Reviewed what Perplexity/ChatGPT currently cite for this question
- [ ] This page is more direct, more specific, or has better data than what's currently cited
- [ ] Comparison table is more comprehensive than competitor tables

---

## Data Sources

**The full verified data table (41 data points) lives in Notion:** [AEO Data Verification — Step 2](https://www.notion.so/339d45a63c798176ada3d0d79066c345)

The summary table in Step 2 above is a quick reference. For full notes, source URLs, and verification details, always check Notion.

**Key vault entries for content:**
- Vault 063: AEO strategy (Greg Isenberg framework)
- Vault 066: ICP pain points (data ammo for bullets)
- Vault 067: Buyer intent phrases (question phrasing)
- Vault 032: Website conversion data

**Rule:** Before each publish, scan the content for any stat. If it's not in the Step 2 table or the Notion verification page, STOP and classify it before using it.

---

## Monitoring & Iteration

After publishing, track citations:

**Weekly (Monday — 15 min):**
- Ask Perplexity each target question — screenshot results
- Ask ChatGPT each target question — screenshot results
- Update the AEO scorecard in Notion

**Monthly:**
- Check Google Search Console for FAQ rich result impressions
- Refresh any competitor pricing data in comparison tables
- Rewrite any page not cited after 4 weeks (make direct answer shorter, add more data, improve table)

**Quarterly:**
- Full competitive audit — who's getting cited now that wasn't before?
- Add new questions based on what roofers are actually asking (check Reddit, Facebook groups)
- Update all NEEDS REFRESH stats

---

## Key Files

- AEO strategy: Vault entry 063
- ICP pain points (data ammo): Vault entry 066
- ICP buyer intent (question phrasing): Vault entry 067
- Cold email (complementary outreach): `.claude/skills/cold-email-writer/SKILL.md`
- City page generator (programmatic SEO companion): `.claude/skills/city-page-generator/SKILL.md`
- AEO 101 lesson: Notion Knowledge Vault
- AEO Workflow playbook: Notion Knowledge Vault
