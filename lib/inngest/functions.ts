import { inngest } from "./client";

// Workflow results may include quiet hours data from sendSMS().
// Inngest's JsonifyObject strips these from inferred types, so we cast.
type WorkflowResult = {
  success: boolean;
  error?: string;
  quietHours?: boolean;
  sendAt?: string;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Global Failure Handler
// Trigger: "inngest/function.failed" — fires when ANY function exhausts retries
// Sends alert email + Slack notification so Hannah catches failures immediately
// ---------------------------------------------------------------------------
export const globalFailureHandler = inngest.createFunction(
  {
    id: "global-failure-handler",
    retries: 0,
    triggers: [{ event: "inngest/function.failed" }],
  },
  async ({ event }) => {
    const { sendAlert } = await import("@/lib/alerts");

    const functionId = event.data?.function_id || "unknown";
    const errorMessage = event.data?.error?.message || "Unknown error";
    const runId = event.data?.run_id || null;

    // Try to extract contractor ID from the original event data
    const originalEvent = event.data?.event;
    const contractorId = originalEvent?.data?.contractorId || null;

    await sendAlert({
      title: `${functionId} failed`,
      message: errorMessage,
      severity: "error",
      details: {
        "Function": functionId,
        "Run ID": runId,
        "Contractor": contractorId,
        "Original Event": originalEvent?.name || null,
        "Time": new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
      },
    });

    return { alerted: true, functionId };
  }
);

// ---------------------------------------------------------------------------
// Chain 1: Lead Auto-Response
// Trigger: "sms/lead.created" — emitted from /api/notify after form submit
// Steps: look up contractor → check SMS enabled → check opt-out → send SMS
// ---------------------------------------------------------------------------
export const leadAutoResponse = inngest.createFunction(
  {
    id: "lead-auto-response",
    retries: 3,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId, leadPhone, leadName, estimateLow, estimateHigh, smsConsent } = event.data;

    if (!leadPhone) {
      return { success: true, skipped: true, reason: "no phone number" };
    }

    // Fast-path consent check from event data — skip DB query if we know consent is false.
    // sendLeadAutoResponse() also checks the DB as a fallback, so this is defense-in-depth.
    if (smsConsent === false) {
      return { success: true, skipped: true, reason: "no SMS consent" };
    }

    const result = await step.run("send-auto-response-sms", async () => {
      const { sendLeadAutoResponse } = await import("@/lib/sms-workflows");
      return sendLeadAutoResponse(contractorId, leadPhone, leadName, {
        estimateLow: estimateLow || null,
        estimateHigh: estimateHigh || null,
      });
    }) as WorkflowResult;

    // Quiet hours: sleep until the next send window, then retry
    if (result.quietHours && result.sendAt) {
      await step.sleepUntil("wait-for-send-window", new Date(result.sendAt));
      const retryResult = await step.run("retry-after-quiet-hours", async () => {
        const { sendLeadAutoResponse } = await import("@/lib/sms-workflows");
        return sendLeadAutoResponse(contractorId, leadPhone, leadName, {
          estimateLow: estimateLow || null,
          estimateHigh: estimateHigh || null,
        });
      }) as WorkflowResult;
      if (!retryResult.success && !retryResult.quietHours) {
        throw new Error(`Lead auto-response failed after quiet hours: ${retryResult.error}`);
      }
      return retryResult;
    }

    if (!result.success) {
      throw new Error(`Lead auto-response failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 2: Missed-Call Text-Back
// PARKED FOR LAUNCH — April 11, 2026
//
// Disabled until $10K MRR + TCPA legal review.
// Reason: Caller never gave prior SMS consent. The "conversational response"
// defense is untested for automated systems. Risk/reward doesn't justify it
// at launch. All code preserved — uncomment to re-enable.
//
// To re-enable:
// 1. Uncomment this function
// 2. Uncomment the Inngest event in app/api/sms/voice-webhook/route.ts
// 3. Re-add the dashboard toggle in app/dashboard/sms/page.tsx
// 4. Get a TCPA attorney to sign off on the consent basis
//
// Trigger: "sms/call.missed" — emitted from /api/sms/voice-webhook
// Steps: dedup check → send textback SMS
// ---------------------------------------------------------------------------
/*
export const missedCallTextback = inngest.createFunction(
  {
    id: "missed-call-textback",
    retries: 3,
    idempotency: "event.data.callSid",
    triggers: [{ event: "sms/call.missed" }],
  },
  async ({ event, step }) => {
    const { contractorId, callerPhone } = event.data;

    // Dedup: check if we already texted this number in the last 30 min
    const shouldSend = await step.run("check-dedup", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const thirtyMinAgo = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();

      const { data: recentText } = await supabase
        .from("sms_messages")
        .select("id")
        .eq("to_number", callerPhone)
        .eq("message_type", "missed_call_textback")
        .gte("created_at", thirtyMinAgo)
        .limit(1)
        .single();

      return !recentText;
    });

    if (!shouldSend) {
      return { success: true, skipped: true, reason: "dedup — already texted within 30 min" };
    }

    const result = await step.run("send-missed-call-textback", async () => {
      const { sendMissedCallTextback } = await import("@/lib/sms-workflows");
      return sendMissedCallTextback(contractorId, callerPhone);
    }) as WorkflowResult;

    // Quiet hours: sleep until morning, then retry.
    // For missed calls during quiet hours, the text arrives at 8am — still valuable.
    if (result.quietHours && result.sendAt) {
      await step.sleepUntil("wait-for-send-window", new Date(result.sendAt));
      const retryResult = await step.run("retry-after-quiet-hours", async () => {
        const { sendMissedCallTextback } = await import("@/lib/sms-workflows");
        return sendMissedCallTextback(contractorId, callerPhone);
      }) as WorkflowResult;
      if (!retryResult.success && !retryResult.quietHours) {
        throw new Error(`Missed-call textback failed after quiet hours: ${retryResult.error}`);
      }
      return retryResult;
    }

    if (!result.success) {
      throw new Error(`Missed-call textback failed: ${result.error}`);
    }

    return result;
  }
);
*/

// ---------------------------------------------------------------------------
// Chain 3: Review Request (Email)
// Trigger: "sms/review.requested" — emitted from /api/reviews/request
// Steps: send review email via Resend (no SMS, no quiet hours)
// ---------------------------------------------------------------------------
export const reviewRequest = inngest.createFunction(
  {
    id: "review-request-email",
    retries: 3,
    triggers: [{ event: "sms/review.requested" }],
  },
  async ({ event, step }) => {
    const { contractorId, leadId, delay } = event.data;

    // Respect contractor's timing preference (configured in /dashboard/reviews)
    if (delay && delay !== "immediate") {
      const delayMap: Record<string, string> = { "1_hour": "1h", "1_day": "1d", "3_days": "3d" };
      const sleepDuration = delayMap[delay];
      if (sleepDuration) {
        await step.sleep("review-delay", sleepDuration);
      }
    }

    const result = await step.run("send-review-request", async () => {
      const { sendReviewRequest } = await import("@/lib/sms-workflows");
      return sendReviewRequest(contractorId, leadId);
    });

    if (!result.success) {
      throw new Error(`Review request failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 4: Review Reminder Email
// Trigger: "sms/review.followup-needed" — emitted from cron job
// Steps: send reminder email for unclicked review links (3 days after first email)
// ---------------------------------------------------------------------------
export const reviewEmailFollowup = inngest.createFunction(
  {
    id: "review-email-followup",
    retries: 3,
    triggers: [{ event: "sms/review.followup-needed" }],
  },
  async ({ event, step }) => {
    const { reviewRequestId } = event.data;

    const result = await step.run("send-followup-email", async () => {
      const { scheduleReviewEmailFollowup } = await import(
        "@/lib/sms-workflows"
      );
      return scheduleReviewEmailFollowup(reviewRequestId);
    });

    if (!result.success) {
      throw new Error(`Review email follow-up failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 5: CRM Webhook Export
// Trigger: "sms/lead.created" — same event as auto-response
// Steps: look up contractor webhook config → POST lead data to webhook URL
// ---------------------------------------------------------------------------
export const crmWebhookExport = inngest.createFunction(
  {
    id: "crm-webhook-export",
    retries: 3,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId } = event.data;

    // Step 1: Check if contractor has webhook enabled
    const webhookConfig = await step.run("check-webhook-config", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const { data } = await supabase
        .from("contractors")
        .select("webhook_url, webhook_enabled, business_name")
        .eq("id", contractorId)
        .single();

      return data;
    });

    if (!webhookConfig?.webhook_enabled || !webhookConfig?.webhook_url) {
      return { success: true, skipped: true, reason: "webhook not enabled" };
    }

    // Step 2: POST lead data to webhook URL
    const result = await step.run("post-to-webhook", async () => {
      const sourceLabels: Record<string, string> = {
        estimate_widget: "Estimate Widget",
        contact_form: "Contact Form",
        external_widget: "External Widget",
        address_only: "Address Only",
        outside_area: "Outside Service Area",
      };
      const sourceTag = sourceLabels[event.data.source] || event.data.source;

      const payload = {
        event: "lead.created",
        timestamp: new Date().toISOString(),
        tags: ["RuufPro", sourceTag],
        contractor: {
          id: contractorId,
          business_name: webhookConfig.business_name,
        },
        lead: {
          name: event.data.leadName,
          phone: event.data.leadPhone,
          email: event.data.leadEmail,
          address: event.data.leadAddress,
          message: event.data.leadMessage,
          source: event.data.source,
          timeline: event.data.timeline,
          financing_interest: event.data.financingInterest,
          estimate: event.data.estimateLow
            ? {
                low: event.data.estimateLow,
                high: event.data.estimateHigh,
                material: event.data.estimateMaterial,
                roof_sqft: event.data.estimateRoofSqft,
              }
            : null,
        },
      };

      const resp = await fetch(webhookConfig.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`Webhook POST failed: ${resp.status} ${resp.statusText}`);
      }

      return { status: resp.status, delivered: true };
    });

    return { success: true, ...result };
  }
);

// ---------------------------------------------------------------------------
// Chain 6: Inbound SMS Reply Notification
// Trigger: "sms/reply.received" — emitted from /api/sms/webhook
// Steps: look up contractor + lead → send email notification → send push
// ---------------------------------------------------------------------------
export const inboundSmsNotification = inngest.createFunction(
  {
    id: "inbound-sms-notification",
    retries: 2,
    triggers: [{ event: "sms/reply.received" }],
  },
  async ({ event, step }) => {
    const { contractorId, fromNumber, body, origin } = event.data;

    // Step 1: Look up contractor info + try to match phone to a lead
    const contactInfo = await step.run("lookup-contact-info", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const { data: contractor } = await supabase
        .from("contractors")
        .select("email, business_name, phone")
        .eq("id", contractorId)
        .single();

      if (!contractor?.email) return null;

      // Try to match the phone number to an existing lead
      const { data: lead } = await supabase
        .from("leads")
        .select("id, name")
        .eq("contractor_id", contractorId)
        .eq("phone", fromNumber)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        contractorEmail: contractor.email,
        businessName: contractor.business_name,
        leadName: lead?.name || null,
        leadId: lead?.id || null,
      };
    });

    if (!contactInfo) {
      return { success: true, skipped: true, reason: "contractor has no email" };
    }

    const senderName = contactInfo.leadName || fromNumber;
    const preview = body.length > 100 ? body.slice(0, 100) + "…" : body;

    // Step 2: Send email notification via Resend
    await step.run("send-email-notification", async () => {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: #0F1B2D; border-radius: 12px 12px 0 0; padding: 20px 24px;">
            <h1 style="margin: 0; font-size: 18px; color: white; font-weight: 600;">💬 New SMS Reply</h1>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <h2 style="margin: 0 0 4px; font-size: 18px; color: #111827;">${senderName}</h2>
            <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">${fromNumber}</p>
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">${body}</p>
            </div>
            <a href="tel:${fromNumber.replace(/\D/g, "")}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; margin-right: 8px;">
              📞 Call Back
            </a>
            <a href="https://ruufpro.com/dashboard/sms" style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">
              View in Dashboard →
            </a>
          </div>
          <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Sent by RuufPro · Someone replied to your automated text.
          </p>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: "RuufPro <noreply@ruufpro.com>",
        to: contactInfo.contractorEmail,
        subject: `Reply from ${senderName}: "${preview}"`,
        html,
      });

      if (error) throw new Error(`Email notification failed: ${JSON.stringify(error)}`);
    });

    // Step 3: Send push notification
    if (origin) {
      await step.run("send-push-notification", async () => {
        const res = await fetch(`${origin}/api/push/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
          body: JSON.stringify({
            contractor_id: contractorId,
            title: `💬 ${senderName}`,
            body: preview,
            url: "/dashboard/sms",
          }),
        });

        if (!res.ok) {
          throw new Error(`Push notification failed: ${res.status}`);
        }
      });
    }

    return { success: true, notified: contactInfo.contractorEmail };
  }
);

// ---------------------------------------------------------------------------
// Chain 1 bonus: Push Notification (was also fire-and-forget)
// ---------------------------------------------------------------------------
export const leadPushNotification = inngest.createFunction(
  {
    id: "lead-push-notification",
    retries: 2,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId, pushTitle, pushBody, origin } = event.data;

    if (!origin) return { success: true, skipped: true, reason: "no origin URL" };

    await step.run("send-push-notification", async () => {
      const res = await fetch(`${origin}/api/push/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
        body: JSON.stringify({
          contractor_id: contractorId,
          title: pushTitle,
          body: pushBody,
        }),
      });

      if (!res.ok) {
        throw new Error(`Push notification failed: ${res.status}`);
      }
    });

    return { success: true };
  }
);

// ---------------------------------------------------------------------------
// Chain 8: CRM Direct Push (Jobber / Housecall Pro OAuth)
// Trigger: "sms/lead.created" — same event as webhook export
// Steps: check for active CRM connection → push lead via provider API
// ---------------------------------------------------------------------------
export const crmDirectPush = inngest.createFunction(
  {
    id: "crm-direct-push",
    retries: 3,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId } = event.data;

    // Step 1: Check for active CRM connections
    const connections = await step.run("check-crm-connections", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const { data } = await supabase
        .from("crm_connections")
        .select("id, provider, access_token, refresh_token, expires_at")
        .eq("contractor_id", contractorId)
        .eq("status", "active");

      return data || [];
    });

    if (connections.length === 0) {
      return { success: true, skipped: true, reason: "no active CRM connections" };
    }

    // Step 2: Push to each connected CRM
    const results = [];
    for (const conn of connections) {
      const result = await step.run(`push-to-${conn.provider}`, async () => {
        if (conn.provider === "jobber") {
          return pushToJobber(conn.access_token, event.data);
        } else if (conn.provider === "housecall_pro") {
          return pushToHousecallPro(conn.access_token, event.data);
        }
        return { provider: conn.provider, error: "unknown provider" };
      });
      results.push(result);
    }

    return { success: true, results };
  }
);

// ---------------------------------------------------------------------------
// Chain 9: CRM Token Refresh (Daily Cron)
// Finds tokens expiring within 7 days and refreshes them
// ---------------------------------------------------------------------------
export const crmTokenRefresh = inngest.createFunction(
  {
    id: "crm-token-refresh",
    retries: 2,
    triggers: [{ cron: "0 3 * * *" }], // 3am UTC daily
  },
  async ({ step }) => {
    // Step 1: Find connections expiring within 7 days
    const expiringConnections = await step.run("find-expiring-tokens", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("crm_connections")
        .select("id, contractor_id, provider, refresh_token, expires_at")
        .eq("status", "active")
        .not("refresh_token", "is", null)
        .lt("expires_at", sevenDaysFromNow);

      return data || [];
    });

    if (expiringConnections.length === 0) {
      return { success: true, refreshed: 0, message: "no tokens expiring soon" };
    }

    // Step 2: Refresh each token
    const results = [];
    for (const conn of expiringConnections) {
      const result = await step.run(`refresh-${conn.provider}-${conn.id.slice(0, 8)}`, async () => {
        const { createServerSupabase } = await import("@/lib/supabase-server");
        const supabase = createServerSupabase();

        const providerConfig = conn.provider === "jobber"
          ? {
              tokenUrl: "https://api.getjobber.com/api/oauth/token",
              clientId: process.env.JOBBER_CLIENT_ID || process.env.NEXT_PUBLIC_JOBBER_CLIENT_ID || "",
              clientSecret: process.env.JOBBER_CLIENT_SECRET || "",
            }
          : {
              tokenUrl: "https://api.housecallpro.com/oauth/token",
              clientId: process.env.HCP_CLIENT_ID || process.env.NEXT_PUBLIC_HCP_CLIENT_ID || "",
              clientSecret: process.env.HCP_CLIENT_SECRET || "",
            };

        try {
          const res = await fetch(providerConfig.tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: conn.refresh_token!,
              client_id: providerConfig.clientId,
              client_secret: providerConfig.clientSecret,
            }),
          });

          if (!res.ok) {
            // Refresh failed — mark as expired
            await supabase
              .from("crm_connections")
              .update({ status: "expired", updated_at: new Date().toISOString() })
              .eq("id", conn.id);
            return { id: conn.id, provider: conn.provider, error: `refresh failed: ${res.status}` };
          }

          const tokens = await res.json();
          const expiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null;

          await supabase
            .from("crm_connections")
            .update({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || conn.refresh_token,
              expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conn.id);

          return { id: conn.id, provider: conn.provider, refreshed: true };
        } catch (err) {
          await supabase
            .from("crm_connections")
            .update({ status: "error", updated_at: new Date().toISOString() })
            .eq("id", conn.id);
          return { id: conn.id, provider: conn.provider, error: String(err) };
        }
      });
      results.push(result);
    }

    const refreshedCount = results.filter((r) => "refreshed" in r && r.refreshed).length;
    return { success: true, refreshed: refreshedCount, results };
  }
);

// --- Jobber: Create client + request via GraphQL ---
async function pushToJobber(
  accessToken: string,
  leadData: Record<string, unknown>
) {
  const endpoint = "https://api.getjobber.com/api/graphql";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  // Split name into first/last
  const fullName = (leadData.leadName as string) || "New Lead";
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "New";
  const lastName = nameParts.slice(1).join(" ") || "Lead";

  // Step A: Create or find client
  const clientMutation = `
    mutation CreateClient($input: ClientCreateInput!) {
      clientCreate(input: $input) {
        client {
          id
        }
        userErrors {
          message
          path
        }
      }
    }
  `;

  const clientRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: clientMutation,
      variables: {
        input: {
          firstName,
          lastName,
          phones: leadData.leadPhone
            ? [{ number: leadData.leadPhone as string, primary: true }]
            : [],
          emails: leadData.leadEmail
            ? [{ address: leadData.leadEmail as string, primary: true }]
            : [],
          billingAddress: leadData.leadAddress
            ? { street: leadData.leadAddress as string }
            : undefined,
        },
      },
    }),
  });

  if (!clientRes.ok) {
    throw new Error(`Jobber client create failed: ${clientRes.status}`);
  }

  const clientBody = await clientRes.json();
  const clientId = clientBody?.data?.clientCreate?.client?.id;
  const clientErrors = clientBody?.data?.clientCreate?.userErrors;

  if (clientErrors?.length > 0) {
    throw new Error(`Jobber client errors: ${JSON.stringify(clientErrors)}`);
  }

  if (!clientId) {
    throw new Error("Jobber: no client ID returned");
  }

  // Step B: Create request for this client
  const sourceLabels: Record<string, string> = {
    estimate_widget: "Estimate Widget",
    contact_form: "Contact Form",
    external_widget: "External Widget",
  };
  const source = sourceLabels[(leadData.source as string)] || (leadData.source as string) || "RuufPro";

  const estimateInfo = leadData.estimateLow
    ? `\nEstimate: $${leadData.estimateLow}-$${leadData.estimateHigh} (${leadData.estimateMaterial}, ${leadData.estimateRoofSqft} sq ft)`
    : "";
  const timeline = leadData.timeline ? `\nTimeline: ${leadData.timeline}` : "";
  const message = leadData.leadMessage ? `\nMessage: ${leadData.leadMessage}` : "";

  const requestMutation = `
    mutation CreateRequest($input: RequestCreateInput!) {
      requestCreate(input: $input) {
        request {
          id
        }
        userErrors {
          message
          path
        }
      }
    }
  `;

  const reqRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: requestMutation,
      variables: {
        input: {
          clientId,
          title: `RuufPro Lead — ${fullName}`,
          details: `Source: ${source}${estimateInfo}${timeline}${message}`.trim(),
        },
      },
    }),
  });

  if (!reqRes.ok) {
    throw new Error(`Jobber request create failed: ${reqRes.status}`);
  }

  const reqBody = await reqRes.json();
  const requestErrors = reqBody?.data?.requestCreate?.userErrors;
  if (requestErrors?.length > 0) {
    throw new Error(`Jobber request errors: ${JSON.stringify(requestErrors)}`);
  }

  return {
    provider: "jobber",
    clientId,
    requestId: reqBody?.data?.requestCreate?.request?.id,
    delivered: true,
  };
}

// ---------------------------------------------------------------------------
// Chain 10: A2P Wizard Compliance Website Generation
// Trigger: "sms/brand.approved" — emitted when brand is approved but no compliance URL
// Steps: generate compliance website via Playwright → save URL → campaign auto-fires
// NOTE: This function requires a browser runtime (not Vercel serverless).
//       Run via Inngest self-hosted runner or Browserless.io.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Chain 10: Sole Proprietor 10DLC Registration (Durable)
// Trigger: "sms/registration.sole-prop" — from /api/sms/register
// Two phases with 30s durable sleep between them.
// Prevents Vercel serverless timeout + orphaned Twilio resources on failure.
// ---------------------------------------------------------------------------
export const soleProprietorRegistration = inngest.createFunction(
  {
    id: "sole-prop-10dlc-registration",
    retries: 2,
    triggers: [{ event: "sms/registration.sole-prop" }],
  },
  async ({ event, step }) => {
    const data = event.data;

    // Phase 1: Create Starter Customer Profile (Twilio steps 1-5)
    const phase1 = await step.run("create-starter-profile", async () => {
      const { createSoleProprietorStarterProfile } = await import("@/lib/twilio-10dlc");
      return createSoleProprietorStarterProfile({
        contractorId: data.contractorId,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
      });
    });

    // Durable sleep — Twilio needs ~30s to process the starter profile
    await step.sleep("wait-for-twilio-processing", "30s");

    // Phase 2: Create A2P Trust Bundle (Twilio steps 6-9)
    const phase2 = await step.run("create-trust-bundle", async () => {
      const { createSoleProprietorTrustBundle } = await import("@/lib/twilio-10dlc");
      return createSoleProprietorTrustBundle({
        contractorId: data.contractorId,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        ssnLast4: data.ssnLast4,
        profileSid: phase1.profileSid,
      });
    });

    // Save final state to database
    await step.run("save-registration-state", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const { error } = await supabase
        .from("sms_numbers")
        .upsert({
          contractor_id: data.contractorId,
          registration_path: "sole_proprietor",
          registration_status: "brand_otp_required",
          customer_profile_sid: phase1.profileSid,
          trust_product_sid: phase2.trustProductSid,
          updated_at: new Date().toISOString(),
        }, { onConflict: "contractor_id" });

      if (error) throw new Error(`Failed to save registration: ${error.message}`);
      return { saved: true };
    });

    return {
      success: true,
      status: "brand_otp_required",
      customerProfileSid: phase1.profileSid,
      trustProductSid: phase2.trustProductSid,
    };
  }
);

// ---------------------------------------------------------------------------
// Chain 11: A2P Wizard Compliance
// ---------------------------------------------------------------------------
export const a2pWizardCompliance = inngest.createFunction(
  {
    id: "a2p-wizard-compliance",
    retries: 2,
    triggers: [{ event: "sms/brand.approved" }],
  },
  async ({ event, step }) => {
    const { contractorId } = event.data;

    const result = await step.run("generate-compliance-website", async () => {
      const { generateAndSaveComplianceUrl } = await import("@/lib/a2p-wizard");
      return generateAndSaveComplianceUrl(contractorId);
    });

    if (!result.success) {
      throw new Error(`A2P Wizard failed: ${result.error}`);
    }

    // Compliance URL is saved — now trigger campaign registration
    if (result.complianceUrl && !result.error?.includes("already exists")) {
      await step.run("submit-campaign-registration", async () => {
        const { completeCampaignRegistration } = await import("@/lib/twilio-10dlc");
        return completeCampaignRegistration(contractorId);
      });
    }

    return result;
  }
);

// --- Housecall Pro: Create customer + job via REST ---
async function pushToHousecallPro(
  accessToken: string,
  leadData: Record<string, unknown>
) {
  const baseUrl = "https://api.housecallpro.com";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const fullName = (leadData.leadName as string) || "New Lead";
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "New";
  const lastName = nameParts.slice(1).join(" ") || "Lead";

  // Step A: Create customer
  const customerRes = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email: (leadData.leadEmail as string) || undefined,
      mobile_number: (leadData.leadPhone as string) || undefined,
      address: (leadData.leadAddress as string) || undefined,
      notifications_enabled: true,
    }),
  });

  if (!customerRes.ok) {
    throw new Error(`HCP customer create failed: ${customerRes.status}`);
  }

  const customer = await customerRes.json();
  const customerId = customer?.id;

  if (!customerId) {
    throw new Error("HCP: no customer ID returned");
  }

  // Step B: Create job for this customer
  const sourceLabels: Record<string, string> = {
    estimate_widget: "Estimate Widget",
    contact_form: "Contact Form",
    external_widget: "External Widget",
  };
  const source = sourceLabels[(leadData.source as string)] || (leadData.source as string) || "RuufPro";

  const estimateInfo = leadData.estimateLow
    ? `\nEstimate: $${leadData.estimateLow}-$${leadData.estimateHigh} (${leadData.estimateMaterial}, ${leadData.estimateRoofSqft} sq ft)`
    : "";
  const timeline = leadData.timeline ? `\nTimeline: ${leadData.timeline}` : "";
  const message = leadData.leadMessage ? `\nMessage: ${leadData.leadMessage}` : "";

  const jobRes = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: customerId,
      description: `RuufPro Lead — ${fullName}\nSource: ${source}${estimateInfo}${timeline}${message}`.trim(),
      address: (leadData.leadAddress as string) || undefined,
    }),
  });

  if (!jobRes.ok) {
    throw new Error(`HCP job create failed: ${jobRes.status}`);
  }

  const job = await jobRes.json();

  return {
    provider: "housecall_pro",
    customerId,
    jobId: job?.id,
    delivered: true,
  };
}

// ---------------------------------------------------------------------------
// Weather Storm Check — Batched Cron
// Runs every 30 min. Single invocation loops ALL active contractors.
// Checks NOAA for storms in each contractor's ZIP. On new detection:
// 1. Sends email via sendWeatherAlertEmail()
// 2. Logs to console (dashboard banner reads from /api/weather-alerts live)
//
// DISABLED by default — enable via Inngest dashboard when ready.
// ---------------------------------------------------------------------------
export const weatherStormCheck = inngest.createFunction(
  {
    id: "weather-storm-check",
    retries: 1,
    triggers: [{ cron: "*/30 * * * *" }],
  },
  async ({ step }: { step: any }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { getWeatherSurge } = await import("@/lib/weather-surge");
    const { sendWeatherAlertEmail } = await import("@/lib/notifications");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Step 1: Get all active contractors with their ZIPs + settings
    const contractors = await step.run("fetch-contractors", async () => {
      const { data: allContractors } = await supabase
        .from("contractors")
        .select("id, email, business_name, zip, city, state")
        .not("zip", "is", null);

      if (!allContractors || allContractors.length === 0) return [];

      // Get estimate settings for surge status
      const ids = allContractors.map((c: { id: string }) => c.id);
      const { data: allSettings } = await supabase
        .from("estimate_settings")
        .select("contractor_id, service_zips, weather_surge_enabled")
        .in("contractor_id", ids);

      const settingsMap = new Map(
        (allSettings || []).map((s: { contractor_id: string }) => [s.contractor_id, s])
      );

      return allContractors.map((c: { id: string; email: string; business_name: string; zip: string; city: string; state: string }) => ({
        id: c.id,
        email: c.email,
        businessName: c.business_name,
        zip: c.zip,
        city: c.city,
        state: c.state,
        surgeAlreadyEnabled: (settingsMap.get(c.id) as { weather_surge_enabled?: boolean })?.weather_surge_enabled || false,
      }));
    });

    if (contractors.length === 0) {
      return { checked: 0, alerts: 0 };
    }

    // Step 2: Geocode ZIPs and check weather (batched in one step to save runs)
    const results = await step.run("check-weather-all", async () => {
      const alerts: Array<{
        contractorId: string;
        email: string;
        businessName: string;
        city: string;
        state: string;
        severity: string;
        multiplier: number;
        alertNames: string[];
      }> = [];

      for (const contractor of contractors) {
        // Skip if surge already enabled — they've already opted in
        if (contractor.surgeAlreadyEnabled) continue;

        // Geocode ZIP via Census Bureau (free)
        try {
          const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${contractor.zip}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
          const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
          if (!geoRes.ok) continue;
          const geoData = await geoRes.json();
          const match = geoData?.result?.addressMatches?.[0];
          if (!match?.coordinates) continue;

          const surge = await getWeatherSurge(match.coordinates.y, match.coordinates.x);

          if (surge.isSurged) {
            alerts.push({
              contractorId: contractor.id,
              email: contractor.email,
              businessName: contractor.businessName,
              city: contractor.city,
              state: contractor.state,
              severity: surge.highestSeverity,
              multiplier: surge.multiplier,
              alertNames: surge.alerts,
            });
          }
        } catch {
          // Skip this contractor on geocode/weather failure
          continue;
        }
      }

      return alerts;
    });

    // Step 3: Send email notifications for new storm detections
    if (results.length > 0) {
      await step.run("send-storm-emails", async () => {
        const sent: string[] = [];

        for (const alert of results) {
          try {
            const ok = await sendWeatherAlertEmail({
              contractorEmail: alert.email,
              contractorName: alert.businessName,
              alerts: alert.alertNames,
              highestSeverity: alert.severity,
              suggestedMultiplier: alert.multiplier,
              serviceArea: `${alert.city}, ${alert.state}`,
            });
            if (ok) sent.push(alert.contractorId);
          } catch {
            // Don't let one email failure block the rest
            console.error(`Storm email failed for ${alert.contractorId}`);
          }
        }

        return { sent: sent.length, total: results.length };
      });
    }

    return {
      checked: contractors.length,
      alerts: results.length,
      contractors: results.map((r: { contractorId: string }) => r.contractorId),
    };
  }
);

// ---------------------------------------------------------------------------
// Contact Form Detection
// Trigger: "ops/form.detect" — scans a prospect's website for contact forms.
// Stores: form URL, field mapping, CAPTCHA status, honeypot fields.
// Called by: /api/ops/detect-forms route (batch) or manual trigger.
// ---------------------------------------------------------------------------
export const prospectFormDetect = inngest.createFunction(
  {
    id: "prospect-form-detect",
    retries: 2,
    triggers: [{ event: "ops/form.detect" }],
  },
  async ({ event, step }) => {
    const prospectId = event.data.prospectId as string;
    if (!prospectId) throw new Error("Missing prospectId");

    // Step 1: Load prospect data
    const prospect = await step.run("load-prospect", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const { data, error } = await supabase
        .from("prospect_pipeline")
        .select("id, their_website_url, form_detected_at")
        .eq("id", prospectId)
        .single();

      if (error || !data) throw new Error(`Prospect not found: ${prospectId}`);
      if (data.form_detected_at) return { skip: true as const, reason: "already detected", url: "" };
      if (!data.their_website_url) return { skip: true as const, reason: "no website", url: "" };

      return { skip: false as const, reason: "", url: data.their_website_url as string };
    });

    if (prospect.skip) return { skipped: true, reason: prospect.reason };

    // Step 2: Detect form on their website
    const detection = await step.run("detect-form", async () => {
      const { chromium } = await import("playwright");

      const browserlessToken = process.env.BROWSERLESS_TOKEN;
      const browser = browserlessToken
        ? await chromium.connectOverCDP(
            `wss://chrome.browserless.io?token=${browserlessToken}`
          )
        : await chromium.launch({ headless: true });

      try {
        const context = browserlessToken
          ? browser.contexts()[0] || (await browser.newContext())
          : await browser.newContext({ viewport: { width: 1280, height: 900 } });

        const page = await context.newPage();

        // Block heavy resources to speed up detection
        await page.route("**/*", (route) => {
          const type = route.request().resourceType();
          if (["image", "media", "font"].includes(type)) {
            route.abort();
          } else {
            route.continue();
          }
        });

        let fullUrl = prospect.url as string;
        if (!fullUrl.startsWith("http")) fullUrl = `https://${fullUrl}`;

        await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(2000);

        // Find contact page link
        const contactHref: string | null = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a"));
          const patterns = /\/(contact|contact-us|get-in-touch|reach-us|get-a-quote|free-estimate|request)/i;
          const textPatterns = /^(contact|contact us|get in touch|reach us|get a quote|free estimate|request)/i;
          for (const link of links) {
            const href = link.getAttribute("href") || "";
            const text = link.textContent?.trim() || "";
            if (patterns.test(href) || textPatterns.test(text)) return href;
          }
          return null;
        });

        if (contactHref) {
          try {
            const contactUrl = contactHref.startsWith("http")
              ? contactHref
              : new URL(contactHref, page.url()).href;
            await page.goto(contactUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
            await page.waitForTimeout(1500);
          } catch {
            // Stay on current page
          }
        }

        // Run the same detection logic as the scraper (inline for serverless compat)
        const result = await page.evaluate(() => {
          // This is the same detection logic from scrape-prospect-site.mjs detectFormOnPage()
          // Duplicated here because this runs on Vercel serverless, not as a CLI tool
          const res: {
            found: boolean;
            form_url: string;
            form_type: string;
            has_captcha: boolean;
            field_mapping: Record<string, string | null> | null;
            honeypot_fields: string[];
            required_selects: Array<{ selector: string; value: string; required: boolean }>;
            required_radios: Array<{ selector: string; value: string }>;
          } = {
            found: false,
            form_url: window.location.href,
            form_type: "unknown",
            has_captcha: false,
            field_mapping: null,
            honeypot_fields: [],
            required_selects: [],
            required_radios: [],
          };

          const html = document.documentElement.innerHTML;
          if (
            html.includes("grecaptcha") || html.includes("data-sitekey") ||
            html.includes("g-recaptcha") || html.includes("cf-turnstile") ||
            html.includes("hcaptcha") || html.includes("data-netlify-recaptcha")
          ) {
            res.has_captcha = true;
          }

          const forms = Array.from(document.querySelectorAll("form"));
          if (forms.length === 0) {
            if (document.querySelector('[data-mesh-id] form, [id*="comp-"] form')) {
              res.has_captcha = true;
              res.form_type = "wix";
            }
            if (document.querySelector('iframe[src*="jotform"]')) {
              res.has_captcha = true;
              res.form_type = "jotform_iframe";
            }
            return res;
          }

          let bestForm: HTMLFormElement | null = null;
          for (const form of forms) {
            const action = (form.getAttribute("action") || "").toLowerCase();
            const id = (form.id || "").toLowerCase();
            const cn = (form.className || "").toLowerCase();
            if (action.includes("search") || id.includes("search") || cn.includes("search")) continue;
            if (id.includes("subscribe") || id.includes("newsletter") || cn.includes("subscribe")) continue;
            if (id.includes("login") || id.includes("signin") || action.includes("login")) continue;
            const inputs = form.querySelectorAll("input, textarea, select");
            const hasTextarea = form.querySelector("textarea");
            if (inputs.length < 2 && !hasTextarea) continue;
            if (!bestForm || hasTextarea) {
              bestForm = form;
              if (hasTextarea) break;
            }
          }

          if (!bestForm) return res;
          res.found = true;

          const fHtml = bestForm.outerHTML.toLowerCase();
          const fClass = (bestForm.className || "").toLowerCase();
          const fId = (bestForm.id || "").toLowerCase();
          if (fClass.includes("wpcf7") || fHtml.includes("wpcf7")) res.form_type = "cf7";
          else if (fClass.includes("gform") || fHtml.includes("gform") || fId.includes("gform")) res.form_type = "gravity";
          else if (fClass.includes("wpforms") || fHtml.includes("wpforms")) res.form_type = "wpforms";
          else if (bestForm.closest("[data-form-id]") || fHtml.includes("data-form-id")) res.form_type = "squarespace";
          else if (fClass.includes("gdw-form") || fHtml.includes("gdw-form")) res.form_type = "godaddy";
          else if (fHtml.includes("elementor")) res.form_type = "elementor";
          else res.form_type = "custom";

          function isHoneypot(el: Element): boolean {
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return true;
            if (parseInt(style.height) === 0 && style.overflow === "hidden") return true;
            const rect = el.getBoundingClientRect();
            if ((rect.width === 0 && rect.height === 0) || rect.left < -500 || rect.top < -500) return true;
            const parent = el.closest("div, span, p, li");
            if (parent && parent !== document.body) {
              const pStyle = window.getComputedStyle(parent);
              if (pStyle.display === "none" || pStyle.visibility === "hidden" || pStyle.opacity === "0") return true;
              const pRect = parent.getBoundingClientRect();
              if (pRect.left < -500 || pRect.top < -500) return true;
            }
            const name = (el.getAttribute("name") || "").toLowerCase();
            if (name.includes("honeypot") || name.includes("hp-") || name === "website" || name === "url") return true;
            return false;
          }

          function getSelector(el: Element): string {
            if (el.id) return `#${el.id}`;
            if (el.getAttribute("name")) return `[name="${el.getAttribute("name")}"]`;
            if (el.getAttribute("data-q")) return `[data-q="${el.getAttribute("data-q")}"]`;
            const tag = el.tagName.toLowerCase();
            const siblings = bestForm!.querySelectorAll(tag);
            const idx = Array.from(siblings).indexOf(el);
            return `form ${tag}:nth-of-type(${idx + 1})`;
          }

          function classifyField(el: HTMLInputElement | HTMLTextAreaElement): string {
            const name = (el.getAttribute("name") || "").toLowerCase();
            const id = (el.id || "").toLowerCase();
            const ph = (el.getAttribute("placeholder") || "").toLowerCase();
            const type = ((el as HTMLInputElement).type || "").toLowerCase();
            const aria = (el.getAttribute("aria-label") || "").toLowerCase();
            let lbl = "";
            if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) lbl = l.textContent!.trim().toLowerCase(); }
            const wl = el.closest("label"); if (wl) lbl = lbl || wl.textContent!.trim().toLowerCase();
            const all = `${name} ${id} ${ph} ${type} ${lbl} ${aria}`;
            if (type === "email" || all.includes("email")) return "email";
            if (type === "tel" || all.includes("phone") || all.includes("tel")) return "phone";
            if (el.tagName === "TEXTAREA" || all.includes("message") || all.includes("comment") || all.includes("question")) return "message";
            if (all.includes("name") && !all.includes("company") && !all.includes("business")) return "name";
            if (all.includes("subject")) return "subject";
            return "unknown";
          }

          const mapping: Record<string, string | null> = {
            name_field: null, email_field: null, phone_field: null,
            message_field: null, subject_field: null, submit_button: null,
          };

          const allInputs = Array.from(bestForm.querySelectorAll("input, textarea"));
          for (const el of allInputs) {
            if ((el as HTMLInputElement).type === "hidden") continue;
            if (isHoneypot(el)) { res.honeypot_fields.push(getSelector(el)); continue; }
            const field = classifyField(el as HTMLInputElement | HTMLTextAreaElement);
            const sel = getSelector(el);
            if (field === "name" && !mapping.name_field) mapping.name_field = sel;
            else if (field === "email" && !mapping.email_field) mapping.email_field = sel;
            else if (field === "phone" && !mapping.phone_field) mapping.phone_field = sel;
            else if (field === "message" && !mapping.message_field) mapping.message_field = sel;
            else if (field === "subject" && !mapping.subject_field) mapping.subject_field = sel;
          }

          const selects = Array.from(bestForm.querySelectorAll("select"));
          for (const sel of selects) {
            if (isHoneypot(sel)) continue;
            const isReq = sel.hasAttribute("required") || sel.getAttribute("aria-required") === "true";
            const options = Array.from(sel.querySelectorAll("option"));
            let defVal: string | null = null;
            for (const opt of options) {
              const v = opt.value; const t = opt.textContent!.trim().toLowerCase();
              if (!v || v === "" || t.includes("select") || t.includes("choose") || t.includes("---") || t.includes("please")) continue;
              defVal = v; break;
            }
            if (defVal) res.required_selects.push({ selector: getSelector(sel), value: defVal, required: isReq });
          }

          const radioGroups: Record<string, { selector: string; value: string }> = {};
          const radios = Array.from(bestForm.querySelectorAll('input[type="radio"]'));
          for (const radio of radios) {
            const n = radio.getAttribute("name");
            if (!n || radioGroups[n]) continue;
            radioGroups[n] = { selector: `[name="${n}"]`, value: (radio as HTMLInputElement).value };
          }
          res.required_radios = Object.values(radioGroups);

          const submitBtn = bestForm.querySelector('button[type="submit"], input[type="submit"]');
          if (submitBtn) { mapping.submit_button = getSelector(submitBtn); }
          else {
            const buttons = Array.from(bestForm.querySelectorAll("button, [role='button']"));
            for (const btn of buttons) {
              const t = btn.textContent!.trim().toLowerCase();
              if (t.includes("submit") || t.includes("send") || t.includes("contact") || t.includes("get") || t.includes("request")) {
                mapping.submit_button = getSelector(btn); break;
              }
            }
          }

          if (!mapping.message_field && !mapping.email_field) { res.found = false; return res; }
          res.field_mapping = mapping;
          return res;
        });

        return result;
      } finally {
        await browser.close();
      }
    });

    // Step 3: Save detection results
    await step.run("save-detection", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      await supabase
        .from("prospect_pipeline")
        .update({
          contact_form_url: detection.found ? detection.form_url : null,
          form_field_mapping: detection.found
            ? {
                ...detection.field_mapping,
                honeypot_fields: detection.honeypot_fields || [],
                required_selects: detection.required_selects || [],
                required_radios: detection.required_radios || [],
                form_type: detection.form_type,
              }
            : null,
          has_captcha: detection.has_captcha,
          form_detected_at: new Date().toISOString(),
        })
        .eq("id", prospectId);
    });

    return {
      prospectId,
      found: detection.found,
      form_type: detection.form_type,
      has_captcha: detection.has_captcha,
    };
  }
);

// ---------------------------------------------------------------------------
// Contact Form Submission
// Trigger: "ops/form.submit" — submits outreach via a prospect's contact form.
// Includes: duplicate check, idempotency guard, Slack notification on success.
// Called by: /api/ops/submit-forms route (after Hannah clicks "Submit Forms").
// ---------------------------------------------------------------------------
export const prospectFormSubmit = inngest.createFunction(
  {
    id: "prospect-form-submit",
    retries: 1,
    triggers: [{ event: "ops/form.submit" }],
  },
  async ({ event, step }) => {
    const prospectId = event.data.prospectId as string;
    if (!prospectId) throw new Error("Missing prospectId");

    // Step 1: Atomic claim — increment attempt count WHERE still 0.
    // Prevents race condition if two Inngest events fire for same prospect.
    const prospect = await step.run("claim-prospect", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      // Atomic claim: only succeeds if no other handler got here first
      const { data: claimed, error: claimErr } = await supabase
        .from("prospect_pipeline")
        .update({ form_submission_attempts: 1 })
        .eq("id", prospectId)
        .eq("form_submission_attempts", 0)
        .select(
          "id, contractor_id, business_name, owner_name, phone, their_website_url, " +
          "contact_form_url, form_field_mapping, has_captcha, " +
          "form_submission_attempts, form_submission_status, demo_page_url"
        )
        .maybeSingle();

      if (claimErr) throw new Error(`Claim failed: ${claimErr.message}`);

      // If no row returned, another handler already claimed it
      if (!claimed) {
        return { skip: true as const, reason: "already attempted", data: null as any };
      }
      if (!(claimed as any).contact_form_url) {
        return { skip: true as const, reason: "no form URL", data: null as any };
      }
      if ((claimed as any).has_captcha) {
        return { skip: true as const, reason: "captcha detected", data: null as any };
      }

      return { skip: false as const, reason: "", data: claimed as any };
    });

    if (prospect.skip) return { skipped: true, reason: prospect.reason };
    const p = prospect.data as Record<string, any>;

    // Step 2: Duplicate check — same phone or website already submitted
    const isDuplicate = await step.run("check-duplicate", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      // Check by phone
      if (p.phone) {
        const { count: phoneCount } = await supabase
          .from("prospect_pipeline")
          .select("*", { count: "exact", head: true })
          .eq("phone", p.phone)
          .eq("form_submission_status", "success")
          .neq("id", prospectId);

        if (phoneCount && phoneCount > 0) return true;
      }

      // Check by website URL
      if (p.their_website_url) {
        const { count: urlCount } = await supabase
          .from("prospect_pipeline")
          .select("*", { count: "exact", head: true })
          .eq("their_website_url", p.their_website_url)
          .eq("form_submission_status", "success")
          .neq("id", prospectId);

        if (urlCount && urlCount > 0) return true;
      }

      return false;
    });

    if (isDuplicate) {
      await step.run("mark-duplicate", async () => {
        const { createServerSupabase } = await import("@/lib/supabase-server");
        const supabase = createServerSupabase();
        await supabase
          .from("prospect_pipeline")
          .update({ form_submission_status: "duplicate_skipped" })
          .eq("id", prospectId);
      });
      return { skipped: true, reason: "duplicate" };
    }

    // Step 3: Build claim URL and submit the form
    // (attempt count already incremented atomically in step 1)
    type SubmitResult = { success: boolean; status: string; submittedAt?: string; error?: string; screenshotPath?: string };

    const result: SubmitResult = await step.run("submit-form", async () => {
      const { submitContactForm } = await import("@/lib/form-outreach");

      // Build the claim URL from the contractor's slug
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();
      const { data: site } = await supabase
        .from("sites")
        .select("slug")
        .eq("contractor_id", p.contractor_id)
        .eq("published", true)
        .single();

      const slug = site?.slug || p.contractor_id;
      const claimUrl = `https://ruufpro.com/claim/${slug}`;

      const mapping = (p.form_field_mapping || {}) as Record<string, unknown>;

      return await submitContactForm({
        prospectId,
        formUrl: p.contact_form_url as string,
        fieldMapping: {
          name_field: (mapping.name_field as string) || null,
          email_field: (mapping.email_field as string) || null,
          phone_field: (mapping.phone_field as string) || null,
          message_field: (mapping.message_field as string) || null,
          subject_field: (mapping.subject_field as string) || null,
          submit_button: (mapping.submit_button as string) || null,
        },
        honeypotFields: (mapping.honeypot_fields as string[]) || [],
        requiredSelects: (mapping.required_selects as Array<{ selector: string; value: string }>) || [],
        requiredRadios: (mapping.required_radios as Array<{ selector: string; value: string }>) || [],
        businessName: p.business_name as string,
        ownerName: p.owner_name as string | null,
        demoPageUrl: p.demo_page_url as string,
        claimUrl,
        senderName: "Hannah Waldo",
        senderEmail: "forms@getruufpro.com",
      });
    });

    // Step 5: Update pipeline based on result
    await step.run("update-pipeline", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      if (result.success) {
        await supabase
          .from("prospect_pipeline")
          .update({
            stage: "sent",
            stage_entered_at: new Date().toISOString(),
            outreach_method: "form",
            form_submitted_at: result.submittedAt,
            form_submission_status: "success",
            sent_at: result.submittedAt,
          })
          .eq("id", prospectId);
      } else {
        await supabase
          .from("prospect_pipeline")
          .update({
            form_submission_status: result.status as string,
            form_submission_error: result.error,
          })
          .eq("id", prospectId);
      }
    });

    // Step 6: Slack notification on success
    if (result.success) {
      await step.run("notify-slack", async () => {
        const webhookUrl = process.env.SLACK_NOTIFICATIONS_WEBHOOK_URL;
        if (!webhookUrl) return;

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `:mailbox_with_mail: *Form Submitted*\n*${p.business_name}* — via ${(p.form_field_mapping as Record<string, unknown>)?.form_type || "contact form"}\nForm URL: ${p.contact_form_url}`,
          }),
        });
      });
    }

    return {
      prospectId,
      success: result.success,
      status: result.status,
      error: result.error,
    };
  }
);

// ---------------------------------------------------------------------------
// Batch Auto-Enrich (v3 Pipeline)
// Trigger: "ops/batch.auto-enrich" — fired after scrape inserts new prospects
// Full chain: Google → Facebook → Email extract → FL license → AI rewrite → Build sites
// Each step is independent so failures don't block the pipeline.
// ---------------------------------------------------------------------------
export const batchAutoEnrich = inngest.createFunction(
  {
    id: "batch-auto-enrich",
    retries: 2,
    concurrency: [{ limit: 1 }],
    triggers: [{ event: "ops/batch.auto-enrich" }],
  },
  async ({ event, step }) => {
    const batchId = event.data.batchId as string;
    const prospectIds = event.data.prospectIds as string[];

    if (!batchId || !prospectIds?.length) {
      throw new Error("Missing batchId or prospectIds");
    }

    const baseUrl = "https://ruufpro.com";

    // Step 1: Google Places enrichment (photos + reviews + services)
    const googleResult = await step.run("google-enrich", async () => {
      const res = await fetch(`${baseUrl}/api/ops/enrich-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          prospect_ids: prospectIds,
          auto_advance: false, // We handle stage advancement ourselves
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google enrich failed: ${res.status} — ${text}`);
      }

      return await res.json();
    });

    // Step 2: Facebook enrichment (best-effort — failures don't block)
    const facebookResult = await step.run("facebook-enrich", async () => {
      const res = await fetch(`${baseUrl}/api/ops/enrich-facebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          prospect_ids: prospectIds,
        }),
      });

      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      return await res.json();
    });

    // Step 3: Extract email from Facebook About text + Apollo fallback
    const emailResult = await step.run("email-extract", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get prospects with Facebook data but no email yet
      const { data: prospects } = await supabase
        .from("prospect_pipeline")
        .select("id, facebook_about, owner_email")
        .in("id", prospectIds)
        .is("owner_email", null);

      if (!prospects?.length) return { extracted: 0 };

      let extracted = 0;
      for (const p of prospects) {
        // Try extracting email from Facebook About text
        const fbAbout = (p.facebook_about || "") as string;
        const emailMatch = fbAbout.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        if (emailMatch) {
          await supabase
            .from("prospect_pipeline")
            .update({ owner_email: emailMatch[0] })
            .eq("id", p.id);
          extracted++;
        }
      }

      return { extracted, checked: prospects.length };
    });

    // Step 4: Apollo email enrichment for those still without email
    const apolloResult = await step.run("apollo-enrich", async () => {
      const res = await fetch(`${baseUrl}/api/ops/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          prospect_ids: prospectIds,
        }),
      });

      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      return await res.json();
    });

    // Step 5: FL license lookup (free, best-effort)
    const licenseResult = await step.run("fl-license-lookup", async () => {
      const { lookupFLLicense } = await import("@/lib/fl-license-lookup");
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: prospects } = await supabase
        .from("prospect_pipeline")
        .select("id, business_name")
        .in("id", prospectIds)
        .is("fl_license_verified_at", null);

      if (!prospects?.length) return { verified: 0 };

      let verified = 0;
      for (const p of prospects) {
        const result = await lookupFLLicense(p.business_name);
        await supabase
          .from("prospect_pipeline")
          .update({
            fl_license_type: result.license_type,
            fl_license_number: result.license_number,
            fl_license_verified_at: new Date().toISOString(),
          })
          .eq("id", p.id);

        if (result.found) verified++;

        // Brief pause to be polite to DBPR
        await new Promise((r) => setTimeout(r, 500));
      }

      return { verified, checked: prospects.length };
    });

    // Step 6: Advance all to "enriched" stage
    const advanceResult = await step.run("advance-to-enriched", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("prospect_pipeline")
        .update({
          stage: "enriched",
          stage_entered_at: now,
          enriched_at: now,
        })
        .in("id", prospectIds)
        .eq("stage", "scraped")
        .select("id");

      // Also catch any that were at google_enriched (from auto_advance on enrich-photos)
      const { data: data2 } = await supabase
        .from("prospect_pipeline")
        .update({
          stage: "enriched",
          stage_entered_at: now,
          enriched_at: now,
        })
        .in("id", prospectIds)
        .eq("stage", "google_enriched")
        .select("id");

      const total = (data?.length || 0) + (data2?.length || 0);
      return { advanced: total, error: error?.message };
    });

    // Step 7: AI rewrite (polish copy + draft email)
    const aiResult = await step.run("ai-rewrite", async () => {
      const res = await fetch(`${baseUrl}/api/ops/ai-rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          prospect_ids: prospectIds,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `HTTP ${res.status}: ${text}` };
      }

      return await res.json();
    });

    // Step 8: Auto-build sites
    const buildResult = await step.run("auto-build-sites", async () => {
      const res = await fetch(`${baseUrl}/api/ops/build-sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: batchId,
          prospect_ids: prospectIds,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `HTTP ${res.status}: ${text}` };
      }

      return await res.json();
    });

    return {
      batchId,
      totalProspects: prospectIds.length,
      google: googleResult,
      facebook: facebookResult,
      email: emailResult,
      apollo: apolloResult,
      license: licenseResult,
      advanced: advanceResult,
      ai: aiResult,
      sites: buildResult,
    };
  }
);

// ---------------------------------------------------------------------------
// Outreach Auto-Send (v3 Pipeline)
// Trigger: "ops/outreach.auto-send" — fired after Gate 1 (demo_review) approval
// Adds approved prospects to Instantly campaign for cold email delivery.
// ---------------------------------------------------------------------------
export const outreachAutoSend = inngest.createFunction(
  {
    id: "outreach-auto-send",
    retries: 2,
    triggers: [{ event: "ops/outreach.auto-send" }],
  },
  async ({ event, step }) => {
    const batchId = event.data.batchId as string;
    const prospectIds = event.data.prospectIds as string[];

    if (!prospectIds?.length) {
      return { success: true, skipped: true, reason: "no prospect IDs" };
    }

    // Step 1: Send via Instantly
    const sendResult = await step.run("send-via-instantly", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const campaignId = process.env.INSTANTLY_DEFAULT_CAMPAIGN_ID;
      if (!campaignId) {
        return { success: false, error: "INSTANTLY_DEFAULT_CAMPAIGN_ID not set" };
      }

      // Get approved prospects with email
      const { data: prospects } = await supabase
        .from("prospect_pipeline")
        .select("id, business_name, owner_name, owner_email, phone, city, state, demo_page_url, ai_email_subject, ai_email_body")
        .in("id", prospectIds)
        .eq("stage", "site_approved")
        .not("owner_email", "is", null);

      if (!prospects?.length) {
        // Flag prospects without email
        const { data: noEmail } = await supabase
          .from("prospect_pipeline")
          .select("id")
          .in("id", prospectIds)
          .eq("stage", "site_approved")
          .is("owner_email", null);

        return {
          success: true,
          sent: 0,
          no_email: noEmail?.length || 0,
          message: "No prospects have email addresses",
        };
      }

      const { addLeadsToCampaign } = await import("@/lib/instantly");

      const leads = prospects.map((p) => {
        const nameParts = (p.owner_name || "").split(" ");
        return {
          email: p.owner_email!,
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          company_name: p.business_name || "",
          phone: p.phone || "",
          custom_variables: {
            city: p.city || "",
            state: p.state || "FL",
            preview_url: p.demo_page_url
              ? `https://ruufpro.com${p.demo_page_url}`
              : "",
            // AI email template variables (Instantly uses these in email templates)
            ai_subject: p.ai_email_subject || "",
            ai_body: p.ai_email_body || "",
          },
        };
      });

      const result = await addLeadsToCampaign(campaignId, leads);

      if (!result.success) {
        throw new Error(`Instantly add failed: ${result.error}`);
      }

      // Update pipeline stage
      const now = new Date().toISOString();
      await supabase
        .from("prospect_pipeline")
        .update({
          stage: "sent",
          stage_entered_at: now,
          outreach_method: "cold_email",
          sent_at: now,
          email_sequence_id: campaignId,
        })
        .in("id", prospects.map((p) => p.id));

      return { success: true, sent: result.added, campaign_id: campaignId };
    });

    // Step 2: Send Slack notification
    await step.run("notify-slack", async () => {
      const { sendAlert } = await import("@/lib/alerts");
      const sentCount = "sent" in sendResult ? sendResult.sent : 0;
      const noEmailCount = "no_email" in sendResult ? sendResult.no_email : 0;
      await sendAlert({
        title: "Outreach Auto-Sent",
        message: `${sentCount} prospects added to Instantly campaign after Gate 1 approval.`,
        severity: "info",
        details: {
          "Batch": batchId,
          "Sent": sentCount,
          "No Email": noEmailCount,
        },
      });
    });

    return sendResult;
  }
);

// ---------------------------------------------------------------------------
// Stale Lead Detection — daily cron to flag leads going cold
// Runs at 7am ET, scans all Pro contractor leads for:
// - New leads with no status change in 48h
// - Quoted leads with no movement in 3+ days
// - Contacted leads with no follow-up in 5+ days
// Updates lead temperature so they bubble to top of Copilot queue.
// ---------------------------------------------------------------------------
export const staleLeadDetection = inngest.createFunction(
  {
    id: "stale-lead-detection",
    retries: 2,
    triggers: [{ cron: "0 11 * * *" }], // 7am ET (UTC-4)
  },
  async ({ step }) => {
    const results = await step.run("detect-stale-leads", async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get all Pro contractors
      const { data: contractors } = await supabase
        .from("contractors")
        .select("id, email, business_name, owner_first_name")
        .eq("tier", "pro");

      if (!contractors || contractors.length === 0) return { checked: 0, flagged: 0 };

      const now = new Date();
      const h48ago = new Date(now.getTime() - 48 * 3600000).toISOString();
      const d3ago = new Date(now.getTime() - 3 * 86400000).toISOString();
      const d5ago = new Date(now.getTime() - 5 * 86400000).toISOString();
      let totalFlagged = 0;

      for (const c of contractors) {
        // New leads, no contact in 48h
        const { data: staleNew } = await supabase
          .from("leads")
          .select("id")
          .eq("contractor_id", c.id)
          .eq("status", "new")
          .is("contacted_at", null)
          .lt("created_at", h48ago);

        // Quoted leads, no movement in 3 days
        const { data: staleQuoted } = await supabase
          .from("leads")
          .select("id")
          .eq("contractor_id", c.id)
          .eq("status", "quoted")
          .lt("created_at", d3ago);

        // Contacted but no follow-up in 5 days
        const { data: staleContacted } = await supabase
          .from("leads")
          .select("id")
          .eq("contractor_id", c.id)
          .eq("status", "contacted")
          .lt("contacted_at", d5ago);

        const allStale = [
          ...(staleNew || []),
          ...(staleQuoted || []),
          ...(staleContacted || []),
        ];

        if (allStale.length > 0) {
          // Update temperature to "hot" so they bubble up in Copilot
          const ids = allStale.map((l) => l.id);
          await supabase
            .from("leads")
            .update({ temperature: "hot" })
            .in("id", ids)
            .neq("temperature", "hot"); // Don't re-flag already hot leads

          totalFlagged += allStale.length;
        }
      }

      return { checked: contractors.length, flagged: totalFlagged };
    });

    // Notify if leads were flagged
    if (results.flagged > 0) {
      await step.run("notify-stale-leads", async () => {
        const { sendAlert } = await import("@/lib/alerts");
        await sendAlert({
          title: "Stale leads detected",
          message: `${results.flagged} leads going cold across ${results.checked} contractors. They've been bumped to urgent in Copilot.`,
          severity: "warning",
        });
      });
    }

    return results;
  }
);
