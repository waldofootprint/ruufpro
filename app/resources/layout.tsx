import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | RuufPro Resources",
    default: "Resources for Roofing Contractors | RuufPro",
  },
  description:
    "Data-backed answers to the questions roofing contractors actually ask — websites, leads, marketing, and growing your business.",
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal nav for resource pages — clean, doesn't compete with content */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #E2E8F0",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "var(--font-sora), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#0F1B2D",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "28px",
              height: "28px",
              background: "#0F1B2D",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          RuufPro
        </a>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <a
            href="/resources"
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#64748B",
              textDecoration: "none",
            }}
          >
            All Resources
          </a>
          <a
            href="/#pricing"
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#64748B",
              textDecoration: "none",
            }}
          >
            Pricing
          </a>
          <a
            href="/signup"
            style={{
              fontFamily: "var(--font-sora), system-ui, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              background: "#E8722A",
              padding: "8px 20px",
              borderRadius: "99px",
              textDecoration: "none",
            }}
          >
            Get Started Free
          </a>
        </div>
      </nav>

      <main>{children}</main>

      {/* Minimal footer */}
      <footer
        style={{
          padding: "40px 24px",
          borderTop: "1px solid #E2E8F0",
          textAlign: "center",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "13px",
          color: "#94A3B8",
        }}
      >
        © {new Date().getFullYear()} RuufPro · Free roofing websites that
        make your phone ring
      </footer>
    </div>
  );
}
