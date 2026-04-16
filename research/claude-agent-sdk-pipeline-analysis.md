# Claude Agent SDK — Pipeline Analysis for RuufPro

> Research date: 2026-04-15
> Question: Could the Agent SDK replace/augment our lead scraping + website generation pipeline?

## What IS the Claude Agent SDK?

- **Real, shipped product** — not beta/preview
- Python + TypeScript SDKs, actively maintained
- Gives you the Claude Code agent loop as a library
- Claude executes tools directly (Read, Write, Bash, WebFetch, Grep, etc.)
- You don't implement the tool loop — the SDK handles it automatically
- MCP integration lets you plug in browsers, databases, APIs

## How It Differs from Raw Claude API

| Aspect | Claude API (what we use now) | Agent SDK |
|--------|------------------------------|-----------|
| Tool loop | We implement (parse response, execute, feed back) | SDK handles automatically |
| Built-in tools | None — we define everything | 10+ ready to use |
| Error handling | Manual retry logic | Built-in retries + backoff |
| Sessions | Manual context management | Auto context + resume |
| File checkpointing | Not possible | Rewind files to any point |
| Subagents | Must manually orchestrate | Built-in agent spawning |
| MCP | Manual integration | Plug and play |

## Our Current Pipeline (v3)

```
[1] SCRAPE ──────── Google Places API (dry run → confirm → insert)
         │
[2] AUTO-ENRICH ── Inngest batch-auto-enrich (concurrency: 1)
    ├── Google Photos + Reviews ($0.017/lead)
    ├── Facebook (Apify, best-effort)
    ├── Email extract (regex from FB about)
    ├── Apollo email enrichment (1 credit/lead)
    ├── FL License lookup (DBPR scrape)
    ├── AI Rewrite (Claude Haiku, ~$0.01/lead)
    └── Build Sites (insert DB row, random slug)
         │
[GATE 1] ────────── Human reviews sites in ops dashboard
         │
[3] AUTO-SEND ──── Instantly campaign + Slack notification
         │
[GATE 2] ────────── Human approves reply drafts
```

**Files involved:** 12 API routes, 6 Inngest functions, ~15 lib files, ops dashboard page + 5 components

### What Works Well
- Deterministic, predictable
- Each step has clear cost/timing
- Spending guards prevent runaway costs
- Two human gates before anything gets sent
- Auto-refresh polling (60s) keeps dashboard current

### What Doesn't Work Well
- **Rigid** — every lead goes through identical steps regardless of quality
- **Dumb** — can't skip enrichment for leads that obviously won't convert
- **Blind** — doesn't look at the roofer's actual website quality, just checks "has website" boolean
- **Fragile** — if one enrichment step fails, entire chain stalls
- **Verbose** — 12 API routes + 6 Inngest functions for what's conceptually simple

## Question 1: What Can the Agent SDK Actually Do?

**Built-in tools:**
- Read/Write/Edit files
- Bash (run scripts, curl APIs)
- WebFetch (fetch and parse web pages)
- WebSearch ($0.01/search)
- Glob/Grep (find files by pattern/content)

**Via MCP:**
- Playwright (browse + scrape websites)
- Firecrawl (scrape + crawl)
- Supabase (direct DB access)
- Any custom MCP server

**Key capabilities:**
- Multi-step reasoning (decide what to do next based on what it finds)
- Subagent spawning (parallelize independent tasks)
- Session resume (pick up where you left off)
- File checkpointing (undo changes if something goes wrong)

## Question 2: Could an Agent Handle Scrape→Enrich→Build?

### What an Agent COULD Do Better

**1. Intelligent Filtering (the big win)**
Current pipeline: scrape 100 leads → enrich ALL 100 → build ALL 100 sites
Agent pipeline: scrape 100 leads → LOOK at each one → skip 40 that already have good sites → enrich the 60 worth pursuing

The agent could WebFetch a roofer's existing site and make a judgment:
- "This site is professional, skip them"
- "This site is a basic Wix page, they're a good prospect"
- "No website at all — highest priority"
- "5,000+ reviews, they're too big for us"

**2. Smarter Enrichment**
Instead of always running Apollo → Facebook → FL License in fixed order:
- "No email found via Apollo, but their Facebook has a contact form — try that"
- "Their Google reviews mention 'family-owned since 2015' — use that in the pitch"
- "Their license is expired — flag for skip"

**3. Better Site Building**
Instead of template fill with AI-rewritten text:
- "This roofer specializes in tile roofs — emphasize that in hero"
- "They have great photos — feature those prominently"
- "They're in a hurricane zone — add storm damage language"

**4. Adaptive Email Copy**
Instead of one-size-fits-all email template:
- "This roofer has no reviews — lead with 'we help you get reviews'"
- "This roofer has 200 reviews but a bad website — lead with 'your reviews are great, your site isn't'"

### What an Agent Should NOT Do

- **Send emails** — still needs human gate
- **Make spending decisions** — spending guards must remain deterministic
- **Replace the ops dashboard** — Hannah needs to see pipeline state
- **Handle rate limiting** — deterministic code is better for API quotas

## Question 3: Tradeoffs

| Factor | Current (Inngest) | Agent SDK |
|--------|-------------------|-----------|
| **Cost per lead** | ~$0.08 (APIs + Haiku) | ~$0.10-0.15 (more reasoning tokens) |
| **Speed** | ~2-3 min/lead (sequential) | ~3-5 min/lead (more analysis) |
| **Reliability** | High (deterministic) | Medium (LLM can hallucinate) |
| **Control** | Full — every step is code | Partial — agent decides some steps |
| **Intelligence** | Zero — same steps for every lead | High — adapts per lead |
| **Debugging** | Easy — check each API route | Harder — agent reasoning is opaque |
| **Scalability** | Good — Inngest handles queuing | Unknown — session limits unclear |
| **Cost ceiling** | Predictable ($X per batch) | Less predictable (varies by reasoning) |

### Real Risks
1. **Token burn** — agent might "think" too much about simple leads
2. **Hallucination** — agent might invent details about a roofer
3. **Inconsistency** — same input could produce different output
4. **Debugging** — harder to trace why agent made a decision
5. **Cost creep** — more tokens = more money, harder to cap

## Question 4: Decisions an Agent Could Make That Pipeline Can't

| Decision | Current Pipeline | Agent Could |
|----------|-----------------|-------------|
| "This roofer's site is already professional" | Can't — doesn't look | WebFetch site, evaluate quality, skip |
| "No photos exist, use stock for their roof type" | Can't — uses whatever photos enrichment found | Analyze services, pick matching stock |
| "This roofer is too big for us" | Basic filter (review count) | Analyze team size, service area, pricing |
| "Lead with storm damage copy for this area" | Can't — same template | Check location, recent weather, adapt |
| "Their Facebook page is more active than their website" | Can't — enriches both blindly | Compare presence, choose outreach angle |
| "This roofer already uses Roofle — hard sell" | Can't detect | WebFetch site, detect competitor widgets |
| "This review mentions they're retiring" | Can't read reviews contextually | NLP on reviews, flag or skip |

## Question 5: Minimal Experiment

### The Test: "Smart Triage Agent"

**Don't replace the pipeline. Add an agent BEFORE Gate 1.**

```
Current:  Scrape → Enrich → Build Sites → [GATE 1: Review Sites] → Send
Proposed: Scrape → Enrich → Build Sites → [AGENT: Triage] → [GATE 1: Review Sites] → Send
```

**What the agent does:**
1. Takes a batch of built sites (post-build, pre-gate)
2. For each prospect:
   - WebFetch their real website (if exists)
   - Read the built preview site
   - Check Google reviews for red flags
   - Score: Gold / Silver / Skip
   - Write a 1-line reason ("great prospect — no site, 4.8 stars, FL licensed")
3. Saves scores + reasons to `prospect_pipeline.agent_triage_score` and `agent_triage_reason`
4. Hannah sees scores in Gate 1 — approve/reject faster

**Why this is the right test:**
- No risk — agent can't send anything
- Adds intelligence without removing control
- Uses existing pipeline + data (no new APIs)
- Measures: does the agent's Gold/Silver/Skip match Hannah's actual approvals?
- If it works, gradually let agent make more decisions

**Implementation:**
- New API route: `POST /api/ops/agent-triage`
- Uses Agent SDK with WebFetch + Read tools
- Supabase MCP for writing scores
- ~$0.02-0.05/lead (Haiku reasoning tokens)
- Show scores as chips in SiteReviewPanel

**Timeline:** 1 session to build, 1 batch to validate

## Recommendation

**Don't replace the pipeline. Augment it.**

The current Inngest pipeline is deterministic, predictable, and debuggable. Those are features, not bugs. The Agent SDK's strength is intelligence and adaptability — not reliability.

**Phase 1 (now):** Smart Triage Agent before Gate 1
- Agent scores leads, Hannah still approves
- Validates agent judgment against Hannah's decisions
- Zero risk to existing pipeline

**Phase 2 (after 2+ batches validated):** Smart Enrichment
- Agent decides which enrichment steps to run per lead
- Skip Facebook for leads with good Google presence
- Skip Apollo for leads with email already on their site
- Saves ~30-40% on enrichment costs

**Phase 3 (after 5+ batches):** Smart Site Builder
- Agent customizes site copy based on prospect profile
- Different hero headlines for different prospect types
- Better photos/content selection

**Never:** Let agent send outreach without human gate.
