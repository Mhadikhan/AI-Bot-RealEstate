import {
  buildManualWhatsAppUrl,
  personalizeBroadcastMessage,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  type WhatsAppMessageKind,
  type WhatsAppSendResult
} from "../whatsapp-cloud";

export type DeliveryMethod = "template" | "session";

export type CampaignDeliveryOptions = {
  deliveryMethod?: DeliveryMethod;
  templateName?: string;
  templateLanguage?: string;
};

export function parseCampaignDelivery(
  audienceFilters: unknown
): CampaignDeliveryOptions {
  const f = audienceFilters as Record<string, unknown> | null;
  const method = f?.deliveryMethod === "session" ? "session" : "template";
  return {
    deliveryMethod: method,
    templateName:
      (typeof f?.templateName === "string" && f.templateName) ||
      process.env.WHATSAPP_TEMPLATE_NAME?.trim() ||
      "hello_world",
    templateLanguage:
      (typeof f?.templateLanguage === "string" && f.templateLanguage) ||
      process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() ||
      "en_US"
  };
}

export function buildTemplateBodyParameters(message: string, name?: string | null) {
  const text = personalizeBroadcastMessage(message, name).trim();
  if (!text) return undefined;
  return [{ type: "text" as const, text: text.slice(0, 1024) }];
}

/** Send one message via Cloud API (template for cold contacts, session for 24h window). */
export async function deliverWhatsAppToRecipient(input: {
  phone: string;
  name?: string | null;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
  delivery: CampaignDeliveryOptions;
}): Promise<WhatsAppSendResult> {
  const { phone, name, messageType, text, mediaUrl, delivery } = input;

  if (delivery.deliveryMethod === "template") {
    if (messageType !== "TEXT") {
      return {
        ok: false,
        error:
          "Image/video to new contacts requires an approved Meta template with media header. Use Text + Template delivery, or Session (24h) if they messaged you recently."
      };
    }

    const bodyParams = buildTemplateBodyParameters(text, name);
    const templateName = delivery.templateName || "hello_world";
    const hasBodyVars = bodyParams && bodyParams.length > 0 && templateName !== "hello_world";

    return sendWhatsAppTemplate({
      phone,
      templateName,
      languageCode: delivery.templateLanguage || "en_US",
      bodyParameters: hasBodyVars ? bodyParams : undefined
    });
  }

  return sendWhatsAppMessage({ phone, messageType, text, mediaUrl });
}

export function buildManualSendLinks(phones: string[], message: string) {
  return phones.map((phone) => ({
    phone,
    url: buildManualWhatsAppUrl(phone, message)
  }));
}
