# Copilot Feature Build Workflow

**Trigger:** When building any new Copilot feature from the approved list in `decisions/copilot-feature-brainstorm.md`.

**Rule:** One feature per session. No exceptions. Context rot kills quality.

## Before You Start

### Step 0: Load Context
1. Read `decisions/copilot-feature-brainstorm.md` — the approved feature list, priority, and tone rules
2. Read `02-Sprint.md` — confirm which feature is next
3. Read `workflows/copilot_tone_checklist.md` — know the rules before writing any prompts
4. Confirm branch: all Copilot features build on `feature/direct-mail-nfc` or a new feature branch (ask Hannah)

### Skills to Use
- **`supabase-postgres-best-practices`** — for every migration (indexes, constraints, data types)
- **`claude-api`** — for every system prompt or tool change (prompt caching, tool use patterns)
- **Context7 MCP** — for Inngest, Vercel AI SDK, or Next.js docs when needed
- **Supabase MCP** — for running migrations and checking schema

## Build Steps

### Step 1: Spec Review
- Re-read the specific feature's entry in `decisions/copilot-feature-brainstorm.md`
- Identify: what data is needed, where it comes from, how Copilot surfaces it
- List the files that will be touched
- Share the plan with Hannah before writing code

### Step 2: Migration
- New columns go on existing tables when possible (usually `leads`)
- New tables only for caches or cross-cutting data (e.g., `permit_cache`, `widget_events`)
- Use the `supabase-postgres-best-practices` skill for:
  - Correct data types (JSONB vs text vs integer)
  - Index strategy (partial indexes, composite indexes)
  - Constraints and defaults
- Migration naming: `supabase/migrations/YYYYMMDDHHMMSS_copilot_[feature_name].sql`
- Run the migration immediately (HARD RULE from memory: just run it, never ask)

**Key files:**
- `supabase/migrations/` — new migration file
- Run via Supabase MCP `apply_migration`

### Step 3: Data Collection
This varies by feature type:

**Widget behavioral events (features 1, 2, 3, 6):**
- Add event tracking in the estimate widget component
- Fire events to a new API route or directly to Supabase
- Store on the `leads` table (JSONB columns) or a dedicated `widget_events` table

**External API integrations (features 7, 8, 9):**
- Build as Inngest cron jobs for background processing
- Cache results in Supabase (never call expensive APIs on page load)
- Respect rate limits and cost caps (announce API costs to Hannah)

**Derived from existing data (features 5, 10, 12, 14, 15, 17, 18):**
- Build as query functions in `lib/copilot-tools.ts`
- No new data collection needed — analyze what's already in the DB

**Key files:**
- Widget components in `components/` (for behavioral tracking)
- `lib/inngest/functions/` (for cron jobs)
- API routes in `app/api/` (for new endpoints)

### Step 4: Copilot Tool Function
- Add the new tool function in `lib/copilot-tools.ts`
- Follow the existing pattern: takes `supabase` client + `contractorId`, returns structured data
- Export a typed interface for the return value
- Keep functions pure data access — no React, no streaming
- The function should return data + a human-readable message for Copilot to riff on

**Key file:** `lib/copilot-tools.ts`

### Step 5: System Prompt Update
- Use the `claude-api` skill for prompt caching best practices
- Add new tool to the `COPILOT_SYSTEM_PROMPT_STABLE` in `lib/copilot-system-prompt.ts`
- Add tool description to the "Available Tools" section
- Add an example interaction to the "Examples" section
- Keep new additions under ~100 tokens to protect cache efficiency
- Apply ALL tone rules from `workflows/copilot_tone_checklist.md`

**Key file:** `lib/copilot-system-prompt.ts`

### Step 6: Wire Tool in API Route
- Register the new tool in `app/api/dashboard/copilot/route.ts`
- Add Zod input schema
- Wire execute function to the tool function from Step 4

**Key file:** `app/api/dashboard/copilot/route.ts`

### Step 7: UI Surface
- Update the copilot page detail view if the feature adds visible data
- Options: new card in context row, new info in the score panel, new data in property intel
- Keep it minimal — Copilot chat is the primary surface, UI cards are secondary
- Mobile-friendly (will need mobile layout eventually)

**Key file:** `app/dashboard/copilot/page.tsx`

### Step 8: Tone Checklist
- Run EVERY line of new prompt text through `workflows/copilot_tone_checklist.md`
- Fix any violations before committing
- This is not optional — tone issues are bugs

### Step 9: Test
- Verify the migration applied cleanly
- Test the tool function with real or test data
- Test Copilot chat: ask a question that should trigger the new tool
- Verify the UI displays correctly
- Check that existing features still work (no regressions)

### Step 10: Ship
- Commit with descriptive message
- Deploy to Vercel (`vercel --prod`)
- Update `02-Sprint.md` — mark feature as done
- Update `decisions/copilot-feature-brainstorm.md` if any decisions changed during build

## File Reference

| Purpose | Path |
|---------|------|
| Feature specs & tone rules | `decisions/copilot-feature-brainstorm.md` |
| Tone checklist | `workflows/copilot_tone_checklist.md` |
| Copilot page UI | `app/dashboard/copilot/page.tsx` |
| Copilot chat API | `app/api/dashboard/copilot/route.ts` |
| Copilot draft API | `app/api/dashboard/copilot/drafts/route.ts` |
| Copilot tools (data access) | `lib/copilot-tools.ts` |
| System prompt | `lib/copilot-system-prompt.ts` |
| Lead scoring | `lib/lead-scoring.ts` |
| Dashboard utilities | `lib/dashboard-utils.ts` |
| Inngest functions | `lib/inngest/functions/` |
| Migrations | `supabase/migrations/` |
