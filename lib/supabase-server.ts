// Supabase client for server-side usage (API routes, server components).
// Still uses the anon key + RLS by default. If we ever need to bypass
// RLS (admin tasks), we'd use the service role key instead.

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Cookie-aware Supabase client for API routes that need auth.
// Reads the user's session from request cookies.
export function createAuthSupabase() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // setAll can fail in Server Components (read-only).
          // Safe to ignore — session refresh happens on next request.
        }
      },
    },
  });
}
