import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  renderPostcardFront,
  renderPostcardBack,
  type FrontVariant,
  type PostcardData,
} from "@/lib/property-pipeline/postcard-template";
import { generateQrPngDataUrl } from "@/lib/property-pipeline/qr-code";

export const dynamic = "force-dynamic";

const SAMPLE_HOMEOWNER_ADDRESS = "8734 54th Ave E, Bradenton 34211";

type VariantMeta = { name: string; tagline: string; backStatus: "ready" | "pending" };
const VARIANT_LABELS: Record<FrontVariant, VariantMeta> = {
  A: { name: "A · Press Bulletin",      tagline: "PRIMARY — sends default to this · broadsheet · charcoal metal photo · ember accent", backStatus: "ready" },
  B: { name: "B · Tool Catalog",        tagline: "industrial hardware · black + safety yellow · diagonal stripe · vertical sidebar", backStatus: "ready" },
  C: { name: "C · Material Catalog",    tagline: "Pantone-style swatch card · cream + clay + ink · 3 material samples · BACK PENDING", backStatus: "pending" },
  D: { name: "D · Forensic Specimen",   tagline: "case-file specimen box · graph paper + ink + steel blue · BACK PENDING", backStatus: "pending" },
  E: { name: "E · Italian Editorial",   tagline: "Vogue-style full-bleed tile macro · italic display · BACK PENDING", backStatus: "pending" },
  F: { name: "F · Blueprint",           tagline: "engineering-document wireframe · navy + cyan + ember · SVG roof drawing · BACK PENDING", backStatus: "pending" },
  G: { name: "G · Trade Card",          tagline: "19th-century woodblock heritage · cream + brick red · double-rule frame · BACK PENDING", backStatus: "pending" },
};
const VARIANT_ORDER: FrontVariant[] = ["A", "B", "C", "D", "E", "F", "G"];

export default async function PostcardPreviewPage({
  searchParams,
}: {
  searchParams?: { v?: string };
}) {
  const requestedVariant = (searchParams?.v ?? "A").toUpperCase();
  const activeVariant: FrontVariant = (
    VARIANT_ORDER.includes(requestedVariant as FrontVariant) ? requestedVariant : "A"
  ) as FrontVariant;
  const cookieStore = cookies();
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* read-only */
          }
        },
      },
    }
  );
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/dashboard/pipeline/preview");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("business_name, phone, license_number, address, city, state, zip")
    .eq("user_id", user.id)
    .single();

  const mailingAddress = contractor?.address && contractor?.city && contractor?.state && contractor?.zip
    ? `${contractor.address} · ${contractor.city} ${contractor.state} ${contractor.zip}`
    : null;

  const qrUrl = "https://ruufpro.com/m/2A3B4C";
  const qrDataUrl = await generateQrPngDataUrl(qrUrl);
  const data: PostcardData = {
    homeownerName: null,
    propertyAddress: SAMPLE_HOMEOWNER_ADDRESS,
    contractorBusinessName: contractor?.business_name ?? "Your Roofing Co.",
    contractorPhone: contractor?.phone ?? "(555) 555-5555",
    contractorLicenseNumber: contractor?.license_number ?? "[Set in Settings]",
    contractorMailingAddress: mailingAddress,
    qrShortCode: "2A3B4C",
    qrUrl,
    qrDataUrl,
    optOutUrl: "https://ruufpro.com/stop/2A3B4C",
  };

  // Render only the active variant's front + back.
  const activeMeta = VARIANT_LABELS[activeVariant];
  const activeFront = renderPostcardFront(data, { variant: activeVariant });
  const activeBack = renderPostcardBack(data, { variant: activeVariant });

  return (
    <main
      style={{
        maxWidth: 1320,
        margin: "32px auto",
        padding: "0 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Postcard preview — Press Bulletin / Tool Catalog
        </h1>
        <p style={{ color: "#666", marginTop: 8, fontSize: 14, lineHeight: 1.5, maxWidth: 820 }}>
          Live render with your business data + sample homeowner address.
          Format: 6×11 in (1125×625 px). Two locked design directions — each
          owns its own front + back. Shared headline copy: <em>&ldquo;The
          worst roof damage is the kind you don&rsquo;t see coming.&rdquo;</em>
          {" "}SB 76 §489.147(1)(a) verbatim disclosure + half-rule font cap
          (32px max, 16px floor) compliant on both variants.
        </p>
        {!contractor?.license_number && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            ⚠️ Your <strong>FL license number</strong> isn&apos;t set on the
            contractor profile. Real sends are blocked until it&apos;s filled in
            (statute §489.119 requires it on every postcard).
          </div>
        )}
      </header>

      {/* Tabs nav */}
      <nav
        style={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          borderBottom: "2px solid #1a1a1a",
          marginBottom: 28,
        }}
      >
        {VARIANT_ORDER.map((v) => {
          const meta = VARIANT_LABELS[v];
          const isActive = v === activeVariant;
          return (
            <a
              key={v}
              href={`?v=${v}`}
              style={{
                padding: "10px 16px",
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                textDecoration: "none",
                color: isActive ? "#fff" : "#555",
                background: isActive ? "#1a1a1a" : "transparent",
                border: isActive ? "2px solid #1a1a1a" : "2px solid transparent",
                borderBottom: "none",
                borderRadius: "8px 8px 0 0",
                marginBottom: -2,
                position: "relative",
              }}
            >
              {meta.name.split(" · ")[0]}
              {meta.backStatus === "pending" && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 9,
                    padding: "2px 5px",
                    background: isActive ? "#f5b014" : "#f0d488",
                    color: "#1a1a1a",
                    borderRadius: 3,
                    letterSpacing: "0.12em",
                  }}
                >
                  WIP
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Active variant section */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
          {activeMeta.name}
        </h2>
        <p
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#888",
            margin: "0 0 18px",
          }}
        >
          {activeMeta.tagline}
        </p>

        {activeMeta.backStatus === "pending" && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fff7ed",
              border: "1px solid #f5b014",
              borderLeft: "3px solid #f5b014",
              borderRadius: 6,
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 18,
              color: "#5a3e0a",
            }}
          >
            <strong>Back design pending.</strong> Front is wired and previewable; matching back will be built in a follow-up session. This variant is not selectable for live sends until the back is complete.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          <Card title="Front" html={activeFront} />
          <Card
            title={activeMeta.backStatus === "ready" ? "Back" : "Back · placeholder"}
            html={activeBack}
          />
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  html,
  fullWidth = false,
}: {
  title: string;
  html: string;
  fullWidth?: boolean;
}) {
  // Front grid: 2-col → ~620px wide. Back full-width: 880px.
  const scaledW = fullWidth ? 880 : 620;
  const scaledH = Math.round((625 / 1125) * scaledW);
  return (
    <div>
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#666",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: scaledW,
          height: scaledH,
          border: "1px solid #ddd",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          background: "#fff",
          position: "relative",
        }}
      >
        <iframe
          srcDoc={html}
          title={`Postcard ${title}`}
          style={{
            width: 1125,
            height: 625,
            border: "none",
            transformOrigin: "0 0",
            transform: `scale(${scaledW / 1125})`,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
}
