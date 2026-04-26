import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  AUTH_TEXT,
  AUTH_VERSION,
  AUTH_VERSION_HASH,
} from "@/lib/property-pipeline/auth-text";

// FL DBPR contractor license format. Common roofing-relevant prefixes:
//   CCC = Certified Roofing Contractor
//   CGC = Certified General Contractor
//   CRC = Certified Residential Contractor
//   CB  = Certified Building Contractor
//   RR  = Registered Roofing Contractor
//   RC  = Registered Roofing
// Hannah eyeballs DBPR for the design partner; this regex catches typos only.
const FL_LICENSE_RE = /^(CCC|CGC|CRC|CB|RR|RC)\d{6,7}$/;

// Manatee County universe — 20 ZIPs with PP candidate rows. ANY ZIP submitted
// outside this set is rejected (MVP is Manatee-only per source-of-truth).
const MANATEE_ZIPS = new Set([
  "33598", "34201", "34202", "34203", "34205", "34207", "34208", "34209",
  "34210", "34211", "34212", "34215", "34216", "34217", "34219", "34221",
  "34222", "34228", "34243", "34251",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const licenseNumberRaw: string = (body?.licenseNumber ?? "")
      .toString()
      .trim()
      .toUpperCase();
    const serviceAreaZips: string[] = Array.isArray(body?.serviceAreaZips)
      ? body.serviceAreaZips.map((z: unknown) => String(z).trim())
      : [];
    const authorized: boolean = body?.authorized === true;

    if (!FL_LICENSE_RE.test(licenseNumberRaw)) {
      return NextResponse.json(
        {
          error:
            "Invalid Florida license number. Format: CCC, CGC, CRC, CB, RR, or RC followed by 6–7 digits (e.g. CCC1330842).",
        },
        { status: 400 }
      );
    }

    if (serviceAreaZips.length === 0) {
      return NextResponse.json(
        { error: "Select at least one service-area ZIP." },
        { status: 400 }
      );
    }
    if (serviceAreaZips.length > 25) {
      return NextResponse.json(
        { error: "At most 25 service-area ZIPs allowed." },
        { status: 400 }
      );
    }
    const invalidZips = serviceAreaZips.filter((z) => !MANATEE_ZIPS.has(z));
    if (invalidZips.length) {
      return NextResponse.json(
        {
          error: `MVP is Manatee County only. Unsupported ZIPs: ${invalidZips.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "You must agree to the direct-mail authorization to continue." },
        { status: 400 }
      );
    }

    // Auth — must be a logged-in roofer
    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor profile not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    // Upsert the authorization-text version row (idempotent on version_hash PK)
    const { error: versionErr } = await supabase
      .from("direct_mail_authorization_versions")
      .upsert(
        {
          version_hash: AUTH_VERSION_HASH,
          text: AUTH_TEXT,
          notes: AUTH_VERSION,
        },
        { onConflict: "version_hash", ignoreDuplicates: true }
      );
    if (versionErr) {
      console.error("[pipeline/setup] auth version upsert failed", versionErr);
      return NextResponse.json(
        { error: "Could not record authorization version." },
        { status: 500 }
      );
    }

    // Capture audit-trail context (IP + UA) for ESIGN
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const { error: updateErr } = await supabase
      .from("contractors")
      .update({
        license_number: licenseNumberRaw,
        service_area_zips: serviceAreaZips,
        direct_mail_authorization_version_hash: AUTH_VERSION_HASH,
        direct_mail_authorized_at: new Date().toISOString(),
        direct_mail_authorization_ip: ip,
        direct_mail_authorization_user_agent: userAgent,
      })
      .eq("id", contractor.id);

    if (updateErr) {
      console.error("[pipeline/setup] contractor update failed", updateErr);
      return NextResponse.json(
        { error: "Could not save settings. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[pipeline/setup] unexpected", e);
    return NextResponse.json(
      { error: "Unexpected error. Try again." },
      { status: 500 }
    );
  }
}
