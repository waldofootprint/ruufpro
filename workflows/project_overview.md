# RuufPro — Project Overview

## What We're Building
A micro-SaaS platform for small roofing contractors (1-10 person crews) with three tiers:
- **Free — "Your Website"**: Professional roofing site + SEO + contact form (our lead magnet)
- **$149/mo Pro — "Your Leads"**: Estimate widget + missed-call text-back + review automation + lead dashboard
- **$299/mo Growth — "Your Growth"**: SEO city pages + competitor monitoring + custom domain + priority support

## Why It Exists
Google launched an "Online Estimates" filter (Dec 2025) that hides roofers without online pricing. 78% of homeowners want pricing. 76% of roofers don't show it. Roofle charges $350/mo + $2K setup. We offer the same core value at $149/mo with no setup fee, plus a free website nobody else provides.

## Target Customer
Solo roofers and small crews (1-10 employees) who either have no website or a bad GoDaddy/Wix site. They can't afford Roofle ($6,200/year) or Scorpion ($3-10K/mo). They need to be found on Google and capture leads.

## Tech Stack
| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14+ (App Router) |
| Hosting | Vercel |
| Database | Supabase (Postgres + Auth + RLS) |
| Payments | Stripe |
| SMS | Twilio |
| Roof Data (V2) | Google Solar API |
| Email | Resend or SendGrid |
| DNS | Cloudflare |

## Business Model
The free website is our lead magnet and main acquisition tool — always free, fully functional, no gates. Revenue comes from paid services sold independently. Roofers who already have their own website can buy services standalone (widget embeds on any site).

### Pricing
| Tier | Price | What's Included |
|------|-------|-----------------|
| Free — "Your Website" | $0/mo | Professional roofing site, SEO, contact form, lead notifications, trust badges |
| Pro — "Your Leads" | $149/mo | Everything Free + estimate widget + missed-call text-back + review automation + lead dashboard + PDF reports |
| Growth — "Your Growth" | $299/mo | Everything Pro + SEO city pages + competitor monitoring + custom domain + priority support |

## Phased Roadmap
| Phase | What | Timeline |
|-------|------|----------|
| MVP | Website generator (3 templates) + estimate calculator + contact form + Stripe | Weeks 1-2 |
| V1.1 | Lead dashboard + email notifications + review automation | +1 week |
| V1.2 | Twilio auto-reply + follow-up sequences | +1 week |
| V2 | Google Solar API for address-based roof measurements | +1-2 weeks |
| V3 | City-specific SEO pages + GBP sync | +1-2 weeks |

## Key Competitors
- **Roofle** — Widget-only, $350/mo + $2K setup, no website. Our main competitor.
- **Roofr** — Measurements + CRM, $89+/mo + per-report. No website (beta builder at $199/mo).
- **Scorpion** — Full marketing, $3-10K/mo, 12-24mo lock-in. You lose your site on exit.
- **GoDaddy/Wix** — Generic, cheap, but no estimate widget or lead tools.

## Our Moat
Free roofing-specific website. No competitor offers this. It's our lead magnet and the thing that makes switching costs real — once a roofer's site is live and getting traffic, they stay.

## Reference Docs
- `research/action_plan.html` — Full competitor table, market gaps, daily action plan
- `research/roofing_deep_dive.html` — Roofle teardown, technical architecture, unit economics
