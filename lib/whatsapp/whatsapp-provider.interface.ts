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

export interface WhatsAppProvider {
  readonly id: string;
  readonly label: string;
  isConfigured(): boolean;

  createInstance(): Promise<WhatsAppInstanceResult>;
  getConnectionState(): Promise<WhatsAppConnectionState>;
  getQrCode(): Promise<WhatsAppQrCodeResult>;
  disconnectInstance(): Promise<void>;
  logoutInstance(): Promise<void>;

  sendText(input: SendTextInput): Promise<SendMessageResult>;
  sendImage(input: SendMediaInput): Promise<SendMessageResult>;
  sendVideo(input: SendMediaInput): Promise<SendMessageResult>;
  sendDocument(input: SendDocumentInput): Promise<SendMessageResult>;

  configureWebhook(input: ConfigureWebhookInput): Promise<void>;
  parseWebhook(payload: unknown): Promise<ParsedWebhookEvent>;
}
