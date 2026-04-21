// Slack business event notifications — "impossible to miss" alerts.
// Uses incoming webhook (simpler than bot token for one-way notifications).
// Env var: SLACK_NOTIFICATIONS_WEBHOOK_URL

type SlackEvent =
  | { type: "pro_upgrade"; businessName: string; email: string; contractorId: string }
  | { type: "new_signup"; businessName: string; email: string; city: string; state: string }
  | { type: "new_lead"; businessName: string; homeownerName: string; phone: string; city: string }
  | { type: "site_claimed"; businessName: string; email: string; slug: string }
  | { type: "trial_expired"; businessName: string; email: string; contractorId: string }
  | { type: "error"; title: string; message: string; context?: Record<string, unknown> };

export async function notifySlack(event: SlackEvent): Promise<void> {
  const webhookUrl = process.env.SLACK_NOTIFICATIONS_WEBHOOK_URL;
  if (!webhookUrl) return; // Not configured yet — skip silently

  let text: string;

  switch (event.type) {
    case "pro_upgrade":
      text = `:money_with_wings: *New Pro Customer!*\n*${event.businessName}* just upgraded to Pro ($149/mo)\nEmail: ${event.email}\nID: \`${event.contractorId}\``;
      break;
    case "new_signup":
      text = `:wave: *New Signup*\n*${event.businessName}* — ${event.city}, ${event.state}\nEmail: ${event.email}`;
      break;
    case "new_lead":
      text = `:rotating_light: *New Lead*\n*${event.homeownerName}* wants an estimate from *${event.businessName}*\nPhone: ${event.phone} · ${event.city}`;
      break;
    case "site_claimed":
      text = `:tada: *Site Claimed*\n*${event.businessName}* claimed their site at \`${event.slug}.ruufpro.com\`\nEmail: ${event.email}`;
      break;
    case "trial_expired":
      text = `:hourglass: *Trial Expired*\n*${event.businessName}* — 14-day Pro trial ended\nEmail: ${event.email} · ID: \`${event.contractorId}\``;
      break;
    case "error": {
      const ctx = event.context
        ? "\n" + Object.entries(event.context).map(([k, v]) => `• ${k}: \`${JSON.stringify(v)}\``).join("\n")
        : "";
      text = `:rotating_light: *${event.title}*\n${event.message}${ctx}`;
      break;
    }
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("Slack notification failed:", err);
  }
}
