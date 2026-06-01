import { normalizeWhatsAppNumber, whatsAppUrl } from "./social";

export type WhatsAppSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
  manualUrl?: string;
};

export function isWhatsAppApiConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export function toWhatsAppApiPhone(phone: string) {
  const digits = normalizeWhatsAppNumber(phone).replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export function personalizeBroadcastMessage(template: string, name?: string | null) {
  const displayName = name?.trim() || "there";
  return template.replace(/\{\{name\}\}/gi, displayName).replace(/\{name\}/gi, displayName);
}

export function buildManualWhatsAppUrl(phone: string, message: string) {
  return whatsAppUrl(phone, message);
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: "WhatsApp Cloud API not configured",
      manualUrl: buildManualWhatsAppUrl(phone, message)
    };
  }

  const to = toWhatsAppApiPhone(phone);

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      // One API call per contact — private 1:1 messages only (never WhatsApp groups).
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: message }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error?.message || "WhatsApp API request failed",
        manualUrl: buildManualWhatsAppUrl(phone, message)
      };
    }

    return {
      ok: true,
      messageId: data?.messages?.[0]?.id
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
      manualUrl: buildManualWhatsAppUrl(phone, message)
    };
  }
}
