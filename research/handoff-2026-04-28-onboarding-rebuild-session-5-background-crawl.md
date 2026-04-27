# Onboarding Rebuild — Session 5 Handoff: Background Full-Site Crawl + RAG

---

## ▶️ COPY-PASTE PROMPT FOR NEXT SESSION

```
Pick up onboarding rebuild session 5 — background full-site crawl + RAG.

Hannah's directive (locked 2026-04-27): accuracy over speed. Crawl every page
of the roofer's site, not just 3-8 keyword-matched ones. RAG retrieval at
chat time so Riley knows everything the site knows.

Read these in order:

1. research/handoff-2026-04-28-onboarding-rebuild-session-5-background-crawl.md
   — full source of truth (architecture, schema, 8-step plan, cost math)

2. research/handoff-2026-04-27-onboarding-rebuild-session-4.md
   — what session 4 shipped (narrow Firecrawl crawler, replaces Playwright)

3. Memory entries:
   - project_onboarding_rebuild_progress.md — should be SHIPPED at session 4 prod hash
   - project_riley_training_gaps_2026-04-27.md — gap this session closes
   - project_riley_test_account.md — E2E test account creds
   - project_chat_request_inspection_blocks_deploy.md — park ritual (still active)
   - feedback_test_on_deploy_not_localhost.md — verify on a Vercel deploy
   - feedback_verify_branch_vs_live_prod_before_deploy.md — pre-deploy gate
   - feedback_always_ask_deploy_after_commit.md — confirm before every prod deploy
   - feedback_no_customer_calls.md — anything that requires a call gets killed

Verify before starting:
- Branch = feature/onboarding-rebuild OR fresh branch off main
- Live prod = the deploy hash listed in project_onboarding_rebuild_progress.md
- npx tsc --noEmit returns clean
- Session 4 narrow crawl still works in prod (not broken since)

Pre-flight Hannah-decisions to confirm BEFORE writing any code:

A) Voyage AI account exists and VOYAGE_API_KEY is set in Vercel env
   (or pivot to OpenAI text-embedding-3-small if Hannah picks differently)
B) FIRECRAWL_WEBHOOK_SECRET set in Vercel env (openssl rand -hex 32)
   AND configured in Firecrawl dashboard webhook settings pointing at
   https://ruufpro.com/api/firecrawl/webhook
C) pgvector extension confirmed enabled in Supabase prod
   (CREATE EXTENSION IF NOT EXISTS vector;)
D) Firecrawl plan can absorb full-site crawls
   (Hobby = ~60 onboardings/mo, Standard = ~2000)
E) Hannah's answers to the 5 questions at the bottom of the handoff:
   - Voyage vs OpenAI vs Cohere
   - Firecrawl plan tier
   - Webhook URL: prod-only or also preview/dev
   - Source attribution in Riley replies: inline visible or hidden
   - Re-crawl cadence: manual-only or auto-weekly

If ANY of A-E is missing or unanswered, STOP and ask. Do not proceed.

Execute the 8 steps in handoff order:
  Step 1: schema + pgvector migration (~30 min)
  Step 2: Firecrawl async trigger endpoint (~30 min)
  Step 3: webhook receiver with signature verification (~1.5 hr)
  Step 4: Inngest chunk + embed pipeline (~1.5 hr)
  Step 5: RAG retrieval in lib/chat-system-prompt.ts (~2 hr)
  Step 6: dashboard UI banner with status polling (~2 hr)
  Step 7: garbage filter ratchet — empirical, after step 8 starts (~2 hr)
  Step 8: end-to-end test with 3 real roofer sites (~2 hr)

Hard rules:
- DO NOT rip out the narrow synchronous crawler from session 4. Both coexist:
  narrow = onboarding pre-fill, background = chat-time knowledge.
- Park lib/chat-request-inspection.ts to .tmp/parked/ before any deploy;
  restore immediately after.
- Stop and ask before any vercel --prod --force. Show parity diff first.
- After each step ships, commit and ask if Hannah wants to deploy
  (memory feedback_always_ask_deploy_after_commit.md).
- If any step takes >2× the estimate, stop and report.
- E2E test (step 8) must run on a deployed URL, not localhost
  (memory feedback_test_on_deploy_not_localhost.md).

Total estimated wall time: 1.5-2 days. If running long, ship behind a
feature flag (chatbot_config.background_crawl_enabled boolean) so prod
roofers don't see half-built UI.

Auto mode is on (or off — check at session start).
```

---



**Continuing from:** `research/handoff-2026-04-27-onboarding-rebuild-session-4.md` + session 4 commit `df93825` (Firecrawl REST replaces Playwright in URL crawler — narrow 3-subpage crawl, ships and works)

**Hannah's directive (2026-04-27):** "I don't want speed I want accuracy. I want what's best for the business which is crawling every page. Most roofers don't have blogs anyway."

**Branch to start from:** `feature/onboarding-rebuild` (or branch off main once §6.12 merges)

**Estimated effort:** 1.5–2 days focused. Real-world: 11–12 hr core + ~6–8 hr debugging/edge cases.

---

## What this replaces

The current crawler (`tools/crawl-roofer-site.mjs`) does a narrow synchronous crawl during onboarding: home + 3 subpages matched by keyword regex. Misses anything not labeled `about/services/faq`. Misses locations entirely on Baker-style sites. Riley only knows what fits in those 4 pages.

After session 5: onboarding stays fast (current narrow crawl runs first for the **immediate** pre-fill). After "Open dashboard," a background job spiders the **whole site** (50–100 pages), embeds every chunk, and Riley does RAG retrieval at query time. Riley knows everything the site knows, regardless of menu labels.

---

## TL;DR architecture

```
[Onboarding: Screen 2 URL crawl]    ← unchanged from session 4
        │
        │  fast 3-page Firecrawl /scrape, populates form
        ▼
[Screen 4: Open dashboard]
        │
        ├──> Stripe trial fires (existing)
        │
        └──> POST /api/onboarding/full-crawl
                  │
                  ▼
             Firecrawl /v1/crawl  (async, returns jobId)
                  │
                  │  spiders whole site in 2–10 min
                  ▼
             Firecrawl webhook → POST /api/firecrawl/webhook
                  │
                  ├──> store each page's markdown
                  ├──> chunk into ~500-token pieces
                  ├──> embed each chunk (Voyage or OpenAI)
                  └──> insert into chatbot_knowledge_chunks (pgvector)

[Riley chat at runtime]
        │
        │  user asks question
        ▼
   embed question → pgvector similarity search → top-3 chunks
        │
        └──> inject chunks + source URLs into Riley's system prompt
```

---

## Pre-flight checks before starting

Run these and resolve before any code:

1. **pgvector extension** — confirm enabled in Supabase prod:
   ```sql
   SELECT extname FROM pg_extension WHERE extname = 'vector';
   ```
   If empty: `CREATE EXTENSION IF NOT EXISTS vector;` (Supabase has it pre-installed but not always enabled).

2. **Embedding provider choice** — pick before coding:
   - **Voyage AI** (`voyage-3-large`, 1024 dims, $0.06/1M tokens) — best quality for retrieval, native Anthropic recommendation. Requires `VOYAGE_API_KEY`.
   - **OpenAI** (`text-embedding-3-small`, 1536 dims, $0.02/1M tokens) — cheapest, well-supported, lower quality.
   - **Cohere embed-english-v3** — comparable to OpenAI.
   - **Recommendation:** Voyage. Riley already runs on Anthropic — keep the stack coherent. Cost is negligible (a 50-page roofer site = ~50K tokens = $0.003 per onboarding to embed once).

3. **Firecrawl plan check** — confirm Hannah's plan can absorb full-site crawls:
   - Hobby ($19/mo, 3000 credits) → ~60 onboardings/mo before pinching
   - Standard ($99/mo, 100K credits) → ~2000 onboardings/mo
   - At launch, Hobby is fine. Upgrade trigger: 50+ signups/mo.

4. **Webhook signing** — Firecrawl webhooks include `X-Firecrawl-Signature` header. Need `FIRECRAWL_WEBHOOK_SECRET` set in Vercel env.

---

## Implementation plan — ordered

### Step 1 — Schema + extension (~30 min)

Migration `supabase/091_chatbot_knowledge_chunks.sql`:

```sql
-- Enable pgvector if not yet
CREATE EXTENSION IF NOT EXISTS vector;

-- One row per chunk of one page of one contractor's site.
CREATE TABLE chatbot_knowledge_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id   uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  source_url      text NOT NULL,
  page_title      text,
  chunk_index     int  NOT NULL,           -- 0-based within page
  chunk_text      text NOT NULL,
  embedding       vector(1024),            -- Voyage 3-large dim; bump to 1536 if OpenAI
  token_count     int,
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- One crawl batch = one timestamp. Old chunks for same contractor get
  -- deleted before new batch lands so re-crawl is clean.
  crawl_batch_id  uuid NOT NULL
);

CREATE INDEX chatbot_knowledge_chunks_contractor_idx
  ON chatbot_knowledge_chunks(contractor_id);

-- IVFFlat is the lighter index; HNSW is better quality but heavier to build.
-- Use IVFFlat for now; revisit if recall is poor.
CREATE INDEX chatbot_knowledge_chunks_embedding_idx
  ON chatbot_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Track crawl jobs so the dashboard can show status
CREATE TABLE chatbot_knowledge_crawl_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id   uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  firecrawl_job_id text NOT NULL UNIQUE,
  status          text NOT NULL CHECK (status IN ('queued','running','completed','failed')),
  pages_total     int,
  pages_completed int,
  error_message   text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX chatbot_knowledge_crawl_jobs_contractor_idx
  ON chatbot_knowledge_crawl_jobs(contractor_id, started_at DESC);
```

Apply via `mcp__supabase__apply_migration` or `supabase migration up`.

### Step 2 — Firecrawl async trigger (~30 min)

New endpoint `app/api/onboarding/full-crawl/route.ts`:

- POST { contractor_id }
- Auth: contractor row owner (same pattern as `/api/dashboard/riley/recrawl`)
- Read `chatbot_config.source_website_url` (set during Screen 2)
- Call Firecrawl `POST https://api.firecrawl.dev/v1/crawl` with:
  ```json
  {
    "url": "<roofer site>",
    "limit": 100,
    "scrapeOptions": {
      "formats": ["markdown"],
      "onlyMainContent": true
    },
    "webhook": "https://ruufpro.com/api/firecrawl/webhook?contractor_id=<uuid>",
    "excludePaths": ["/blog/.*", "/wp-admin/.*", "/cart/.*", "/checkout/.*", "/my-account/.*"]
  }
  ```
- Insert row in `chatbot_knowledge_crawl_jobs` with `status='queued'`, `firecrawl_job_id` from response

Wire trigger into `handlePublish` flow in `components/onboarding/screen4-publish.tsx` (or wherever Screen 4's "Open dashboard" handler lives). Fire-and-forget — don't block the redirect to dashboard.

### Step 3 — Webhook receiver (~1.5 hr)

New endpoint `app/api/firecrawl/webhook/route.ts`:

- POST handler, no Supabase auth (Firecrawl is the caller)
- Verify `X-Firecrawl-Signature` against `FIRECRAWL_WEBHOOK_SECRET` (HMAC-SHA256 of body)
- Firecrawl sends events: `crawl.started`, `crawl.page` (per-page), `crawl.completed`, `crawl.failed`
- For `crawl.page`: enqueue an Inngest job to chunk + embed (don't block webhook response — Firecrawl retries if you take >10s)
- For `crawl.completed`: update `chatbot_knowledge_crawl_jobs.status='completed'`, `pages_total`, `completed_at`
- For `crawl.failed`: update status + error_message

### Step 4 — Inngest chunking + embedding job (~1.5 hr)

New Inngest function `chunk-and-embed-page` in `lib/inngest/functions.ts`:

- Input: `{ contractor_id, crawl_batch_id, source_url, page_title, markdown }`
- Steps:
  1. **Filter junk**: skip if markdown <100 chars, skip if it matches "404", "page not found", "leave a review", "thank you for your submission"
  2. **Chunk** the markdown — paragraph-based with sentence overflow, target ~500 tokens per chunk, 50-token overlap between chunks. Use `tiktoken` or just split on `\n\n` and pack greedily. (Don't pull in heavy NLP libs — naive chunking works fine for retrieval.)
  3. **Embed** each chunk via Voyage REST (`POST https://api.voyageai.com/v1/embeddings` body `{ input: [...], model: "voyage-3-large" }`). Batch 10 chunks per API call.
  4. **Insert** rows into `chatbot_knowledge_chunks` with `crawl_batch_id`
- Idempotency: check if `(contractor_id, source_url, crawl_batch_id)` already exists → skip
- Retry: Inngest handles transient failures by default; set `concurrency: { limit: 5 }` to avoid Voyage rate limits

**Old-batch cleanup**: when first chunk of a new batch lands, delete all chunks for `contractor_id` where `crawl_batch_id != new_id`. Keeps storage clean on re-crawl.

### Step 5 — RAG retrieval at chat time (~2 hr)

Modify `lib/chat-system-prompt.ts` (the function that builds Riley's system prompt):

1. Accept `userMessage` parameter (already there or add it)
2. New helper `retrieveKnowledgeChunks(contractor_id, question, k=3)`:
   - Embed `question` via Voyage
   - SQL: `SELECT chunk_text, source_url, page_title, 1 - (embedding <=> $1) AS similarity FROM chatbot_knowledge_chunks WHERE contractor_id = $2 ORDER BY embedding <=> $1 LIMIT $3`
   - Filter: drop chunks with `similarity < 0.55` (tune after testing)
3. Inject into prompt:
   ```
   ## Knowledge from {{contractor_name}}'s website
   The following are excerpts from their website that may help answer the homeowner's question. Cite the source URL when you use one.

   [Page: About Us — https://example.com/about]
   {{chunk_text}}

   [Page: Storm Damage — https://example.com/storm]
   {{chunk_text}}
   ...
   ```
4. **Token budget**: cap RAG injection at ~2000 tokens total. If 3 chunks exceed that, drop the lowest-similarity one.

### Step 6 — Dashboard UI (~2 hr)

In `components/dashboard/riley-tab/`:

- Read latest row from `chatbot_knowledge_crawl_jobs` for this contractor
- Show banner above the existing RileyTab badges:
  - `status='queued' | 'running'`: 🟡 "Riley is still learning your site... ({{pages_completed}}/{{pages_total or '?'}} pages)"
  - `status='completed'`: 🟢 "Trained on {{pages_total}} pages from your site" + "Re-crawl" button
  - `status='failed'`: 🔴 "Crawl failed: {{error_message}}" + "Retry" button
- Poll the status endpoint every 10s while running

New endpoint `GET /api/dashboard/riley/crawl-status` returns the latest job row.

The existing "Re-crawl" button (added in §6.7 commit `8aca47b`) needs to be re-pointed: instead of triggering the narrow Firecrawl crawl, trigger the full-site crawl flow.

### Step 7 — Garbage filter ratchet (~2 hr)

After 3–5 real roofer-site crawls, you'll find junk chunks in Riley's retrieval. Common offenders:
- Cookie banner text
- Footer "© 2024 Acme Roofing • Privacy Policy • Terms of Service"
- Repeated nav menu text on every page
- "Subscribe to our newsletter"

Add filters in chunk-and-embed step:
- Strip pages that are >70% nav/footer (compare token frequency across pages)
- Skip chunks <50 tokens
- Skip chunks where `>40%` of tokens are in a stop-word list of nav/footer phrases

This step is empirical — do it after testing, not before.

### Step 8 — End-to-end test (~2 hr)

Test contractors:
1. **Baker Roofing** (`bakerroofing.com`) — multi-state, ~80 pages, has location grid
2. **Pick a small Manatee FL roofer** (use prospect list) — ~10 pages, single owner
3. **A site with weird nav** — Wix or Squarespace based

For each:
- Trigger full crawl
- Wait for completion (should be 3–8 min)
- Open Riley
- Ask: "What areas do you serve?" / "Who is the owner?" / "Do you offer financing?" / "What's your warranty?"
- Verify Riley answers correctly AND cites the right page

If Riley misses something, check:
1. Was the page crawled? (`SELECT DISTINCT source_url FROM chatbot_knowledge_chunks WHERE contractor_id=...`)
2. Was the relevant chunk indexed? (search by keyword in chunk_text)
3. Did similarity search find it? (run the query manually, check similarity scores)

---

## Decisions deferred to next session (don't relitigate today)

These are intentionally NOT decided yet — let the test data drive them:

- **Embedding model**: leaning Voyage `voyage-3-large` but verify cost vs. recall on real test
- **Chunk size**: starting at 500 tokens with 50 overlap — may tune to 800/100 if recall poor
- **Similarity threshold**: starting at 0.55 — empirical
- **Re-crawl cadence**: not auto, manual re-crawl button only for now
- **Source attribution UI**: do we show "(from your /about page)" inline in Riley's reply? Leaning yes for trust but adds visual noise
- **Per-contractor knowledge isolation**: relies on `contractor_id` filter in similarity query — verify no cross-contamination

---

## Cost projection (objective)

Per onboarding (one-time):
- Firecrawl crawl: ~50 credits = $0.32 on Standard plan ($99/100K)
- Voyage embed: 50K tokens × $0.06/1M = $0.003
- **Total: ~$0.32 per signup**

Per Riley conversation (recurring):
- Voyage embed of question: ~30 tokens = $0.000002
- pgvector query: free (compute on existing Supabase plan)
- **Total: <$0.0001 per question**

At 100 paying contractors × 50 conversations/mo = 5000 queries/mo = $0.50/mo retrieval. Negligible.

Total monthly add at 100 contractors: ~$33/mo crawl + $0.50 retrieval = **~$33/mo all-in**.

---

## Files that will be touched

New:
- `supabase/091_chatbot_knowledge_chunks.sql`
- `app/api/onboarding/full-crawl/route.ts`
- `app/api/firecrawl/webhook/route.ts`
- `app/api/dashboard/riley/crawl-status/route.ts`
- `lib/firecrawl-crawl.ts` (helper for crawl trigger + status)
- `lib/voyage-embed.ts` (helper for embedding REST call)
- `lib/knowledge-retrieval.ts` (the RAG query function)

Modified:
- `lib/inngest/functions.ts` — add `chunk-and-embed-page` function
- `lib/chat-system-prompt.ts` — wire RAG injection
- `components/dashboard/riley-tab/*` — add crawl-status banner
- `components/onboarding/screen4-publish.tsx` — fire full-crawl after Stripe trigger

Env vars to add:
- `VOYAGE_API_KEY` (or `OPENAI_API_KEY` if pivoting)
- `FIRECRAWL_WEBHOOK_SECRET` (gen via `openssl rand -hex 32`, paste into Firecrawl dashboard webhook config)

---

## What ships in current §6.12 prod (do not undo)

The narrow 3-subpage crawl from session 4 (commit `df93825`) ships to prod as-is. It's strictly better than rolled-back state. Background crawl is the **accuracy upgrade** layered on top later.

The current narrow crawl provides the **immediate pre-fill** during onboarding (Screen 2 → Screen 3 review). Background crawl provides the **deep knowledge** Riley uses at chat time. Both coexist:
- Onboarding crawl: synchronous, 30s, fills the form fields the roofer reviews
- Full crawl: async, 3–8 min, populates the knowledge base Riley queries

Don't rip out the narrow crawl when adding background crawl. They serve different purposes.

---

## Memory entries to update on success

- `project_onboarding_rebuild_progress.md` → add new milestone "background full-site crawl shipped" with commit hash + deploy URL
- `project_riley_training_gaps_2026-04-27.md` → mark "no website auto-scrape" gap as resolved (this was the biggest gap flagged)
- New memory: lesson — narrow keyword-based crawls miss locations/financing/warranty pages on most roofer sites; full-site crawl + RAG is the durable fix

---

## Questions Hannah should answer before starting

(Don't start coding until these are answered.)

1. **Voyage AI account** — does Hannah have one yet? If not, sign up at voyageai.com (~2 min), grab API key.
2. **Firecrawl plan** — Hobby ($19) or Standard ($99)? Hobby is fine to start; Standard if running >50 test crawls during dev.
3. **Webhook URL** — production-only (`ruufpro.com`)? Or also dev/preview? Decision affects how the webhook is configured in Firecrawl dashboard.
4. **Source attribution in Riley replies** — show "(from your /about page)" inline, or hide and only log internally? My pick: hide initially, add later if homeowners ask "where did you get that?"
5. **Re-crawl cadence** — manual only (button in dashboard) or auto-weekly? My pick: manual only at launch, add cron later once we know how often roofer sites change.
