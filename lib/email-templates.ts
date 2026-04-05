// Email templates for onboarding + upsell sequences.
// Each function returns { subject, html } ready for Resend.
// Personalized with contractor data.
//
// Sources:
// - Vault 050: 8-step conversion blueprint (one CTA per email, kill resistance)
// - Vault 032: $32.5K missed call ROI math
// - Vault 025/031: Hormozi value equation (reduce risk perception)
// - Verified data: Scorpion 87% stars, RC 78% pricing, InsideSales 35-50% first responder

export interface EmailData {
  businessName: string;
  city: string;
  siteUrl: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

export interface UpsellData extends EmailData {
  siteVisits?: number;
  formFills?: number;
  callClicks?: number;
  reviewCount?: number;
  competitorReviewCount?: number;
}

function layout(content: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;">
  <div style="margin-bottom:24px;">
    <span style="font-size:18px;font-weight:700;color:#0F1B2D;letter-spacing:-0.02em;">RuufPro</span>
  </div>
  <div style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;padding:32px;margin-bottom:24px;">
    ${content}
  </div>
  <div style="text-align:center;font-size:12px;color:#94A3B8;line-height:1.6;">
    <p>RuufPro · Free roofing websites that make your phone ring</p>
    <p><a href="${unsubscribeUrl}" style="color:#94A3B8;text-decoration:underline;">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
}

function cta(text: string, url: string, color = "#E8722A"): string {
  return `<a href="${url}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;border-radius:99px;font-weight:700;font-size:14px;text-decoration:none;margin-top:16px;">${text}</a>`;
}

// ─── ONBOARDING SEQUENCE (7 emails) ───

export function onboarding1Welcome(d: EmailData) {
  return {
    subject: "Your site is live — here's what to do first",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">Your site is live! 🎉</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        ${d.businessName} now has a professional roofing website at
        <a href="${d.siteUrl}" style="color:#E8722A;font-weight:600;">${d.siteUrl.replace("https://", "")}</a>.
        Homeowners can find you, call you, and request estimates.
      </p>
      <p style="font-size:15px;font-weight:600;color:#0F1B2D;margin:0 0 8px;">3 quick wins (5 minutes total):</p>
      <ol style="font-size:14px;color:#374151;line-height:1.8;margin:0;padding-left:20px;">
        <li>Add a real photo from a recent job — real photos get 35% more calls than stock images</li>
        <li>Upload your logo in Settings</li>
        <li>Share your site link on Facebook — "Just launched our new website"</li>
      </ol>
      ${cta("Go to Your Dashboard", d.dashboardUrl)}
    `, d.unsubscribeUrl),
  };
}

export function onboarding2QuickWin(d: EmailData) {
  return {
    subject: "One thing that doubles your calls (takes 30 seconds)",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">The single biggest conversion lever</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Phone callers convert at <strong>37%</strong>. Form fills convert at <strong>3-5%</strong>.
        That's a 10x difference.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Your RuufPro site already has click-to-call on every page. But here's what most roofers miss:
        <strong>make sure your phone number is the real one you answer.</strong> Not the office line that goes to voicemail at 5pm.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        35-50% of roofing jobs go to whoever picks up the phone first. Not the cheapest. Not the best. The <em>first</em>.
      </p>
      ${cta("Check Your Phone Number", d.dashboardUrl + "/settings")}
    `, d.unsubscribeUrl),
  };
}

export function onboarding3SocialProof(d: EmailData) {
  return {
    subject: "87% of homeowners check this before calling you",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">Reviews decide who gets the call</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        87% of homeowners won't hire a contractor rated below 4 stars. Not 50%. Not "most." <strong>87%.</strong>
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Your site has a reviews section — but right now it's showing placeholder reviews.
        Add your real Google reviews or manually enter a few from happy customers.
        Even 3-5 real reviews make a huge difference.
      </p>
      <p style="font-size:14px;color:#64748B;line-height:1.6;margin:0 0 16px;">
        <em>Source: Scorpion 2026 State of Home Services Report — 2,000 homeowners surveyed</em>
      </p>
      ${cta("Add Your Reviews", d.dashboardUrl + "/my-site")}
    `, d.unsubscribeUrl),
  };
}

export function onboarding4ROIHook(d: EmailData) {
  return {
    subject: "You're losing $32,500/month right now",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">The math on missed calls</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Here's the math most roofers never do:
      </p>
      <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:0 0 16px;font-size:14px;color:#374151;line-height:1.8;">
        <strong>5 missed calls per week</strong> (industry average)<br>
        × <strong>$5,000</strong> average job value<br>
        × <strong>30%</strong> close rate when you DO talk to them<br>
        = <strong style="color:#DC2626;">$32,500/month</strong> walking out the door
      </div>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Your website is live and generating visibility. The next question is:
        are you catching every call it sends you?
      </p>
      <p style="font-size:14px;color:#64748B;line-height:1.6;margin:0;">
        <em>Coming soon on RuufPro Pro: Missed Call Text Back — your phone auto-texts homeowners within 3 seconds when you can't pick up. So you never lose a job to a faster competitor.</em>
      </p>
    `, d.unsubscribeUrl),
  };
}

export function onboarding5CaseStudy(d: EmailData) {
  return {
    subject: "How one roofer went from 3 leads/month to 3 per week",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">From renting leads to owning them</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        A roofing contractor in DFW was spending <strong>$4,800/month on Angi</strong>.
        He was closing 3 jobs per month. Cost per customer: <strong>$1,600</strong>.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        He stopped renting leads and invested in his own website + SEO instead.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Within a year, he was closing <strong>3-5 jobs per week</strong> at a cost of <strong>$140 per customer</strong>.
        That's 11x cheaper and 5x more volume.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        You already have the website. It's live at <a href="${d.siteUrl}" style="color:#E8722A;font-weight:600;">${d.siteUrl.replace("https://", "")}</a>.
        The question is: are you going to keep renting leads from Angi, or start owning them?
      </p>
    `, d.unsubscribeUrl),
  };
}

export function onboarding6CheckIn(d: EmailData) {
  return {
    subject: "How's your site doing? (be honest)",
    html: layout(`
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Hey — it's been about 10 days since ${d.businessName} went live.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Quick question: <strong>has anyone called or submitted a form from your site yet?</strong>
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        If yes — that's the start. Those leads came from YOUR site, not Angi. You own them forever.<br>
        If not yet — that's normal for a new site. Google takes a few weeks to index.
        Here's what speeds it up:
      </p>
      <ol style="font-size:14px;color:#374151;line-height:1.8;margin:0;padding-left:20px;">
        <li>Share your site on your Google Business Profile</li>
        <li>Post it on your Facebook business page</li>
        <li>Text the link to 5 past customers and ask them to leave a Google review</li>
      </ol>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:16px 0 0;">
        Just reply to this email if you need any help. I read every reply.
      </p>
    `, d.unsubscribeUrl),
  };
}

export function onboarding7Completeness(d: EmailData) {
  return {
    subject: `Your site scores — here's what's missing`,
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">How complete is your site?</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        An audit of 1,409 roofing websites found the average site scores just 37/100.
        Most roofers are leaving money on the table with incomplete sites.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Here's what the highest-converting roofing sites all have:
      </p>
      <ul style="font-size:14px;color:#374151;line-height:1.8;margin:0 0 16px;padding-left:20px;">
        <li>✅ Real project photos (not stock)</li>
        <li>✅ Google reviews displayed on site</li>
        <li>✅ Services listed individually</li>
        <li>✅ Service area cities with dedicated pages</li>
        <li>✅ About section with real founder photo</li>
        <li>✅ Click-to-call on every page</li>
      </ul>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Check your dashboard to see which ones you're missing.
        Every one you add = more calls.
      </p>
      ${cta("Complete Your Site", d.dashboardUrl + "/my-site")}
    `, d.unsubscribeUrl),
  };
}

// ─── UPSELL SEQUENCE (5 emails) ───

export function upsell1TheGap(d: UpsellData) {
  const visits = d.siteVisits || 0;
  const calls = d.callClicks || 0;
  return {
    subject: `You got ${visits} visitors last week. Here's how many called.`,
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">Your site is getting traffic</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Last week, <strong>${visits} people</strong> visited ${d.businessName}'s website.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Of those, <strong>${calls} clicked to call</strong>.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        That means <strong>${visits - calls} homeowners</strong> looked at your site and left without contacting you.
        Every one of them needed a roofer. They just weren't convinced yet.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        RuufPro Pro closes that gap with instant estimates, review automation, and missed call text back.
        The tools that turn "just looking" into "just called."
      </p>
      ${cta("See What Pro Includes", d.dashboardUrl)}
    `, d.unsubscribeUrl),
  };
}

export function upsell2MissedCalls(d: UpsellData) {
  return {
    subject: "A homeowner called at 8pm last night. You missed it.",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">The call you didn't answer</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        56% of homeowners want to reach a roofer after business hours.
        When they can't, <strong>35-50% of them call the next contractor who responds</strong>.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Missed Call Text Back fixes this. When you can't pick up, your phone automatically
        texts the homeowner within 3 seconds: <em>"Hey, thanks for calling ${d.businessName}!
        I'm on a job right now but I'll call you back within 30 minutes. Need anything urgent?"</em>
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        You stay first. They don't call your competitor. Available on RuufPro Pro.
      </p>
      ${cta("Upgrade to Pro — $149/mo", d.dashboardUrl)}
    `, d.unsubscribeUrl),
  };
}

export function upsell3Reviews(d: UpsellData) {
  const reviews = d.reviewCount || 0;
  return {
    subject: `Your competitor has 147 reviews. You have ${reviews}.`,
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">The review gap</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        87% of homeowners won't hire a contractor below 4 stars.
        But it's not just the rating — it's the <strong>count</strong>.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        The average top-performing roofer in ${d.city} has 100+ Google reviews.
        ${d.businessName} has <strong>${reviews}</strong>.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        RuufPro Pro includes automated review requests — after every job,
        your customer gets a one-tap text to leave a Google review.
        No awkward asking. No forgetting. Reviews stack up automatically.
      </p>
      ${cta("Start Collecting Reviews", d.dashboardUrl)}
    `, d.unsubscribeUrl),
  };
}

export function upsell4Pricing(d: UpsellData) {
  return {
    subject: "How much are you spending on Angi this month?",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">Own your leads vs rent them</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Here's what roofing leads actually cost per acquired customer:
      </p>
      <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:0 0 16px;font-size:14px;color:#374151;line-height:2;">
        <strong>Angi:</strong> $225–$1,400+ per customer (shared with 3-8 competitors)<br>
        <strong>Thumbtack:</strong> $600–$1,000+ per customer (shared with 3-5)<br>
        <strong>Google LSA:</strong> $150–$600 per customer (exclusive, but rising 20%/year)<br>
        <strong style="color:#059669;">Your own website:</strong> $40–$450 per customer (exclusive, gets cheaper over time)
      </div>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        RuufPro Pro costs <strong>$149/month</strong>. That's less than a single Angi lead.
        And every lead it generates is yours — exclusive, not shared with anyone.
      </p>
      ${cta("Upgrade for Less Than One Angi Lead", d.dashboardUrl)}
    `, d.unsubscribeUrl),
  };
}

export function upsell5LastNudge(d: UpsellData) {
  return {
    subject: "Your free site is working. Imagine what Pro does.",
    html: layout(`
      <h2 style="font-size:20px;font-weight:700;color:#0F1B2D;margin:0 0 12px;">You've already got the foundation</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        ${d.businessName} has a live website. Homeowners can find you on Google.
        That's more than most of your competitors have.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Here's what Pro adds on top:
      </p>
      <ul style="font-size:14px;color:#374151;line-height:1.8;margin:0 0 16px;padding-left:20px;">
        <li><strong>Pricing Calculator</strong> — 78% of homeowners want pricing on your site. Show it.</li>
        <li><strong>Missed Call Text Back</strong> — Never lose a job to a faster competitor.</li>
        <li><strong>Review Automation</strong> — One-tap review requests after every job.</li>
        <li><strong>Lead Dashboard</strong> — See every call, form, and estimate in one place.</li>
        <li><strong>City Pages</strong> — Rank in every city you serve, not just your home base.</li>
      </ul>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        $149/month. No contract. Cancel anytime. Takes 30 seconds to upgrade.
      </p>
      ${cta("Upgrade to Pro", d.dashboardUrl)}
    `, d.unsubscribeUrl),
  };
}

// ─── TEMPLATE REGISTRY ───

export const ONBOARDING_EMAILS = [
  { day: 0, fn: onboarding1Welcome },
  { day: 1, fn: onboarding2QuickWin },
  { day: 3, fn: onboarding3SocialProof },
  { day: 5, fn: onboarding4ROIHook },
  { day: 7, fn: onboarding5CaseStudy },
  { day: 10, fn: onboarding6CheckIn },
  { day: 14, fn: onboarding7Completeness },
] as const;

export const UPSELL_EMAILS = [
  { day: 14, fn: upsell1TheGap },
  { day: 17, fn: upsell2MissedCalls },
  { day: 21, fn: upsell3Reviews },
  { day: 25, fn: upsell4Pricing },
  { day: 28, fn: upsell5LastNudge },
] as const;
