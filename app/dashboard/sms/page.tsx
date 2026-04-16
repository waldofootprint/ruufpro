// SMS & Reviews — Registration, settings, and two-way conversation UI.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Send,
  ArrowLeft,
  User,
  ChevronRight,
} from "lucide-react";

// Translate raw Twilio/TCR errors to plain English for roofers
function translateRegistrationError(raw: string): string {
  const errorMap: Record<string, string> = {
    "EIN mismatch": "The EIN you entered doesn't match what's on file. Double-check your number and try again.",
    "EIN not found": "We couldn't find your EIN. Make sure it's correct and matches your IRS records.",
    "Insufficient data": "Some required information is missing. Please fill in all fields in your business profile.",
    "Brand creation failed": "We couldn't register your business. Please check your details and try again.",
    "Campaign creation failed": "Your messaging campaign couldn't be created. This usually resolves — try again in a few minutes.",
    "OTP verification failed": "The verification code didn't match. Request a new code and try again.",
    "TWILIO_PRIMARY_PROFILE_SID": "System configuration issue — please contact support.",
  };
  for (const [key, msg] of Object.entries(errorMap)) {
    if (raw.includes(key)) return msg;
  }
  return `Registration issue: ${raw}. If this persists, contact support.`;
}

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
  compliance_website_url: string | null;
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
      return { title: "Brand Approved", desc: "Paste the A2P Wizard compliance URL below to continue registration.", color: "blue" };
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

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function SmsPage() {
  const { contractorId } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [messages, setMessages] = useState<{ id: string; direction: string; to_number: string; from_number: string; body: string; message_type: string; status: string; created_at: string; read_at: string | null; lead_id: string | null }[]>([]);
  const [leads, setLeads] = useState<Record<string, { name: string; phone: string }>>({});
  const [complianceUrl, setComplianceUrl] = useState("");
  const [savingCompliance, setSavingCompliance] = useState(false);
  const [complianceSaved, setComplianceSaved] = useState(false);
  const [complianceError, setComplianceError] = useState("");
  // Pre-flight: missing fields that block registration
  const [missingFields, setMissingFields] = useState<string[]>([]);
  // Conversation UI state
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!contractorId) return;
      setLoadError(null);

      try {
      // Load contractor SMS settings + fields needed for pre-flight check
      const { data: contractor } = await supabase
        .from("contractors")
        .select("google_review_url, missed_call_textback_enabled, review_request_enabled, legal_entity_type, ein, address, zip, owner_first_name, owner_last_name, phone")
        .eq("id", contractorId)
        .single();

      if (contractor) {
        setGoogleReviewUrl(contractor.google_review_url || "");
        setMissedCallTextback(contractor.missed_call_textback_enabled || false);
        setReviewRequestEnabled(contractor.review_request_enabled || false);

        // Pre-flight: check which fields are missing for SMS registration
        const missing: string[] = [];
        if (!contractor.legal_entity_type) missing.push("Business type (LLC, Corporation, or Sole Proprietor)");
        if (contractor.legal_entity_type && contractor.legal_entity_type !== "sole_proprietor" && !contractor.ein) missing.push("EIN");
        if (!contractor.address) missing.push("Street address");
        if (!contractor.zip) missing.push("ZIP code");
        if (!contractor.owner_first_name || !contractor.owner_last_name) missing.push("Owner name");
        if (!contractor.phone) missing.push("Business phone number");
        setMissingFields(missing);
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
        setComplianceUrl(number.compliance_website_url || "");
      }

      // Load SMS messages (all, for conversation grouping)
      const { data: msgs } = await supabase
        .from("sms_messages")
        .select("id, direction, to_number, from_number, body, message_type, status, created_at, read_at, lead_id")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (msgs) setMessages(msgs);

      // Load lead names for phone number display
      const { data: leadData } = await supabase
        .from("leads")
        .select("id, name, phone")
        .eq("contractor_id", contractorId)
        .not("phone", "is", null);
      if (leadData) {
        const map: Record<string, { name: string; phone: string }> = {};
        leadData.forEach((l) => { if (l.phone) map[l.phone] = { name: l.name, phone: l.phone }; });
        setLeads(map);
      }

      setLoading(false);
      } catch (err: any) {
        console.error("SMS page load error:", err);
        setLoadError("Failed to load SMS settings. Please try refreshing the page.");
        setLoading(false);
      }
    }
    load();
  }, [contractorId]);

  // Auto-poll registration status every 30s while in a pending state.
  // Contractor doesn't have to manually click "Refresh" — it just updates.
  useEffect(() => {
    if (!contractorId || !smsNumber) return;
    const pendingStatuses = ["profile_pending", "profile_approved", "brand_pending", "brand_otp_required", "campaign_pending"];
    if (!pendingStatuses.includes(smsNumber.registration_status)) return;

    const interval = setInterval(async () => {
      const { data: number } = await supabase
        .from("sms_numbers")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (number) {
        const updated = number as SmsNumber;
        // Only update if status actually changed (prevents unnecessary re-renders)
        if (updated.registration_status !== smsNumber.registration_status) {
          setSmsNumber(updated);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [contractorId, smsNumber?.registration_status]);

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

  async function handleSaveComplianceUrl() {
    if (!contractorId || !smsNumber) return;
    setSavingCompliance(true);
    setComplianceSaved(false);

    const { error } = await supabase
      .from("sms_numbers")
      .update({ compliance_website_url: complianceUrl || null })
      .eq("contractor_id", contractorId);

    if (error) {
      setComplianceError("Failed to save compliance URL. Please try again.");
      setSavingCompliance(false);
      return;
    }
    setComplianceError("");

    setComplianceSaved(true);
    setSmsNumber({ ...smsNumber, compliance_website_url: complianceUrl || null });

    // Auto-trigger campaign registration immediately instead of waiting for daily cron.
    // Only if brand is approved and we just saved a valid URL.
    if (smsNumber.registration_status === "brand_approved" && complianceUrl) {
      try {
        const res = await fetch("/api/sms/submit-campaign", { method: "POST" });
        if (res.ok) {
          // Refresh status to show campaign_pending
          await refreshStatus();
        }
      } catch {
        // Non-blocking — daily cron will pick it up as fallback
      }
    }

    setSavingCompliance(false);
    setTimeout(() => setComplianceSaved(false), 3000);
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

  // Build conversations grouped by the "other party" phone number
  const conversations = (() => {
    const map = new Map<string, { phone: string; lastMessage: string; lastTime: string; unreadCount: number; direction: string }>();
    // Messages are newest-first, so first occurrence = latest message per phone
    messages.forEach((msg) => {
      const otherPhone = msg.direction === "outbound" ? msg.to_number : msg.from_number;
      if (!map.has(otherPhone)) {
        const unread = messages.filter(
          (m) => m.direction === "inbound" && m.from_number === otherPhone && !m.read_at
        ).length;
        map.set(otherPhone, {
          phone: otherPhone,
          lastMessage: msg.body,
          lastTime: msg.created_at,
          unreadCount: unread,
          direction: msg.direction,
        });
      }
    });
    return Array.from(map.values());
  })();

  // Thread messages for selected conversation (chronological)
  const threadMessages = selectedPhone
    ? messages
        .filter((m) => {
          const otherPhone = m.direction === "outbound" ? m.to_number : m.from_number;
          return otherPhone === selectedPhone;
        })
        .reverse()
    : [];

  // Get display name for a phone number
  function getContactName(phone: string): string {
    return leads[phone]?.name || phone;
  }

  // Mark messages as read when opening a conversation
  const markAsRead = useCallback(async (phone: string) => {
    const hasUnread = messages.some(
      (m) => m.direction === "inbound" && m.from_number === phone && !m.read_at
    );
    if (!hasUnread) return;

    try {
      await fetch("/api/sms/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.direction === "inbound" && m.from_number === phone && !m.read_at
            ? { ...m, read_at: new Date().toISOString() }
            : m
        )
      );
    } catch {
      // Silent — will mark on next load
    }
  }, [messages]);

  // Open a conversation
  function openConversation(phone: string) {
    setSelectedPhone(phone);
    setReplyText("");
    markAsRead(phone);
    // Scroll to bottom after render
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  // Send a manual reply
  async function handleSendReply() {
    if (!selectedPhone || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/sms/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedPhone, body: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        // Add to local state immediately
        setMessages((prev) => [
          {
            id: crypto.randomUUID(),
            direction: "outbound",
            to_number: selectedPhone,
            from_number: "",
            body: replyText.trim(),
            message_type: "manual",
            status: "sent",
            created_at: new Date().toISOString(),
            read_at: null,
            lead_id: null,
          },
          ...prev,
        ]);
        setReplyText("");
        setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        alert(data.error || "Failed to send reply");
      }
    } catch {
      alert("Network error — please try again");
    }
    setSending(false);
  }

  if (loading) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading SMS settings...</div>;
  }

  if (loadError) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 text-sm mb-3">{loadError}</p>
        <button onClick={() => { setLoading(true); setLoadError(null); window.location.reload(); }} className="text-sm text-amber-500 hover:text-amber-400 underline">
          Try again
        </button>
      </div>
    );
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
                  <p className="text-[13px] font-bold text-amber-800">Verify Your Phone Number</p>
                  <p className="text-[12px] text-amber-600 mt-1 leading-relaxed">
                    We sent a <strong>6-digit code</strong> to your mobile number via text message.
                  </p>
                  <ol className="text-[12px] text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Open your <strong>SMS/text messages</strong> app on your phone</li>
                    <li>Find the text from Twilio with your 6-digit code</li>
                    <li><strong>Reply to that text</strong> with just the code (e.g. &quot;123456&quot;)</li>
                  </ol>
                  <p className="text-[11px] text-amber-500 mt-2">
                    This page updates automatically — once verified, you&apos;ll see the next step appear.
                    Code expires in 24 hours.
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* A2P Compliance URL — shows when brand is approved and waiting for URL */}
          {regStatus === "brand_approved" && !smsNumber?.compliance_website_url && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mt-2">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-blue-800">Compliance Website Needed</p>
                  <p className="text-[12px] text-blue-600 mt-1">
                    Your brand is approved! Before we can register your messaging campaign, paste the A2P Wizard compliance URL below.
                  </p>
                  <div className="mt-3 space-y-2">
                    <input
                      type="url"
                      value={complianceUrl}
                      onChange={(e) => setComplianceUrl(e.target.value)}
                      placeholder="https://yourbusiness.nebulabrandgroup.com"
                      className="w-full px-3 py-2.5 rounded-lg border border-blue-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveComplianceUrl}
                        disabled={savingCompliance || !complianceUrl}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        {savingCompliance ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                        ) : complianceSaved ? (
                          <><Check className="w-3 h-3" /> Saved</>
                        ) : (
                          "Save Compliance URL"
                        )}
                      </button>
                      <a
                        href="https://www.a2pwizard.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg border border-blue-200 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" /> Open A2P Wizard
                      </a>
                    </div>
                    {complianceError && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{complianceError}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-blue-500 mt-2">
                    Once saved, the system will automatically submit the campaign registration on the next daily check.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed State */}
          {regStatus === "failed" && smsNumber?.registration_error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-[12px] text-red-600">{translateRegistrationError(smsNumber.registration_error)}</p>
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
              {/* Pre-flight: show missing fields before they hit the button */}
              {missingFields.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[13px] font-bold text-amber-800 mb-2">Complete your business details first</p>
                  <p className="text-[12px] text-amber-600 mb-2">These fields are required for carrier registration:</p>
                  <ul className="text-[12px] text-amber-700 space-y-1">
                    {missingFields.map((field) => (
                      <li key={field} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        {field}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/onboarding"
                    className="inline-block mt-3 px-4 py-2 rounded-lg bg-amber-600 text-[12px] font-semibold text-white hover:bg-amber-700 transition-all"
                  >
                    Go to Business Details →
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                    Your business details (name, address, EIN) from your profile will be used for carrier verification.
                  </p>
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
                    Carrier review typically takes 2-5 business days.
                  </p>
                </>
              )}
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
          <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors -mx-1 ${isActive ? "hover:bg-slate-50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
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
          </div>

          {/* Missed Call Textback — PARKED FOR LAUNCH (April 11 2026)
              Disabled until $10K MRR + TCPA legal review. No prior consent from callers.
              To re-enable: uncomment this toggle + Inngest function + voice webhook event.
          <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors -mx-1 ${isActive ? "hover:bg-slate-50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
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
          </div>
          */}
        </div>
      </div>

      {/* Conversations */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
              {selectedPhone ? (
                <button onClick={() => setSelectedPhone(null)} className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {getContactName(selectedPhone)}
                </button>
              ) : (
                "Conversations"
              )}
            </h2>
            {!selectedPhone && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {conversations.length > 0
                  ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
                  : "No messages yet"}
              </p>
            )}
            {selectedPhone && (
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedPhone}</p>
            )}
          </div>
        </div>

        {/* Conversation List */}
        {!selectedPhone && (
          conversations.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {conversations.map((conv) => (
                <button
                  key={conv.phone}
                  onClick={() => openConversation(conv.phone)}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-semibold truncate ${conv.unreadCount > 0 ? "text-slate-900" : "text-slate-700"}`}>
                        {getContactName(conv.phone)}
                      </span>
                      <span className="text-[10px] text-slate-300 ml-auto flex-shrink-0">
                        {formatRelativeTime(conv.lastTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-[11px] truncate flex-1 ${conv.unreadCount > 0 ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                        {conv.direction === "outbound" && <span className="text-slate-300">You: </span>}
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <MessageSquare className="w-6 h-6 text-slate-200 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">Messages will appear here once SMS is active</p>
            </div>
          )
        )}

        {/* Thread View */}
        {selectedPhone && (
          <div className="flex flex-col">
            {/* Messages */}
            <div className="max-h-[400px] overflow-y-auto px-4 py-4 space-y-2">
              {threadMessages.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-8">No messages in this conversation</p>
              ) : (
                threadMessages.map((msg) => {
                  const isOutbound = msg.direction === "outbound";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                          isOutbound
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <p className="text-[13px] leading-relaxed break-words">{msg.body}</p>
                        <div className={`flex items-center gap-1.5 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[9px] ${isOutbound ? "text-blue-200" : "text-slate-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                          {isOutbound && (
                            <span className={`text-[9px] ${
                              msg.status === "delivered" ? "text-blue-200" :
                              msg.status === "failed" ? "text-red-300" :
                              "text-blue-300"
                            }`}>
                              {msg.status === "delivered" ? "✓✓" : msg.status === "failed" ? "✗" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Reply Composer */}
            {isActive && (
              <div className="border-t border-slate-100 px-4 py-3 flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 transition-all flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
            {!isActive && (
              <div className="border-t border-slate-100 px-4 py-3 text-center">
                <p className="text-[11px] text-slate-400">Replying is available once your business number is approved</p>
              </div>
            )}
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
