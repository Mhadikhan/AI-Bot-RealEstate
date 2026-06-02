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
import type { WhatsAppProvider } from "./whatsapp-provider.interface";

export class WhatsAppDemoProvider implements WhatsAppProvider {
  readonly id = "demo";
  readonly label = "Demo Mode";

  isConfigured() {
    return false;
  }

  async createInstance(): Promise<WhatsAppInstanceResult> {
    return {
      instanceName: process.env.EVOLUTION_API_INSTANCE_NAME || "propertyconnect",
      integration: "DEMO",
      status: "SIMULATED"
    };
  }

  async getConnectionState(): Promise<WhatsAppConnectionState> {
    return "NOT_CONNECTED";
  }

  async getQrCode(): Promise<WhatsAppQrCodeResult> {
    return { code: "DEMO_QR_NOT_AVAILABLE" };
  }

  async disconnectInstance(): Promise<void> {}
  async logoutInstance(): Promise<void> {}

  private simulateSend(): SendMessageResult {
    return {
      ok: true,
      messageId: `sim_${Date.now()}`,
      simulated: true
    };
  }

  async sendText(_input: SendTextInput): Promise<SendMessageResult> {
    return this.simulateSend();
  }

  async sendImage(_input: SendMediaInput): Promise<SendMessageResult> {
    return this.simulateSend();
  }

  async sendVideo(_input: SendMediaInput): Promise<SendMessageResult> {
    return this.simulateSend();
  }

  async sendDocument(_input: SendDocumentInput): Promise<SendMessageResult> {
    return this.simulateSend();
  }

  async configureWebhook(_input: ConfigureWebhookInput): Promise<void> {}

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent> {
    return { eventType: "DEMO", raw: payload };
  }
}
