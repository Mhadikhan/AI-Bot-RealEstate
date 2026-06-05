import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import {
  EvolutionAuthenticationError,
  EvolutionConfigurationError,
  EvolutionConnectionError,
  EvolutionMediaSendError,
  EvolutionRateLimitError
} from "./whatsapp.errors";
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
import { normalizePhone, toWhatsAppJid } from "./whatsapp.types";
import { getEvolutionApiUrl } from "./evolution-health";

/** Evolution API v2 route map — update here when upgrading Evolution API versions. */
const ROUTES = {
  createInstance: () => "/instance/create",
  connect: (instance: string) => `/instance/connect/${encodeURIComponent(instance)}`,
  connectionState: (instance: string) => `/instance/connectionState/${encodeURIComponent(instance)}`,
  logout: (instance: string) => `/instance/logout/${encodeURIComponent(instance)}`,
  delete: (instance: string) => `/instance/delete/${encodeURIComponent(instance)}`,
  sendText: (instance: string) => `/message/sendText/${encodeURIComponent(instance)}`,
  sendMedia: (instance: string) => `/message/sendMedia/${encodeURIComponent(instance)}`,
  setWebhook: (instance: string) => `/webhook/set/${encodeURIComponent(instance)}`
} as const;

const connectionStateSchema = z.object({
  instance: z.object({ state: z.string().optional() }).optional(),
  state: z.string().optional()
});

const sendResponseSchema = z.object({
  key: z.object({ id: z.string().optional() }).optional(),
  messageId: z.string().optional(),
  id: z.string().optional()
});

export class EvolutionApiProvider implements WhatsAppProvider {
  readonly id = "evolution";
  readonly label = "Evolution API";

  private get baseUrl() {
    return getEvolutionApiUrl();
  }

  private get apiKey() {
    return process.env.EVOLUTION_API_KEY?.trim() || "";
  }

  private get instanceName() {
    return process.env.EVOLUTION_API_INSTANCE_NAME?.trim() || "propertyconnect";
  }

  private get integration() {
    return process.env.EVOLUTION_API_INTEGRATION?.trim() || "WHATSAPP-BAILEYS";
  }

  isConfigured() {
    return Boolean(this.baseUrl && this.apiKey && this.instanceName);
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new EvolutionConfigurationError(
        "Evolution API is not configured. Set EVOLUTION_API_URL, EVOLUTION_API_KEY, and EVOLUTION_API_INSTANCE_NAME."
      );
    }
  }

  private async request<T>(routePath: string, options: RequestInit = {}): Promise<T> {
    this.ensureConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${this.baseUrl}${routePath}`, {
        ...options,
        signal: controller.signal,
        headers: {
          apikey: this.apiKey,
          ...(options.body && !(options.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
          ...options.headers
        }
      });

      const text = await response.text();
      let data: unknown = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (response.status === 401 || response.status === 403) {
        throw new EvolutionAuthenticationError("Evolution API authentication failed. Check EVOLUTION_API_KEY.");
      }
      if (response.status === 429) {
        throw new EvolutionRateLimitError("Evolution API rate limit exceeded. Slow down sending.");
      }
      if (!response.ok) {
        const msg =
          typeof data === "object" && data && "message" in data
            ? String((data as { message: unknown }).message)
            : `Evolution API error (${response.status})`;
        throw new EvolutionConnectionError(msg);
      }

      return data as T;
    } catch (error) {
      if (error instanceof EvolutionConfigurationError) throw error;
      if (error instanceof EvolutionAuthenticationError) throw error;
      if (error instanceof EvolutionRateLimitError) throw error;
      if (error instanceof EvolutionConnectionError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new EvolutionConnectionError("Evolution API request timed out.");
      }
      const msg = error instanceof Error ? error.message : "Evolution API request failed";
      if (/fetch failed|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
        throw new EvolutionConnectionError(
          "Evolution API is not running. Open Docker Desktop, then run: docker compose -f docker-compose.evolution.yml up -d"
        );
      }
      throw new EvolutionConnectionError(msg);
    } finally {
      clearTimeout(timeout);
    }
  }

  async createInstance(): Promise<WhatsAppInstanceResult> {
    const data = await this.request<Record<string, unknown>>(ROUTES.createInstance(), {
      method: "POST",
      body: JSON.stringify({
        instanceName: this.instanceName,
        qrcode: true,
        integration: this.integration,
        rejectCall: process.env.EVOLUTION_REJECT_CALLS === "true",
        groupsIgnore: process.env.EVOLUTION_IGNORE_GROUPS !== "false",
        alwaysOnline: process.env.EVOLUTION_ALWAYS_ONLINE === "true",
        readMessages: process.env.EVOLUTION_READ_MESSAGES === "true",
        readStatus: process.env.EVOLUTION_READ_STATUS === "true"
      })
    });

    return {
      instanceName: this.instanceName,
      integration: this.integration,
      status: String(data.status || "created")
    };
  }

  async getConnectionState(): Promise<WhatsAppConnectionState> {
    const data = await this.request<Record<string, unknown>>(ROUTES.connectionState(this.instanceName), {
      method: "GET"
    });
    const parsed = connectionStateSchema.safeParse(data);
    const raw = parsed.success
      ? parsed.data.instance?.state || parsed.data.state || ""
      : String((data as { state?: string }).state || "");

    const state = raw.toLowerCase();
    if (state === "open" || state === "connected") return "CONNECTED";
    if (state === "connecting") return "CONNECTING";
    if (state === "close" || state === "closed") return "DISCONNECTED";
    return "NOT_CONNECTED";
  }

  async getQrCode(): Promise<WhatsAppQrCodeResult> {
    const data = await this.request<Record<string, unknown>>(ROUTES.connect(this.instanceName), {
      method: "GET"
    });
    const base64 =
      (data.base64 as string) ||
      (data.qrcode as { base64?: string })?.base64 ||
      (typeof data.code === "string" && data.code.startsWith("data:")
        ? data.code
        : undefined);

    return {
      base64,
      pairingCode: data.pairingCode as string | undefined,
      code: data.code as string | undefined,
      count: typeof data.count === "number" ? data.count : undefined
    };
  }

  async disconnectInstance(): Promise<void> {
    await this.request(ROUTES.delete(this.instanceName), { method: "DELETE" });
  }

  async logoutInstance(): Promise<void> {
    await this.request(ROUTES.logout(this.instanceName), { method: "DELETE" });
  }

  private parseSendResult(data: unknown): SendMessageResult {
    const parsed = sendResponseSchema.safeParse(data);
    const messageId = parsed.success
      ? parsed.data.key?.id || parsed.data.messageId || parsed.data.id
      : undefined;
    return { ok: true, messageId };
  }

  async sendText(input: SendTextInput): Promise<SendMessageResult> {
    const data = await this.request(ROUTES.sendText(this.instanceName), {
      method: "POST",
      body: JSON.stringify({
        number: normalizePhone(input.phone),
        text: input.text
      })
    });
    return this.parseSendResult(data);
  }

  private mediaTypeFromMime(mimeType: string): "image" | "video" | "document" {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("image/")) return "image";
    return "document";
  }

  private async resolveMediaPayload(input: SendMediaInput) {
    if (input.base64) return { media: input.base64 };

    const url = input.mediaUrl?.trim();
    if (!url) throw new EvolutionMediaSendError("Media URL or base64 is required.");

    // Local path — read from disk as base64
    if (url.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      const buffer = await readFile(filePath);
      return { media: buffer.toString("base64") };
    }

    // localhost / 127.0.0.1 URLs can't be reached from inside Docker.
    // Resolve to disk path (public/...) and send as base64.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
      try {
        const pathname = new URL(url).pathname;
        const filePath = path.join(process.cwd(), "public", pathname.replace(/^\//, ""));
        const buffer = await readFile(filePath);
        return { media: buffer.toString("base64") };
      } catch {
        // File not found on disk — try host.docker.internal so Docker can reach the dev server
        const dockerUrl = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)/, "http://host.docker.internal");
        return { media: dockerUrl };
      }
    }

    if (url.startsWith("http")) return { media: url };

    throw new EvolutionMediaSendError("Media URL or base64 is required.");
  }

  async sendImage(input: SendMediaInput): Promise<SendMessageResult> {
    return this.sendMediaInternal(input, "image");
  }

  async sendVideo(input: SendMediaInput): Promise<SendMessageResult> {
    return this.sendMediaInternal(input, "video");
  }

  async sendDocument(input: SendDocumentInput): Promise<SendMessageResult> {
    return this.sendMediaInternal(input, "document");
  }

  private async sendMediaInternal(
    input: SendMediaInput,
    mediatype: "image" | "video" | "document"
  ): Promise<SendMessageResult> {
    const mediaPayload = await this.resolveMediaPayload(input);
    const data = await this.request(ROUTES.sendMedia(this.instanceName), {
      method: "POST",
      body: JSON.stringify({
        number: normalizePhone(input.phone),
        mediatype: mediatype || this.mediaTypeFromMime(input.mimeType),
        mimetype: input.mimeType,
        caption: input.caption || "",
        fileName: input.fileName,
        ...mediaPayload
      })
    });
    return this.parseSendResult(data);
  }

  async configureWebhook(input: ConfigureWebhookInput): Promise<void> {
    await this.request(ROUTES.setWebhook(this.instanceName), {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          enabled: input.enabled ?? true,
          url: input.url,
          headers: input.headers || {},
          byEvents: false,
          base64: false,
          events: input.events
        }
      })
    });
  }

  async parseWebhook(payload: unknown): Promise<ParsedWebhookEvent> {
    const body = payload as Record<string, unknown>;
    const eventType = String(body.event || body.type || "UNKNOWN").toUpperCase();
    const data = (body.data || body) as Record<string, unknown>;

    let phone: string | undefined;
    let text: string | undefined;
    let messageId: string | undefined;

    const key = data.key as { remoteJid?: string; id?: string } | undefined;
    if (key?.remoteJid) phone = key.remoteJid.replace(/@.*/, "");
    const msg = data.message as Record<string, unknown> | undefined;
    if (msg?.conversation) text = String(msg.conversation);
    if (msg?.extendedTextMessage) {
      text = String((msg.extendedTextMessage as { text?: string }).text || text);
    }
    messageId = key?.id;

    const connectionState =
      typeof data.state === "string"
        ? data.state
        : typeof (body.instance as { state?: string })?.state === "string"
          ? (body.instance as { state: string }).state
          : undefined;

    return {
      eventType,
      instanceName: String(body.instance || this.instanceName),
      phone,
      text,
      messageId,
      connectionState,
      raw: payload
    };
  }
}
