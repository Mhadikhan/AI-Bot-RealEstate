import { normalizeWhatsAppNumber, whatsAppUrl } from "./social";

export type WhatsAppSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
  manualUrl?: string;
};

export type WhatsAppMessageKind = "TEXT" | "IMAGE" | "VIDEO";

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

/** WhatsApp Cloud API requires HTTPS URLs for media — not localhost. */
export function resolvePublicMediaUrl(mediaUrl: string) {
  const trimmed = mediaUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("http://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (!base) return trimmed;
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

async function postWhatsAppMessage(phone: string, body: Record<string, unknown>): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: "WhatsApp Cloud API not configured"
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
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        ...body
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error?.message || "WhatsApp API request failed"
      };
    }

    return {
      ok: true,
      messageId: data?.messages?.[0]?.id
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error"
    };
  }
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppSendResult> {
  if (!isWhatsAppApiConfigured()) {
    return {
      ok: false,
      error: "WhatsApp Cloud API not configured",
      manualUrl: buildManualWhatsAppUrl(phone, message)
    };
  }

  return postWhatsAppMessage(phone, {
    type: "text",
    text: { preview_url: false, body: message }
  });
}

export async function sendWhatsAppImage(
  phone: string,
  mediaUrl: string,
  caption?: string
): Promise<WhatsAppSendResult> {
  const link = resolvePublicMediaUrl(mediaUrl);
  if (!link.startsWith("https://")) {
    return {
      ok: false,
      error:
        "Image URL must be public HTTPS (set NEXT_PUBLIC_APP_URL to your deployed domain, or paste a direct image link)."
    };
  }

  const image: { link: string; caption?: string } = { link };
  if (caption?.trim()) image.caption = caption.trim().slice(0, 1024);

  const result = await postWhatsAppMessage(phone, { type: "image", image });
  if (!result.ok) {
    result.manualUrl = buildManualWhatsAppUrl(phone, caption || "View property image");
  }
  return result;
}

export async function sendWhatsAppVideo(
  phone: string,
  mediaUrl: string,
  caption?: string
): Promise<WhatsAppSendResult> {
  const link = resolvePublicMediaUrl(mediaUrl);
  if (!link.startsWith("https://")) {
    return {
      ok: false,
      error:
        "Video URL must be public HTTPS (set NEXT_PUBLIC_APP_URL to your deployed domain, or paste a direct video link)."
    };
  }

  const video: { link: string; caption?: string } = { link };
  if (caption?.trim()) video.caption = caption.trim().slice(0, 1024);

  const result = await postWhatsAppMessage(phone, { type: "video", video });
  if (!result.ok) {
    result.manualUrl = buildManualWhatsAppUrl(phone, caption || "View property video");
  }
  return result;
}

export async function sendWhatsAppMessage(input: {
  phone: string;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
}): Promise<WhatsAppSendResult> {
  const { phone, messageType, text, mediaUrl } = input;

  if (messageType === "IMAGE" && mediaUrl) {
    return sendWhatsAppImage(phone, mediaUrl, text);
  }
  if (messageType === "VIDEO" && mediaUrl) {
    return sendWhatsAppVideo(phone, mediaUrl, text);
  }
  return sendWhatsAppText(phone, text);
}

export type TemplateComponent = {
  type: "body" | "header";
  parameters?: Array<{ type: "text"; text: string } | { type: "image"; image: { link: string } }>;
};

export async function sendWhatsAppTemplate(input: {
  phone: string;
  templateName: string;
  languageCode: string;
  bodyParameters?: Array<{ type: "text"; text: string }>;
}): Promise<WhatsAppSendResult> {
  if (!isWhatsAppApiConfigured()) {
    return {
      ok: false,
      error: "WhatsApp Cloud API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env"
    };
  }

  const template: Record<string, unknown> = {
    name: input.templateName,
    language: { code: input.languageCode }
  };

  if (input.bodyParameters?.length) {
    template.components = [
      {
        type: "body",
        parameters: input.bodyParameters
      }
    ];
  }

  return postWhatsAppMessage(input.phone, {
    type: "template",
    template
  });
}

/** List approved message templates (requires WHATSAPP_BUSINESS_ACCOUNT_ID). */
export async function listWhatsAppTemplates(): Promise<{
  ok: boolean;
  templates?: Array<{ name: string; language: string; status: string; category: string }>;
  error?: string;
}> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!token) {
    return { ok: false, error: "WHATSAPP_ACCESS_TOKEN not set" };
  }
  if (!wabaId) {
    return {
      ok: false,
      error: "Set WHATSAPP_BUSINESS_ACCOUNT_ID to list templates (Meta → WhatsApp → API setup)"
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates?limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data?.error?.message || "Failed to list templates" };
    }
    const templates = (data.data || []).map(
      (t: { name: string; language: string; status: string; category: string }) => ({
        name: t.name,
        language: t.language,
        status: t.status,
        category: t.category
      })
    );
    return { ok: true, templates };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error"
    };
  }
}
