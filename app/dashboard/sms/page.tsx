// SMS & Reviews — Registration progress, OTP verification, Google review URL, SMS settings.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../DashboardContext";
import {
  MessageSquare,
  Star,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Shield,
  Smartphone,
  Check,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

// Registration status matches lib/twilio-10dlc.ts RegistrationStatus type
type RegistrationStatus =
  | "not_started"
  | "profile_pending"
  | "profile_approved"
  | "brand_pending"
  | "brand_otp_required"
  | "brand_approved"
  | "campaign_pending"
  | "campaign_approved"
  | "failed";

interface SmsNumber {
  id: string;
  phone_number: string | null;
  area_code: string | null;
  status: string;
  registration_path: string | null;
  registration_status: RegistrationStatus;
  registration_error: string | null;
  activated_at: string | null;
  created_at: string;
}

// Steps for the visual progress tracker
const REGISTRATION_STEPS = [
  { key: "profile", label: "Trust Profile", desc: "Identity verification" },
  { key: "brand", label: "Brand Registration", desc: "Business verification" },
  { key: "campaign", label: "Campaign Approval", desc: "Carrier review (10-15 days)" },
  { key: "active", label: "SMS Active", desc: "Ready to send" },
];

function getStepProgress(status: RegistrationStatus) {
  switch (status) {
    case "not_started":
      return { step: 0, state: "waiting" as const };
    case "profile_pending":
      return { step: 0, state: "active" as const };
    case "profile_approved":
      return { step: 1, state: "waiting" as const };
    case "brand_pending":
      return { step: 1, state: "active" as const };
    case "brand_otp_required":
      return { step: 1, state: "otp" as const };
    case "brand_approved":
      return { step: 2, state: "waiting" as const };
    case "campaign_pending":
      return { step: 2, state: "active" as const };
    case "campaign_approved":
      return { step: 3, state: "complete" as const };
    case "failed":
      return { step: -1, state: "failed" as const };
    default:
      return { step: 0, state: "waiting" as const };
  }
}

function getStatusMessage(status: RegistrationStatus, path: string | null): { title: string; desc: string; color: string } {
  switch (status) {
    case "not_started":
      return { title: "Not Started", desc: "Start registration to enable SMS features for your business.", color: "slate" };
    case "profile_pending":
      return { title: "Verifying Identity", desc: "Your trust profile is being reviewed. This usually takes a few minutes.", color: "blue" };
    case "profile_approved":
      return { title: "Profile Approved", desc: "Identity verified. Registering your brand with carriers...", color: "blue" };
    case "brand_pending":
      return { title: "Brand Under Review", desc: path === "sole_proprietor" ? "Waiting for carrier verification. Check your phone for a verification code." : "Your brand is being reviewed by carriers. This can take 1-7 days.", color: "amber" };
    case "brand_otp_required":
      return { title: "Verification Code Sent", desc: "A verification code was sent to your mobile phone. Enter it to continue.", color: "amber" };
    case "brand_approved":
      return { title: "Brand Approved", desc: "Setting up your messaging campaign...", color: "blue" };
    case "campaign_pending":
      return { title: "Campaign Under Review", desc: "Carriers are reviewing your messaging campaign. This typically takes 10-15 business days. We'll activate SMS automatically once approved.", color: "amber" };
    case "campaign_approved":
      return { title: "SMS Active", desc: "Your business number is live! SMS features are fully enabled.", color: "emerald" };
    case "failed":
      return { title: "Registration Failed", desc: "Something went wrong. Contact support for help.", color: "red" };
    default:
      return { title: "Unknown", desc: "", color: "slate" };
  }
}

export default function SmsPage() {
  const { contractorId } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [smsNumber, setSmsNumber] = useState<SmsNumber | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [missedCallTextback, setMissedCallTextback] = useState(false);
  const [reviewRequestEnabled, setReviewRequestEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [ssnLast4, setSsnLast4] = useState("");
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpResent, setOtpResent] = useState(false);
  const [messages, setMessages] = useState<{ id: string; direction: string; to_number: string; from_number: string; body: string; message_type: string; status: string; created_at: string }[]>([]);
  const [showAllMessages, setShowAllMessages] = useState(false);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;

      // Load contractor SMS settings
      const { data: contractor } = await supabase
        .from("contractors")
        .select("google_review_url, missed_call_textback_enabled, review_request_enabled")
        .eq("id", contractorId)
        .single();

      if (contractor) {
        setGoogleReviewUrl(contractor.google_review_url || "");
        setMissedCallTextback(contractor.missed_call_textback_enabled || false);
        setReviewRequestEnabled(contractor.review_request_enabled || false);
      }

      // Load SMS number registration status
      const { data: number } = await supabase
        .from("sms_numbers")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (number) {
        setSmsNumber(number as SmsNumber);
      }

      // Load recent SMS messages
      const { data: msgs } = await supabase
        .from("sms_messages")
        .select("id, direction, to_number, from_number, body, message_type, status, created_at")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (msgs) setMessages(msgs);

      setLoading(false);
    }
    load();
  }, [contractorId]);

  async function handleStartRegistration() {
    setRegistering(true);
    setRegisterError("");
    try {
      const res = await fetch("/api/sms/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobilePhone: mobilePhone || undefined,
          ssnLast4: ssnLast4 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error || "Registration failed. Please try again.");
      } else {
        // Reload the SMS number data
        const { data: number } = await supabase
          .from("sms_numbers")
          .select("*")
          .eq("contractor_id", contractorId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (number) setSmsNumber(number as SmsNumber);
      }
    } catch {
      setRegisterError("Network error. Please try again.");
    }
    setRegistering(false);
  }

  async function handleResendOtp() {
    setResendingOtp(true);
    setOtpResent(false);
    try {
      const res = await fetch("/api/sms/resend-otp", { method: "POST" });
      if (res.ok) {
        setOtpResent(true);
        setTimeout(() => setOtpResent(false), 5000);
      }
    } catch {
      // Silent fail — they can try again
    }
    setResendingOtp(false);
  }

  async function handleSave() {
    if (!contractorId) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const { error } = await supabase.from("contractors").update({
      google_review_url: googleReviewUrl || null,
      missed_call_textback_enabled: missedCallTextback,
      review_request_enabled: reviewRequestEnabled,
    }).eq("id", contractorId);

    setSaving(false);
    if (error) {
      setSaveError("Failed to save. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function refreshStatus() {
    if (!contractorId) return;
    const { data: number } = await supabase
      .from("sms_numbers")
      .select("*")
      .eq("contractor_id", contractorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (number) setSmsNumber(number as SmsNumber);
  }

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading SMS settings...</div>;
  }

  const regStatus = smsNumber?.registration_status || "not_started";
  const { step: currentStep, state: stepState } = getStepProgress(regStatus);
  const statusInfo = getStatusMessage(regStatus, smsNumber?.registration_path || null);
  const isActive = regStatus === "campaign_approved";
  const isRegistering = regStatus !== "not_started" && regStatus !== "campaign_approved" && regStatus !== "failed";

  return (
    <div className="max-w-[640px] mx-auto space-y-5">
      <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">SMS & Reviews</h1>

      {/* Registration Status Card */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Business Number</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Your dedicated SMS number for automated texts & reviews</p>
          </div>
          {isRegistering && (
            <button onClick={refreshStatus} className="text-slate-400 hover:text-slate-600 transition-colors" title="Refresh status">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          {/* Status Banner */}
          <div className={`rounded-lg px-4 py-3 mb-5 bg-${statusInfo.color}-50 border border-${statusInfo.color}-100`}>
            <div className="flex items-start gap-3">
              {regStatus === "campaign_approved" ? (
                <CheckCircle2 className={`w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5`} />
              ) : regStatus === "failed" ? (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : regStatus === "not_started" ? (
                <MessageSquare className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-[13px] font-bold text-${statusInfo.color}-700`}>{statusInfo.title}</p>
                <p className={`text-[12px] text-${statusInfo.color}-600 mt-0.5`}>{statusInfo.desc}</p>
              </div>
            </div>
          </div>

          {/* Phone Number Display (when active) */}
          {isActive && smsNumber?.phone_number && (
            <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="text-[15px] font-bold text-emerald-700 tracking-wide">{smsNumber.phone_number}</span>
              <span className="text-[11px] text-emerald-500 ml-auto">Local 10DLC</span>
            </div>
          )}

          {/* Progress Stepper */}
          {regStatus !== "not_started" && regStatus !== "failed" && (
            <div className="space-y-0">
              {REGISTRATION_STEPS.map((step, i) => {
                const isCompleted = i < currentStep || (i === currentStep && stepState === "complete");
                const isCurrent = i === currentStep && stepState !== "complete";
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    {/* Step indicator line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isCurrent
                            ? "bg-blue-500 ring-4 ring-blue-100"
                            : "bg-slate-200"
                      }`}>
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : isCurrent ? (
                          stepState === "otp" ? (
                            <Smartphone className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                          )
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                      </div>
                      {i < REGISTRATION_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 ${isCompleted ? "bg-emerald-300" : "bg-slate-200"}`} />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="pt-1 pb-4">
                      <p className={`text-[13px] font-semibold ${
                        isCompleted ? "text-emerald-600" : isCurrent ? "text-blue-700" : "text-slate-400"
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-[11px] ${
                        isCompleted ? "text-emerald-500" : isCurrent ? "text-blue-500" : "text-slate-300"
                      }`}>
                        {isCompleted ? "Complete" : step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* OTP Verification Section */}
          {regStatus === "brand_otp_required" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mt-2">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-amber-800">Check Your Phone</p>
                  <p className="text-[12px] text-amber-600 mt-1">
                    A 6-digit verification code was sent to your mobile number.
                    Enter the code in the text message to verify your business. The code expires in 24 hours.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleResendOtp}
                      disabled={resendingOtp || otpResent}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 text-[12px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {resendingOtp ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</>
                      ) : otpResent ? (
                        <><Check className="w-3 h-3" /> Code Resent</>
                      ) : (
                        <><RefreshCw className="w-3 h-3" /> Resend Code</>
                      )}
                    </button>
                    <button
                      onClick={refreshStatus}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 text-[12px] font-semibold text-amber-700 hover:bg-amber-100 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Check Status
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-500 mt-2">
                    Reply to the text message with the code. Then tap &quot;Check Status&quot; above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed State */}
          {regStatus === "failed" && smsNumber?.registration_error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-[12px] text-red-600">{smsNumber.registration_error}</p>
              <button
                onClick={handleStartRegistration}
                disabled={registering}
                className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {registering ? "Retrying..." : "Retry Registration"}
              </button>
            </div>
          )}

          {/* Start Registration */}
          {regStatus === "not_started" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must be a real carrier number (not Google Voice). Used for one-time verification only.
                </p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                  Last 4 Digits of SSN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={ssnLast4}
                  onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-24 px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Required by carriers to verify your identity. Sent securely to the carrier registry — never stored by RuufPro.
                </p>
              </div>
              <button
                onClick={handleStartRegistration}
                disabled={registering}
                className="w-full px-5 py-3.5 rounded-xl bg-slate-800 text-[13px] font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {registering ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Setting Up...</>
                ) : (
                  <><Shield className="w-4 h-4" /> Set Up Business Number</>
                )}
              </button>
              {registerError && (
                <p className="text-[12px] text-red-500 mt-2 text-center">{registerError}</p>
              )}
              <p className="text-[11px] text-slate-400 text-center">
                We&apos;ll register a local phone number matching your area code.
                Carrier review takes 10-15 business days.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Google Review URL */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Google Reviews</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Auto-request reviews from happy customers via SMS</p>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
              Google Review Link
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-[14px] text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/your-business/review"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Find this in your Google Business Profile under &quot;Ask for reviews&quot;
            </p>
          </div>
        </div>
      </div>

      {/* SMS Feature Toggles */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">SMS Automations</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isActive ? "Toggle automations on or off" : "These activate once your business number is approved"}
          </p>
        </div>
        <div className="p-5 space-y-1">
          {/* Review Requests */}
          <label className={`flex items-center gap-3 p-3 rounded-lg transition-colors -mx-1 ${isActive ? "hover:bg-slate-50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
            <button
              type="button"
              disabled={!isActive}
              onClick={() => setReviewRequestEnabled(!reviewRequestEnabled)}
              className={`w-10 h-6 rounded-full flex-shrink-0 flex items-center transition-all px-0.5 ${
                reviewRequestEnabled && isActive ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[13px] font-semibold text-slate-800">Auto Review Requests</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Send a review request SMS when a job is marked &quot;completed&quot;</p>
            </div>
          </label>

          {/* Missed Call Textback */}
          <label className={`flex items-center gap-3 p-3 rounded-lg transition-colors -mx-1 ${isActive ? "hover:bg-slate-50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
            <button
              type="button"
              disabled={!isActive}
              onClick={() => setMissedCallTextback(!missedCallTextback)}
              className={`w-10 h-6 rounded-full flex-shrink-0 flex items-center transition-all px-0.5 ${
                missedCallTextback && isActive ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[13px] font-semibold text-slate-800">Missed Call Text-Back</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Auto-text callers you miss: &quot;Sorry I missed your call, can I help via text?&quot;</p>
            </div>
          </label>
        </div>
      </div>

      {/* SMS Message Log */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50">
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Message Log</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {messages.length > 0 ? `${messages.length} message${messages.length !== 1 ? "s" : ""}` : "No messages yet"}
          </p>
        </div>
        {messages.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {(showAllMessages ? messages : messages.slice(0, 10)).map((msg) => {
              const isOutbound = msg.direction === "outbound";
              const typeLabels: Record<string, string> = {
                review_request: "Review Request",
                missed_call_textback: "Missed Call",
                follow_up: "Follow-Up",
                on_my_way: "On My Way",
                status_update: "Status Update",
                manual: "Manual",
                system: "System",
              };
              return (
                <div key={msg.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isOutbound ? "bg-blue-50" : "bg-emerald-50"
                  }`}>
                    {isOutbound ? (
                      <ArrowUpRight className="w-3 h-3 text-blue-500" />
                    ) : (
                      <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-700">
                        {isOutbound ? `To ${msg.to_number}` : `From ${msg.from_number}`}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                        msg.status === "delivered" ? "bg-emerald-50 text-emerald-600" :
                        msg.status === "failed" ? "bg-red-50 text-red-600" :
                        msg.status === "received" ? "bg-blue-50 text-blue-600" :
                        "bg-slate-50 text-slate-500"
                      }`}>
                        {msg.status}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                        {typeLabels[msg.message_type] || msg.message_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{msg.body}</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {messages.length > 10 && !showAllMessages && (
              <button
                onClick={() => setShowAllMessages(true)}
                className="w-full px-5 py-3 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Show all {messages.length} messages
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <MessageSquare className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">Messages will appear here once SMS is active</p>
          </div>
        )}
      </div>

      {/* Save */}
      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] text-red-600 font-medium">
          {saveError}
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-slate-800 text-[13px] font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {saving ? "Saving..." : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
