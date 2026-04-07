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

interface RepairOption {
  priceLow: number;
  priceHigh: number;
  description: string;
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
  repairOption: RepairOption | null;
  isSatellite: boolean;
  satelliteImageUrl?: string | null;
  date: string;
}

// Color palette — navy + white, professional
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

  // ---- HEADER (Clean Minimal — white bg, bottom border) ----
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
    fontSize: 8.5,
    color: "#94a3b8",
    marginTop: 4,
  },
  reportTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reportDate: {
    fontSize: 8,
    color: "#cbd5e1",
    marginTop: 3,
  },
  headerBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  headerBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ---- MINI HEADER (page 2+) ----
  miniHeader: {
    paddingHorizontal: 40,
    paddingVertical: 12,
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
    marginBottom: 28,
  },
  prepLabel: {
    fontSize: 6.5,
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  prepValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  prepDetail: {
    fontSize: 8.5,
    color: "#94a3b8",
    marginTop: 2,
  },

  // ---- SECTION TITLE ----
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    marginBottom: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // ---- ROOF DETAILS GRID (border-bottom stats, no cards) ----
  detailsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
  },
  detailCard: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: DARK,
    paddingBottom: 12,
  },
  detailLabel: {
    fontSize: 7,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: -0.5,
  },
  detailSub: {
    fontSize: 7,
    color: "#cbd5e1",
    marginTop: 1,
  },

  // ---- ESTIMATE BOX (square, bordered, no background) ----
  estimateBox: {
    borderWidth: 2,
    borderColor: DARK,
    padding: 28,
    marginBottom: 28,
    alignItems: "center",
  },
  estimateLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  estimatePrice: {
    fontSize: 40,
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
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 6,
  },

  // ---- MATERIAL CARD ----
  matCard: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 10,
    paddingTop: 10,
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
    marginBottom: 24,
  },
  includedItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    paddingVertical: 3,
  },
  checkmark: {
    fontSize: 9,
    color: GREEN,
    fontFamily: "Helvetica-Bold",
  },
  includedText: {
    fontSize: 8,
    color: DARK,
    flex: 1,
  },

  // ---- CREDENTIALS ----
  credGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 24,
  },
  credBadge: {
    backgroundColor: LIGHT,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  credText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: DARK },

  // ---- DISCLAIMER ----
  disclaimer: {
    backgroundColor: LIGHT,
    borderRadius: 0,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  disclaimerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", marginBottom: 3 },
  disclaimerText: { fontSize: 7, color: "#94a3b8", lineHeight: 1.6 },

  // ---- NEXT STEPS ----
  stepsBox: {
    borderWidth: 2,
    borderColor: DARK,
    padding: 16,
    marginBottom: 16,
  },
  stepsTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 10 },
  step: { flexDirection: "row", marginBottom: 6 },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: DARK,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stepNumText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  stepText: { fontSize: 9, color: GRAY, flex: 1, paddingTop: 2 },
  stepsPhone: { fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK, textAlign: "center", marginTop: 8 },
  stepsSub: { fontSize: 8, color: "#94a3b8", textAlign: "center", marginTop: 2 },

  // ---- FOOTER ----
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#cbd5e1",
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
    priceLow, priceHigh, materialOptions, repairOption, isSatellite, satelliteImageUrl, date,
    propertyProtectionEnabled, changeOrderEnabled,
    financingEnabled, financingProvider, financingTermMonths, financingApr, financingNote,
  } = props;

  const pitchDisplay = `${Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12)}/12`;
  const complexity = numSegments <= 2 ? "Simple" : numSegments <= 4 ? "Moderate" : numSegments <= 6 ? "Complex" : "Very Complex";
  const totalPages = materialOptions.length > 2 ? 3 : 2;

  // Calculate expiration date (30 days from report date)
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 30);
  const expiresFormatted = expiresDate.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Document>
      {/* ===== PAGE 1: Estimate + Roof Details ===== */}
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
            <View style={{ marginBottom: 24 }} wrap={false}>
              <Text style={s.sectionTitle}>Your Property</Text>
              <Image
                src={satelliteImageUrl}
                style={{ width: "100%", height: 180, objectFit: "cover" }}
              />
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
            <Text style={{ fontSize: 7, color: "#b91c1c", fontFamily: "Helvetica-Bold", marginTop: 8 }}>
              Estimate valid through {expiresFormatted}
            </Text>
          </View>

          {/* REPAIR OPTION */}
          {repairOption && (
            <View wrap={false}>
              <Text style={s.sectionTitle}>Repair Alternative</Text>
              <View style={{ backgroundColor: "#fffbeb", borderRadius: 6, padding: 12, borderWidth: 1, borderColor: "#fde68a", marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY }}>
                    ${repairOption.priceLow.toLocaleString()} – ${repairOption.priceHigh.toLocaleString()}
                  </Text>
                  <View style={{ backgroundColor: "#f59e0b", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                    <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>LOWEST COST</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 8, color: GRAY, lineHeight: 1.5 }}>
                  {repairOption.description}
                </Text>
              </View>
            </View>
          )}

          {/* WHAT'S INCLUDED IN A FULL REPLACEMENT */}
          <View wrap={false}>
            <Text style={s.sectionTitle}>What's Included in Your Replacement</Text>
            <View style={s.includedGrid}>
              {INCLUDED_ITEMS.map((item) => (
                <View key={item} style={s.includedItem}>
                  <Text style={s.checkmark}>✓</Text>
                  <Text style={s.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* PROPERTY PROTECTION GUARANTEE — only if roofer enabled */}
          {propertyProtectionEnabled && <View wrap={false}>
            <Text style={s.sectionTitle}>Our Property Protection Guarantee</Text>
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 6, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#bfdbfe" }}>
              {PROPERTY_PROTECTION_ITEMS.map((item) => (
                <View key={item} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: BLUE, fontFamily: "Helvetica-Bold" }}>●</Text>
                  <Text style={{ fontSize: 8, color: NAVY, flex: 1, lineHeight: 1.5 }}>{item}</Text>
                </View>
              ))}
            </View>
          </View>}

          {/* CHANGE ORDER PROTOCOL — only if roofer enabled */}
          {changeOrderEnabled && <View wrap={false}>
            <Text style={s.sectionTitle}>What Happens If We Find Surprises</Text>
            <View style={{ backgroundColor: LIGHT, borderRadius: 6, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 8, color: GRAY, lineHeight: 1.5, marginBottom: 8 }}>
                If we discover rotted decking, extra shingle layers, or hidden damage during tear-off:
              </Text>
              {CHANGE_ORDER_STEPS.map((step, i) => (
                <View key={step} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: NAVY, flex: 1, lineHeight: 1.5, paddingTop: 2 }}>{step}</Text>
                </View>
              ))}
            </View>
          </View>}
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text>Powered by RuufPro · ruufpro.com</Text>
          <Text>Page 1 of {totalPages} · {date}</Text>
        </View>
      </Page>

      {/* ===== PAGE 2: Material Comparison ===== */}
      <Page size="A4" style={s.page}>
        <View style={s.miniHeader}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK }}>{contractorName}</Text>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>Estimate for {homeownerName} · {date}</Text>
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

                <Text style={{ fontSize: 8, color: GRAY, lineHeight: 1.5, marginBottom: 6 }}>
                  {mat.description}
                </Text>

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Warranty</Text>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.warranty}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Wind Rating</Text>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.windRating}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Lifespan</Text>
                    <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK }}>{mat.lifespan}</Text>
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
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 6, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#bfdbfe" }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 6 }}>
                Financing Available{financingProvider ? ` Through ${financingProvider}` : ""}
              </Text>
              <Text style={{ fontSize: 8, color: NAVY, lineHeight: 1.6 }}>
                Most homeowners qualify for affordable monthly payments.
                {financingTermMonths ? ` Terms from 60 to ${financingTermMonths} months available.` : ""}
                {" "}Ask about financing when you schedule your free inspection.
              </Text>
              {financingNote && (
                <Text style={{ fontSize: 7, color: GRAY, marginTop: 4, lineHeight: 1.5 }}>
                  {financingNote}
                </Text>
              )}
            </View>
          )}

          {/* DISCLAIMER */}
          <View style={s.disclaimer} wrap={false}>
            <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={s.disclaimerText}>
              This is a ballpark estimate based on {isSatellite ? "satellite imagery" : "the information provided"}, not a final quote or contract.
              Your actual price depends on roof condition, number of existing layers, decking integrity, access
              requirements, code compliance, and other factors that can only be assessed during an in-person inspection.
              Final pricing may be higher or lower than this range. Material prices are subject to market fluctuations.
              This estimate is valid through {expiresFormatted}.
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
          <Text>Powered by RuufPro · ruufpro.com</Text>
          <Text>Page 2 of {totalPages} · {date}</Text>
        </View>
      </Page>
    </Document>
  );
}
