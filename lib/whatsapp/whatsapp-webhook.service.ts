import { createHash } from "crypto";
import { prisma } from "../prisma";
import { handleInboundWhatsAppMessage } from "./inbound-ai";
import { EvolutionApiProvider } from "./evolution-api.provider";
import { upsertWhatsAppInstanceRecord } from "./whatsapp-instance.service";
import { normalizePhone } from "./whatsapp.types";

const DEFAULT_TENANT = "default";

const UNSUBSCRIBE_PATTERN =
  /^(stop|unsubscribe|remove me|opt out|no more messages|band karo|unsub)$/i;

function webhookIdempotencyKey(payload: unknown) {
  const raw = JSON.stringify(payload);
  return createHash("sha256").update(raw).digest("hex");
}

export function validateEvolutionWebhookSecret(request: Request) {
  const expected = process.env.EVOLUTION_WEBHOOK_SECRET?.trim();
  if (!expected) return true;
  const header = request.headers.get("x-webhook-secret");
  const url = new URL(request.url);
  const query = url.searchParams.get("secret");
  return header === expected || query === expected;
}

export async function processEvolutionWebhook(payload: unknown) {
  const parsed = await new EvolutionApiProvider().parseWebhook(payload);
  const idem = webhookIdempotencyKey(payload);

  const existing = await prisma.whatsAppWebhookEvent.findFirst({
    where: { idempotencyKey: idem }
  });
  if (existing) return { duplicate: true };

  await prisma.whatsAppWebhookEvent.create({
    data: {
      idempotencyKey: idem,
      eventType: parsed.eventType,
      waMessageId: parsed.messageId,
      payload: payload as object
    }
  });

  if (parsed.eventType.includes("CONNECTION")) {
    const status = (parsed.connectionState || "unknown").toUpperCase();
    await upsertWhatsAppInstanceRecord({
      connectionStatus: status === "OPEN" ? "CONNECTED" : status,
      connectedPhone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null
    });
    return { handled: "connection" };
  }

  if (!parsed.phone || !parsed.text) {
    return { handled: "ignored" };
  }

  const phone = normalizePhone(parsed.phone);
  const text = parsed.text.trim();
  if (!text) return { handled: "empty" };

  if (UNSUBSCRIBE_PATTERN.test(text)) {
    const lead = await prisma.lead.findFirst({
      where: { phone: { contains: phone.slice(-10) } }
    });
    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          whatsappOptIn: false,
          whatsappUnsubscribed: true,
          whatsappUnsubscribedAt: new Date(),
          whatsappUnsubscribeReason: "keyword"
        }
      });
    }
    const conv = await ensureWaConversation(phone);
    await storeWaMessage({
      conversationId: conv.id,
      direction: "INBOUND",
      type: "TEXT",
      status: "DELIVERED",
      text,
      externalMessageId: parsed.messageId
    });
    const { sendWhatsAppTextMessage } = await import("./whatsapp-message.service");
    await sendWhatsAppTextMessage(
      phone,
      "You have been unsubscribed from property updates. You can message us again anytime if you need assistance."
    );
    return { handled: "unsubscribe" };
  }

  const conv = await ensureWaConversation(phone);
  await storeWaMessage({
    conversationId: conv.id,
    direction: "INBOUND",
    type: "TEXT",
    status: "DELIVERED",
    text,
    externalMessageId: parsed.messageId
  });

  await handleInboundWhatsAppMessage({
    fromPhone: phone,
    text,
    waMessageId: parsed.messageId || idem
  });

  return { handled: "message" };
}

async function ensureWaConversation(phone: string) {
  const existing = await prisma.whatsAppConversation.findFirst({
    where: { tenantId: DEFAULT_TENANT, phone }
  });
  if (existing) {
    await prisma.whatsAppConversation.update({
      where: { id: existing.id },
      data: { lastMessageAt: new Date(), status: "OPEN" }
    });
    return existing;
  }
  const lead = await prisma.lead.findFirst({
    where: { OR: [{ phone }, { whatsappNumber: phone }] }
  });
  return prisma.whatsAppConversation.create({
    data: {
      tenantId: DEFAULT_TENANT,
      phone,
      leadId: lead?.id,
      status: "OPEN",
      lastMessageAt: new Date()
    }
  });
}

async function storeWaMessage(input: {
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  type: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "SYSTEM";
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "SIMULATED" | "FAILED";
  text?: string;
  mediaUrl?: string;
  externalMessageId?: string;
}) {
  return prisma.whatsAppMessage.create({
    data: {
      conversationId: input.conversationId,
      direction: input.direction,
      type: input.type,
      status: input.status,
      text: input.text,
      mediaUrl: input.mediaUrl,
      externalMessageId: input.externalMessageId
    }
  });
}

export { storeWaMessage };
