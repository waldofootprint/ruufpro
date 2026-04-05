import type { Metadata } from "next";

/* ─── AEO Page 2 ───
   Target question: "What's the best website builder for roofers?"
   Cluster: A (Money questions)
   Tone: Roofer Money (Tone A)
   Schema: Article (comparison piece) + FAQPage (PAA questions)
   Data: All stats verified 2026-04-05 — see Notion AEO Data Verification
   Word target: 500-800 words */

const directAnswer =
  "The best website builder for roofers depends on budget and how involved you want to be. Roofing-specific platforms consistently outperform generic builders because they include trust signals, service area pages, and local SEO structure that generic tools don't offer. An audit of 1,409 roofing sites found WordPress averages 44/100, Squarespace 31, Wix 27, and GoDaddy 24 — but the platform matters less than whether it's built for contractors.";

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Website Builders for Roofing Contractors (2026 Comparison)",
  description: directAnswer,
  author: { "@type": "Organization", name: "RuufPro" },
  publisher: { "@type": "Organization", name: "RuufPro" },
  datePublished: "2026-04-05",
  dateModified: "2026-04-05",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What's the best website builder for roofing contractors?",
      acceptedAnswer: { "@type": "Answer", text: directAnswer },
    },
    {
      "@type": "Question",
      name: "Is WordPress good for roofing websites?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WordPress dominates roofing — 62% of roofing sites run on it, and 86% of top-performing sites (scoring 80+) are WordPress. But the average WordPress roofing site still only scores 44/100. The platform enables high performance, it doesn't guarantee it. You need a roofing-specific theme, proper SEO setup, and regular maintenance — or a managed WordPress alternative.",
      },
    },
    {
      "@type": "Question",
      name: "Should roofers use Wix or Squarespace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both score poorly for roofing contractors. Wix roofing sites average 27/100 in performance audits, Squarespace averages 31/100. Neither includes roofing-specific features like service area pages, storm damage galleries, or estimate forms. Squarespace looks better out of the box but has limited SEO control. Wix is more flexible but loads slowly on mobile (5.9 seconds average vs Google's 3-second threshold).",
      },
    },
    {
      "@type": "Question",
      name: "How much should a roofer spend on a website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on the approach. DIY builders cost $120–$600/year. Freelancers charge $1,500–$4,000 upfront plus $75–$200/month maintenance. Roofing agencies run $3,000–$15,000/month. A roofing-specific platform with a free tier is the only $0 entry point. One additional roof replacement lead per month at $4K+ profit margin makes even a mid-range site immediately ROI-positive.",
      },
    },
    {
      "@type": "Question",
      name: "What features should a roofing website have?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "At minimum: click-to-call on every page, service area pages for local SEO, reviews displayed prominently (87% of homeowners won't hire below 4 stars), mobile-first design (70%+ of roofing searches are mobile), and pricing transparency (78% of homeowners are more likely to call if pricing is shown). Online estimate tools, storm damage galleries, and financing info are strong additions.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Best Website Builders for Roofing Contractors (2026)",
  description: directAnswer.slice(0, 155),
  alternates: {
    canonical: "https://ruufpro.com/resources/best-website-builder-roofers",
  },
};

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
};

export default function BestWebsiteBuilderRoofers() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <article style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 64px" }}>

        <p style={{ fontFamily: fonts.heading, fontSize: "13px", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
          Roofing Websites
        </p>

        <h1 style={{ fontFamily: fonts.heading, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: colors.navy, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "24px" }}>
          What&rsquo;s the best website builder for roofing contractors?
        </h1>

        {/* Direct Answer */}
        <p style={{ fontFamily: fonts.body, fontSize: "17px", color: colors.text, lineHeight: 1.7, marginBottom: "32px" }}>
          The best website builder for roofers depends on your budget and how involved you want to be. Roofing-specific platforms consistently outperform generic builders because they include trust signals, service area pages, and local SEO structure that generic tools don&rsquo;t offer. An audit of 1,409 roofing sites found WordPress averages 44/100, Squarespace 31, Wix 27, and GoDaddy 24 — but the platform matters less than whether it&rsquo;s built for contractors.
        </p>

        {/* Market data */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "16px" }}>
            What the data says
          </h2>
          <ul style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            <li>
              <strong>WordPress owns 62% of roofing websites</strong> and 86% of the top-performing sites (scoring 80+). But the average WP roofing site still only scores 44/100 — the platform enables quality, it doesn&rsquo;t guarantee it.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(roofingaudit.co, 1,409 sites, Feb 2026)</span>
            </li>
            <li>
              <strong>GoDaddy is the worst performer.</strong> Average score: 24/100. Zero GoDaddy sites made the top 3%. 68% had no storm gallery, no insurance content, no schema markup.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(roofingaudit.co)</span>
            </li>
            <li>
              <strong>The market is split in two:</strong> cheap DIY ($16–49/mo, poor results) and expensive agencies ($3,000–15,000/mo). Nobody dominates the middle — roofing-specific, affordable, and high-performing.
            </li>
            <li>
              <strong>80% of roofing business owners</strong> don&rsquo;t know how to appear in AI-driven search results. The builders that handle this for you have a structural advantage.{" "}
              <span style={{ color: colors.muted, fontSize: "13px" }}>(Scorpion 2026 State of Home Services Report)</span>
            </li>
          </ul>
        </div>

        {/* Comparison Table */}
        <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>
          The full comparison
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "20px" }}>
          All pricing verified April 2026. Annual billing where applicable.
        </p>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "16px" }}>
          <table style={{ width: "100%", minWidth: "780px", borderCollapse: "collapse", fontFamily: fonts.body, fontSize: "13px" }}>
            <thead>
              <tr style={{ background: colors.navy, color: "#fff" }}>
                {["Feature", "RuufPro", "WordPress", "Wix", "Squarespace", "GoDaddy", "Scorpion"].map((h) => (
                  <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      fontSize: "13px",
                      lineHeight: 1.4,
                      fontWeight: j === 0 ? 600 : 400,
                      color: cell.color || (j === 0 ? colors.text : colors.sub),
                      background: cell.bg || undefined,
                    }}>
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.sub, marginBottom: "40px", fontStyle: "italic" }}>
          WordPress can reach the highest scores — but only with proper setup, hosting, and maintenance. Scorpion delivers fully managed marketing but at $3,000+/mo with long contracts. Audit scores from roofingaudit.co (1,409 roofing sites, Feb 2026).
        </p>

        {/* PAA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "40px" }}>
          <PAASection
            question="Is WordPress good for roofing websites?"
            answer={<>WordPress dominates roofing — 62% market share and 86% of top performers. But the average WP roofing site still only scores 44/100. You need a roofing-specific theme, proper schema markup, fast hosting, and regular updates. If you&rsquo;re not going to maintain it (or pay someone to), a managed roofing platform will outperform a neglected WordPress site every time.</>}
          />
          <PAASection
            question="Should roofers use Wix or Squarespace?"
            answer={<>Both score poorly. Wix averages 27/100 for roofing sites, Squarespace 31/100. Neither has service area pages, storm damage galleries, or estimate forms. Squarespace looks cleaner out of the box but limits your SEO control. Wix is more flexible but loads in 5.9 seconds on mobile — double Google&rsquo;s 3-second abandonment threshold. For a basic credibility page they&rsquo;re fine. For a lead-generating machine, they fall short.</>}
          />
          <PAASection
            question="How much should a roofer spend on a website?"
            answer={<>That depends on your growth stage. A free roofing-specific platform gets you live today. DIY builders cost $120–$600/year. Mid-range freelancers run $1,500–$4,000 upfront. Agencies charge $3,000–$15,000/month. The math: one extra roof replacement lead per month at $4K+ profit margin makes even a $8,000 custom site ROI-positive within 3 months.{" "}<a href="/resources/roofing-website-cost" style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}>Full cost breakdown →</a></>}
          />
          <PAASection
            question="What features should a roofing website have?"
            answer={<>Click-to-call on every page. Service area pages for local SEO. Reviews displayed prominently — 87% of homeowners won&rsquo;t hire below 4 stars. Mobile-first design — over 70% of roofing searches are on phones. Pricing transparency — 78% are more likely to call if pricing is shown. Online estimates, storm galleries, and financing info are strong additions that separate lead machines from digital business cards.</>}
          />
        </div>

        {/* Bottom Line */}
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "16px", fontWeight: 700, color: colors.navy, marginBottom: "8px" }}>
            Bottom line
          </h2>
          <p style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.text, lineHeight: 1.7, margin: 0 }}>
            WordPress can reach the highest performance ceiling, but only if you invest in setup and maintenance. Generic builders are cheap and easy but consistently underperform for roofing. Roofing-specific platforms sit in the gap between DIY and agency — purpose-built, affordable, and pre-optimized for the searches homeowners make. RuufPro, Scorpion, and managed WordPress agencies all serve this market at different price points and involvement levels.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <a href="/signup" style={{ fontFamily: fonts.heading, fontSize: "15px", fontWeight: 700, color: "#fff", background: colors.accent, padding: "14px 32px", borderRadius: "99px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 16px rgba(232,114,12,0.25)" }}>
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

/* ─── Table Data ─── */
type Cell = { text: string; color?: string; bg?: string };

const G = (t: string): Cell => ({ text: t, color: "#059669", bg: "#F0FDF4" });
const R = (t: string): Cell => ({ text: t, color: "#DC2626" });
const B = (t: string): Cell => ({ text: t, color: "#2563EB" });
const D = (t: string): Cell => ({ text: t });

const tableData: Cell[][] = [
  [D("Monthly cost"), G("Free"), D("$3.95–$45/mo + hosting"), D("$17–$159/mo"), D("$16–$49/mo"), D("$9.99–$20.99/mo"), D("$3,000+/mo")],
  [D("Setup fee"), G("$0"), D("$0–$200 (themes/plugins)"), G("$0"), G("$0"), G("$0"), R("$1,000+")],
  [D("Year 1 total"), G("$0"), D("$250–$750+"), D("$204–$1,908"), D("$192–$588"), D("$120–$252"), R("$37,000+")],
  [D("Roofing-specific"), G("Yes"), D("With roofing theme"), R("No (generic)"), R("No (generic)"), R("No (generic)"), B("Yes")],
  [D("Avg audit score"), D("—"), D("44/100"), R("27/100"), D("31/100"), R("24/100"), D("—")],
  [D("Top 3% share"), D("—"), B("86%"), R("2%"), R("2%"), R("0%"), D("—")],
  [D("Market share (roofing)"), D("New"), B("62%"), D("11%"), D("9%"), D("4%"), D("—")],
  [D("Service area pages"), G("Yes"), B("With plugins"), R("No"), R("No"), R("No"), B("Yes")],
  [D("Online estimates"), D("Pro ($149/mo)"), D("With plugins"), R("No"), R("No"), R("No"), B("Yes")],
  [D("Mobile performance"), G("Optimized"), D("Varies (avg 4-8s)"), R("5.9s avg"), D("~4s avg"), D("Varies"), B("Optimized")],
  [D("Contract required"), G("None"), G("None"), G("None"), G("None"), G("None"), R("12–24 months")],
  [D("You own the site"), G("Yes"), G("Yes"), G("Yes"), G("Yes"), G("Yes"), R("Often no")],
  [D("Managed marketing"), D("No (self-serve)"), D("No"), D("No"), D("No"), D("No"), B("Yes (full-service)")],
];

/* ─── Subcomponents ─── */
function PAASection({ question, answer }: { question: string; answer: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-sora), system-ui, sans-serif", fontSize: "18px", fontWeight: 700, color: "#0F1B2D", marginBottom: "8px" }}>{question}</h2>
      <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "15px", color: "#1A1A2E", lineHeight: 1.7, margin: 0 }}>{answer}</p>
    </div>
  );
}
