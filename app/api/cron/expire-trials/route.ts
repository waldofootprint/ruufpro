// Cron: expire outreach Pro trials (Flow B — no Stripe, no card).
// Runs daily at 6am ET. Finds contractors where trial_ends_at has passed,
// disables Pro features, sends notification email + Slack alert.
// Vercel cron schedule: "0 10 * * *" (10 UTC = 6am ET)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FREE_FLAGS } from "@/lib/stripe";
import { notifySlack } from "@/lib/slack-notify";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find all contractors with expired trials that still have Pro features
  const now = new Date().toISOString();
  const { data: expired } = await supabase
    .from("contractors")
    .select("id, business_name, email, has_estimate_widget")
    .lt("trial_ends_at", now)
    .not("trial_ends_at", "is", null)
    .eq("has_estimate_widget", true) // Still has Pro — hasn't been downgraded yet
    .is("stripe_subscription_id", null); // No paid subscription — pure trial

  if (!expired || expired.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let downgraded = 0;

  for (const contractor of expired) {
    // Downgrade to free
    await supabase
      .from("contractors")
      .update({
        ...FREE_FLAGS,
        trial_ends_at: null, // Clear so cron doesn't re-process
      })
      .eq("id", contractor.id);

    // Send trial-ended email
    await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: contractor.email,
      subject: "Your RuufPro Pro trial has ended",
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#1a1a1a;font-size:18px;">Your Pro trial has ended</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Hey ${contractor.business_name} — your 14-day Pro trial is over.
            Your website is still live and free forever, but Pro features
            (estimate widget, Riley AI chatbot, review automation) are now turned off.
          </p>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Ready to start getting leads from your website? Upgrade to Pro for $149/mo.
          </p>
          <a href="https://ruufpro.com/dashboard/billing" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;margin-top:8px;">
            Upgrade to Pro — $149/mo
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            Questions? Reply to this email or reach out at support@ruufpro.com
          </p>
        </div>
      `,
    }).catch(() => {});

    // Notify Slack
    notifySlack({
      type: "trial_expired",
      businessName: contractor.business_name,
      email: contractor.email,
      contractorId: contractor.id,
    }).catch(() => {});

    downgraded++;
  }

  console.log(`[Trial Expiry] Downgraded ${downgraded} contractors`);
  return NextResponse.json({ expired: downgraded });
}
