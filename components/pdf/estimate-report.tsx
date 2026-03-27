// Estimate Report PDF — branded document that homeowners receive
// after getting their ballpark estimate. Includes contractor branding,
// satellite measurement details, price range, and inspection CTA.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

interface EstimateReportProps {
  contractorName: string;
  contractorPhone: string;
  contractorCity: string;
  contractorState: string;
  contractorLicense: string | null;
  homeownerName: string;
  homeownerAddress: string | null;
  roofAreaSqft: number;
  pitchDegrees: number;
  material: string;
  priceLow: number;
  priceHigh: number;
  isSatellite: boolean;
  date: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  companyDetails: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  estimateBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
  },
  estimateLabel: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  estimatePrice: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  estimateMaterial: {
    fontSize: 11,
    color: "#4b5563",
  },
  estimateDetail: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  disclaimerTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 8,
    color: "#9ca3af",
    lineHeight: 1.5,
  },
  cta: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  ctaPhone: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  ctaSub: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#d1d5db",
  },
});

export function EstimateReportPDF({
  contractorName,
  contractorPhone,
  contractorCity,
  contractorState,
  contractorLicense,
  homeownerName,
  homeownerAddress,
  roofAreaSqft,
  pitchDegrees,
  material,
  priceLow,
  priceHigh,
  isSatellite,
  date,
}: EstimateReportProps) {
  const pitchDisplay = `${Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12)}/12`;
  const materialLabel =
    material === "asphalt" ? "Asphalt Shingles" :
    material === "metal" ? "Standing Seam Metal" :
    material === "tile" ? "Tile (Clay/Concrete)" :
    material === "flat" ? "Flat Roof (TPO/EPDM)" : material;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{contractorName}</Text>
            <Text style={styles.companyDetails}>
              {contractorCity}, {contractorState}
              {contractorLicense ? ` · License #${contractorLicense}` : ""}
            </Text>
            <Text style={styles.companyDetails}>{contractorPhone}</Text>
          </View>
          <Text style={styles.badge}>BALLPARK ESTIMATE</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Roof Estimate for {homeownerName}</Text>
        <Text style={styles.subtitle}>
          Prepared {date}
          {homeownerAddress ? ` · ${homeownerAddress}` : ""}
        </Text>

        {/* Roof Details Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Roof Area</Text>
            <Text style={styles.infoValue}>{roofAreaSqft.toLocaleString()} sqft</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pitch</Text>
            <Text style={styles.infoValue}>{pitchDisplay}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Measurement</Text>
            <Text style={styles.infoValue}>{isSatellite ? "Satellite" : "Estimated"}</Text>
          </View>
        </View>

        {/* Estimate */}
        <View style={styles.estimateBox}>
          <Text style={styles.estimateLabel}>Ballpark Estimate</Text>
          <Text style={styles.estimatePrice}>
            ${priceLow.toLocaleString()} – ${priceHigh.toLocaleString()}
          </Text>
          <Text style={styles.estimateMaterial}>for {materialLabel}</Text>
          <Text style={styles.estimateDetail}>
            {roofAreaSqft.toLocaleString()} sqft · {pitchDisplay} pitch · {isSatellite ? "satellite-measured" : "estimated"}
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Important Note</Text>
          <Text style={styles.disclaimerText}>
            This is a ballpark estimate, not a final quote. Your actual price depends on
            roof condition, access, number of existing layers, code requirements, and other
            factors that can only be assessed during an in-person inspection. Final pricing
            may be higher or lower than this range.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Get Your Exact Price</Text>
          <Text style={styles.ctaPhone}>{contractorPhone}</Text>
          <Text style={styles.ctaSub}>Schedule your free inspection — no obligation</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Powered by RoofReady</Text>
          <Text>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
