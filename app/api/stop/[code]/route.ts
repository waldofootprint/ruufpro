import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { normalizeQrShortCode } from "@/lib/property-pipeline/qr-code";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = normalizeQrShortCode(rawCode ?? "");
  if (!code) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const scope: "contractor" | "global" =
    body?.scope === "global" ? "global" : "contractor";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: mailing } = await supabase
    .from("mailing_history")
    .select(
      "id, contractor_id, candidate_id, candidates:candidate_id(address_normalized)"
    )
    .eq("qr_short_code", code)
    .maybeSingle();

  if (!mailing) {
    return NextResponse.json({ error: "Code not found." }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addressNormalized = (mailing.candidates as any)?.address_normalized;
  if (!addressNormalized) {
    return NextResponse.json(
      { error: "Could not resolve property." },
      { status: 500 }
    );
  }
  const addressHash = createHash("sha256")
    .update(addressNormalized)
    .digest("hex");

  // Always write a per-contractor row. If global, ALSO write a NULL contractor_id row.
  const rows: Array<{
    address_hash: string;
    contractor_id: string | null;
    source: string;
    reason: string;
  }> = [
    {
      address_hash: addressHash,
      contractor_id: mailing.contractor_id,
      source: "postcard_qr",
      reason: scope === "global" ? "homeowner_global" : "homeowner_contractor",
    },
  ];
  if (scope === "global") {
    rows.push({
      address_hash: addressHash,
      contractor_id: null,
      source: "postcard_qr",
      reason: "homeowner_global",
    });
  }

  const { error } = await supabase
    .from("mail_suppressions")
    .upsert(rows, { onConflict: "address_hash,contractor_id" });

  if (error) {
    console.error("[stop] suppression upsert failed", error);
    return NextResponse.json(
      { error: "Could not record opt-out. Try again or email support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, scope });
}
