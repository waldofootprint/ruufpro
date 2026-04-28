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

const VARIANT_LABELS: Record<FrontVariant, string> = {
  A: "A · Storm-led",
  B: "B · Public-records-led",
  C: "C · Block-comparison",
  D: "D · Permit-honesty (PRIMARY — sends default to this)",
};

export default async function PostcardPreviewPage() {
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

  // Order: D first (primary), then A/B/C as alternates.
  const variants: FrontVariant[] = ["D", "A", "B", "C"];
  const fronts = variants.map((v) => ({
    variant: v,
    label: VARIANT_LABELS[v],
    html: renderPostcardFront(data, { variant: v }),
  }));
  const backHtml = renderPostcardBack(data);

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
          Postcard preview — 3D-Discovery v6
        </h1>
        <p style={{ color: "#666", marginTop: 8, fontSize: 14, lineHeight: 1.5, maxWidth: 820 }}>
          Live render with your business data + sample homeowner address.
          Format: 6×11 in (1125×625 px). Four front variants ship and round-robin
          in production until performance data picks the winner; one back is
          shared. SB 76 disclosure + half-rule font cap (32px max, 16px floor)
          locked.
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

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Front variants (pick one or ship all four)
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          {fronts.map((f) => (
            <Card key={f.variant} title={f.label} html={f.html} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Back (shared across all variants)
        </h2>
        <Card title="Back · question trio + QR" html={backHtml} fullWidth />
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
