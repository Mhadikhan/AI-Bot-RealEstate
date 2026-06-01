import { prisma } from "../prisma";
import { processChatMessage } from "../chat-engine";
import { sendWhatsAppText } from "../whatsapp-cloud";
import { findLeadByPhone } from "./webhooks";
import { isWhatsAppLiveMode } from "./config";

export async function handleInboundWhatsAppMessage(input: {
  fromPhone: string;
  text: string;
  waMessageId: string;
}) {
  const existing = await prisma.whatsAppInboundMessage.findUnique({
    where: { waMessageId: input.waMessageId }
  });
  if (existing) return existing;

  const lead = await findLeadByPhone(input.fromPhone);

  const inbound = await prisma.whatsAppInboundMessage.create({
    data: {
      fromPhone: input.fromPhone,
      text: input.text,
      waMessageId: input.waMessageId,
      leadId: lead?.id,
      handledBy: "PENDING"
    }
  });

  if (lead) {
    await prisma.broadcastRecipient.updateMany({
      where: { leadId: lead.id, repliedAt: null },
      data: { repliedAt: new Date() }
    });

    const linked = await prisma.broadcastRecipient.findMany({
      where: { leadId: lead.id },
      select: { broadcastId: true },
      distinct: ["broadcastId"]
    });
    for (const row of linked) {
      await prisma.broadcast.update({
        where: { id: row.broadcastId },
        data: { replyCount: { increment: 1 } }
      });
    }

    const { stopEnrollmentOnReply } = await import("./follow-ups");
    await stopEnrollmentOnReply(lead.id);
  }

  const lower = input.text.toLowerCase();
  const wantsAgent =
    /(agent|human|consultant|call me|speak with|representative)/i.test(lower) ||
    /(band karo|agent se|insan se)/i.test(lower);

  if (wantsAgent) {
    await prisma.whatsAppInboundMessage.update({
      where: { id: inbound.id },
      data: { handledBy: "AGENT", requiresAgent: true }
    });

    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { requiresHumanFollowUp: true, status: "FOLLOW_UP_REQUIRED" }
      });
    }

    if (isWhatsAppLiveMode() && lead?.phone) {
      await sendWhatsAppText(
        lead.phone,
        "Thank you. A property consultant from PropertyConnect AI will contact you shortly on WhatsApp."
      );
    }

    return inbound;
  }

  const aiResult = await processChatMessage(input.text, []);

  await prisma.whatsAppInboundMessage.update({
    where: { id: inbound.id },
    data: {
      handledBy: "AI",
      aiReply: aiResult.message,
      requiresAgent: aiResult.intent === "CALLBACK" || Boolean(aiResult.leadHint)
    }
  });

  if (lead && aiResult.leadHint?.phone) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        phone: aiResult.leadHint.phone,
        name: aiResult.leadHint.name || lead.name,
        requiresHumanFollowUp: true
      }
    });
  }

  if (isWhatsAppLiveMode()) {
    await sendWhatsAppText(input.fromPhone, aiResult.message);
  }

  return inbound;
}

export async function listInboundMessages(limit = 50) {
  return prisma.whatsAppInboundMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lead: { select: { id: true, name: true, phone: true, temperature: true, type: true } }
    }
  });
}

export async function assignInboundToAgent(messageId: string) {
  const msg = await prisma.whatsAppInboundMessage.update({
    where: { id: messageId },
    data: { handledBy: "AGENT", requiresAgent: true, agentNotifiedAt: new Date() },
    include: { lead: true }
  });

  if (msg.leadId) {
    await prisma.lead.update({
      where: { id: msg.leadId },
      data: { requiresHumanFollowUp: true, status: "FOLLOW_UP_REQUIRED" }
    });
  }

  return msg;
}
