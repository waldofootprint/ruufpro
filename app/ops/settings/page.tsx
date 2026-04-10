"use client";

import { useState, useEffect } from "react";

// ── Connection definitions ─────────────────────────────────────────
interface Connection {
  name: string;
  status: "connected" | "pending" | "disconnected";
  details: string[];
  action?: { label: string; href: string };
}

function buildConnections(twilioBalance: string | null): Connection[] {
  const balanceDisplay = twilioBalance !== null ? `$${parseFloat(twilioBalance).toFixed(2)}` : "Loading...";
  return [
  {
    name: "Twilio",
    status: "connected",
    details: [`ISV brand verified · Balance: ${balanceDisplay}`, "Profile SID: BU532...bd81"],
    action: { label: "Open Twilio →", href: "https://console.twilio.com" },
  },
  {
    name: "Google Maps",
    status: "connected",
    details: ["$300 free trial active", "71 days remaining · ~6,000 lookups left"],
    action: { label: "Check billing →", href: "https://console.cloud.google.com/billing" },
  },
  {
    name: "Inngest",
    status: "connected",
    details: ["7 functions synced", "50,000 free runs/mo"],
    action: { label: "Open Inngest →", href: "https://app.inngest.com" },
  },
  {
    name: "Supabase",
    status: "connected",
    details: ["40 migrations run", "Free tier"],
    action: { label: "Open Supabase →", href: "https://supabase.com/dashboard" },
  },
  {
    name: "Resend",
    status: "connected",
    details: ["ruufpro.com verified", "Transactional emails active"],
    action: { label: "Open Resend →", href: "https://resend.com/overview" },
  },
  {
    name: "Slack",
    status: "connected",
    details: ["5 channels configured", "Webhook URLs in Vercel"],
    action: { label: "Open Slack →", href: "https://app.slack.com" },
  },
  {
    name: "Instantly",
    status: "pending",
    details: ["3 mailboxes warming", "Not sending campaigns yet"],
    action: { label: "Check warmup status →", href: "#" },
  },
  {
    name: "Vercel",
    status: "connected",
    details: ["5 cron jobs active", "Free tier"],
    action: { label: "Open Vercel →", href: "https://vercel.com/dashboard" },
  },
  {
    name: "Stripe",
    status: "disconnected",
    details: ["No payment processing", "Blocks paid tier signups"],
    action: { label: "Connect Stripe →", href: "#" },
  },
];
}

// ── Alert definitions ──────────────────────────────────────────────
interface Alert {
  name: string;
  desc: string;
  channels: ("email" | "slack")[];
  defaultOn: boolean;
}

const ALERTS: Alert[] = [
  { name: "Morning Summary", desc: "Full system health + pipeline stats, daily 7am", channels: ["email", "slack"], defaultOn: true },
  { name: "SMS Failures", desc: "Immediate alert when any SMS fails to deliver", channels: ["email", "slack"], defaultOn: true },
  { name: "Interested Reply", desc: "Prospect replied with interest — needs follow-up", channels: ["email", "slack"], defaultOn: true },
  { name: "Low Twilio Balance", desc: "Alert when balance drops below threshold", channels: ["email"], defaultOn: true },
  { name: "Daily Digest", desc: "SMS health summary, 8am daily", channels: ["email", "slack"], defaultOn: true },
  { name: "Inngest Function Failure", desc: "Any background job crashes or times out", channels: ["email", "slack"], defaultOn: true },
];

// ── Danger zone actions ────────────────────────────────────────────
const DANGER_ACTIONS = [
  { label: "Clear Demo Data", desc: "Remove all 12 seeded demo contractors and 2 test batches", key: "demo" },
  { label: "Reset Pipeline", desc: "Delete all prospect batches, pipeline entries, and gates. Keeps real contractors.", key: "pipeline" },
  { label: "Purge SMS Logs", desc: "Delete all SMS message history. Does not affect Twilio records.", key: "sms" },
];

// ── Default cities ─────────────────────────────────────────────────
const DEFAULT_CITIES = ["Tampa, FL", "Orlando, FL", "Jacksonville, FL", "Miami, FL", "St. Petersburg, FL"];

export default function SettingsPage() {
  const [twilioBalance, setTwilioBalance] = useState<string | null>(null);
  const [alertToggles, setAlertToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(ALERTS.map((a) => [a.name, a.defaultOn]))
  );
  const [scrapeEnabled, setScrapeEnabled] = useState(false);
  const [dailyVolume, setDailyVolume] = useState(100);
  const [cities, setCities] = useState<string[]>(DEFAULT_CITIES);
  const [newCity, setNewCity] = useState("");
  const [addingCity, setAddingCity] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Fetch live data on mount
  useEffect(() => {
    fetch("/api/ops/health")
      .then((r) => r.json())
      .then((data) => {
        if (data.twilio_balance) setTwilioBalance(data.twilio_balance);
      })
      .catch(() => {});
  }, []);

  const connections = buildConnections(twilioBalance);

  function toggleAlert(name: string) {
    setAlertToggles((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function removeCity(city: string) {
    setCities((prev) => prev.filter((c) => c !== city));
  }

  function addCity() {
    const trimmed = newCity.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities((prev) => [...prev, trimmed]);
    }
    setNewCity("");
    setAddingCity(false);
  }

  const connBorderColor = {
    connected: "border-[#34C759]",
    pending: "border-[#FF9F0A] border-dashed",
    disconnected: "border-[#FF3B30] border-dashed",
  };
  const badgeStyle = {
    connected: "bg-[#F0FFF4] text-[#34C759]",
    pending: "bg-[#FFFBEB] text-[#FF9F0A]",
    disconnected: "bg-[#FFF5F5] text-[#FF3B30]",
  };
  const badgeLabel = {
    connected: "Connected",
    pending: "Warming",
    disconnected: "Not Connected",
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-4">
      {/* Page header */}
      <div className="mb-2">
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">Settings</h2>
        <p className="text-[13px] text-[#8E8E93] mt-1">
          Connections, scrape config, alert preferences, and system controls.
        </p>
      </div>

      {/* ═══ SECTION 1: CONNECTIONS ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.04em]">Connections</div>
            <div className="text-[12px] text-[#8E8E93]">External service status</div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-2.5">
            {connections.map((conn) => (
              <div
                key={conn.name}
                className={`p-4 border rounded-[10px] flex flex-col gap-2 ${connBorderColor[conn.status]}`}
              >
                <div className="flex justify-between items-center">
                  <div className="text-[14px] font-semibold">{conn.name}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[10px] uppercase tracking-[0.03em] ${badgeStyle[conn.status]}`}>
                    {badgeLabel[conn.status]}
                  </span>
                </div>
                <div className="text-[11px] text-[#8E8E93] leading-[1.4]">
                  {conn.details.map((d, i) => (
                    <span key={i}>
                      {d}
                      {i < conn.details.length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {conn.action && (
                  <a
                    href={conn.action.href}
                    target={conn.action.href.startsWith("http") ? "_blank" : undefined}
                    rel={conn.action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-[12px] text-[#007AFF] font-medium mt-auto"
                  >
                    {conn.action.label}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: SCRAPE CONFIGURATION ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.04em]">Scrape Configuration</div>
            <div className="text-[12px] text-[#8E8E93]">Auto-scrape settings for prospect pipeline</div>
          </div>
        </div>
        <div className="px-5 py-3">
          {/* Daily Auto-Scrape */}
          <div className="flex items-center py-3 border-b border-[#F2F2F7]">
            <div className="text-[13px] font-medium w-[200px]">Daily Auto-Scrape</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScrapeEnabled(!scrapeEnabled)}
                className={`w-[44px] h-[24px] rounded-full relative transition-colors ${scrapeEnabled ? "bg-[#34C759]" : "bg-[#D1D1D6]"}`}
              >
                <div
                  className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-[left]"
                  style={{ left: scrapeEnabled ? 22 : 2 }}
                />
              </button>
              <span className="text-[11px] text-[#8E8E93]">
                {scrapeEnabled ? "Enabled" : "Currently disabled — enable when template is perfect"}
              </span>
            </div>
          </div>

          {/* Daily Volume */}
          <div className="flex items-center py-3 border-b border-[#F2F2F7]">
            <div className="text-[13px] font-medium w-[200px]">Daily Volume</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dailyVolume}
                onChange={(e) => setDailyVolume(Number(e.target.value))}
                className="w-[80px] px-2.5 py-1.5 border border-[#E5E5EA] rounded-md text-[13px] focus:outline-none focus:border-[#007AFF] transition-colors"
              />
              <span className="text-[11px] text-[#8E8E93]">leads/day (Mon-Fri) · {dailyVolume * 5}/week</span>
            </div>
          </div>

          {/* Target Cities */}
          <div className="flex items-start py-3 border-b border-[#F2F2F7]">
            <div className="text-[13px] font-medium w-[200px] pt-1">Target Cities</div>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => (
                <span
                  key={city}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#F2F2F7] rounded-md text-[12px] text-[#3C3C43]"
                >
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="text-[#8E8E93] hover:text-[#FF3B30] text-[14px] leading-none transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              {addingCity ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); addCity(); }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="City, ST"
                    autoFocus
                    className="w-[120px] px-2 py-1 border border-[#007AFF] rounded-md text-[12px] focus:outline-none"
                  />
                  <button type="submit" className="text-[12px] text-[#007AFF] font-medium">Add</button>
                  <button type="button" onClick={() => { setAddingCity(false); setNewCity(""); }} className="text-[12px] text-[#8E8E93]">Cancel</button>
                </form>
              ) : (
                <button
                  onClick={() => setAddingCity(true)}
                  className="px-2.5 py-1 border border-dashed border-[#D1D1D6] rounded-md text-[12px] text-[#007AFF] hover:border-[#007AFF] transition-colors"
                >
                  + Add city
                </button>
              )}
            </div>
          </div>

          {/* Scrape Schedule */}
          <div className="flex items-center py-3 border-b border-[#F2F2F7]">
            <div className="text-[13px] font-medium w-[200px]">Scrape Schedule</div>
            <div className="text-[13px] text-[#3C3C43]">
              Mon-Fri at 6:00 AM ET
              <span className="text-[11px] text-[#8E8E93] ml-2">(Mon creates new batch, Tue-Fri adds to it)</span>
            </div>
          </div>

          {/* Est. Monthly API Cost */}
          <div className="flex items-center py-3">
            <div className="text-[13px] font-medium w-[200px]">Est. Monthly API Cost</div>
            <div className="text-[13px] font-semibold text-[#3C3C43]">
              $0
              <span className="text-[11px] text-[#8E8E93] font-normal ml-2">(free trial covers ~6,000 lookups)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: ALERT PREFERENCES ═══ */}
      <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#F2F2F7]">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.04em]">Alert Preferences</div>
            <div className="text-[12px] text-[#8E8E93]">What gets sent where</div>
          </div>
        </div>
        <div className="px-5 py-3">
          {ALERTS.map((alert, i) => (
            <div
              key={alert.name}
              className={`flex items-center gap-3 py-2.5 ${i < ALERTS.length - 1 ? "border-b border-[#F2F2F7]" : ""}`}
            >
              <div className="text-[13px] font-medium flex-1">{alert.name}</div>
              <div className="text-[11px] text-[#8E8E93] w-[240px]">{alert.desc}</div>
              <div className="flex gap-1.5">
                {alert.channels.map((ch) => (
                  <span
                    key={ch}
                    className={`text-[10px] font-semibold uppercase tracking-[0.03em] px-2 py-0.5 rounded ${
                      ch === "email" ? "bg-[#F0F5FF] text-[#007AFF]" : "bg-[#F3E8FF] text-[#7C3AED]"
                    }`}
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <button
                onClick={() => toggleAlert(alert.name)}
                className={`w-[44px] h-[24px] rounded-full relative transition-colors ml-2 ${
                  alertToggles[alert.name] ? "bg-[#34C759]" : "bg-[#D1D1D6]"
                }`}
              >
                <div
                  className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-[left]"
                  style={{ left: alertToggles[alert.name] ? 22 : 2 }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 4: DANGER ZONE ═══ */}
      <div className="bg-white border border-[#FF3B30] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#FFE5E5]">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#FF3B30]">Danger Zone</div>
            <div className="text-[12px] text-[#8E8E93]">Destructive actions that can&apos;t be undone</div>
          </div>
        </div>
        <div className="px-5 py-3">
          {DANGER_ACTIONS.map((action, i) => (
            <div
              key={action.key}
              className={`flex justify-between items-center py-2.5 ${i < DANGER_ACTIONS.length - 1 ? "border-b border-[#F2F2F7]" : ""}`}
            >
              <div>
                <div className="text-[13px] font-medium">{action.label}</div>
                <div className="text-[11px] text-[#8E8E93] mt-0.5">{action.desc}</div>
              </div>
              {confirming === action.key ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#FF3B30] font-medium">Are you sure?</span>
                  <button
                    onClick={() => setConfirming(null)}
                    className="text-[12px] text-[#8E8E93] font-medium px-3 py-1.5 rounded-md hover:bg-[#F5F5F7] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: wire up actual delete APIs
                      alert(`${action.label} — not yet implemented`);
                      setConfirming(null);
                    }}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-[#FF3B30] text-white bg-[#FF3B30] hover:bg-[#E0342B] transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(action.key)}
                  className="text-[12px] font-medium px-3.5 py-1.5 rounded-md border border-[#FF3B30] text-[#FF3B30] bg-white hover:bg-[#FFF5F5] transition-colors"
                >
                  {action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-6 text-[11px] text-[#D1D1D6]">
        RuufPro Ops · Settings
      </div>
    </div>
  );
}
