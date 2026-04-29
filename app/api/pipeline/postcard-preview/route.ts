import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  renderPostcardFront,
  renderPostcardBack,
  type FrontVariant,
  type PostcardData,
} from "@/lib/property-pipeline/postcard-template";
import { generateQrPngDataUrl } from "@/lib/property-pipeline/qr-code";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ruufpro.com";
const VALID_VARIANTS: readonly FrontVariant[] = ["A", "B", "C", "D", "E", "F", "G"];

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const candidateId = url.searchParams.get("candidateId");
  const variantRaw = (url.searchParams.get("variant") ?? "A").toUpperCase();
  const side = url.searchParams.get("side") === "back" ? "back" : "front";

  const variant: FrontVariant = (
    VALID_VARIANTS.includes(variantRaw as FrontVariant) ? variantRaw : "A"
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, phone, license_number, address, city, state, zip")
    .eq("user_id", user.id)
    .single();

  let propertyAddress = "8734 54th Ave E, Bradenton 34211";
  if (candidateId) {
    const { data: candidate } = await supabase
      .from("property_pipeline_candidates")
      .select("address_raw, city, zip, contractor_id")
      .eq("id", candidateId)
      .single();
    if (candidate && contractor && candidate.contractor_id === contractor.id) {
      propertyAddress = `${candidate.address_raw}, ${candidate.city} ${candidate.zip}`;
    }
  }

  const mailingAddress =
    contractor?.address && contractor?.city && contractor?.state && contractor?.zip
      ? `${contractor.address} · ${contractor.city} ${contractor.state} ${contractor.zip}`
      : null;

  const qrUrl = `${SITE_URL}/m/PREVIEW`;
  const qrDataUrl = await generateQrPngDataUrl(qrUrl);

  const data: PostcardData = {
    homeownerName: null,
    propertyAddress,
    contractorBusinessName: contractor?.business_name ?? "Your Roofing Co.",
    contractorPhone: contractor?.phone ?? "(555) 555-5555",
    contractorLicenseNumber: contractor?.license_number ?? "[Set in Settings]",
    contractorMailingAddress: mailingAddress,
    qrShortCode: "PREVIEW",
    qrUrl,
    qrDataUrl,
    optOutUrl: `${SITE_URL}/stop/PREVIEW`,
  };

  const html =
    side === "back"
      ? renderPostcardBack(data, { variant })
      : renderPostcardFront(data, { variant });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=60",
    },
  });
}
