# Customization Strategy Research

What should roofers be able to customize on their RoofReady template site? Tiered by effort vs. impact, informed by competitor analysis.

---

## Competitor Analysis

### Roofr Sites
- AI-powered website builder included with their CRM
- Chooses design direction, then customizes for brand
- Pulls in roofer's story and values via AI
- Auto-pulls Google reviews as social proof
- Embeds their Instant Estimator
- Roofers can use their own domain or get a new one
- AI "refreshes" content over time
- Roofer reviews site before it goes live, can request changes
- **Key takeaway:** Heavy on AI-generated content, light on manual customization. Roofr does the work FOR the roofer.

Source: [Roofr Sites](https://roofr.com/roofr-sites)

### Contractor+
- Upload logo, set brand colors and typography
- Multiple professional templates to choose from
- Client portal at clients.yourwebsite.com
- Auto-generates SEO pages per service area city
- AI drafts business highlights and page descriptions
- Blog feature built in
- Schema markup and local SEO patterns auto-applied
- **Key takeaway:** More customization than Roofr but still AI-assisted. Color/logo branding is a core feature. Auto-generated local SEO pages are a differentiator.

Source: [Contractor+](https://contractorplus.app/websites/)

### Roofing Webmasters (Website Builder)
- Described as "#1 Roofing Website Builder"
- Custom-designed sites with dedicated SEO
- More agency model — they build it for you
- **Key takeaway:** Not self-service. Premium positioning but not our competitor for DIY.

### Wix / Squarespace (Roofing Templates)
- Full customization: colors, fonts, layout, every section
- Drag-and-drop everything
- Too much flexibility = most roofers won't finish setup
- **Key takeaway:** Overkill for our audience. Small roofers don't have time for full website builders. Our advantage is speed + smart defaults.

---

## Customization Tiers

### Tier 1: Auto-Generated (zero roofer input needed)
These use data from onboarding (name, phone, city, state) and smart defaults:

| What | How It Works |
|------|-------------|
| Hero headline | "Trusted Roofing in [City]" — auto-filled |
| Subheadline | "Quality Roof Replacement & Repair You Can Count On" |
| SEO meta title | "[Business] — Roof Replacement & Repair in [City]" |
| SEO meta description | Auto-generated from business type + city |
| Service area text | "Proudly serving [City], [State] and surrounding areas" |
| About text | Template with [Business] and [City] placeholders |
| Default services | Roof Replacement, Repair, Inspections, Gutters |
| Footer | Business name, phone, city, state |
| "Powered by RoofReady" link | Always present on free tier |

### Tier 2: Quick Wins (checkbox or single field, big impact)
These take <1 minute each and significantly improve trust:

| What | Input Type | Impact |
|------|-----------|--------|
| Licensed | Checkbox | High — shows "Licensed" badge |
| Insured | Checkbox | High — shows "Insured" badge |
| Years in business | Number | High — shows "[X]+ Years" badge |
| GAF Master Elite | Checkbox | High — top certification |
| Owens Corning Preferred | Checkbox | High — major certification |
| CertainTeed Select | Checkbox | Medium |
| BBB Accredited + Rating | Checkbox + select | Medium |
| Offers Financing | Checkbox | Medium — shows "Financing Available" |
| Warranty years | Number | Medium — shows "[X]-Year Warranty" |

**Already built in our schema.** These just need to be surfaced in the dashboard and rendered on the template.

### Tier 3: Optional Polish (for roofers who want to invest time)
These take 5-15 minutes but make the site feel truly custom:

| What | Input Type | Impact | Priority |
|------|-----------|--------|----------|
| Logo upload | File upload | High — most visible branding element | Build now |
| Custom headline | Text field | Medium — override default | Build now |
| Phone number update | Text field | High — already collected at onboarding | Already built |
| Additional service cities | Tag input | Medium — expands service area section | Already built |
| Customer reviews | Form (name, text, rating) | High — social proof is #1 converter | Build now |
| Gallery/project photos | Image upload | Medium-High — visual proof of work | Defer (storage costs) |
| Custom about text | Textarea | Low — default is good enough for most | Already in schema |
| Custom services list | Editable list | Low — defaults work for most residential | Already in schema |

### Tier 4: Not Worth Building (yet)
| What | Why Defer |
|------|----------|
| Full color/font customization | Too complex for V1. Pick good defaults. |
| Page builder / drag-and-drop | We're not Squarespace. Speed is our advantage. |
| Custom pages (About, Gallery, etc.) | Single-page template is enough for V1 |
| Blog / content management | Roofers won't write blogs. Defer indefinitely. |
| Animated elements / effects | Homeowners need trust, not tech demos |
| Multi-language support | Niche, defer |
| Chat widget | Third-party integration, defer |
| Auto-pull Google reviews | Needs Google API integration, great for V2 |
| AI content generation | Roofr does this, could be V2 differentiator |
| Service area SEO pages | Contractor+ does this, good V2 feature |

---

## Accent Color — Should We Offer It?

### What competitors do
- **Contractor+**: Yes — logo, colors, and typography customizable
- **Roofr**: Colors set during initial AI design, not ongoing customization
- **Wix/Squarespace**: Full color control

### Recommendation: Yes, but simplified
Offer a **single accent color picker** (or 6-8 preset color options) rather than full theme customization. This gives roofers brand alignment with minimal UI complexity.

**Preset options could include:**
- Blue (default — professional, trustworthy)
- Green (eco/sustainable, growth)
- Red/Dark Red (bold, urgent — good for storm chasers)
- Orange (energetic, friendly)
- Navy (premium, established)
- Slate (neutral, modern)

**Implementation:** One CSS variable (`--accent`) that cascades through buttons, links, badges, and section accents. Already partially set up in our themes.ts approach.

**When to build:** After the first template is working with the blue default. Easy to add later without redesigning anything.

---

## Biggest Impact Per Minute of Roofer Effort

Ranked by how much the site improves per minute the roofer spends:

1. **Trust checkboxes** (10 seconds each, huge trust impact) — Licensed, Insured, certifications
2. **Years in business** (5 seconds, strong trust badge)
3. **Logo upload** (2 minutes, makes site feel "theirs")
4. **3 customer reviews** (10 minutes, #1 conversion factor)
5. **Additional service cities** (1 minute, expands reach)
6. **Custom headline** (2 minutes, personal touch)
7. **Gallery photos** (15 minutes, visual proof — defer for V1)
8. **Custom about text** (10 minutes, low impact vs default)

---

## Recommendation for V1

**Build the template with these customization levels:**

**Onboarding (required, 2 minutes):**
- Business name, phone, city, state, design style

**Dashboard — Quick Setup (optional, 5 minutes):**
- Trust checkboxes (licensed, insured, certs)
- Years in business
- Logo upload
- Warranty years

**Dashboard — Polish (optional, 15 minutes):**
- Add customer reviews (manual entry)
- Custom headline
- Additional service area cities
- Custom about text

**Defer to V2:**
- Accent color picker
- Gallery/project photos
- Auto-pull Google reviews
- AI content suggestions
- Service area SEO pages

This keeps onboarding under 2 minutes, gives roofers a site they're proud of immediately, and provides a clear path to make it better over time.

---

## Sources
- [Roofr Sites](https://roofr.com/roofr-sites)
- [Roofr — Roofers Guide to Building a Website](https://roofr.com/blog/roofing-website-guide)
- [RooferBase — Roofr Software Review 2025](https://www.rooferbase.com/blog/roofr-software-what-roofers-need-to-know-in-2025)
- [Contractor+](https://contractorplus.app/websites/)
- [Contractor+ Blog — Build Websites in Minutes](https://contractorplus.app/blog/contractor-websites)
- [Roofing Webmasters — Website Builder](https://www.roofingwebmasters.com/website-builder/)
- [Site Builder Report — Contractor Websites](https://www.sitebuilderreport.com/inspiration/contractor-websites)
