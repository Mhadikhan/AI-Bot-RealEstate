import { isWhatsAppLiveMode } from "./config";
import { getActiveProvider, getProviderHealth } from "./providers";
import { isGreenApiConfigured } from "./providers/green-api";
import { listWhatsAppTemplates } from "../whatsapp-cloud";

export type WhatsAppSetupStatus = {
  mode: "LIVE" | "DEMO";
  ready: boolean;
  provider: string;
  checklist: Array<{ id: string; label: string; done: boolean; hint?: string }>;
  defaultTemplate: { name: string; language: string };
  testNumberHint: string;
};

export function getWhatsAppSetupStatus(): WhatsAppSetupStatus {
  const hasGreen = isGreenApiConfigured();
  const hasToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim());
  const hasPhoneId = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  const hasVerify = Boolean(process.env.WHATSAPP_VERIFY_TOKEN?.trim());
  const hasAppUrl = Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()?.startsWith("https://"));
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "hello_world";
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";
  const provider = getActiveProvider();

  const checklist = [
    {
      id: "evolution",
      label: "Evolution API — EVOLUTION_API_URL + EVOLUTION_API_KEY + EVOLUTION_API_INSTANCE_NAME",
      done: Boolean(
        process.env.EVOLUTION_API_URL?.trim() &&
          process.env.EVOLUTION_API_KEY?.trim() &&
          process.env.EVOLUTION_API_INSTANCE_NAME?.trim()
      ),
      hint: "docker compose -f docker-compose.evolution.yml up -d → Admin → Settings → WhatsApp → scan QR"
    },
    {
      id: "evolution_qr",
      label: "Evolution WhatsApp linked (QR scanned)",
      done: false,
      hint: "Admin → Settings → WhatsApp → Generate QR Code → Linked Devices on your test phone"
    },
    {
      id: "green",
      label: "Green API — GREEN_API_INSTANCE_ID + GREEN_API_API_TOKEN (legacy alternative)",
      done: hasGreen,
      hint: "https://green-api.com → create instance → copy ID & token → scan QR"
    },
    {
      id: "token",
      label: "Meta — WHATSAPP_ACCESS_TOKEN (optional alternative)",
      done: hasToken,
      hint: "developers.facebook.com → app → WhatsApp → API setup"
    },
    {
      id: "phone_id",
      label: "Meta — WHATSAPP_PHONE_NUMBER_ID",
      done: hasPhoneId,
      hint: "Business phone number ID from Meta API setup"
    },
    {
      id: "template",
      label: `Meta template "${templateName}" (Meta only)`,
      done: templateName === "hello_world" || hasToken,
      hint: "Green API sends normal text without templates"
    },
    {
      id: "verify",
      label: "WHATSAPP_VERIFY_TOKEN for inbound webhooks",
      done: hasVerify
    },
    {
      id: "https",
      label: "HTTPS app URL for image/video (Meta media)",
      done: hasAppUrl,
      hint: "Green API can send media if file URL is public HTTPS"
    }
  ];

  const live = isWhatsAppLiveMode();
  const ready = live && (hasGreen || hasToken && hasPhoneId || Boolean(process.env.EVOLUTION_API_KEY?.trim()));

  return {
    mode: live ? "LIVE" : "DEMO",
    ready,
    provider,
    checklist,
    defaultTemplate: { name: templateName, language: templateLanguage },
    testNumberHint:
      provider === "evolution"
        ? "Evolution API sends from your linked WhatsApp after QR scan in Admin → Settings → WhatsApp."
        : provider === "green-api"
          ? "Green API sends from your linked WhatsApp. Scan QR once in the Green API dashboard."
          : "Meta sandbox: add test numbers in API setup."
  };
}

export async function fetchSetupTemplatesPreview() {
  if (getActiveProvider() !== "meta") return { templates: [], error: undefined };
  const result = await listWhatsAppTemplates();
  if (!result.ok) return { templates: [], error: result.error };
  return { templates: result.templates || [], error: undefined };
}

export async function fetchSetupHealth() {
  return getProviderHealth();
}
