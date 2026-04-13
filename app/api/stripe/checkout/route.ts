// Stripe Checkout — creates a checkout session for Pro or Growth.
// Called from pricing page CTAs and dashboard upgrade buttons.
// Requires authenticated user with a contractor record.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";
import { getStripe, PRICES, type PlanKey } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // Auth check
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json() as { plan: PlanKey };

  if (!plan || !PRICES[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const stripe = getStripe();

  // Get contractor record
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, email, business_name, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!contractor) {
    return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  }

  // Reuse existing Stripe customer or create new one
  let customerId = contractor.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: contractor.email,
      metadata: {
        contractor_id: contractor.id,
        business_name: contractor.business_name,
      },
    });
    customerId = customer.id;

    await supabase
      .from("contractors")
      .update({ stripe_customer_id: customerId })
      .eq("id", contractor.id);
  }

  // Create checkout session
  const origin = req.headers.get("origin") || "https://ruufpro.com";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    success_url: `${origin}/dashboard/settings?billing=success`,
    cancel_url: `${origin}/dashboard/settings?billing=cancelled`,
    metadata: {
      contractor_id: contractor.id,
      plan,
    },
    subscription_data: {
      metadata: {
        contractor_id: contractor.id,
        plan,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
