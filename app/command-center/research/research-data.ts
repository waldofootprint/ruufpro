export interface ResearchSection {
  heading: string;
  content: string[];
  type?: "default" | "quote" | "table" | "callout" | "list";
}

export interface ResearchSource {
  name: string;
  url?: string;
}

export interface ResearchEntry {
  slug: string;
  label: string;
  desc: string;
  summary: string;
  keyTakeaway: string;
  ruufproImplications: string;
  sections: ResearchSection[];
  sources: ResearchSource[];
}

export const RESEARCH_ENTRIES: ResearchEntry[] = [
  {
    slug: "go-to-market",
    label: "Go-to-Market Plan",
    desc: "Positioning, messaging, channels, segments",
    summary:
      "Complete GTM strategy identifying RuufPro's unique market position: the only free professional roofing website paired with an affordable $99/mo estimate widget. Covers 5 target segments, 5 key messages ranked by strength, and channel strategy prioritizing Facebook groups, Reddit, and RoofingTalk forums.",
    keyTakeaway:
      "Target agency-burned roofers (2/3 of market) and Google filter-aware roofers (highest urgency) first. Lead with: 'Google is hiding roofers without online estimates.' Channels: Facebook groups, Reddit r/roofing, RoofingTalk forums — competitors have zero presence there.",
    ruufproImplications:
      "This plan is the playbook for taking RuufPro from pre-launch to first revenue. The free website is the lead magnet; the widget sells itself inside the product. Community seeding in Facebook groups (weeks 1-4) + cold email blitz (weeks 5-8) + content/SEO (weeks 9-16) is the sequence. At 1,000 cold emails/day with a 5% reply rate, the math says 32 paying customers by week 10 = ~$3,168 MRR from cold email alone.",

    sections: [
      {
        heading: "The Market Gap",
        type: "default",
        content: [
          "Nobody offers a free professional roofing website + affordable estimate widget for small contractors. The competitive map shows a massive gap in the $0-$100/mo price band:",
          "DIY (Wix/Squarespace): $16-33/mo — generic, no roofing features. Contractor+ Pro: $29/mo — generic CRM + website. RuufPro free tier: $0 — professional roofing website, SEO-optimized. RuufPro paid tier: $99/mo — website + satellite estimate widget. Roofr: $398/mo — CRM + estimates + proposals. Roofle: $350/mo + $2K setup — estimate widget only, no website. GHL Agencies: $297-2,500/mo — website + CRM + ads. Hook Agency: $3,000-15,000/mo — full-service marketing.",
        ],
      },
      {
        heading: "Where Competitors Are NOT",
        type: "list",
        content: [
          "Facebook groups — Neither Roofle nor Roofr participates organically in roofing Facebook groups (25K+ members in top groups)",
          "Reddit r/roofing — 80K+ members, zero competitor presence",
          "RoofingTalk forums — 11K+ members, zero competitor presence",
          "YouTube — Roofing Insights (Dmitry Lipinskiy) is hugely influential, neither competitor has a real YouTube strategy",
          "Small/new roofer segment — Everyone is moving upmarket. Nobody is serving the roofer who just got licensed and needs a website tomorrow",
          "The $0-$100/mo price band — Massive gap between free (bad) and $250+/mo (good but expensive)",
        ],
      },
      {
        heading: "Primary Positioning",
        type: "callout",
        content: [
          '"The free professional website that makes roofers\' phones ring."',
          "Everything ladders up to this. Free. Professional. Phone rings. Three words a roofer understands.",
        ],
      },
      {
        heading: "Top 5 Messages (Ranked by Strength)",
        type: "default",
        content: [
          '#1: "Google is hiding roofers without online estimates. Don\'t get filtered out." — Creates urgency with a real, verifiable threat. 1 in 5 homeowners use the filter. Best for: cold email, Facebook groups, blog content.',
          '#2: "What marketing agencies charge $3,000/month for, we give you for free." — Addresses the #1 trust issue (2/3 of roofers burned by agencies). Best for: cold email, Facebook groups.',
          '#3: "Your website is live in 2 minutes. No designer. No developer. No agency." — Simplicity + speed. Respects their time. Best for: cold email, social media, landing page.',
          '#4: "Roofle charges $350/mo for an estimate widget. Ours is $99/mo — website included." — Direct competitor comparison. Best for: comparison pages, cold email to Roofle users.',
          '#5: "You\'re a roofer, not a web developer. Answer 3 questions and you\'re live." — Empathy + simplicity. Best for: Facebook groups, podcast appearances.',
        ],
      },
      {
        heading: "Target Customer Segments",
        type: "default",
        content: [
          "Segment A — New Roofers (1-3 years): Just got licensed, 1-2 crew members, no website, under $500K revenue. Lead with speed/simplicity. Find them in Facebook groups asking 'how do I get a website?' and state licensing databases.",
          "Segment B — Burned-by-Agency Roofers: 3-10+ years in business, tried an agency ($3-5K/mo), got burned. Disillusioned with digital marketing. Lead with anti-agency messaging. Find them in Facebook groups venting about agencies and RoofingTalk forums.",
          "Segment C — Google-Filter-Aware Roofers: Digitally savvy, aware of the Google Online Estimates filter. Want to future-proof. Lead with Google filter urgency + price comparison vs Roofle. Find them searching for 'online estimates filter' and at industry webinars.",
          "Segment D — Marketing Agencies (White-Label): 1-10 person agencies serving roofing clients. Building websites from scratch for each client. Lead with efficiency pitch: 'Stop building roofing websites from scratch.'",
          "Segment E — Roofing Material Suppliers: Regional supply houses wanting to offer value-added services. Lead with the Owens Corning comparison: 'What OC does for their contractors, you can too.'",
        ],
      },
      {
        heading: "Channel Strategy (4 Phases)",
        type: "default",
        content: [
          "Phase 1 (Weeks 1-4): Community Seeding — Join Facebook groups, Reddit, RoofingTalk. Be helpful, not promotional. Build reputation. Identify beta testers. Set up cold email infrastructure and warm up domains.",
          "Phase 2 (Weeks 5-8): Soft Launch + Cold Email — Share founder story in communities. Launch cold email campaigns: 50-100/day roofers, 20-30/day agencies, 10-20/day suppliers. Target: 10-20 free signups, 1-3 paid widget conversions.",
          "Phase 3 (Weeks 9-16): Content & SEO — Publish cornerstone content: Google filter guide, free website explainer, Roofle/Roofr comparison pages. 2 posts/month. Target keywords: 'free roofing website,' 'roofing estimate widget,' 'alternative to Roofle.'",
          "Phase 4 (Month 4+): Paid Amplification — Only after PMF signals (10%+ free-to-paid conversion, organic signups). Google Ads on competitor keywords, Facebook Ads on roofing contractor interests. Start at $500/mo.",
        ],
      },
      {
        heading: "Cold Email at Scale",
        type: "default",
        content: [
          "The math: 30 emails per mailbox per day. To send 1,000/day, need ~34 mailboxes across 12-17 domains. Total infrastructure cost: ~$350/mo at full scale.",
          "Three parallel sub-campaigns targeting different segments: (A) 'No Website' roofers — highest priority, free website offer; (B) 'Bad Website' roofers — show them what a better site looks like; (C) 'Has Website, No Widget' roofers — Google filter urgency + $99 vs $350 price comparison.",
          "By week 10: 25,800 emails sent → 1,290 replies (5%) → 645 interested → 322 free sites → 32 paying customers = ~$3,168 MRR. From cold email alone — community, content, and PLG are additive.",
          "Key email rules: Plain text only (HTML = +652% bounce rate). 50-80 words. One CTA per email. No links in Email 1. Subject lines: lowercase, 1-5 words. Lead with the free website, NOT the $99/mo widget.",
        ],
      },
      {
        heading: "Month-by-Month Targets",
        type: "default",
        content: [
          "Month 1: 10-20 free signups, 1-3 paid customers, $99-297 MRR",
          "Month 3: 50-75 free signups, 5-10 paid customers, $495-990 MRR",
          "Month 6: 150-200 free signups, 20-30 paid customers, $1,980-2,970 MRR",
          "Month 12: 500+ free signups, 75-100 paid customers, $7,425-9,900 MRR",
        ],
      },
      {
        heading: "What NOT to Say",
        type: "list",
        content: [
          "Don't use Roofle's bro tone — no 'Full Send,' no rocket emojis. Our audience is skeptical and practical.",
          "Don't overhype the 1-in-5 stat — it's from one source. Present honestly with attribution.",
          "Don't say 'AI-powered' as the headline — roofers don't care about AI. Use 'satellite-powered estimates.'",
          "Don't sell the widget on the marketing page — the entire site sells the FREE signup.",
          "Don't promise specific lead numbers — 'Your phone rings more' is honest.",
          "Don't badmouth competitors by name in communities — compare on the website, be helpful in groups.",
        ],
      },
    ],

    sources: [
      { name: "Roofr Marketing Analysis (March 2026)", url: undefined },
      { name: "Competitive Landscape Full 2026", url: undefined },
      { name: "Roofer Pain Points Research", url: undefined },
      { name: "Solopreneur SaaS Analysis", url: undefined },
      { name: "Google Online Estimates Filter Research", url: undefined },
      { name: "Original Competitor Analysis", url: undefined },
      { name: "Live web research on Roofle, Roofr, Contractor+, GHL ecosystem, agencies, communities (March 29, 2026)", url: undefined },
    ],
  },

  {
    slug: "roofer-pain-points",
    label: "Roofer Pain Points",
    desc: "What roofers say online, ranked by frequency",
    summary:
      "Primary research from Reddit r/roofing (80K+), Facebook groups (25K+), and RoofingTalk forums (11K+). Top pain points ranked: lead generation and online visibility (#1), appointment/estimate management, pricing transparency, review management, and customer communication gaps.",
    keyTakeaway:
      "Lead gen and online visibility is the #1 pain point. Exact roofer language: 'I'm tired of paying HomeAdvisor for garbage leads' and 'I miss calls when I'm on the roof.' Every pain point maps directly to an existing RuufPro feature.",
    ruufproImplications:
      "Every pain point maps directly to a RuufPro feature. Lead gen (#1) = free website + estimate widget. Online visibility (#2) = SEO-optimized site. Agency trust issues (#3) = anti-agency positioning. Too complicated software (#6) = '3 questions, 2 minutes, live.' The $187/lead stat for Google Ads is gold — our free website + $99/mo widget is dramatically cheaper.",

    sections: [
      {
        heading: "Where Roofers Hang Out Online",
        type: "default",
        content: [
          "r/roofing (Reddit): 80K+ members — technical advice, venting, peer support. More technical than business-focused.",
          "Roofing Masters Network (Facebook): 10K+ — business advice, marketing, general discussion.",
          "Roofing & Solar Community (Facebook): 25K+ — business side: marketing, invoicing, growth.",
          "Roofers Helping Roofers (Facebook): 4.2K — support, questions, venting. ~7 posts/day.",
          "RoofingTalk.com: 11K+ members, 31K posts — veteran roofers, detailed business discussions. Since 2008.",
          "Roofers Coffee Shop: Large community — industry news, economic outlook, forums.",
          "Key insight: Facebook groups are where the marketing/business conversations happen. Reddit is more technical. RoofingTalk has the deep business pain point threads.",
        ],
      },
      {
        heading: "#1: Lead Generation (63% say it's their #1 challenge)",
        type: "default",
        content: [
          '"63% of roofing business owners said generating new leads is their #1 growth challenge." — Roofing by the Numbers 2025',
          "What they say: 'Getting the phone to ring with actual customer calls' is the universal struggle. Many rely on word-of-mouth alone but know 'that alone isn't enough to sustain and grow.' Google Ads leads average $187 per lead — highest in home services. '3-5+ contractors bidding on the same lead' from shared platforms = low conversion.",
          "SaaS opportunity: The free website + estimate widget IS the lead generation tool. Frame it as 'your phone rings more' not 'you get a website.'",
        ],
      },
      {
        heading: "#2: Online Visibility / No Website",
        type: "default",
        content: [
          '"Modern buyers complete between 66% and 90% of their purchasing journey before they ever pick up the phone."',
          "Many roofers have NO website or a terrible outdated one. 'Most roofing websites have problems because unqualified or cheapest people are hired to build them.' Over 70% of buyers check reviews before calling. Google's Online Estimates filter (Dec 2025) is making this worse.",
          "SaaS opportunity: This is the CORE value prop. Free, professional, roofing-specific website, live in 2 minutes, SEO-optimized.",
        ],
      },
      {
        heading: "#3: Marketing Agency Trust Issues",
        type: "default",
        content: [
          '"More than two-thirds of roofing companies are now unhappy with their SEO/marketing providers."',
          "Burned by agencies who overpromise and underdeliver. 'High-pressure one-call-close sales tactics.' Locked into long-term agreements they quickly regret. Paid $3-5K for a website that doesn't generate leads. Feel like they're throwing money away on marketing they can't track.",
          "SaaS opportunity: Position as the anti-agency. 'No salesperson. No contract. No monthly retainer. Just a free website that works.' The fact that WE'RE NOT an agency is a competitive advantage.",
        ],
      },
      {
        heading: "#4: Staffing / Labor (NOT SaaS-solvable)",
        type: "default",
        content: [
          '"The #1 problem for roofing business owners is staffing/employees/subcontractors." "61% of commercial roofers said the lack of skilled workers was their top concern."',
          "Can't find reliable workers. Labor costs up 57% year-over-year. Can't grow until they get the right people. Not directly solvable by SaaS, but if we help them get more leads, they have more revenue to attract better workers.",
        ],
      },
      {
        heading: "#5-9: Additional Pain Points",
        type: "list",
        content: [
          "Competition from unqualified roofers — 'Hack roofers' and storm chasers undercut on price. A professional website with trust badges helps legitimate roofers stand out.",
          "Too complicated software — 'I'm not a tech guy' is an identity statement, not a preference. Our 2-minute setup is a MASSIVE differentiator.",
          "Material costs / economic uncertainty — Not SaaS-solvable, but the estimate widget helps homeowners understand costs upfront, reducing sticker shock.",
          "Slow follow-up / losing leads — Leads come in but roofers are on a roof. By the time they call back, the homeowner chose someone else. Email notifications + lead dashboard solve this.",
          "Seasonal revenue swings — A website that generates organic leads year-round smooths the feast-or-famine curve.",
        ],
      },
      {
        heading: "Key Insights for Website Copy",
        type: "callout",
        content: [
          "Lead with the OUTCOME, not the tool — roofers don't want a website, they want their phone to ring.",
          "Address the agency trust problem HEAD-ON — 2/3 of roofers are burned. Be the anti-agency.",
          "Simplicity is a feature, not a compromise — '2-minute setup' isn't just fast, it's RESPECTFUL of their time.",
          "Legitimacy is emotional — roofers competing against storm chasers need to LOOK professional. 'The website that makes you look as good as you actually are.'",
          "The $187/lead stat is gold — Google Ads cost $187/lead for roofers. Our solution is dramatically cheaper.",
        ],
      },
    ],

    sources: [
      { name: "RoofingTalk — Major Pains/Problems", url: "https://www.roofingtalk.com/threads/what-are-your-major-pains-problems-in-running-your-roofing-business.2465/" },
      { name: "RoofingTalk — Top 3 Problems", url: "https://www.roofingtalk.com/threads/what-are-the-top-3-problems-by-roofing-business-owners.9917/" },
      { name: "RoofingTalk — Difficulty Getting Customers", url: "https://www.roofingtalk.com/threads/for-roofers-having-difficulty-getting-new-customers-questions.10087/" },
      { name: "Glasshouse — Roofing Lead Gen Guide 2025", url: "https://www.glasshouse.biz/blog/roofing-lead-generation-2025" },
      { name: "Best Roofer Marketing — Top Ways to Get Leads 2025", url: "https://www.bestroofermarketing.com/the-top-ways-to-get-roofing-leads-in-2025/" },
      { name: "Roofing Contractor — 2025 Trends Report", url: "https://www.roofingcontractor.com/articles/101568-2025-commercial-roofing-trends-report" },
      { name: "Roofing Insights — Industry Trends 2024-2025", url: "https://www.roofinginsights.com/news/roofing-industry-trends-report-2024-2025" },
      { name: "JobNimbus — Best Facebook Groups for Roofers", url: "https://www.jobnimbus.com/blog/facebook-roofing-groups/" },
      { name: "Roofing Webmasters — Marketing Statistics 2025", url: "https://www.roofingwebmasters.com/marketing-statistics/" },
    ],
  },

  {
    slug: "competitive-landscape",
    label: "Competitive Landscape 2026",
    desc: "Full market analysis — Roofle, Roofr, GHL agencies",
    summary:
      "Deep analysis of every competitor: Roofle ($350/mo + $2K setup), Roofr ($249-349+/mo), Contractor+ (enterprise), and GHL agencies ($500-2,500/mo, clients unhappy). Maps pricing, features, marketing channels, strengths and weaknesses.",
    keyTakeaway:
      "No competitor offers a free website. Roofle charges $350/mo for just the widget. GHL agencies charge $500-2,500/mo and 2/3 of clients are unhappy. RuufPro's moat is price + simplicity for the 1-10 person crew.",
    ruufproImplications:
      "RuufPro is 72% cheaper than Roofle ($99 vs $350/mo) AND includes a free website. 75% cheaper than Roofr ($99 vs $398/mo). 90%+ cheaper than GHL agencies. The ideal customer is sharpened: 1-10 person crew, under $2M revenue, NOT an Owens Corning certified contractor, burned by an agency or never hired one.",

    sections: [
      {
        heading: "Contractor+ ($29/mo)",
        type: "default",
        content: [
          "All-in-one field service management for ALL trades — not roofing-specific. Free CRM tier as lead magnet, upsells to Pro ($29/mo) for website. Auto-generated SEO pages, AI copywriter, custom domain with SSL.",
          "Threat level: MODERATE. They prove the 'free tier + website upsell' model works. But they're generic (all trades), no satellite estimate widget, website quality is template-grade. Their pricing ladder ($0 → $29 → $58) validates our model.",
        ],
      },
      {
        heading: "GoHighLevel / The Reseller Army",
        type: "default",
        content: [
          "GHL is NOT a direct competitor — it's the platform BEHIND hundreds of marketing agencies selling to roofers. Agencies buy GHL at $297-$497/mo, white-label it, and sell pre-built roofing 'snapshots' to roofers for $297-$2,500/mo.",
          "Roofing is GHL's #1 niche. One roofing snapshot can be sold to roofers in 100+ cities. Robb Bailey (GHL's most prominent evangelist) has trained 20,000+ agencies on the model.",
          "Threat level: HIGH (indirect). GHL agencies compete for the same customers. But most GHL agency clients are mid-size+ roofers ($2M+ revenue). The roofers BURNED by these agencies are our best customers.",
        ],
      },
      {
        heading: "Estimate Widget Landscape",
        type: "default",
        content: [
          "Roofle RoofQuote PRO: $350/mo + $2K setup OR $5,500/yr — most established, 15K+ users, Owens Corning partnership.",
          "Roofr Instant Estimator: $149/mo add-on on top of $249-349/mo base — part of full CRM ecosystem.",
          "Instant Roofer & eRoofQuote: Free for homeowners — lead-gen model, roofers don't control it.",
          "Owens Corning Budget Your Roof: Free widget for OC contractors — manufacturer-backed.",
          "RuufPro: $99/mo (planned) — cheapest embeddable widget with satellite data. Free website included. Nobody else occupies this position.",
        ],
      },
      {
        heading: "Roofing Marketing Agencies",
        type: "default",
        content: [
          "Hook Agency: $3,000-15,000+/mo — SEO, PPC, content. Targets $2M+ contractors.",
          "Roofing Webmasters: ~$750-5,000/mo — SEO, websites, content. 16+ years in roofing. Month-to-month, no contracts.",
          "Contractor Marketing Pros: $2,000-10,000+/mo — Meta/TikTok/Google ads, SEO. 200K+ leads generated.",
          "Scorpion: $200K-$1M+ project-based — AI-powered platform for large contractors.",
          "Average roofing marketing budget: 7-8% of revenue for small contractors (<$5M revenue). 2/3 of roofers are unhappy with their marketing providers.",
          "RuufPro is NOT competing with agencies — we're the alternative for roofers who can't afford them or got burned by them.",
        ],
      },
      {
        heading: "Where Roofers Hang Out Online",
        type: "list",
        content: [
          "Facebook: Roofing & Solar Community (25K+), Roofing Masters Network (10K+), Roofers Helping Roofers (4.2K)",
          "Reddit: r/roofing (80K+ members) — more technical than business-focused",
          "Forums: RoofingTalk.com (11K+ members, 31K posts), Roofers Coffee Shop",
          "YouTube: Dmitry Lipinskiy (Roofing Insights) — hugely influential tool reviewer",
          "Podcasts: The Roofer Show (Dave Sullivan), Roofer Growth Hacks (Chris Hunter)",
        ],
      },
      {
        heading: "Competitive Pricing Summary",
        type: "default",
        content: [
          "RuufPro vs Roofle: 72% cheaper ($99 vs $350/mo) AND includes free website.",
          "RuufPro vs Roofr: 75% cheaper ($99 vs $398/mo for comparable features).",
          "RuufPro vs GHL agencies: 90%+ cheaper ($99 vs $500-2,500/mo).",
          "RuufPro vs marketing agencies: 97%+ cheaper ($99 vs $3,000-15,000/mo).",
          "Our ideal customer: 1-10 person crew, under $2M revenue, no/bad website, can't afford $300+/mo, burned by an agency, NOT an OC certified contractor (they get Roofle for free/cheap).",
        ],
      },
      {
        heading: "Google Online Estimates Filter (March 2026 Update)",
        type: "callout",
        content: [
          "Launched December 2025. 1 in 5 (20%) homeowners use the filter. Trend: growing — Demand IQ hosted a webinar March 19, 2026 calling it a 'major shift.'",
          "Roofle, Roofr, and Demand IQ are all positioning their tools as THE way to qualify. RuufPro is NOT YET POSITIONED — we need to be.",
          'Our unique angle: "You need online estimates. Here\'s one for $99/mo — with a free website included." Nobody else combines the website + widget at this price.',
        ],
      },
    ],

    sources: [
      { name: "Contractor+ Websites", url: "https://contractorplus.app/websites/" },
      { name: "Contractor+ Pricing", url: "https://contractorplus.app/pricing" },
      { name: "Roofr Pricing", url: "https://roofr.com/pricing" },
      { name: "Roofle RoofQuote PRO", url: "https://offers.roofle.com/roof-quote-pro" },
      { name: "GoHighLevel Roofing Playbook", url: "https://www.gohighlevel.com/roofing-playbook" },
      { name: "Hook Agency — Roofing Marketing Agencies", url: "https://hookagency.com/blog/roofing-contractor-marketing-agencies/" },
      { name: "Thrive Agency — Best Roofing Marketing Companies 2026", url: "https://thriveagency.com/news/best-roofing-marketing-companies/" },
      { name: "GHL Agency Pricing Guide 2026", url: "https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-agency-pricing-guide/" },
      { name: "Roofle Blog — Google Changed Roofing Search", url: "https://blog.roofle.com/google-just-changed-roofing-search-online-estimates-filter" },
      { name: "Demand IQ — Google's Filter", url: "https://www.demand-iq.com/blog/google-online-estimates-filter-contractors" },
      { name: "RoofersCoffeeShop — Don't Get Filtered Out", url: "https://www.rooferscoffeeshop.com/post/dont-get-filtered-out-master-googles-online-estimates-tool" },
      { name: "Roofing Contractor — State of the Industry 2026", url: "https://www.roofingcontractor.com/articles/101643-2026-state-of-the-roofing-industry-report" },
    ],
  },

  {
    slug: "competitor-analysis",
    label: "Competitor Analysis",
    desc: "Detailed breakdown of direct competitors",
    summary:
      "Tier-based market breakdown: enterprise (Contractor+), mid-market (Roofr, Roofle), and small/solo (RuufPro's target). Deep dive into Roofr as primary competitor — messaging, features, social proof, and gaps.",
    keyTakeaway:
      "Roofr targets mid-market with higher prices and complexity. RuufPro owns the underserved small crew segment. Study Roofr's social proof approach (logos, case study numbers) to copy at smaller scale once first customers exist.",
    ruufproImplications:
      "Every competitor either charges too much, is too complex, doesn't include a website, or isn't roofing-specific. RuufPro is the only product that gives small roofers a free, professional, roofing-specific website with an optional affordable estimate widget. Steal from Roofr: 'Start for free' in the hero, specific case study numbers. Steal from Roofle: dream outcome headline energy. Avoid: Roofle's emoji-heavy hype tone, Roofr's feature-heavy navigation, enterprise language.",

    sections: [
      {
        heading: "Market Tiers",
        type: "default",
        content: [
          "Enterprise tier: ServiceTitan, AccuLynx — $250-500+/mo, targeting 20+ person operations.",
          "Mid-market: Roofr, Roofle, JobNimbus — $99-450/mo, targeting 5-20 person companies.",
          "Small/Solo: RuufPro, Contractor+, DIY (Wix) — $0-99/mo, targeting 1-10 person crews.",
          "RuufPro's gap: Nobody is giving small roofers a genuinely free, professional website + affordable estimate widget.",
        ],
      },
      {
        heading: "Roofr — Primary Competitor",
        type: "default",
        content: [
          "Hero: 'A suite of tools for roofing businesses to measure more roofs / win more deals / save more time.' Clean, modern, blue gradient.",
          "Pricing: Free plan (CRM basics, 2 seats), Pro $99/mo (3 seats), Premium $169/mo (5 seats), plus $13-19 per measurement report.",
          "What they do well: Outcome-driven copy ('close 10x faster,' '$2.5M in 1 year'), social proof everywhere (4.7 stars, 1,000+ reviews, G2 badges), 'Start for free' is prominent, specific numbers like '13 minute average reply rate.'",
          "Weaknesses: Pricing escalates fast ($400-600/mo fully loaded), too complex for small roofers, no free standalone website, learning curve, accuracy issues in rural areas, inconsistent support.",
        ],
      },
      {
        heading: "Roofle — Secondary Competitor",
        type: "default",
        content: [
          "Hero: 'Sell Roofs In Your Sleep' — energetic gradients, animated particles, emoji-heavy tone.",
          "Pricing: $350/mo + $2,000 setup = $6,200 first year. Annual option: $5,500/year.",
          "What they do well: Outcome-driven headline, social proof with specific numbers ('7,104% ROI,' '2.4M+ quotes sent'), video testimonials, Owens Corning partnership.",
          "Weaknesses: Expensive ($6,200/yr), no free website (widget-only), overly hype tone, no free tier, complex for what it is. A 3-person crew can't justify $350/mo for a widget.",
        ],
      },
      {
        heading: "What Roofers Actually Complain About",
        type: "list",
        content: [
          "'Too expensive for what I get' — #1 complaint. Small roofers feel nickeled-and-dimed by per-report fees, seat limits, and feature gates.",
          "'Too complicated' — they don't want to learn a CRM. They want their phone to ring.",
          "'I'm paying $500/mo and still don't have a good website' — tools don't solve the visibility problem.",
          "'I don't have time for this' — on roofs 10 hours/day. Setup and maintenance are killers.",
          "'I just need something simple that works' — the market is over-featured for small roofers.",
        ],
      },
      {
        heading: "Messaging to Steal vs. Avoid",
        type: "default",
        content: [
          "STEAL from Roofr: 'Start for free' in the hero, email input with no barriers, specific case study numbers, 'Built for roofers, by roofers.'",
          "STEAL from Roofle: Dream outcome headline energy — 'Sell Roofs In Your Sleep' is excellent framing. Specific ROI numbers. Video testimonials.",
          "STEAL from Jobber: Clean, simple design that makes complex software look easy.",
          "AVOID from Roofle: Over-hype tone with emojis. Our audience is skeptical.",
          "AVOID from Roofr: Feature-heavy navigation. Small roofers don't need 7 product pages.",
          "AVOID from ServiceTitan: Enterprise language. 'Optimize your operations' means nothing to a 3-person crew.",
        ],
      },
      {
        heading: "RuufPro's Killer Advantages",
        type: "callout",
        content: [
          "$0 forever vs Roofle's $6,200/year and Roofr's escalating per-report fees.",
          "2 minutes vs weeks of setup with agencies or Roofle's onboarding.",
          "Website INCLUDED vs needing a separate website to use Roofle's widget.",
          "Roofing-specific vs Jobber/Housecall Pro's generic approach.",
          "Simple — answer 3 questions vs learning a full CRM.",
        ],
      },
    ],

    sources: [
      { name: "Roofr", url: "https://roofr.com" },
      { name: "Roofle / RoofQuote PRO", url: "https://offers.roofle.com" },
      { name: "Roofle Pricing", url: "https://offers.roofle.com/plans" },
      { name: "Roofr Reviews — Capterra", url: "https://www.capterra.com/p/208102/Roofr/reviews/" },
      { name: "Roofr Reviews — G2", url: "https://www.g2.com/products/roofr/reviews" },
      { name: "FieldFuze Roofr Alternative", url: "https://toricentlabs.com/blog/roofr-alternative.html" },
      { name: "RooferBase Roofr Review", url: "https://www.rooferbase.com/blog/roofr-software-what-roofers-need-to-know-in-2025" },
      { name: "Best Roofing Software — G2", url: "https://www.g2.com/categories/roofing-software" },
    ],
  },

  {
    slug: "marketing-copy",
    label: "Marketing Copy Research",
    desc: "What converts for roofing industry",
    summary:
      "Analysis of effective roofing website headlines and messaging patterns. Three approaches that convert: trust-focused, benefit-driven, and problem-solution. Includes hero headline formulas and CTA patterns.",
    keyTakeaway:
      "'Trusted Roofing in [City]' is the universal safe default headline. Trust-first, city-specific, problem-solution patterns convert best. Template defaults should follow these formulas.",
    ruufproImplications:
      "These patterns are baked into the website templates as smart defaults. The universal default headline 'Trusted Roofing in [City]' works for any roofer. CTA: 'Get Your Free Estimate' converts best. Trust signals ranked: Google reviews (#1), Licensed & Insured (#2), manufacturer certifications (#3). The 83% stat (consumers more likely to trust sites with third-party badges) justifies trust badge prominence.",

    sections: [
      {
        heading: "Hero Headlines — What Works",
        type: "default",
        content: [
          "City-specific trust (most common, strong SEO): 'Trusted Roofing in [City],' '[City]'s Most Trusted Roofing Contractor,' 'Protecting [City] Homes Since [Year].'",
          "Benefit-driven / emotional (higher conversion): 'Protect Your Family and Home,' 'Ensuring Your Roof Stands the Test of Time,' 'A Roof You Can Count On.'",
          "Problem-solution (direct, urgent): 'Roof Damage? We're Here to Help,' 'Don't Let a Leak Become a Flood.'",
          "Universal default recommendation: 'Trusted Roofing in [City]' — works for any roofer, any city, any size. SEO-friendly, trust-forward.",
        ],
      },
      {
        heading: "Key Principles",
        type: "quote",
        content: [
          '"Lead with the biggest benefit you offer; the main objective is to clearly state how your service helps them and match what they\'re searching for." — Hook Agency',
          '"Ask real happy customers what they like about your company and use their language in your headlines." — Robben Media',
        ],
      },
      {
        heading: "CTA Button Text — Ranked by Effectiveness",
        type: "list",
        content: [
          "'Get Your Free Estimate' — most universally effective, clear expectation",
          "'Schedule Your Free Inspection' — slightly more specific, good for storm/insurance roofers",
          "'Get a Free Quote' — shorter, works well on mobile",
          "'Request Your Free Roof Inspection' — longest, most specific",
          "'Call Now' — strong for phone-driven leads, especially mobile",
          "AVOID: 'Learn More' (too vague), 'Submit' (feels like a form), 'Contact Us' (passive)",
        ],
      },
      {
        heading: "Trust / Credibility Copy — Ranked by Impact",
        type: "list",
        content: [
          "Google reviews with star ratings — 83% of consumers are more likely to trust a site with reputable third-party badges (Webology)",
          "'Licensed & Insured' — table stakes, but must be visible",
          "Manufacturer certifications — GAF Master Elite, Owens Corning Preferred, CertainTeed Select. Highest-value badges for roofers",
          "Years in business — 'Serving [City] Since [Year]' or '[X]+ Years Experience'",
          "BBB Accreditation with rating displayed",
          "'Locally Owned & Operated' or 'Family Owned' — strong emotional trust signal",
          "'[X]-Year Workmanship Warranty' — more specific than 'We stand behind our work'",
        ],
      },
      {
        heading: "Service Descriptions — Best Practice",
        type: "default",
        content: [
          "Roof Replacement: 'Complete roof replacement with premium materials and expert installation. We handle everything from tear-off to cleanup, leaving you with a roof built to last.'",
          "Roof Repair: 'Leaks, missing shingles, flashing issues — we diagnose the problem and fix it right the first time. Fast response, lasting results.'",
          "Roof Inspections: 'Thorough inspections to assess your roof's condition. Ideal before buying or selling a home, or after severe weather.'",
          "Avoid: Overly technical language (homeowners don't know 'drip edge'), vague descriptions ('We provide quality service'), walls of text (keep each service to 2-3 sentences max).",
        ],
      },
      {
        heading: "What's Universal vs. What Needs Customization",
        type: "default",
        content: [
          "Universal smart defaults (work for ANY residential roofer): Headline 'Trusted Roofing in [City],' CTA 'Get Your Free Estimate,' services: Replacement, Repair, Inspections, Gutters.",
          "Per-roofer input (with good defaults): Trust badges (checkboxes), years in business, phone number, additional service area cities.",
          "Optional customization: Custom headline override, custom about text, gallery/photos, additional services, logo upload.",
        ],
      },
    ],

    sources: [
      { name: "Hook Agency — Best Roofing Websites 2025", url: "https://hookagency.com/blog/best-roofing-websites/" },
      { name: "Roofing Webmasters — 23 Best Roofing Websites", url: "https://www.roofingwebmasters.com/roofing-websites/" },
      { name: "Robben Media — Roofing Conversion Optimization", url: "https://robbenmedia.com/top-10-tips-for-roofing-contractor-website-conversion-optimization/" },
      { name: "Creative Roofing Marketing — High-Converting Landing Pages", url: "https://creativeroofingmarketing.com/top-7-tips-for-a-high-converting-roofing-landing-page/" },
      { name: "GetResponse — Roofing Landing Page Components", url: "https://www.getresponse.com/blog/roofing-landing-page" },
      { name: "Webology — Trust Badges for Roofing", url: "https://webology.io/trust-badges-roofing-website/" },
      { name: "Comrade Web — Best Roofing Websites", url: "https://comradeweb.com/blog/best-roofing-websites/" },
    ],
  },

  {
    slug: "cold-email-strategy",
    label: "Cold Email Strategy",
    desc: "Outreach plan and copy frameworks",
    summary:
      "Complete cold email infrastructure: sending domains, email stack (Instantly, Google Workspace, Apollo), prospect scraping workflow, and personalized outreach templates referencing Google ranking, review count, and website gaps.",
    keyTakeaway:
      "Problem-led copy works without case studies: 'I noticed [Company] doesn't rank for roofing contractor [city].' Start with 5-10 manual emails before scaling. Pair with demo-as-lead-magnet for maximum impact.",
    ruufproImplications:
      "The cold email pipeline is fully designed and ready to execute. Three sending domains purchased (getruufpro.com, joinruufpro.com, ruufprohq.com). Instantly Growth at $30/mo for sending. Three sub-campaigns: (A) no-website roofers, (B) bad-website roofers, (C) has-website-no-widget roofers. Month 1 target: ~20 free sites, 4-6 paying customers ($400-600 MRR).",

    sections: [
      {
        heading: "Infrastructure",
        type: "default",
        content: [
          "Sending domains: getruufpro.com, joinruufpro.com, ruufprohq.com — each with hannah@ and hello@ mailboxes.",
          "Stack: Porkbun (domains), Google Workspace Starter $7.20/mailbox (email), Instantly Growth $30/mo (sending/warmup), Apollo free + Google Maps (lead sourcing), NeverBounce (verification), Google Postmaster Tools (reputation).",
          "DNS records per domain: SPF, DKIM, DMARC — all configured for deliverability.",
        ],
      },
      {
        heading: "The 4-Step Pipeline",
        type: "list",
        content: [
          "Step 1: Find Prospects — tools/find_prospects.py scrapes roofing contractors by metro area, enriches with website quality, Google reviews, and personalized observations.",
          "Step 2: Generate Site Preview Mockups — tools/generate_site_preview.py creates personalized screenshots of what their RuufPro site would look like. Goes in Email 2 — highest-converting email in the sequence.",
          "Step 3: Generate Email Sequences — 5-email personalized sequence per prospect using PAS, screenshot/mockup, before-after-bridge, observation, and breakup frameworks.",
          "Step 4: Track Outreach — Logs prospect status from queued → warmup → sending → replied → converted. Statuses: queued, warmup, sending, replied-interested, replied-not-now, converted-free, converted-paid, no-response, bounced.",
        ],
      },
      {
        heading: "Email Rules (Non-Negotiable)",
        type: "list",
        content: [
          "Plain text only. No HTML, no images, no logos, no signatures.",
          "75-100 words max. Contractors read on their phones between jobs.",
          "One CTA per email, always framed as a question.",
          "No links in Email 1. Max 1 link in follow-ups.",
          "Subject lines: lowercase, 1-5 words, no punctuation. Best: '{{company_name}}', 'quick question', 'saw your Google listing.'",
          "Send from 'Hannah Waldo' or 'Hannah from RuufPro' — never 'RuufPro Team.'",
          "Never say 'free' in subject line (spam trigger). Say it in the body.",
          "Lead with the free website, NOT the $99/mo widget. Widget pitch comes after they're a user.",
        ],
      },
      {
        heading: "Send Timing & Volume",
        type: "default",
        content: [
          "Best windows: Tue-Thu 6-7 AM Central (before job sites), Tue-Thu 7:30-9 PM Central (after dinner — highest reply rate), Saturday 7-9 AM Central.",
          "Avoid: 10AM-5PM weekdays, Friday after 2PM, Sunday.",
          "Per mailbox: Max 30-50 emails/day (real + warmup). Ramp: 5/day week 1 → 15/day week 2 → 30/day week 3+.",
          "Keep warmup running continuously. Bounce rate must stay under 3%. Spam complaint rate under 0.1%.",
        ],
      },
      {
        heading: "Customer Segments (Priority Order)",
        type: "list",
        content: [
          "Priority 1: New roofers (1-3 years, no website) — easiest sell, lead with free website",
          "Priority 2: Established small roofers (bad/outdated website) — show mockup of better site",
          "Priority 3: Google-filter-aware roofers — lead with widget ($99 vs Roofle's $350)",
          "Priority 4: Marketing agencies — white-label pitch, separate campaign",
          "Priority 5: Roofing material suppliers — distribution partnership, separate campaign",
        ],
      },
      {
        heading: "Realistic Projections (DFW Launch)",
        type: "default",
        content: [
          "200 emails/week (conservative with 6 mailboxes) → 50% open rate = 100 opens → 10% reply rate = 20 replies/week → 50% positive = 10 interested/week → 50% convert to free site = 5 new free sites/week.",
          "Month 1 target: ~20 free sites, 4-6 paying customers ($400-600 MRR).",
          "20-30% of free users convert to $99/mo widget over time.",
        ],
      },
    ],

    sources: [
      { name: "Cold email strategy based on Instantly platform best practices", url: undefined },
      { name: "Gong.io — PAS framework reply rate data (6% to 14%)", url: undefined },
      { name: "John Caesar — Cold Email Masterclass (1,000/day system)", url: undefined },
      { name: "HTML bounce rate data: +652% vs plain text", url: undefined },
    ],
  },

  {
    slug: "product-overview",
    label: "Product Overview",
    desc: "Full spec, roadmap, pricing, tech stack",
    summary:
      "Master product spec: free website generator (5 templates), $99/mo estimate widget (V4 with satellite data, PDF, signatures), review automation, speed-to-lead auto-reply, SEO city pages. Tech: Next.js 14, Supabase, Twilio, Resend.",
    keyTakeaway:
      "More features built than most competitors charge $300+/mo for. Roadmap items (SEO city pages, GBP sync, Stripe) are important but secondary to getting paying customers with what's already built.",
    ruufproImplications:
      "The product is further along than most pre-launch SaaS. 12 features complete, 2 in progress, 3 planned. The critical blocker is Stripe Billing — can't collect money without it. After that, the priority is getting the first paying customer, not building more features.",

    sections: [
      {
        heading: "What We're Building",
        type: "default",
        content: [
          "A micro-SaaS platform for small roofing contractors (1-10 person crews) that bundles: Free roofing website (our lead magnet — no competitor offers this), Instant estimate widget ($99/mo), Review automation ($99/mo), Speed-to-lead auto-reply + follow-up drips ($149/mo), City-specific SEO pages ($149/mo).",
        ],
      },
      {
        heading: "Why It Exists",
        type: "callout",
        content: [
          "Google launched an 'Online Estimates' filter (Dec 2025) that hides roofers without online pricing. 78% of homeowners want pricing. 76% of roofers don't show it. Roofle charges $350/mo + $2K setup. We offer the same core value at $99/mo with no setup fee, plus a free website nobody else provides.",
        ],
      },
      {
        heading: "Tech Stack",
        type: "default",
        content: [
          "Frontend: Next.js 14+ (App Router). Hosting: Vercel. Database: Supabase (Postgres + Auth + RLS). Payments: Stripe. SMS: Twilio. Roof Data: Google Solar API. Email: Resend. DNS: Cloudflare.",
        ],
      },
      {
        heading: "Pricing Model",
        type: "default",
        content: [
          "Roofing Website: Free (always) — professional single-page site + contact form + lead notifications.",
          "Estimate Widget: $99/mo — instant pricing calculator, embeddable on any site.",
          "Review Automation: $99/mo — auto-text Google review requests after job completion.",
          "Auto-Reply + Follow-Up: $149/mo — speed-to-lead auto-text + drip sequences.",
          "SEO City Pages: $149/mo — auto-generated '[Service] in [City]' pages.",
          "The free website is the lead magnet and main acquisition tool — always free, fully functional, no gates. Revenue comes from paid services sold independently.",
        ],
      },
      {
        heading: "Our Moat",
        type: "callout",
        content: [
          "Free roofing-specific website. No competitor offers this. It's our lead magnet and the thing that makes switching costs real — once a roofer's site is live and getting traffic, they stay.",
        ],
      },
      {
        heading: "Key Competitors",
        type: "default",
        content: [
          "Roofle — Widget-only, $350/mo + $2K setup, no website. Our main competitor.",
          "Roofr — Measurements + CRM, $89+/mo + per-report. No website (beta builder at $199/mo).",
          "Scorpion — Full marketing, $3-10K/mo, 12-24mo lock-in. You lose your site on exit.",
          "GoDaddy/Wix — Generic, cheap, but no estimate widget or lead tools.",
        ],
      },
    ],

    sources: [
      { name: "Internal project documentation", url: undefined },
      { name: "Google Solar API documentation", url: undefined },
      { name: "Roofle pricing page", url: "https://offers.roofle.com/plans" },
      { name: "Roofr pricing page", url: "https://roofr.com/pricing" },
    ],
  },

  {
    slug: "google-estimates-filter",
    label: "Google Estimates Filter",
    desc: "Dec 2025 Google filter opportunity",
    summary:
      "Google launched an 'Online Estimates' filter in local search (Dec 2025) that hides roofers without online pricing tools. Affects 1 in 5 homebuyers searching for roofing services.",
    keyTakeaway:
      "This is the #1 urgency message — real, not manufactured. 'Google is hiding roofers without online estimates.' RuufPro's $99/mo widget solves this instantly. Use everywhere: cold emails, Facebook groups, offer page.",
    ruufproImplications:
      "This is our single strongest marketing message. The pitch: 'Google now hides roofers without online estimates. 1 in 5 homeowners use this filter. Roofle charges $350/mo to fix this. We charge $99/mo — and the website is free.' No other competitor combines the website + widget at this price. Important honesty note: the hard data is thinner than we'd like. The '1 in 5' stat comes from one source (RoofersCoffeeShop). Present honestly with attribution.",

    sections: [
      {
        heading: "What It Is",
        type: "default",
        content: [
          "Google added an 'Online Estimates' filter to local search results for home services including roofing. It appears at the top of search results — above ads, reviews, and 'top-rated' listings.",
          "When a homeowner clicks this filter, the results narrow to ONLY show contractors who offer real online pricing tools. Everyone else disappears.",
          "Rolled out December 2025 (Roofle blog, Dec 29 2025). By early 2026, Google added 'Online estimate' buttons directly in search results.",
        ],
      },
      {
        heading: "How Many Homeowners Use It",
        type: "callout",
        content: [
          "1 in 5 (20%) of homebuyers use the filter when searching for roofing services. — Source: RoofersCoffeeShop",
          "This number will likely grow as homeowners discover it and as Google promotes it more prominently.",
        ],
      },
      {
        heading: "What Qualifies a Contractor",
        type: "list",
        content: [
          "Enable 'Online estimates' in Google Business Profile → Attributes",
          "Have a REAL online estimate experience on their website that includes: guided questions scoping the job, real pricing logic, immediate estimate ranges, actual engagement (time on page, completion rates)",
          "'Not fill out this form and we'll call you. Not vague generalized pricing ranges.' — Demand IQ. Google is checking for REAL estimate tools, not fake ones.",
        ],
      },
      {
        heading: "Impact on Contractors WITHOUT Online Estimates",
        type: "default",
        content: [
          "Invisible to 20% of high-intent homeowners right now (growing).",
          "'Years of SEO work, review gathering, and thousands of marketing dollars can suddenly stop paying off.' — Demand IQ",
          "Google monitors engagement signals: short visits, immediate bounces, low engagement can REDUCE ranking even outside the filter.",
        ],
      },
      {
        heading: "Impact on Contractors WITH Online Estimates",
        type: "default",
        content: [
          "Visibility boost in local results — Google is 'actively rewarding local service businesses that make it easier for homeowners to get pricing fast.' — Roofr",
          "Case study: Amanda from Maven Roofing uses instant estimates to 'land an extra 2+ jobs each month without any extra work.' — Roofr",
          "Better lead quality — the estimate tool 'filters out the folks who won't be able to afford it' and 'captures lead info automatically.'",
        ],
      },
      {
        heading: "Competitor Positioning",
        type: "default",
        content: [
          "Roofle: Wrote the definitive blog post. Positions their RoofQuote PRO ($350/mo) as THE solution.",
          "Roofr: 'Your online estimates matter more than ever.' Positions their Instant Estimator ($149/mo add-on).",
          "Demand IQ: Enterprise focus for solar/HVAC/roofing.",
          "Owens Corning: Free Budget Your Roof widget for OC contractors only.",
          "RuufPro: NOT YET POSITIONED — but we have the strongest angle: free website + cheapest widget.",
        ],
      },
      {
        heading: "Honesty Note on Data Quality",
        type: "callout",
        content: [
          "The hard data is thinner than we'd like. The '1 in 5' stat comes from one source (RoofersCoffeeShop webinar promo). No major study has quantified the exact visibility loss. The filter is real and verified, but the impact data is mostly qualitative.",
          "We can say: '1 in 5 homeowners are already using Google's Online Estimates filter' — this is sourced. We should NOT overstate the impact beyond what's documented.",
        ],
      },
    ],

    sources: [
      { name: "Roofle Blog — Google Just Changed Roofing Search", url: "https://blog.roofle.com/google-just-changed-roofing-search-online-estimates-filter" },
      { name: "Roofr Blog — Online Estimates Matter More Than Ever", url: "https://roofr.com/blog/roofers-online-estimates" },
      { name: "Demand IQ — Google's Filter Is Deciding Which Contractors Show Up", url: "https://www.demand-iq.com/blog/google-online-estimates-filter-contractors" },
      { name: "RoofersCoffeeShop — Don't Get Filtered Out", url: "https://www.rooferscoffeeshop.com/post/dont-get-filtered-out-master-googles-online-estimates-tool" },
      { name: "RoofingSites — Does Your Website Offer Online Estimates?", url: "https://roofingsites.com/does-your-website-offer-online-estimates-google-wants-to-know/" },
      { name: "AltaVista SP — What Google's Filter Means for Contractors", url: "https://www.altavistasp.com/google-online-estimates-filter-for-contractors/" },
      { name: "Footbridge Media — New Google Search Filter", url: "https://www.footbridgemedia.com/marketing-tips/google-new-search-filter-online-estimates-impacting-contractor" },
    ],
  },
];
