# Riley Feature Build Workflow

**Trigger:** When building any new Riley feature from the approved list in `decisions/riley-feature-brainstorm.md`.

**Rule:** One feature per session. No exceptions. Context rot kills quality.

## Before You Start

### Step 0: Load Context
1. Read `decisions/riley-feature-brainstorm.md` — the approved feature list, priority, and tone rules
2. Read `02-Sprint.md` — confirm which feature is next
3. Read `workflows/riley_tone_checklist.md` — know the rules before writing any prompts
4. Confirm branch strategy with Hannah

### Skills to Use
- **`supabase-postgres-best-practices`** — for every migration (indexes, constraints, data types)
- **`claude-api`** — for every system prompt or tool change (prompt caching, tool use patterns)
- **Context7 MCP** — for Vercel AI SDK, Next.js docs when needed
- **Supabase MCP** — for running migrations and checking schema

## Build Steps

### Step 1: Spec Review
- Re-read the specific feature's entry in `decisions/riley-feature-brainstorm.md`
- Identify: what data is needed, where it comes from, how Riley uses it
- Check the GUARDRAILS noted on the feature (some have specific safety rules)
- List the files that will be touched
- Share the plan with Hannah before writing code

### Step 2: Migration (if needed)
- New columns go on existing tables when possible (`chat_conversations`, `leads`, `chatbot_config`)
- New tables only for caches or cross-cutting data
- Use the `supabase-postgres-best-practices` skill for:
  - Correct data types (JSONB vs text vs integer)
  - Index strategy (partial indexes, composite indexes)
  - Constraints and defaults
- Migration naming: `supabase/migrations/YYYYMMDDHHMMSS_riley_[feature_name].sql`
- Run the migration immediately (HARD RULE: just run it, never ask)

**Key files:** `supabase/migrations/`

### Step 3: Data Collection / Logic
This varies by feature type:

**System prompt enhancements (features 3, 4, 7, 8, 15, 16, 24, 26):**
- Modify `lib/chat-system-prompt.ts` only
- No new data collection — improve how existing data is used
- Keep additions under ~100 tokens to protect cache efficiency

**Widget behavior changes (features 2, 10, 13, 18):**
- Modify `components/chat-widget/ChatWidget.tsx`
- All inline styles (no Tailwind) — this runs on external sites
- May require new data in the API request body to `app/api/chat/route.ts`
- Test in BOTH floating bubble and standalone modes

**Scoring / intelligence (features 1, 2, 10):**
- Modify `lib/lead-scoring.ts`
- May add new scoring functions called from `app/api/chat/route.ts`
- Intent signals should be structured data, not just keyword lists

**Estimate enhancements (features 7, 11):**
- Modify `lib/chat-estimate.ts`
- May modify the estimate tool definition in `app/api/chat/route.ts`
- GUARDRAIL: never reference materials/services outside roofer's confirmed scope

**Page / experience (features 18, 19, 20):**
- Modify standalone page or analytics page
- May add new components

**Dashboard config (features 24, 25):**
- Add new fields to `app/dashboard/chatbot/page.tsx`
- Update `ChatbotConfig` type in `lib/types.ts`
- Requires migration for new `chatbot_config` columns

**Cross-system (features 23, 29, 30):**
- May touch Inngest functions, Resend integration, Copilot tools
- Announce complexity to Hannah before starting

### Step 4: System Prompt Update
- Use the `claude-api` skill for prompt caching best practices
- Add new guidance to `lib/chat-system-prompt.ts`
- Keep new additions concise — Riley uses Haiku, so token budget matters more than Copilot (Sonnet)
- Apply ALL tone rules from `workflows/riley_tone_checklist.md`
- NEVER add information that isn't backed by contractor data or `chatbot_config`

**Key file:** `lib/chat-system-prompt.ts`

### Step 5: Chat API Wiring (if needed)
- Register new tools or modify existing ones in `app/api/chat/route.ts`
- Add Zod input schemas for new tools
- Update request body handling if new data is being passed from the widget
- Respect existing rate limits and cost protections

**Key file:** `app/api/chat/route.ts`

### Step 6: Widget Update (if needed)
- Update `components/chat-widget/ChatWidget.tsx` for UI changes
- All inline styles (no Tailwind) — this component runs on external sites via iframe
- Test in BOTH floating bubble mode and standalone mode
- Remember: this component is 929 lines — be surgical, don't rewrite

**Key file:** `components/chat-widget/ChatWidget.tsx`

### Step 7: Lead Scoring Update (if needed)
- Update `lib/lead-scoring.ts` if the feature changes how intent is measured
- Update `app/api/notify/route.ts` if lead capture flow changes
- New scoring should produce structured data (not just "hot"/"warm"/"browsing")

**Key files:** `lib/lead-scoring.ts`, `app/api/notify/route.ts`

### Step 8: Tone Checklist
- Run EVERY line of new prompt text through `workflows/riley_tone_checklist.md`
- Run every new UI string through the checklist too
- Fix any violations before committing
- This is not optional — tone issues are bugs
- Remember: Riley talks to homeowners, not roofers. Different audience = different tone.

### Step 9: Test
- If migration: verify it applied cleanly
- Test Riley chat: ask questions that trigger the new behavior
- Test in floating widget mode (on a contractor template)
- Test in standalone mode (`/chat/[contractorId]`)
- Test via external embed (`riley.js`) if the change affects the widget
- Verify lead form still works
- Verify estimate tool still works
- Check rate limits still function
- No regressions on existing 21 behavior rules

### Step 10: Ship
- Commit with descriptive message
- Deploy to Vercel (`vercel --prod`)
- Update `02-Sprint.md` — mark feature as done
- Update `decisions/riley-feature-brainstorm.md` if any decisions changed during build
- Remind Hannah to test Riley with a question that triggers the new feature

## File Reference

| Purpose | Path |
|---------|------|
| Feature specs & priorities | `decisions/riley-feature-brainstorm.md` |
| Tone checklist | `workflows/riley_tone_checklist.md` |
| System prompt builder | `lib/chat-system-prompt.ts` |
| Chat API (streaming) | `app/api/chat/route.ts` |
| Chat widget UI | `components/chat-widget/ChatWidget.tsx` |
| Estimate tool | `lib/chat-estimate.ts` |
| Lead scoring | `lib/lead-scoring.ts` |
| Lead capture / notify | `app/api/notify/route.ts` |
| Train Riley config page | `app/dashboard/chatbot/page.tsx` |
| Riley analytics | `app/dashboard/chatbot-analytics/page.tsx` |
| Standalone chat page | `app/chat/[contractorId]/page.tsx` |
| Standalone wrapper | `app/chat/[contractorId]/StandaloneChatWrapper.tsx` |
| Embed script | `public/riley.js` |
| Shared types | `lib/types.ts` |
| Contractor site types | `components/contractor-sections/types.ts` |
| Inngest functions | `lib/inngest/functions/` |
| Migrations | `supabase/migrations/` |
