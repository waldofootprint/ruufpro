"use client";

import { useState } from "react";
import { TEMPLATES } from "./template-registry";
import { getTodayItems, getCompletedItems } from "./progress-log";
import { WORKFLOWS, PHASE_CONFIG, getPhaseStats, type WorkflowPhase } from "./workflow-registry";
import TemplateCard from "./components/TemplateCard";
import ProgressCard from "./components/ProgressCard";
import WorkflowCard from "./components/WorkflowCard";

type TopTab = "dashboard" | "workflows";

export default function MissionControlPage() {
  const [topTab, setTopTab] = useState<TopTab>("dashboard");
  const productionCount = TEMPLATES.filter((t) => t.status === "production").length;
  const totalFeatures = 6;
  const avgFeatures = Math.round(
    TEMPLATES.filter((t) => t.status === "production").reduce(
      (sum, t) => sum + Object.values(t.features).filter(Boolean).length, 0
    ) / productionCount
  );

  const todayItems = getTodayItems();
  const completedItems = getCompletedItems();
  const [progressTab, setProgressTab] = useState<"today" | "completed">("today");

  const phaseStats = getPhaseStats();
  const totalWorkflows = WORKFLOWS.length;
  const completedWorkflows = WORKFLOWS.filter((w) => w.status === "complete").length;
  const phases: WorkflowPhase[] = ["acquire", "convert", "fulfill", "retain"];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <a href="/hq" style={{ fontSize: 12, color: "#555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>&larr;</span> HQ
        </a>
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
          RuufPro ops board — template management, feature tracking, and progress log.
        </p>
      </div>

      {/* Top-level tab switcher */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 32 }}>
        <button
          onClick={() => setTopTab("dashboard")}
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s",
            background: topTab === "dashboard" ? "rgba(255,255,255,0.1)" : "transparent",
            color: topTab === "dashboard" ? "#fff" : "#666",
            flex: 1,
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTopTab("workflows")}
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s",
            background: topTab === "workflows" ? "rgba(129,140,248,0.15)" : "transparent",
            color: topTab === "workflows" ? "#a78bfa" : "#666",
            flex: 1,
          }}
        >
          Workflows to Build{completedWorkflows < totalWorkflows && ` (${completedWorkflows}/${totalWorkflows})`}
        </button>
      </div>

      {/* ============================================================ */}
      {/* DASHBOARD TAB */}
      {/* ============================================================ */}
      {topTab === "dashboard" && (
        <>
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
            <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{todayItems.length}</div>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Changes Today</div>
            </div>
          </div>

          {/* Progress Log — Tabbed */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Progress Log</h2>
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
                <button
                  onClick={() => setProgressTab("today")}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: progressTab === "today" ? "rgba(34,197,94,0.15)" : "transparent",
                    color: progressTab === "today" ? "#4ade80" : "#666",
                  }}
                >
                  Today&apos;s Progress{todayItems.length > 0 && ` (${todayItems.length})`}
                </button>
                <button
                  onClick={() => setProgressTab("completed")}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: progressTab === "completed" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: progressTab === "completed" ? "#a78bfa" : "#666",
                  }}
                >
                  Completed{completedItems.length > 0 && ` (${completedItems.length})`}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {progressTab === "today" && todayItems.length === 0 && (
                <div style={{
                  background: "#141420",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "32px 24px",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, color: "#555", margin: 0 }}>No changes logged today yet. Start building!</p>
                </div>
              )}
              {progressTab === "today" && todayItems.map((item) => (
                <ProgressCard key={item.id} item={item} />
              ))}
              {progressTab === "completed" && completedItems.length === 0 && (
                <div style={{
                  background: "#141420",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "32px 24px",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, color: "#555", margin: 0 }}>No completed items yet. They&apos;ll show up here after each day.</p>
                </div>
              )}
              {progressTab === "completed" && completedItems.map((item) => (
                <ProgressCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Template Control Section */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Website Templates</h2>
              <span style={{ fontSize: 12, color: "#555" }}>Click &quot;Preview&quot; to open each template in a new tab</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </div>

          {/* Current Sprint — Updated Apr 3, 2026 */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 20 }}>Current Sprint</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Pricing Update */}
              <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Pricing Update — Free / $149 Pro / $299 Growth — Shipped</span>
                </div>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: 0 }}>
                  3-tier pricing across all components. Outcome-focused copy (&quot;Your Website&quot;, &quot;Your Leads&quot;, &quot;Your Growth&quot;).
                  Annual toggle at 20% discount. Competitor math recalculated. Zero $99 references remain in components.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>3 tiers</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Annual toggle</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Competitor math</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>FAQ + hero + meta</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Docs updated</span>
                </div>
              </div>

              {/* Onboarding v3 */}
              <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Onboarding v3 — Shipped</span>
                </div>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: 0 }}>
                  3-screen flow: simple form (4 fields) → magic generation with smart defaults → full edit mode with live preview.
                  Template picker, hero editor, services chips, trust signal toggles, about textarea, city tag input.
                  Live preview renders the real template at 0.32 scale with scroll sync via IntersectionObserver.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Magic generation</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Full edit mode</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Live preview</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Scroll sync</span>
                  <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "3px 10px", borderRadius: 6 }}>Service auto-creation</span>
                  <span style={{ fontSize: 11, background: "rgba(245,158,11,0.12)", color: "#fbbf24", padding: "3px 10px", borderRadius: 6 }}>Auth bypass (dev only)</span>
                </div>
              </div>

              {/* Next up */}
              <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Up Next</span>
                </div>
                <ul style={{ fontSize: 13, color: "#888", lineHeight: 1.8, margin: 0, paddingLeft: 16 }}>
                  <li>Wire up auth flow — remove preview-mode bypass, connect real signup/login</li>
                  <li>Stripe billing integration — subscription gating for Pro/Growth features</li>
                  <li>Smarter template auto-defaults (reviews placeholder, business hours, logo initials, FAQ from services)</li>
                  <li>ScrollAnimation optimization for Modern Clean (151 frames — loads slow)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Command Center link */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "32px 24px",
            textAlign: "center",
          }}>
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
        </>
      )}

      {/* ============================================================ */}
      {/* WORKFLOWS TO BUILD TAB */}
      {/* ============================================================ */}
      {topTab === "workflows" && (
        <>
          {/* Pipeline progress bar */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Autonomous Pipeline</span>
              <span style={{ fontSize: 13, color: "#888" }}>{completedWorkflows}/{totalWorkflows} workflows complete</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0}%`,
                background: "linear-gradient(90deg, #818cf8, #34d399)",
                borderRadius: 3,
                transition: "width 0.5s",
              }} />
            </div>
          </div>

          {/* Phase summary cards */}
          <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
            {phaseStats.map((ps) => {
              const cfg = PHASE_CONFIG[ps.phase];
              return (
                <div
                  key={ps.phase}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    background: "#141420",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    borderTop: `3px solid ${cfg.color}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color, marginBottom: 4 }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                    {ps.complete}<span style={{ fontSize: 14, color: "#555" }}>/{ps.total}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#555" }}>
                    {ps.inProgress > 0 && <span style={{ color: "#fbbf24" }}>{ps.inProgress} in progress</span>}
                    {ps.inProgress > 0 && ps.notStarted > 0 && " · "}
                    {ps.notStarted > 0 && `${ps.notStarted} to build`}
                  </div>
                  <p style={{ fontSize: 11, color: "#444", marginTop: 6, lineHeight: 1.4, margin: "6px 0 0" }}>{cfg.description}</p>
                </div>
              );
            })}
          </div>

          {/* Workflow cards grouped by phase */}
          {phases.map((phase) => {
            const cfg = PHASE_CONFIG[phase];
            const items = WORKFLOWS.filter((w) => w.phase === phase);
            return (
              <div key={phase} style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: cfg.color }} />
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>{cfg.label}</h2>
                  <span style={{ fontSize: 12, color: "#555" }}>
                    {items.filter((w) => w.status === "complete").length}/{items.length} complete
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {items.map((w) => (
                    <WorkflowCard key={w.id} item={w} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Command Center link */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "32px 24px",
            textAlign: "center",
          }}>
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
        </>
      )}
    </div>
  );
}
