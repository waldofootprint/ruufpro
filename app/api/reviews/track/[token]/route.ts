// Review link click tracking and redirect.
// Public endpoint — homeowner clicks this link from the review request SMS.
// Records the click, then redirects to the contractor's actual Google review page.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up the review request by tracking token
    const { data: reviewRequest } = await supabase
      .from("review_requests")
      .select("id, google_review_url, clicked_at, status")
      .eq("tracking_token", token)
      .single();

    if (!reviewRequest) {
      // Token not found — redirect to a generic thanks page
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        request.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}/thanks`, 302);
    }

    // Update click tracking (only set clicked_at on first click)
    const updates: Record<string, any> = { status: "clicked" };
    if (!reviewRequest.clicked_at) {
      updates.clicked_at = new Date().toISOString();
    }

    await supabase
      .from("review_requests")
      .update(updates)
      .eq("id", reviewRequest.id);

    // Validate the redirect URL is a legitimate Google review URL (prevent open redirect)
    const reviewUrl = reviewRequest.google_review_url;
    const isGoogleUrl = reviewUrl &&
      (reviewUrl.startsWith("https://www.google.com/") ||
       reviewUrl.startsWith("https://maps.google.com/") ||
       reviewUrl.startsWith("https://g.page/") ||
       reviewUrl.startsWith("https://search.google.com/"));

    if (!isGoogleUrl) {
      console.error(`Review track: invalid redirect URL for request ${reviewRequest.id}: ${reviewUrl}`);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}/thanks`, 302);
    }

    return NextResponse.redirect(reviewUrl, 302);
  } catch (err) {
    console.error("Review track error:", err);
    // On error, still try to redirect somewhere reasonable
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/thanks`, 302);
  }
}
