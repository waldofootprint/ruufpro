"use client";

import { TEMPLATES } from "./template-registry";
import TemplateCard from "./components/TemplateCard";

export default function MissionControlPage() {
  const productionCount = TEMPLATES.filter((t) => t.status === "production").length;
  const totalFeatures = 6; // total competitive features we're tracking
  const avgFeatures = Math.round(
    TEMPLATES.filter((t) => t.status === "production").reduce(
      (sum, t) => sum + Object.values(t.features).filter(Boolean).length, 0
    ) / productionCount
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.03em",
          marginBottom: 8,
        }}>
          Mission Control
        </h1>
        <p style={{ fontSize: 15, color: "#888" }}>
          RuufPro ops board — template management, feature tracking, and more coming soon.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{productionCount}</div>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Production Templates</div>
        </div>
        <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{TEMPLATES.length}</div>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Total Templates</div>
        </div>
        <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{avgFeatures}/{totalFeatures}</div>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Avg Features</div>
        </div>
      </div>

      {/* Template Control Section */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Website Templates</h2>
          <span style={{ fontSize: 12, color: "#555" }}>Click "Preview" to open each template in a new tab</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </div>

      {/* Future sections stub */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "#555", marginBottom: 12 }}>
          More sections coming — Outreach, Revenue, Product Roadmap
        </p>
        <a
          href="/command-center"
          style={{
            fontSize: 13,
            color: "#6366f1",
            textDecoration: "none",
          }}
        >
          Open full Command Center →
        </a>
      </div>
    </div>
  );
}
