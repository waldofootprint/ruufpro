import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "crypto";

import { getPostcardsApi, isLobLive } from "@/lib/lob/client";
import {
  generateQrShortCode,
  generateQrPngDataUrl,
} from "@/lib/property-pipeline/qr-code";
import { isPropertyLocked } from "@/lib/property-pipeline/locks";
import {
  getMonthlyUsage,
  OVERAGE_COST_CENTS,
} from "@/lib/property-pipeline/bundle-usage";
import {
  renderPostcardFront,
  renderPostcardBack,
  type PostcardData,
} from "@/lib/property-pipeline/postcard-template";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ruufpro.com";

function addressHash(addressNormalized: string): string {
  return createHash("sha256").update(addressNormalized).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const candidateId: string | null = body?.candidateId ?? null;
    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId required" },
        { status: 400 }
      );
    }

    // 1. Auth
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Contractor + required-field check
    const { data: contractor } = await supabase
      .from("contractors")
      .select(
        "id, business_name, phone, address, city, state, zip, license_number"
      )
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor profile not found" },
        { status: 404 }
      );
    }

    const missing: string[] = [];
    if (!contractor.business_name) missing.push("business name");
    if (!contractor.phone) missing.push("phone");
    if (!contractor.address) missing.push("street address");
    if (!contractor.city) missing.push("city");
    if (!contractor.state) missing.push("state");
    if (!contractor.zip) missing.push("ZIP");
    if (!contractor.license_number) missing.push("FL license number");
    if (missing.length) {
      return NextResponse.json(
        {
          error: `Settings incomplete — add ${missing.join(", ")} before sending.`,
          missing,
        },
        { status: 400 }
      );
    }

    // 3. Candidate lookup
    const { data: candidate } = await supabase
      .from("property_pipeline_candidates")
      .select(
        "id, parcel_id, address_raw, address_normalized, city, zip, status, score, tier"
      )
      .eq("id", candidateId)
      .single();

    if (!candidate || candidate.status !== "active") {
      return NextResponse.json(
        { error: "Property no longer available." },
        { status: 410 }
      );
    }

    // 4. Suppression check (per-roofer + global)
    const candAddrHash = addressHash(candidate.address_normalized);
    const { data: suppressions } = await supabase
      .from("mail_suppressions")
      .select("id, contractor_id")
      .eq("address_hash", candAddrHash);
    const isSuppressed = (suppressions ?? []).some(
      (s) => s.contractor_id === null || s.contractor_id === contractor.id
    );
    if (isSuppressed) {
      return NextResponse.json(
        { error: "This address is on the suppression list." },
        { status: 409 }
      );
    }

    // 5. Cross-contractor lockout (stub — always false at N=1)
    const lock = await isPropertyLocked(supabase, candidate.id, contractor.id);
    if (lock.locked) {
      return NextResponse.json(
        {
          error: `Locked until ${lock.availableAt} (${lock.reason}).`,
          ...lock,
        },
        { status: 409 }
      );
    }

    // 6. Bundle usage
    const usage = await getMonthlyUsage(supabase, contractor.id);

    // 7. Generate QR shortcode (retry on collision, max 3)
    let qrShortCode = "";
    for (let i = 0; i < 3; i++) {
      const candidateCode = generateQrShortCode();
      const { data: existing } = await supabase
        .from("mailing_history")
        .select("id")
        .eq("qr_short_code", candidateCode)
        .maybeSingle();
      if (!existing) {
        qrShortCode = candidateCode;
        break;
      }
    }
    if (!qrShortCode) {
      return NextResponse.json(
        { error: "Could not generate unique QR code; retry." },
        { status: 500 }
      );
    }

    // 8. Render postcard HTML
    const qrUrl = `${SITE_URL}/m/${qrShortCode}`;
    const qrDataUrl = await generateQrPngDataUrl(qrUrl);
    const contractorMailingAddress = `${contractor.address} · ${contractor.city} ${contractor.state} ${contractor.zip}`;
    const postcardData: PostcardData = {
      homeownerName: null,
      propertyAddress: `${candidate.address_raw}, ${candidate.city} ${candidate.zip}`,
      contractorBusinessName: contractor.business_name,
      contractorPhone: contractor.phone,
      contractorLicenseNumber: contractor.license_number!,
      contractorMailingAddress,
      qrShortCode,
      qrUrl,
      qrDataUrl,
      optOutUrl: `${SITE_URL}/stop/${qrShortCode}`,
    };
    // Variant selection: defaults to "D" (Hannah's pick after Lead-Spy
    // competitive read) until round-robin logic lands. See decision log
    // at decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md.
    const front = renderPostcardFront(postcardData, { variant: "D" });
    const back = renderPostcardBack(postcardData);

    // 9. Lob send
    const postcardsApi = getPostcardsApi();
    const lobPayload = {
      description: `PP send · contractor=${contractor.id} · candidate=${candidate.id}`,
      to: {
        name: "Current Resident",
        address_line1: candidate.address_raw,
        address_city: candidate.city,
        address_state: "FL",
        address_zip: candidate.zip,
        address_country: "US",
      },
      from: {
        name: contractor.business_name,
        address_line1: contractor.address,
        address_city: contractor.city,
        address_state: contractor.state,
        address_zip: contractor.zip,
        address_country: "US",
      },
      front,
      back,
      size: "6x11",
      mail_type: "usps_standard",
      use_type: "marketing",
      metadata: {
        contractor_id: contractor.id,
        candidate_id: candidate.id,
        qr_short_code: qrShortCode,
      },
    };

    let lobPostcardId: string | null = null;
    let lobErrorMessage: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await postcardsApi.create(lobPayload as any);
      lobPostcardId = result?.id ?? null;
    } catch (err) {
      lobErrorMessage =
        err instanceof Error ? err.message : "Lob send failed.";
    }

    if (!lobPostcardId) {
      return NextResponse.json(
        {
          error: "Lob send failed. No charge incurred.",
          detail: lobErrorMessage,
        },
        { status: 502 }
      );
    }

    // 10. mailing_history insert
    const scoreAtSendHash = createHash("sha256")
      .update(JSON.stringify({ score: candidate.score, tier: candidate.tier }))
      .digest("hex");

    const { data: inserted, error: insertErr } = await supabase
      .from("mailing_history")
      .insert({
        candidate_id: candidate.id,
        contractor_id: contractor.id,
        parcel_id: candidate.parcel_id,
        qr_short_code: qrShortCode,
        lob_postcard_id: lobPostcardId,
        sent_at: new Date().toISOString(),
        status: "sent",
        score_at_send: candidate.score,
        tier_at_send: candidate.tier,
      })
      .select("id")
      .single();

    if (insertErr) {
      // Lob already mailed; surface the row-write failure but don't pretend the send didn't happen
      console.error("[pipeline/send] mailing_history insert failed", insertErr);
      return NextResponse.json(
        {
          success: true,
          warning:
            "Postcard mailed but DB row write failed. Contact support with this Lob ID.",
          lob_postcard_id: lobPostcardId,
          qr_short_code: qrShortCode,
          score_at_send_hash: scoreAtSendHash,
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      mailing_id: inserted!.id,
      lob_postcard_id: lobPostcardId,
      qr_short_code: qrShortCode,
      qr_url: postcardData.qrUrl,
      opt_out_url: postcardData.optOutUrl,
      cost_cents: usage.isOverage ? OVERAGE_COST_CENTS : 0,
      bundle: {
        used: usage.used + 1,
        bundled: usage.bundled,
        remaining: Math.max(0, usage.remaining - 1),
        is_overage: usage.isOverage,
      },
      mode: isLobLive() ? "live" : "test",
      score_at_send_hash: scoreAtSendHash,
    });
  } catch (err) {
    console.error("[pipeline/send] unhandled", err);
    return NextResponse.json(
      {
        error: "Unexpected error sending postcard.",
        detail: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
