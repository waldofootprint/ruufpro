// Reviews — Manage Google review automation.
// Contractors customize their review request email and enable/disable automation.
// Pro+ tier only.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import { Star, Check, ExternalLink, Eye, Send, TrendingUp, MousePointerClick, MessageSquare, Users, Loader2 } from "lucide-react";

const DEFAULT_SUBJECT = "How was your experience with {{business_name}}?";
const DEFAULT_HEADING = "Thanks for choosing {{business_name}}!";
const DEFAULT_BODY = "We hope everything went well. If you have a minute, a quick review would really help us out.";
const DEFAULT_BUTTON = "⭐ Leave a Review";

export default function ReviewsPage() {
  const { contractorId, tier } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Settings
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [businessName, setBusinessName] = useState("");

  // Email customization
  const [emailSubject, setEmailSubject] = useState(DEFAULT_SUBJECT);
  const [emailHeading, setEmailHeading] = useState(DEFAULT_HEADING);
  const [emailBody, setEmailBody] = useState(DEFAULT_BODY);
  const [emailButton, setEmailButton] = useState(DEFAULT_BUTTON);
  const [emailDelay, setEmailDelay] = useState("immediate");

  // Review stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [batchSending, setBatchSending] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;

      const { data } = await supabase
        .from("contractors")
        .select("business_name, google_review_url, review_request_enabled, review_email_subject, review_email_heading, review_email_body, review_email_button, review_email_delay")
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
    }
    load();
  }, [contractorId]);

  // Fetch review analytics
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/review-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch { /* silent */ }
      setStatsLoading(false);
    }
    if (contractorId && tier !== "free") loadStats();
  }, [contractorId, tier]);

  async function handleBatchSend() {
    if (!stats?.unrequested_completed || batchSending) return;
    if (!window.confirm(`Send review request emails to ${stats.unrequested_completed} completed jobs?`)) return;

    setBatchSending(true);
    setBatchResult(null);
    try {
      // Fetch the actual lead IDs for unrequested completed jobs
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
        setBatchResult(`${data.queued} review request${data.queued === 1 ? "" : "s"} queued!${data.skipped > 0 ? ` (${data.skipped} already requested)` : ""}`);
        // Refresh stats
        const refreshRes = await fetch("/api/dashboard/review-stats");
        if (refreshRes.ok) setStats(await refreshRes.json());
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

    await supabase
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
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Replace {{business_name}} in preview
  function preview(text: string) {
    return text.replace(/\{\{business_name\}\}/g, businessName || "Your Business");
  }

  // Tier gate
  if (tier === "free") {
    return (
      <div className="max-w-[480px] mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <Star className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-[18px] font-extrabold text-slate-800">Google Reviews — Pro Feature</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[360px] mx-auto">
          Automatically email homeowners after every completed job asking for a Google review. Customize the email, set the timing, and watch your 5-star reviews stack up.
        </p>
        <p className="text-[13px] font-semibold text-amber-600">Requires the $149/mo Pro plan.</p>
        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: "pro_monthly" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg text-[13px] font-semibold hover:bg-amber-700 transition"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Reviews</h1>
      <p className="text-[13px] text-slate-500 mb-6">
        Automatically request Google reviews after every completed job.
      </p>

      {/* Review Analytics */}
      {!statsLoading && stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Sent</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.total_sent}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stats.this_month.sent} this month</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Clicked</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.total_clicked}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stats.click_rate}% click rate</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Reviewed</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.total_reviewed}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stats.review_rate}% review rate</p>
            </div>
          </div>

          {/* Batch CTA — unrequested completed jobs */}
          {stats.unrequested_completed > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4.5 h-4.5 text-amber-600" />
                  <div>
                    <p className="text-[13px] font-bold text-amber-800">
                      {stats.unrequested_completed} completed job{stats.unrequested_completed === 1 ? "" : "s"} with no review request
                    </p>
                    <p className="text-[11px] text-amber-600 mt-0.5">Send review requests to grow your Google rating</p>
                  </div>
                </div>
                <button
                  onClick={handleBatchSend}
                  disabled={batchSending}
                  className="px-3.5 py-2 bg-amber-600 text-white rounded-lg text-[12px] font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                >
                  {batchSending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</> : "Send to All"}
                </button>
              </div>
              {batchResult && (
                <p className={`text-[12px] mt-2.5 font-medium ${batchResult.includes("queued") ? "text-emerald-600" : "text-slate-500"}`}>
                  {batchResult}
                </p>
              )}
            </div>
          )}

          {/* Recent activity */}
          {stats.recent_requests.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Recent Requests</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {stats.recent_requests.slice(0, 5).map((req: any, i: number) => (
                  <div key={req.id || i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">{req.lead_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {req.sent_at ? new Date(req.sent_at).toLocaleDateString() : "Pending"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      req.status === "reviewed" ? "bg-emerald-50 text-emerald-600" :
                      req.status === "clicked" ? "bg-blue-50 text-blue-600" :
                      req.status === "email_sent" || req.status === "reminder_sent" ? "bg-amber-50 text-amber-600" :
                      "bg-slate-50 text-slate-400"
                    }`}>
                      {req.status === "reviewed" ? "Reviewed" :
                       req.status === "clicked" ? "Clicked" :
                       req.status === "reminder_sent" ? "Reminded" :
                       req.status === "email_sent" ? "Sent" :
                       "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Master toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[14px] font-bold text-slate-800">Auto Review Requests</p>
              <p className="text-[11px] text-slate-400">
                Email homeowners when you mark a job &quot;completed&quot;
              </p>
            </div>
          </div>
          <button
            onClick={() => setReviewEnabled(!reviewEnabled)}
            className={`w-11 h-6 rounded-full flex items-center transition-all px-0.5 ${
              reviewEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* Google Review URL */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          Google Review Link
        </label>
        <input
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none transition"
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          placeholder="https://g.page/r/your-business/review"
        />
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Find this in your Google Business Profile → &quot;Ask for reviews&quot;
        </p>
      </div>

      {/* Email Customization */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800">Customize Your Email</h2>
            <p className="text-[11px] text-slate-400">Use {"{{business_name}}"} to insert your business name</p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>

        {showPreview ? (
          /* Live preview */
          <div className="p-5 bg-slate-50">
            <div className="bg-white rounded-xl border border-slate-200 max-w-[400px] mx-auto overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5">
                <p className="text-[10px] text-slate-400">From: {businessName} via RuufPro</p>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{preview(emailSubject)}</p>
              </div>
              <div className="px-6 py-6 text-center">
                <p className="text-[14px] font-semibold text-slate-800 mb-2">{preview(emailHeading)}</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-5">{preview(emailBody)}</p>
                <div className="bg-blue-600 text-white text-[13px] font-semibold py-2.5 px-5 rounded-lg inline-block">
                  {emailButton}
                </div>
                <p className="text-[9px] text-slate-300 mt-4">Sent on behalf of {businessName} · Powered by RuufPro</p>
              </div>
            </div>
          </div>
        ) : (
          /* Edit form */
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Subject Line
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:border-slate-400 focus:outline-none transition"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Heading
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:border-slate-400 focus:outline-none transition"
                value={emailHeading}
                onChange={(e) => setEmailHeading(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Message
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:border-slate-400 focus:outline-none transition resize-none"
                rows={3}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Button Text
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 focus:border-slate-400 focus:outline-none transition"
                value={emailButton}
                onChange={(e) => setEmailButton(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timing */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          When to Send
        </label>
        <div className="space-y-2">
          {[
            { value: "immediate", label: "Immediately", desc: "As soon as you mark the job complete" },
            { value: "1_hour", label: "1 hour later", desc: "Give them time to settle in" },
            { value: "1_day", label: "Next day", desc: "Wait until the next morning" },
            { value: "3_days", label: "3 days later", desc: "Let the work speak for itself first" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                emailDelay === opt.value ? "border-amber-300 bg-amber-50" : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="delay"
                value={opt.value}
                checked={emailDelay === opt.value}
                onChange={(e) => setEmailDelay(e.target.value)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                emailDelay === opt.value ? "border-amber-500" : "border-slate-300"
              }`}>
                {emailDelay === opt.value && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{opt.label}</p>
                <p className="text-[11px] text-slate-400">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Reminder email info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <Send className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-slate-700">Automatic reminder</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              If they don&apos;t click within 3 days, we send one gentle reminder. That&apos;s it — no spam.
            </p>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 -mx-5 px-5 py-3 lg:-mx-8 lg:px-8 flex items-center justify-between z-10">
        <div className="text-[12px]">
          {saved && (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-slate-800 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-900 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
