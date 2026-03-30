// Estimate Report PDF — comprehensive branded document inspired by
// EagleView's professional layout and Roofr's proposal format.
// Includes: material comparison, cost breakdown, warranty info,
// credentials, financing estimate, and clear next steps.

import {
  Document,
  Page,
  Text,
  View,
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
  roofAreaSqft: number;
  pitchDegrees: number;
  numSegments: number;
  selectedMaterial: string;
  priceLow: number;
  priceHigh: number;
  materialOptions: MaterialOption[];
  repairOption: RepairOption | null;
  isSatellite: boolean;
  date: string;
}

// Color palette — navy + white, inspired by EagleView's professional style
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
    backgroundColor: DARK,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {},
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  companyInfo: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 4,
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  reportDate: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: BLUE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 6,
  },
  headerBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ---- BODY ----
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
  },

  // ---- PREPARED FOR ----
  preparedFor: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  prepLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  prepValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  prepDetail: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },

  // ---- SECTION TITLE ----
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ---- ROOF DETAILS GRID ----
  detailsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  detailCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  detailLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  detailSub: {
    fontSize: 7,
    color: GRAY,
    marginTop: 1,
  },

  // ---- ESTIMATE BOX ----
  estimateBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
  },
  estimateLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  estimatePrice: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: -1,
  },
  estimateMaterial: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 2,
  },
  estimateNote: {
    fontSize: 7,
    color: GRAY,
    marginTop: 6,
  },

  // ---- MATERIAL COMPARISON ----
  compTable: {
    marginBottom: 20,
  },
  compHeader: {
    flexDirection: "row",
    backgroundColor: DARK,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  compHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  compRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  compRowHighlight: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
  },
  compCol1: { flex: 2 },
  compCol2: { flex: 2, alignItems: "center" as const },
  compCol3: { flex: 1.5, alignItems: "center" as const },
  compCol4: { flex: 1.5, alignItems: "center" as const },
  compText: { fontSize: 9, color: NAVY },
  compTextBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY },
  compTextGray: { fontSize: 8, color: GRAY },
  compBadge: {
    backgroundColor: GREEN,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 4,
  },
  compBadgeText: { fontSize: 6, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // ---- COST BREAKDOWN ----
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  breakdownLabel: { fontSize: 9, color: NAVY },
  breakdownValue: { fontSize: 9, color: NAVY },
  breakdownTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 2,
    borderTopWidth: 2,
    borderTopColor: NAVY,
  },
  breakdownTotalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY },
  breakdownTotalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY },

  // ---- FINANCING ----
  financingBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  financingLabel: { fontSize: 8, color: BLUE },
  financingValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BLUE },
  financingSub: { fontSize: 7, color: GRAY },

  // ---- CREDENTIALS ----
  credGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 20,
  },
  credBadge: {
    backgroundColor: LIGHT,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  credText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: NAVY },

  // ---- DISCLAIMER ----
  disclaimer: {
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  disclaimerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GRAY, marginBottom: 3 },
  disclaimerText: { fontSize: 7, color: GRAY, lineHeight: 1.6 },

  // ---- NEXT STEPS ----
  stepsBox: {
    backgroundColor: NAVY,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  stepsTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 10 },
  step: { flexDirection: "row", marginBottom: 6 },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stepNumText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  stepText: { fontSize: 9, color: "#cbd5e1", flex: 1, paddingTop: 2 },
  stepsPhone: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center", marginTop: 8 },
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

export function EstimateReportPDF(props: EstimateReportProps) {
  const {
    contractorName, contractorPhone, contractorCity, contractorState,
    contractorLicense, contractorInsured, contractorYears, contractorCertifications,
    homeownerName, homeownerAddress, homeownerPhone, homeownerEmail,
    roofAreaSqft, pitchDegrees, numSegments, selectedMaterial,
    priceLow, priceHigh, materialOptions, repairOption, isSatellite, date,
  } = props;

  const pitchDisplay = `${Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12)}/12`;
  const complexity = numSegments <= 2 ? "Simple" : numSegments <= 4 ? "Moderate" : numSegments <= 6 ? "Complex" : "Very Complex";
  const midPrice = Math.round((priceLow + priceHigh) / 2);
  const monthlyPayment = Math.round(midPrice / 60); // 60 month estimate

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.companyName}>{contractorName}</Text>
            <Text style={s.companyInfo}>
              {contractorCity}, {contractorState}
              {contractorLicense ? `  ·  License #${contractorLicense}` : ""}
              {"\n"}{contractorPhone}
            </Text>
          </View>
          <View style={s.headerRight}>
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

          {/* ROOF DETAILS */}
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
          </View>

          {/* REPAIR OPTION */}
          {repairOption && (
            <View style={{ marginBottom: 16 }}>
              <Text style={s.sectionTitle}>Roof Repair & Maintenance</Text>
              <View style={{ backgroundColor: "#fffbeb", borderRadius: 6, padding: 12, borderWidth: 1, borderColor: "#fde68a" }}>
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
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BLUE, marginTop: 6 }}>
                  Interested in repair? Call {contractorPhone}
                </Text>
              </View>
            </View>
          )}

          {/* MATERIAL COMPARISON — Good/Better/Best */}
          <Text style={s.sectionTitle}>Full Replacement Options</Text>
          <View style={s.compTable}>
            {materialOptions.map((mat) => {
              const isSelected = mat.name.toLowerCase().includes(selectedMaterial);
              return (
                <View
                  key={mat.name}
                  style={{
                    marginBottom: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isSelected ? "#bbf7d0" : BORDER,
                    backgroundColor: isSelected ? "#f0fdf4" : LIGHT,
                    padding: 10,
                  }}
                >
                  {/* Header row: name + price */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY }}>{mat.name}</Text>
                      {isSelected && (
                        <View style={s.compBadge}>
                          <Text style={s.compBadgeText}>SELECTED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY }}>
                      ${mat.priceLow.toLocaleString()} – ${mat.priceHigh.toLocaleString()}
                    </Text>
                  </View>

                  {/* Description */}
                  <Text style={{ fontSize: 8, color: GRAY, lineHeight: 1.5, marginBottom: 6 }}>
                    {mat.description}
                  </Text>

                  {/* Specs row */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 6, color: GRAY, textTransform: "uppercase", letterSpacing: 0.3 }}>Warranty</Text>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY }}>{mat.warranty}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 6, color: GRAY, textTransform: "uppercase", letterSpacing: 0.3 }}>Wind Rating</Text>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY }}>{mat.windRating}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 6, color: GRAY, textTransform: "uppercase", letterSpacing: 0.3 }}>Lifespan</Text>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY }}>{mat.lifespan}</Text>
                    </View>
                  </View>

                  {/* Per-material CTA */}
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: BLUE, marginTop: 6 }}>
                    Interested in {mat.name.split(" ")[0].toLowerCase()}? Call {contractorPhone} for your exact quote
                  </Text>
                </View>
              );
            })}
          </View>

        </View>

        {/* FOOTER — Page 1 */}
        <View style={s.footer}>
          <Text>Powered by RuufPro · ruufpro.com</Text>
          <Text>Page 1 of 2 · {date}</Text>
        </View>
      </Page>

      {/* ===== PAGE 2 ===== */}
      <Page size="A4" style={s.page}>
        {/* Mini header */}
        <View style={{ backgroundColor: DARK, paddingHorizontal: 40, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{contractorName}</Text>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>Estimate for {homeownerName} · {date}</Text>
        </View>

        <View style={s.body}>
          {/* FINANCING */}
          <Text style={s.sectionTitle}>Financing Options</Text>
          <View style={s.financingBox}>
            <View>
              <Text style={s.financingLabel}>Estimated Monthly Payment</Text>
              <Text style={s.financingSub}>Based on 60-month financing at 0% introductory rate</Text>
            </View>
            <View style={{ alignItems: "flex-end" as const }}>
              <Text style={s.financingValue}>${monthlyPayment}/mo</Text>
              <Text style={s.financingSub}>Subject to credit approval</Text>
            </View>
          </View>

          {/* CREDENTIALS */}
          <Text style={s.sectionTitle}>About {contractorName}</Text>
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

          {/* DISCLAIMER */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={s.disclaimerText}>
              This is a ballpark estimate, not a final quote or contract. Your actual price depends on roof condition,
              number of existing layers, decking integrity, access requirements, code compliance, and other factors
              that can only be assessed during an in-person inspection. Final pricing may be higher or lower than
              this range. Material prices are subject to market fluctuations. This estimate is valid for 30 days.
            </Text>
          </View>

          {/* NEXT STEPS */}
          <View style={s.stepsBox}>
            <Text style={s.stepsTitle}>Next Steps</Text>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>1</Text></View>
              <Text style={s.stepText}>Schedule your free roof inspection — we assess condition, layers, and access</Text>
            </View>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>2</Text></View>
              <Text style={s.stepText}>Receive your exact quote — detailed pricing based on the inspection findings</Text>
            </View>
            <View style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>3</Text></View>
              <Text style={s.stepText}>Choose your start date — we handle permits, materials, and scheduling</Text>
            </View>
            <Text style={s.stepsPhone}>{contractorPhone}</Text>
            <Text style={s.stepsSub}>Call or text to schedule your free inspection — no obligation</Text>
          </View>
        </View>

        {/* FOOTER — Page 2 */}
        <View style={s.footer}>
          <Text>Powered by RuufPro · ruufpro.com</Text>
          <Text>Page 2 of 2 · {date}</Text>
        </View>
      </Page>
    </Document>
  );
}
