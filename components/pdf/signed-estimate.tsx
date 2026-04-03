// Signed Estimate PDF — legal record of the homeowner's accepted estimate.
// Includes the frozen snapshot of material/add-on selections, signature image,
// signer details, and ESIGN Act compliance info.

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

interface SignedEstimatePDFProps {
  contractorName: string;
  contractorPhone: string;
  contractorCity: string;
  contractorState: string;
  contractorLicense: string | null;
  homeownerName: string;
  homeownerAddress: string | null;
  roofAreaSqft: number;
  materialLabel: string;
  materialWarranty: string;
  materialLifespan: string;
  priceLow: number;
  priceHigh: number;
  addons: { name: string; price: number }[];
  addonsTotal: number;
  totalLow: number;
  totalHigh: number;
  signatureDataUrl: string;
  signerName: string;
  signerEmail: string | null;
  signerIp: string;
  signedAt: string;
  date: string;
}

const NAVY = "#1e293b";
const DARK = "#0f172a";
const GREEN = "#059669";
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
  header: {
    backgroundColor: DARK,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
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
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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

export function SignedEstimatePDF(props: SignedEstimatePDFProps) {
  const {
    contractorName, contractorPhone, contractorCity, contractorState,
    contractorLicense, homeownerName, homeownerAddress, roofAreaSqft,
    materialLabel, materialWarranty, materialLifespan,
    priceLow, priceHigh, addons, addonsTotal, totalLow, totalHigh,
    signatureDataUrl, signerName, signerEmail, signerIp, signedAt, date,
  } = props;

  return (
    <Document>
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
            <View style={{ backgroundColor: GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 }}>
                Signed Estimate
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 4 }}>{date}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* PREPARED FOR / BY */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
            <View>
              <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Prepared For</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY }}>{homeownerName}</Text>
              {homeownerAddress && <Text style={{ fontSize: 8, color: GRAY, marginTop: 2 }}>{homeownerAddress}</Text>}
            </View>
            <View style={{ alignItems: "flex-end" as const }}>
              <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Prepared By</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY }}>{contractorName}</Text>
              <Text style={{ fontSize: 8, color: GRAY, marginTop: 2 }}>{contractorPhone}</Text>
            </View>
          </View>

          {/* ACCEPTED ESTIMATE */}
          <Text style={s.sectionTitle}>Accepted Estimate</Text>
          <View style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#bbf7d0" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY }}>{materialLabel}</Text>
              <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: NAVY }}>
                ${priceLow.toLocaleString()} – ${priceHigh.toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View>
                <Text style={{ fontSize: 6, color: GRAY, textTransform: "uppercase" }}>Roof Area</Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY }}>{roofAreaSqft.toLocaleString()} sqft</Text>
              </View>
              <View>
                <Text style={{ fontSize: 6, color: GRAY, textTransform: "uppercase" }}>Warranty</Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY }}>{materialWarranty}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 6, color: GRAY, textTransform: "uppercase" }}>Lifespan</Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY }}>{materialLifespan}</Text>
              </View>
            </View>
          </View>

          {/* ADD-ONS */}
          {addons.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={s.sectionTitle}>Selected Add-Ons</Text>
              {addons.map((addon) => (
                <View key={addon.name} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <Text style={{ fontSize: 9, color: NAVY }}>{addon.name}</Text>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY }}>${addon.price.toLocaleString()}</Text>
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: GRAY }}>Add-Ons Subtotal</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY }}>${addonsTotal.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* TOTAL */}
          <View style={{ backgroundColor: NAVY, borderRadius: 8, padding: 16, marginBottom: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Total Accepted Estimate
            </Text>
            <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: -1 }}>
              ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
            </Text>
          </View>

          {/* SIGNATURE */}
          <Text style={s.sectionTitle}>Electronic Signature</Text>
          <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase", marginBottom: 2 }}>Signed By</Text>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY }}>{signerName}</Text>
                {signerEmail && <Text style={{ fontSize: 8, color: GRAY, marginTop: 1 }}>{signerEmail}</Text>}
              </View>
              <View style={{ alignItems: "flex-end" as const }}>
                <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase", marginBottom: 2 }}>Date & Time</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY }}>{signedAt}</Text>
              </View>
            </View>

            {/* Signature image */}
            <View style={{ borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 }}>
              <Image src={signatureDataUrl} style={{ height: 60, objectFit: "contain" as const }} />
            </View>
          </View>

          {/* AUDIT TRAIL */}
          <View style={{ backgroundColor: LIGHT, borderRadius: 6, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: BORDER }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY, marginBottom: 4 }}>ESIGN Act Audit Trail</Text>
            <Text style={{ fontSize: 7, color: GRAY, lineHeight: 1.5 }}>
              Signer: {signerName}
              {signerEmail ? `  ·  ${signerEmail}` : ""}
              {"\n"}IP Address: {signerIp}
              {"\n"}Signed: {signedAt}
              {"\n"}Method: Electronic signature via RuufPro (HTML5 Canvas)
            </Text>
          </View>

          {/* DISCLAIMER */}
          <View style={{ backgroundColor: LIGHT, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: BORDER }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY, marginBottom: 3 }}>Important Disclaimer</Text>
            <Text style={{ fontSize: 7, color: GRAY, lineHeight: 1.6 }}>
              This signed estimate acknowledges the homeowner&apos;s interest in proceeding and is NOT a binding contract.
              The price range shown is a ballpark estimate based on satellite imagery and regional pricing data.
              Final pricing will be determined after an in-person inspection assessing roof condition, existing layers,
              decking integrity, access requirements, and local code compliance. Material prices are subject to market
              fluctuations. By signing, the homeowner acknowledges this is an estimate, not a guaranteed price.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text>Powered by RuufPro · ruufpro.com</Text>
          <Text>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
