import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import { PropertyPipelineTab } from "@/components/dashboard/property-pipeline-tab";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
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
  if (!user) redirect("/login?next=/dashboard/pipeline");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: contractor } = await supabase
    .from("contractors")
    .select(
      "license_number, service_area_zips, direct_mail_authorization_version_hash"
    )
    .eq("user_id", user.id)
    .single();

  // Gate: license # + ≥1 service ZIP + signed DM authorization
  // are all required by source-of-truth. Bounce to setup if any missing.
  const setupComplete =
    !!contractor?.license_number &&
    Array.isArray(contractor?.service_area_zips) &&
    contractor.service_area_zips.length > 0 &&
    !!contractor?.direct_mail_authorization_version_hash;

  if (!setupComplete) redirect("/dashboard/pipeline/setup");

  return <PropertyPipelineTab />;
}
