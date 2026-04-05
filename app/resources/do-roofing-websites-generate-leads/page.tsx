import type { Metadata } from "next";

/* ─── AEO Page 5 ───
   Target question: "Do roofing websites actually generate leads?" (reframed as lead cost comparison)
   Cluster: A | Tone: Roofer Money | Schema: FAQPage
   Data: All stats verified 2026-04-05 */

const directAnswer =
  "Yes — and it's not even close on cost. Organic website leads cost $40–$450 per acquired customer. Angi leads cost $225–$1,400+ per customer. The difference is ownership: you rent leads from Angi and Thumbtack (shared with 3–8 other contractors), but you own leads from your own website (exclusive, higher close rates, compounds over time).";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Do roofing websites actually generate leads?", acceptedAnswer: { "@type": "Answer", text: directAnswer } },
    {
      "@type": "Question",
      name: "How much do roofing leads cost on Angi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Angi charges $15–$120 per lead depending on job type (repairs $15–$35, replacements $45–$85, storm damage $60–$120). But those leads are shared with 3–8 contractors. At a 5–25% close rate, the real cost per acquired customer is $225–$1,400+. The FTC ordered Angi's parent company (HomeAdvisor) to pay $7.2 million in 2023 for deceptive lead quality claims. The BBB has logged over 2,100 complaints against Angi in the last 3 years.",
      },
    },
    {
      "@type": "Question",
      name: "Are Google Local Services Ads worth it for roofers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google LSA leads cost $45–$150 each and are exclusive (not shared). Close rates run 15–50%, making the cost per customer $150–$600. LSA is the best paid lead option — but costs are rising about 20% per year ($50.46 average in 2023, $60.50 in 2024). What used to be a competitive edge is now table stakes as adoption hit 70% of contractors in 2026.",
      },
    },
    {
      "@type": "Question",
      name: "How do website leads compare to paid platform leads?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Website leads are exclusive (only you get them), close at 25–60%, and cost $40–$450 per acquired customer once established. Paid platform leads are shared (3–8 contractors), close at 5–25%, and cost $150–$1,400+ per customer. The key difference: platform lead costs go up every year, while website lead costs go down as your SEO compounds.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take for a roofing website to generate leads?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SEO typically shows initial results in 3–6 months, with significant improvement in 6–12 months. By month 12–18, organic leads cost $40–$80 per job. That's a slower start than paid platforms, but the cost-per-lead drops every month instead of rising. One contractor reported switching from Angi ($4,800/month, 3 jobs) to SEO — within a year, they were closing 3–5 jobs per week at $140 cost per acquisition.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Do Roofing Websites Actually Generate Leads? (Real Data)",
  description: directAnswer.slice(0, 155),
  alternates: { canonical: "https://ruufpro.com/resources/do-roofing-websites-generate-leads" },
};

const fonts = { heading: "var(--font-sora), system-ui, sans-serif", body: "var(--font-dm-sans), system-ui, sans-serif" };
const colors = { navy: "#0F1B2D", accent: "#E8722A", text: "#1A1A2E", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", bg: "#F8FAFC" };

export default function DoRoofingWebsitesGenerateLeads() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 64px" }}>

        <p style={{ fontFamily: fonts.heading, fontSize: "13px", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Roofing Leads</p>

        <h1 style={{ fontFamily: fonts.heading, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: colors.navy, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "24px" }}>
          Do roofing websites actually generate leads?
        </h1>

        <p style={{ fontFamily: fonts.body, fontSize: "17px", color: colors.text, lineHeight: 1.7, marginBottom: "32px" }}>
          Yes — and it&rsquo;s not even close on cost. Organic website leads cost $40–$450 per acquired customer. Angi leads cost $225–$1,400+ per customer. The difference is ownership: you <em>rent</em> leads from Angi and Thumbtack (shared with 3–8 other contractors), but you <em>own</em> leads from your own website (exclusive, higher close rates, compounds over time).
        </p>

        {/* The cost comparison table */}
        <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>
          Cost per lead vs cost per customer — the real math
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "20px" }}>All data verified April 2026 from multiple sources.</p>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "16px" }}>
          <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: "13px" }}>
            <thead>
              <tr style={{ background: colors.navy, color: "#fff" }}>
                {["Platform", "Cost/Lead", "Lead Type", "Close Rate", "Cost/Customer", "Trend"].map((h) => (
                  <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: "12px", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <LeadRow cells={["Your own website (SEO)", "$5–$15 at maturity", "Exclusive", "25–60%", "$40–$450", "↓ Drops over time"]} highlight />
              <LeadRow cells={["Google LSA", "$45–$150", "Exclusive", "15–50%", "$150–$600", "↑ +20%/year"]} />
              <LeadRow cells={["Facebook Ads (exclusive)", "$20–$65", "Exclusive", "25–40%", "$117–$260", "↑ Rising"]} />
              <LeadRow cells={["Angi / HomeAdvisor", "$15–$120", "Shared (3–8)", "5–25%", "$225–$1,400+", "↑ Rising"]} warn />
              <LeadRow cells={["Thumbtack", "$20–$60", "Shared (3–5)", "3–8%", "$600–$1,000+", "↑ Rising"]} warn />
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "40px", fontStyle: "italic" }}>
          Sources: GhostRep, BaaDigi, Kinetic Marketing, talk24.ai (citing 99 Calls data), HookAgency, IvyForms. All verified April 2026. &ldquo;Cost per customer&rdquo; = cost per lead ÷ close rate.
        </p>

        {/* Angi horror section */}
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: "#991B1B", marginBottom: "16px" }}>
            The Angi reality check
          </h2>
          <ul style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>FTC ordered HomeAdvisor/Angi to pay <strong>$7.2 million</strong> for deceptive lead quality claims{" "}<span style={{ color: colors.muted, fontSize: "13px" }}>(FTC.gov, finalized April 2023)</span></li>
            <li><strong>2,100+ BBB complaints</strong> in the last 3 years{" "}<span style={{ color: colors.muted, fontSize: "13px" }}>(BBB.org, as of March 2026)</span></li>
            <li>Each lead is shared with <strong>3–8 contractors</strong> — you&rsquo;re not buying a customer, you&rsquo;re buying a chance to compete</li>
            <li>35–50% of shared-lead sales go to <strong>whoever calls first</strong> — not the best contractor{" "}<span style={{ color: colors.muted, fontSize: "13px" }}>(InsideSales study, confirmed across multiple sources)</span></li>
            <li>Real contractor quote: &ldquo;Spent $4,800/month on Angi. Closed 3 jobs. Switched to SEO — now closing 3–5 jobs per week at $140 per acquisition.&rdquo;</li>
          </ul>
        </div>

        {/* Why websites win */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: "#166534", marginBottom: "16px" }}>
            Why your own website wins long-term
          </h2>
          <ul style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Exclusive leads.</strong> Only you get the call. No competing with 7 other roofers on the same homeowner.</li>
            <li><strong>Higher close rates.</strong> 25–60% vs 5–25% on shared platforms. The homeowner found YOU.</li>
            <li><strong>Compounds over time.</strong> SEO gets cheaper every month. Angi gets more expensive every year.</li>
            <li><strong>You own it.</strong> Leave Angi = lose all your reviews. Leave your website = take everything with you.</li>
            <li><strong>Speed advantage.</strong> 56% of homeowners want 24/7 scheduling. Your website works at 2am. Your Angi leads don&rsquo;t.</li>
          </ul>
        </div>

        {/* PAA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "40px" }}>
          <PAASection question="How much do roofing leads cost on Angi?" answer={<>$15–$120 per lead depending on job type. But at a 5–25% close rate on shared leads, your real cost per acquired customer is $225–$1,400+. The FTC fined Angi&rsquo;s parent company $7.2M for deceptive lead quality claims. The BBB has logged 2,100+ complaints in 3 years.</>} />
          <PAASection question="Are Google Local Services Ads worth it?" answer={<>LSA is the best paid option — exclusive leads at $45–$150 with 15–50% close rates. But costs are rising ~20% per year and adoption hit 70% of contractors in 2026. What used to be a competitive edge is now table stakes. Best used alongside your own website, not instead of it.</>} />
          <PAASection question="How do website leads compare to paid platforms?" answer={<>Website leads: exclusive, 25–60% close rate, $40–$450/customer, gets cheaper over time. Platform leads: shared, 5–25% close rate, $150–$1,400+/customer, gets more expensive every year. The math is clear — platforms should supplement your website, not replace it.{" "}<a href="/resources/roofing-website-cost" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>See what a website actually costs →</a></>} />
          <PAASection question="How long until a roofing website generates leads?" answer={<>SEO shows initial results in 3–6 months, significant improvement in 6–12 months. By month 12–18, organic leads cost $40–$80 per job. Slower start than paid platforms, but the cost drops every month instead of rising. One contractor went from 3 jobs/month on Angi to 3–5 jobs/week via organic — in under a year.{" "}<a href="/resources/free-roofing-website" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>Start with a free roofing website →</a></>} />
        </div>

        {/* Bottom Line */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>Bottom line</h2>
          <p style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, margin: 0 }}>
            Stop renting leads. Own them. A roofing website costs $0–$8,000 to set up and generates leads at $40–$450 per customer. Angi costs $225–$1,400+ per customer and you own nothing when you leave. Google LSA is the best paid supplement, but your own site is the foundation. The contractors in the strongest position are the ones building their own lead flow — their own website, their own SEO, their own reputation.
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

function LeadRow({ cells, highlight, warn }: { cells: string[]; highlight?: boolean; warn?: boolean }) {
  return (
    <tr>
      {cells.map((cell, i) => (
        <td key={i} style={{
          padding: "10px 10px", borderBottom: "1px solid #E2E8F0", fontSize: "13px", lineHeight: 1.4,
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
