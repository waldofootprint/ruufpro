-- Seed data for Command Center
-- Run AFTER 021_command_center.sql

-- ==========================================
-- PLAYS (7 revenue strategies from the vault)
-- ==========================================

INSERT INTO command_plays (title, status, priority, category, summary, vault_details, vault_sources, steps, when_to_start) VALUES

-- Active plays
('Demo-as-Lead-Magnet (Website Rebuilds)', 'not_started', 1, 'active',
 'Build roofer sites with the widget already working. Submit through their contact form. Zero network, zero social, zero outreach skills required.',
 'Libis [016] beat 10 competitors by making the proposal a live demo. "Show don''t tell at scale" [005] — impossible to ignore when it''s THEIR business. Contact form > cold email for local businesses (no spam filters) [005]. The demo IS the pitch — they see their own business with RuufPro live.',
 ARRAY['005', '016', '050'],
 '[{"text":"Pick 5 roofing companies from Google (start with your city)","done":false},{"text":"Build each a site with the RuufPro widget already live","done":false},{"text":"Submit through their contact form: Hey, I built this for your business","done":false},{"text":"Track responses in a spreadsheet (company, city, date, response)","done":false},{"text":"Repeat with 5 more the following week","done":false},{"text":"Goal: 20 demos sent, 2+ conversations, 1 paying customer","done":false}]'::jsonb,
 NULL),

('Facebook Group Infiltration', 'not_started', 2, 'active',
 'Join roofing contractor Facebook groups. Add value. Never pitch. Let deals come to you.',
 'Ann [030]: Joined Facebook group, posted value for months → 30 clients organically. Fraser [011]: 350 followers, content-only, $4K/mo retainer found him. Jedi [034]: Comment-trigger → autoDM → 1,000 comments from one carousel. Roofers live on Facebook — this is THE channel for this niche.',
 ARRAY['030', '034', '036', '011'],
 '[{"text":"Create Facebook profile (name, photo, I help roofing companies get more leads)","done":false},{"text":"Join 3-5 roofing contractor Facebook groups","done":false},{"text":"Week 1: Lurk. Screenshot pain points. Free JTBD research","done":false},{"text":"Week 2+: Comment with genuine value about websites, leads, online presence","done":false},{"text":"Week 3+: Post first content — before/after of a roofer website rebuild","done":false},{"text":"Use CTA: Comment LEADS to see yours","done":false}]'::jsonb,
 NULL),

('Guerrilla Research (Talk to Roofers IRL)', 'not_started', 3, 'active',
 'Call a roofer for a quote. Ask questions about their lead flow. You''re not pitching — you''re learning. And now you know a roofer.',
 'Gal [019]: Walked into 20+ clinics, found 8 unsolvable problems, €8K/mo. Jonathan [037]: Five Whys technique gets to root cause. Jason [036]: 8-15 customer conversations = $30-60K worth of research. Every winner started with a real problem witnessed firsthand.',
 ARRAY['019', '037', '036'],
 '[{"text":"Call a roofer for a quote on something small (gutter repair, inspection)","done":false},{"text":"Ask: How do you get most of your leads? What does your website do?","done":false},{"text":"Ask: How many calls do you miss when you''re on a job?","done":false},{"text":"Do NOT pitch. Just learn. Write down everything.","done":false},{"text":"Repeat 3-5 times. You now have JTBD data AND warm contacts.","done":false}]'::jsonb,
 NULL),

-- Queued plays
('Hormozi Offer Page Rewrite', 'queued', 4, 'queued',
 'Reposition from features to transformation. Build ROI calculator. Apply 8-step conversion blueprint. Add risk reversal and scarcity.',
 'Andy''s roofer math [032]: 5 missed calls/week × $5K × 30% = $32K/mo lost. Hormozi [025]: Surgery vs Magazine — position as done-for-you. 8-step blueprint [050]: One page, one decision, one CTA. Higher price → better clients → less demanding → more profit [031].',
 ARRAY['025', '031', '032', '050'],
 '[{"text":"Rewrite offer page with transformation language","done":false},{"text":"Build ROI calculator: 5 missed calls/week × $5K × 30% = $32K/mo lost","done":false},{"text":"Apply 8-step conversion blueprint","done":false},{"text":"Add risk reversal: More leads in 90 days or full refund","done":false},{"text":"Add scarcity: Only onboarding 20 roofers this month","done":false},{"text":"Test $199 or $299 tier","done":false}]'::jsonb,
 'After 1-2 paying customers validate the product'),

('Cold Email at Scale', 'queued', 5, 'queued',
 'Once you have case studies, cold email becomes 10x more effective. Problem-led copy for secondary US cities.',
 'John Caesar [033]: $150K from $4,700 offer. 1,000 emails/day system. Pre-warmed inboxes from Instantly. Problem-led copy without case studies: articulate their ICP''s specific problem. Target secondary/tertiary US cities where competition is lower. 5+ touchpoint follow-up sequences [048]. The arbitrage is in the DATA SOURCE.',
 ARRAY['033', '043', '047', '048'],
 '[{"text":"Set up Instantly + pre-warmed inboxes","done":false},{"text":"Scrape roofing companies via Apify","done":false},{"text":"Problem-led copy for secondary US cities","done":false},{"text":"5+ touchpoint follow-up sequences","done":false}]'::jsonb,
 'After case studies exist to reference in copy'),

('Review Management as Feature/Upsell', 'queued', 6, 'queued',
 'Auto-collect reviews after roofing jobs, draft SEO-optimized reviews, auto-respond to all Google reviews. Justifies $99-199/mo alone.',
 'Review system [052]: After job → auto-text homeowner → if positive, draft SEO review mentioning "roof replacement [city]" → share Google link. If negative, route privately. Auto-respond to all reviews. More 5-star reviews = higher Google Maps ranking = more leads. This alone could justify the monthly fee.',
 ARRAY['052'],
 '[{"text":"After job completes → auto-text homeowner","done":false},{"text":"If positive → AI drafts SEO review → shares Google link","done":false},{"text":"If negative → route to roofer privately","done":false},{"text":"Auto-respond to all Google reviews","done":false}]'::jsonb,
 'After core product validated with paying customers'),

('Roofing Business Audit as Lead Magnet', 'queued', 7, 'queued',
 'Free audit scores 5 domains, generates branded PDF, reveals gaps, prescribes RuufPro as the solution.',
 'AI Audit skill [053]: Score 5 domains (online presence, lead capture, reviews, marketing, operations). Generate branded PDF. This is Mert''s free productivity analysis [018] + Florian''s SEO report [030] + Jonathan''s niche depth [037]. The audit IS the sales pitch.',
 ARRAY['053', '054'],
 '[{"text":"Build 5-domain assessment (presence, lead capture, reviews, marketing, operations)","done":false},{"text":"Auto-generate branded PDF report","done":false},{"text":"Offer free to generate qualified leads","done":false}]'::jsonb,
 'After positioning is locked and offer page is rewritten');

-- ==========================================
-- POSITIONING
-- ==========================================

INSERT INTO command_positioning (current_pos, target_pos, hormozi_json, mrr_target, mrr_current, pricing_tiers, notes) VALUES (
  'Free website + $99/mo widget + leads',
  'RuufPro makes your phone ring with qualified homeowners — starting with a free website that actually converts.',
  '{"dream_outcome": "More roofing jobs, phone ringing, booked estimates", "likelihood": "Before/after metrics, real roofer testimonials", "time_delay": "Live this week", "effort": "We build everything, you answer the phone"}'::jsonb,
  50000,
  0,
  '[{"price": 99, "roofers_needed": 505, "label": "Current pricing"}, {"price": 199, "roofers_needed": 251, "label": "Recommended test"}, {"price": 299, "roofers_needed": 168, "label": "With voice AI + reviews"}]'::jsonb,
  'WeLevel [032] charges $999/mo for similar bundle using roofers as example. James [023]: "If it doesn''t save time, save money, or make money, it''s a luxury." Consider whether $99 is in the low-price spiral [031].'
);

-- ==========================================
-- MOTIVATION (stories + principles)
-- ==========================================

INSERT INTO command_motivation (name, story, vault_entry, type, sort_order) VALUES
('Diego', 'Zero Upwork reviews. Zero completed jobs. UX designer, not a developer. Closed $1,400 with a 4-minute video proposal. Beat 25 applicants.', '028', 'story', 1),
('Fraser', '350 TikTok followers. Left school at 16. Posted one Claude Code tutorial. SaaS founder found him. $4K/month retainer + $70K referral lead.', '011', 'story', 2),
('Monika', 'Cold-sent Loom videos showing how she''d customize ChatGPT for their business. 30% conversion rate. First 3 clients referred their entire network.', '017', 'story', 3),
('Jonathan', 'Warmed his network for months with coffee chats. When his product was ready, 6 paying clients in one week. $300/month each.', '037', 'story', 4),
('Joseph', 'Literal roofing company owner. Learned automation. Transitioned to six-figure salary + equity as automation engineer. Roofing knowledge WAS the moat.', '021', 'story', 5),
('Ann', 'Joined ONE Facebook group for female entrepreneurs. Posted value about web design for months. Never pitched. 30 clients came to her.', '030', 'story', 6),
('Gal', 'Walked into 20+ clinics with no connections. Asked to book a treatment. Observed 8 unsolvable problems. Left his card. They called HIM. 9 clinics, €8K+/month.', '019', 'story', 7),
('"Build imperfectly and make money" beats studying for 100 more hours.', NULL, NULL, 'principle', 10),
('"Every winner started with a real problem witnessed firsthand, not a product built in isolation."', NULL, NULL, 'principle', 11),
('"Sell transformation, not tech." From missed calls to booked estimates > AI-powered lead widget.', NULL, NULL, 'principle', 12),
('"The proposal should BE the demo." Don''t pitch. Show.', NULL, NULL, 'principle', 13),
('"Recurring > project work." $99/mo × 500 roofers = $49,500 MRR. That''s the math.', NULL, NULL, 'principle', 14),
('"If it doesn''t save time, save money, or make money — it''s a luxury."', NULL, NULL, 'principle', 15);

-- ==========================================
-- ADVISOR (initial note)
-- ==========================================

INSERT INTO command_advisor (type, content) VALUES
('note', 'You have a production-ready product that most pre-launch founders would kill for. 5 templates, living estimates, SMS automation, review management — all built. The gap is distribution, not product. Your #1 priority is getting RuufPro in front of roofers. Play 1 (demo-as-lead-magnet) requires zero network and zero social media — just Google roofing companies, build their site with your widget, and submit through their contact form. Do 5 this week.'),
('brief', 'Session: Apr 2, 2026 — Read through entire 54-entry vault. Identified 3 active plays (demo sites, Facebook groups, guerrilla research) and 4 queued plays. Key insight: Andy Steuer [032] literally uses roofers as his ROI example ($32K/mo in missed calls). The review management system [052] is a direct RuufPro feature that could justify the monthly fee alone. Consider $199-299 tier. Built command center dashboard.');

-- ==========================================
-- PROJECT STATUS (every feature/asset)
-- ==========================================

INSERT INTO command_project_status (feature_name, category, route, status, description, sort_order) VALUES
-- Pages
('Marketing Homepage', 'page', '/', 'complete', 'Hero, demo widget, competitor comparison, pricing, FAQ', 1),
('Signup', 'page', '/signup', 'complete', 'Email + password, redirects to onboarding', 2),
('Login', 'page', '/login', 'complete', 'Email + password, redirects to dashboard', 3),
('Onboarding', 'page', '/onboarding', 'complete', '3-step: style → business info → publish', 4),
('Dashboard Home', 'page', '/dashboard', 'complete', 'Stats, recent leads, pipeline, roof intel', 5),
('Leads Management', 'page', '/dashboard/leads', 'in_progress', 'Leads table with filtering and status updates', 6),
('SMS & Reviews', 'page', '/dashboard/sms', 'complete', '10DLC registration, review requests, missed-call text-back', 7),
('My Website Editor', 'page', '/dashboard/my-site', 'complete', 'Section-based editor: hero, trust, services, about, reviews, contact', 8),
('Widget Settings', 'page', '/dashboard/estimate-settings', 'complete', 'Pricing per material, service area ZIPs, embed code', 9),
('Add-Ons Config', 'page', '/dashboard/addons', 'complete', 'Manage estimate add-ons (gutters, ventilation, etc)', 10),
('Settings', 'page', '/dashboard/settings', 'complete', 'Business profile, trust signals, password', 11),
('Living Estimate', 'page', '/estimate/[token]', 'complete', 'Interactive proposal: G/B/B materials, add-ons, signature, PDF', 12),
('Privacy Policy', 'page', '/privacy', 'complete', 'Legal page', 13),
('Terms of Service', 'page', '/terms', 'complete', 'Legal page', 14),
('Demo Page', 'page', '/demo', 'complete', 'Modern Clean template with mock data', 15),
('3D Preview', 'page', '/preview-3d', 'complete', 'Three.js house visualization', 16),
('Prospect Preview', 'page', '/preview/[slug]', 'complete', 'Cold email landing with Claim This Site CTA', 17),
('Widget Compare', 'page', '/widget-compare', 'complete', 'Side-by-side V1-V4 comparison', 18),
('Command Center', 'page', '/command-center', 'in_progress', 'Admin-only business dashboard (this page)', 19),

-- Templates
('Modern Clean', 'template', '/demo', 'complete', 'Premium scroll animations, material transformation hero', 20),
('Chalkboard', 'template', NULL, 'complete', 'Dark green-gray with chalk texture, Fredericka + Kalam fonts', 21),
('Forge', 'template', '/demo/forge', 'complete', 'Dark industrial with blue accent nav', 22),
('Blueprint', 'template', NULL, 'complete', 'Technical/drafting aesthetic', 23),
('Classic', 'template', NULL, 'complete', 'Traditional design', 24),
('Apex', 'template', NULL, 'needs_work', 'Only hero section implemented, other sections missing', 25),

-- Features
('Estimate Widget V4', 'feature', '/widget/[id]', 'complete', '7-step calculator with satellite data, PDF reports, signatures', 30),
('Lead Capture (Contact Form)', 'feature', NULL, 'complete', 'Form → Supabase → email notification via Resend', 31),
('SMS / Twilio 10DLC', 'feature', NULL, 'complete', 'Registration, send/receive, missed-call text-back', 32),
('Review Automation', 'feature', NULL, 'complete', 'Auto-request after job, track clicks', 33),
('Push Notifications', 'feature', NULL, 'complete', 'Web push for new leads via VAPID', 34),
('Property Intelligence', 'feature', NULL, 'complete', 'RentCast + Google Solar API roof data', 35),
('Digital Signatures', 'feature', NULL, 'complete', 'Canvas signature pad on estimates', 36),
('Living Estimates', 'feature', NULL, 'complete', 'Real-time pricing, share via email, G/B/B comparison', 37),
('PDF Reports', 'feature', NULL, 'complete', 'React-pdf estimate reports with signatures', 38),
('SEO City Pages', 'feature', NULL, 'planned', 'Auto-generated [Service] in [City] pages — framework exists', 39),
('GBP Sync', 'feature', NULL, 'planned', 'Google Business Profile sync — infrastructure only', 40),
('Stripe Billing', 'feature', NULL, 'planned', 'Payment processing for $99/mo subscription', 41),

-- Workflows & Research
('Build Website SOP', 'workflow', NULL, 'complete', 'Step-by-step build process with design rules', 50),
('Cold Email Outreach', 'workflow', NULL, 'complete', 'Strategy, copy frameworks, prospect targeting', 51),
('3D Scroll Animations', 'workflow', NULL, 'complete', 'Prompt library for Higgsfield AI generation', 52),
('Pre-Generation Gate', 'workflow', NULL, 'complete', '5-phase checklist before spending AI credits', 53),
('Go-to-Market Plan', 'research', NULL, 'complete', 'Positioning, messaging, segments, channels', 60),
('Roofer Pain Points', 'research', NULL, 'complete', 'What roofers say online, ranked by frequency', 61),
('Competitive Landscape', 'research', NULL, 'complete', 'Roofle, Roofr, GHL agencies — full analysis', 62),
('Marketing Copy Research', 'research', NULL, 'complete', 'What converts for roofing sites', 63);
