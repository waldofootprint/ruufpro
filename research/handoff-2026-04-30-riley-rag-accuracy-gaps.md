# Handoff — Riley RAG accuracy gaps (next session)

**Date:** 2026-04-30
**Branch:** main (after `7a43113`)
**Why:** During testing of the new Source Website URL field, Riley returned wrong / incomplete answers on a real contractor site. Three test questions exposed the same patterns. Worth a dedicated session before any paying customer onboards.

---

## Test setup (still loaded — do not scrub before next session)

- **Contractor:** SunCoast Roofing test account (`f0e73bee-6946-4083-985a-39cc466d8703`, slug `suncoast-roofing`)
- **Trained on:** `https://strongroofingsrq.com` (Strong Roofing, Sarasota FL — real public site, NOT SunCoast's actual data)
- **State in DB:**
  - `chatbot_config.source_website_url` = `https://strongroofingsrq.com`
  - `chatbot_knowledge_chunks` = **42 chunks** indexed (last write 2026-04-30 17:36 UTC)
  - `chatbot_knowledge_crawl_jobs` = 2 completed (13/13 pages each)
  - `contractors.phone` = `(813) 555-2847` (seeded test placeholder — NOT Strong Roofing's real number)
  - `contractors.city` = `Tampa` (Strong Roofing is actually in Sarasota — mismatch is intentional for testing)
  - `chatbot_config.team_description / differentiators / warranty_description / etc.` = NULL (full-site crawl populates RAG chunks but does NOT fill structured chatbot_config fields — those only fill via the URL re-scan modal review step)
  - `contractors.has_ai_chatbot` = `false` (Riley toggle off; Test Riley button still works)

Login as `waldo12397+riley-test@gmail.com` / `RileyTest2026!` to resume.

---

## What Hannah asked, what Riley said, ground-truth check

### Q1: "What's your phone number?" (implied, via earlier test)
**Riley:** "(813) 555-2847"
**Truth on site:** Different number entirely.
**Cause:** Riley's system prompt pulls phone from `contractors.phone` column, NOT from RAG. Structured field beats RAG for "factual" identifiers. On a real account this wouldn't matter (their row would be correct), but it exposes a hierarchy assumption: structured > scraped > RAG. Question is whether that hierarchy is right when scraped data EXPLICITLY contradicts the structured field.

### Q2: "What roofing services do you offer?"
**Riley:** "We offer roof inspections, repairs, and full replacements. Our team handles various roofing types..."
**Truth on site:**
- Roof types: shingle, tile, metal, flat (specializes in flat)
- Services: repair, replacement, remodeling, inspection — **residential AND commercial**
- Specialty: gutters ("Gutters by Strong"), storm damage, insurance inspections, leak repair, roof coatings
**Cause:** RAG retrieved 1-2 chunks (probably FAQ or hero) and synthesized the lowest-common-denominator answer. Did NOT pull services-page chunks. Top-k probably too low OR chunks too coarse to match query intent.

### Q3: "Do you work in Venice?"
**Riley:** "We're based in Tampa, FL and serve the Tampa area. I don't have details on whether we reach Venice specifically..."
**Truth on site:** Venice is explicitly listed in service areas.
**Cause:** Two failures stacked.
1. **"Based in Tampa"** = `contractors.city` field, contradicts the actual scraped site (Sarasota)
2. **"I don't have details... Venice"** = RAG didn't retrieve the service-areas chunk despite a clear keyword match

### Q4: Warranty (asked earlier, evaluated as roughly accurate)
Riley correctly punted on specifics. Site genuinely has no warranty terms. ✅

### Q5: "Do you give free estimates?" — Riley leaned toward the calculator (Hannah flagged this as wrong default)
**Riley:** Drove the homeowner toward the free calculator/estimator widget for an instant ballpark.
**Hannah's read:** Wrong default. Calculator-first leaks scheduled appointments — homeowner gets a number and ghosts.
**Claude's call:** Hannah is right. Riley should default to scheduling a real on-site appointment. Calculator should be a soft fallback only.

**Why scheduling > calculator-first:**
1. **"Free estimate" = on-site consultation in the trades.** Homeowner expectation. Delivering a calculator output is bait-and-switch by industry vernacular.
2. **High-ticket consultative sales rule: never price without scope.** Roof = $10–30k decision. Calculator outputs guess off sqft + material; real quote varies by deck, vent, flashing, layers, code, pitch access. Giving a number first anchors the buyer against the eventual real quote → roofer defending price instead of presenting value → margin killer.
3. **Calculator-as-default sorts for the wrong buyer segment.** Hot leads (roof leaking) want a human, not a form. Warm leads (3-quote shoppers) use the calc to compare *against* the roofer. Cold leads (research mode) ARE who calculator captures, but they're the lowest-value segment. Riley deflecting to calc converts cold > hot — backwards.
4. **The roofer pays $149/mo for booked appointments, not lead-gen vanity metrics.** Calculator engagement that doesn't convert to an appointment undermines RuufPro's actual value-to-the-buyer (the contractor).

**Recommended Riley behavior:**
- **Default response:** "Yes — totally free, no obligation. Our team comes out and gives you an exact number. What day works to have someone stop by?"
- **Calculator soft fallback** only when: homeowner explicitly asks for a price/ballpark, pushes back on scheduling, or signals research mode
- **Frame calculator as complement, not replacement:** "We can give you a quick ballpark from our calculator while you wait for the real quote — want me to send the link?"

**Where to fix:** `lib/chat-system-prompt.ts`. Currently the prompt likely encourages calculator usage as a primary CTA. Reframe to:
- Primary CTA = schedule appointment (capture name + phone + preferred time window)
- Secondary CTA = calculator link, only when buyer resists the appointment ask
- NEVER promise an exact number without an inspection

---

## Pattern (3 of 3 questions hit some flavor of this)

| Failure mode | Frequency | Fix surface |
|---|---|---|
| Structured field overrides accurate RAG | 2/3 | `lib/chat-system-prompt.ts` source-of-truth hierarchy |
| RAG retrieved too few / wrong chunks | 2/3 | Top-k, embedding model, chunking strategy |
| Hand-wavy "various types" instead of listing | 1/3 | System prompt phrasing OR retrieval breadth |
| Calculator-first instead of scheduling-first on "free estimate" Qs | 1/1 | System prompt CTA hierarchy |

---

## Likely root causes (ranked)

### 1. Top-k too low for catalog/list queries
Service lists, area lists, materials lists need MORE chunks than the default top-k probably allows. A "what services do you offer" query should pull every services-page chunk, not just the 2 closest. Check whatever k value `lib/chat-rag.ts` (or wherever retrieval lives) uses.

### 2. Chunking too coarse OR too fine
42 chunks for 13 pages = ~3 per page. If service lists span chunk boundaries, no single chunk contains the full list and retrieval can't reassemble. Inspect a few chunks via Supabase to see what they actually contain.

### 3. System prompt prioritizes structured > RAG
`contractors.phone` and `contractors.city` are treated as authoritative even when scraped data contradicts. Real roofers' rows will mostly match their sites, so this is fine in production — BUT the prompt should defer to RAG for **service areas** (often broader than base city) and at minimum flag conflicts rather than confidently asserting the structured field.

### 4. Synthesis bias toward short, conversational answers
Riley's tone rule may be steering her away from comprehensive answers. "Various roofing types" instead of "shingle, tile, metal, and flat" reads like a synthesis instruction, not a retrieval failure.

---

## Concrete next-session todos

1. **Read `lib/chat-system-prompt.ts` + RAG retrieval** — locate top-k, find structured-field references in the system prompt, find chunk-formatting code
2. **Inspect actual chunks** for Strong Roofing — `SELECT id, page_url, length(content), content FROM chatbot_knowledge_chunks WHERE contractor_id = 'f0e73bee-6946-4083-985a-39cc466d8703' ORDER BY page_url, id`
3. **Pick ONE fix to try first** — recommend bumping top-k to 8-10 for the lowest-effort biggest-signal change. Re-run the same 3 questions.
4. **Decide source-of-truth hierarchy for service area** — should `contractors.city` win, or should scraped service-areas list win?
5. **Probe questions Hannah didn't get to** — owner name (likely hallucinated), insurance work (RAG should hit), licensing, financing (likely fabricated partner), pricing (should deflect), BBB rating (should deflect), leak emergency (real conversion test)
6. **Set up a real eval** — these 10 probe questions become a regression set. Re-run after each fix. Don't ship Riley to paying customers without ≥80% accuracy on probe set.

---

## Out of scope for next session (don't drift)

- Don't touch onboarding flow
- Don't redesign the Riley tab beyond what 2026-04-30 just shipped
- Don't try to fix all 3-4 root causes at once — one change, re-test, learn
- Don't scrape a different site for testing — keep Strong Roofing as the baseline so before/after is comparable

---

## Files likely involved

| File | Why |
|---|---|
| `lib/chat-system-prompt.ts` | System prompt — structured field references, formatting rules |
| `lib/chat-rag.ts` (or similar) | Top-k, embedding query, similarity threshold |
| `lib/inngest/functions.ts:2140-2350` | Chunking logic in `chunk-and-embed-page` |
| `app/api/chat/[contractorId]/route.ts` (or chat handler) | Where retrieval + system prompt come together |

---

## Opening prompt for next session

```
Read research/handoff-2026-04-30-riley-rag-accuracy-gaps.md. Then read
lib/chat-system-prompt.ts and the chat retrieval code. Tell me which of the 4
ranked root causes you'd attack first and why — but don't change anything yet.
```
