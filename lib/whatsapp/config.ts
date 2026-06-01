export type WhatsAppPlatformStatus = {
  configured: boolean;
  mode: "LIVE" | "DEMO";
  phoneNumberId: string | null;
  verifyTokenSet: boolean;
  webhookUrl: string;
};

export function isWhatsAppLiveMode() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

export function getCampaignMode(): "LIVE" | "DEMO" {
  return isWhatsAppLiveMode() ? "LIVE" : "DEMO";
}

export function getWhatsAppStatus(baseUrl?: string): WhatsAppPlatformStatus {
  const origin = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    configured: isWhatsAppLiveMode(),
    mode: getCampaignMode(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null,
    verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN?.trim()),
    webhookUrl: `${origin.replace(/\/$/, "")}/api/whatsapp/webhook`
  };
}
