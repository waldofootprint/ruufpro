// Stripe Billing Portal — lets contractors manage their subscription.
// Change plan, update payment method, cancel, view invoices.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // Auth check
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get contractor
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!contractor?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account" }, { status: 404 });
  }

  const stripe = getStripe();
  const origin = req.headers.get("origin") || "https://ruufpro.com";
  const session = await stripe.billingPortal.sessions.create({
    customer: contractor.stripe_customer_id,
    return_url: `${origin}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
