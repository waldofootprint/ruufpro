"use client";

import { useState } from "react";
import type { MergedWorkflow, MergedStep } from "../workflow-registry";
import { PHASE_CONFIG, STEP_STATUS_CONFIG, getBlockingCount } from "../workflow-registry";

interface QueueItem {
  workflow: MergedWorkflow;
  step: MergedStep;
  blockingCount: number;
}

interface Props {
  workflows: MergedWorkflow[];
  onApprove: (stepId: string, notes?: string) => void;
  onSendBack: (stepId: string, notes: string) => void;
  onApproveToStart: (stepId: string, notes?: string) => void;
  onSkip: (stepId: string) => void;
}

type QuickAction = "approve" | "not_now" | "need_info" | null;

const QUICK_ACTIONS: { id: QuickAction; label: string; color: string; bg: string }[] = [
  { id: "approve", label: "Approve", color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  { id: "not_now", label: "Not Now", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { id: "need_info", label: "Need Info", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
];

export default function MyQueue({ workflows, onApprove, onSendBack, onApproveToStart, onSkip }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<QuickAction>(null);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Collect items for each section
  const reviewItems: QueueItem[] = [];
  const prerequisiteItems: QueueItem[] = [];
  const buildingItems: QueueItem[] = [];

  for (const w of workflows) {
    for (const step of w.mergedSteps) {
      const blockingCount = getBlockingCount(w.id, workflows);
      if (step.status === "review") {
        reviewItems.push({ workflow: w, step, blockingCount });
      } else if (step.status === "approved_to_build" && step.prerequisites.length > 0) {
        prerequisiteItems.push({ workflow: w, step, blockingCount });
      } else if (step.status === "building") {
        buildingItems.push({ workflow: w, step, blockingCount });
      }
    }
  }

  // Workflows where step 1 is still "pending" — ready to start
  const readyToStart: QueueItem[] = [];
  for (const w of workflows) {
    if (w.dbStatus === "not_started") {
      const firstStep = w.mergedSteps[0];
      if (firstStep && firstStep.status === "pending") {
        const depsComplete = w.dependencies.every((depId) => {
          const dep = workflows.find((d) => d.id === depId);
          return dep?.dbStatus === "complete";
        });
        if (depsComplete || w.dependencies.length === 0) {
          readyToStart.push({ workflow: w, step: firstStep, blockingCount: getBlockingCount(w.id, workflows) });
        }
      }
    }
  }

  reviewItems.sort((a, b) => b.blockingCount - a.blockingCount);
  readyToStart.sort((a, b) => b.blockingCount - a.blockingCount || a.workflow.dbPriority - b.workflow.dbPriority);

  const totalActionable = reviewItems.length + readyToStart.length + prerequisiteItems.length;

  function openResponse(stepId: string, action: QuickAction) {
    if (activeId === stepId && activeAction === action) {
      setActiveId(null); setActiveAction(null); setMessage(""); return;
    }
    setActiveId(stepId); setActiveAction(action); setMessage("");
  }

  function submitResponse(stepId: string, isStartApproval: boolean) {
    if (activeAction === "approve") {
      if (isStartApproval) onApproveToStart(stepId, message.trim() || undefined);
      else onApprove(stepId, message.trim() || undefined);
    } else if (activeAction === "not_now") {
      onSendBack(stepId, message.trim() || "Not now — deprioritized");
    } else if (activeAction === "need_info") {
      onSendBack(stepId, message.trim() || "Need more information before proceeding");
    }
    setActiveId(null); setActiveAction(null); setMessage("");
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  // ─── Step timeline for a workflow ───────────────────────────
  function renderStepTimeline(workflow: MergedWorkflow) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, margin: "12px 0 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Full Process — {workflow.mergedSteps.length} steps
        </div>
        {workflow.mergedSteps.map((s, i) => {
          const cfg = STEP_STATUS_CONFIG[s.status];
          const isCurrent = s.sortOrder === workflow.dbCurrentStep;
          return (
            <div key={i} style={{ display: "flex", gap: 10, position: "relative" }}>
              {/* Vertical line */}
              {i < workflow.mergedSteps.length - 1 && (
                <div style={{ position: "absolute", left: 7, top: 18, width: 2, height: "calc(100% - 4px)", background: "rgba(255,255,255,0.06)" }} />
              )}
              {/* Dot */}
              <div style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: s.status === "approved" || s.status === "skipped" ? cfg.bg : isCurrent ? cfg.bg : "rgba(255,255,255,0.04)",
                border: isCurrent ? `2px solid ${cfg.color}` : `2px solid ${s.status === "approved" ? cfg.color : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: cfg.color,
              }}>
                {s.status === "approved" && "✓"}
                {s.status === "skipped" && "—"}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? "#fff" : "#888" }}>
                    {s.title}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                {isCurrent && s.description && (
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2, lineHeight: 1.4 }}>{s.description}</div>
                )}
                {s.prerequisites.length > 0 && isCurrent && (
                  <div style={{ marginTop: 4 }}>
                    {s.prerequisites.map((p, pi) => (
                      <div key={pi} style={{ fontSize: 10, color: "#f59e0b", lineHeight: 1.6 }}>• {p}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Workflow summary card ──────────────────────────────────
  function renderWorkflowSummary(workflow: MergedWorkflow) {
    const completedSteps = workflow.mergedSteps.filter((s) => s.status === "approved" || s.status === "skipped").length;
    const totalSteps = workflow.mergedSteps.length;
    const approvalSteps = workflow.mergedSteps.filter((s) => s.prerequisites.length > 0).length;

    return (
      <div style={{ margin: "10px 0 4px", padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Description */}
        <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5, marginBottom: 10 }}>
          {workflow.description}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Steps</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{completedSteps}<span style={{ color: "#555" }}>/{totalSteps}</span></div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Approvals</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{approvalSteps}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. Time</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#818cf8" }}>~{workflow.estimateHours}h</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Difficulty</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>{workflow.difficulty}</div>
          </div>
        </div>

        {/* What you approve */}
        <div style={{ fontSize: 10, fontWeight: 600, color: "#818cf8", textTransform: "uppercase", marginBottom: 4 }}>Your checkpoint</div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>{workflow.approvalCheckpoint}</div>

        {/* Tools needed */}
        {workflow.tools.some((t) => !t.have) && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", marginBottom: 4 }}>Tools needed from you</div>
            {workflow.tools.filter((t) => !t.have).map((t) => (
              <div key={t.name} style={{ fontSize: 11, color: "#f87171", lineHeight: 1.6 }}>• {t.name}{t.note ? ` — ${t.note}` : ""}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Message box with file support ─────────────────────────
  function renderMessageBox(stepId: string, isStartApproval: boolean) {
    if (activeId !== stepId) return null;
    const actionCfg = QUICK_ACTIONS.find((a) => a.id === activeAction);
    const actionLabel = activeAction === "approve"
      ? (isStartApproval ? "Approve & Start" : "Approve")
      : activeAction === "not_now" ? "Send Back" : "Send Question";

    return (
      <div style={{ marginTop: 10 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            activeAction === "approve" ? "Add context, instructions, API keys, or links (optional)..."
            : activeAction === "not_now" ? "Why not now? What's blocking this?"
            : "What do you need to know before deciding?"
          }
          autoFocus
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: `1px solid ${actionCfg?.color || "#555"}40`,
            background: "rgba(255,255,255,0.03)", color: "#ddd", fontSize: 12,
            resize: "vertical", minHeight: 60, outline: "none",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) submitResponse(stepId, isStartApproval);
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <button
            onClick={() => submitResponse(stepId, isStartApproval)}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              background: actionCfg?.bg || "rgba(255,255,255,0.08)",
              color: actionCfg?.color || "#fff",
            }}
          >
            {actionLabel}{message.trim() ? " with Message" : ""} →
          </button>
          <button
            onClick={() => { setActiveId(null); setActiveAction(null); setMessage(""); }}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer" }}
          >
            Cancel
          </button>
          <span style={{ fontSize: 10, color: "#444" }}>⌘ Enter</span>
        </div>
      </div>
    );
  }

  // ─── Quick action chips ────────────────────────────────────
  function renderQuickActions(stepId: string, isStartApproval: boolean, showSkip: boolean = false) {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {QUICK_ACTIONS.map((action) => {
            const isActive = activeId === stepId && activeAction === action.id;
            return (
              <button
                key={action.id}
                onClick={() => openResponse(stepId, action.id)}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: isActive ? action.bg : "rgba(255,255,255,0.04)",
                  color: isActive ? action.color : "#888",
                  transition: "all 0.15s",
                  borderBottom: isActive ? `2px solid ${action.color}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = action.bg; e.currentTarget.style.color = action.color; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#888"; } }}
              >
                {action.label}
              </button>
            );
          })}
          {showSkip && (
            <button
              onClick={() => onSkip(stepId)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#444", fontSize: 11, cursor: "pointer", marginLeft: "auto" }}
            >
              Skip
            </button>
          )}
        </div>
        {renderMessageBox(stepId, isStartApproval)}
      </div>
    );
  }

  // ─── Detail toggle ─────────────────────────────────────────
  function renderDetailToggle(workflowId: string) {
    const isExpanded = expandedId === workflowId;
    return (
      <button
        onClick={() => toggleExpand(workflowId)}
        style={{
          fontSize: 11, color: "#555", background: "none", border: "none",
          cursor: "pointer", padding: "4px 0", marginTop: 4,
        }}
      >
        {isExpanded ? "▾ Hide details" : "▸ Show full process & details"}
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: totalActionable > 0 ? "#fbbf24" : "#22c55e",
          animation: totalActionable > 0 ? "queuePulse 2s ease-in-out infinite" : "none",
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: totalActionable > 0 ? "#fbbf24" : "#22c55e" }}>
          {totalActionable > 0 ? `${totalActionable} item${totalActionable > 1 ? "s" : ""} need attention` : "All clear"}
        </span>
        <style>{`@keyframes queuePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>

      {totalActionable === 0 && buildingItems.length === 0 && (
        <div style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>No items need your attention. Approve a workflow to start building!</p>
        </div>
      )}

      {/* ===== AWAITING REVIEW ===== */}
      {reviewItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#818cf8", marginBottom: 8 }}>
            Awaiting Your Review
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviewItems.map(({ workflow, step, blockingCount }) => {
              const phase = PHASE_CONFIG[workflow.phase];
              return (
                <div key={step.dbId} style={{ background: "rgba(129,140,248,0.04)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: phase.bg, color: phase.color, textTransform: "uppercase" }}>{workflow.name}</span>
                    {blockingCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Blocking {blockingCount} steps</span>
                    )}
                    <span style={{ fontSize: 10, color: "#555", marginLeft: "auto" }}>Step {step.sortOrder + 1} of {workflow.mergedSteps.length}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>{step.title}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px", lineHeight: 1.4 }}>{step.description}</p>

                  {step.buildSummary && (
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, margin: "10px 0 0", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", borderLeft: "3px solid #818cf8" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#818cf8", display: "block", marginBottom: 4, textTransform: "uppercase" }}>What was built</span>
                      {step.buildSummary}
                    </div>
                  )}

                  {renderDetailToggle(workflow.id)}
                  {expandedId === workflow.id && renderWorkflowSummary(workflow)}
                  {expandedId === workflow.id && renderStepTimeline(workflow)}

                  {renderQuickActions(step.dbId, false, true)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== NEEDS YOUR INPUT ===== */}
      {prerequisiteItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#60a5fa", marginBottom: 8 }}>
            Needs Your Input
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {prerequisiteItems.map(({ workflow, step }) => {
              const phase = PHASE_CONFIG[workflow.phase];
              return (
                <div key={step.dbId} style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: phase.bg, color: phase.color, textTransform: "uppercase" }}>{workflow.name}</span>
                    <span style={{ fontSize: 10, color: "#555", marginLeft: "auto" }}>Step {step.sortOrder + 1} of {workflow.mergedSteps.length}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>{step.title}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px", lineHeight: 1.4 }}>{step.description}</p>

                  <div style={{ fontSize: 10, fontWeight: 600, color: "#60a5fa", textTransform: "uppercase", marginBottom: 4 }}>Before Claude can start:</div>
                  <ul style={{ margin: "0 0 4px", paddingLeft: 16 }}>
                    {step.prerequisites.map((p, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#888", lineHeight: 1.8 }}>{p}</li>
                    ))}
                  </ul>

                  {renderDetailToggle(workflow.id)}
                  {expandedId === workflow.id && renderWorkflowSummary(workflow)}
                  {expandedId === workflow.id && renderStepTimeline(workflow)}

                  {renderQuickActions(step.dbId, true, false)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== READY TO START ===== */}
      {readyToStart.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fbbf24", marginBottom: 8 }}>
            Ready to Start
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {readyToStart.map(({ workflow, step, blockingCount }) => {
              const phase = PHASE_CONFIG[workflow.phase];
              return (
                <div key={step.dbId} style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: phase.bg, color: phase.color, textTransform: "uppercase" }}>{workflow.name}</span>
                    <span style={{ fontSize: 10, color: "#555" }}>~{workflow.estimateHours}h total</span>
                    {blockingCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>Unblocks {blockingCount} steps</span>
                    )}
                    <span style={{ fontSize: 10, color: "#555", marginLeft: "auto" }}>{workflow.mergedSteps.length} steps total</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>Step 1: {step.title}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px", lineHeight: 1.4 }}>{step.description}</p>

                  {step.prerequisites.length > 0 && (
                    <div style={{ margin: "8px 0 4px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", marginBottom: 4 }}>You need to provide:</div>
                      {step.prerequisites.map((p, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#f59e0b", lineHeight: 1.6 }}>• {p}</div>
                      ))}
                    </div>
                  )}

                  {renderDetailToggle(workflow.id)}
                  {expandedId === workflow.id && renderWorkflowSummary(workflow)}
                  {expandedId === workflow.id && renderStepTimeline(workflow)}

                  {renderQuickActions(step.dbId, true, false)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== IN PROGRESS ===== */}
      {buildingItems.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", marginBottom: 8 }}>
            In Progress — No Action Needed
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {buildingItems.map(({ workflow, step }) => (
              <div key={step.dbId} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #fbbf24", borderTopColor: "transparent", animation: "queueSpin 0.8s linear infinite", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>{workflow.name}</span>
                  <span style={{ fontSize: 12, color: "#555" }}> — {step.title}</span>
                  <span style={{ fontSize: 10, color: "#444", marginLeft: 8 }}>Step {step.sortOrder + 1}/{workflow.mergedSteps.length}</span>
                </div>
                <style>{`@keyframes queueSpin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
