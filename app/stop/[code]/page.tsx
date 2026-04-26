import { createClient } from "@supabase/supabase-js";
import { normalizeQrShortCode } from "@/lib/property-pipeline/qr-code";
import { OptOutForm } from "./form";

interface Props {
  params: Promise<{ code: string }>;
}

export const dynamic = "force-dynamic";

export default async function StopPage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = normalizeQrShortCode(rawCode ?? "");

  if (!code) {
    return <Shell title="Invalid code">That opt-out code isn&apos;t valid. Check the postcard for the correct 6-character code.</Shell>;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: mailing } = await supabase
    .from("mailing_history")
    .select("id, contractor_id, contractors:contractor_id(business_name)")
    .eq("qr_short_code", code)
    .maybeSingle();

  if (!mailing) {
    return <Shell title="Code not found">We couldn&apos;t locate that code. If you received a postcard recently, double-check the printed code.</Shell>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const businessName = (mailing.contractors as any)?.business_name ?? "this contractor";

  return (
    <Shell title="Opt out of mail">
      <p style={{ marginBottom: 16 }}>
        We received your request. To confirm, choose what you&apos;d like to stop:
      </p>
      <OptOutForm code={code} businessName={businessName} />
      <p style={{ fontSize: 13, color: "#666", marginTop: 24 }}>
        Opt-outs are honored within 7 days. Your address will not be re-mailed by RuufPro on behalf of {businessName} (or any contractor, if you choose the all-mail option below).
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1a1a1a" }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>{title}</h1>
      {children}
    </main>
  );
}
