// Stripe Webhook — handles subscription lifecycle events.
// Flips feature flags on/off in the contractors table.
// Events: checkout.session.completed, customer.subscription.updated/deleted.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, getTierFromPriceId, PRO_FLAGS, FREE_FLAGS } from "@/lib/stripe";
import { notifySlack } from "@/lib/slack-notify";

// Disable body parsing — Stripe needs the raw body to verify signatures.
export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  switch (event.type) {
    // New subscription created via checkout
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") break;

      const contractorId = session.metadata?.contractor_id;
      const subscriptionId = session.subscription as string;

      if (!contractorId || !subscriptionId) break;

      // Get subscription to find the price/tier
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      const tier = priceId ? getTierFromPriceId(priceId) : null;
      const flags = tier ? PRO_FLAGS : {};

      await supabase
        .from("contractors")
        .update({
          stripe_subscription_id: subscriptionId,
          ...flags,
        })
        .eq("id", contractorId);

      console.log(`[Stripe] Activated ${tier} for contractor ${contractorId}`);

      // Notify Slack — impossible to miss a new Pro customer
      const { data: proContractor } = await supabase
        .from("contractors")
        .select("business_name, email")
        .eq("id", contractorId)
        .single();
      if (proContractor) {
        notifySlack({
          type: "pro_upgrade",
          businessName: proContractor.business_name,
          email: proContractor.email,
          contractorId,
        }).catch(() => {});
      }
      break;
    }

    // Subscription upgraded, downgraded, or renewed
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const contractorId = subscription.metadata?.contractor_id;
      if (!contractorId) break;

      const priceId = subscription.items.data[0]?.price?.id;
      const tier = priceId ? getTierFromPriceId(priceId) : null;

      if (subscription.status === "active" && tier) {
        // Active subscription — enable tier flags
        await supabase
          .from("contractors")
          .update(PRO_FLAGS)
          .eq("id", contractorId);

        console.log(`[Stripe] Updated to ${tier} for contractor ${contractorId}`);
      } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
        // Payment failed — keep features for now, Stripe retries
        console.log(`[Stripe] Payment issue (${subscription.status}) for contractor ${contractorId}`);
      }
      break;
    }

    // Subscription cancelled or expired
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const contractorId = subscription.metadata?.contractor_id;
      if (!contractorId) break;

      // Downgrade to free — disable all paid features
      await supabase
        .from("contractors")
        .update({
          stripe_subscription_id: null,
          ...FREE_FLAGS,
        })
        .eq("id", contractorId);

      console.log(`[Stripe] Cancelled subscription for contractor ${contractorId}`);

      // Notify Slack
      const { data: cancelledContractor } = await supabase
        .from("contractors")
        .select("business_name, email")
        .eq("id", contractorId)
        .single();
      if (cancelledContractor) {
        notifySlack({
          type: "trial_expired",
          businessName: cancelledContractor.business_name,
          email: cancelledContractor.email,
          contractorId,
        }).catch(() => {});
      }
      break;
    }

    // Trial ending soon (fires 3 days before trial ends)
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object;
      const contractorId = subscription.metadata?.contractor_id;
      if (!contractorId) break;

      const { data: trialContractor } = await supabase
        .from("contractors")
        .select("business_name, email")
        .eq("id", contractorId)
        .single();

      if (trialContractor) {
        // Send reminder email
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "RuufPro <noreply@ruufpro.com>",
          to: trialContractor.email,
          subject: "Your RuufPro Pro trial ends in 3 days",
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a1a;font-size:18px;">Your Pro trial ends soon</h2>
              <p style="color:#555;font-size:14px;line-height:1.6;">
                Hey ${trialContractor.business_name} — your 14-day Pro trial ends in 3 days.
                After that, your site stays live but Pro features (estimate widget, Riley AI, reviews) will turn off.
              </p>
              <p style="color:#555;font-size:14px;line-height:1.6;">
                If you're seeing value, your card on file will be charged $149/mo automatically. No action needed.
              </p>
              <p style="color:#555;font-size:14px;line-height:1.6;">
                Want to cancel? No hard feelings — manage your subscription from your dashboard.
              </p>
              <a href="https://ruufpro.com/dashboard/billing" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;margin-top:8px;">
                Manage Subscription
              </a>
            </div>
          `,
        }).catch(() => {});

        console.log(`[Stripe] Trial ending soon for contractor ${contractorId}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
