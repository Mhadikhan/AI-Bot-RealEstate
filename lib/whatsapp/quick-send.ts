import { prisma } from "../prisma";
import { parsePhoneList } from "../phone-list";
import { personalizeBroadcastMessage } from "../whatsapp-cloud";
import { getCampaignMode } from "./config";
import { executeCampaignSend } from "./campaigns";
import { buildManualSendLinks } from "./delivery";
import type { DeliveryMethod } from "./delivery";
import { getActiveProvider } from "./providers";
import { getGreenApiAllowedPhones, phoneAllowedOnGreenPlan } from "./providers/green-api-errors";
import type { WhatsAppMessageKind } from "../whatsapp-cloud";

export type QuickSendInput = {
  title: string;
  messageType: WhatsAppMessageKind;
  message: string;
  mediaUrl?: string | null;
  phoneListRaw: string;
  sendNow?: boolean;
  deliveryMethod?: DeliveryMethod;
  templateName?: string;
  templateLanguage?: string;
};

export async function createQuickSendCampaign(input: QuickSendInput) {
  const phones = parsePhoneList(input.phoneListRaw);
  if (phones.length === 0) {
    throw new Error("No valid phone numbers found. Paste one number per line (e.g. 03001234567 or +923001234567).");
  }

  if (getActiveProvider() === "green-api") {
    const allowed = getGreenApiAllowedPhones();
    const blocked = phones.filter((p) => !phoneAllowedOnGreenPlan(p, allowed));
    if (blocked.length > 0) {
      throw new Error(
        `Green API plan only allows: ${allowed.map((p) => `+${p}`).join(", ")}. Remove: ${blocked.map((p) => `+${p}`).join(", ")}. Or upgrade at https://console.green-api.com`
      );
    }
  }

  const messageType = input.messageType;
  const caption = input.message.trim();

  if (messageType === "TEXT" && !caption) {
    throw new Error("Message text is required.");
  }

  if ((messageType === "IMAGE" || messageType === "VIDEO") && !input.mediaUrl?.trim()) {
    throw new Error(`Upload a ${messageType === "IMAGE" ? "image" : "video"} or provide a public HTTPS link.`);
  }

  const mode = getCampaignMode();
  const sendNow = Boolean(input.sendNow);
  const providerEnv = process.env.WHATSAPP_PROVIDER?.trim();
  const deliveryMethod =
    input.deliveryMethod ||
    (providerEnv === "green-api" || providerEnv === "evolution" ? "session" : "template");
  const templateName =
    input.templateName?.trim() || process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "hello_world";
  const templateLanguage =
    input.templateLanguage?.trim() || process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";

  const campaign = await prisma.broadcast.create({
    data: {
      title: input.title.trim() || `Quick send — ${phones.length} contacts`,
      message: caption || (messageType === "IMAGE" ? "Property image" : messageType === "VIDEO" ? "Property video" : ""),
      messageType,
      mediaUrl: input.mediaUrl?.trim() || null,
      category: "CUSTOM",
      audience: "PHONE_LIST",
      audienceFilters: {
        source: "phone_list",
        count: phones.length,
        deliveryMethod,
        templateName,
        templateLanguage
      } as object,
      mode,
      recipientCount: phones.length,
      status: sendNow ? "SENDING" : "DRAFT",
      recipients: {
        create: phones.map((phone) => ({
          phone,
          name: null,
          leadId: null,
          personalizedMessage:
            messageType === "TEXT"
              ? personalizeBroadcastMessage(caption, null)
              : caption
                ? personalizeBroadcastMessage(caption, null)
                : null,
          status: "QUEUED"
        }))
      }
    },
    include: { recipients: true }
  });

  const sampleMessage = personalizeBroadcastMessage(caption || "Hello", null);
  const manualLinks = mode === "DEMO" ? buildManualSendLinks(phones, sampleMessage) : [];

  if (sendNow) {
    const result = await executeCampaignSend(campaign.id);
    return { ...result, manualLinks, mode };
  }

  return { campaign, summary: null, manualLinks, mode };
}

export function previewPhoneList(raw: string) {
  return parsePhoneList(raw);
}
