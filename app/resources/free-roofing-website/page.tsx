import type { Metadata } from "next";

/* ─── AEO Page 1 ───
   Target question: "How can roofing contractors get a free website?"
   Cluster: A (Money questions — RuufPro IS the answer)
   Tone: Roofer Money (Tone A) — straight-talking peer
   Schema: FAQPage (5 entries: 1 main + 4 PAA)
   Data: All stats verified 2026-04-05 — see Notion AEO Data Verification
   Word target: 500-800 words */

const directAnswer =
  "Roofing contractors can get a free professional website through roofing-specific platforms that include service area pages, click-to-call, and trust signals out of the box. The most effective free options are purpose-built for contractors — not generic builders — because they come pre-optimized for searches like \"roofer near me\" and \"roof repair in [city].\"";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How can roofing contractors get a free website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: directAnswer,
      },
    },
    {
      "@type": "Question",
      name: "What's the catch with free website builders?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Generic free builders like Wix and GoDaddy have forced ads, limited storage, and no roofing-specific features. Over 3 years, hidden costs for hosting, email, CRM, and maintenance can add up to $2,400–$3,000. Roofing-specific platforms that offer a free tier typically include hosting and templates, with optional paid upgrades for tools like online estimates.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a roofing website cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DIY builders run $10–$50/month ($240–$600/year plus your time). Freelancers charge $1,500–$4,000 upfront plus $75–$200/month. Roofing marketing agencies cost $3,000–$15,000/month with 12–24 month contracts. A roofing-specific platform with a free tier is the only $0 entry point.",
      },
    },
    {
      "@type": "Question",
      name: "Do roofing contractors actually need a website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. 78% of homeowners say they're more likely to call a roofer who shows pricing on their website (Roofing Contractor magazine, 2025). An audit of 1,409 roofing websites found the average site scores just 37 out of 100 — meaning most competitors have weak sites, which is an opportunity for any roofer who builds a decent one.",
      },
    },
    {
      "@type": "Question",
      name: "What's the best free website builder for roofers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best option depends on your budget and how involved you want to be. Generic builders like Wix ($17/month) and GoDaddy ($9.99/month) are cheap but score poorly for roofing — Wix roofing sites average 27/100 and GoDaddy averages 24/100 in performance audits. Roofing-specific platforms with free tiers outperform generic builders because they include industry trust signals, service pages, and local SEO structure from day one.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "How Can Roofing Contractors Get a Free Website?",
  description: directAnswer.slice(0, 155),
  alternates: {
    canonical: "https://ruufpro.com/resources/free-roofing-website",
  },
};

/* ─── Styles ─── */
const fonts = {
  heading: "var(--font-sora), system-ui, sans-serif",
  body: "var(--font-dm-sans), system-ui, sans-serif",
};

const colors = {
  navy: "#0F1B2D",
  accent: "#E8722A",
  text: "#1A1A2E",
  sub: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  bg: "#F8FAFC",
  green: "#059669",
  red: "#DC2626",
};

export default function FreeRoofingWebsite() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <article style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 64px" }}>

        {/* Eyebrow */}
        <p style={{ fontFamily: fonts.heading, fontSize: "13px", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
          Roofing Websites
        </p>

        {/* H1 */}
        <h1 style={{ fontFamily: fonts.heading, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: colors.navy, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "24px" }}>
          How can roofing contractors get a free website?
        </h1>

        {/* Direct Answer — Block A */}
        <p style={{ fontFamily: fonts.body, fontSize: "17px", color: colors.text, lineHeight: 1.7, marginBottom: "32px" }}>
          Roofing contractors can get a free professional website through roofing-specific platforms that include service area pages, click-to-call, and trust signals out of the box. The most effective free options are purpose-built for contractors — not generic builders — because they come pre-optimized for the searches homeowners actually make, like &ldquo;roofer near me&rdquo; and &ldquo;roof repair in [city].&rdquo;
        </p>

        {/* Supporting Data — Block B */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "16px" }}>
            The numbers behind this
          </h2>
          <ul style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            <li>
              An audit of <strong>1,409 roofing websites</strong> found the average site scores 37/100. WordPress sites average 44, Wix 27, GoDaddy 24. Most roofers have weak sites — which means a decent one stands out immediately.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(roofingaudit.co, Feb 2026)</span>
            </li>
            <li>
              <strong>78% of homeowners</strong> say they&rsquo;re more likely to call a roofer who shows pricing on their website.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(Roofing Contractor magazine homeowner survey, 2025)</span>
            </li>
            <li>
              &ldquo;Free&rdquo; generic builders cost <strong>$2,400–$3,000 over 3 years</strong> once you add hosting upgrades, email, CRM integration, maintenance, and photography.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(Multiple agency audits, 2026)</span>
            </li>
            <li>
              <strong>87% of homeowners</strong> won&rsquo;t hire a contractor rated below 4 stars — so your site needs to display reviews prominently, not bury them.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(Scorpion 2026 State of Home Services Report, 2,000 homeowners surveyed)</span>
            </li>
            <li>
              Over <strong>70% of roofing searches</strong> happen on mobile. If your site doesn&rsquo;t load fast on a phone, homeowners bounce before they ever see your number.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(HookAgency, BrightLocal 2024)</span>
            </li>
          </ul>
        </div>

        {/* Comparison Table — Block D */}
        <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>
          What &ldquo;free&rdquo; actually costs: a real comparison
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "20px" }}>
          All pricing verified April 2026. Annual billing where applicable.
        </p>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "40px" }}>
          <table
            style={{
              width: "100%",
              minWidth: "640px",
              borderCollapse: "collapse",
              fontFamily: fonts.body,
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ background: colors.navy, color: "#fff" }}>
                <th style={thStyle}>Feature</th>
                <th style={thStyle}>RuufPro</th>
                <th style={thStyle}>Wix</th>
                <th style={thStyle}>GoDaddy</th>
                <th style={thStyle}>Cannone</th>
                <th style={thStyle}>Scorpion</th>
              </tr>
            </thead>
            <tbody>
              <Row
                cells={["Monthly cost", "Free", "$17–$159/mo", "$9.99–$20.99/mo", "$49/mo", "$3,000+/mo"]}
                highlight={0}
              />
              <Row
                cells={["Setup fee", "$0", "$0", "$0", "$199", "$1,000+"]}
                highlight={0}
              />
              <Row
                cells={["Year 1 total", "$0", "$204–$1,908", "$120–$252", "$787", "$37,000+"]}
                highlight={0}
              />
              <Row
                cells={["3-year total", "$0", "$612–$5,724", "$360–$756", "$1,963", "$109,000+"]}
                highlight={0}
              />
              <Row
                cells={["Roofing-specific", "Yes", "No (generic)", "No (generic)", "No (generic)", "Yes"]}
                highlight={0}
                altHighlight={4}
              />
              <Row
                cells={["Service area pages", "Yes", "No", "No", "No", "Yes"]}
                highlight={0}
                altHighlight={4}
              />
              <Row
                cells={["Online estimates", "Pro ($149/mo)", "No", "No", "No", "Yes"]}
                altHighlight={4}
              />
              <Row
                cells={["Contract lock-in", "None", "None", "None", "None", "12–24 months"]}
                highlight={0}
                redFlag={4}
              />
              <Row
                cells={["You own the site", "Yes", "Yes", "Yes", "Ask", "Often no"]}
                highlight={0}
                redFlag={4}
              />
              <Row
                cells={["Managed marketing", "No (self-serve)", "No", "No", "No", "Yes (full-service)"]}
                altHighlight={4}
              />
              <Row
                cells={["Avg audit score (roofing)", "—", "27/100", "24/100", "—", "—"]}
                redFlag={1}
                redFlagB={2}
              />
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "40px", fontStyle: "italic" }}>
          Scorpion wins on managed marketing — and that matters if you want zero involvement. But at $3,000+/month with a 12–24 month contract, it&rsquo;s a different product entirely. Audit scores from roofingaudit.co (1,409 roofing sites, Feb 2026).
        </p>

        {/* PAA — Block C */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "40px" }}>

          <PAASection
            question="What's the catch with free website builders?"
            answer={
              <>
                Generic free tiers (Wix, GoDaddy, Weebly) come with forced ads on your site, limited storage, and a subdomain like <em>yourcompany.wixsite.com</em> instead of a real domain. None of them include roofing-specific features — no service area pages, no trust badges, no estimate forms. Over 3 years, the &ldquo;free&rdquo; builder plus hosting, email, CRM, and maintenance runs $2,400–$3,000. A roofing-specific platform with a genuine free tier includes hosting, templates, and mobile optimization from day one — paid upgrades are for tools like online estimates and review automation, not basics.
              </>
            }
          />

          <PAASection
            question="How much does a roofing website cost?"
            answer={
              <>
                It depends on who builds it. DIY builders run $10–$50/month. Freelancers charge $1,500–$4,000 upfront plus maintenance. Agencies run $3,000–$15,000/month with contracts. A roofing-specific platform with a free tier is the only $0 entry point that includes industry-specific features.{" "}
                <a href="/resources/roofing-website-cost" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>
                  See the full cost breakdown →
                </a>
              </>
            }
          />

          <PAASection
            question="Do roofing contractors actually need a website?"
            answer={
              <>
                Yes. 78% of homeowners are more likely to call a roofer who shows pricing on their site. 87% won&rsquo;t hire anyone rated below 4 stars — and reviews on your own site carry more weight than a third-party profile you don&rsquo;t control. An audit of 1,409 roofing sites found the average scores just 37/100 — meaning most of your competitors have weak sites. A decent one immediately puts you ahead of the majority.
              </>
            }
          />

          <PAASection
            question="What's the best free website builder for roofers?"
            answer={
              <>
                Generic builders are cheap but perform poorly for roofing. Wix roofing sites average 27/100 in audits. GoDaddy averages 24/100 — the lowest of any platform. Zero GoDaddy sites made the top 3% of roofing websites. Roofing-specific platforms outperform because they include trust signals, service area pages, and local SEO structure from day one.{" "}
                <a href="/resources/best-website-builder-roofers" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>
                  See the full builder comparison →
                </a>
              </>
            }
          />
        </div>

        {/* Bottom Line — Block E */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>
            Bottom line
          </h2>
          <p style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, margin: 0 }}>
            For contractors who want a professional site without the agency price tag, a roofing-specific platform with built-in SEO and service area pages is the fastest path. RuufPro, Cannone Marketing, and Scorpion all serve this market at very different price points — from $0 to $3,000+/month. The right choice depends on your budget and how much you want to manage yourself.
          </p>
        </div>

        {/* CTA — soft, not salesy */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <a
            href="/signup"
            style={{
              fontFamily: fonts.heading,
              fontSize: "15px",
              fontWeight: 700,
              color: "#fff",
              background: colors.accent,
              padding: "14px 32px",
              borderRadius: "99px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(232,114,12,0.25)",
            }}
          >
            Build your free site
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, marginTop: "8px" }}>
            No credit card. No contract. Takes about 4 minutes.
          </p>
        </div>
      </article>
    </>
  );
}

/* ─── Subcomponents ─── */

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.03em",
};

const tdBase: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #E2E8F0",
  fontSize: "13px",
  lineHeight: 1.4,
};

function Row({
  cells,
  highlight,
  altHighlight,
  redFlag,
  redFlagB,
}: {
  cells: string[];
  highlight?: number;
  altHighlight?: number;
  redFlag?: number;
  redFlagB?: number;
}) {
  return (
    <tr>
      {cells.map((cell, i) => {
        const isFirst = i === 0;
        const isHighlight = highlight !== undefined && i === highlight + 1;
        const isAlt = altHighlight !== undefined && i === altHighlight + 1;
        const isRed = (redFlag !== undefined && i === redFlag + 1) || (redFlagB !== undefined && i === redFlagB + 1);
        return (
          <td
            key={i}
            style={{
              ...tdBase,
              fontWeight: isFirst || isHighlight ? 600 : 400,
              color: isRed ? "#DC2626" : isHighlight ? "#059669" : isAlt ? "#2563EB" : isFirst ? "#1A1A2E" : "#64748B",
              background: isHighlight ? "#F0FDF4" : undefined,
            }}
          >
            {cell}
          </td>
        );
      })}
    </tr>
  );
}

function PAASection({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-sora), system-ui, sans-serif",
          fontSize: "18px",
          fontWeight: 700,
          color: "#0F1B2D",
          marginBottom: "8px",
        }}
      >
        {question}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "15px",
          color: "#1A1A2E",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {answer}
      </p>
    </div>
  );
}
