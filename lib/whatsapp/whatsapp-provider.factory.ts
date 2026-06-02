import { EvolutionApiProvider } from "./evolution-api.provider";
import { MetaCloudProvider } from "./meta-cloud.provider";
import { WhatsAppDemoProvider } from "./whatsapp-demo.service";
import type { WhatsAppProvider } from "./whatsapp-provider.interface";
import { GreenApiLegacyProvider } from "./providers/green-api-legacy";

export type WhatsAppProviderId = "evolution" | "meta" | "green-api" | "demo";

export function isWhatsAppEnabled() {
  return process.env.WHATSAPP_ENABLED !== "false";
}

export function getWhatsAppProviderId(): WhatsAppProviderId {
  const forced = (process.env.WHATSAPP_PROVIDER || "evolution").trim().toLowerCase();
  if (forced === "meta") return "meta";
  if (forced === "green-api") return "green-api";
  if (forced === "evolution") return "evolution";
  return "evolution";
}

export function createWhatsAppProvider(id?: WhatsAppProviderId): WhatsAppProvider {
  const providerId = id || getWhatsAppProviderId();

  if (providerId === "meta") {
    const meta = new MetaCloudProvider();
    return meta.isConfigured() ? meta : new WhatsAppDemoProvider();
  }

  if (providerId === "green-api") {
    const green = new GreenApiLegacyProvider();
    return green.isConfigured() ? green : new WhatsAppDemoProvider();
  }

  const evolution = new EvolutionApiProvider();
  if (evolution.isConfigured() && isWhatsAppEnabled()) return evolution;

  const meta = new MetaCloudProvider();
  if (meta.isConfigured() && isWhatsAppEnabled()) return meta;

  return new WhatsAppDemoProvider();
}

export function isAnyWhatsAppProviderLive() {
  const provider = createWhatsAppProvider();
  return provider.id !== "demo" && provider.isConfigured();
}

export function getProviderLabel(id: string) {
  if (id === "evolution") return "Evolution API";
  if (id === "meta") return "Meta Cloud API";
  if (id === "green-api") return "Green API";
  return "Demo Mode";
}
