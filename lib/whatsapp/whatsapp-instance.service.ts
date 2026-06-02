import { prisma } from "../prisma";
import { createWhatsAppProvider, getWhatsAppProviderId } from "./whatsapp-provider.factory";
import { checkEvolutionApiReachable } from "./evolution-health";

const DEFAULT_TENANT = "default";

export async function upsertWhatsAppInstanceRecord(input: {
  connectionStatus: string;
  connectedPhone?: string | null;
}) {
  const provider = getWhatsAppProviderId();
  const instanceName =
    process.env.EVOLUTION_API_INSTANCE_NAME?.trim() ||
    process.env.GREEN_API_INSTANCE_ID?.trim() ||
    "propertyconnect";

  return prisma.whatsAppInstance.upsert({
    where: { tenantId_instanceName: { tenantId: DEFAULT_TENANT, instanceName } },
    create: {
      tenantId: DEFAULT_TENANT,
      provider,
      instanceName,
      integration: process.env.EVOLUTION_API_INTEGRATION || "WHATSAPP-BAILEYS",
      connectionStatus: input.connectionStatus,
      connectedPhone: input.connectedPhone,
      lastCheckedAt: new Date()
    },
    update: {
      connectionStatus: input.connectionStatus,
      connectedPhone: input.connectedPhone,
      lastCheckedAt: new Date()
    }
  });
}

export async function getWhatsAppInstanceRecord() {
  const instanceName =
    process.env.EVOLUTION_API_INSTANCE_NAME?.trim() ||
    process.env.GREEN_API_INSTANCE_ID?.trim() ||
    "propertyconnect";

  return prisma.whatsAppInstance.findUnique({
    where: { tenantId_instanceName: { tenantId: DEFAULT_TENANT, instanceName } }
  });
}

export async function syncConnectionStatus() {
  const provider = createWhatsAppProvider();
  if (provider.id === "demo") {
    return {
      provider: provider.id,
      connectionStatus: "NOT_CONNECTED" as const,
      connectedPhone: null,
      demo: true
    };
  }

  const health = await checkEvolutionApiReachable();
  if (!health.ok) {
    return {
      provider: provider.id,
      connectionStatus: "NOT_CONNECTED" as const,
      connectedPhone: null,
      demo: false,
      evolutionReachable: false,
      evolutionError: health.error,
      evolutionHint: health.hint,
      evolutionUrl: health.url
    };
  }

  try {
    const state = await provider.getConnectionState();
    await upsertWhatsAppInstanceRecord({
      connectionStatus: state,
      connectedPhone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null
    });

    return {
      provider: provider.id,
      connectionStatus: state,
      connectedPhone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null,
      demo: false,
      evolutionReachable: true,
      evolutionUrl: health.url
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection check failed";
    return {
      provider: provider.id,
      connectionStatus: "ERROR" as const,
      connectedPhone: null,
      demo: false,
      evolutionReachable: true,
      evolutionError: message,
      evolutionUrl: health.url
    };
  }
}

export async function createEvolutionInstance() {
  const provider = createWhatsAppProvider();
  const result = await provider.createInstance();
  await upsertWhatsAppInstanceRecord({ connectionStatus: "CONNECTING" });
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await configureEvolutionWebhook(baseUrl);
  } catch (error) {
    console.warn("[whatsapp] webhook configure skipped:", error instanceof Error ? error.message : error);
  }
  return result;
}

export async function fetchEvolutionQrCode() {
  const provider = createWhatsAppProvider();
  return provider.getQrCode();
}

export async function disconnectEvolutionInstance() {
  const provider = createWhatsAppProvider();
  await provider.disconnectInstance();
  await upsertWhatsAppInstanceRecord({ connectionStatus: "DISCONNECTED" });
}

export async function logoutEvolutionInstance() {
  const provider = createWhatsAppProvider();
  await provider.logoutInstance();
  await upsertWhatsAppInstanceRecord({ connectionStatus: "DISCONNECTED" });
}

export async function configureEvolutionWebhook(baseUrl: string) {
  const provider = createWhatsAppProvider();
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET?.trim();
  const appOrigin = baseUrl.replace(/\/$/, "");
  const defaultWebhook =
    process.env.EVOLUTION_WEBHOOK_URL?.trim() ||
    (appOrigin.includes("localhost") || appOrigin.includes("127.0.0.1")
      ? "http://host.docker.internal:3000/api/webhooks/evolution"
      : `${appOrigin}/api/webhooks/evolution`);

  const webhookUrl = secret
    ? `${defaultWebhook}${defaultWebhook.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}`
    : defaultWebhook;
  await provider.configureWebhook({
    url: webhookUrl,
    events: [
      "QRCODE_UPDATED",
      "CONNECTION_UPDATE",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "SEND_MESSAGE"
    ],
    headers: secret ? { "x-webhook-secret": secret } : undefined
  });

  return webhookUrl;
}
