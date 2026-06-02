import type { WhatsAppMessageKind } from "../../whatsapp-cloud";
import type { CampaignDeliveryOptions } from "../delivery";
import { sendWhatsAppMediaMessage, sendWhatsAppTextMessage } from "../whatsapp-message.service";
import {
  createWhatsAppProvider,
  getProviderLabel,
  getWhatsAppProviderId,
  isAnyWhatsAppProviderLive
} from "../whatsapp-provider.factory";

export type WhatsAppProviderId = "evolution" | "meta" | "green-api" | "demo" | "none";

export function getConfiguredProviders(): WhatsAppProviderId[] {
  const id = getWhatsAppProviderId();
  const provider = createWhatsAppProvider();
  return provider.id === "demo" ? [] : [id as WhatsAppProviderId];
}

export function getActiveProvider(): WhatsAppProviderId {
  const provider = createWhatsAppProvider();
  if (provider.id === "demo") return "none";
  return provider.id as WhatsAppProviderId;
}

export function isAnyWhatsAppProviderConfigured() {
  return isAnyWhatsAppProviderLive();
}

export { getProviderLabel };

export async function getProviderHealth(): Promise<{
  provider: WhatsAppProviderId;
  connected: boolean;
  detail?: string;
}> {
  const provider = createWhatsAppProvider();
  if (provider.id === "demo") {
    return {
      provider: "none",
      connected: false,
      detail: "WhatsApp is in Demo Mode. Configure Evolution API in .env."
    };
  }

  try {
    const state = await provider.getConnectionState();
    return {
      provider: provider.id as WhatsAppProviderId,
      connected: state === "CONNECTED",
      detail: state === "CONNECTED" ? "WhatsApp connected" : `Status: ${state}`
    };
  } catch (error) {
    return {
      provider: provider.id as WhatsAppProviderId,
      connected: false,
      detail: error instanceof Error ? error.message : "Connection check failed"
    };
  }
}

export async function sendViaActiveProvider(input: {
  phone: string;
  name?: string | null;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
  delivery?: CampaignDeliveryOptions;
}): Promise<{ ok: boolean; messageId?: string; error?: string; provider: WhatsAppProviderId }> {
  const provider = createWhatsAppProvider();
  const providerId = provider.id === "demo" ? "none" : (provider.id as WhatsAppProviderId);

  if (provider.id === "demo") {
    return {
      ok: true,
      messageId: `sim_${Date.now()}`,
      provider: "none"
    };
  }

  const result =
    input.messageType === "TEXT" || !input.mediaUrl
      ? await sendWhatsAppTextMessage(input.phone, input.text)
      : await sendWhatsAppMediaMessage({
          phone: input.phone,
          messageType: input.messageType,
          text: input.text,
          mediaUrl: input.mediaUrl
        });

  return {
    ok: result.ok,
    messageId: result.messageId,
    error: result.error,
    provider: providerId
  };
}
