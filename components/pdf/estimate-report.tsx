// Estimate Report PDF — comprehensive branded document inspired by
// EagleView's professional layout and Roofr's proposal format.
// Includes: roof measurements, estimate, material comparison,
// what's included, credentials, and clear next steps.

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

interface MaterialOption {
  name: string;
  description: string;
  priceLow: number;
  priceHigh: number;
  warranty: string;
  windRating: string;
  lifespan: string;
}


interface EstimateReportProps {
  contractorName: string;
  contractorPhone: string;
  contractorCity: string;
  contractorState: string;
  contractorLicense: string | null;
  contractorInsured: boolean;
  contractorYears: number | null;
  contractorCertifications: string[];
  homeownerName: string;
  homeownerAddress: string | null;
  homeownerPhone: string | null;
  homeownerEmail: string | null;
  propertyProtectionEnabled?: boolean;
  changeOrderEnabled?: boolean;
  financingEnabled?: boolean;
  financingProvider?: string | null;
  financingTermMonths?: number | null;
  financingApr?: number | null;
  financingNote?: string | null;
  roofAreaSqft: number;
  pitchDegrees: number;
  numSegments: number;
  selectedMaterial: string;
  priceLow: number;
  priceHigh: number;
  materialOptions: MaterialOption[];
  isSatellite: boolean;
  satelliteImageUrl?: string | null;
  date: string;
}

// Color palette — navy + white, professional, print-friendly
const NAVY = "#1e293b";
const DARK = "#0f172a";
const BLUE = "#2563eb";
const GREEN = "#16a34a";
const GRAY = "#64748b";
const LIGHT = "#f8fafc";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#334155",
  },

  // ---- HEADER ----
  header: {
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  companyName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: -0.8,
  },
  companyInfo: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 4,
  },
  reportTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reportDate: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 3,
  },
  headerBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  headerBadgeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ---- MINI HEADER (page 2+) ----
  miniHeader: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  // ---- BODY ----
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 20,
  },

  // ---- PREPARED FOR ----
  preparedFor: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  prepLabel: {
    fontSize: 7.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  prepValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  prepDetail: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
  },

  // ---- SECTION TITLE ----
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 10,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 3,
  },

  // ---- ROOF DETAILS GRID ----
  detailsGrid: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 32,
  },
  detailCard: {
    flex: 1,
    borderBottomWidth: 3,
    borderBottomColor: DARK,
    paddingBottom: 14,
    paddingTop: 8,
  },
  detailLabel: {
    fontSize: 7.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: -1,
    marginBottom: 2,
  },
  detailSub: {
    fontSize: 7.5,
    color: "#94a3b8",
    marginTop: 1,
  },

  // ---- ESTIMATE BOX (left accent bar, print-friendly) ----
  estimateBox: {
    borderLeftWidth: 6,
    borderLeftColor: BLUE,
    backgroundColor: LIGHT,
    paddingLeft: 24,
    paddingVertical: 28,
    marginBottom: 28,
    marginTop: 12,
  },
  estimateLabel: {
    fontSize: 9,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  estimatePrice: {
    fontSize: 48,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: -2,
  },
  estimateMaterial: {
    fontSize: 11,
    color: GRAY,
    marginTop: 4,
  },
  estimateNote: {
    fontSize: 7.5,
    color: "#94a3b8",
    marginTop: 6,
  },

  // ---- MATERIAL CARD ----
  matCard: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 16,
    paddingTop: 16,
  },
  compBadge: {
    backgroundColor: DARK,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 6,
  },
  compBadgeText: { fontSize: 6, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // ---- WHAT'S INCLUDED ----
  includedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  includedItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 3,
  },
  includedText: {
    fontSize: 9,
    color: DARK,
    flex: 1,
  },

  // ---- CREDENTIALS ----
  credGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 28,
  },
  credBadge: {
    backgroundColor: LIGHT,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
  },
  credText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: DARK, letterSpacing: 0.3 },

  // ---- DISCLAIMER ----
  disclaimer: {
    backgroundColor: LIGHT,
    padding: 12,
    marginBottom: 28,
    borderLeftWidth: 3,
    borderLeftColor: BORDER,
  },
  disclaimerTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#94a3b8", marginBottom: 3 },
  disclaimerText: { fontSize: 7.5, color: "#94a3b8", lineHeight: 1.6 },

  // ---- NEXT STEPS ----
  stepsBox: {
    borderLeftWidth: 6,
    borderLeftColor: BLUE,
    paddingLeft: 24,
    paddingVertical: 20,
    marginBottom: 16,
  },
  stepsTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 12 },
  step: { flexDirection: "row", marginBottom: 8 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  stepText: { fontSize: 9, color: GRAY, flex: 1, paddingTop: 3 },
  stepsPhone: { fontSize: 24, fontFamily: "Helvetica-Bold", color: DARK, textAlign: "center", marginTop: 16, letterSpacing: -0.5 },
  stepsSub: { fontSize: 9, color: "#94a3b8", textAlign: "center", marginTop: 3 },

  // ---- FOOTER ----
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: "#cbd5e1",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
});

const INCLUDED_ITEMS = [
  "Complete tear-off of existing roof",
  "Deck inspection and repair as needed",
  "New synthetic underlayment",
  "New drip edge and flashing",
  "Ice & water shield (if applicable)",
  "Ridge vent or ventilation upgrades",
  "Pipe boot and vent replacement",
  "New shingle installation",
  "Clean up and magnetic nail sweep",
  "Dumpster and debris hauling",
  "Building permit (where required)",
  "Final walkthrough with homeowner",
];

// TODO: Make these editable per contractor via dashboard settings
const PROPERTY_PROTECTION_ITEMS = [
  "Tarps over landscaping and flower beds",
  "Plywood protection for driveways and walkways",
  "Magnetic nail sweep of entire property",
  "Same-day debris removal — no overnight dumpsters",
  "Final walkthrough with you before we leave",
];

const CHANGE_ORDER_STEPS = [
  "We stop work and document the issue with photos",
  "We call you to explain what we found and discuss options",
  "You approve any changes and costs before we proceed",
  "No surprise charges — ever",
];

export function EstimateReportPDF(props: EstimateReportProps) {
  const {
    contractorName, contractorPhone, contractorCity, contractorState,
    contractorLicense, contractorInsured, contractorYears, contractorCertifications,
    homeownerName, homeownerAddress, homeownerPhone, homeownerEmail,
    roofAreaSqft, pitchDegrees, numSegments, selectedMaterial,
    priceLow, priceHigh, materialOptions, isSatellite, satelliteImageUrl, date,
    propertyProtectionEnabled, changeOrderEnabled,
    financingEnabled, financingProvider, financingTermMonths, financingApr, financingNote,
  } = props;

  const pitchDisplay = `${Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12)}/12`;
  const complexity = numSegments <= 2 ? "Simple" : numSegments <= 4 ? "Moderate" : numSegments <= 6 ? "Complex" : "Very Complex";
  const totalPages = 3;


  return (
    <Document>
      {/* ===== PAGE 1: Header + Prepared For + Measurements ===== */}
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{contractorName}</Text>
            <Text style={s.companyInfo}>
              {contractorCity}, {contractorState}
              {contractorLicense ? `  ·  License #${contractorLicense}` : ""}
              {"\n"}{contractorPhone}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" as const }}>
            <Text style={s.reportTitle}>Roof Estimate Report</Text>
            <Text style={s.reportDate}>{date}</Text>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>
                {isSatellite ? "Satellite Measured" : "Estimated"}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* PREPARED FOR */}
          <View style={s.preparedFor}>
            <View>
              <Text style={s.prepLabel}>Prepared For</Text>
              <Text style={s.prepValue}>{homeownerName}</Text>
              {homeownerAddress && <Text style={s.prepDetail}>{homeownerAddress}</Text>}
              {homeownerPhone && <Text style={s.prepDetail}>{homeownerPhone}</Text>}
              {homeownerEmail && <Text style={s.prepDetail}>{homeownerEmail}</Text>}
            </View>
            <View style={{ alignItems: "flex-end" as const }}>
              <Text style={s.prepLabel}>Prepared By</Text>
              <Text style={s.prepValue}>{contractorName}</Text>
              <Text style={s.prepDetail}>{contractorPhone}</Text>
            </View>
          </View>

          {/* SATELLITE IMAGE — property aerial view */}
          {satelliteImageUrl && (
            <View style={{ marginBottom: 24 }}>
              <Text style={s.sectionTitle}>Your Property</Text>
              <View style={{ borderWidth: 2, borderColor: NAVY, borderRadius: 2, padding: 4 }}>
                <Image
                  src={satelliteImageUrl}
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                />
              </View>
              {homeownerAddress && (
                <Text style={{ fontSize: 7.5, color: "#94a3b8", marginTop: 4, textAlign: "center" }}>
                  Satellite view — {homeownerAddress}
                </Text>
              )}
            </View>
          )}

          {/* ROOF MEASUREMENTS */}
          <Text style={s.sectionTitle}>Roof Measurements</Text>
          <View style={s.detailsGrid}>
            <View style={s.detailCard}>
              <Text style={s.detailLabel}>Total Roof Area</Text>
              <Text style={s.detailValue}>{roofAreaSqft.toLocaleString()}</Text>
              <Text style={s.detailSub}>square feet</Text>
            </View>
            <View style={s.detailCard}>
              <Text style={s.detailLabel}>Roof Pitch</Text>
              <Text style={s.detailValue}>{pitchDisplay}</Text>
              <Text style={s.detailSub}>{pitchDegrees.toFixed(1)}°</Text>
            </View>
            <View style={s.detailCard}>
              <Text style={s.detailLabel}>Complexity</Text>
              <Text style={s.detailValue}>{complexity}</Text>
              <Text style={s.detailSub}>{numSegments} segments</Text>
            </View>
            <View style={s.detailCard}>
              <Text style={s.detailLabel}>Source</Text>
              <Text style={s.detailValue}>{isSatellite ? "Satellite" : "Manual"}</Text>
              <Text style={s.detailSub}>{isSatellite ? "Google Solar API" : "Homeowner input"}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text>Prepared by {contractorName} · Powered by RuufPro</Text>
          <Text>Page 1 of {totalPages} · {date}</Text>
        </View>
      </Page>

      {/* ===== PAGE 2: Estimate + Repair + What's Included ===== */}
      <Page size="A4" style={s.page}>
        <View style={s.miniHeader}>
          <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK }}>{contractorName}</Text>
          <Text style={{ fontSize: 9, color: "#94a3b8" }}>Estimate for {homeownerName} · {date}</Text>
        </View>

        <View style={{ paddingHorizontal: 40, paddingTop: 48, paddingBottom: 20 }}>
          {/* PRIMARY ESTIMATE */}
          <View style={s.estimateBox}>
            <Text style={s.estimateLabel}>Ballpark Estimate</Text>
            <Text style={s.estimatePrice}>
              ${priceLow.toLocaleString()} – ${priceHigh.toLocaleString()}
            </Text>
            <Text style={s.estimateMaterial}>
              for {materialOptions.find(m => m.name.toLowerCase().includes(selectedMaterial))?.name || selectedMaterial}
            </Text>
            <Text style={s.estimateNote}>
              {roofAreaSqft.toLocaleString()} sqft · {pitchDisplay} pitch · {isSatellite ? "satellite-measured" : "estimated"}
            </Text>
          </View>

          {/* WHAT'S INCLUDED IN A FULL REPLACEMENT */}
          <View>
            <Text style={s.sectionTitle}>What's Included in Your Replacement</Text>
            <View style={s.includedGrid}>
              {INCLUDED_ITEMS.map((item) => (
                <View key={item} style={s.includedItem}>
                  <View style={{ width: 6, height: 6, backgroundColor: GREEN, marginTop: 4 }} />
                  <Text style={s.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* PROPERTY PROTECTION GUARANTEE — only if roofer enabled */}
          {propertyProtectionEnabled && <View>
            <Text style={s.sectionTitle}>Our Property Protection Guarantee</Text>
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 2, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: "#bfdbfe" }}>
              {PROPERTY_PROTECTION_ITEMS.map((item) => (
                <View key={item} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 6, height: 6, backgroundColor: BLUE, marginTop: 4 }} />
                  <Text style={{ fontSize: 9, color: NAVY, flex: 1, lineHeight: 1.5 }}>{item}</Text>
                </View>
              ))}
            </View>
          </View>}

          {/* CHANGE ORDER PROTOCOL — only if roofer enabled */}
          {changeOrderEnabled && <View>
            <Text style={s.sectionTitle}>What Happens If We Find Surprises</Text>
            <View style={{ backgroundColor: LIGHT, borderRadius: 2, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.5, marginBottom: 8 }}>
                If we discover rotted decking, extra shingle layers, or hidden damage during tear-off:
              </Text>
              {CHANGE_ORDER_STEPS.map((step, i) => (
                <View key={step} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: NAVY, flex: 1, lineHeight: 1.5, paddingTop: 2 }}>{step}</Text>
                </View>
              ))}
            </View>
          </View>}
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text>Prepared by {contractorName} · Powered by RuufPro</Text>
          <Text>Page 2 of {totalPages} · {date}</Text>
        </View>
      </Page>

      {/* ===== PAGE 3: Material Comparison + Next Steps ===== */}
      <Page size="A4" style={s.page}>
        <View style={s.miniHeader}>
          <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK }}>{contractorName}</Text>
          <Text style={{ fontSize: 9, color: "#94a3b8" }}>Estimate for {homeownerName} · {date}</Text>
        </View>

        <View style={s.body}>
          {/* MATERIAL COMPARISON */}
          <Text style={s.sectionTitle}>Material Options Compared</Text>
          {materialOptions.map((mat) => {
            const isSelected = mat.name.toLowerCase().includes(selectedMaterial);
            return (
              <View
                key={mat.name}
                wrap={false}
                style={{
                  ...s.matCard,
                  borderBottomColor: isSelected ? DARK : BORDER,
                  borderBottomWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? LIGHT : undefined,
                  paddingHorizontal: isSelected ? 12 : 0,
                  marginHorizontal: isSelected ? -12 : 0,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.name}</Text>
                    {isSelected && (
                      <View style={s.compBadge}>
                        <Text style={s.compBadgeText}>SELECTED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK }}>
                    ${mat.priceLow.toLocaleString()} – ${mat.priceHigh.toLocaleString()}
                  </Text>
                </View>

                <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.5, marginBottom: 6 }}>
                  {mat.description}
                </Text>

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Warranty</Text>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.warranty}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Wind Rating</Text>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.windRating}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Lifespan</Text>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.lifespan}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* CREDENTIALS */}
          <Text style={{ ...s.sectionTitle, marginTop: 12 }}>About {contractorName}</Text>
          <View style={s.credGrid}>
            {contractorInsured && (
              <View style={s.credBadge}><Text style={s.credText}>Fully Insured</Text></View>
            )}
            {contractorLicense && (
              <View style={s.credBadge}><Text style={s.credText}>Licensed #{contractorLicense}</Text></View>
            )}
            {contractorYears && contractorYears > 0 && (
              <View style={s.credBadge}><Text style={s.credText}>{contractorYears}+ Years Experience</Text></View>
            )}
            {contractorCertifications.map((cert) => (
              <View key={cert} style={s.credBadge}><Text style={s.credText}>{cert}</Text></View>
            ))}
            <View style={s.credBadge}><Text style={s.credText}>Workmanship Warranty Included</Text></View>
          </View>

          {/* FINANCING — only if roofer enabled */}
          {financingEnabled && (
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 2, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#bfdbfe" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 6 }}>
                Financing Available{financingProvider ? ` Through ${financingProvider}` : ""}
              </Text>
              <Text style={{ fontSize: 9, color: NAVY, lineHeight: 1.6 }}>
                Most homeowners qualify for affordable monthly payments.
                {financingTermMonths ? ` Terms from 60 to ${financingTermMonths} months available.` : ""}
                {" "}Ask about financing when you schedule your free inspection.
              </Text>
              {financingNote && (
                <Text style={{ fontSize: 7.5, color: GRAY, marginTop: 4, lineHeight: 1.5 }}>
                  {financingNote}
                </Text>
              )}
            </View>
          )}

          {/* DISCLAIMER */}
          <View style={s.disclaimer} wrap={false}>
            <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={s.disclaimerText}>
              Estimate based on {isSatellite ? "satellite measurement" : "the information provided"} and local market pricing, not a final quote or contract.
              Your contractor will confirm the final price after a free on-site inspection. Actual cost depends on
              roof condition, existing layers, decking integrity, access requirements, and code compliance.
              Material prices are subject to market fluctuations.
            </Text>
          </View>

          {/* NEXT STEPS */}
          <View style={s.stepsBox} wrap={false}>
            <Text style={s.stepsTitle}>Next Steps</Text>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>1</Text></View>
              <Text style={s.stepText}>Schedule your free roof inspection — we check condition, layers, decking, and access</Text>
            </View>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>2</Text></View>
              <Text style={s.stepText}>Receive your exact quote — line-by-line pricing based on inspection findings</Text>
            </View>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>3</Text></View>
              <Text style={s.stepText}>Choose your start date — we handle permits, materials, and scheduling</Text>
            </View>
            <Text style={s.stepsPhone}>{contractorPhone}</Text>
            <Text style={s.stepsSub}>Call to schedule your free inspection — no obligation</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text>Prepared by {contractorName} · Powered by RuufPro</Text>
          <Text>Page 3 of {totalPages} · {date}</Text>
        </View>
      </Page>
    </Document>
  );
}
