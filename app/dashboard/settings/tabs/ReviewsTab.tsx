"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Eye,
  Loader2,
  MousePointerClick,
  Send,
  Star,
  Users,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../../DashboardContext";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuInput, NeuTextarea } from "@/components/dashboard/settings/NeuInput";
import { NeuToggle } from "@/components/dashboard/settings/NeuToggle";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

const DEFAULT_SUBJECT = "How was your experience with {{business_name}}?";
const DEFAULT_HEADING = "Thanks for choosing {{business_name}}!";
const DEFAULT_BODY = "We hope everything went well. If you have a minute, a quick review would really help us out.";
const DEFAULT_BUTTON = "⭐ Leave a Review";

const DELAYS = [
  { value: "immediate", label: "Immediately", desc: "As soon as you mark the job complete" },
  { value: "1_hour", label: "1 hour later", desc: "Give them time to settle in" },
  { value: "1_day", label: "Next day", desc: "Wait until the next morning" },
  { value: "3_days", label: "3 days later", desc: "Let the work speak first" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReviewStats = any;

export function ReviewsTab() {
  const { contractorId, tier } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [emailSubject, setEmailSubject] = useState(DEFAULT_SUBJECT);
  const [emailHeading, setEmailHeading] = useState(DEFAULT_HEADING);
  const [emailBody, setEmailBody] = useState(DEFAULT_BODY);
  const [emailButton, setEmailButton] = useState(DEFAULT_BUTTON);
  const [emailDelay, setEmailDelay] = useState("immediate");
  const [showPreview, setShowPreview] = useState(false);

  const [stats, setStats] = useState<ReviewStats>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [batchSending, setBatchSending] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  useEffect(() => {
    if (!contractorId) return;
    (async () => {
      const { data } = await supabase
        .from("contractors")
        .select(
          "business_name, google_review_url, review_request_enabled, review_email_subject, review_email_heading, review_email_body, review_email_button, review_email_delay"
        )
        .eq("id", contractorId)
        .single();
      if (data) {
        setBusinessName(data.business_name || "");
        setGoogleReviewUrl(data.google_review_url || "");
        setReviewEnabled(data.review_request_enabled || false);
        if (data.review_email_subject) setEmailSubject(data.review_email_subject);
        if (data.review_email_heading) setEmailHeading(data.review_email_heading);
        if (data.review_email_body) setEmailBody(data.review_email_body);
        if (data.review_email_button) setEmailButton(data.review_email_button);
        if (data.review_email_delay) setEmailDelay(data.review_email_delay);
      }
      setLoading(false);
    })();
  }, [contractorId]);

  useEffect(() => {
    if (!contractorId || tier === "free") return;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/review-stats");
        if (res.ok) setStats(await res.json());
      } catch {
        /* silent */
      }
      setStatsLoading(false);
    })();
  }, [contractorId, tier]);

  async function handleBatchSend() {
    if (!stats?.unrequested_completed || batchSending) return;
    if (!window.confirm(`Send review request emails to ${stats.unrequested_completed} completed jobs?`)) return;
    setBatchSending(true);
    setBatchResult(null);
    try {
      const { data: completedLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("contractor_id", contractorId)
        .in("status", ["completed", "won"]);
      if (!completedLeads || completedLeads.length === 0) {
        setBatchResult("No completed jobs found.");
        setBatchSending(false);
        return;
      }
      const res = await fetch("/api/reviews/batch-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: completedLeads.map((l: { id: string }) => l.id) }),
      });
      const data = await res.json();
      if (data.queued > 0) {
        setBatchResult(
          `${data.queued} review request${data.queued === 1 ? "" : "s"} queued!${
            data.skipped > 0 ? ` (${data.skipped} already requested)` : ""
          }`
        );
        const refresh = await fetch("/api/dashboard/review-stats");
        if (refresh.ok) setStats(await refresh.json());
      } else {
        setBatchResult(data.error || "No eligible leads to send to.");
      }
    } catch {
      setBatchResult("Failed to send. Try again.");
    }
    setBatchSending(false);
  }

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setErr("");
    const { error } = await supabase
      .from("contractors")
      .update({
        google_review_url: googleReviewUrl || null,
        review_request_enabled: reviewEnabled,
        review_email_subject: emailSubject,
        review_email_heading: emailHeading,
        review_email_body: emailBody,
        review_email_button: emailButton,
        review_email_delay: emailDelay,
      })
      .eq("id", contractorId);
    setSaving(false);
    if (error) setErr("Failed to save. Try again.");
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function preview(text: string) {
    return text.replace(/\{\{business_name\}\}/g, businessName || "Your Business");
  }

  if (tier === "free") {
    return (
      <SettingsSection title="Reviews — Pro Feature">
        <div className="flex flex-col items-center py-6 text-center gap-4">
          <div className="neu-flat h-14 w-14 flex items-center justify-center" style={{ borderRadius: 14 }}>
            <Star className="h-7 w-7" style={{ color: "var(--neu-accent)" }} />
          </div>
          <p className="max-w-sm text-[13px] neu-muted">
            Auto-email homeowners after every completed job asking for a Google review. Customize the email,
            set the timing, stack up 5-star reviews.
          </p>
          <NeuButton
            variant="accent"
            onClick={async () => {
              const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "pro_monthly" }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
          >
            Upgrade to Pro
          </NeuButton>
        </div>
      </SettingsSection>
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-sm neu-muted">Loading review settings…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      {!statsLoading && stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Sent"
              value={stats.total_sent}
              sub={`${stats.this_month.sent} this month`}
              icon={<Send className="h-3.5 w-3.5" />}
            />
            <StatCard
              label="Clicked"
              value={stats.total_clicked}
              sub={`${stats.click_rate}% click rate`}
              icon={<MousePointerClick className="h-3.5 w-3.5" />}
            />
            <StatCard
              label="Reviewed"
              value={stats.total_reviewed}
              sub={`${stats.review_rate}% review rate`}
              icon={<Star className="h-3.5 w-3.5" />}
            />
          </div>

          {stats.unrequested_completed > 0 && (
            <div
              className="neu-raised p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="neu-flat h-9 w-9 flex-shrink-0 flex items-center justify-center"
                  style={{ borderRadius: 12, color: "var(--neu-accent)" }}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: "var(--neu-text)" }}>
                    {stats.unrequested_completed} completed job
                    {stats.unrequested_completed === 1 ? "" : "s"} with no request
                  </p>
                  <p className="text-[11px] neu-muted">Send review requests to boost your Google rating</p>
                </div>
              </div>
              <NeuButton variant="accent" onClick={handleBatchSend} disabled={batchSending}>
                {batchSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send to All"
                )}
              </NeuButton>
            </div>
          )}
          {batchResult && (
            <p
              className={`text-[12px] font-medium ${
                batchResult.includes("queued") ? "" : "neu-muted"
              }`}
              style={batchResult.includes("queued") ? { color: "var(--neu-accent)" } : undefined}
            >
              {batchResult}
            </p>
          )}

          {stats.recent_requests.length > 0 && (
            <SettingsSection title="Recent Requests" description="Last 5 review emails sent.">
              <div className="space-y-1">
                {stats.recent_requests.slice(0, 5).map((req: any, i: number) => (
                  <div
                    key={req.id || i}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: i < 4 ? "1px solid var(--neu-border)" : "none" }}
                  >
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--neu-text)" }}>
                        {req.lead_name}
                      </p>
                      <p className="text-[10px] neu-muted">
                        {req.sent_at ? new Date(req.sent_at).toLocaleDateString() : "Pending"}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}
        </>
      )}

      {/* Auto requests toggle */}
      <SettingsSection
        title="Auto Review Requests"
        description={"Email homeowners when you mark a job \u201Ccompleted.\u201D"}
        action={<NeuToggle checked={reviewEnabled} onChange={setReviewEnabled} />}
      >
        <p className="text-[12px] neu-muted">
          Drafts send from your configured email delay. If they don&apos;t click within 3 days, one gentle reminder goes out. That&apos;s it — no spam.
        </p>
      </SettingsSection>

      {/* Google Review URL */}
      <SettingsSection
        title="Google Review Link"
        description="Paste your 'Ask for reviews' link from your Google Business Profile."
      >
        <NeuInput
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          placeholder="https://g.page/r/your-business/review"
        />
        <p className="flex items-center gap-1 text-[11px] neu-muted">
          <ExternalLink className="h-3 w-3" />
          Google Business Profile → &quot;Ask for reviews&quot;
        </p>
      </SettingsSection>

      {/* NFC placeholder */}
      <SettingsSection
        title="NFC Review Cards"
        description="Your cards will link to the Google URL above. Track scans on Insights."
      >
        <div className="flex items-center gap-3">
          <div
            className="neu-flat h-9 w-9 flex items-center justify-center"
            style={{ borderRadius: 12, color: "var(--neu-text-muted)" }}
          >
            <CreditCard className="h-4 w-4" />
          </div>
          <p className="text-[12px] neu-muted">
            NFC config ships with the direct-mail launch. No action needed yet.
          </p>
        </div>
      </SettingsSection>

      {/* Email customization */}
      <SettingsSection
        title="Customize Your Email"
        description={`Use {{business_name}} to insert your business name.`}
        action={
          <NeuButton variant="flat" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4" />
            {showPreview ? "Edit" : "Preview"}
          </NeuButton>
        }
      >
        {showPreview ? (
          <div className="neu-inset p-5">
            <div
              className="mx-auto max-w-[380px] overflow-hidden"
              style={{
                borderRadius: 14,
                background: "#ffffff",
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              }}
            >
              <div className="px-4 py-2.5" style={{ background: "#f8fafc", borderBottom: "1px solid #eef2f6" }}>
                <p className="text-[10px] text-slate-400">From: {businessName} via RuufPro</p>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{preview(emailSubject)}</p>
              </div>
              <div className="px-6 py-6 text-center">
                <p className="text-[14px] font-semibold text-slate-800 mb-2">{preview(emailHeading)}</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-5">{preview(emailBody)}</p>
                <div
                  className="inline-block px-5 py-2.5 text-[13px] font-semibold text-white"
                  style={{ background: "#2563eb", borderRadius: 8 }}
                >
                  {emailButton}
                </div>
                <p className="text-[9px] text-slate-300 mt-4">
                  Sent on behalf of {businessName} · Powered by RuufPro
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <NeuInput
              label="Subject Line"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <NeuInput
              label="Heading"
              value={emailHeading}
              onChange={(e) => setEmailHeading(e.target.value)}
            />
            <NeuTextarea
              label="Message"
              rows={3}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
            <NeuInput
              label="Button Text"
              value={emailButton}
              onChange={(e) => setEmailButton(e.target.value)}
            />
          </>
        )}
      </SettingsSection>

      {/* Timing */}
      <SettingsSection title="When to Send" description="How long to wait after marking a job complete.">
        <div className="space-y-2">
          {DELAYS.map((opt) => {
            const active = emailDelay === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setEmailDelay(opt.value)}
                className={`w-full flex items-center gap-3 p-3 text-left transition ${
                  active ? "neu-inset-deep" : "neu-flat hover:opacity-90"
                }`}
                style={{ borderRadius: 12 }}
              >
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full border-2 flex-shrink-0"
                  style={{
                    borderColor: active ? "var(--neu-accent)" : "var(--neu-text-muted)",
                  }}
                >
                  {active && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: "var(--neu-accent)" }}
                    />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] neu-muted">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* Save bar */}
      <div
        className="neu-flat sticky bottom-4 flex items-center justify-between gap-3 px-5 py-3"
        style={{ borderRadius: 14 }}
      >
        <div className="text-[12px] neu-muted">
          {err ? (
            <span className="text-red-500 font-medium">{err}</span>
          ) : saved ? (
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--neu-accent)" }}>
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : (
            "New settings apply to the next review request sent."
          )}
        </div>
        <NeuButton variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </NeuButton>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="neu-raised p-4 text-center">
      <div
        className="flex items-center justify-center gap-1.5 mb-1 neu-muted"
        style={{ color: "var(--neu-accent)" }}
      >
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--neu-text)" }}>{value}</p>
      <p className="text-[10px] neu-muted mt-0.5">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "reviewed"
      ? "Reviewed"
      : status === "clicked"
      ? "Clicked"
      : status === "reminder_sent"
      ? "Reminded"
      : status === "email_sent"
      ? "Sent"
      : "Pending";

  return (
    <span
      className="neu-flat text-[10px] font-semibold px-2 py-0.5"
      style={{
        borderRadius: 999,
        color: status === "reviewed" ? "var(--neu-accent)" : "var(--neu-text-muted)",
      }}
    >
      {label}
    </span>
  );
}
