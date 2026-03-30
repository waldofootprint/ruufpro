# Customization Framework for Template-Based Contractor Websites

A research-backed framework for determining the optimal level of customization in RuufPro's free website builder for roofing contractors.

---

## 1. Academic & Industry Research on Customization vs. Conversion

### The Paradox of Choice Applied to Website Builders

The foundational research comes from Sheena Iyengar and Mark Lepper's famous jam study: when shoppers were offered 24 varieties of jam, only 3% purchased. When the selection was reduced to 6, the purchase rate jumped to 30% — a 10x improvement. This principle maps directly onto website builder customization.

**Key data points:**
- SaaS companies with more than 4 pricing/option tiers see **30% lower conversion** than those offering 3 or fewer options ([Convertize](https://www.convertize.com/paradox-of-choice/))
- A 2024 study of **1.6 million users** found that increasing recommendations initially raised click-through rates, but exceeding a threshold *decreased* action-taking ([BuildGrowScale](https://buildgrowscale.com/paradox-of-choice))
- Progressive disclosure of options (revealing choices gradually rather than all at once) significantly improves both conversions and perceived usability ([Invesp](https://www.invespcro.com/blog/simplicity-over-abundance-of-choice/))

**What this means for RuufPro:** Every customization option added to onboarding has a cost. The builder's job is to present the *minimum* choices needed to create ownership, then progressively reveal more options once the roofer is invested.

### The IKEA Effect — How Much Customization Creates Ownership

Coined by Harvard Business School professor Michael Norton in 2011, the IKEA effect describes why people value self-assembled products more than identical pre-built ones. The core mechanism is **effort + successful completion = perceived ownership**.

**Key findings:**
- The effort must be *creative and configurative* — not tedious technical work ([Braingineers](https://www.braingineers.com/post/the-ikea-effect))
- The sweet spot is **low effort, high perceived contribution** — users feel they "built it" even though the system did the heavy lifting ([Octet Design](https://octet.design/journal/ikea-effect/))
- In SaaS, the effect works when products "eliminate tedious technical upkeep to free up capacity for the empowering labor of co-creation" ([Cognitigence](https://www.cognitigence.com/blog/ikea-effect-in-saas-building-customer-loyalty))
- Too much complexity in customization **reverses** the effect — frustrated users instead of engaged ones

**What this means for RuufPro:** Roofers should feel like they "made" their website by making a few high-visibility choices (business name, logo, color, a certification checkbox). The system handles everything else. The result looks custom, the effort was minimal, and the roofer feels ownership.

### Decision Fatigue in Onboarding Flows

**Carnegie Mellon research:** When users face more than 3-4 choices simultaneously during onboarding, completion rates drop by up to 60%.

**Additional data:**
- The optimal onboarding flow is **3 to 7 core steps** with progressive disclosure for advanced features ([Design Revision](https://designrevision.com/blog/saas-onboarding-best-practices))
- Flows longer than 20 steps drop completion by 30-50%
- **Every extra form field costs 7% conversion** ([SSOJet](https://ssojet.com/ciam-qna/progressive-profiling-frictionless-onboarding))
- Time-to-value should be under 5 minutes, with the first "aha moment" ideally within 2-5 minutes ([Flowjam](https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist))
- One SaaS platform improved registration completion from **23% to 67%** by simplifying their flow — a 191% improvement ([Context.dev](https://www.context.dev/blog/saas-onboarding-best-practices))

**What this means for RuufPro:** Onboarding should collect 4-5 fields maximum. Everything else moves to the dashboard.

---

## 2. Retention & Conversion Frameworks

### What Customization Increases Retention (Makes Users Stay)

Research on SaaS churn shows that **20-70% of churn happens within the first 100 days** ([10Web](https://10web.io/blog/boost-customer-retention-with-website-builder/)). The users who survive this window share common traits:

| Retention Driver | Why It Works | RuufPro Application |
|---|---|---|
| **First success milestone** reached quickly | Users who see their site live within minutes are emotionally committed | Generate a working site from onboarding data alone |
| **Visible personal investment** | Logo, name, and certs on the site trigger the IKEA effect | Make these the first dashboard customizations |
| **Progressive improvement** | Users who return to add content build a habit loop | Dashboard nudges: "Add your certifications for a trust badge" |
| **External sharing** | Once a roofer shares their URL with a customer, switching costs go up | Make the share/preview link prominent immediately |
| **Received a lead** | Any lead through the site proves value | Contact form must work from day one |

### What Customization Increases Conversion (Makes Users Upgrade)

Freemium-to-paid conversion rates average **3-5%** for self-serve SaaS, with top performers reaching **6-8%** ([First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)). Key upgrade triggers:

| Conversion Trigger | Industry Pattern | RuufPro Application |
|---|---|---|
| **Usage limits hit naturally** | Slack gates message history, not messaging | Free: site works. Paid: estimate widget generates revenue |
| **"Aha moment" within 5 minutes** | Products achieving this show **80% higher conversion** | Show a live preview with their business name immediately |
| **Visible premium features** | Users see what they're missing without being blocked | Show "Estimate Widget" in dashboard, greyed out on free |
| **In-context upgrade prompts** | 2x conversion vs. separate checkout pages | "Your site got 12 visitors this month. Upgrade to capture estimates" |
| **Social proof of upgrade value** | Testimonials from peers who upgraded | "Roofers with the estimate widget close 3x more leads" |

**The core principle from Stripe's research:** Gate power, not access. Free users do the core job (have a website). Paid users do it better (capture estimate leads).

### What Customization Causes Churn

| Churn Driver | Why It Hurts | How To Avoid |
|---|---|---|
| **Too many options at once** | Paralysis, abandonment, never launches site | Progressive disclosure, smart defaults |
| **Full color/font freedom** | Ugly results = embarrassment = deletion | Preset palettes, curated pairings only |
| **Drag-and-drop layouts** | Broken designs on mobile, frustration | Fixed template structure, reorderable sections only |
| **Blank text fields** | "What do I write?" = abandoned onboarding | Pre-filled templates with placeholders |
| **No visible progress** | Users don't see their site improving | Real-time preview, progress indicators |
| **Complexity without payoff** | Spending 30 min on something that looks the same | Every customization must have visible impact |

### The "Just Enough" Principle — Minimum Viable Customization

Based on the research above, the formula is:

> **MVC = enough choices to trigger the IKEA effect, few enough to avoid decision fatigue**

Quantified:
- **3-5 choices during onboarding** (under 2 minutes)
- **5-8 "quick win" options in dashboard** (each under 30 seconds)
- **3-5 "polish" options for invested users** (each 2-5 minutes)
- **Zero layout/structural decisions** for free tier users

---

## 3. Tiered Customization Model

### The Three Tiers

| Tier | Name | User Action | Time | Target User |
|---|---|---|---|---|
| **Auto** | "We handle it" | Zero input — system generates from minimal data | 0 sec | Every user |
| **Quick Pick** | "Choose from presets" | Select from 4-8 curated options | 5-30 sec | Most users |
| **Custom** | "Full control" | Open text/upload/picker | 1-15 min | Invested users |

### Every Customization Option, Assigned to a Tier

#### Identity & Contact

| Option | Recommended Tier | Rationale |
|---|---|---|
| **Business name** | Quick Pick (onboarding) | Must be collected. Single text field. |
| **Phone number** | Quick Pick (onboarding) | Must be collected. Single field. |
| **City / service area** | Quick Pick (onboarding) | Must be collected for SEO + hero text. |
| **Email address** | Quick Pick (onboarding) | Needed for account + contact form routing. |
| **Additional service cities** | Custom (dashboard) | Nice-to-have, not critical for launch. |
| **Social media links** | Custom (dashboard) | Most small roofers don't have active socials. Low priority. |

#### Visual Branding

| Option | Recommended Tier | Rationale |
|---|---|---|
| **Color scheme** | Quick Pick (dashboard) | 6-8 preset palettes. NOT a full color picker. Prevents ugly results while triggering IKEA effect. |
| **Font pairing** | Auto | Lock this down. Roofers picking fonts = bad outcomes. Use DM Sans + Sora or similar. |
| **Logo upload** | Quick Pick (dashboard) | High-visibility, high-ownership. Site looks "theirs" instantly. But don't require it — show a styled text logo as default. |
| **Hero image** | Auto (with Quick Pick override) | Default to a professional stock roofing photo. Allow upload in dashboard for users who have good project photos. |
| **Favicon** | Auto | Generate from logo or use default. Zero user input needed. |

#### Content

| Option | Recommended Tier | Rationale |
|---|---|---|
| **Hero headline** | Auto (with Custom override) | Auto-generate "Trusted Roofing in [City]". Allow override in dashboard for power users. |
| **Tagline / subheadline** | Auto (with Custom override) | Pre-fill with proven copy. Allow edit in dashboard. |
| **About text** | Auto (with Custom override) | Template with [Business] and [City] placeholders works for 80% of users. |
| **Services list** | Auto (with Quick Pick edit) | Default: Roof Replacement, Repair, Inspections, Gutters. Editable checklist in dashboard (add/remove from preset list). |
| **Service descriptions** | Auto | Pre-written. Not worth asking roofers to write copy. |

#### Trust & Credibility

| Option | Recommended Tier | Rationale |
|---|---|---|
| **Licensed checkbox** | Quick Pick (dashboard) | Single click, huge trust badge impact. |
| **Insured checkbox** | Quick Pick (dashboard) | Single click, huge trust badge impact. |
| **Years in business** | Quick Pick (dashboard) | Single number field, generates "[X]+ Years" badge. |
| **Certifications** (GAF, Owens Corning, etc.) | Quick Pick (dashboard) | Checkboxes. Instant credibility badges. |
| **BBB Accredited** | Quick Pick (dashboard) | Checkbox + optional rating select. |
| **Warranty years** | Quick Pick (dashboard) | Single number, generates badge. |
| **Offers financing** | Quick Pick (dashboard) | Checkbox, generates badge. |
| **Customer reviews** | Custom (dashboard) | Manual entry form (name, text, rating). High impact but takes 5-10 min to enter 3 reviews. |
| **Google review integration** | Auto (V2) | Auto-pull from Google Business Profile. Defer to V2. |

#### Structure & Layout

| Option | Recommended Tier | Rationale |
|---|---|---|
| **Page order / section order** | Auto | Lock this. Proven conversion-optimized order. Do NOT let users rearrange. |
| **Contact form fields** | Auto | Name, phone, email, message. Don't let users remove critical fields. |
| **Custom domain** | Quick Pick (paid tier) | Natural upgrade trigger. Free = ruufpro.com/business-name. Paid = their domain. |
| **"Powered by RuufPro" badge** | Auto (free) / removable (paid) | Industry standard. Carrd, Wix, Jobber all do this on free tiers. |

---

## 4. Competitive Analysis

### Vertical Competitors (Contractor-Specific)

| Platform | Customization Approach | Key Insight |
|---|---|---|
| **Roofr** | AI-generated site from minimal input. Roofer reviews before publish, can request changes. Colors set during initial AI design. Auto-pulls Google reviews. | Heavy AI, light manual customization. "We do the work FOR you." Roofers love the low effort. |
| **Roofle** | Not a website builder — embeddable estimate widget. Customizable brand colors, fonts, buttons, product catalog, and per-market pricing. | Widget-first approach. Customization is about the *tool*, not the *site*. Similar to RuufPro's widget strategy. |
| **Contractor+** | Logo, brand colors, typography customizable. Multiple templates. AI-drafted content. Auto-generates SEO pages per service city. Blog feature built in. | More customization than Roofr but still AI-assisted. Color/logo branding treated as a core feature. |
| **Jobber** | Free website with any plan. Sections can be added, removed, reordered. Hero, lists, cards, testimonials, gallery, FAQ, forms. Custom domain, brand colors, work photos. Google Business Profile integration. | Most customizable of the contractor tools. Section-based (not drag-and-drop). Good model for "Quick Pick" tier. |
| **ServiceTitan** | No website builder. Enterprise CRM focus. | Not a direct competitor for website building. |

### Horizontal Competitors (General Website Builders)

| Platform | Free Tier | Customization Approach | Key Insight |
|---|---|---|---|
| **Wix** | Subdomain, Wix branding, 2GB storage, limited forms | Unstructured drag-and-drop — total freedom | Too much freedom = most small business owners never finish. Completion rates are low. |
| **Squarespace** | No free plan (14-day trial only) | Structured grid editor — drag elements into rows/columns | Constraints produce better-looking results. Templates are praised for quality. |
| **Carrd** | 1 site, carrd.co subdomain, branding badge, 50-component limit | Block-based editor — elements go in designated spots | Simplicity is the product. 250+ templates. Sweet spot for single-page sites. Most relevant model for RuufPro. |
| **Typedream** | 1 page, typedream.app domain, badge, 5% transaction fee | Drag-and-drop with pre-made structures | Free plan suits testing and solo projects. Upgrade unlocks custom domain + integrations. |
| **GoDaddy** | Free with branding | AI-assisted setup, limited customization on free tier | Fast setup, but very generic results. |

### The Sweet Spot for a FREE Tier

Based on competitive analysis, the industry standard for free website tiers:

**Always included free:**
- Professional template (not blank canvas)
- Business name, phone, core info displayed
- Contact form / lead capture
- Mobile-responsive design
- Basic SEO (meta title, description)
- SSL / hosting

**Always locked behind paid:**
- Custom domain (this is the #1 universal upgrade trigger)
- Remove platform branding/badge
- Advanced analytics
- Integrations (email, CRM, etc.)
- Multiple pages or expanded features

**RuufPro's unique advantage:** The free tier IS the full website. The paid tier is a completely different product category (estimate widget). This is cleaner than competitors who gate website features behind payment. The website serves as both a useful product AND a distribution channel for the widget.

---

## 5. Onboarding Flow Optimization

### Research-Backed Onboarding Principles

| Principle | Data | Source |
|---|---|---|
| Optimal steps | 3-7 core steps | [Design Revision](https://designrevision.com/blog/saas-onboarding-best-practices) |
| Max simultaneous choices | 3-4 before decision fatigue | Carnegie Mellon HCI |
| Each extra field costs | 7% conversion drop | [SSOJet](https://ssojet.com/ciam-qna/progressive-profiling-frictionless-onboarding) |
| Time to first value | Under 5 minutes | [Flowjam](https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist) |
| "Aha moment" timing | Within 2-5 minutes = 80% higher conversion | Mixpanel 2023 Benchmarks |
| Users completing onboarding | 2x lower 30-day churn (7-10% vs 15-20%) | [UXCam](https://uxcam.com/blog/saas-onboarding-best-practices/) |
| Focus per step | Single primary action | [Userpilot](https://userpilot.com/blog/user-onboarding-guide/) |

### Recommended Onboarding Flow (4 Steps, Under 2 Minutes)

**Step 1: Account (30 seconds)**
- Email
- Password (or Google OAuth)
- *That's it. No name, no phone, no company yet.*

**Step 2: Your Business (30 seconds)**
- Business name
- Phone number
- City, State

**Step 3: Your Site (30 seconds)**
- Color palette (6 preset swatches, one pre-selected as default)
- Logo upload (optional, with "Skip — we'll use your business name" clearly shown)

**Step 4: Preview + Launch (30 seconds)**
- Show the fully generated site with a live preview
- "This is your site. Ready to go live?" with a single button
- Link to dashboard for further customization

**Total fields collected: 5-6** (email, password, business name, phone, city/state, optional logo)
**Total time: Under 2 minutes**
**"Aha moment": Step 4** — seeing a professional site with their name on it

### What to Ask in Dashboard Later (Progressive Profiling)

**First Dashboard Visit — "Complete Your Site" Checklist:**
1. Add your certifications (checkboxes — 30 seconds)
2. Add years in business (number field — 5 seconds)
3. Add your first customer review (form — 3 minutes)
4. Upload a project photo (optional — 2 minutes)

**Available Anytime in Settings:**
- Edit headline / tagline
- Edit about text
- Edit services list
- Add service area cities
- Add social links
- Change color palette
- Change/upload logo
- Upload hero image

### What to Lock / Automate (Users Never Touch)

| Locked Element | Reason |
|---|---|
| Font pairing | Prevents ugly results. Curated pair applied to all sites. |
| Page structure / layout | Conversion-optimized order. Not negotiable. |
| Contact form fields | Name, phone, email, message. Removing fields hurts lead quality. |
| SEO meta tags | Auto-generated from business data. Most roofers don't understand SEO. |
| Mobile responsiveness | Automatic. No separate "mobile editor." |
| SSL certificate | Automatic. |
| Hosting / performance | Automatic. |
| "Powered by RuufPro" badge (free) | Revenue driver. Removed on paid plans. |

---

## 6. Recommended System for RuufPro

### Option-by-Option Recommendations

| # | Option | Tier | When | Free/Paid | Build Priority |
|---|---|---|---|---|---|
| 1 | Business name | Quick Pick | Onboarding | Free | P0 (built) |
| 2 | Phone number | Quick Pick | Onboarding | Free | P0 (built) |
| 3 | City / State | Quick Pick | Onboarding | Free | P0 (built) |
| 4 | Email | Quick Pick | Onboarding | Free | P0 (built) |
| 5 | Color palette (6-8 presets) | Quick Pick | Onboarding + Dashboard | Free | P1 |
| 6 | Logo upload | Quick Pick | Onboarding (optional) + Dashboard | Free | P1 |
| 7 | Licensed / Insured checkboxes | Quick Pick | Dashboard | Free | P1 |
| 8 | Years in business | Quick Pick | Dashboard | Free | P1 |
| 9 | Certifications (GAF, OC, etc.) | Quick Pick | Dashboard | Free | P1 |
| 10 | Warranty years | Quick Pick | Dashboard | Free | P2 |
| 11 | Offers financing | Quick Pick | Dashboard | Free | P2 |
| 12 | Customer reviews (manual) | Custom | Dashboard | Free | P1 |
| 13 | Custom headline override | Custom | Dashboard | Free | P2 |
| 14 | Custom about text | Custom | Dashboard | Free | P2 |
| 15 | Edit services list | Quick Pick | Dashboard | Free | P2 |
| 16 | Additional service cities | Custom | Dashboard | Free | P2 |
| 17 | Hero image upload | Custom | Dashboard | Free | P3 |
| 18 | Social media links | Custom | Dashboard | Free | P3 |
| 19 | Custom domain | Quick Pick | Dashboard | **Paid** | P1 |
| 20 | Remove "Powered by" badge | Auto | Dashboard | **Paid** | P1 |
| 21 | Estimate widget | N/A | Dashboard | **Paid** | P0 (core product) |
| 22 | Google review auto-pull | Auto | Dashboard | **Paid** | P3 (V2) |
| 23 | AI content generation | Auto | Dashboard | **Paid** | P3 (V2) |
| 24 | Service area SEO pages | Auto | Dashboard | **Paid** | P3 (V2) |
| 25 | Font pairing | **Locked** | Never | N/A | N/A |
| 26 | Page layout / section order | **Locked** | Never | N/A | N/A |
| 27 | Contact form fields | **Locked** | Never | N/A | N/A |
| 28 | Drag-and-drop editor | **Never build** | Never | N/A | N/A |

### Build Priority Order

**P0 — Already built or core product:**
- Business name, phone, city/state, email collection
- Estimate widget (the paid product)

**P1 — Build next (highest ROI):**
1. Color palette presets (6-8 options, one CSS variable)
2. Logo upload with text-logo fallback
3. Trust badge checkboxes (licensed, insured, certs, years)
4. Manual customer review entry (name, text, rating)
5. Custom domain connection (paid tier trigger)
6. "Powered by RuufPro" badge removal (paid tier)

**P2 — Build after P1 (nice-to-have):**
7. Headline/tagline override
8. About text editing
9. Services list editing (add/remove from presets)
10. Service area cities
11. Warranty years / financing badges

**P3 — V2 features (defer):**
12. Hero image upload (need image storage/CDN)
13. Social media links
14. Google review auto-pull (API integration)
15. AI content suggestions
16. Service area SEO pages

### Free vs. Paid Tier Strategy

**Free tier gives:**
- Full professional website (not a teaser)
- All visual customization (colors, logo, content)
- All trust/credibility features (badges, reviews)
- Lead capture via contact form
- ruufpro.com/business-name subdomain
- "Powered by RuufPro" badge

**Paid tier ($99/mo) unlocks:**
- Estimate widget (the core product — this is why they pay)
- Custom domain
- Badge removal
- Future: Google review sync, AI content, SEO pages

**Why this works:** The free tier is genuinely useful. Roofers get a site they're proud of. They share the URL with homeowners. The "Powered by RuufPro" badge drives organic signups. When roofers see competitors using the estimate widget, or when they want to look more professional with a custom domain, they upgrade. The free tier is the distribution engine, not a stripped-down demo.

### Metrics to Track

| Metric | What It Tells You | Target |
|---|---|---|
| **Onboarding completion rate** | Is the flow too long/complex? | >70% |
| **Time to live site** | How fast do users see value? | <3 minutes |
| **Dashboard return rate (7-day)** | Are users coming back to customize? | >40% |
| **Customization depth score** | How many optional fields did users fill? | 4+ out of 10 |
| **Trust badge completion** | Are users adding certifications? | >50% |
| **Review addition rate** | Are users adding social proof? | >25% |
| **Logo upload rate** | Are users branding their site? | >30% |
| **Site share rate** | Are users sharing their URL? | >20% |
| **Free-to-paid conversion** | Is the widget compelling enough to pay? | >5% (target 8%) |
| **30-day retention** | Are free users keeping their site? | >60% |
| **Time to first lead** | How fast does the site generate value? | <14 days |
| **"Powered by" click-through** | Is the badge driving new signups? | Track volume |

### Key Decision Framework

When evaluating any new customization feature, run it through this checklist:

1. **Does it take under 30 seconds?** If not, it's Custom tier (dashboard only, never onboarding).
2. **Can the user make an ugly result?** If yes, offer presets instead of free-form.
3. **Does 80% of users need it?** If not, hide it behind "Advanced" or progressive disclosure.
4. **Does it create visible change?** If the site looks the same after, it's not worth building yet.
5. **Does it increase trust or conversion?** Prioritize trust signals (badges, reviews) over aesthetics.
6. **Does it create switching costs?** Features that make the roofer more invested (reviews, logo, content) increase retention.
7. **Does it naturally lead to an upgrade?** The best free features make roofers want *more* — which is the paid tier.

---

## Sources

- [Convertize — Paradox of Choice](https://www.convertize.com/paradox-of-choice/)
- [Invesp — Simplicity Over Abundance of Choice](https://www.invespcro.com/blog/simplicity-over-abundance-of-choice/)
- [BuildGrowScale — Paradox of Choice](https://buildgrowscale.com/paradox-of-choice)
- [Braingineers — IKEA Effect](https://www.braingineers.com/post/the-ikea-effect)
- [Cognitigence — IKEA Effect in SaaS](https://www.cognitigence.com/blog/ikea-effect-in-saas-building-customer-loyalty)
- [Octet Design — IKEA Effect](https://octet.design/journal/ikea-effect/)
- [IxDF — IKEA Effect](https://ixdf.org/literature/topics/ikea-effect)
- [Design Revision — SaaS Onboarding Best Practices 2026](https://designrevision.com/blog/saas-onboarding-best-practices)
- [SSOJet — Progressive Profiling](https://ssojet.com/ciam-qna/progressive-profiling-frictionless-onboarding)
- [Flowjam — SaaS Onboarding 2025](https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist)
- [Context.dev — SaaS Onboarding Best Practices](https://www.context.dev/blog/saas-onboarding-best-practices)
- [UXCam — SaaS Onboarding](https://uxcam.com/blog/saas-onboarding-best-practices/)
- [Userpilot — User Onboarding Guide](https://userpilot.com/blog/user-onboarding-guide/)
- [10Web — Boost Retention with Website Builder](https://10web.io/blog/boost-customer-retention-with-website-builder/)
- [First Page Sage — SaaS Freemium Conversion Rates 2026](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- [Userpilot — Progressive Disclosure Examples](https://userpilot.com/blog/progressive-disclosure-examples/)
- [Lollypop Design — Progressive Disclosure in SaaS](https://lollypop.design/blog/2025/may/progressive-disclosure/)
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Roofr Sites](https://roofr.com/roofr-sites)
- [Roofle](https://offers.roofle.com)
- [Contractor+](https://contractorplus.app/websites/)
- [Jobber Website Builder](https://www.getjobber.com/features/marketing-tools/website/)
- [Jobber Help — Website Sections](https://help.getjobber.com/hc/en-us/articles/25620058162455-Website-Marketing-Tools)
- [Carrd](https://carrd.co)
- [Tech.co — Carrd Review](https://tech.co/website-builders/carrd-review)
- [Stripe — Freemium Pricing Explained](https://stripe.com/resources/more/freemium-pricing-explained)
- [Demogo — Feature Gating Strategies](https://demogo.com/2025/06/25/feature-gating-strategies-for-your-saas-freemium-model-to-boost-conversions/)
- [Maxio — Freemium Model](https://www.maxio.com/blog/freemium-model)
- [Hook Agency — Best Roofing Website Builder 2026](https://hookagency.com/blog/best-roofing-website-builder-for-contractors/)
- [Site Builder Report — Wix vs Squarespace](https://www.sitebuilderreport.com/wix-vs-squarespace)
