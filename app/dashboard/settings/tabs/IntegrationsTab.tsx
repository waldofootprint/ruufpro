"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Link2, Send, Unlink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboard } from "../../DashboardContext";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { NeuInput } from "@/components/dashboard/settings/NeuInput";
import { NeuToggle } from "@/components/dashboard/settings/NeuToggle";
import { NeuButton } from "@/components/dashboard/settings/NeuButton";

interface CrmConnection {
  id: string;
  provider: string;
  status: string;
  connected_at: string;
}

const CRM_PROVIDERS = [
  {
    id: "jobber" as const,
    name: "Jobber",
    accent: "#7AC142",
    authUrl: "https://api.getjobber.com/api/oauth/authorize",
    desc: "New leads auto-appear in Jobber — zero setup",
  },
];

const COMING_SOON = [
  { name: "Housecall Pro", accent: "#026CDF" },
  { name: "ServiceTitan", accent: "#EC1C2F" },
  { name: "AccuLynx", accent: "#00AEEF" },
];

export function IntegrationsTab() {
  const { contractorId } = useDashboard();
  const searchParams = useSearchParams();
  const crmConnected = searchParams.get("crm_connected");
  const crmError = searchParams.get("crm_error");

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<CrmConnection[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "success" | "error" | undefined>>({});

  // Webhook
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookExpanded, setWebhookExpanded] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookResult, setWebhookResult] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!contractorId) return;
    (async () => {
      const [connsRes, contractorRes] = await Promise.all([
        supabase
          .from("crm_connections")
          .select("id, provider, status, connected_at")
          .eq("contractor_id", contractorId)
          .eq("status", "active"),
        supabase.from("contractors").select("webhook_url, webhook_enabled").eq("id", contractorId).single(),
      ]);
      setConnections(connsRes.data || []);
      if (contractorRes.data) {
        setWebhookUrl(contractorRes.data.webhook_url || "");
        setWebhookEnabled(contractorRes.data.webhook_enabled || false);
      }
      setLoading(false);
    })();
  }, [contractorId]);

  function handleConnect(provider: (typeof CRM_PROVIDERS)[number]) {
    const clientId =
      provider.id === "jobber" ? process.env.NEXT_PUBLIC_JOBBER_CLIENT_ID : undefined;
    const redirectUri = `${window.location.origin}/api/integrations/callback`;
    const state = `${contractorId}:${provider.id}`;
    const url = `${provider.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&state=${encodeURIComponent(state)}`;
    window.location.href = url;
  }

  async function handleDisconnect(connId: string) {
    setDisconnecting(connId);
    await supabase
      .from("crm_connections")
      .update({ status: "disconnected", disconnected_at: new Date().toISOString() })
      .eq("id", connId);
    setConnections((p) => p.filter((c) => c.id !== connId));
    setDisconnecting(null);
  }

  async function handleTestLead(providerId: string) {
    setTesting(providerId);
    setTestResult((p) => ({ ...p, [providerId]: undefined }));
    try {
      const resp = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorId, provider: providerId }),
      });
      setTestResult((p) => ({ ...p, [providerId]: resp.ok ? "success" : "error" }));
    } catch {
      setTestResult((p) => ({ ...p, [providerId]: "error" }));
    }
    setTesting(null);
    setTimeout(() => setTestResult((p) => ({ ...p, [providerId]: undefined })), 4000);
  }

  async function handleWebhookTest() {
    if (!webhookUrl) return;
    setWebhookTesting(true);
    setWebhookResult(null);
    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lead.created",
          timestamp: new Date().toISOString(),
          test: true,
          tags: ["RuufPro", "Estimate Widget"],
          contractor: { id: contractorId, business_name: "Test Business" },
          lead: {
            name: "Test Lead",
            phone: "(555) 123-4567",
            email: "test@example.com",
            address: "123 Main St",
            source: "estimate_widget",
            timeline: "1_3_months",
            estimate: { low: 8500, high: 12000, material: "asphalt", roof_sqft: 2100 },
          },
        }),
      });
      setWebhookResult(resp.ok ? "success" : "error");
    } catch {
      setWebhookResult("error");
    }
    setWebhookTesting(false);
    setTimeout(() => setWebhookResult(null), 4000);
  }

  async function handleSaveWebhook() {
    if (!contractorId) return;
    setSaving(true);
    await supabase
      .from("contractors")
      .update({ webhook_url: webhookUrl || null, webhook_enabled: webhookEnabled })
      .eq("id", contractorId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return <div className="py-12 text-center text-sm neu-muted">Loading integrations…</div>;
  }

  return (
    <div className="space-y-5">
      {crmConnected && (
        <div className="neu-flat px-4 py-3 flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--neu-accent)", borderRadius: 12 }}>
          <Check className="h-4 w-4" />
          {crmConnected === "jobber" ? "Jobber" : "Housecall Pro"} connected — new leads will auto-sync.
        </div>
      )}
      {crmError && (
        <div className="neu-flat px-4 py-3 text-[13px] font-medium text-red-500" style={{ borderRadius: 12 }}>
          {crmError === "denied"
            ? "Connection cancelled. You can try again anytime."
            : crmError === "token_failed"
            ? "Connection failed — please try again."
            : "Something went wrong. Please try again."}
        </div>
      )}

      <SettingsSection
        title="CRM Integrations"
        description="Connect your CRM so new leads appear automatically — no Zapier needed."
      >
        {CRM_PROVIDERS.map((provider) => {
          const conn = connections.find((c) => c.provider === provider.id);
          if (conn) {
            const since = new Date(conn.connected_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <div key={provider.id} className="neu-flat p-3" style={{ borderRadius: 12 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center text-white"
                      style={{ background: provider.accent, borderRadius: 10 }}
                    >
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                        {provider.name}
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5"
                          style={{ color: "var(--neu-accent)", borderRadius: 999, background: "var(--neu-bg)", boxShadow: "inset 1px 1px 2px var(--neu-inset-dark), inset -1px -1px 2px var(--neu-inset-light)" }}
                        >
                          Connected
                        </span>
                      </div>
                      <div className="text-[11px] neu-muted">Since {since}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NeuButton variant="flat" onClick={() => handleTestLead(provider.id)} disabled={testing === provider.id}>
                      <Send className="h-3 w-3" />
                      {testing === provider.id ? "Sending…" : "Test"}
                    </NeuButton>
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      disabled={disconnecting === conn.id}
                      className="flex items-center gap-1 text-[11px] font-medium neu-muted hover:text-red-500 transition"
                    >
                      <Unlink className="h-3 w-3" />
                      {disconnecting === conn.id ? "…" : "Disconnect"}
                    </button>
                  </div>
                </div>
                {testResult[provider.id] === "success" && (
                  <div
                    className="mt-2 flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "var(--neu-accent)" }}
                  >
                    <Check className="h-3 w-3" /> Test lead sent to {provider.name}
                  </div>
                )}
                {testResult[provider.id] === "error" && (
                  <div className="mt-2 text-[11px] font-medium text-red-500">
                    Failed to send — try reconnecting
                  </div>
                )}
              </div>
            );
          }
          return (
            <button
              key={provider.id}
              onClick={() => handleConnect(provider)}
              className="neu-flat w-full flex items-center gap-3 p-3 text-left hover:opacity-95"
              style={{ borderRadius: 12 }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center text-white flex-shrink-0"
                style={{ background: provider.accent, borderRadius: 10 }}
              >
                <Link2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: "var(--neu-text)" }}>
                  Connect {provider.name}
                </div>
                <div className="text-[11px] neu-muted">{provider.desc}</div>
              </div>
              <span className="text-[11px] font-medium neu-muted">→</span>
            </button>
          );
        })}
      </SettingsSection>

      <SettingsSection
        title="Webhook Fallback"
        description="Works with Zapier, Make, n8n, or any webhook URL."
        action={<NeuToggle checked={webhookEnabled} onChange={setWebhookEnabled} />}
      >
        {webhookEnabled && (
          <>
            <NeuInput
              label="Webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="font-mono text-[13px]"
            />
            <div className="flex items-center gap-3">
              <NeuButton variant="flat" onClick={handleWebhookTest} disabled={webhookTesting || !webhookUrl}>
                <Send className="h-3 w-3" />
                {webhookTesting ? "Sending…" : "Send Test"}
              </NeuButton>
              {webhookResult === "success" && (
                <span className="text-[12px] font-medium flex items-center gap-1" style={{ color: "var(--neu-accent)" }}>
                  <Check className="h-3 w-3" /> Delivered
                </span>
              )}
              {webhookResult === "error" && (
                <span className="text-[12px] font-medium text-red-500">Failed — check your URL</span>
              )}
            </div>
            <button
              onClick={() => setWebhookExpanded(!webhookExpanded)}
              className="flex items-center gap-1.5 text-[11px] font-medium neu-muted hover:opacity-80"
            >
              {webhookExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {webhookExpanded ? "Hide" : "Show"} payload example
            </button>
            {webhookExpanded && (
              <pre
                className="neu-inset p-3 text-[11px] font-mono overflow-x-auto"
                style={{ color: "var(--neu-text)", borderRadius: 10 }}
              >
{`{
  "event": "lead.created",
  "lead": {
    "name": "…",
    "phone": "…",
    "email": "…",
    "address": "…",
    "estimate": { "low": 8500, "high": 12000 }
  }
}`}
              </pre>
            )}
          </>
        )}

        <div className="pt-3">
          <NeuButton variant="accent" onClick={handleSaveWebhook} disabled={saving}>
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : saving ? (
              "Saving…"
            ) : (
              "Save Webhook Settings"
            )}
          </NeuButton>
        </div>
      </SettingsSection>

      <SettingsSection title="Coming Soon" description="On the integration roadmap.">
        <div className="grid gap-2 sm:grid-cols-3">
          {COMING_SOON.map((p) => (
            <div
              key={p.name}
              className="neu-flat p-3 opacity-60 cursor-not-allowed flex items-center gap-2"
              style={{ borderRadius: 12 }}
            >
              <div
                className="h-6 w-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: p.accent }}
              >
                {p.name[0]}
              </div>
              <span className="text-[12px] font-semibold" style={{ color: "var(--neu-text)" }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
