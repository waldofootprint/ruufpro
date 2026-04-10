import { inngest } from "./client";

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
    const { contractorId, leadPhone, leadName, estimateLow, estimateHigh } = event.data;

    if (!leadPhone) {
      return { success: true, skipped: true, reason: "no phone number" };
    }

    const result = await step.run("send-auto-response-sms", async () => {
      const { sendLeadAutoResponse } = await import("@/lib/sms-workflows");
      return sendLeadAutoResponse(contractorId, leadPhone, leadName, {
        estimateLow: estimateLow || null,
        estimateHigh: estimateHigh || null,
      });
    });

    if (!result.success) {
      throw new Error(`Lead auto-response failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 2: Missed-Call Text-Back
// Trigger: "sms/call.missed" — emitted from /api/sms/voice-webhook
// Steps: dedup check → send textback SMS
// ---------------------------------------------------------------------------
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
    });

    if (!result.success) {
      throw new Error(`Missed-call textback failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 3: Review Request
// Trigger: "sms/review.requested" — emitted from /api/reviews/request
// Steps: send review SMS (workflow handles all validation + tracking)
// ---------------------------------------------------------------------------
export const reviewRequest = inngest.createFunction(
  {
    id: "review-request-sms",
    retries: 3,
    triggers: [{ event: "sms/review.requested" }],
  },
  async ({ event, step }) => {
    const { contractorId, leadId } = event.data;

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
// Chain 4: Review Email Follow-Up
// Trigger: "sms/review.followup-needed" — emitted from cron job
// Steps: send follow-up email for unclicked review links
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
