export type WhatsAppConnectionState = "NOT_CONNECTED" | "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

export type WhatsAppInstanceResult = {
  instanceName: string;
  integration: string;
  status?: string;
};

export type WhatsAppQrCodeResult = {
  base64?: string;
  pairingCode?: string;
  code?: string;
  count?: number;
};

export type SendMessageResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
};

export type SendTextInput = {
  phone: string;
  text: string;
};

export type SendMediaInput = {
  phone: string;
  mediaUrl?: string;
  base64?: string;
  fileName: string;
  caption?: string;
  mimeType: string;
};

export type SendDocumentInput = SendMediaInput;

export type ConfigureWebhookInput = {
  url: string;
  events: string[];
  enabled?: boolean;
  headers?: Record<string, string>;
};

export type ParsedWebhookEvent = {
  eventType: string;
  instanceName?: string;
  phone?: string;
  text?: string;
  messageId?: string;
  connectionState?: string;
  status?: string;
  raw: unknown;
};

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) throw new Error("Invalid phone number");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export function toWhatsAppJid(phone: string): string {
  return `${normalizePhone(phone)}@s.whatsapp.net`;
}
