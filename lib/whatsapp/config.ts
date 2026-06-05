import {
  createWhatsAppProvider,
  getProviderLabel,
  getWhatsAppProviderId,
  isAnyWhatsAppProviderLive,
  isWhatsAppEnabled
} from "./whatsapp-provider.factory";

export type WhatsAppPlatformStatus = {
  configured: boolean;
  mode: "LIVE" | "DEMO";
  provider: string;
  providerLabel: string;
  providersAvailable: string[];
  phoneNumberId: string | null;
  verifyTokenSet: boolean;
  webhookUrl: string;
  evolutionWebhookUrl: string;
  demo: boolean;
  greenApiInstanceId: string | null;
  greenApiTokenSet: boolean;
};

export function isWhatsAppLiveMode() {
  return isWhatsAppEnabled() && isAnyWhatsAppProviderLive();
}

export function getCampaignMode(): "LIVE" | "DEMO" {
  return isWhatsAppLiveMode() ? "LIVE" : "DEMO";
}

export function getWhatsAppStatus(baseUrl?: string): WhatsAppPlatformStatus {
  const origin = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const providerId = getWhatsAppProviderId();
  const provider = createWhatsAppProvider();
  const configured = provider.id !== "demo" && provider.isConfigured();

  return {
    configured,
    mode: configured ? "LIVE" : "DEMO",
    provider: providerId,
    providerLabel: getProviderLabel(provider.id),
    providersAvailable: [getProviderLabel(providerId)],
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null,
    verifyTokenSet: Boolean(
      process.env.WHATSAPP_VERIFY_TOKEN?.trim() || process.env.EVOLUTION_WEBHOOK_SECRET?.trim()
    ),
    webhookUrl: `${origin.replace(/\/$/, "")}/api/whatsapp/webhook`,
    evolutionWebhookUrl:
      process.env.EVOLUTION_WEBHOOK_URL?.trim() ||
      `${origin.replace(/\/$/, "")}/api/webhooks/evolution`,
    demo: provider.id === "demo",
    greenApiInstanceId: process.env.GREEN_API_INSTANCE_ID?.trim() || null,
    greenApiTokenSet: Boolean(process.env.GREEN_API_API_TOKEN?.trim())
  };
}
