import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  globalFailureHandler,
  leadAutoResponse,
  // missedCallTextback,  // PARKED FOR LAUNCH — April 11 2026. No prior consent from callers.
  reviewRequest,
  reviewEmailFollowup,
  leadPushNotification,
  crmWebhookExport,
  crmDirectPush,
  crmTokenRefresh,
  inboundSmsNotification,
  soleProprietorRegistration,
  a2pWizardCompliance,
  weatherStormCheck,
  prospectFormDetect,
  prospectFormSubmit,
  batchAutoEnrich,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    globalFailureHandler,
    leadAutoResponse,
    // missedCallTextback,  // PARKED FOR LAUNCH
    reviewRequest,
    reviewEmailFollowup,
    leadPushNotification,
    crmWebhookExport,
    crmDirectPush,
    crmTokenRefresh,
    inboundSmsNotification,
    soleProprietorRegistration,
    a2pWizardCompliance,
    weatherStormCheck,
    prospectFormDetect,
    prospectFormSubmit,
    batchAutoEnrich,
  ],
});
