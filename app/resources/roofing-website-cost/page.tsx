import type { Metadata } from "next";

/* ─── AEO Page 3 ───
   Target question: "How much does a roofing website cost?"
   Cluster: A | Tone: Roofer Money | Schema: FAQPage
   Data: All stats verified 2026-04-05 */

const directAnswer =
  "A roofing website costs anywhere from $0 to $15,000+ per month depending on who builds it. DIY builders run $10–$50/month. Freelancers charge $1,500–$4,000 upfront. Agencies charge $3,000–$15,000/month with 12–24 month contracts. The only $0 entry point is a roofing-specific platform with a free tier — which includes hosting, templates, and mobile optimization at no cost.";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does a roofing website cost?",
      acceptedAnswer: { "@type": "Answer", text: directAnswer },
    },
    {
      "@type": "Question",
      name: "What are the hidden costs of a roofing website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hidden costs include: hosting upgrades ($5–$200/month), professional email ($6–$12/month), CRM integration ($50–$100/month or $500–$2,500 one-time), photography ($300–$1,500), SEO ($500–$5,000/month), and content updates ($50–$500/month). Over 3 years, a \"free\" generic builder typically costs $2,400–$3,000 once these are factored in.",
      },
    },
    {
      "@type": "Question",
      name: "Is a roofing website worth the investment?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. One additional roof replacement lead per month at $4,000+ profit margin makes even a mid-range website ($3,000–$8,000) ROI-positive within 3–6 months. Organic website leads cost $40–$450 per acquired customer, compared to $225–$1,400+ per customer through Angi. The math favors owning your leads over renting them.",
      },
    },
    {
      "@type": "Question",
      name: "Should I build my own roofing website or hire someone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on your time and tech comfort. Contractors report that a \"weekend project\" on Wix or Squarespace typically turns into 3 weeks and 10–20 hours of work. At a $75/hour billing rate, that's $750–$1,500 in lost billable time. A roofing-specific platform gets you live in minutes with industry templates. A freelancer or agency makes sense if you want custom design and have $1,500+ to invest.",
      },
    },
    {
      "@type": "Question",
      name: "What's the cheapest way to get a professional roofing website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A roofing-specific platform with a free tier is the cheapest path to a professional site. Next cheapest: Cannone Marketing at $199 setup + $49/month ($787/year). DIY builders like Wix ($17/month) and GoDaddy ($9.99/month) are cheaper on paper but score poorly in roofing website audits — Wix averages 27/100 and GoDaddy averages 24/100.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "How Much Does a Roofing Website Cost? (2026 Pricing)",
  description: directAnswer.slice(0, 155),
  alternates: { canonical: "https://ruufpro.com/resources/roofing-website-cost" },
};

const fonts = { heading: "var(--font-sora), system-ui, sans-serif", body: "var(--font-dm-sans), system-ui, sans-serif" };
const colors = { navy: "#0F1B2D", accent: "#E8722A", text: "#1A1A2E", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", bg: "#F8FAFC" };

export default function RoofingWebsiteCost() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <article style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 64px" }}>

        <p style={{ fontFamily: fonts.heading, fontSize: "13px", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Roofing Websites</p>

        <h1 style={{ fontFamily: fonts.heading, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: colors.navy, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "24px" }}>
          How much does a roofing website cost?
        </h1>

        <p style={{ fontFamily: fonts.body, fontSize: "17px", color: colors.text, lineHeight: 1.7, marginBottom: "32px" }}>
          A roofing website costs anywhere from $0 to $15,000+ per month depending on who builds it. DIY builders run $10–$50/month. Freelancers charge $1,500–$4,000 upfront. Agencies charge $3,000–$15,000/month with 12–24 month contracts. The only $0 entry point is a roofing-specific platform with a free tier — which includes hosting, templates, and mobile optimization at no cost.
        </p>

        {/* Cost Tiers */}
        <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>
          The real cost by approach
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "20px" }}>
          All pricing verified April 2026.
        </p>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "16px" }}>
          <table style={{ width: "100%", minWidth: "640px", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: "13px" }}>
            <thead>
              <tr style={{ background: colors.navy, color: "#fff" }}>
                {["Approach", "Setup", "Monthly", "Year 1 Total", "3-Year Total"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CostRow cells={["Roofing platform (free tier)", "$0", "$0", "$0", "$0"]} highlight />
              <CostRow cells={["Cannone Marketing", "$199", "$49/mo", "$787", "$1,963"]} />
              <CostRow cells={["DIY builder (Wix/GoDaddy)", "$0–$50", "$10–$50/mo", "$120–$650", "$360–$1,950"]} />
              <CostRow cells={["DIY + hidden costs (3yr)", "—", "—", "—", "$2,400–$3,000"]} warn />
              <CostRow cells={["Freelancer", "$1,500–$4,000", "$75–$200/mo", "$2,400–$6,400", "$5,700–$11,200"]} />
              <CostRow cells={["Small agency", "$5,000–$12,000", "$300–$800/mo", "$8,600–$21,600", "$19,400–$43,200"]} />
              <CostRow cells={["Roofing agency (Hook, etc.)", "Included", "$3,000–$15,000/mo", "$36,000–$180,000", "$108,000–$540,000"]} warn />
              <CostRow cells={["Enterprise (Scorpion)", "$1,000+", "$3,000+/mo", "$37,000+", "$109,000+"]} warn />
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "40px", fontStyle: "italic" }}>
          &ldquo;Hidden costs&rdquo; row includes hosting upgrades, email, CRM integration, maintenance, photography, and basic SEO that generic builders don&rsquo;t include. Sources: qrolic.com, hookagency.com, cannonemarketing.com, multiple agency audits.
        </p>

        {/* Hidden Costs Breakdown */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "16px" }}>
            The hidden costs everyone misses
          </h2>
          <ul style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Hosting upgrades:</strong> $5–$200/month (shared → VPS as traffic grows)</li>
            <li><strong>Professional email:</strong> $6–$12/month per inbox (Google Workspace)</li>
            <li><strong>CRM integration:</strong> $500–$2,500 one-time or $50–$100/month</li>
            <li><strong>Photography:</strong> $300–$1,500 (real job site photos beat stock by 35%)</li>
            <li><strong>SEO:</strong> $500–$5,000/month (the single biggest ongoing cost)</li>
            <li><strong>Content updates:</strong> $50–$500/month or $500–$5,000/year</li>
            <li><strong>SSL certificate:</strong> Often included, but advanced security = $10–$50/month extra</li>
            <li><strong>Your time:</strong> Contractors report 10–20 hours building on Wix. At $75/hr = $750–$1,500 in lost billable time.</li>
          </ul>
        </div>

        {/* ROI */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "16px" }}>
            The ROI math
          </h2>
          <ul style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Average roof replacement profit margin: <strong>$4,000+</strong></li>
            <li>One extra lead/month from your website = site pays for itself in <strong>1–3 months</strong></li>
            <li>Organic website leads cost <strong>$40–$450/customer</strong> vs Angi at <strong>$225–$1,400+/customer</strong>{" "}<span style={{ color: colors.muted, fontSize: "13px" }}>(verified across GhostRep, BaaDigi, Kinetic Marketing)</span></li>
            <li>A $3,000–$8,000 professional site over 3 years = ~$80–$220/month — less than most contractors spend on Angi in a single month</li>
          </ul>
        </div>

        {/* PAA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "40px" }}>
          <PAASection question="What are the hidden costs of a roofing website?" answer={<>Hosting upgrades, email, CRM, photography, SEO, and content updates. Over 3 years, a &ldquo;free&rdquo; generic builder typically costs $2,400–$3,000 once these are factored in. Roofing-specific platforms bundle most of these — the gap is the add-ons like online estimates and review automation.</>} />
          <PAASection question="Is a roofing website worth the investment?" answer={<>Yes. One extra roof replacement lead per month pays for even a mid-range site within 3 months. Organic website leads cost $40–$450 per customer vs $225–$1,400+ through Angi. The contractors growing fastest own their lead flow instead of renting it.{" "}<a href="/resources/do-roofing-websites-generate-leads" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>See the full ROI breakdown →</a></>} />
          <PAASection question="Should I build my own or hire someone?" answer={<>Contractors report that a &ldquo;weekend project&rdquo; on Wix turns into 3 weeks and 10–20 hours. At $75/hr billing rate, that&rsquo;s $750–$1,500 in lost billable time. A roofing-specific platform gets you live in minutes. A freelancer ($1,500–$4,000) makes sense if you want custom design and have the budget.</>} />
          <PAASection question="What's the cheapest professional roofing website?" answer={<>A roofing-specific platform with a free tier. Next cheapest: Cannone Marketing at $199 setup + $49/month ($787/year). DIY builders are cheaper on paper but score poorly — Wix averages 27/100 and GoDaddy 24/100 in roofing audits.{" "}<a href="/resources/free-roofing-website" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>See free website options →</a></>} />
        </div>

        {/* Bottom Line */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>Bottom line</h2>
          <p style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, margin: 0 }}>
            Don&rsquo;t look at the sticker price — look at the 3-year total cost and the leads it generates. A $0 roofing-specific platform beats a $17/month Wix site that scores 27/100. A $8,000 agency site that generates 5 leads/month beats a $3,000/month retainer where you don&rsquo;t own anything. Match your investment to your growth stage, and always ask: &ldquo;Do I own this site if I leave?&rdquo;
          </p>
        </div>

        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <a href="/signup" style={{ fontFamily: fonts.heading, fontSize: "15px", fontWeight: 700, color: "#fff", background: colors.accent, padding: "14px 32px", borderRadius: "99px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 16px rgba(232,114,12,0.25)" }}>
            Build your free site
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, marginTop: "8px" }}>No credit card. No contract. Takes about 4 minutes.</p>
        </div>
      </article>
    </>
  );
}

function CostRow({ cells, highlight, warn }: { cells: string[]; highlight?: boolean; warn?: boolean }) {
  return (
    <tr>
      {cells.map((cell, i) => (
        <td key={i} style={{
          padding: "10px 12px", borderBottom: "1px solid #E2E8F0", fontSize: "13px", lineHeight: 1.4,
          fontWeight: i === 0 || highlight ? 600 : 400,
          color: warn ? "#DC2626" : highlight ? "#059669" : i === 0 ? "#1A1A2E" : "#64748B",
          background: highlight ? "#F0FDF4" : undefined,
        }}>{cell}</td>
      ))}
    </tr>
  );
}

function PAASection({ question, answer }: { question: string; answer: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "18px", fontWeight: 700, color: "#0F1B2D", marginBottom: "8px" }}>{question}</h2>
      <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "15px", color: "#1A1A2E", lineHeight: 1.7, margin: 0 }}>{answer}</p>
    </div>
  );
}
