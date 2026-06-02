import {
  deliverWhatsAppToRecipient,
  type CampaignDeliveryOptions
} from "./delivery";
import {
  isWhatsAppApiConfigured,
  sendWhatsAppImage,
  sendWhatsAppText,
  sendWhatsAppVideo
} from "../whatsapp-cloud";
import type { WhatsAppProvider } from "./whatsapp-provider.interface";
import type {
  ConfigureWebhookInput,
  ParsedWebhookEvent,
  SendDocumentInput,
  SendMediaInput,
  SendMessageResult,
  SendTextInput,
  WhatsAppConnectionState,
  WhatsAppInstanceResult,
  WhatsAppQrCodeResult
} from "./whatsapp.types";
import { normalizePhone } from "./whatsapp.types";

export class MetaCloudProvider implements WhatsAppProvider {
  readonly id = "meta";
  readonly label = "Meta Cloud API";

  isConfigured() {
    return isWhatsAppApiConfigured();
  }

  async createInstance(): Promise<WhatsAppInstanceResult> {
    return {
      instanceName: process.env.WHATSAPP_PHONE_NUMBER_ID || "meta",
      integration: "META_CLOUD",
      status: "CONFIGURED"
    };
  }

  async getConnectionState(): Promise<WhatsAppConnectionState> {
    return this.isConfigured() ? "CONNECTED" : "NOT_CONNECTED";
  }

  async getQrCode(): Promise<WhatsAppQrCodeResult> {
    return { code: "META_USE_OFFICIAL_BUSINESS_SETUP" };
  }

  async disconnectInstance(): Promise<void> {}
  async logoutInstance(): Promise<void> {}

  async sendText(input: SendTextInput): Promise<SendMessageResult> {
    const delivery: CampaignDeliveryOptions = {
      deliveryMethod: "session",
      templateName: process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "hello_world",
      templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US"
    };
    const result = await deliverWhatsAppToRecipient({
      phone: normalizePhone(input.phone),
      name: null,
      messageType: "TEXT",
      text: input.text,
      mediaUrl: null,
      delivery
    });
    return { ok: result.ok, messageId: result.messageId, error: result.error };
  }

  async sendImage(input: SendMediaInput): Promise<SendMessageResult> {
    const result = await sendWhatsAppImage(
      normalizePhone(input.phone),
      input.mediaUrl || "",
      input.caption
    );
    return { ok: result.ok, messageId: result.messageId, error: result.error };
  }

  async sendVideo(input: SendMediaInput): Promise<SendMessageResult> {
    const result = await sendWhatsAppVideo(
      normalizePhone(input.phone),
      input.mediaUrl || "",
      input.caption
    );
    return { ok: result.ok, messageId: result.messageId, error: result.error };
  }

  async sendDocument(input: SendDocumentInput): Promise<SendMessageResult> {
    return this.sendText({
      phone: input.phone,
      text: input.caption || `Document: ${input.fileName}`
    });
  }

  async configureWebhook(_input: ConfigureWebhookInput): Promise<void> {}

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent> {
    return { eventType: "META_WEBHOOK", raw: payload };
  }
}
