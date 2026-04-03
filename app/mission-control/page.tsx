"use client";

import { useState } from "react";
import { TEMPLATES } from "./template-registry";
import { getTodayItems, getCompletedItems } from "./progress-log";
import { WORKFLOWS, PHASE_CONFIG, getPhaseStats, type WorkflowPhase } from "./workflow-registry";
import { FEATURES } from "../command-center/feature/features-data";
import TemplateCard from "./components/TemplateCard";
import ProgressCard from "./components/ProgressCard";
import WorkflowCard from "./components/WorkflowCard";

// ─── Derived data ───────────────────────────────────────────────
const todayItems = getTodayItems();
const completedItems = getCompletedItems();
const productionTemplates = TEMPLATES.filter((t) => t.status === "production");

const completedFeatures = FEATURES.filter((f) => f.status === "complete");
const inProgressFeatures = FEATURES.filter((f) => f.status === "in_progress");
const plannedFeatures = FEATURES.filter((f) => f.status === "planned");

// ─── Types ──────────────────────────────────────────────────────
type Tab = "today" | "build" | "grow" | "library";

const TABS: { id: Tab; label: string; accent: string }[] = [
  { id: "today", label: "Today", accent: "#22c55e" },
  { id: "build", label: "Build", accent: "#D4863E" },
  { id: "grow", label: "Grow", accent: "#6366f1" },
  { id: "library", label: "Library", accent: "#f59e0b" },
];

// ─── Reusable components ────────────────────────────────────────
function LinkCard({ label, description, href, accent }: { label: string; description: string; href: string; accent: string }) {
  return (
    <a href={href} style={{ display: "block", background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", textDecoration: "none", transition: "all 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}40`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: accent, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{description}</div>
    </a>
  );
}

function SectionHeader({ title, count, accent }: { title: string; count?: number; accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {accent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</h3>
      {count !== undefined && <span style={{ fontSize: 11, color: "#555" }}>({count})</span>}
    </div>
  );
}

function FeatureMini({ name, status, href }: { name: string; status: string; href: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    complete: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
    in_progress: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" },
    planned: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
  };
  const c = colors[status] || colors.planned;
  return (
    <a href={href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#141420", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, textDecoration: "none", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>{name}</span>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.text }}>{status.replace("_", " ")}</span>
    </a>
  );
}

function SprintItem({ title, status, tags }: { title: string; status: "shipped" | "next"; tags: string[] }) {
  const dot = status === "shipped" ? "#22c55e" : "#f59e0b";
  const tagBg = status === "shipped" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)";
  const tagColor = status === "shipped" ? "#4ade80" : "#fbbf24";
  return (
    <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{title}</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tags.map((tag) => (
          <span key={tag} style={{ fontSize: 10, background: tagBg, color: tagColor, padding: "2px 8px", borderRadius: 5 }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
export default function MissionControlPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [progressView, setProgressView] = useState<"today" | "completed">("today");

  // Workflow data
  const phaseStats = getPhaseStats();
  const totalWorkflows = WORKFLOWS.length;
  const completedWorkflows = WORKFLOWS.filter((w) => w.status === "complete").length;
  const phases: WorkflowPhase[] = ["acquire", "convert", "fulfill", "retain"];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Mission Control
        </h1>
        <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ── Quick stats row ────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { value: todayItems.length, label: "Shipped Today", color: "#22c55e" },
          { value: completedFeatures.length, label: "Features Live", color: "#D4863E" },
          { value: inProgressFeatures.length + plannedFeatures.length, label: "In Pipeline", color: "#6366f1" },
          { value: productionTemplates.length, label: "Templates", color: "#f59e0b" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 20px", flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 32 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, fontSize: 13, fontWeight: 600, padding: "10px 0", borderRadius: 8,
            border: "none", cursor: "pointer", transition: "all 0.15s",
            background: tab === t.id ? `${t.accent}20` : "transparent",
            color: tab === t.id ? t.accent : "#555",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* TODAY TAB                                                 */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "today" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Progress log */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionHeader title="Progress Log" accent="#22c55e" />
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: 2 }}>
                <button onClick={() => setProgressView("today")} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer", background: progressView === "today" ? "rgba(34,197,94,0.15)" : "transparent", color: progressView === "today" ? "#4ade80" : "#666" }}>
                  Today{todayItems.length > 0 && ` (${todayItems.length})`}
                </button>
                <button onClick={() => setProgressView("completed")} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer", background: progressView === "completed" ? "rgba(99,102,241,0.15)" : "transparent", color: progressView === "completed" ? "#a78bfa" : "#666" }}>
                  Completed{completedItems.length > 0 && ` (${completedItems.length})`}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {progressView === "today" && todayItems.length === 0 && (
                <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "28px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#555", margin: 0 }}>No changes logged today yet.</p>
                </div>
              )}
              {progressView === "today" && todayItems.map((item) => <ProgressCard key={item.id} item={item} />)}
              {progressView === "completed" && completedItems.length === 0 && (
                <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "28px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#555", margin: 0 }}>Items move here automatically after each day.</p>
                </div>
              )}
              {progressView === "completed" && completedItems.map((item) => <ProgressCard key={item.id} item={item} />)}
            </div>
          </div>

          {/* Current sprint */}
          <div>
            <SectionHeader title="Current Sprint" accent="#D4863E" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SprintItem title="Pricing — Free / $149 Pro / $299 Growth" status="shipped" tags={["3 tiers", "annual toggle", "competitor math", "all components"]} />
              <SprintItem title="Onboarding v3 — 3-Screen Flow" status="shipped" tags={["magic generation", "live preview", "scroll sync", "edit mode"]} />
              <SprintItem title="Auth flow — remove bypass, wire signup" status="next" tags={["auth", "critical path"]} />
              <SprintItem title="Stripe billing — subscription gating" status="next" tags={["payments", "revenue"]} />
              <SprintItem title="Template auto-defaults" status="next" tags={["reviews", "hours", "FAQ"]} />
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <SectionHeader title="Quick Actions" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              <LinkCard label="Drop something in Inbox" description="Ideas, links, screenshots" href="/command-center?tab=inbox" accent="#6366f1" />
              <LinkCard label="To-Do List" description="Priorities + shortlist" href="/command-center?tab=todos" accent="#6366f1" />
              <LinkCard label="Preview Onboarding" description="Test the live flow" href="/onboarding" accent="#D4863E" />
              <LinkCard label="View Marketing Site" description="ruufpro.com landing page" href="/" accent="#D4863E" />
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* BUILD TAB                                                 */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "build" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Feature inventory */}
          <div>
            <SectionHeader title="Features — Live" count={completedFeatures.length} accent="#22c55e" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {completedFeatures.map((f) => (
                <FeatureMini key={f.slug} name={f.name} status={f.status} href={`/command-center/feature/${f.slug}`} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Features — In Progress" count={inProgressFeatures.length} accent="#f59e0b" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {inProgressFeatures.map((f) => (
                <FeatureMini key={f.slug} name={f.name} status={f.status} href={`/command-center/feature/${f.slug}`} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Features — Planned" count={plannedFeatures.length} accent="#6366f1" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {plannedFeatures.map((f) => (
                <FeatureMini key={f.slug} name={f.name} status={f.status} href={`/command-center/feature/${f.slug}`} />
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <SectionHeader title="Templates" count={TEMPLATES.length} accent="#D4863E" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </div>

          {/* Workflows */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionHeader title="Automation Workflows" accent="#818cf8" />
              <span style={{ fontSize: 12, color: "#555" }}>{completedWorkflows}/{totalWorkflows} complete</span>
            </div>

            {/* Pipeline bar */}
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
              <div style={{
                height: "100%",
                width: `${totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0}%`,
                background: "linear-gradient(90deg, #818cf8, #34d399)",
                borderRadius: 3, transition: "width 0.5s",
              }} />
            </div>

            {/* Phase cards */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {phaseStats.map((ps) => {
                const cfg = PHASE_CONFIG[ps.phase];
                return (
                  <div key={ps.phase} style={{ flex: 1, minWidth: 160, background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px", borderTop: `3px solid ${cfg.color}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color, marginBottom: 4 }}>{cfg.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{ps.complete}<span style={{ fontSize: 12, color: "#555" }}>/{ps.total}</span></div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 4, lineHeight: 1.4 }}>{cfg.description}</div>
                  </div>
                );
              })}
            </div>

            {/* Workflow cards by phase */}
            {phases.map((phase) => {
              const cfg = PHASE_CONFIG[phase];
              const items = WORKFLOWS.filter((w) => w.phase === phase);
              return (
                <div key={phase} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 2, background: cfg.color }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{cfg.label}</h3>
                    <span style={{ fontSize: 11, color: "#555" }}>{items.filter((w) => w.status === "complete").length}/{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((w) => <WorkflowCard key={w.id} item={w} />)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Build tools */}
          <div>
            <SectionHeader title="Build Tools" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              <LinkCard label="Onboarding Preview" description="Live iframe of the onboarding flow" href="/command-center?tab=onboarding" accent="#D4863E" />
              <LinkCard label="Site Kanban" description="Track site edits and builds" href="/command-center?tab=sites" accent="#6366f1" />
              <LinkCard label="Demo Templates" description="All template demos" href="/demo" accent="#D4863E" />
              <LinkCard label="Widget Preview" description="Test the estimate widget" href="/widget-preview" accent="#D4863E" />
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* GROW TAB                                                  */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "grow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Strategy snapshot */}
          <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Revenue Strategy</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Free</div>
                <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>Your Website</div>
                <div style={{ fontSize: 11, color: "#888" }}>SEO site, the hook</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>$149/mo</div>
                <div style={{ fontSize: 13, color: "#D4863E", fontWeight: 600 }}>Your Leads</div>
                <div style={{ fontSize: 11, color: "#888" }}>Widget + SMS + reviews</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>$299/mo</div>
                <div style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>Your Growth</div>
                <div style={{ fontSize: 11, color: "#888" }}>City pages + monitoring</div>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, color: "#555" }}>
                $50K MRR = ~336 Pro or ~168 Growth or ~250 mixed. Vault 031: $149 bundle &gt; $99 per feature.
              </div>
            </div>
          </div>

          {/* Growth tools */}
          <div>
            <SectionHeader title="Growth Tools" accent="#6366f1" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Plays" description="Active and queued growth plays with step tracking" href="/command-center?tab=plays" accent="#6366f1" />
              <LinkCard label="Outreach Pipeline" description="Cold email, DMs, partnerships — track every touch" href="/command-center?tab=outreach" accent="#6366f1" />
              <LinkCard label="Positioning" description="Market positioning, Hormozi value equation, competitive framing" href="/command-center?tab=positioning" accent="#6366f1" />
              <LinkCard label="Overview / War Room" description="Advisor notes, approval queue, channel metrics" href="/command-center?tab=overview" accent="#6366f1" />
            </div>
          </div>

          {/* Product pages */}
          <div>
            <SectionHeader title="Live Product" accent="#D4863E" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Marketing Site" description="ruufpro.com — the Ridgeline landing page roofers see" href="/" accent="#D4863E" />
              <LinkCard label="Roofer Dashboard" description="What paying roofers use — leads, site editor, SMS, settings" href="/dashboard" accent="#D4863E" />
              <LinkCard label="Onboarding Flow" description="The 3-screen signup experience" href="/onboarding" accent="#D4863E" />
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* LIBRARY TAB                                               */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "library" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Vault */}
          <div>
            <SectionHeader title="Knowledge Vault" count={50} accent="#f59e0b" />
            <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: -6 }}>
              50+ lessons from mentorship vault — searchable by topic, speaker, relevance.
            </p>
            <a href="/command-center?tab=vault" style={{
              display: "block", background: "#141420", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12,
              padding: "20px 24px", textDecoration: "none", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f59e0b", marginBottom: 6 }}>Open Vault &rarr;</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                Pricing psychology, Hormozi frameworks, lead gen systems, conversion blueprints, competitive analysis, SEO playbooks, and more.
              </div>
            </a>
          </div>

          {/* Research */}
          <div>
            <SectionHeader title="Research & Strategy" accent="#6366f1" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Research Docs" description="GTM plan, competitor analysis, copy research, roofer pain points" href="/command-center?tab=research" accent="#6366f1" />
              <LinkCard label="Feature Deep-Dives" description="Every feature with business context, tech details, and build steps" href="/command-center?tab=project" accent="#6366f1" />
            </div>
          </div>

          {/* Wins */}
          <div>
            <SectionHeader title="Wins & Motivation" accent="#22c55e" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Wins Board" description="Log milestones, celebrate progress, advisor quotes" href="/command-center?tab=motivation" accent="#22c55e" />
              <LinkCard label="Completed Work" description={`${completedItems.length} items in the archive`} href="/mission-control" accent="#22c55e" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
