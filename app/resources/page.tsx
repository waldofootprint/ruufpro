import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources for Roofing Contractors",
  description:
    "Data-backed answers to the questions roofing contractors actually ask about websites, leads, marketing, and growing your business.",
};

const CLUSTER_A = [
  {
    slug: "free-roofing-website",
    question: "How can roofing contractors get a free website?",
    status: "live",
  },
  {
    slug: "best-website-builder-roofers",
    question: "What's the best website builder for roofers?",
    status: "live",
  },
  {
    slug: "roofing-website-cost",
    question: "How much does a roofing website cost?",
    status: "live",
  },
  {
    slug: "roofle-alternatives",
    question: "What are the best alternatives to Roofle?",
    status: "live",
  },
  {
    slug: "do-roofing-websites-generate-leads",
    question: "Do roofing websites actually generate leads?",
    status: "live",
  },
] as { slug: string; question: string; status: "live" | "coming-soon" }[];

export default function ResourcesIndex() {
  return (
    <article
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "48px 24px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sora), system-ui, sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          color: "#E8722A",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "12px",
        }}
      >
        Resources
      </p>
      <h1
        style={{
          fontFamily: "var(--font-sora), system-ui, sans-serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 800,
          color: "#0F1B2D",
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          marginBottom: "16px",
        }}
      >
        Straight answers for roofing contractors.
      </h1>
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "17px",
          color: "#64748B",
          lineHeight: 1.6,
          marginBottom: "48px",
        }}
      >
        No fluff, no sales pitch. Data-backed answers to the questions roofers
        actually ask — with real pricing, real comparisons, and real numbers.
      </p>

      <h2
        style={{
          fontFamily: "var(--font-sora), system-ui, sans-serif",
          fontSize: "20px",
          fontWeight: 700,
          color: "#0F1B2D",
          marginBottom: "20px",
        }}
      >
        Websites &amp; Online Presence
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {CLUSTER_A.map((item) => (
          <a
            key={item.slug}
            href={
              item.status === "coming-soon"
                ? undefined
                : `/resources/${item.slug}`
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              textDecoration: "none",
              background: item.status === "coming-soon" ? "#FAFAFA" : "#fff",
              opacity: item.status === "coming-soon" ? 0.6 : 1,
              cursor:
                item.status === "coming-soon" ? "default" : "pointer",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "15px",
                fontWeight: 500,
                color: "#1A1A2E",
              }}
            >
              {item.question}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: item.status === "coming-soon" ? "#94A3B8" : "#059669",
                background:
                  item.status === "coming-soon" ? "#F1F5F9" : "#ECFDF5",
                padding: "4px 10px",
                borderRadius: "99px",
                whiteSpace: "nowrap",
              }}
            >
              {item.status === "coming-soon" ? "Coming soon" : "Read →"}
            </span>
          </a>
        ))}
      </div>
    </article>
  );
}
