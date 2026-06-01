import { prisma } from "../prisma";
import { toWhatsAppApiPhone } from "../whatsapp-cloud";
import { handleInboundWhatsAppMessage } from "./inbound-ai";

type WebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string };
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ title?: string; message?: string }>;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
};

const statusMap: Record<string, "SENT" | "DELIVERED" | "READ" | "FAILED"> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED"
};

export async function processWhatsAppWebhook(body: WebhookPayload) {
  const processed: string[] = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value) continue;

      for (const statusUpdate of value.statuses || []) {
        await handleStatusUpdate(statusUpdate);
        processed.push(`status:${statusUpdate.id}:${statusUpdate.status}`);
      }

      for (const message of value.messages || []) {
        if (message.type === "text" && message.text?.body) {
          await handleInboundWhatsAppMessage({
            fromPhone: message.from,
            text: message.text.body,
            waMessageId: message.id
          });
          processed.push(`inbound:${message.id}`);
        }
      }
    }
  }

  return processed;
}

async function handleStatusUpdate(statusUpdate: {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ title?: string; message?: string }>;
}) {
  const mapped = statusMap[statusUpdate.status];
  if (!mapped) return;

  const recipient = await prisma.broadcastRecipient.findFirst({
    where: { externalId: statusUpdate.id },
    include: { broadcast: true }
  });

  await prisma.whatsAppWebhookEvent.create({
    data: {
      broadcastId: recipient?.broadcastId,
      recipientId: recipient?.id,
      leadId: recipient?.leadId,
      eventType: statusUpdate.status,
      waMessageId: statusUpdate.id,
      payload: statusUpdate
    }
  });

  if (!recipient || recipient.broadcast.mode !== "LIVE") {
    return;
  }

  const eventTime = new Date(Number(statusUpdate.timestamp) * 1000);
  const data: Record<string, unknown> = { status: mapped };

  if (mapped === "SENT") data.sentAt = eventTime;
  if (mapped === "DELIVERED") data.deliveredAt = eventTime;
  if (mapped === "READ") data.readAt = eventTime;
  if (mapped === "FAILED") {
    data.error = statusUpdate.errors?.[0]?.message || "Delivery failed";
  }

  await prisma.broadcastRecipient.update({
    where: { id: recipient.id },
    data
  });

  const counts = await prisma.broadcastRecipient.groupBy({
    by: ["status"],
    where: { broadcastId: recipient.broadcastId },
    _count: true
  });

  const countBy = (status: string) => counts.find((c) => c.status === status)?._count || 0;

  await prisma.broadcast.update({
    where: { id: recipient.broadcastId },
    data: {
      sentCount: countBy("SUBMITTED") + countBy("SENT") + countBy("DELIVERED") + countBy("READ"),
      deliveredCount: countBy("DELIVERED") + countBy("READ"),
      readCount: countBy("READ"),
      failedCount: countBy("FAILED")
    }
  });

  if (mapped === "READ" && recipient.leadId) {
    const { stopEnrollmentOnReply } = await import("./follow-ups");
    await stopEnrollmentOnReply(recipient.leadId);
  }
}

export async function findLeadByPhone(phone: string) {
  const normalized = toWhatsAppApiPhone(phone);
  const leads = await prisma.lead.findMany({
    where: { phone: { not: null } },
    take: 200
  });

  return (
    leads.find((lead) => lead.phone && toWhatsAppApiPhone(lead.phone) === normalized) || null
  );
}
