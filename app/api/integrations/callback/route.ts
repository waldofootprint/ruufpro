// OAuth callback for CRM integrations (Jobber, Housecall Pro)
// Jobber/HCP redirects here after roofer authorizes → we exchange code for tokens → store in DB

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Provider-specific token exchange configs
const PROVIDERS: Record<string, {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}> = {
  jobber: {
    tokenUrl: "https://api.getjobber.com/api/oauth/token",
    clientId: process.env.JOBBER_CLIENT_ID || process.env.NEXT_PUBLIC_JOBBER_CLIENT_ID || "",
    clientSecret: process.env.JOBBER_CLIENT_SECRET || "",
  },
  housecall_pro: {
    tokenUrl: "https://api.housecallpro.com/oauth/token",
    clientId: process.env.HCP_CLIENT_ID || process.env.NEXT_PUBLIC_HCP_CLIENT_ID || "",
    clientSecret: process.env.HCP_CLIENT_SECRET || "",
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors (user denied, etc.)
  if (error) {
    console.error("OAuth error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(
      new URL("/dashboard/settings?crm_error=denied", req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?crm_error=missing_params", req.url)
    );
  }

  // State format: "contractorId:provider"
  const [contractorId, providerId] = state.split(":");
  const provider = PROVIDERS[providerId];

  if (!provider || !contractorId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?crm_error=invalid_state", req.url)
    );
  }

  try {
    // Exchange authorization code for access + refresh tokens
    const redirectUri = `${new URL(req.url).origin}/api/integrations/callback`;

    const tokenRes = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error("Token exchange failed:", tokenRes.status, errorBody);
      return NextResponse.redirect(
        new URL("/dashboard/settings?crm_error=token_failed", req.url)
      );
    }

    const tokens = await tokenRes.json();

    // Calculate token expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Upsert connection (replace existing if reconnecting)
    const { error: dbError } = await supabase
      .from("crm_connections")
      .upsert(
        {
          contractor_id: contractorId,
          provider: providerId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: expiresAt,
          status: "active",
          connected_at: new Date().toISOString(),
          disconnected_at: null,
          metadata: {
            token_type: tokens.token_type,
            scope: tokens.scope,
          },
        },
        { onConflict: "contractor_id,provider" }
      );

    if (dbError) {
      console.error("DB error saving CRM connection:", dbError);
      return NextResponse.redirect(
        new URL("/dashboard/settings?crm_error=db_failed", req.url)
      );
    }

    // Success — redirect back to settings with success message
    return NextResponse.redirect(
      new URL(`/dashboard/settings?crm_connected=${providerId}`, req.url)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?crm_error=unexpected", req.url)
    );
  }
}
