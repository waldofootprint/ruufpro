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

import { useMemo, useState } from "react";
import type {
  ChatbotConfigPatch,
  SitesPatch,
  ContractorsPatch,
  CrawlStateField,
  MappedFieldName,
} from "@/lib/scrape-to-chatbot-config";

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
  onSave: (edited: CrawlPayload, ownerNameInput: string | null) => Promise<void> | void;
  onSkip: () => void;
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
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
        Suggested — verify
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
      ✓ Auto-filled
    </span>
  );
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
      className="ml-2 text-[10px] text-gray-400 underline hover:text-gray-600"
    >
      From {host === "/" ? "homepage" : host}
    </a>
  );
}

export default function CrawlReview({ payload, existing = {}, onSave, onSkip }: CrawlReviewProps) {
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

  // Track which fields the user actually edited so save handler can mark
  // manually_edited=true (gotcha #8 protection).
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

  // Recrawl conflict resolution: per-field choice "keep" | "new"
  const conflictFields = useMemo(() => {
    const out: Array<{ field: MappedFieldName; current: string; incoming: string }> = [];
    for (const f of crawlState) {
      const ex = existing[f.field];
      if (!ex?.manually_edited) continue;
      // Pull incoming value for this field
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
      // Apply conflict choices: if user chose "keep", revert that field to current value.
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

      // Owner name: if the roofer typed anything, mark edited (acts as confirmation).
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

  const Card = ({ title, children, field }: { title: string; children: React.ReactNode; field?: MappedFieldName }) => {
    const fs = field ? fieldState(crawlState, field) : undefined;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-baseline mb-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <ConfidencePill field={fs} />
          <SourceLink field={fs} />
        </div>
        {children}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Here's what we found</h2>
        <p className="text-sm text-gray-500 mt-1">
          Read up to {pagesCrawled.length} page{pagesCrawled.length === 1 ? "" : "s"} on your site
          {generatedFaqCount > 0 ? ` and drafted ${generatedFaqCount} FAQs` : ""}. Edit anything that's wrong.
        </p>
      </div>

      {conflictFields.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-amber-900">
            We found different values for fields you'd already edited
          </div>
          {conflictFields.map((c) => (
            <div key={c.field} className="text-xs">
              <div className="font-medium text-amber-900 mb-1">{c.field.replace(/_/g, " ")}</div>
              <label className="flex items-start gap-2 mb-1">
                <input
                  type="radio"
                  name={`conflict-${c.field}`}
                  checked={conflictChoices[c.field] === "keep"}
                  onChange={() => setConflictChoices((s) => ({ ...s, [c.field]: "keep" }))}
                />
                <span><strong>Keep your edit:</strong> {c.current}</span>
              </label>
              <label className="flex items-start gap-2">
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
      <Card title="Services" field="services">
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">No services found on your site — add them in the dashboard.</p>
        ) : (
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) => {
                    const next = [...services];
                    next[i] = { ...next[i], title: e.target.value };
                    setServices(next);
                  }}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setServices([...services, { title: "" }])}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              + Add service
            </button>
          </div>
        )}
      </Card>

      {/* 2. Service area */}
      <Card title="Service area" field="service_area_cities">
        <input
          type="text"
          value={serviceCities.join(", ")}
          onChange={(e) =>
            setServiceCities(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
          placeholder="Bradenton, Sarasota, Palmetto"
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">Comma-separated list of cities you serve.</p>
      </Card>

      {/* 3. About your team */}
      <Card title="About your team" field="team_description">
        <textarea
          value={teamDescription}
          onChange={(e) => setTeamDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          placeholder="A short paragraph Riley can read when homeowners ask about your team."
        />
      </Card>

      {/* 4. Differentiators */}
      <Card title="Why homeowners pick you" field="differentiators">
        <textarea
          value={differentiators}
          onChange={(e) => setDifferentiators(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          placeholder="Comma-separated. E.g. Family-owned, GAF Master Elite, 25 years experience"
        />
      </Card>

      {/* 5. Owner name (always Suggested per decision #3) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-baseline mb-3">
          <h3 className="text-base font-semibold text-gray-900">Owner name</h3>
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
            Suggested — please confirm
          </span>
        </div>
        {ownerSuggestion && (
          <p className="text-xs text-gray-500 mb-2">
            We saw <strong>{ownerSuggestion}</strong> on your site — type it in to confirm or use a different name.
          </p>
        )}
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="e.g. Joe Smith"
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Riley will say this name when introducing your team. Wrong name = lost trust, so we never auto-fill.
        </p>
      </div>

      {/* 6. FAQs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">FAQs Riley can answer</h3>
        <p className="text-xs text-gray-500 mb-3">
          Uncheck anything wrong. Edit the answer to sound like you. Up to 20.
        </p>
        {faqs.length === 0 ? (
          <p className="text-sm text-gray-500">No FAQs yet — you can add them in Settings later.</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={f.checked}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], checked: e.target.checked };
                      setFaqs(next);
                    }}
                    className="mt-1"
                  />
                  <input
                    type="text"
                    value={f.q}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], q: e.target.value };
                      setFaqs(next);
                    }}
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm font-medium"
                  />
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      f.source === "scraped"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    }`}
                  >
                    {f.source === "scraped" ? "From your FAQ page" : "We drafted this"}
                  </span>
                </div>
                <textarea
                  value={f.a}
                  onChange={(e) => {
                    const next = [...faqs];
                    next[i] = { ...next[i], a: e.target.value };
                    setFaqs(next);
                  }}
                  rows={2}
                  className="ml-6 w-[calc(100%-1.5rem)] rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Warranty / Financing / Hours / Payment / Emergency */}
      <Card title="Operations">
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline">
              <label className="text-xs font-medium text-gray-600">Warranty</label>
              <ConfidencePill field={fieldState(crawlState, "warranty_description")} />
              <SourceLink field={fieldState(crawlState, "warranty_description")} />
            </div>
            <input
              type="text"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="e.g. 10-year workmanship warranty"
            />
          </div>
          <div>
            <div className="flex items-baseline">
              <label className="text-xs font-medium text-gray-600">Financing provider</label>
              <ConfidencePill field={fieldState(crawlState, "financing_provider")} />
            </div>
            <input
              type="text"
              value={financing}
              onChange={(e) => setFinancing(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="e.g. Hearth, GreenSky"
            />
          </div>
          <div>
            <div className="flex items-baseline">
              <label className="text-xs font-medium text-gray-600">Business hours</label>
              <ConfidencePill field={fieldState(crawlState, "business_hours")} />
            </div>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="e.g. Mon–Fri 8am–6pm"
            />
          </div>
          <div>
            <div className="flex items-baseline">
              <label className="text-xs font-medium text-gray-600">Payment methods</label>
              <ConfidencePill field={fieldState(crawlState, "payment_methods")} />
            </div>
            <input
              type="text"
              value={paymentMethods.join(", ")}
              onChange={(e) =>
                setPaymentMethods(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="Visa, Mastercard, Check, Financing"
            />
          </div>
          <div>
            <div className="flex items-baseline">
              <label className="text-xs font-medium text-gray-600">Emergency / 24-7</label>
              <ConfidencePill field={fieldState(crawlState, "emergency_description")} />
            </div>
            <input
              type="text"
              value={emergencyDesc}
              onChange={(e) => setEmergencyDesc(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="e.g. 24/7 emergency tarping after storms"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phone (from site)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Save / skip */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & continue →"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Skip — I'll fill it manually
        </button>
      </div>
    </div>
  );
}
