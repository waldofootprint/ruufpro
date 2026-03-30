// Supabase admin client — uses service role key to bypass RLS.
// Used by CLI tools for prospect management (no auth user context).

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: new URL("../../.env", import.meta.url).pathname });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
