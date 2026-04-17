// Lead scoring — thin wrapper over intent detection.
// Preserves the scoreLeadFromChat API for backward compatibility.

import { detectIntent } from "@/lib/intent-detection";
import type { ChatMessage } from "@/lib/intent-detection";
import type { LeadTemperature } from "@/lib/types";

export type { ChatMessage };

export function scoreLeadFromChat(messages: ChatMessage[]): LeadTemperature {
  return detectIntent(messages).temperature;
}
