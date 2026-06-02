import { createWhatsAppProvider, isAnyWhatsAppProviderLive } from "./whatsapp-provider.factory";
import type { SendMessageResult } from "./whatsapp.types";
import { normalizePhone } from "./whatsapp.types";
import type { WhatsAppMessageKind } from "../whatsapp-cloud";

export async function sendWhatsAppTextMessage(phone: string, text: string): Promise<SendMessageResult> {
  const provider = createWhatsAppProvider();
  if (provider.id === "demo") {
    return { ok: true, messageId: `sim_${Date.now()}`, simulated: true };
  }
  return provider.sendText({ phone: normalizePhone(phone), text });
}

export async function sendWhatsAppMediaMessage(input: {
  phone: string;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
  mimeType?: string;
  fileName?: string;
}): Promise<SendMessageResult> {
  const provider = createWhatsAppProvider();
  if (provider.id === "demo") {
    return { ok: true, messageId: `sim_${Date.now()}`, simulated: true };
  }

  const phone = normalizePhone(input.phone);
  const mime =
    input.mimeType ||
    (input.messageType === "VIDEO" ? "video/mp4" : input.messageType === "IMAGE" ? "image/jpeg" : "application/pdf");
  const fileName =
    input.fileName ||
    (input.messageType === "VIDEO" ? "video.mp4" : input.messageType === "IMAGE" ? "image.jpg" : "document.pdf");

  const payload = {
    phone,
    mediaUrl: input.mediaUrl || undefined,
    fileName,
    caption: input.text,
    mimeType: mime
  };

  if (input.messageType === "VIDEO") return provider.sendVideo(payload);
  if (input.messageType === "IMAGE") return provider.sendImage(payload);
  if (input.mediaUrl) return provider.sendDocument(payload);
  return provider.sendText({ phone, text: input.text });
}

export function isWhatsAppLiveMode() {
  return isAnyWhatsAppProviderLive();
}
