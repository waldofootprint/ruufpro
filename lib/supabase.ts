// Supabase client for browser-side usage (React components, client actions).
// Uses @supabase/ssr's createBrowserClient so auth sessions persist in cookies
// (not just localStorage). This fixes the "login doesn't stick" problem.

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
