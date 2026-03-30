# Website Building Workflow

**Trigger:** When asked to build, design, create, or modify any website, page, section, or component.

## Template Strategy
All contractor templates target the **same ICP: residential roofers (1-10 person crews).** Templates differ by **visual design style**, NOT by business type. The onboarding flow asks roofers to pick a look (Modern Clean / Bold & Confident / Warm & Trustworthy), and all three use the same residential-focused smart defaults (headlines, services, CTAs). Storm/insurance and full-service business types are preserved in code for future use but not shown to users yet. See `lib/defaults.ts` for the content defaults and `app/onboarding/page.tsx` for the style picker.

## Before You Write Any Code

### Step 1: Research Competitors
- Use `WebSearch` and `WebFetch` to analyze how competitors handle the same type of page/section
- Focus on: layout, content structure, what information they show, UX patterns
- Pull specific quotes and data points to justify design decisions
- Share findings with Hannah before building

### Step 2: Check for Existing Components
Look in `components/ui/` first. We have premium 21st.dev components already:
- `flow-button.tsx` — Animated CTA button with sliding arrows + circle fill. Use for ALL primary CTAs.
- `animated-card.tsx` — Premium card with visual area + body. Use for selection cards.
- `vercel-tabs.tsx` — Animated tab switching. Use when content has categories.
- `pricing-card.tsx` — Glass effect pricing cards. Use for pricing/plan displays.
- `rotating-text.tsx` — Slide/fade/blur text animation. Use for hero headlines.
- `premium-button.tsx` — Consistent button with shadow + hover lift. Use for form submits.
- `radar-effect.tsx` — Available but currently unused (was rejected for being too busy).
- `button.tsx` — Shadcn base button for use inside other components.

### Step 3: Check 21st.dev for New Components
Before writing custom UI, check if 21st.dev has a component that fits. Hannah often provides 21st.dev component code to integrate. When she does:
1. Copy the component to `components/ui/`
2. Install any missing npm dependencies
3. Create `lib/utils.ts` `cn()` function if not present (it exists)
4. Adapt the component for our data/style

## Design Rules (Non-Negotiable)

- **White/light backgrounds.** Always. Never dark theme sections without explicit approval.
- **Card style:** `rounded-3xl shadow-xl hover:shadow-2xl` with `border border-gray-200/60` overlay
- **NO neumorphic/soft-UI shadows.** This was tried and immediately rejected. Never use `bg-[#f0f0f0]` with dual-direction shadows.
- **Buttons:** Use FlowButton for CTAs. Use PremiumButton for form submits. Both use `rounded-xl bg-gray-900` with layered shadow + hover lift.
- **Typography:** Clean hierarchy. Section labels: `text-sm font-semibold text-brand-600 uppercase tracking-widest`. Headlines: `text-3xl md:text-4xl font-bold text-gray-900 tracking-tight`.
- **Spacing:** `py-16 md:py-20` for sections. `mb-10` for section header to content. `gap-6` for card grids.
- **Colors:** `brand-600` (#2563eb) for accents. `gray-900` for primary text/buttons. `gray-500` for secondary text. `gray-100/200` for borders.
- **Animations:** Use framer-motion for staggered entrances. `whileInView` with `viewport={{ once: true }}`. Spring physics: `stiffness: 300-400, damping: 25-28`.

## Build Process

### Step 4: Build One Section at a Time
- Never build multiple sections simultaneously
- Write the component code
- If it's a new marketing section, add it to `app/page.tsx`
- If it's a new dashboard page, add it under `app/dashboard/`

### Step 5: Show the Result
- Restart the dev server: `kill $(lsof -t -i:3000) 2>/dev/null; npm run dev`
- **Always provide the localhost link** so Hannah can preview
- Wait for feedback before moving to the next section

### Step 6: Handle Feedback
- Hannah reviews in browser and provides edits
- She may share 21st.dev components, v0 links, or competitor screenshots
- Incorporate changes, restart server, show link again
- Iterate until she's happy

### Step 7: Revert Protocol
**If Hannah says "undo", "revert", "go back", "SOS", or anything indicating the change is wrong:**
1. Run `git revert HEAD --no-edit` IMMEDIATELY
2. Restart the dev server
3. Provide the link
4. Do NOT argue or explain — revert first, discuss after

### Step 8: Commit & Continue
- Commit with a descriptive message
- Keep the dev server running (it stops on commit — restart it)
- Provide the link
- Ask what's next or move to the next section

## Tech Stack Reference

- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS v4 (uses `@import "tailwindcss"` + `@theme` in CSS, NOT tailwind.config)
- **Database:** Supabase (Postgres + Auth + RLS)
- **Hosting:** Vercel (not deployed yet)
- **Icons:** lucide-react
- **Animations:** framer-motion
- **PDF:** @react-pdf/renderer
- **Email:** Resend

## File Structure

```
app/
  page.tsx                    — Marketing site (ruufpro.com)
  signup/page.tsx             — Signup
  login/page.tsx              — Login
  onboarding/page.tsx         — Onboarding flow
  dashboard/
    layout.tsx                — Dashboard shell with sidebar
    page.tsx                  — Redirects to /leads
    leads/page.tsx            — Lead management
    estimate-settings/page.tsx — Roofer pricing config
  site/[slug]/page.tsx        — Contractor site (subdomains)
  widget/[contractorId]/      — Hosted widget for embeds
  widget-preview/page.tsx     — Widget preview (dev)
  api/
    estimate/route.ts         — Estimate calculation endpoint
    notify/route.ts           — Email + push notification
    report/route.ts           — PDF generation
    push/subscribe/route.ts   — Push subscription
    push/send/route.ts        — Push send

components/
  marketing/                  — Marketing site sections
  sections/                   — Contractor site sections
  ui/                         — Reusable UI components (21st.dev)
  estimate-widget.tsx         — The estimate calculator widget
  pdf/                        — PDF templates

lib/
  supabase.ts                 — Browser Supabase client
  supabase-server.ts          — Server Supabase client
  estimate.ts                 — Calculation engine
  solar-api.ts                — Google Solar API + caching
  roof-geometry.ts            — Geometric inference
  defaults.ts                 — Smart defaults per business type
  regional-pricing.ts         — Regional rate suggestions
  notifications.ts            — Email notification sender
  types.ts                    — TypeScript types
  utils.ts                    — cn() utility
```
