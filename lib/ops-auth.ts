// Server-side auth guard for /api/ops/* routes.
// Two modes:
//   requireOpsAuth()  — strict, returns 401 if not authenticated (for mutations)
//   softOpsAuth()     — tries auth, passes through if cookies unavailable (for reads)
//
// The /ops layout (client-side) is the primary auth gate. These are defense-in-depth.

import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

type AuthResult =
  | { authorized: true; email: string }
  | { authorized: false; response: NextResponse };

async function checkAuth(): Promise<{ email: string | null; error: string | null }> {
  try {
    const { createAuthSupabase } = await import("@/lib/supabase-server");
    const supabase = createAuthSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return { email: null, error: "not logged in" };
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email)) {
      return { email: null, error: "not admin" };
    }
    return { email: user.email, error: null };
  } catch {
    return { email: null, error: "cookies unavailable" };
  }
}

// Strict auth — blocks request if not authenticated
export async function requireOpsAuth(): Promise<AuthResult> {
  const { email, error } = await checkAuth();
  if (email) return { authorized: true, email };
  // If cookies are unavailable (common in some Next.js contexts), still block mutations
  return {
    authorized: false,
    response: NextResponse.json({ error: `Unauthorized: ${error}` }, { status: 401 }),
  };
}

// Soft auth — allows read requests when cookies can't be parsed
// (the /ops layout already verified the user client-side)
export async function softOpsAuth(): Promise<AuthResult> {
  const { email, error } = await checkAuth();
  if (email) return { authorized: true, email };
  if (error === "cookies unavailable") {
    // Allow through — client-side layout already checked auth
    return { authorized: true, email: "ops-layout-verified" };
  }
  return {
    authorized: false,
    response: NextResponse.json({ error: `Unauthorized: ${error}` }, { status: 401 }),
  };
}
