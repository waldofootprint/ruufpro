# Concrete & Epoxy Cost-Doubling Scenarios: Research Deep Dive

**Purpose:** Build a calculator smarter than anything on the market by predicting nightmare job scenarios before quoting.

**Sources:** Perplexity deep research + Brave Search, April 2026

---

## PART 1 — CONCRETE / FLATWORK

Base cost reference: $5.50–$9.00/sq ft standard residential flatwork.

---

### SCENARIO 1: High Water Table Discovery

**What happens:**
- Excavation hits saturated soil or standing water
- Hydrostatic pressure prevents proper concrete curing
- Voids form under slab as water later drains/evaporates
- Reinforcement corrodes; slab settles and cracks within months
- Dewatering must run through excavation, prep, AND initial cure — weeks, not hours

**Dollar impact:**
- Simple submersible pump rental: $100–$300/day
- Sophisticated dewatering systems: $500–$2,000+/day
- Engineered fill + drainage layers: $2–$5/sq ft added
- Vapor barriers, hydrostatic waterproofing: $0.50–$1.50/sq ft
- Full mitigation cost range: **$5,000–$50,000+** depending on severity and timeline
- Total job multiplier: **1.5x–3x** for affected projects

**How often:**
- 10–20% of flatwork projects in high-risk regions (coastal, Midwest spring, Pacific NW)
- Spring is worst — snowmelt + rain peaks water table in March–June
- Southeast/Gulf Coast: elevated year-round
- Mountain West high desert: low risk (<5%)

**Can it be predicted remotely?**
- YES — this is the most remotely-predictable of all five scenarios
- USGS NGWMN data + SSURGO drainage class = ~75–85% predictive accuracy
- FEMA flood zones (A or V zone) = strong proxy for high water table
- Property in FEMA AE zone = almost certain elevated groundwater risk

**APIs/data sources:**
- **USGS National Groundwater Monitoring Network (NGWMN):** https://www.usgs.gov/apps/ngwmn/ — water levels, water quality, depth-to-water table by well. Free. Coverage gaps in rural areas.
- **USGS Water Data API:** https://api.waterdata.usgs.gov — Daily Values API and Continuous Values API. Query by lat/lon + parameter code for groundwater levels. Free. REST-based.
- **USGS FAQ on depth-to-water:** https://www.usgs.gov/faqs/how-can-i-find-depth-water-table-a-specific-location
- **SSURGO (USDA NRCS):** Query drainage class, seasonal high water table, ponding, flooding frequency by lat/lon. Free. See SDA (Soil Data Access) API below.
- **FEMA NFHL (National Flood Hazard Layer):** https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS — WMS and WFS endpoints. Query flood zone by address/lat/lon. Free.

---

### SCENARIO 2: Expansive Clay Soil

**What happens:**
- Clay minerals (smectite) absorb water → slab heaves upward in wet season
- Clay dries in summer → shrinks → voids under slab → settling and cracking
- Seasonal cycle repeats → progressive structural failure
- Happens even with proper compaction; the soil itself is the problem

**Dollar impact:**
- Foundation repair in worst-case regions (TX): $3,300–$7,000 per repair event
- Mitigation BEFORE pour: engineered fill, moisture barriers, deeper footings
  - Engineered fill replacement: $15–$30/sq ft in severe cases
  - Moisture barrier (vapor) + drainage layer: $2–$5/sq ft
  - Deeper footings below active clay zone: adds $3,000–$8,000 to project
- Typical clay soil remediation adds: **15–25% to total project cost**
- Post-pour repair (if not mitigated): **50–100% of original cost to redo**

**How often:**
- Highly regional — varies dramatically by geology
- In affected regions: 20–40% of residential projects encounter significant expansive clay
- Nationally: ~15% of all US residential flatwork in clay-prone areas

**Highest risk states:**
- Texas (central/north central — worst in US), Oklahoma, Colorado, Kansas
- New Mexico, Utah, Arizona, Missouri, Arkansas, Louisiana
- Specific formations: Eagle Ford Shale (TX), Pierre Shale (CO/WY), Mancos Shale (UT)

**Can it be predicted remotely?**
- YES — SSURGO has shrink-swell potential field for every mapped soil unit
- State geological surveys have formation maps
- County-level soil surveys provide parcel-level data in most areas
- Remote prediction accuracy: **~80%** with SSURGO data

**APIs/data sources:**
- **USDA SSURGO / Soil Data Access (SDA):** https://sdmdataaccess.sc.egov.usda.gov
  - Query fields: `shrinkSwell` (shrink-swell potential), `drainageClass`, `claytotal_r` (clay % by horizon)
  - Method: SQL via WKT geometry — submit lat/lon bounding box, get soil component data
  - Free. Requires constructing SQL queries, not a simple REST endpoint.
  - NRCS user guide: https://www.nrcs.usda.gov/sites/default/files/2023-10/SSURGO%20Portal%20User%20Guide.pdf
- **USDA Web Soil Survey:** https://websoilsurvey.nrcs.usda.gov — interactive, not an API, but same underlying data
- **State geological surveys:** Texas Bureau of Economic Geology, Oklahoma Geological Survey — have formation maps as GIS downloads

---

### SCENARIO 3: Buried Debris / Old Foundations

**What happens:**
- Excavation hits old concrete, brick, wood debris, metal — from demolished structures, previous foundations, old septic tanks, buried utilities
- Work stops; debris must be excavated, sorted, hauled, and disposed of
- Old foundations (concrete/masonry) require breaking before removal
- Old concrete classified as construction/demolition (C&D) waste

**Dollar impact:**
- Debris removal: $50–$150/cubic yard (excavation + haul + dump fees)
- Old concrete breaking + removal: $300–$800 per cubic yard
- Typical full-lot discovery: $500–$3,000 added cost (small debris)
- Major old foundation discovery: $3,000–$15,000+ added
- Job multiplier: **1.5x–3x** for significant buried structures

**How often by property type:**
- New development on previously undeveloped land: **5–10%** (land clearing debris only)
- Standard suburban neighborhoods, 30–50 years old: **15–25%**
- Older urban/in-fill neighborhoods, pre-1960 construction: **30–50%**
- Urban commercial in-fill: **40–60%**

**Can it be predicted remotely?**
- PARTIAL — no direct API for buried debris
- Proxy signals: property age (older = higher risk), prior building permits for demolition, aerial imagery changes (structures that used to exist and were removed)
- EPA Brownfields data flags contaminated/industrial sites (buried debris likely)
- Remote prediction accuracy: **40–60%** using proxies

**APIs/data sources:**
- **EPA Envirofacts API:** https://data.epa.gov/efservice/ — query SEMS (Superfund), RCRAINFO (hazardous waste), FRS (facility registry). Format: `https://data.epa.gov/efservice/{program}.{table}`. Free.
- **EPA EnviroAtlas Brownfields:** https://www.epa.gov/enviroatlas/enviroatlas-brownfields — GIS layers for brownfield sites nationally. Free.
- **Building permit APIs** (see below) — demolition permits on a parcel signal prior structures
- **Google Earth historical imagery:** Can visually confirm structures that were demolished at a given address. Not an API but available via Google Maps JavaScript API (paid).
- **ATTOM property history:** Prior sales + event history may reveal demolition or major renovation permits

---

### SCENARIO 4: Pump Truck Requirement

**What happens:**
- Standard ready-mix truck can't reach the pour location
- Pump truck required to distribute concrete from a staging point
- Not anticipated by homeowner; springs as a line-item surprise at delivery

**Triggers:**
- Property with long driveway, trees, fences, or obstacles blocking direct truck access
- Narrow urban lots or alley-accessed properties
- Elevation change — flatwork located downslope from truck access OR elevated above truck discharge height
- Large pours (20–30+ cubic yards) where pump efficiency beats multiple truck placements
- Complex geometry requiring precise placement control
- Backyard slabs, pool decks, side-yard driveways — anything not front-street accessible

**Dollar impact:**
- Line pump (residential): **$800–$1,800 flat rate** (Angi 2026 data — average $1,200)
- Boom pump (commercial/large): $1,500–$3,500/job
- Hourly rate when applicable: $150–$200/hour for standard jobs
- Per-yard pumped: $3–$5/cubic yard
- Impact as % of project: **+20–40%** on top of base concrete cost
- For a $4,500 driveway, adding a $1,200 pump = **26% cost increase homeowner didn't expect**

**How often:**
- Approximately **30–45%** of residential flatwork jobs require some form of pumping
- Suburban homes with fenced yards: >50%
- Open-access front driveways: <10%

**Can it be predicted remotely?**
- YES — with satellite imagery, highly predictable
- Google Maps Street View + satellite overhead view reveals access constraints
- Questions about backyard location, fence gates, access path = 85%+ predictive

**APIs/data sources:**
- **Google Maps Satellite/Street View API:** Assess site access from overhead and ground-level imagery. $2–$7 per 1,000 requests (Street View Static API).
- **Google Maps Geocoding API:** Resolve address to lat/lon for satellite pull. ~$5/1,000.
- No dedicated "site access" API exists — this is a satellite imagery + structured questions problem.

---

### SCENARIO 5: Failed Soil Compaction / Subgrade Failure

**What happens:**
- Subgrade not compacted to spec (typically 95% standard Proctor density)
- Or: soil type is unsuitable (organic soil, highly plastic clay, loose sand) even with compaction efforts
- Or: soil too wet at placement time → can't achieve spec → pour happens anyway
- Appears fine at pour; cracking develops weeks to months later
- Differential settlement → cracks propagate through full slab thickness → structural failure

**Dollar impact:**
- Mild: Mudjacking/slab lifting = $3–$8/sq ft ($600–$2,400 for 300 sq ft)
- Moderate: Foam lifting (polyurethane) = $5–$25/sq ft ($1,000–$4,500 for 300 sq ft)
- Severe: Full demolition + re-pour:
  - Demo/haul: $1,000–$3,000
  - Re-pour + prep: $5.50–$9.00/sq ft
  - Total: **50–100% of original project cost to redo**
- For a $6,000 driveway: full redo = $7,000–$10,000 added

**How often:**
- Improper compaction (contractor error): ~10–15% of residential jobs show some settling within 5 years
- Unsuitable native soil (site condition): ~5–10% in clay-heavy or organic-soil regions
- Combined: **10–20% of residential flatwork** shows measurable subgrade issues within 3–5 years

**Can it be predicted remotely?**
- PARTIAL — soil type predictable; contractor quality is not
- SSURGO drainage class and soil type flag unsuitable native soil
- Spring season + high water table zone → elevated risk of "too wet at pour time"
- Cannot predict contractor negligence remotely

**APIs/data sources:**
- **SSURGO SDA:** See above. `drainageClass`, `unified_class`, `hydgrp` (hydrologic group) fields identify problem soils.
- **NOAA Climate Data:** Historical precipitation by month/location. Assess whether spring pour timing correlates with wet conditions. API: https://www.ncdc.noaa.gov/cdo-web/webservices/v2

---

## PART 2 — EPOXY / GARAGE FLOOR COATING

Base reference: $3–$7/sq ft installed, typical 500 sq ft garage = $1,500–$3,500.

---

### SCENARIO 1: Moisture Vapor Emission Rate (MVER) Failure

**What actually happens:**
- Moisture vapor transmits through slab from below
- ASTM F1869 test (calcium chloride): measures lbs/1,000 sq ft/24 hrs
- Epoxy applied over failing slab: blisters, bubbles, delaminates within weeks to months
- Soft/rubbery coating that fails under load → catastrophic failure, customer dispute

**MVER thresholds:**
- PASS: <3 lbs/1,000 sq ft/24 hrs (most premium epoxies allow up to 5)
- FAIL: >5 lbs/1,000 sq ft/24 hrs
- Critical fail: >10 lbs — barrier systems required or guaranteed failure

**Dollar impact:**
- Moisture-tolerant epoxy primer substitute: +$0 upfront (but fails in 2–5 years; liability issue)
- Vapor barrier/moisture primer: +$0.75–$2.50/sq ft → $375–$1,250 on 500 sq ft
- Full remediation (dimple membrane + dehumidifier): +$1.50–$3.00/sq ft → $1,050–$2,300 added
- Slab replacement (worst case, structural water ingress): $4–$8/sq ft → $2,000–$4,000+ (job uneconomical)
- Job multiplier: **2x–3x** for jobs requiring full remediation

**How often:**
- National estimate: **15–25% of residential jobs** fail initial MVER test
- Gulf Coast (TX, LA, FL): **40–50% fail rate**
- Midwest (IL, MI, OH): **25–35%**
- Pacific NW (WA, OR): **20–30%**
- Northeast (NY, PA): **15–25%**
- Southwest (AZ, NV, UT): **3–8%** (low humidity, but new concrete issues apply)

**Can it be predicted remotely?**
- 60–70% accuracy using zip code + water table depth + basement/crawlspace questions
- Homeowner visual clues: efflorescence (white powder deposits), visible moisture staining, musty smell → ~70% predictive if present
- DIY calcium chloride test available (<$50) — not ASTM-certified but directional
- USGS groundwater depth + ASHRAE climate zone = reasonable risk proxy

**APIs/data sources:**
- **USGS NGWMN:** Water table depth by county/location. Groundwater <6 ft → medium MVER risk; <3 ft → high risk.
- **NOAA Climate Data API:** Historical relative humidity, precipitation patterns. https://www.ncdc.noaa.gov/cdo-web/webservices/v2
- **Open-Meteo API:** Free weather data including humidity by lat/lon. https://open-meteo.com/
- **ASHRAE climate zone maps:** Zone 1–3 = high humidity, elevated MVER risk. Static reference data, not an API.

**Homeowner self-detection questions:**
1. Ever seen standing water or dampness on the floor?
2. Basement or crawl space below the garage?
3. Visible white powder (efflorescence) on concrete surface?
4. Musty smell in garage?

---

### SCENARIO 2: Unknown Existing Coating Requiring Full Grinding

**What happens:**
- Homeowner doesn't know floor was previously sealed, painted, or coated
- Epoxy won't adhere to old sealed/painted concrete — will peel within months
- Full diamond grinding required to remove all coatings before new epoxy

**Cost difference:**
- Light prep (no coating): degreaser + acid wash = $0.25–$0.50/sq ft → $125–$250 on 500 sq ft
- Full diamond grinding (remove coating): $1.50–$3.00/sq ft labor + equipment → $750–$1,500
- Dust control/containment: +$200–$400
- **Total added cost: $950–$1,900 vs. light prep**
- Timeline: +1–2 full days of work
- Phase prep cost multiplier: **3x–5x on prep alone**

**How often:**
- ~35–45% of jobs have some pre-existing coating
- Of those, 60–70% need full removal
- **Effective "surprise grinding" incidence: 20–30% of jobs**
- Older homes (>20 years): higher risk; coating applied and forgotten

**Can it be predicted remotely?**
- Photos: 60–70% detection accuracy with AI (detect gloss/sheen, non-porous appearance, color uniformity)
- Physical tests (contractor side): water droplet bead test, acetone cloth test, scratch/coin test
- Age of home: strong proxy — homes >15 years old with "updated" garage = coating likely
- Permit data: prior concrete/garage work permits suggest coating activity

**Remote detection strategy:**
- Photo upload → AI checks for gloss (coating likely) vs. porous/matte (bare concrete)
- Ask: "Has this floor been sealed, painted, or coated in the last 15 years?"
- If yes or "don't know" → budget +$800–$1,200 for grinding contingency
- AI detection accuracy (with good training data): **70–80%**

---

### SCENARIO 3: Structural Cracks vs. Cosmetic Cracks

**Cost difference:**
| Type | Width | Repair cost/linear ft | 50 LF total | Epoxy impact |
|------|-------|----------------------|-------------|--------------|
| Hairline (cosmetic) | <1/16" | $0–$0.50 (included in prep) | ~$0 | None |
| Minor cosmetic | 1/16"–1/8" | $0.50–$1.50 | $25–$75 | Bridge, minimal |
| Structural | 1/8"–1/4" | $5–$11 | $250–$550 | Must seal before epoxy |
| Critical structural | >1/4" | $10–$20+ | $500–$1,000+ | May disqualify job |

- Extensive structural cracking: **+$1,000–$3,000** (can 2x–4x the job cost)
- Critical: >1/4" wide OR radiating from corners = foundation issue, may be outside epoxy scope

**How often:**
- Moderate structural cracks (3–5 cracks): **15–20%** of residential garages
- Severe/extensive: **5%** of jobs
- Hairlines (cosmetic only): present in most slabs, not a cost driver

**Contractor differentiation method:**
- Width: digital caliper or visual
- Movement: chalk mark, return in 4–12 weeks (not detectable on first visit)
- Pattern:
  - Random scattered → cosmetic shrinkage
  - Radiating from corner → foundation settling (structural)
  - Perimeter or straight line → joint failure or settlement (structural)
  - Horizontal → often structural

**Can photos predict type?**
- Width detection from photos: ±20–30% accuracy (credit card/ruler in photo helps)
- Pattern recognition: AI can flag radial/perimeter patterns
- **Confidence: 65–75%** for distinguishing cosmetic from structural-risk level
- Cannot detect movement from static photos

---

### SCENARIO 4: Oil Contamination That Has Penetrated the Slab

**Penetration depth:**
- Fresh spill, <48 hours: 1/8"–1/4" deep (surface-level, treatable)
- 1–4 week old: 1/4"–3/4" deep (aggressive treatment needed)
- Months-old or chronic: 1"+ deep, possibly reached sub-slab soil (serious)
- Visual indicator: stain >12" diameter usually = 1"+ penetration

**Dollar impact:**
| Severity | Depth | Added cost | Decision |
|----------|-------|------------|---------|
| Surface stain | <1/8" | $5–$50 | Proceed normally |
| Moderate | 1/8"–1/2" | $100–$300 (+10–20%) | Grind + patch + prime |
| Severe/deep | >1/2" | $500–$2,000+ | Encapsulation or disqualify |
| Sub-slab contamination | Reached soil | $2,000–$10,000+ | Environmental contractor |

**When job is disqualified:**
- Active leak source still present (vehicle leaks, dripping equipment) — must fix first
- Oil has reached sub-slab soil — environmental remediation required
- Customer refuses to address source
- Entire floor chronically darkened — too expensive to remediate

**How often:**
- ~10–15% of residential garage jobs have visible oil stains
- ~5–8% have contamination deep enough to cause epoxy failure

**Can it be predicted remotely?**
- 80% accuracy for visible stains (photo detection)
- 40% accuracy for depth assessment from photo alone
- High-value questions: "Does/did a vehicle leak in this garage?" + "How old is the stain?" + "Is the leak still active?"

---

### SCENARIO 5: Concrete Age Problems (Too New / Too Old)

**TOO NEW (<28–30 days old):**
- MVER off the charts: 5–15 lbs/1,000 sq ft/24 hrs
- Bleed water creates laitance (weak surface layer) → epoxy won't bond
- Fresh concrete pH: 12–13 (extremely alkaline) → epoxy yellowing + adhesion failure
- Remedy: wait (free, but delays revenue) OR accelerate with dehumidifiers + heat
  - Acceleration cost: $300–$800/week × 2–4 weeks = $600–$3,200
  - Moisture barrier primer: +$375–$750 (reduces wait to 14–21 days)
- **Incidence: 5–10%** (new construction jobs)
- **Remotely predictable: 95%** — just ask when concrete was poured

**TOO OLD (10–20+ years):**
| Age | Issue | Added prep cost | Multiplier |
|-----|-------|----------------|------------|
| <28 days | High MVER, bleed water | $0 (delay) or $600–$3,200 | 0.8–6.4x |
| 28 days–2 years | Minimal | $0–$200 | 1.0–1.2x |
| 2–10 years | Light carbonation, minor laitance | $300–$750 | 1.2–1.5x |
| 10–20 years | Carbonation, laitance, degradation | $800–$1,500 | 1.5–2.0x |
| 20+ years | Heavy spalling, prior coatings, crumbling | $1,500–$3,500+ | 2.0–4.0x |

**Specific problems with old concrete:**
- Carbonation: CO2 + moisture = hard non-porous skin → epoxy won't adhere → peels within months
- Laitance: Calcium hydroxide rises to surface → chalky weak layer → bond failure
- Spalling/pitting: Requires patching before coating → $1,000–$2,500 for significant areas
- Prior degraded sealer residue: Must be ground off

**Remotely predictable:** 70–80% via photos (color, spalling, weathering) + age question + permit data

---

## PART 3 — APIS AND DATA SOURCES

### TIER 1: FREE FEDERAL APIS (Build On These First)

**1. USGS Water Data API**
- URL: https://api.waterdata.usgs.gov
- Endpoints: Daily Values, Continuous Values, Monitoring Locations, Time Series Metadata
- Data: Real-time and historical groundwater levels, depth to water table (at monitored wells)
- Format: REST, JSON/WaterML
- Cost: FREE
- Coverage: Good in populated areas; gaps in rural areas
- Use for: Flagging high water table risk zones for MVER + concrete subgrade scenarios

**2. USGS National Groundwater Monitoring Network (NGWMN)**
- URL: https://www.usgs.gov/apps/ngwmn/
- Data: Depth-to-water, water quality, well construction, lithology
- Cost: FREE
- Use for: More specific groundwater queries than the general Water Data API

**3. USDA SSURGO / Soil Data Access (SDA)**
- URL: https://sdmdataaccess.sc.egov.usda.gov
- Method: SQL queries via WKT geometry (not a simple REST endpoint — requires constructing SQL)
- Key fields to query:
  - `shrinkSwell` — shrink-swell potential (critical for expansive clay detection)
  - `drainageClass` — soil drainage classification
  - `claytotal_r` — clay % at various depths
  - `hydgrp` — hydrologic group (A/B/C/D — D = very poor drainage)
  - `slopePct` — slope percentage
  - `depthToWaterTable_l/r/h` — depth to seasonal high water table (low/representative/high)
  - `unified_class` — Unified Soil Classification (flags organic soils, high plasticity clays)
- Cost: FREE
- Coverage: Most of the continental US
- Use for: Expansive clay (TX/OK/CO), water table, unsuitable subgrade prediction

**4. FEMA National Flood Hazard Layer (NFHL)**
- URL: https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS
- Also: FEMA Map Service Center: https://msc.fema.gov/portal/search
- Endpoints: WMS and WFS (OGC-compliant) — queryable by lat/lon or address
- Key output: Flood zone designation (A, AE, V, X, etc.)
- Correlation to water table: AE/AO/AH zones = near-certain high water table risk
- Cost: FREE
- Use for: MVER risk flagging, concrete subgrade risk, dewatering cost warnings

**5. EPA Envirofacts API**
- URL: https://data.epa.gov/efservice/
- Format: `https://data.epa.gov/efservice/{program}.{table}/{field}/{value}/json`
- Key programs: `sems` (Superfund sites), `rcrainfo` (hazardous waste), `tri` (toxic release), `frs` (facility registry)
- Cost: FREE
- Use for: Flagging contaminated sites → likely buried debris, soil contamination
- Practical query: Pull SEMS sites within 0.5 mile radius of address

**6. NOAA Climate Data Online API (CDO)**
- URL: https://www.ncdc.noaa.gov/cdo-web/webservices/v2
- Data: Historical precipitation, temperature, snowfall by station/date range
- Cost: FREE (requires free API token)
- Use for: Seasonal moisture risk (spring pour timing + high precipitation = subgrade/MVER risk)

**7. Open-Meteo API**
- URL: https://open-meteo.com/
- Data: Historical + forecast weather including relative humidity by lat/lon
- Cost: FREE for non-commercial; commercial plans available
- Use for: Humidity risk scoring for MVER prediction, seasonal flagging

---

### TIER 2: PAID COMMERCIAL APIS

**8. ATTOM Data API**
- URL: https://www.attomdata.com/solutions/property-data-api/
- Coverage: 158 million US properties (99% of US population)
- Key fields: Year built (construction date), property characteristics, permit history, sales history
- Format: REST, JSON/XML, query by address, APN, or lat/lon
- Cost: Paid — pricing by volume; contact for quote. Starts ~$250/mo for low-volume dev access.
- Use for: Year built → flag old concrete risk; property characteristics; prior construction history
- Note: Zillow's ZTRAX free API ended 2024; ATTOM is the primary replacement.

**9. Shovels Building Permit API**
- URL: https://www.shovels.ai
- Coverage: ~85% of US population, 1,800+ jurisdictions
- Key fields: Permit type, filing date, issue date, permit value, contractor, status
- Query: Address → get permit list → filter for demolition, concrete, garage, foundation permits
- Cost: Paid — pricing not published; dev/startup tiers available
- Use for: Prior demolition permits (buried debris risk), prior concrete work dates (age of slab), prior garage renovation (likely existing coating)

**10. PermitStack API**
- URL: https://permit-stack.com
- Coverage: 4 million+ permits across 22+ major US cities
- Key fields: Permit category (19 types), status, date, estimated value, contractor
- Cost: Paid — API access pricing on request
- Use for: Same as Shovels, narrower geographic coverage but well-organized categories

**11. Reonomy Property Intelligence API**
- URL: https://api.reonomy.com/v2/docs/api/reference/
- Coverage: Commercial-focused but has residential data
- Cost: Paid — enterprise tier
- Use for: Property history, ownership, building characteristics

---

### TIER 3: AI-POWERED PHOTO ASSESSMENT

**Current state of the technology:**
- Deep learning (VGG-16, ResNet-50, YOLOv8) achieves **94–98% accuracy** on concrete crack classification in research settings
- Commercial: Visionify, MISTRAS Group, Skycatch, Screening Eagle offer commercial concrete assessment platforms
- **Skycatch:** https://skycatch.com — drone-based site survey + AI analysis, primarily for construction/mining, not residential
- **Screening Eagle:** https://www.screeningeagle.com/en/solutions/concrete/defect-detection — concrete defect detection, inspection-focused
- **MISTRAS Group:** https://www.mistrasgroup.com — non-destructive testing + AI, industrial scale

**Practical for your calculator:**
- None of these have affordable self-serve APIs for residential use (all enterprise pricing)
- **Build your own:** YOLOv8n-seg (open source, Ultralytics) can segment and measure cracks from photos. Train on 1,000+ labeled garage floor images. Achieve 70–80% usable accuracy for screening.
- **Interim solution:** Structured photo upload + rule-based scoring (crack width class, gloss detection, staining, efflorescence detection) achieves 60–70% predictive accuracy without ML training data.

---

### TIER 4: GEOLOGICAL SURVEY DATA

**State geological surveys:**
- No standardized API — each state has its own portal
- Most provide GIS shapefiles and WMS/WFS endpoints for web map services
- Pennsylvania DCNR: https://newdata-dcnr.opendata.arcgis.com
- Virginia Department of Energy: https://energy.virginia.gov/webmaps/GeologyMineralResources/
- Texas Bureau of Economic Geology: https://www.beg.utexas.edu
- USGS National Map (aggregates some state data): https://www.usgs.gov/the-national-map-data-delivery/gis-data-download
- Use for: Specific geological formation data, bedrock depth, regional clay formation identification

**USGS Predictive Soil Maps (30m resolution):**
- URL: https://data.usgs.gov/datacatalog/data/USGS:5e90b1aa82ce172707ed639c
- Data: Clay content, soil pH, texture, organic matter at 30-meter resolution for Colorado River Basin
- Method: Random forest model + field samples
- Coverage: Currently regional (Colorado River Basin) — not nationwide
- Cost: FREE
- Use for: Higher resolution than SSURGO in covered areas

---

## PART 4 — RISK SCORING FRAMEWORK

### Concrete Flatwork Risk Score

| Data Source | Signal | Risk Add |
|------------|--------|----------|
| FEMA flood zone AE/AO/AH | High water table near certain | +$3,000–$8,000 |
| USGS water depth <3 ft | Very high water table | +$2,000–$5,000 |
| USGS water depth 3–6 ft | Elevated water table | +$500–$1,500 |
| SSURGO drainageClass = "very poorly drained" | Subgrade risk + water | +$1,000–$3,000 |
| SSURGO shrinkSwell = "high" | Expansive clay mitigation needed | +$2,000–$8,000 |
| SSURGO shrinkSwell = "moderate" | Monitor; engineered fill likely | +$500–$2,000 |
| Home age >50 years (ATTOM) | Buried debris elevated risk | +$500–$3,000 |
| Demolition permit on parcel (Shovels) | Prior structure = debris likely | +$1,000–$5,000 |
| EPA SEMS site within 0.25 mile | Soil contamination possible | Flag for investigation |
| Satellite imagery: backyard/enclosed access | Pump truck likely required | +$800–$1,800 |
| Spring season (March–May) | Water table at seasonal peak | Escalate water table risk |

### Epoxy/Garage Floor Risk Score

| Signal | Source | Risk Add |
|--------|--------|----------|
| ZIP in Gulf Coast, Midwest, PNW | Static lookup | MVER warning; +$375–$2,300 |
| USGS water depth <6 ft | USGS API | MVER medium risk; +$300–$600 |
| USGS water depth <3 ft | USGS API | MVER high risk; +$800–$2,000 |
| "Basement/crawlspace below garage" (question) | Homeowner input | MVER elevated risk |
| Home age >15 years (ATTOM) | ATTOM API | Prior coating likely; +$800–$1,200 |
| Photo shows gloss/sheen | Photo analysis | Prior coating flag; +$950–$1,900 |
| Permit: prior garage/concrete work (Shovels) | Permit API | Coating likely; +$800–$1,500 |
| "Concrete poured <30 days ago" (question) | Homeowner input | Moisture issue; defer or +$600–$3,200 |
| Visible dark staining in photo | Photo analysis | Oil contamination; +$100–$2,000 |
| "Vehicle leaks" (question) | Homeowner input | Oil contamination; assess severity |
| Photo shows efflorescence (white powder) | Photo analysis | MVER/moisture issue confirmed |
| Cracks visible and wide (>1/8") | Photo analysis | Structural crack repair; +$250–$3,000 |
| Radial crack pattern from corners | Photo analysis | Foundation issue flag; consult required |

---

## WHAT COMPETITORS DON'T DO

Every current calculator (Angi, HomeAdvisor, HomeWyse, Concrete Network) gives you:
- Base sq ft price × area
- Maybe a material quality adjustment
- Generic "high water table may cost more" footnotes

None of them:
- Query SSURGO by address to detect expansive clay before quoting
- Pull FEMA flood zone to predict water table risk
- Check permit history for prior demolition (buried debris)
- Use satellite imagery to flag pump truck need
- Score MVER risk by zip code climate zone
- Detect prior coatings from photo gloss analysis
- Cross-reference property age with coating/oil risk

**This is the differentiation:** The calculator knows things the homeowner doesn't, flags them transparently, and gives a range instead of a fake precision number.

---

*Research compiled April 2026 | Sources: Perplexity deep research, USGS, USDA NRCS, FEMA, EPA, Angi, industry contractor forums*
