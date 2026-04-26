import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeQrShortCode } from "@/lib/property-pipeline/qr-code";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ruufpro.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = normalizeQrShortCode(rawCode ?? "");
  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/?ppmiss=invalid`, 302);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: mailing } = await supabase
    .from("mailing_history")
    .select("id, contractor_id, qr_scanned_at")
    .eq("qr_short_code", code)
    .maybeSingle();

  if (!mailing) {
    return NextResponse.redirect(`${SITE_URL}/?ppmiss=notfound`, 302);
  }

  // Log scan (first scan only — preserve original timestamp on re-scans)
  if (!mailing.qr_scanned_at) {
    await supabase
      .from("mailing_history")
      .update({
        qr_scanned_at: new Date().toISOString(),
        status: "scanned",
      })
      .eq("id", mailing.id);
  }

  const target = `${SITE_URL}/chat/${mailing.contractor_id}?src=pp&card=${code}`;
  return NextResponse.redirect(target, 302);
}
