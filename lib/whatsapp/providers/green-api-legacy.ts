import type { WhatsAppProvider } from "../whatsapp-provider.interface";
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
} from "../whatsapp.types";
import { isGreenApiConfigured, greenApiGetState, sendGreenApiMessage } from "./green-api";
import type { WhatsAppMessageKind } from "../../whatsapp-cloud";

/** Legacy Green API adapter for WHATSAPP_PROVIDER=green-api */
export class GreenApiLegacyProvider implements WhatsAppProvider {
  readonly id = "green-api";
  readonly label = "Green API";

  isConfigured() {
    return isGreenApiConfigured();
  }

  async createInstance(): Promise<WhatsAppInstanceResult> {
    return {
      instanceName: process.env.GREEN_API_INSTANCE_ID || "green",
      integration: "GREEN_API",
      status: "configured"
    };
  }

  async getConnectionState(): Promise<WhatsAppConnectionState> {
    const state = await greenApiGetState();
    return state.connected ? "CONNECTED" : "NOT_CONNECTED";
  }

  async getQrCode(): Promise<WhatsAppQrCodeResult> {
    return { code: "Use Green API dashboard for QR" };
  }

  async disconnectInstance(): Promise<void> {}
  async logoutInstance(): Promise<void> {}

  private async send(
    phone: string,
    messageType: WhatsAppMessageKind,
    text: string,
    mediaUrl?: string | null
  ): Promise<SendMessageResult> {
    const result = await sendGreenApiMessage({ phone, messageType, text, mediaUrl });
    return { ok: result.ok, messageId: result.messageId, error: result.error };
  }

  async sendText(input: SendTextInput): Promise<SendMessageResult> {
    return this.send(input.phone, "TEXT", input.text);
  }

  async sendImage(input: SendMediaInput): Promise<SendMessageResult> {
    return this.send(input.phone, "IMAGE", input.caption || "", input.mediaUrl);
  }

  async sendVideo(input: SendMediaInput): Promise<SendMessageResult> {
    return this.send(input.phone, "VIDEO", input.caption || "", input.mediaUrl);
  }

  async sendDocument(input: SendDocumentInput): Promise<SendMessageResult> {
    return this.send(input.phone, "IMAGE", input.caption || input.fileName, input.mediaUrl);
  }

  async configureWebhook(_input: ConfigureWebhookInput): Promise<void> {}

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent> {
    return { eventType: "GREEN_API", raw: payload };
  }
}
