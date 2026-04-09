"use client";

import { useState } from "react";

// ── Demo contractors (sorted worst-first) ───────────────────────────
const DEMO_CONTRACTORS = [
  {
    name: "SunCoast Roofing",
    city: "Tampa, FL",
    tier: "Pro",
    signupDate: "Apr 2",
    currentStage: 3, // Brand Review (0-indexed)
    stageLabel: "Brand Review — Day 5 of ~10",
    stageColor: "amber" as const,
    detail: "A2P submitted Apr 2 · Twilio sent Apr 2",
    smsLive: false,
    health: null,
  },
  {
    name: "Elite Roof Solutions",
    city: "Orlando, FL",
    tier: "Pro",
    signupDate: "Mar 25",
    currentStage: 6, // SMS Live
    stageLabel: "SMS Live ✓",
    stageColor: "green" as const,
    detail: "Active since Apr 1 · 10 days to approve",
    smsLive: true,
    health: {
      days: ["green", "green", "green", "green", "green", "green", "green"] as const,
      sent: 32, delivered: 32, failed: 0, rate: "100%",
      autoResponse: 14, missedCall: 5, reviewRequests: 8, reviewsCompleted: 3,
    },
  },
];

// ── 10DLC pipeline stages ───────────────────────────────────────────
const DLC_STAGES = [
  "Pro Signup",
  "A2P Wizard Auto-Submit",
  "Twilio App Auto-Sent",
  "Brand Review",
  "Campaign Approved",
  "Number Assigned",
  "SMS Live",
];

// ── Automation definitions ──────────────────────────────────────────
const AUTOMATIONS = [
  {
    name: "Lead Auto-Response",
    desc: "Form submit → instant text with estimate link",
    chain: ["Form Submit", "/api/notify", "Inngest", "SMS Sent"],
    status: "active" as const,
  },
  {
    name: "Missed-Call Text-Back",
    desc: "Missed call → automatic text within 30 seconds",
    chain: ["Missed Call", "Twilio Voice", "Inngest (dedup)", "SMS Sent"],
    status: "active" as const,
  },
  {
    name: "Review Requests",
    desc: "Job completed → SMS with Google review link",
    chain: ["Status → Completed", "Inngest", "Review SMS", "3d: Email"],
    status: "active" as const,
  },
  {
    name: "Inbound Reply Alerts",
    desc: "Homeowner replies → contractor email + push",
    chain: ["Inbound SMS", "Twilio Webhook", "Inngest", "Email + Push"],
    status: "active" as const,
  },
];

const DAY_LABELS = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];

export default function SmsPage() {
  const [expandedContractor, setExpandedContractor] = useState<number | null>(null);
  const [automationsExpanded, setAutomationsExpanded] = useState(false);

  const activeCount = AUTOMATIONS.filter((a) => a.status === "active").length;
  const problemContractors = DEMO_CONTRACTORS.filter(c => c.stageColor !== "green");
  const healthyContractors = DEMO_CONTRACTORS.filter(c => c.stageColor === "green");

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-4">
      {/* Page header */}
      <div className="mb-2">
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">SMS Automations</h2>
        <p className="text-[13px] text-[#8E8E93] mt-1">
          Contractor health, onboarding status, and automation monitoring.
        </p>
      </div>

      {/* ═══ SECTION 1: CONTRACTOR HEALTH (sorted worst-first) ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="text-[13px] font-bold uppercase tracking-[0.04em]">Contractor Health</div>
          <div className="flex gap-2">
            {problemContractors.length > 0 && (
              <span className="text-[10px] font-semibold bg-[#FFF8E1] text-[#F57F17] px-2.5 py-1 rounded-[10px]">
                {problemContractors.length} Needs Attention
              </span>
            )}
            <span className="text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-[10px]">
              {healthyContractors.length} Healthy
            </span>
          </div>
        </div>

        {DEMO_CONTRACTORS.map((c, i) => {
          const isOpen = expandedContractor === i;
          return (
            <div key={c.name}>
              <button
                className="w-full px-5 py-3.5 flex justify-between items-center border-b border-[#F5F5F5] last:border-b-0 hover:bg-[#FAFBFC] transition-colors text-left"
                onClick={() => setExpandedContractor(isOpen ? null : i)}
              >
                <div className="flex items-center gap-3">
                  {/* Health dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    c.stageColor === "green" ? "bg-[#34C759]" :
                    c.stageColor === "amber" ? "bg-[#FF9F0A]" :
                    "bg-[#FF3B30]"
                  }`} />
                  <div>
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5">
                      {c.city} · {c.tier} tier · Signed up {c.signupDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Mini health bar for live contractors */}
                  {c.smsLive && c.health && (
                    <div className="flex gap-[2px]">
                      {c.health.days.map((d, j) => (
                        <div key={j} className={`w-3 h-3 rounded-[2px] ${
                          d === "green" ? "bg-[#34C759]" :
                          d === "amber" ? "bg-[#FF9F0A]" :
                          "bg-[#FF3B30]"
                        }`} />
                      ))}
                    </div>
                  )}
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${
                      c.stageColor === "green" ? "text-[#34C759]" :
                      c.stageColor === "amber" ? "text-[#FF9F0A]" :
                      "text-[#FF3B30]"
                    }`}>{c.stageLabel}</div>
                  </div>
                  <span className="text-[10px] text-[#C7C7CC]">{isOpen ? "▼" : "▶"}</span>
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="bg-[#F8FAFF] border-b border-[#E5E5EA] p-5">
                  <div className="grid grid-cols-3 gap-5">
                    {/* Column 1: Timeline / Health */}
                    <div>
                      {c.smsLive && c.health ? (
                        <>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">SMS Health (Last 7 Days)</div>
                          <div className="flex gap-0.5">
                            {c.health.days.map((d, j) => (
                              <div key={j} className="flex-1">
                                <div className={`h-6 rounded flex items-center justify-center text-[8px] font-bold text-white ${
                                  d === "green" ? "bg-[#34C759]" :
                                  d === "amber" ? "bg-[#FF9F0A]" :
                                  "bg-[#FF3B30]"
                                }`}>✓</div>
                                <div className="text-[8px] text-[#AEAEB2] text-center mt-0.5">{DAY_LABELS[j]}</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 space-y-1">
                            {[
                              { label: "Total Sent", value: String(c.health.sent) },
                              { label: "Delivered", value: String(c.health.delivered), color: "green" },
                              { label: "Failed", value: String(c.health.failed), color: c.health.failed > 0 ? "red" : "" },
                              { label: "Delivery Rate", value: c.health.rate, color: "green" },
                            ].map((row) => (
                              <div key={row.label} className="flex justify-between text-xs">
                                <span className="text-[#8E8E93]">{row.label}</span>
                                <span className={`font-semibold ${
                                  row.color === "green" ? "text-[#34C759]" :
                                  row.color === "red" ? "text-[#FF3B30]" : ""
                                }`}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Onboarding Timeline</div>
                          {[
                            { label: "Pro Signup", value: `${c.signupDate}, 9:14am ✓`, color: "green" },
                            { label: "A2P Wizard Submitted", value: `${c.signupDate}, 9:15am (auto) ✓`, color: "green" },
                            { label: "Twilio Application Sent", value: `${c.signupDate}, 9:16am (auto) ✓`, color: "green" },
                            { label: "Brand Review", value: c.currentStage >= 4 ? "Approved ✓" : "In progress — Day 5", color: c.currentStage >= 4 ? "green" : "amber" },
                            { label: "Expected Approval", value: c.currentStage >= 4 ? "Done" : "Apr 12–17 (10–15 days)", color: "" },
                            { label: "Campaign Approval", value: c.currentStage >= 5 ? "Approved ✓" : "Waiting", color: c.currentStage >= 5 ? "green" : "" },
                            { label: "Number Assigned", value: c.currentStage >= 6 ? "Assigned ✓" : "Waiting", color: c.currentStage >= 6 ? "green" : "" },
                            { label: "SMS Live", value: c.currentStage >= 6 ? "Active ✓" : "Waiting", color: c.currentStage >= 6 ? "green" : "" },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between py-1">
                              <span className="text-xs text-[#8E8E93]">{row.label}</span>
                              <span className={`text-xs font-semibold ${
                                row.color === "green" ? "text-[#34C759]" :
                                row.color === "amber" ? "text-[#FF9F0A]" : "text-[#D1D1D6]"
                              }`}>{row.value}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Column 2: Business Details */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Business Details</div>
                      {[
                        { label: "EIN", value: "XX-XXXXXXX" },
                        { label: "Business Type", value: "LLC" },
                        { label: "Phone", value: "(813) 555-0199" },
                        { label: "Compliance URL", value: "View ↗", isLink: true },
                        { label: "Twilio Brand SID", value: "BN2a3b4c5d...", small: true },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between py-1">
                          <span className="text-xs text-[#8E8E93]">{row.label}</span>
                          {row.isLink ? (
                            <a href="#" className="text-[11px] text-[#007AFF] font-medium">{row.value}</a>
                          ) : (
                            <span className={`text-xs font-semibold ${row.small ? "text-[10px] text-[#8E8E93]" : ""}`}>{row.value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Column 3: Automation Activity (live) or Automated vs Manual (onboarding) */}
                    <div>
                      {c.smsLive && c.health ? (
                        <>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Automation Activity (7d)</div>
                          {[
                            { label: "Lead auto-responses", value: String(c.health.autoResponse) },
                            { label: "Missed-call textbacks", value: String(c.health.missedCall) },
                            { label: "Review requests sent", value: String(c.health.reviewRequests) },
                            { label: "Reviews completed", value: String(c.health.reviewsCompleted), color: "green" },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between py-1">
                              <span className="text-xs text-[#8E8E93]">{row.label}</span>
                              <span className={`text-xs font-semibold ${row.color === "green" ? "text-[#34C759]" : ""}`}>{row.value}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] mb-2">Automated vs Manual</div>
                          {[
                            { label: "A2P Wizard submission", value: "✓ Automated", color: "green" },
                            { label: "Twilio application", value: "✓ Automated", color: "green" },
                            { label: "Brand review", value: "Twilio reviews (wait)", color: "amber" },
                            { label: "Status polling", value: "✓ Daily cron", color: "green" },
                            { label: "Campaign creation", value: "✓ Auto on approval", color: "green" },
                            { label: "Number provisioning", value: "✓ Auto on campaign", color: "green" },
                            { label: "Activation", value: "✓ Automated", color: "green" },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between py-1">
                              <span className="text-xs text-[#8E8E93]">{row.label}</span>
                              <span className={`text-xs font-semibold ${
                                row.color === "green" ? "text-[#34C759]" :
                                row.color === "amber" ? "text-[#FF9F0A]" : ""
                              }`}>{row.value}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ SECTION 2: 10DLC ONBOARDING PIPELINE ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="text-[13px] font-bold uppercase tracking-[0.04em]">10DLC Onboarding Pipeline</div>
          <span className="text-[10px] text-[#8E8E93]">
            {DEMO_CONTRACTORS.filter(c => c.smsLive).length} live · {DEMO_CONTRACTORS.filter(c => !c.smsLive).length} in progress
          </span>
        </div>

        {/* Pipeline stage visualization */}
        <div className="flex px-5 py-4">
          {DLC_STAGES.map((stage, i) => {
            // Count contractors at or past this stage
            const countAtStage = DEMO_CONTRACTORS.filter(c => c.currentStage === i).length;
            const anyPast = DEMO_CONTRACTORS.some(c => c.currentStage > i);
            const anyAtOrPast = DEMO_CONTRACTORS.some(c => c.currentStage >= i);
            const status = anyPast && countAtStage === 0 ? "done" : countAtStage > 0 && i === 6 ? "done" : countAtStage > 0 ? "active" : "pending";
            return (
              <div key={stage} className="flex-1 text-center relative">
                {i > 0 && (
                  <div className={`absolute top-[14px] h-[2px] z-[1] ${anyAtOrPast ? "bg-[#34C759]" : "bg-[#E5E5EA]"}`}
                    style={{ left: "calc(-50% + 16px)", right: "calc(50% + 16px)" }} />
                )}
                <div className={`w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center text-[11px] font-bold text-white relative z-[2] ${
                  status === "done" ? "bg-[#34C759]" :
                  status === "active" ? "bg-[#FF9F0A] animate-pulse" :
                  "bg-[#E5E5EA] text-[#8E8E93]"
                }`}>
                  {status === "done" ? "✓" : countAtStage > 0 ? countAtStage : 0}
                </div>
                <div className={`text-[10px] leading-[1.3] ${status === "active" ? "text-[#F57F17] font-semibold" : "text-[#8E8E93]"}`}>
                  {stage}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 3: AUTOMATIONS STATUS (collapsed single line) ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <button
          className="w-full px-5 py-3.5 flex justify-between items-center hover:bg-[#FAFAFA] transition-colors"
          onClick={() => setAutomationsExpanded(!automationsExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span className="text-[13px] font-bold uppercase tracking-[0.04em]">Automations</span>
            <span className="text-[11px] text-[#8E8E93]">All {activeCount} running</span>
          </div>
          <span className="text-[10px] text-[#C7C7CC]">{automationsExpanded ? "▼" : "▶"}</span>
        </button>

        {automationsExpanded && (
          <div className="border-t border-[#F2F2F7]">
            {AUTOMATIONS.map((auto) => (
              <div key={auto.name} className="px-5 py-3 border-b border-[#F5F5F5] last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${auto.status === "active" ? "bg-[#34C759]" : "bg-[#D1D1D6]"}`} />
                    <span className="text-[13px] font-semibold">{auto.name}</span>
                  </div>
                  <div className="text-[11px] text-[#8E8E93] mt-0.5 ml-3.5">{auto.desc}</div>
                </div>
                <div className="flex items-center gap-1">
                  {auto.chain.map((step, i) => (
                    <div key={i} className="flex items-center">
                      <span className="text-[9px] text-[#AEAEB2] font-medium">{step}</span>
                      {i < auto.chain.length - 1 && <span className="text-[9px] text-[#D1D1D6] px-0.5">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ NOT YET BUILT ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden opacity-60">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#8E8E93]">Coming Soon</div>
          <span className="text-[10px] font-semibold bg-gray-100 text-[#8E8E93] px-2.5 py-1 rounded-[10px]">Not Built</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: "Stripe Integration", desc: "No tier upgrade trigger — contractor can't pay yet" },
            { label: "Contractor Approval Email", desc: "No email sent when 10DLC approved — need to add to activateSMS()" },
            { label: "Per-Contractor Health Monitoring", desc: "No per-contractor delivery tracking or alerting" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-start py-2 border-b border-[#F5F5F5] last:border-b-0">
              <div>
                <div className="text-[13px] text-[#8E8E93]">{item.label}</div>
                <div className="text-[11px] text-[#C7C7CC] mt-0.5">{item.desc}</div>
              </div>
              <span className="text-[10px] font-semibold bg-[#FFEBEE] text-[#C62828] px-2.5 py-1 rounded-[10px] flex-shrink-0">Not Built</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-6 text-[11px] text-[#D1D1D6]">
        RuufPro Ops · SMS Automations
      </div>
    </div>
  );
}
