# RuufPro — Agent Instructions

You're building **RuufPro**, a micro-SaaS for small roofing contractors (1-10 person crews). Three tiers: Free (website + SEO), $149/mo Pro (estimate widget + missed-call text-back + review automation + lead dashboard), $299/mo Growth (SEO city pages + competitor monitoring + custom domain). Live on Vercel, backed by Supabase.

## Architecture (WAT Framework)

Workflows define what to do. You orchestrate. Tools execute. This separation keeps accuracy high.

```
workflows/       # Markdown SOPs (read before building)
tools/           # Scripts for deterministic execution
.claude/skills/  # Claude Code skills (the ONLY skills directory)
.tmp/            # Disposable temp files
research/        # Strategy docs — competitor analysis, GTM plan, copy research
```

## Key Docs — Read Before Acting

| Doc | What It Contains |
|-----|-----------------|
| `workflows/project_overview.md` | Product spec, pricing, tech stack, roadmap, competitors |
| `research/go-to-market-plan.md` | Positioning, messaging, competitor gaps, channel strategy |
| `research/roofer-pain-points.md` | What roofers say online, ranked by frequency |
| `research/roofing-website-copy-research.md` | What converts for roofing sites |
| `research/website-copy-v1-test-results.md` | Copy critique with specific rewrites |

## Two Products in One Codebase

1. **RuufPro marketing site** — Sells RuufPro to roofers. `components/ridgeline/`. Route: `app/page.tsx`
2. **Roofer client websites** — What roofers GET. `components/contractor-sections/` + `components/templates/`. Route: `app/site/[slug]/page.tsx`

Don't confuse them. Ask if unclear.

## Template System

- Templates: `components/templates/` (blueprint, chalkboard, forge, classic, apex)
- Sections: `components/contractor-sections/{theme}/`
- Data type: `ContractorSiteData` from `components/contractor-sections/types.ts`
- Theme configs: `components/contractor-sections/theme-{name}.ts`
- Registry: `lib/themes.ts`

## Estimate Widget

- **V4 = production** (blueprint, chalkboard, forge, classic)
- V3 = shared/generic estimate-section
- V1 = iframe embed (`app/widget/[contractorId]`)
- V2 = archived

## How to Operate

1. Read the relevant workflow in `workflows/` first
2. Check `tools/` for existing scripts before writing new ones
3. Check `.claude/skills/` for relevant skills
4. If using paid API calls, check with me before running
5. Don't create/overwrite workflows without asking

## Showing Preview Links

Before sharing localhost links, **always**:
1. `pkill -f "next dev"`
2. `rm -rf .next`
3. `npm run dev` (background)
4. Wait for compilation, then share the link

## Website Building

When building or modifying any website/page/section — **read `workflows/build_website.md` first**. Research competitors, check 21st.dev for components, build one section at a time, show localhost preview, revert immediately if asked.

## Knowledge Vault

Marketing frameworks, sales strategies, case studies, and automation workflows at `/Users/hannahwaldo/AI Automations/`. Search via grep/glob when you need:
- Pricing strategy (entries 025, 031, 032)
- Conversion frameworks (entry 050)
- Design systems (entries 038, 051)
- Lead generation (entries 005, 033, 047, 048)

## Core Principles

- Everything in `.tmp/` is disposable
- Workflows and research are not — preserve and refine them
- When things fail: read the error, fix, retest, update the workflow
- Stay pragmatic. Stay reliable. Keep learning.