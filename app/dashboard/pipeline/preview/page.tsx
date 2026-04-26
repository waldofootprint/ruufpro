import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  renderPostcardFront,
  renderPostcardBack,
  type PostcardData,
} from "@/lib/property-pipeline/postcard-template";

export const dynamic = "force-dynamic";

const SAMPLE_HOMEOWNER_ADDRESS = "8734 54th Ave E, Bradenton 34211";

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
    .select("business_name, phone, license_number")
    .eq("user_id", user.id)
    .single();

  const data: PostcardData = {
    homeownerName: null,
    propertyAddress: SAMPLE_HOMEOWNER_ADDRESS,
    contractorBusinessName: contractor?.business_name ?? "Your Roofing Co.",
    contractorPhone: contractor?.phone ?? "(555) 555-5555",
    contractorLicenseNumber: contractor?.license_number ?? "[Set in Settings]",
    qrShortCode: "2A3B4C",
    qrUrl: "https://ruufpro.com/m/2A3B4C",
    optOutUrl: "https://ruufpro.com/stop/2A3B4C",
  };

  const frontHtml = renderPostcardFront(data);
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
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Postcard preview (step 4 minimal template)
        </h1>
        <p style={{ color: "#666", marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
          Live render with your business data + sample homeowner address.
          Format: 6×11 in (1125×625 px). Front and back shown below at scaled
          size. The full creative + with-photo variant land in step 5; the
          verbatim SB 76 disclosure (currently a flagged{" "}
          <code style={{ background: "#fee", padding: "2px 4px" }}>
            [PLACEHOLDER]
          </code>{" "}
          on the back) wires in step 6.
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

      <Side title="Front" html={frontHtml} />
      <Side title="Back" html={backHtml} />
    </main>
  );
}

function Side({ title, html }: { title: string; html: string }) {
  // Scale 1125×625 down to fit ~880×489 (≈78%) for on-screen viewing.
  const scaledW = 880;
  const scaledH = Math.round((625 / 1125) * scaledW);
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
        {title}
      </h2>
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
    </section>
  );
}
