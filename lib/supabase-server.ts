// Supabase client for server-side usage (API routes, server components).
// Still uses the anon key + RLS by default. If we ever need to bypass
// RLS (admin tasks), we'd use the service role key instead.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
