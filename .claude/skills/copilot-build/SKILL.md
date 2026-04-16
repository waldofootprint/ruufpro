---
name: copilot-build
description: Build Copilot features for the roofer's Lead Console. Loads workflow, tone rules, feature specs, and enforces one-feature-per-session discipline. Invoke with /copilot-build or when working on any Copilot feature from the approved brainstorm list.
---

# Copilot Feature Builder

You are building a new feature for Copilot — the AI business assistant inside the roofer's dashboard. Every feature follows a strict workflow with mandatory tone checks.

## On Invoke

### 1. Load Context (read these files in order)
- `decisions/copilot-feature-brainstorm.md` — approved features, priorities, tone rules, rejected ideas
- `workflows/build_copilot_feature.md` — the 10-step build pattern
- `workflows/copilot_tone_checklist.md` — the 6 tone rules + quick pass checklist
- `02-Sprint.md` (vault) — current sprint, which features are done/next

### 2. Identify the Feature
- Check the sprint for which Copilot feature is next
- If Hannah specifies one, use that
- If unclear, recommend the highest-priority unbuilt feature from the brainstorm doc
- State the feature clearly: "This session we're building: [feature name]"

### 3. One Feature Per Session
- HARD RULE: Only build ONE Copilot feature per session
- If Hannah asks to start a second, say: "Good idea — let's finish [current] first and pick that up next session."
- This prevents context rot and keeps quality high

## Required Skills & Tools

Use these throughout the build — not optional:

| Skill/Tool | When to Use |
|------------|-------------|
| `supabase-postgres-best-practices` | Every migration — data types, indexes, constraints |
| `claude-api` | Every system prompt or tool change — prompt caching, tool use patterns |
| Context7 MCP | When touching Inngest, Vercel AI SDK, or Next.js APIs |
| Supabase MCP | Running migrations, checking schema, executing SQL |
| Playwright MCP | E2E testing the Copilot UI after changes |

## Build Pattern

Follow `workflows/build_copilot_feature.md` exactly:

1. **Spec review** — re-read feature spec, list files to touch, share plan with Hannah
2. **Migration** — use `supabase-postgres-best-practices` skill
3. **Data collection** — widget events, API integrations, or Inngest crons
4. **Copilot tool function** — add to `lib/copilot-tools.ts`
5. **System prompt update** — add to `lib/copilot-system-prompt.ts`, use `claude-api` skill
6. **Wire tool in API route** — register in `app/api/dashboard/copilot/route.ts`
7. **UI surface** — update `app/dashboard/copilot/page.tsx` if needed
8. **Tone checklist** — run `workflows/copilot_tone_checklist.md` against ALL new text
9. **Test** — verify migration, tool, chat, UI, no regressions
10. **Ship** — commit, deploy, update sprint

## Tone Rules (Non-Negotiable)

These are enforced on EVERY piece of text Copilot says:

1. **No fake expertise** — data observations, not roofing advice
2. **No emotional assumptions** — behaviors, not feelings
3. **No fabricated statistics** — only numbers from this roofer's data
4. **Coach, don't command** — suggestions, not orders
5. **Never condescend** — partner-to-partner, not boss-to-employee
6. **Inform, don't script** — tell them what to KNOW, not what to SAY

Full examples and fail/pass comparisons are in `workflows/copilot_tone_checklist.md`.

## Key Files

| Purpose | Path |
|---------|------|
| Feature specs | `decisions/copilot-feature-brainstorm.md` |
| Build workflow | `workflows/build_copilot_feature.md` |
| Tone checklist | `workflows/copilot_tone_checklist.md` |
| Copilot page | `app/dashboard/copilot/page.tsx` |
| Chat API | `app/api/dashboard/copilot/route.ts` |
| Draft API | `app/api/dashboard/copilot/drafts/route.ts` |
| Tool functions | `lib/copilot-tools.ts` |
| System prompt | `lib/copilot-system-prompt.ts` |
| Lead scoring | `lib/lead-scoring.ts` |
| Dashboard utils | `lib/dashboard-utils.ts` |
| Inngest functions | `lib/inngest/functions/` |

## After Completion

- Mark the feature as done in `02-Sprint.md`
- Update `decisions/copilot-feature-brainstorm.md` if any decisions changed
- Remind Hannah to review the Copilot chat with a test question that triggers the new feature
