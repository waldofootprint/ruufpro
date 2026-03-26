// Supabase client for browser-side usage (React components, client actions).
// Uses the anon (public) key — all queries go through RLS policies,
// so users can only access data they're allowed to see.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
