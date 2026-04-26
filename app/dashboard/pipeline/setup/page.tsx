import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import { AUTH_TEXT, AUTH_VERSION } from "@/lib/property-pipeline/auth-text";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

const MANATEE_ZIPS_DISPLAY = [
  // Sorted by candidate-row count (most homes first) so the design partner
  // sees the highest-volume ZIPs at the top of the list.
  { zip: "34209", n: 3792, label: "34209 — Bradenton W (Palma Sola)" },
  { zip: "34205", n: 3659, label: "34205 — Bradenton" },
  { zip: "34221", n: 3408, label: "34221 — Palmetto" },
  { zip: "34208", n: 3077, label: "34208 — Bradenton E" },
  { zip: "34203", n: 2512, label: "34203 — Bradenton (Oneco)" },
  { zip: "34243", n: 2492, label: "34243 — Sarasota (Manatee side)" },
  { zip: "34202", n: 2422, label: "34202 — Lakewood Ranch" },
  { zip: "34212", n: 1808, label: "34212 — Bradenton (Lakewood Ranch N)" },
  { zip: "34207", n: 1316, label: "34207 — Bradenton (S Trail)" },
  { zip: "34219", n: 1102, label: "34219 — Parrish" },
  { zip: "34210", n: 624, label: "34210 — Bradenton (Cortez Rd)" },
  { zip: "34217", n: 536, label: "34217 — Holmes Beach" },
  { zip: "34251", n: 516, label: "34251 — Myakka City" },
  { zip: "34201", n: 442, label: "34201 — Bradenton (University Pkwy)" },
  { zip: "34222", n: 333, label: "34222 — Ellenton" },
  { zip: "34211", n: 293, label: "34211 — Bradenton (Lakewood Ranch E)" },
  { zip: "34228", n: 279, label: "34228 — Longboat Key" },
  { zip: "34216", n: 210, label: "34216 — Anna Maria" },
  { zip: "34215", n: 80, label: "34215 — Cortez" },
  { zip: "33598", n: 19, label: "33598 — Wimauma (Manatee edge)" },
];

export default async function PipelineSetupPage() {
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
  if (!user) redirect("/login?next=/dashboard/pipeline/setup");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: contractor } = await supabase
    .from("contractors")
    .select(
      "id, license_number, service_area_zips, direct_mail_authorization_version_hash"
    )
    .eq("user_id", user.id)
    .single();

  if (!contractor) redirect("/onboarding");

  // Already set up — bounce to the live tab
  const setupComplete =
    !!contractor.license_number &&
    Array.isArray(contractor.service_area_zips) &&
    contractor.service_area_zips.length > 0 &&
    !!contractor.direct_mail_authorization_version_hash;
  if (setupComplete) redirect("/dashboard/pipeline");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Property Pipeline — One-time setup
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Three things we need before mailing on your behalf. Takes a minute.
            All three are required by Florida law (§489.119 + §489.147) — we print
            them on every postcard so your mail is compliant out of the box.
          </p>
        </div>

        <SetupForm
          zipOptions={MANATEE_ZIPS_DISPLAY}
          authText={AUTH_TEXT}
          authVersion={AUTH_VERSION}
          initialLicense={contractor.license_number ?? ""}
          initialZips={contractor.service_area_zips ?? []}
        />
      </div>
    </main>
  );
}
