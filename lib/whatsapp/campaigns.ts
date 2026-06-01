import { prisma } from "../prisma";
import {
  buildRecipientPayloads,
  defaultAudienceForCategory,
  type BroadcastAudience,
  type CampaignCategory
} from "../broadcast";
import type { CrmAudienceFilters } from "../audience-filters";
import { queryLeadsForCrmAudience } from "../audience-filters";
import { personalizeBroadcastMessage, sendWhatsAppText } from "../whatsapp-cloud";
import { getCampaignMode } from "./config";

export type CreateCampaignInput = {
  title: string;
  message: string;
  category?: CampaignCategory;
  audience: BroadcastAudience;
  crmFilters?: CrmAudienceFilters;
  selectedLeadIds?: string[];
  scheduledAt?: string | null;
  propertyRef?: string | null;
  followUpSequenceId?: string | null;
  sendNow?: boolean;
};

function resolveMode() {
  return getCampaignMode();
}

export async function listCampaigns(limit = 50) {
  return prisma.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      recipients: { take: 8, orderBy: { createdAt: "asc" } },
      followUpSequence: { select: { id: true, name: true } }
    }
  });
}

export async function getCampaign(id: string) {
  return prisma.broadcast.findUnique({
    where: { id },
    include: {
      recipients: { orderBy: { createdAt: "asc" }, include: { lead: { select: { type: true, temperature: true, preferredArea: true } } } },
      followUpSequence: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
      webhookEvents: { orderBy: { createdAt: "desc" }, take: 30 }
    }
  });
}

export async function getCampaignAnalytics(id: string) {
  const campaign = await getCampaign(id);
  if (!campaign) return null;

  const byStatus = campaign.recipients.reduce<Record<string, number>>((acc, recipient) => {
    acc[recipient.status] = (acc[recipient.status] || 0) + 1;
    return acc;
  }, {});

  return {
    campaign,
    analytics: {
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      readCount: campaign.readCount,
      replyCount: campaign.replyCount,
      failedCount: campaign.failedCount,
      simulatedCount: byStatus.SIMULATED || 0,
      deliveryRate:
        campaign.sentCount > 0
          ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
          : 0,
      readRate:
        campaign.deliveredCount > 0
          ? Math.round((campaign.readCount / campaign.deliveredCount) * 100)
          : 0,
      byStatus,
      mode: campaign.mode,
      isSimulated: campaign.mode === "DEMO"
    }
  };
}

export async function createCampaign(input: CreateCampaignInput) {
  const mode = resolveMode();
  const category = input.category || "CUSTOM";
  const audience = input.audience || defaultAudienceForCategory(category);
  const preset = input.crmFilters?.audiencePreset ?? audience;
  const crmFilters: CrmAudienceFilters = {
    ...(input.crmFilters || {}),
    audiencePreset: preset,
    selectedLeadIds: input.selectedLeadIds,
    whatsappOptIn:
      input.crmFilters?.unsubscribedOnly || preset === "ALL_PHONES"
        ? undefined
        : input.crmFilters?.whatsappOptIn ?? true
  };

  const filtered = await queryLeadsForCrmAudience(crmFilters);
  if (filtered.length === 0) {
    throw new Error("No leads with phone numbers match this audience.");
  }

  const payloads = buildRecipientPayloads(filtered, input.message);
  if (payloads.length === 0) {
    throw new Error("No valid phone numbers found for this audience.");
  }

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  const sendNow = Boolean(input.sendNow) && !scheduledAt;

  const campaign = await prisma.broadcast.create({
    data: {
      title: input.title,
      message: input.message,
      category,
      audience,
      audienceFilters: crmFilters as object,
      mode,
      propertyRef: input.propertyRef || null,
      followUpSequenceId: input.followUpSequenceId || null,
      recipientCount: payloads.length,
      status: sendNow ? "SENDING" : scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt,
      recipients: {
        create: payloads.map((recipient) => ({
          leadId: recipient.leadId,
          phone: recipient.phone,
          name: recipient.name,
          personalizedMessage: recipient.message,
          status: "QUEUED"
        }))
      }
    },
    include: { recipients: true, followUpSequence: true }
  });

  if (sendNow) {
    return executeCampaignSend(campaign.id);
  }

  return { campaign, summary: null };
}

export async function executeCampaignSend(campaignId: string) {
  const campaign = await prisma.broadcast.findUnique({
    where: { id: campaignId },
    include: { recipients: true, followUpSequence: true }
  });

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.recipients.length === 0) throw new Error("No recipients on this campaign.");

  const mode = campaign.mode;
  const isLive = mode === "LIVE";

  await prisma.broadcast.update({
    where: { id: campaignId },
    data: { status: "SENDING", sentAt: new Date() }
  });

  let sentCount = 0;
  let failedCount = 0;
  let simulatedCount = 0;

  for (const recipient of campaign.recipients) {
    const body = recipient.personalizedMessage || personalizeBroadcastMessage(campaign.message, recipient.name);

    if (!isLive) {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "SIMULATED",
          sentAt: new Date(),
          error: null
        }
      });
      await prisma.whatsAppWebhookEvent.create({
        data: {
          broadcastId: campaignId,
          recipientId: recipient.id,
          leadId: recipient.leadId,
          eventType: "simulated",
          payload: { note: "Demo mode — not sent to Meta API" }
        }
      });
      simulatedCount += 1;
      continue;
    }

    const result = await sendWhatsAppText(recipient.phone, body);

    if (result.ok && result.messageId) {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "SUBMITTED",
          externalId: result.messageId,
          sentAt: new Date(),
          error: null
        }
      });
      await prisma.whatsAppWebhookEvent.create({
        data: {
          broadcastId: campaignId,
          recipientId: recipient.id,
          leadId: recipient.leadId,
          eventType: "submitted",
          waMessageId: result.messageId,
          payload: { messageId: result.messageId }
        }
      });
      sentCount += 1;
    } else {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "FAILED",
          error: result.error || "Send failed"
        }
      });
      failedCount += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  const finalStatus =
    isLive && sentCount === 0
      ? "FAILED"
      : isLive && failedCount > 0 && sentCount > 0
        ? "PARTIAL"
        : "SENT";

  const updated = await prisma.broadcast.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentCount: isLive ? sentCount : simulatedCount,
      failedCount,
      manualCount: isLive ? 0 : simulatedCount,
      completedAt: new Date()
    },
    include: { recipients: true, followUpSequence: true }
  });

  if (updated.followUpSequenceId) {
    const { enrollLeadsInSequence } = await import("./follow-ups");
    await enrollLeadsInSequence(
      updated.followUpSequenceId,
      updated.recipients.filter((r) => r.leadId).map((r) => r.leadId!),
      campaignId
    );
  }

  return {
    campaign: updated,
    summary: { sentCount, failedCount, simulatedCount, mode }
  };
}

const COUNTED_SENT = new Set(["SUBMITTED", "SENT", "DELIVERED", "READ", "SIMULATED"]);
const COUNTED_DELIVERED = new Set(["DELIVERED", "READ"]);

/** Sync campaign counters from recipient rows (fixes legacy DEMO rows showing 0 sent). */
export async function reconcileCampaignStats() {
  const campaigns = await prisma.broadcast.findMany({
    include: { recipients: true }
  });

  let updated = 0;
  for (const campaign of campaigns) {
    const sentCount = campaign.recipients.filter((r) => COUNTED_SENT.has(r.status)).length;
    const deliveredCount = campaign.recipients.filter((r) => COUNTED_DELIVERED.has(r.status)).length;
    const readCount = campaign.recipients.filter((r) => r.status === "READ").length;
    const failedCount = campaign.recipients.filter((r) => r.status === "FAILED").length;
    const manualCount = campaign.recipients.filter((r) => r.status === "SIMULATED").length;
    const queuedCount = campaign.recipients.filter((r) => r.status === "QUEUED").length;

    let status = campaign.status;
    if (queuedCount > 0 && sentCount === 0 && status === "SENT") {
      status = campaign.scheduledAt ? "SCHEDULED" : "DRAFT";
    } else if (sentCount > 0 && (status === "DRAFT" || status === "SCHEDULED")) {
      status = "SENT";
    }

    await prisma.broadcast.update({
      where: { id: campaign.id },
      data: { sentCount, deliveredCount, readCount, failedCount, manualCount, status }
    });
    updated += 1;
  }
  return { updated };
}

export async function cancelScheduledCampaign(id: string) {
  return prisma.broadcast.update({
    where: { id },
    data: { status: "CANCELLED" }
  });
}

export async function processDueScheduledCampaigns() {
  const due = await prisma.broadcast.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() }
    },
    take: 10
  });

  const results = [];
  for (const campaign of due) {
    results.push(await executeCampaignSend(campaign.id));
  }
  return results;
}
