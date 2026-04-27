"use client";

// Renders the SSE `complete` payload from /api/onboarding/crawl (or /api/dashboard/riley/recrawl)
// as an editable review screen. Caller persists via onSave(edited).
//
// Behaviors:
//   - owner_name always rendered as "Suggested" with empty input pre-populated by
//     crawl_state.raw_excerpt (locked decision #3 — never silent auto-apply)
//   - low-confidence fields rendered with "Suggested — verify" pill
//   - FAQ checkboxes initial state from f.pre_checked
//   - Conflict diff UI when an existing field has manually_edited=true and the
//     new payload differs (recrawl path — gotcha #8)
//   - Manual mode (no crawl): caller passes empty payload; component hides
//     "Here's what we found" header and shows blank fields.

import { useMemo, useState } from "react";
import type {
  ChatbotConfigPatch,
  SitesPatch,
  ContractorsPatch,
  CrawlStateField,
  MappedFieldName,
} from "@/lib/scrape-to-chatbot-config";
import {
  NeuCard,
  NeuField,
  NeuPill,
  NeuPrimaryButton,
  neuInputStyle,
  neuInputStyleSmall,
} from "./neu-shared";

export type CrawlPayload = {
  patch: {
    chatbotConfig: ChatbotConfigPatch;
    sites: SitesPatch;
    contractors: ContractorsPatch;
  };
  crawlState: CrawlStateField[];
  pagesCrawled: string[];
  generatedFaqCount: number;
};

// For recrawl: the prior crawl_state.fields blob from chatbot_config so we can
// surface "you edited this — keep your edit or use new?" for manually_edited fields.
export type ExistingFieldState = {
  manually_edited?: boolean;
  current_value?: string | string[] | null;
};

export type CrawlReviewProps = {
  payload: CrawlPayload;
  // Map field name -> existing state (only populated on recrawl flow). Onboarding passes {}.
  existing?: Partial<Record<MappedFieldName, ExistingFieldState>>;
  // When true, hide the "Here's what we found" header (manual fill, no crawl ran).
  manualMode?: boolean;
  onSave: (edited: CrawlPayload, ownerNameInput: string | null) => Promise<void> | void;
  onSkip?: () => void;
};

type FaqRow = NonNullable<ChatbotConfigPatch["custom_faqs"]>[number] & { checked: boolean };

function decodePhone(p: string | null | undefined): string {
  if (!p) return "";
  // Carry-over flag #1: existing scraper returns URL-encoded phones.
  try { return decodeURIComponent(p); } catch { return p; }
}

function fieldState(crawlState: CrawlStateField[], name: MappedFieldName) {
  return crawlState.find((f) => f.field === name);
}

function ConfidencePill({ field }: { field: CrawlStateField | undefined }) {
  if (!field) return null;
  if (!field.auto_filled || field.confidence === "low") {
    return <NeuPill variant="suggested">Suggested — verify</NeuPill>;
  }
  return <NeuPill variant="auto">✓ Auto-filled</NeuPill>;
}

function SourceLink({ field }: { field: CrawlStateField | undefined }) {
  if (!field?.source_url) return null;
  let host = "site";
  try { host = new URL(field.source_url).pathname || "/"; } catch {}
  return (
    <a
      href={field.source_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: 11,
        color: "var(--neu-text-dim)",
        textDecoration: "underline",
      }}
    >
      From {host === "/" ? "homepage" : host}
    </a>
  );
}

export default function CrawlReview({
  payload,
  existing = {},
  manualMode = false,
  onSave,
  onSkip,
}: CrawlReviewProps) {
  const { patch, crawlState, pagesCrawled, generatedFaqCount } = payload;

  // --- editable copies of every field ---
  const [services, setServices] = useState<Array<{ title: string; description?: string }>>(
    patch.sites.services ?? [],
  );
  const [serviceCities, setServiceCities] = useState<string[]>(
    patch.contractors.service_area_cities ?? patch.chatbotConfig.service_area_cities ?? [],
  );
  const [teamDescription, setTeamDescription] = useState<string>(
    patch.chatbotConfig.team_description ?? "",
  );
  const [differentiators, setDifferentiators] = useState<string>(
    patch.chatbotConfig.differentiators ?? "",
  );
  // Owner name: empty by default per decision #3; raw_excerpt is the suggestion only.
  const ownerSuggestion = fieldState(crawlState, "owner_name")?.raw_excerpt ?? "";
  const [ownerName, setOwnerName] = useState<string>("");

  const initialFaqs: FaqRow[] = (patch.chatbotConfig.custom_faqs ?? []).map((f) => ({
    ...f,
    checked: !!f.pre_checked,
  }));
  const [faqs, setFaqs] = useState<FaqRow[]>(initialFaqs);

  const [warranty, setWarranty] = useState<string>(patch.chatbotConfig.warranty_description ?? "");
  const [financing, setFinancing] = useState<string>(patch.chatbotConfig.financing_provider ?? "");
  const [hours, setHours] = useState<string>(patch.chatbotConfig.business_hours ?? "");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    patch.chatbotConfig.payment_methods ?? [],
  );
  const [emergencyDesc, setEmergencyDesc] = useState<string>(
    patch.chatbotConfig.emergency_description ?? "",
  );
  const [phone, setPhone] = useState<string>(decodePhone(patch.contractors.phone));

  const initialSnapshot = useMemo(() => ({
    teamDescription: patch.chatbotConfig.team_description ?? "",
    differentiators: patch.chatbotConfig.differentiators ?? "",
    warranty: patch.chatbotConfig.warranty_description ?? "",
    financing: patch.chatbotConfig.financing_provider ?? "",
    hours: patch.chatbotConfig.business_hours ?? "",
    emergencyDesc: patch.chatbotConfig.emergency_description ?? "",
    paymentMethods: patch.chatbotConfig.payment_methods ?? [],
    serviceCities: patch.contractors.service_area_cities ?? [],
    services: patch.sites.services ?? [],
    phone: decodePhone(patch.contractors.phone),
  }), [patch]);

  const [saving, setSaving] = useState(false);

  const conflictFields = useMemo(() => {
    const out: Array<{ field: MappedFieldName; current: string; incoming: string }> = [];
    for (const f of crawlState) {
      const ex = existing[f.field];
      if (!ex?.manually_edited) continue;
      const incoming = (() => {
        switch (f.field) {
          case "team_description": return patch.chatbotConfig.team_description ?? "";
          case "differentiators": return patch.chatbotConfig.differentiators ?? "";
          case "warranty_description": return patch.chatbotConfig.warranty_description ?? "";
          case "financing_provider": return patch.chatbotConfig.financing_provider ?? "";
          case "business_hours": return patch.chatbotConfig.business_hours ?? "";
          case "emergency_description": return patch.chatbotConfig.emergency_description ?? "";
          case "service_area_cities": return (patch.contractors.service_area_cities ?? []).join(", ");
          case "payment_methods": return (patch.chatbotConfig.payment_methods ?? []).join(", ");
          case "services": return (patch.sites.services ?? []).map((s) => s.title).join(", ");
          default: return "";
        }
      })();
      const cur = Array.isArray(ex.current_value) ? ex.current_value.join(", ") : (ex.current_value ?? "");
      if (cur && incoming && cur !== incoming) {
        out.push({ field: f.field, current: cur, incoming });
      }
    }
    return out;
  }, [crawlState, existing, patch]);

  const [conflictChoices, setConflictChoices] = useState<Record<string, "keep" | "new">>(() =>
    Object.fromEntries(conflictFields.map((c) => [c.field, "keep" as const])),
  );

  async function handleSave() {
    setSaving(true);
    try {
      const applyKeep = (field: MappedFieldName, currentValue: string) => {
        switch (field) {
          case "team_description": setTeamDescription(currentValue); break;
          case "differentiators": setDifferentiators(currentValue); break;
          case "warranty_description": setWarranty(currentValue); break;
          case "financing_provider": setFinancing(currentValue); break;
          case "business_hours": setHours(currentValue); break;
          case "emergency_description": setEmergencyDesc(currentValue); break;
          case "service_area_cities":
            setServiceCities(currentValue.split(",").map((s) => s.trim()).filter(Boolean));
            break;
          case "payment_methods":
            setPaymentMethods(currentValue.split(",").map((s) => s.trim()).filter(Boolean));
            break;
        }
      };
      for (const c of conflictFields) {
        if (conflictChoices[c.field] === "keep") applyKeep(c.field, c.current);
      }

      const editedFaqs = faqs.filter((f) => f.checked).map(({ checked: _checked, ...rest }) => rest);

      const wasEdited = (key: keyof typeof initialSnapshot, current: string | string[]): boolean => {
        const init = initialSnapshot[key];
        if (Array.isArray(init) && Array.isArray(current)) {
          return JSON.stringify(init) !== JSON.stringify(current);
        }
        return init !== current;
      };

      const editedFieldNames = new Set<MappedFieldName>();
      if (wasEdited("teamDescription", teamDescription)) editedFieldNames.add("team_description");
      if (wasEdited("differentiators", differentiators)) editedFieldNames.add("differentiators");
      if (wasEdited("warranty", warranty)) editedFieldNames.add("warranty_description");
      if (wasEdited("financing", financing)) editedFieldNames.add("financing_provider");
      if (wasEdited("hours", hours)) editedFieldNames.add("business_hours");
      if (wasEdited("emergencyDesc", emergencyDesc)) editedFieldNames.add("emergency_description");
      if (wasEdited("paymentMethods", paymentMethods)) editedFieldNames.add("payment_methods");
      if (wasEdited("serviceCities", serviceCities)) editedFieldNames.add("service_area_cities");
      if (wasEdited("services", services.map((s) => s.title))) editedFieldNames.add("services");
      if (ownerName.trim()) editedFieldNames.add("owner_name");

      const newCrawlState: CrawlStateField[] = crawlState.map((f) => ({
        ...f,
        manually_edited: f.manually_edited || editedFieldNames.has(f.field),
      }));

      const edited: CrawlPayload = {
        patch: {
          chatbotConfig: {
            ...patch.chatbotConfig,
            team_description: teamDescription || null,
            differentiators: differentiators || null,
            warranty_description: warranty || null,
            financing_provider: financing || null,
            business_hours: hours || null,
            emergency_description: emergencyDesc || null,
            payment_methods: paymentMethods,
            service_area_cities: serviceCities,
            custom_faqs: editedFaqs,
          },
          sites: {
            ...patch.sites,
            services,
          },
          contractors: {
            ...patch.contractors,
            owner_name: ownerName.trim() || null,
            service_area_cities: serviceCities,
            phone: phone || null,
          },
        },
        crawlState: newCrawlState,
        pagesCrawled,
        generatedFaqCount,
      };

      await onSave(edited, ownerName.trim() || null);
    } finally {
      setSaving(false);
    }
  }

  const removeButtonStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--neu-text-dim)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px 8px",
    fontFamily: "inherit",
  };

  return (
    <div style={{ width: "100%" }}>
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--neu-text)",
            margin: 0,
            marginBottom: 10,
          }}
        >
          {manualMode ? "Tell Riley about your business" : "Sound check — here's what we found"}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--neu-text-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {manualMode
            ? "Fill in what you can — Riley uses these to answer homeowner questions. You can edit anything later in Settings."
            : `Read ${pagesCrawled.length} page${pagesCrawled.length === 1 ? "" : "s"} on your site${
                generatedFaqCount > 0 ? ` and drafted ${generatedFaqCount} FAQs` : ""
              }. Edit anything that's wrong.`}
        </p>
      </header>

      {conflictFields.length > 0 && (
        <div
          className="neu-flat"
          style={{
            padding: 16,
            marginBottom: 14,
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>
            We found different values for fields you'd already edited
          </div>
          {conflictFields.map((c) => (
            <div key={c.field} style={{ marginBottom: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: "#92400E", marginBottom: 4, textTransform: "capitalize" }}>
                {c.field.replace(/_/g, " ")}
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <input
                  type="radio"
                  name={`conflict-${c.field}`}
                  checked={conflictChoices[c.field] === "keep"}
                  onChange={() => setConflictChoices((s) => ({ ...s, [c.field]: "keep" }))}
                />
                <span><strong>Keep your edit:</strong> {c.current}</span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <input
                  type="radio"
                  name={`conflict-${c.field}`}
                  checked={conflictChoices[c.field] === "new"}
                  onChange={() => setConflictChoices((s) => ({ ...s, [c.field]: "new" }))}
                />
                <span><strong>Use new from site:</strong> {c.incoming}</span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* 1. Services */}
      <NeuCard title="Services" pill={<ConfidencePill field={fieldState(crawlState, "services")} />}>
        {services.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--neu-text-muted)", margin: 0 }}>
            {manualMode ? "Add the services you offer." : "No services found on your site — add them below."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {services.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) => {
                    const next = [...services];
                    next[i] = { ...next[i], title: e.target.value };
                    setServices(next);
                  }}
                  style={{ ...neuInputStyleSmall, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                  style={removeButtonStyle}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setServices([...services, { title: "" }])}
          style={{
            fontSize: 12,
            color: "var(--neu-accent)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px 0 0 0",
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          + Add service
        </button>
      </NeuCard>

      {/* 2. Service area */}
      <NeuCard
        title="Service area"
        pill={<ConfidencePill field={fieldState(crawlState, "service_area_cities")} />}
      >
        <input
          type="text"
          value={serviceCities.join(", ")}
          onChange={(e) =>
            setServiceCities(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
          placeholder="Bradenton, Sarasota, Palmetto"
          style={neuInputStyleSmall}
        />
        <p style={{ fontSize: 11, color: "var(--neu-text-dim)", margin: "6px 0 0 0" }}>
          Comma-separated list of cities you serve.
        </p>
      </NeuCard>

      {/* 3. About your team */}
      <NeuCard
        title="About your team"
        pill={<ConfidencePill field={fieldState(crawlState, "team_description")} />}
        source={<SourceLink field={fieldState(crawlState, "team_description")} />}
      >
        <textarea
          value={teamDescription}
          onChange={(e) => setTeamDescription(e.target.value)}
          rows={3}
          style={{ ...neuInputStyleSmall, resize: "vertical", minHeight: 72 }}
          placeholder="A short paragraph Riley can read when homeowners ask about your team."
        />
      </NeuCard>

      {/* 4. Differentiators */}
      <NeuCard
        title="Why homeowners pick you"
        pill={<ConfidencePill field={fieldState(crawlState, "differentiators")} />}
        source={<SourceLink field={fieldState(crawlState, "differentiators")} />}
      >
        <textarea
          value={differentiators}
          onChange={(e) => setDifferentiators(e.target.value)}
          rows={2}
          style={{ ...neuInputStyleSmall, resize: "vertical", minHeight: 60 }}
          placeholder="Comma-separated. E.g. Family-owned, GAF Master Elite, 25 years experience"
        />
      </NeuCard>

      {/* 5. Owner name (always Suggested per decision #3) */}
      <NeuCard
        title="Owner name"
        pill={<NeuPill variant="suggested">Suggested — please confirm</NeuPill>}
      >
        {ownerSuggestion && (
          <p style={{ fontSize: 12, color: "var(--neu-text-muted)", margin: "0 0 8px 0" }}>
            We saw <strong>{ownerSuggestion}</strong> on your site — type it in to confirm or use a different name.
          </p>
        )}
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="e.g. Joe Smith"
          style={neuInputStyleSmall}
        />
        <p style={{ fontSize: 11, color: "var(--neu-text-dim)", margin: "6px 0 0 0" }}>
          Riley will say this name when introducing your team. Wrong name = lost trust, so we never auto-fill.
        </p>
      </NeuCard>

      {/* 6. FAQs */}
      {!manualMode && faqs.length > 0 && (
        <div className="neu-raised" style={{ padding: 22, marginBottom: 14 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--neu-text)",
              margin: 0,
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            FAQs Riley can answer
          </h3>
          <p style={{ fontSize: 12, color: "var(--neu-text-muted)", margin: "0 0 14px 0" }}>
            Uncheck anything wrong. Edit the answer to sound like you. Up to 20.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: "var(--neu-bg)",
                  border: "1px solid var(--neu-border)",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={f.checked}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], checked: e.target.checked };
                      setFaqs(next);
                    }}
                    style={{ marginTop: 6 }}
                  />
                  <input
                    type="text"
                    value={f.q}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], q: e.target.value };
                      setFaqs(next);
                    }}
                    style={{ ...neuInputStyleSmall, flex: 1, fontWeight: 600 }}
                  />
                  <NeuPill variant={f.source === "scraped" ? "scraped" : "drafted"}>
                    {f.source === "scraped" ? "From your FAQ" : "We drafted"}
                  </NeuPill>
                </div>
                <textarea
                  value={f.a}
                  onChange={(e) => {
                    const next = [...faqs];
                    next[i] = { ...next[i], a: e.target.value };
                    setFaqs(next);
                  }}
                  rows={2}
                  style={{
                    ...neuInputStyleSmall,
                    marginLeft: 24,
                    width: "calc(100% - 24px)",
                    resize: "vertical",
                    minHeight: 56,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Operations */}
      <NeuCard title="Operations">
        <NeuField
          label="Warranty"
          pill={<ConfidencePill field={fieldState(crawlState, "warranty_description")} />}
          source={<SourceLink field={fieldState(crawlState, "warranty_description")} />}
        >
          <input
            type="text"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            placeholder="e.g. 10-year workmanship warranty"
            style={neuInputStyleSmall}
          />
        </NeuField>

        <NeuField
          label="Financing provider"
          pill={<ConfidencePill field={fieldState(crawlState, "financing_provider")} />}
        >
          <input
            type="text"
            value={financing}
            onChange={(e) => setFinancing(e.target.value)}
            placeholder="e.g. Hearth, GreenSky"
            style={neuInputStyleSmall}
          />
        </NeuField>

        <NeuField
          label="Business hours"
          pill={<ConfidencePill field={fieldState(crawlState, "business_hours")} />}
        >
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. Mon–Fri 8am–6pm"
            style={neuInputStyleSmall}
          />
        </NeuField>

        <NeuField
          label="Payment methods"
          pill={<ConfidencePill field={fieldState(crawlState, "payment_methods")} />}
        >
          <input
            type="text"
            value={paymentMethods.join(", ")}
            onChange={(e) =>
              setPaymentMethods(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
            }
            placeholder="Visa, Mastercard, Check, Financing"
            style={neuInputStyleSmall}
          />
        </NeuField>

        <NeuField
          label="Emergency / 24-7"
          pill={<ConfidencePill field={fieldState(crawlState, "emergency_description")} />}
        >
          <input
            type="text"
            value={emergencyDesc}
            onChange={(e) => setEmergencyDesc(e.target.value)}
            placeholder="e.g. 24/7 emergency tarping after storms"
            style={neuInputStyleSmall}
          />
        </NeuField>

        <NeuField label={manualMode ? "Phone" : "Phone (from site)"}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={neuInputStyleSmall}
          />
        </NeuField>
      </NeuCard>

      {/* Save */}
      <div className="neu-raised" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <NeuPrimaryButton
          label="Save & continue"
          onClick={handleSave}
          loading={saving}
        />
        {onSkip && !manualMode && (
          <button
            type="button"
            onClick={onSkip}
            style={{
              fontSize: 12,
              color: "var(--neu-text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              fontFamily: "inherit",
            }}
          >
            Skip — I'll fill it manually
          </button>
        )}
      </div>
    </div>
  );
}
