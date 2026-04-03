"use client";

const SECTIONS = [
  {
    title: "Mission Control",
    description: "Templates, progress log, sprint status, workflows",
    links: [
      { label: "Dashboard", href: "/mission-control", description: "Quick stats, progress log, templates, current sprint" },
      { label: "Workflows", href: "/mission-control?tab=workflows", description: "Automation workflows to build — acquire, convert, fulfill, retain" },
    ],
    accent: "#22c55e",
  },
  {
    title: "Command Center",
    description: "Strategy, plays, outreach, vault, research — the war room",
    links: [
      { label: "Overview", href: "/command-center?tab=overview", description: "Advisor notes, outreach pipeline, site queue, project status" },
      { label: "Onboarding", href: "/command-center?tab=onboarding", description: "Onboarding flow status and metrics" },
      { label: "Inbox", href: "/command-center?tab=inbox", description: "Drop ideas, links, notes — process later" },
      { label: "To-Do", href: "/command-center?tab=todos", description: "Task list with shortlist prioritization" },
      { label: "Plays", href: "/command-center?tab=plays", description: "Active and queued growth plays with step tracking" },
      { label: "Sites", href: "/command-center?tab=sites", description: "Kanban board for site edits — requested, in progress, review, done" },
      { label: "Outreach", href: "/command-center?tab=outreach", description: "Outreach pipeline — cold email, DMs, partnerships" },
      { label: "Vault", href: "/command-center?tab=vault", description: "Knowledge vault lessons — searchable insights from all processed content" },
      { label: "Project Status", href: "/command-center?tab=project", description: "Feature build status grid" },
      { label: "Research", href: "/command-center?tab=research", description: "Competitor analysis, copy research, pain points, GTM plan" },
      { label: "Positioning", href: "/command-center?tab=positioning", description: "Market positioning, MRR target, competitive framing" },
      { label: "Motivation", href: "/command-center?tab=motivation", description: "Wins board, milestones, advisor quotes" },
    ],
    accent: "#6366f1",
  },
  {
    title: "Product",
    description: "Live product pages and tools",
    links: [
      { label: "Marketing Site", href: "/", description: "The main ruufpro.com landing page (Ridgeline theme)" },
      { label: "Onboarding", href: "/onboarding", description: "Roofer onboarding — 3-screen flow with live preview" },
      { label: "Dashboard", href: "/dashboard", description: "Roofer dashboard — leads, site editor, settings, SMS" },
      { label: "Demo Templates", href: "/demo", description: "All template demos — blueprint, chalkboard, classic, forge, summit" },
      { label: "Widget Preview", href: "/widget-preview", description: "Estimate widget preview/testing page" },
    ],
    accent: "#D4863E",
  },
];

export default function HQPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.03em",
          marginBottom: 8,
        }}>
          HQ
        </h1>
        <p style={{ fontSize: 15, color: "#888" }}>
          Everything in one place. Click into any page.
        </p>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: section.accent }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>{section.title}</h2>
              <span style={{ fontSize: 12, color: "#555", marginLeft: 4 }}>{section.description}</span>
            </div>

            {/* Link grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {section.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "block",
                    background: "#141420",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${section.accent}40`;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: section.accent, marginBottom: 4 }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                    {link.description}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
