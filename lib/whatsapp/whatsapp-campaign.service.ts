import { prisma } from "../prisma";
import { processSendQueue } from "./whatsapp-queue.service";
import type { WhatsAppMessageKind } from "../whatsapp-cloud";
import { getCampaignMode } from "./config";

export async function getOptedInAudience(filters?: { area?: string; temperature?: string }) {
  const leads = await prisma.lead.findMany({
    where: {
      whatsappOptIn: true,
      whatsappUnsubscribed: false,
      phone: { not: null },
      ...(filters?.area ? { preferredArea: { contains: filters.area, mode: "insensitive" } } : {}),
      ...(filters?.temperature ? { temperature: filters.temperature as "HOT" | "WARM" | "COLD" } : {})
    },
    select: { id: true, phone: true, name: true }
  });

  return leads.filter((l) => l.phone && l.phone.trim().length >= 10);
}

export async function launchBroadcastCampaign(input: {
  broadcastId: string;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
}) {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: input.broadcastId },
    include: { recipients: true }
  });
  if (!broadcast) throw new Error("Broadcast not found");

  const mode = getCampaignMode();
  if (mode === "DEMO") {
    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: {
        status: "SENT",
        mode: "DEMO",
        sentCount: broadcast.recipients.length,
        completedAt: new Date()
      }
    });
    await prisma.broadcastRecipient.updateMany({
      where: { broadcastId: broadcast.id },
      data: { status: "SIMULATED", sentAt: new Date() }
    });
    return { sent: broadcast.recipients.length, failed: 0, simulated: true };
  }

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: { status: "SENDING", mode: "LIVE", sentAt: new Date() }
  });

  const jobs = broadcast.recipients.map((r) => ({
    phone: r.phone,
    name: r.name,
    messageType: input.messageType,
    text: r.personalizedMessage || input.text,
    mediaUrl: input.mediaUrl
  }));

  const result = await processSendQueue(jobs, async (sent, failed) => {
    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { sentCount: sent, failedCount: failed }
    });
  });

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: {
      status: result.failed === 0 ? "SENT" : result.sent > 0 ? "PARTIAL" : "FAILED",
      sentCount: result.sent,
      failedCount: result.failed,
      completedAt: new Date()
    }
  });

  return { ...result, simulated: false };
}
