// Phase B / Session BM CP3 — runtime feature-flag reads.
//
// Per scoping §3 + CP2 advisor sign-off: flags live in the DB, read per-request,
// NO process-boot cache. "Flip first, investigate second" requires that a
// dashboard toggle takes effect on the next request, not the next cold start.

import { createClient } from "@supabase/supabase-js";
import type { FlagState } from "./measurement-pipeline.types";

// Service-role client — feature_flags + contractors.lidar_enabled sit behind
// RLS deny-all. /api/estimate already uses service-role (per task 360,
// commit d599d92), so this is not a new privilege surface.
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function readFlags(contractorId: string | null): Promise<FlagState> {
  const supabase = serviceClient();

  const [globalRow, contractorRow] = await Promise.all([
    supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", "lidar_pipeline_global")
      .maybeSingle(),
    contractorId
      ? supabase
          .from("contractors")
          .select("lidar_enabled")
          .eq("id", contractorId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const lidarGlobal = globalRow.data?.enabled === true;
  const contractorLidarEnabled =
    contractorRow.data != null &&
    (contractorRow.data as { lidar_enabled?: boolean }).lidar_enabled === true;

  return { lidarGlobal, contractorLidarEnabled };
}
