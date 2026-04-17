# Dashboard Feature Inventory — Complete Checklist

> Created: 2026-04-17
> Purpose: Definitive checklist of every feature, data source, and component for the dashboard rebuild.
> Reference this when building or reviewing any dashboard page.

## PAGE 1: LEADS (Landing Page — 80% of roofer time)

### Overview Section
- [ ] "Hello, [Name]" greeting
- [x] Pipeline value stat card
- [x] Hot leads count (scored 70+)
- [x] Avg response time
- [x] Stale leads count (48h+ no contact)
- [x] Pipeline Health gauge (0-100)
- [x] Storm banner (conditional, from NOAA)

### Lead List
- [x] List view with sortable columns
- [ ] Card view toggle (Phase 5)
- [x] Sort by: Heat Score (default), Newest, Value
- [ ] Search/filter by name, phone, address

### Lead Row — At-a-Glance
- [x] Heat score badge (color-coded: 70+ hot, 40-69 warm, <40 cool)
- [x] Name + address
- [x] Estimate range ($XK – $YK)
- [x] Material interest
- [x] Status pill (manual only: New/Contacted/Appt Set/Quoted/Won/Lost)
- [x] Last activity timestamp
- [x] Inline alert badges:
  - [x] 48h stale (no contact)
  - [ ] Viewed Nx today (needs widget_events table)
  - [x] New homeowner (<12 months)
  - [ ] Storm area (needs NOAA geo-match)
  - [x] Replacement window (roof 18+ years)

### Lead Accordion (Expanded Detail)
- [x] Property Intel: home value, year built, roof age, owner names, owner-occupied, purchase date/price, sq ft, flood zone, FEMA disaster count
- [x] Behavioral Signals: widget views, material switches, chat depth, price adjustments
- [x] Riley Chat Preview: last 3 messages, stage, message count, topics
- [x] Copilot Insights: auto-generated one-liners (material preference, roof age, affordability, new homeowner, FEMA)
- [x] Action Buttons:
  - [x] Draft Follow-Up (primary CTA — opens Copilot, Phase 3)
  - [x] Text Lead (sms: link)
  - [x] Send Estimate
  - [ ] Request Review (only if status = won/completed)
  - [ ] Status dropdown selector

### Heat Score Formula (lib/heat-score.ts)
- [x] Widget engagement (35% weight): view count + recency
- [x] Chat depth (20%): high_intent/engaged/browsing
- [x] Engagement recency (15%): last activity timestamp
- [x] Material switches (15%): comparison count
- [x] Affordability (10%): estimate-to-home-value ratio
- [x] New homeowner (5%): purchase within 12 months

---

## PAGE 2: COPILOT (AI Assistant)

### Current (Shipped)
- [x] Chat interface (useChat hook)
- [x] 7 tools: replay count, material switches, price brackets, chat depth, property intel, disaster exposure, review stats

### Launch Priority: Draft Follow-Up
- [ ] "Draft Follow-Up" button on lead card → opens Copilot with context
- [ ] Lead context pre-loader (all signals + property + chat)
- [ ] Copilot generates personalized follow-up draft
- [ ] Copy/Send buttons (sms: link or clipboard)

### Future
- [ ] Proactive nudges ("3 leads need follow-up")
- [ ] Draft estimates
- [ ] Coaching mode

---

## PAGE 3: YOUR WEEK (AI Weekly Briefing)

### Section 1: Scoreboard
- [ ] Closed jobs count + revenue this week
- [ ] Pipeline value (quoted leads)
- [ ] Close rate + revenue forecast

### Section 2: Money Left on the Table
- [ ] High-intent leads not contacted
- [ ] Estimated lost revenue
- [ ] Inline action buttons per lead

### Section 3: What Homeowners Want
- [ ] Top question types from Riley (aggregated)
- [ ] Material interest distribution
- [ ] Financing interest rate

### Section 4: Speed Game
- [ ] Fastest close response times
- [ ] Average reply time
- [ ] Close rate by response bucket (<30m, 30m-2h, 2h+)

### Section 5: Riley ROI (Progressive)
- [ ] Milestone-based reveal (0→10→first close→ongoing)
- [ ] ROI calculation: revenue / $149 subscription

### Section 6: Review Momentum
- [ ] Reviews gained this month
- [ ] Trend + projection
- [ ] Recent review highlights

### Section 7: Customer DNA (10+ won leads gate)
- [ ] Pattern recognition across won leads
- [ ] Property + behavior + material correlations

---

## SETTINGS (Gear Icon)

### Profile
- [ ] Business name, phone, address, hours, credentials

### Estimate Pricing
- [ ] Per-material rates, buffer %, surge toggle

### Riley Config
- [ ] Greeting, tone, differentiators

### Billing
- [ ] Stripe portal link, plan info, usage

### Review Settings
- [ ] Google review URL, email template, delay

---

## DATA DEPENDENCIES

| Feature | Table(s) | Ready? |
|---------|----------|--------|
| Heat Score | leads, widget_events, chat_conversations, property_data_cache | ⚠️ Missing widget_events |
| Property Intel | property_data_cache | ✅ |
| Chat Preview | chat_conversations | ✅ |
| Behavioral Signals | widget_events | ❌ Table not created |
| Storm Banner | NOAA API + leads | ✅ (StormAlertBanner exists) |
| Draft Follow-Up | copilot-tools.ts + all signal tables | ⚠️ Needs context pre-loader |
| Weekly Brief | leads + chat_conversations + review_requests | ⚠️ Needs aggregation queries |

## CRITICAL MISSING: widget_events table
```sql
CREATE TABLE widget_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('widget_view', 'living_estimate_view', 'material_switch', 'price_adjustment')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_widget_events_lead ON widget_events(lead_id, created_at DESC);
CREATE INDEX idx_widget_events_contractor ON widget_events(contractor_id, created_at DESC);
```
