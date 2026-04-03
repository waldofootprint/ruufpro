"use client";

import { useState, useEffect, useCallback } from "react";
import { TEMPLATES } from "./template-registry";
import { WORKFLOWS, PHASE_CONFIG, getPhaseStats, mergeWithDbState, type WorkflowPhase, type DbWorkflowStatus, type DbStepStatus, type MergedWorkflow } from "./workflow-registry";
import { FEATURES } from "../command-center/feature/features-data";
import { getFeaturedEntries, getVaultStats } from "./vault-registry";
import TemplateCard from "./components/TemplateCard";
import WorkflowCard from "./components/WorkflowCard";
import MyQueue from "./components/MyQueue";
import BusinessPulse from "./components/BusinessPulse";
import SprintBoard from "./components/SprintBoard";
import ShortlistWidget from "./components/ShortlistWidget";
import ActivityFeed from "./components/ActivityFeed";
import CollapsibleSection from "./components/CollapsibleSection";

// ─── Derived data ───────────────────────────────────────────────
const productionTemplates = TEMPLATES.filter((t) => t.status === "production");
const completedFeatures = FEATURES.filter((f) => f.status === "complete");
const inProgressFeatures = FEATURES.filter((f) => f.status === "in_progress");
const plannedFeatures = FEATURES.filter((f) => f.status === "planned");

// ─── Types ──────────────────────────────────────────────────────
type Tab = "now" | "build" | "learn" | "grow";

const TABS: { id: Tab; label: string; accent: string }[] = [
  { id: "now", label: "Now", accent: "#22c55e" },
  { id: "build", label: "Build", accent: "#D4863E" },
  { id: "learn", label: "Learn", accent: "#f59e0b" },
  { id: "grow", label: "Grow", accent: "#6366f1" },
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
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>{title}</h3>
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

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
export default function MissionControlPage() {
  // Persist tab in localStorage
  const [tab, setTab] = useState<Tab>("now");

  useEffect(() => {
    const stored = localStorage.getItem("mc-tab");
    if (stored && ["now", "build", "learn", "grow"].includes(stored)) {
      setTab(stored as Tab);
    }
  }, []);

  function switchTab(t: Tab) {
    setTab(t);
    localStorage.setItem("mc-tab", t);
  }

  // Workflow DB state
  const [dbWorkflows, setDbWorkflows] = useState<DbWorkflowStatus[]>([]);
  const [dbSteps, setDbSteps] = useState<DbStepStatus[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/command-center/workflows");
      if (res.ok) {
        const data = await res.json();
        setDbWorkflows(data.workflows || []);
        setDbSteps(data.steps || []);
      }
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setWorkflowsLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  // Merge static registry with live DB state
  const mergedWorkflows: MergedWorkflow[] = mergeWithDbState(dbWorkflows, dbSteps);
  const phaseStats = getPhaseStats(mergedWorkflows);
  const totalWorkflows = mergedWorkflows.length;
  const completedWorkflows = mergedWorkflows.filter((w) => w.dbStatus === "complete").length;
  const phases: WorkflowPhase[] = ["acquire", "convert", "fulfill", "retain"];

  // Workflow action handlers
  async function handleWorkflowAction(stepId: string, action: string, reviewNotes?: string) {
    await fetch("/api/command-center/workflows", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, action, reviewNotes }),
    });
    fetchWorkflows();
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6, fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>
          Mission Control
        </h1>
        <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 32 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
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
      {/* NOW TAB                                                    */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "now" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Business Pulse — always visible */}
          <div>
            <SectionHeader title="Business Pulse" accent="#22c55e" />
            <BusinessPulse />
          </div>

          {/* Attention Queue — always visible when items exist */}
          <div>
            <SectionHeader title="Attention Queue" accent="#ef4444" />
            {!workflowsLoading && (
              <MyQueue
                workflows={mergedWorkflows}
                onApprove={(stepId, notes) => handleWorkflowAction(stepId, "approve", notes)}
                onSendBack={(stepId, notes) => handleWorkflowAction(stepId, "send_back", notes)}
                onApproveToStart={(stepId, notes) => handleWorkflowAction(stepId, "approve_to_build", notes)}
                onSkip={(stepId) => handleWorkflowAction(stepId, "skip")}
              />
            )}
            {workflowsLoading && (
              <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#555", margin: 0 }}>Loading workflows...</p>
              </div>
            )}
          </div>

          {/* Active Sprint */}
          <div>
            <SectionHeader title="Active Sprint" accent="#D4863E" />
            <SprintBoard />
          </div>

          {/* Shortlist */}
          <CollapsibleSection id="shortlist" title="Shortlist" accent="#6366f1" defaultOpen={true}>
            <ShortlistWidget />
          </CollapsibleSection>

          {/* Inbox */}
          <CollapsibleSection id="inbox" title="Inbox" accent="#f59e0b" defaultOpen={false}>
            <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#888" }}>Quick capture — drop ideas, links, screenshots</span>
                <a href="/command-center?tab=inbox" style={{ fontSize: 12, color: "#f59e0b", textDecoration: "none" }}>Open Full Inbox &rarr;</a>
              </div>
            </div>
          </CollapsibleSection>

          {/* Activity Feed */}
          <CollapsibleSection id="activity" title="Activity Feed" accent="#22c55e" defaultOpen={true}>
            <ActivityFeed />
          </CollapsibleSection>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* BUILD TAB                                                  */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "build" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Workflow Pipeline */}
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
            {workflowsLoading ? (
              <div style={{ textAlign: "center", padding: 32 }}>
                <p style={{ fontSize: 13, color: "#555" }}>Loading workflows...</p>
              </div>
            ) : phases.map((phase) => {
              const cfg = PHASE_CONFIG[phase];
              const items = mergedWorkflows.filter((w) => w.phase === phase);
              return (
                <div key={phase} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 2, background: cfg.color }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>{cfg.label}</h3>
                    <span style={{ fontSize: 11, color: "#555" }}>{items.filter((w) => w.dbStatus === "complete").length}/{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((w) => (
                      <WorkflowCard
                        key={w.id}
                        item={w}
                        allWorkflows={mergedWorkflows}
                        onApproveToStart={(stepId) => handleWorkflowAction(stepId, "approve_to_build")}
                        onApprove={(stepId) => handleWorkflowAction(stepId, "approve")}
                        onSendBack={(stepId, notes) => handleWorkflowAction(stepId, "send_back", notes)}
                        onSkip={(stepId) => handleWorkflowAction(stepId, "skip")}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features */}
          <CollapsibleSection id="features-live" title="Features — Live" count={completedFeatures.length} accent="#22c55e" defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {completedFeatures.map((f) => (
                <FeatureMini key={f.slug} name={f.name} status={f.status} href={`/command-center/feature/${f.slug}`} />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="features-progress" title="Features — In Progress" count={inProgressFeatures.length} accent="#f59e0b" defaultOpen={true}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {inProgressFeatures.map((f) => (
                <FeatureMini key={f.slug} name={f.name} status={f.status} href={`/command-center/feature/${f.slug}`} />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="features-planned" title="Features — Planned" count={plannedFeatures.length} accent="#6366f1" defaultOpen={true}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {plannedFeatures.map((f) => (
                <FeatureMini key={f.slug} name={f.name} status={f.status} href={`/command-center/feature/${f.slug}`} />
              ))}
            </div>
          </CollapsibleSection>

          {/* Templates */}
          <CollapsibleSection id="templates" title="Templates" count={TEMPLATES.length} accent="#D4863E" defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </CollapsibleSection>

          {/* Build Tools */}
          <CollapsibleSection id="build-tools" title="Build Tools" defaultOpen={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              <LinkCard label="Onboarding Preview" description="Live iframe of the onboarding flow" href="/onboarding" accent="#D4863E" />
              <LinkCard label="Site Kanban" description="Track site edits and builds" href="/command-center?tab=sites" accent="#6366f1" />
              <LinkCard label="Demo Templates" description="All template demos" href="/demo" accent="#D4863E" />
              <LinkCard label="Widget Preview" description="Test the estimate widget" href="/widget-preview" accent="#D4863E" />
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* LEARN TAB                                                  */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "learn" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Knowledge Vault — hero */}
          <div>
            <SectionHeader title="Knowledge Vault" count={getVaultStats().total} accent="#f59e0b" />
            <a href="/command-center?tab=vault" style={{
              display: "block", background: "#141420", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12,
              padding: "20px 24px", textDecoration: "none", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f59e0b", marginBottom: 6, fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>Open Vault &rarr;</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                {getVaultStats().total} lessons from Skool mentorship — pricing psychology, Hormozi frameworks, lead gen systems, conversion blueprints, cold email, SEO playbooks.
              </div>
            </a>
          </div>

          {/* Key Frameworks — driven by vault-registry.ts */}
          <div>
            <SectionHeader title="Key Frameworks" count={getFeaturedEntries().length} accent="#f59e0b" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {getFeaturedEntries().map((fw) => (
                <a
                  key={fw.id}
                  href={`/command-center/vault/${fw.id}`}
                  style={{
                    display: "block", background: "#141420", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
                    padding: "14px 18px", textDecoration: "none", transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 6px", borderRadius: 4 }}>
                      {fw.id}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{fw.title}</span>
                    <span style={{ fontSize: 10, color: "#555", marginLeft: "auto" }}>{fw.speaker}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{fw.hook}</div>
                  {fw.summary.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                      {fw.summary.map((bullet, i) => (
                        <div key={i} style={{ fontSize: 10, color: "#666", lineHeight: 1.4 }}>• {bullet}</div>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Research & Deep-Dives */}
          <CollapsibleSection id="research" title="Research & Deep-Dives" accent="#6366f1" defaultOpen={true}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Research Docs" description="GTM plan, competitor analysis, copy research, roofer pain points" href="/command-center?tab=research" accent="#6366f1" />
              <LinkCard label="Feature Deep-Dives" description="Every feature with business context, tech details, and build steps" href="/command-center?tab=project" accent="#6366f1" />
              <LinkCard label="Positioning" description="Market positioning, Hormozi value equation, competitive framing" href="/command-center?tab=positioning" accent="#6366f1" />
            </div>
          </CollapsibleSection>

          {/* Wins & Motivation */}
          <CollapsibleSection id="wins" title="Wins & Motivation" accent="#22c55e" defaultOpen={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Wins Board" description="Log milestones, celebrate progress, advisor quotes" href="/command-center?tab=motivation" accent="#22c55e" />
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* GROW TAB                                                   */}
      {/* ═════════════════════════════════════════════════════════ */}
      {tab === "grow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Revenue Strategy */}
          <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8, fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>Revenue Strategy</div>
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
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, color: "#555" }}>• $50K MRR = ~336 Pro or ~168 Growth or ~250 mixed</div>
              <div style={{ fontSize: 11, color: "#555" }}>• Vault 031: $149 bundle &gt; $99 per feature</div>
              <div style={{ fontSize: 11, color: "#555" }}>• Never upsell during onboarding — only after value proven</div>
              <div style={{ fontSize: 11, color: "#555" }}>• Annual: 20% off ($119 Pro / $239 Growth)</div>
            </div>
          </div>

          {/* Growth tools */}
          <div>
            <SectionHeader title="Growth Tools" accent="#6366f1" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Plays" description="Active and queued growth plays with step tracking" href="/command-center?tab=plays" accent="#6366f1" />
              <LinkCard label="Outreach Pipeline" description="Cold email, DMs, partnerships — track every touch" href="/command-center?tab=outreach" accent="#6366f1" />
              <LinkCard label="Overview / War Room" description="Advisor notes, approval queue, channel metrics" href="/command-center?tab=overview" accent="#6366f1" />
            </div>
          </div>

          {/* Live Product */}
          <CollapsibleSection id="live-product" title="Live Product" accent="#D4863E" defaultOpen={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              <LinkCard label="Marketing Site" description="ruufpro.com — the Ridgeline landing page roofers see" href="/" accent="#D4863E" />
              <LinkCard label="Roofer Dashboard" description="What paying roofers use — leads, site editor, SMS, settings" href="/dashboard" accent="#D4863E" />
              <LinkCard label="Onboarding Flow" description="The 3-screen signup experience" href="/onboarding" accent="#D4863E" />
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
