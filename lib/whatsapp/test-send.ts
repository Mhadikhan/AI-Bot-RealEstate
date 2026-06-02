import { isWhatsAppLiveMode } from "./config";
import type { CampaignDeliveryOptions, DeliveryMethod } from "./delivery";
import { sendViaActiveProvider } from "./providers";
import { toWhatsAppApiPhone } from "../whatsapp-cloud";
import type { WhatsAppMessageKind } from "../whatsapp-cloud";

export async function sendWhatsAppTestMessage(input: {
  phone: string;
  messageType: WhatsAppMessageKind;
  message: string;
  mediaUrl?: string | null;
  deliveryMethod?: DeliveryMethod;
  templateName?: string;
  templateLanguage?: string;
}) {
  const normalized = toWhatsAppApiPhone(input.phone);

  if (!isWhatsAppLiveMode()) {
    return {
      ok: false,
      mode: "DEMO" as const,
      error:
        "WhatsApp is currently running in Demo Mode.\n\nTo connect a WhatsApp test number, open Admin → Settings → WhatsApp, configure Evolution API, create an instance, and scan the QR code from WhatsApp → Linked Devices.\n\nYou can still use “Open in WhatsApp” to send manually from your phone.",
      phone: normalized
    };
  }

  const delivery: CampaignDeliveryOptions = {
    deliveryMethod: input.deliveryMethod || "template",
    templateName: input.templateName || process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "hello_world",
    templateLanguage:
      input.templateLanguage || process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US"
  };

  const result = await sendViaActiveProvider({
    phone: normalized,
    name: null,
    messageType: input.messageType,
    text: input.message,
    mediaUrl: input.mediaUrl,
    delivery
  });

  return {
    ok: result.ok,
    mode: "LIVE" as const,
    messageId: result.messageId,
    error: result.error,
    phone: normalized,
    provider: result.provider,
    deliveryMethod: delivery.deliveryMethod,
    templateName: delivery.templateName
  };
}
