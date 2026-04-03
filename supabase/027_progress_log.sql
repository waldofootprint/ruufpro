-- Progress log — DB-backed daily activity feed for Mission Control
-- Run via: node tools/run-migration.mjs supabase/027_progress_log.sql

CREATE TABLE progress_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  files jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage progress_log"
  ON progress_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed with existing progress items from progress-log.ts
INSERT INTO progress_log (title, description, files, tags, logged_date) VALUES
  (
    'Merged HQ into Mission Control — one page to rule them all',
    'Eliminated the 3-app maze (HQ + Mission Control + Command Center). Mission Control at /mission-control is now the single daily cockpit with 4 tabs: Today, Build, Grow, Library. /hq now redirects to /mission-control.',
    '[{"label":"mission-control/page.tsx","path":"/app/mission-control/page.tsx"},{"label":"hq/page.tsx","path":"/app/hq/page.tsx"},{"label":"command-center/page.tsx","path":"/app/command-center/page.tsx"}]',
    ARRAY['navigation', 'reorganization'],
    '2026-04-03'
  ),
  (
    'Pricing component → 3 tiers',
    'Expanded pricing from 2-tier to 3-tier: Your Website (Free), Your Leads ($149/mo Pro), Your Growth ($299/mo). Annual toggle: Pro $119/mo, Growth $239/mo.',
    '[{"label":"ridgeline/pricing.tsx","path":"/components/ridgeline/pricing.tsx"}]',
    ARRAY['pricing', 'ridgeline'],
    '2026-04-03'
  ),
  (
    'Competitor comparison — new math',
    'Updated competitor comparison table. RuufPro $149 × 12 = $1,788/yr. Roofle still $6,200/yr. Savings: $4,412.',
    '[{"label":"ridgeline/competitor-comparison.tsx","path":"/components/ridgeline/competitor-comparison.tsx"}]',
    ARRAY['pricing', 'ridgeline'],
    '2026-04-03'
  ),
  (
    'FAQ — pricing references updated',
    'Updated 2 FAQ answers: What''s the catch ($149, 57% cheaper than Roofle) and Is the website really free ($149/month Pro + Growth tiers).',
    '[{"label":"ridgeline/faq.tsx","path":"/components/ridgeline/faq.tsx"}]',
    ARRAY['pricing', 'ridgeline'],
    '2026-04-03'
  ),
  (
    'Dashboard upsell text updated',
    'Updated estimate widget upsell in My Site editor from $99/mo → $149/mo Pro plan.',
    '[{"label":"dashboard/my-site/page.tsx","path":"/app/dashboard/my-site/page.tsx"}]',
    ARRAY['pricing', 'dashboard'],
    '2026-04-03'
  ),
  (
    'Hero subtitle + SEO meta description',
    'Updated hero subtitle and layout meta description from $99/mo → $149/mo Pro.',
    '[{"label":"ui/hero.tsx","path":"/components/ui/hero.tsx"},{"label":"app/layout.tsx","path":"/app/layout.tsx"}]',
    ARRAY['pricing', 'seo'],
    '2026-04-03'
  ),
  (
    'Mission Control — Progress Log system',
    'Built Progress Log section with Today/Completed tabs, auto-archiving, VS Code file links, and category tags.',
    '[{"label":"mission-control/progress-log.ts","path":"/app/mission-control/progress-log.ts"},{"label":"ProgressCard.tsx","path":"/app/mission-control/components/ProgressCard.tsx"}]',
    ARRAY['mission-control', 'tooling'],
    '2026-04-03'
  );
