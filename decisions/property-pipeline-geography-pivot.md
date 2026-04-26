# Property Pipeline — Geography Pivot: Sarasota → Manatee

**Date:** 2026-04-26
**Status:** Locked decision (planning session, Round 3 Q3)
**Supersedes:** `research/property-pipeline-handoff-2026-04-26.md` Locked Decision #3 ("First geography: Sarasota County")

---

## The change

**MVP first-county = Manatee County (Bradenton), not Sarasota County.**

Sarasota deferred to Week 2 expansion, conditional on Manatee scraper stability.

---

## Why

1. **Standard Accela harness, not custom Blazor SPA.**
   - Manatee permits portal: `aca-prod.accela.com/MANATEE/` — standard Accela ACA, well-documented scrape pattern, reusable across counties.
   - Sarasota permits portal: custom Blazor SPA + SignalR — no canonical scrape pattern, perpetual selector-patching risk, throwaway code that doesn't reuse.

2. **Reusable for the next 75% of FL by population.**
   - Pinellas, Hillsborough, Lee, Polk, Brevard, Volusia all run Accela ACA.
   - One Manatee-shaped harness expands to most of FL with config changes only.
   - Sarasota's Blazor harness reuses for ~zero other counties.

3. **Saves ~1.5 build days at MVP.**
   - Manatee Accela scrape: ~1.5 days (with dual-source legacy archive).
   - Sarasota Blazor SPA scrape: ~3 days (custom DOM, SignalR session state, unverified Firecrawl support).
   - The 1.5 days saved goes to validation: 100-row sniff test + Lob first-piece approval clock + creative kickoff.

4. **Hannah's home county = free in-person QA.**
   - Bradenton mailings can be physically verified before scaling.
   - Side benefit only — does not by itself justify the pivot. Reusability + standard harness do.

5. **Lead-Spy's Manatee presence = positive demand signal.**
   - Original handoff treated Sarasota's gap in Lead-Spy coverage as "your wedge."
   - Reversal: that gap might equally be evidence Lead-Spy tested Sarasota and didn't see demand.
   - Manatee being covered by Lead-Spy validates that buyers exist for permit-based direct-mail leads.
   - The wedge is now **product depth** (multi-signal scoring + Riley + 3-touch angle rotation + integrated Lead Dashboard), not territory.

---

## Dual-source scrape required for Manatee 20-year backfill

Manatee migrated permitting systems mid-cycle:
- **Accela ACA** (`aca-prod.accela.com/MANATEE/`): 2018-Feb-28 → today
- **mymanatee.org legacy archive**: 2005 → 2018-Feb-28

Implementation:
- One-shot historical pull pulls from both systems, normalizes into unified `roof_permits` table.
- Schema: `roof_permits.source ENUM('accela_aca', 'mymanatee_legacy', 'firecrawl_failover')` for audit + debugging.
- Weekly delta pulls only from Accela ACA (legacy archive is frozen pre-2018).

---

## Volume math (Manatee)

- ~25–35K total permits/yr
- ~10–15% roofing = ~3–4K roof permits/yr
- 20-year backfill: ~70K records baseline + ~10K hurricane spike (Ian/Idalia/Helene/Milton 2022–2024) = **~80K total bounded**
- Backfill at 4-thread polite + Firecrawl rotation: ~1.5–2 days run-time
- Weekly delta: ~75 new roof permits/wk = trivial 5-min job

---

## Scraper vendor split

- **Backfill (one-shot ~80K pages):** Firecrawl Standard $99/mo, run for one month, cancel after. Hammering Accela from one IP for 80K requests = guaranteed ban.
- **Weekly delta (~3K pages):** DIY Playwright. Small, predictable. ~2 hours/week single residential IP.
- **Manual escape hatch:** Firecrawl as one-toggle fallback for the week Accela pushes a portal update and breaks DOM selectors. Not auto-failover.

**Year 1 scrape cost ceiling: <$250 all-in.**

---

## Sarasota Week 2 expansion (aspiration, not MVP)

- Conditional on Manatee scraper being stable end of Week 1.
- Adds ~1.5 days for separate Blazor SPA scraper component.
- Requires pre-commit verification that Firecrawl handles SignalR/Blazor cleanly (not assumed).
- **Will not bleed into MVP critical path.** If Manatee is shaky, Sarasota slips.

---

## Implications cascading from this decision

1. **No-auth ZIP demo on marketing site:** first-supported-county = Manatee. Demo's "live count" feature gates on Manatee data, not Sarasota.
2. **100-row sniff test:** stratified sample drawn from Manatee universe.
3. **Hannah-internal validation contractor:** service area = Manatee (Sarasota added Week 2 if applicable).
4. **Marketing positioning copy:** "Sarasota wedge — novel territory" framing dies. New wedge = product depth (Riley + multi-signal + multi-touch + dashboard).
5. **Cross-contractor dedup architecture:** unchanged. 180-day lockout is moot at MVP (1 contractor) but architecture stays as designed.
6. **Locked decision #3 in handoff doc:** must be updated to reflect Manatee primary + Sarasota Week 2.

---

## Pre-commit verification gate (do BEFORE committing $99 Firecrawl)

- Verify earliest available `application_date` on Manatee Accela ACA
- Verify mymanatee.org legacy archive is publicly searchable + scrapeable back to 2005
- Test 10 Accela ACA pages through Firecrawl MCP browser tools
- Confirm Manatee Accela's roof permit dropdown values: "Roof Standard," "Residential Roof Express," "Commercial Roof Express"

~1 hour of work. Cheap kill-point before any code commits.
