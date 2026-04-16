// Outreach email templates — TypeScript port of tools/generate_email_sequence.py.
// Used by OutreachApprovalPanel to preview real email content before sending.
// Three campaign types based on prospect website status.

export type CampaignType = "no_website" | "bad_website" | "no_widget";

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface OutreachVars {
  first_name: string;
  business_name: string;
  city: string;
  preview_url: string;
  claim_url: string;
}

function fill(template: string, vars: OutreachVars): string {
  return template
    .replace(/\{first_name\}/g, vars.first_name)
    .replace(/\{business_name\}/g, vars.business_name)
    .replace(/\{city\}/g, vars.city)
    .replace(/\{preview_url\}/g, vars.preview_url)
    .replace(/\{claim_url\}/g, vars.claim_url);
}

const SEQUENCES: Record<CampaignType, EmailTemplate[]> = {
  no_website: [
    {
      subject: "{business_name}",
      body: `Hey {first_name},

I searched for roofing contractors in {city} and couldn't find {business_name} anywhere online. No website, nothing.

That's a real problem. Homeowners Google before they call — if you're not showing up, those jobs are going to whoever is.

I build free professional websites for roofing contractors. No catch, no contract, no credit card. Takes about 10 minutes to get yours live.

Worth a quick look?`,
    },
    {
      subject: "built something for you",
      body: `Hey {first_name},

I put together a quick mockup of what a website for {business_name} could look like. Already has your business name and {city} on it.

Take a look: {preview_url}

This is completely free. No strings attached. I build these for roofers who are tired of losing jobs to competitors with better online presence.

Want me to send you the login so you can go live today?`,
    },
    {
      subject: "3 roofers in {city}",
      body: `Hey {first_name},

Three roofing contractors in {city} went live with their free RuufPro sites last month.

One of them got a $14,000 reroof job from a homeowner who found him through his new site — first week it was live.

I have yours stubbed out already. If you want to see it, just reply and I'll send you the link.`,
    },
    {
      subject: "quick question",
      body: `Hey {first_name},

I pulled up {business_name} on Google — solid reviews, {city} area. You've clearly done good work.

But you're invisible to anyone who searches online before calling. No site means no Google Maps ranking, no organic leads, nothing.

The free site I built for you is still sitting here. 10 minutes to go live.

Worth it?`,
    },
    {
      subject: "closing your file",
      body: `Hey {first_name},

I'm going to stop reaching out — I don't want to be a pest.

But the free website I built for {business_name} is still here if you ever want it. No pitch, no follow-up after this, no obligation.

Good luck out there this season.`,
    },
  ],

  bad_website: [
    {
      subject: "{business_name}",
      body: `Hey {first_name},

I found {business_name} online, but your site isn't doing you any favors. Looks like it was built a while ago — and on mobile it's pretty rough to navigate.

Homeowners judge a contractor by their website before they ever call. A weak site is quietly costing you jobs every week.

I build free professional roofing websites. Clean, fast, mobile-first. Yours would be ready in about 10 minutes.

Interested in seeing what it could look like?`,
    },
    {
      subject: "redesigned your site",
      body: `Hey {first_name},

I went ahead and mocked up a new version of your {business_name} site.

Here's the preview: {preview_url}

It's faster, looks clean on phones, and has a clear way for homeowners to request estimates. Much better than what you have now.

This is free. No cost, no contract, no catch.

Want to go live with it?`,
    },
    {
      subject: "before and after",
      body: `Hey {first_name},

A roofer in {city} switched from his old website to a RuufPro site last month. His form submissions went up 3x in the first two weeks.

The difference was simple: clean design, fast load, and a quote button right at the top.

Your current site could use the same upgrade. I already have a version ready — just reply if you want to see it.`,
    },
    {
      subject: "one thing I noticed",
      body: `Hey {first_name},

I checked {business_name}'s site on my phone. It took 6 seconds to load, and the contact info was buried at the bottom.

62% of homeowners search for contractors on their phone. If your site doesn't load fast and look good, they're gone in 3 seconds.

The free site I built loads in under 2 seconds and puts your phone number front and center.

Want to take a look?`,
    },
    {
      subject: "last note",
      body: `Hey {first_name},

I'll stop reaching out after this. Just wanted to make sure you knew the free website I built for {business_name} is still available.

No cost, no obligation, no follow-up. If the timing is ever right, just reply.

Good luck this season.`,
    },
  ],

  no_widget: [
    {
      subject: "{business_name} + online estimates",
      body: `Hey {first_name},

Google added an "Online Estimates" filter to search results in December. Homeowners can now filter for roofers who offer instant pricing — and {business_name} doesn't show up.

1 in 5 homeowners are already using it. That's leads going straight to your competitors.

I built an estimate widget that adds this to your existing website. $149/mo — compare that to Roofle at $350/mo.

Want to see a demo?`,
    },
    {
      subject: "your competitors have this",
      body: `Hey {first_name},

I checked the roofing contractors ranking in {city}. At least 2 of your competitors already have online estimate tools on their websites.

When a homeowner sees "Get Instant Estimate" on their site and nothing on yours, guess who gets the call.

Our widget installs in 5 minutes and costs less than half of what Roofle charges.

Worth 5 minutes to check it out?`,
    },
    {
      subject: "the math on missed leads",
      body: `Hey {first_name},

Average roofing job in {city}: $8,000-$15,000. If your website converted just 1 extra lead per month with an instant estimate tool, that's $96,000-$180,000/year.

The widget costs $149/mo. That's a 50x-100x return.

I have a demo ready with {business_name}'s info already loaded. Just reply and I'll send the link.`,
    },
    {
      subject: "quick update",
      body: `Hey {first_name},

Google expanded the Online Estimates filter to more markets this month. {city} is included.

If {business_name} doesn't show up when homeowners filter for online estimates, you're losing those leads to contractors who do.

The RuufPro estimate widget fixes this. $149/mo, installs in 5 minutes.

Still interested?`,
    },
    {
      subject: "last note about estimates",
      body: `Hey {first_name},

I'll stop reaching out. The estimate widget I set up for {business_name} is still here if you want it.

$149/mo. Installs on your existing site. No contract.

Good luck this season.`,
    },
  ],
};

export function getCampaignType(lead: {
  their_website_url?: string | null;
  website_status?: string | null;
  contact_form_url?: string | null;
}): CampaignType {
  if (!lead.their_website_url || lead.website_status === "none") return "no_website";
  if (lead.website_status === "free_builder" || lead.website_status === "directory_only") return "bad_website";
  return "no_widget";
}

export function generateEmailPreview(
  emailIndex: number,
  campaignType: CampaignType,
  vars: OutreachVars
): { subject: string; body: string } {
  const templates = SEQUENCES[campaignType];
  const template = templates[Math.min(emailIndex, templates.length - 1)];
  return {
    subject: fill(template.subject, vars),
    body: fill(template.body, vars),
  };
}

export function generateFormMessage(vars: OutreachVars): string {
  return `Hi ${vars.first_name},

I built ${vars.business_name} a free professional roofing website with your services and a quote calculator for your customers. Takes 30 seconds to look at.

Claim it here: ${vars.claim_url}

If not relevant, no worries at all.

— Hannah, RuufPro`;
}

export const EMAIL_SCHEDULE = ["Day 0", "Day 3", "Day 7", "Day 14", "Day 21"];
