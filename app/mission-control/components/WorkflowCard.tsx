"use client";

import { useState } from "react";
import type { MergedWorkflow, MergedStep } from "../workflow-registry";
import { STATUS_CONFIG, DIFFICULTY_CONFIG, PHASE_CONFIG, STEP_STATUS_CONFIG, WORKFLOWS, getNextPendingStep, getBlockingCount } from "../workflow-registry";

interface Props {
  item: MergedWorkflow;
  allWorkflows: MergedWorkflow[];
  onApproveToStart: (stepId: string) => void;
  onApprove: (stepId: string) => void;
  onSendBack: (stepId: string, notes: string) => void;
  onSkip: (stepId: string) => void;
}

export default function WorkflowCard({ item, allWorkflows, onApproveToStart, onApprove, onSendBack, onSkip }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [sendBackStepId, setSendBackStepId] = useState<string | null>(null);
  const [sendBackNotes, setSendBackNotes] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const status = STATUS_CONFIG[item.dbStatus];
  const difficulty = DIFFICULTY_CONFIG[item.difficulty];
  const phase = PHASE_CONFIG[item.phase];
  const nextStep = getNextPendingStep(item);
  const completedSteps = item.mergedSteps.filter((s) => s.status === "approved" || s.status === "skipped").length;
  const toolsNeeded = item.tools.filter((t) => !t.have);
  const toolsHave = item.tools.filter((t) => t.have);
  const blockingCount = getBlockingCount(item.id, allWorkflows);

  const deps = item.dependencies
    .map((id) => WORKFLOWS.find((w) => w.id === id))
    .filter(Boolean);

  function handleConfirm(stepId: string, action: "approve" | "approve_to_start") {
    if (confirmId === stepId) {
      if (action === "approve") onApprove(stepId);
      else onApproveToStart(stepId);
      setConfirmId(null);
    } else {
      setConfirmId(stepId);
      setTimeout(() => setConfirmId(null), 5000);
    }
  }

  function handleSendBack(stepId: string) {
    if (!sendBackNotes.trim()) return;
    onSendBack(stepId, sendBackNotes.trim());
    setSendBackStepId(null);
    setSendBackNotes("");
  }

  return (
    <div style={{
      background: "#141420",
      border: `1px solid ${expanded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 12, transition: "border-color 0.2s", overflow: "hidden",
    }}
      onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
      onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {/* COLLAPSED HEADER */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "18px 24px", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: status.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", flex: 1 }}>{item.name}</span>
          <span style={{ fontSize: 11, color: "#555", marginRight: 4 }}>{completedSteps}/{item.mergedSteps.length} steps</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "#666" }}>~{item.estimateHours}h</span>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", padding: "3px 10px", borderRadius: 6, background: status.bg, color: status.color }}>{status.label}</span>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", padding: "3px 10px", borderRadius: 6, background: difficulty.bg, color: difficulty.color }}>{difficulty.label}</span>
        </div>
        {!expanded && (
          <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0 22px", lineHeight: 1.4 }}>
            {item.description.slice(0, 120)}...
          </p>
        )}
      </div>

      {/* EXPANDED CONTENT */}
      {expanded && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: "16px 0" }}>{item.description}</p>

          {/* Why autonomous */}
          <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${phase.color}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: phase.color, display: "block", marginBottom: 4 }}>Why this matters for autonomy</span>
            <p style={{ fontSize: 12, color: "#777", lineHeight: 1.5, margin: 0 }}>{item.whyAutonomous}</p>
          </div>

          {/* Diagram */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", marginBottom: 12 }}>Workflow Diagram</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "8px 0" }}>
              {item.diagramNodes.map((node, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    padding: "8px 16px", borderRadius: 8,
                    background: i === 0 ? phase.bg : "rgba(255,255,255,0.04)",
                    border: `1px solid ${i === 0 ? phase.color + "33" : "rgba(255,255,255,0.08)"}`,
                    fontSize: 11, fontWeight: 600, color: i === 0 ? phase.color : "#999", whiteSpace: "nowrap",
                  }}>{node}</div>
                  {i < item.diagramNodes.length - 1 && (
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" style={{ flexShrink: 0 }}>
                      <line x1="0" y1="6" x2="18" y2="6" stroke="#333" strokeWidth="1.5" />
                      <polyline points="15,2 20,6 15,10" stroke="#333" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Build Steps */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", marginBottom: 12 }}>
              Build Steps ({completedSteps}/{item.mergedSteps.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.mergedSteps.map((step, i) => {
                const sCfg = STEP_STATUS_CONFIG[step.status];
                const isNext = step === nextStep;
                return (
                  <div key={i} style={{
                    padding: "12px 16px", borderRadius: 8,
                    background: step.status === "review" ? "rgba(129,140,248,0.05)" : step.status === "revision" ? "rgba(249,115,22,0.05)" : isNext ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${step.status === "review" ? "rgba(129,140,248,0.2)" : step.status === "revision" ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                        background: step.status === "approved" ? "rgba(34,197,94,0.15)" : step.status === "review" ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.04)",
                        color: step.status === "approved" ? "#22c55e" : step.status === "review" ? "#818cf8" : "#555",
                      }}>
                        {step.status === "approved" ? "✓" : step.status === "skipped" ? "—" : i + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: step.status === "approved" || step.status === "skipped" ? "#666" : "#ddd", flex: 1, textDecoration: step.status === "approved" || step.status === "skipped" ? "line-through" : "none" }}>
                        {step.title}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 8px", borderRadius: 4, background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#666", lineHeight: 1.5, margin: "0 0 0 30px" }}>{step.description}</p>

                    {/* Prerequisites */}
                    {step.prerequisites.length > 0 && step.status === "pending" && (
                      <div style={{ margin: "8px 0 0 30px" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#f59e0b" }}>You need to:</span>
                        <ul style={{ margin: "4px 0 0", paddingLeft: 14 }}>
                          {step.prerequisites.map((p, pi) => (
                            <li key={pi} style={{ fontSize: 11, color: "#777", lineHeight: 1.6 }}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Build summary (shown when in review) */}
                    {step.buildSummary && (step.status === "review" || step.status === "approved") && (
                      <div style={{ margin: "8px 0 0 30px", padding: "8px 12px", borderRadius: 6, background: "rgba(129,140,248,0.05)", borderLeft: "2px solid #818cf8" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#818cf8", textTransform: "uppercase" }}>Build summary</span>
                        <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0", lineHeight: 1.5 }}>{step.buildSummary}</p>
                      </div>
                    )}

                    {/* Review notes (shown when sent back) */}
                    {step.reviewNotes && step.status === "revision" && (
                      <div style={{ margin: "8px 0 0 30px", padding: "8px 12px", borderRadius: 6, background: "rgba(249,115,22,0.05)", borderLeft: "2px solid #f97316" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#f97316", textTransform: "uppercase" }}>Your notes</span>
                        <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0", lineHeight: 1.5 }}>{step.reviewNotes}</p>
                      </div>
                    )}

                    {/* Context notes (shown when building) */}
                    {step.contextNotes && step.status === "building" && (
                      <div style={{ margin: "8px 0 0 30px", padding: "8px 12px", borderRadius: 6, background: "rgba(251,191,36,0.05)", borderLeft: "2px solid #fbbf24" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#fbbf24", textTransform: "uppercase" }}>Claude&apos;s notes</span>
                        <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0", lineHeight: 1.5 }}>{step.contextNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tools */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", marginBottom: 12 }}>
              Tools ({toolsHave.length} ready, {toolsNeeded.length} needed)
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {item.tools.map((tool) => (
                <div key={tool.name} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                  background: tool.have ? "rgba(34,197,94,0.06)" : "rgba(251,191,36,0.06)",
                  border: `1px solid ${tool.have ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)"}`,
                  fontSize: 11, fontWeight: 500, color: tool.have ? "#4ade80" : "#fbbf24",
                }} title={tool.note || ""}>
                  <span style={{ fontSize: 9 }}>{tool.have ? "✓" : "✗"}</span>
                  {tool.name}
                  {tool.note && <span style={{ fontSize: 10, color: tool.have ? "#2d7a4a" : "#a67c1a", marginLeft: 2 }}>— {tool.note}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Setup Time</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>~{item.estimateHours}h</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Steps</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{item.mergedSteps.length}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Tools Needed</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: toolsNeeded.length > 0 ? "#fbbf24" : "#22c55e" }}>{toolsNeeded.length}</div>
            </div>
            {deps.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Depends On</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", lineHeight: 1.4 }}>{deps.map((d) => d!.name).join(", ")}</div>
              </div>
            )}
          </div>

          {/* CEO Checkpoint */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: 12, color: "#999" }}>
              <span style={{ fontWeight: 600, color: "#bbb" }}>You approve: </span>{item.approvalCheckpoint}
            </span>
          </div>

          {/* Status-based footer */}
          {item.dbStatus === "complete" && (
            <div style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", textAlign: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>✓ Workflow Complete — All {item.mergedSteps.length} steps approved and deployed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
