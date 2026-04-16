# Estimate Copilot — Competitive Research & Feature Spec

> Research date: April 15, 2026
> Sources: 7 Brave Search queries across competitor tools, Reddit threads, pricing guides, AI roofing tools
> Purpose: Inform the Estimate Copilot feature spec before building

---

## Part 1: Competitive Landscape

### What Exists Today (Contractor-Side Quoting)

| Tool | What It Does | Price | Gap |
|------|-------------|-------|-----|
| **Roofle RoofQuote PRO** | Instant homeowner-facing quotes, contractor dashboard, material ordering via Beacon Pro+, weather data, digital proposals | $299-499/mo | Homeowner-facing only. Contractor can't talk through a job. No margin calc. |
| **Roofr** | AI satellite measurements, proposal builder, e-sign, CRM | $89-249/mo | Fast quotes but manual — click through forms, not conversational. No profit analysis. |
| **QuoteIQ** | AI estimating + satellite + job costing + CRM | ~$149/mo | Closest competitor. AI estimates in natural language. But it's a full CRM — overkill for small crews. |
| **XBuild** | AI proposals from plain language ("28 squares, architectural shingles") | Unknown | New entrant. Plain-language input. But generic construction, not roofing-specific. |
| **RoofSnap** | Measurements + proposals + material ordering | $99-199/mo | Traditional software. No AI. Manual data entry. |
| **iRoofing** | Measurements + estimates + visualizer | $99-149/mo | No AI. Good visualizer but estimate is manual. |
| **EagleView App** | Measurements + automated quoting + 3D visualizer | $10/report | Industry standard measurements. Expensive at scale. No conversational interface. |
| **ServiceTitan** | Full field service platform with roofing estimating | $200+/mo | Enterprise. Way too complex for 1-10 person crews. |
| **Jobber Roof Tool** | Free roof measurement, enter price per square | Free | Basic. No materials, no tear-off, no complexity factors. |
| **InstantRoofer** | AI measurements in 5 seconds, $10 for certified report | $10/report | Measurement only. No quoting, no proposals. |

### AI-Specific Competitors

| Tool | AI Capability | Threat Level |
|------|--------------|-------------|
| **QuoteIQ AI Autopilot** | Natural language: "create estimate for Johnsons, 28 squares, architectural" | 🟡 Medium — closest to our vision but it's a full CRM, not a focused copilot |
| **XBuild AI** | Plain language estimate input, auto-generates proposals | 🟡 Medium — generic construction, not roofing-specific |
| **RoofD AI (RoofBot)** | Homeowner chatbot for instant estimates + financing | 🟢 Low — homeowner-facing only, not contractor tool |
| **Rooftops AI** | AI team members for follow-ups, content, communication | 🟢 Low — marketing/sales AI, not estimating |
| **NoForm AI** | Lead qualification chatbot | 🟢 Low — chatbot only, no estimates |

### Key Finding: The Gap

**Nobody has a conversational estimate tool built for a roofer standing on a roof.**

- Roofle/Roofr = homeowner-facing widgets (like our V4)
- QuoteIQ = closest, but it's a full CRM platform — $149+/mo for features small crews don't need
- XBuild = natural language but generic construction
- Everyone else = form-based, click-through, desktop-first

**The on-site quoting gap is REAL.** Roofers inspect a roof, take photos, drive home, sit at a computer, build the estimate, email it the next day. The homeowner has already gotten 2 other quotes by then.

---

## Part 2: How Roofers Actually Quote Jobs

### From Reddit + Industry Sources

**The napkin math reality:**
- Most small roofers (1-10 crew) use a per-square formula: `squares × $/square + extras`
- Common formula: `(Labor Hours × Hourly Rate) + Material Costs + Overhead + Profit`
- Labor cost per square: `Loaded crew cost per day ÷ Average squares per day`
- Many literally price from memory: "28 squares of architectural, that's about $14K"

**The spreadsheet crowd:**
- Excel/Google Sheets templates are MASSIVE on Etsy ($15-30)
- Templates include: materials, labor hours, underlayment, tear-off, permits, disposal, markup, tax, waste
- Contractors customize one template and use it for years
- Problem: manual entry, easy to miss line items, can't do it from a roof

**The software crowd (bigger companies):**
- Xactimate (insurance work — scope-driven, line-item based)
- RoofSnap/EagleView for measurements
- SumoQuote/Roofr for proposal generation
- Multiple tools cobbled together = expensive + slow

**Reddit quote from r/Roofing:**
> "My company is able to provide quotes in the same appointment usually. We want to stay ahead of the curve via software."

**Reddit insight on speed:**
> "How Come Roofers Aren't Quick To Provide Formal Estimates?" — common homeowner complaint. Roofers take days to send quotes because the process is manual.

### Profit Margin Data

- **Industry average gross margin: 40-50%** (revenue - materials - labor)
- Materials: ~35% of revenue
- Labor: ~18-20% of revenue
- Overhead: ~15-20% of revenue
- **Net profit: 8-15%** after overhead
- Small crews often don't track margins — they price by gut feel
- The ones who DO track margins use spreadsheets or nothing

**Key formula we need to support:**
```
Revenue (what you charge) - Material Cost - Labor Cost = Gross Profit
Gross Profit / Revenue × 100 = Gross Margin %
```

---

## Part 3: What Would Make a Roofer Say "Holy Shit"

Based on the research, the magic moments are:

### 1. Quote From The Roof (Speed)
- Roofer is on the roof during inspection
- Says: "3,200 sqft, 8/12 pitch, 2 layers tear-off, architectural shingles"
- Gets instant price range + breakdown
- Can tell the homeowner a number BEFORE leaving the property
- **This alone is worth $149/mo** — it closes deals that day instead of losing them

### 2. Know Your Margin Instantly (Money)
- "What's my profit on this at $14K?"
- "If I drop to $12K to beat the other bid, what's my margin?"
- Small roofers NEVER know their real margin — they price by feel
- Showing them "at $14K your margin is 42%, at $12K it drops to 31%" = eye-opening

### 3. Material Comparison (Confidence)
- "Price difference between 3-tab and architectural?"
- "What if they want standing seam metal instead?"
- "Show me good/better/best options for this roof"
- Roofer can present options to homeowner on the spot

### 4. Local Market Check (Validation)
- "Am I pricing this right for Tampa?"
- Uses our BLS metro data to show how they compare to market
- "Your price is 8% below Tampa average" or "You're priced competitively"
- Reduces the anxiety of pricing — roofers worry about being too high OR too low

### 5. One-Tap Proposal (Close)
- "Send this estimate to the homeowner"
- Generates a professional PDF/living estimate link
- Homeowner gets it while the roofer is still on the roof
- No more "I'll send you something tonight" (then forgetting)

---

## Part 4: Feature Spec — Estimate Copilot

### What It Is
A conversational AI tool inside the Copilot chat tab that lets roofers get instant estimates, compare materials, check margins, and send proposals — all by talking/typing naturally.

### How It Differs From Riley (Homeowner Widget)

| Aspect | Riley (Homeowner) | Estimate Copilot (Roofer) |
|--------|-------------------|--------------------------|
| **User** | Homeowner on website | Roofer on roof / in truck |
| **Data shown** | Price range only | Full cost breakdown + margin |
| **Pricing source** | Contractor's configured rates | Contractor's rates + market comparison |
| **Materials** | What contractor offers | All available + comparison |
| **Output** | Estimate card in chat | Detailed breakdown + proposal generation |
| **Liability** | Heavy disclaimers, conservative | Lighter — it's the roofer's own tool |
| **Address required?** | Yes (satellite data) | Optional — can estimate from manual measurements |
| **Tone** | Friendly, simple | Business partner, numbers-first |

### Tools (Validated from vault 077 + research)

#### 1. `calculateRoofEstimate` — THE core tool
**Input options (flexible):**
- **By address:** "123 Main St, Tampa" → Solar API for satellite measurements
- **By measurements:** "3,200 sqft, 8/12 pitch" → skip Solar API, manual input
- **Hybrid:** Address for roof data + manual overrides ("but it's actually 2 layers")

**Parameters:**
- `address` OR `roofArea` + `pitch` (one or the other)
- `material` — asphalt, metal, tile, flat (default: all priced materials)
- `tearOffLayers` — 0, 1, 2 (default: 1)
- `roofComplexity` — simple, moderate, complex (affects waste factor)
- `shingleLayers` — existing layers to remove

**Output:**
- Per-material breakdown: material cost, labor cost, tear-off, accessories, total
- Price range (low-high)
- Waste factor applied
- Weather surge if active
- Tier labels (Good/Better/Best)

**Reuse:** 95% of `lib/estimate.ts` + `lib/solar-api.ts` + `lib/chat-estimate.ts`

#### 2. `compareMaterials` — side-by-side
**Input:** roof area + pitch (or from previous estimate)
**Output:** Table comparing 2-4 materials on: price, warranty, wind rating, lifespan, margin at different sell prices

**Reuse:** Same engine, different presentation. Already calculate all materials.

#### 3. `checkLocalPricing` — market validation
**Input:** material, price per square, contractor's state/metro
**Output:** "Your $350/sq for architectural shingles is 8% below Tampa metro average ($380/sq). You're priced competitively."

**Reuse:** `lib/metro-pricing.ts` (48 metros, BLS data)

#### 4. `calculateProfitMargin` — the money tool
**Input:** 
- `estimateTotal` (what you'd charge)
- `materialCost` (from our estimate or manual)
- `laborHours` + `crewRate` (or use defaults)
- `overhead` (% or flat, optional)

**Output:**
- Gross profit $
- Gross margin %
- "At $14,000 your gross margin is 43%. Drop to $12,000 and it's 31%."
- Comparison to industry benchmark (40-50% gross margin)

**New code needed:** ~50 lines. Simple math, but the insight is what matters.

#### 5. `generateProposal` — close the deal
**Input:** estimate data + homeowner name/email/phone
**Output:** Creates a living estimate (shareable link) + optional PDF

**Reuse:** 100% of existing `/api/living-estimate` + PDF generation

### Tools NOT in v1 (cut or defer)
- ❌ Voice input — adds complexity, browser speech API is unreliable on mobile
- ❌ Photo analysis — "take a photo of the roof" → too slow, too error-prone
- ❌ Xactimate integration — enterprise feature, not our market
- ❌ Material ordering — Beacon/ABC integration is a whole product
- ❌ Brand-specific pricing (GAF vs Owens Corning) — we price by material type, not brand. Add later.

### Liability Guardrails

Riley has 6 guardrails. Estimate Copilot needs different ones:

1. **"This is YOUR estimate tool"** — Copilot helps calculate, roofer owns the final price
2. **Never auto-send to homeowner** — always require explicit "send this" action
3. **Margin data stays private** — never included in proposals sent to homeowners
4. **Market comparison is directional** — "BLS data suggests..." not "you should charge..."
5. **Weather surge is flagged but not auto-applied** — "NOAA shows active storm warnings, consider surge pricing"
6. **No insurance/Xactimate scope** — we're retail quoting only, redirect insurance work questions

### UX: Where Does It Live?

**Option A: Chat tab in Copilot (recommended)**
- Already have streaming chat with tool use
- Add estimate tools alongside existing lead tools
- Roofer opens Copilot → Chat tab → "estimate 3200 sqft 8/12 pitch architectural"
- Mobile-friendly (dashboard is responsive)
- Zero new UI to build — just new tools + system prompt updates

**Option B: Dedicated Estimate page**
- Separate `/dashboard/estimate-builder` page
- Form-based input with chat assist
- More structured but more to build
- Loses the "just talk to it" magic

**Recommendation: Option A.** The whole point is conversational. The chat tab already exists and works. Add tools, update the system prompt, done.

---

## Part 5: Build Plan

### What We Can Reuse (massive head start)

| Existing Code | Reuse For | Changes Needed |
|---------------|-----------|----------------|
| `lib/estimate.ts` | Core calculation | Add manual measurement input path (skip Solar API) |
| `lib/solar-api.ts` | Address → roof data | None — already works |
| `lib/roof-geometry.ts` | Ridge/hip/valley | None |
| `lib/metro-pricing.ts` | Market comparison | Add comparison function (your price vs metro avg) |
| `lib/weather-surge.ts` | Storm detection | None |
| `lib/chat-estimate.ts` | Estimate pipeline | Refactor to support manual measurements + margin calc |
| `lib/copilot-tools.ts` | Tool registration | Add 5 new tools |
| `lib/copilot-system-prompt.ts` | System prompt | Add estimate capability section |
| `app/api/copilot/route.ts` | Chat endpoint | Register new tools |
| `app/api/living-estimate/route.ts` | Proposal generation | None — call from tool |
| Copilot Chat UI | Display | Add estimate card rendering (similar to Riley's) |

### What's New (~200-300 lines)

1. **`lib/copilot-estimate-tools.ts`** (~150 lines)
   - 5 tool functions with Zod schemas
   - `calculateRoofEstimate()` — wraps existing engine, adds manual measurement path
   - `compareMaterials()` — multi-material table from existing calcs
   - `checkLocalPricing()` — metro comparison using BLS data
   - `calculateProfitMargin()` — new, ~30 lines of margin math
   - `generateProposal()` — wraps existing living estimate API

2. **System prompt update** (~50 lines)
   - Add "Estimate Copilot Capabilities" section
   - Tool usage guidelines (when to use address vs manual, how to present margins)
   - Guardrails section

3. **Chat UI: estimate result card** (~100 lines)
   - Render estimate breakdown in chat (reuse patterns from Riley's estimate card)
   - Material comparison table component
   - Margin visualization
   - "Send to Homeowner" button on estimate results

### Build Order

1. **Tool functions** — `lib/copilot-estimate-tools.ts` (all 5 tools)
2. **Wire tools into Copilot** — register in route + system prompt
3. **Chat UI cards** — render estimate results in chat tab
4. **Test E2E** — estimate by address, by measurements, margin calc, proposal generation
5. **Polish** — error states, loading states, mobile check

### API Cost Per Use

| API | Cost | When Used |
|-----|------|-----------|
| Google Solar API | ~$0.04/call | Only when address provided (cached) |
| Google Geocoding | ~$0.005/call | Only when address provided |
| NOAA Weather | Free | Always (cached 1hr) |
| Anthropic Haiku (Copilot chat) | ~$0.002/message | Every message (cached prompt) |
| **Total per estimate** | **~$0.05** (address) or **$0.002** (manual) | |

Manual measurement estimates are essentially FREE — no external API calls except Haiku.

---

## Part 6: Why This Wins

### vs. Competitors
- **Roofle/Roofr:** They give homeowners quotes. We give roofers a quoting partner.
- **QuoteIQ:** They sell a $149/mo CRM with AI. We bundle it FREE in Pro.
- **XBuild:** They're generic construction. We're roofing-specific with satellite data.
- **Spreadsheets:** They work but you can't use them on a roof while talking to a homeowner.

### The "holy shit" moment
A roofer is on a roof during an inspection. The homeowner asks "how much?" The roofer pulls out his phone, opens RuufPro, types "3200 sqft 8/12 pitch architectural shingles 2 layer tear-off" and in 3 seconds has:
- A price range ($11,200 - $13,400)
- His profit margin at $13K (41%)
- A comparison to Tampa market average
- A "Send to Homeowner" button that delivers a professional proposal before he climbs down the ladder

**That's worth $149/mo alone.**
