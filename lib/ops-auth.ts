// Server-side auth guard for /api/ops/* routes.
// Verifies the request comes from an authenticated admin user.
// Returns the user if authorized, or a 401 NextResponse if not.

import { NextResponse } from "next/server";
import { createAuthSupabase } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function requireOpsAuth(): Promise<
  | { authorized: true; email: string }
  | { authorized: false; response: NextResponse }
> {
  try {
    const supabase = createAuthSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized — not logged in" },
          { status: 401 }
        ),
      };
    }

    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden — not an admin" },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, email: user.email };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Auth check failed" },
        { status: 401 }
      ),
    };
  }
}
