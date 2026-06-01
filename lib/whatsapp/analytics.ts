import { prisma } from "../prisma";

const SENT_STATUSES = ["SUBMITTED", "SENT", "DELIVERED", "READ", "SIMULATED"] as const;
const DELIVERED_STATUSES = ["DELIVERED", "READ"] as const;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export async function getWhatsAppDashboardAnalytics() {
  const [totalCampaigns, recipients, campaigns, unsubscribedUsers, inboundMessages, agentHandovers] =
    await Promise.all([
      prisma.broadcast.count(),
      prisma.broadcastRecipient.findMany({
        select: {
          id: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          readAt: true,
          repliedAt: true,
          leadId: true,
          broadcastId: true
        }
      }),
      prisma.broadcast.findMany({
        select: {
          id: true,
          title: true,
          category: true,
          recipientCount: true,
          sentCount: true,
          deliveredCount: true,
          readCount: true,
          replyCount: true,
          failedCount: true,
          manualCount: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.lead.count({ where: { whatsappOptIn: false } }),
      prisma.whatsAppInboundMessage.count(),
      prisma.whatsAppInboundMessage.count({ where: { requiresAgent: true } })
    ]);

  const campaignLeadIds = [
    ...new Set(recipients.map((r) => r.leadId).filter((id): id is string => Boolean(id)))
  ];

  const [viewingBookings, viewingFromCampaignLeads, convertedLeads] = await Promise.all([
    prisma.viewingBooking.count(),
    campaignLeadIds.length
      ? prisma.viewingBooking.count({ where: { leadId: { in: campaignLeadIds } } })
      : Promise.resolve(0),
    campaignLeadIds.length
      ? prisma.lead.count({ where: { status: "CONVERTED", id: { in: campaignLeadIds } } })
      : Promise.resolve(0)
  ]);

  let messagesSent = 0;
  let messagesDelivered = 0;
  let messagesRead = 0;
  let failedMessages = 0;
  let repliesFromRecipients = 0;

  const sentByDayMap = new Map<string, number>();
  const deliveredByDayMap = new Map<string, number>();
  const readByDayMap = new Map<string, number>();
  const replyByDayMap = new Map<string, number>();

  for (const r of recipients) {
    const isSent = SENT_STATUSES.includes(r.status as (typeof SENT_STATUSES)[number]);
    const isDelivered = DELIVERED_STATUSES.includes(r.status as (typeof DELIVERED_STATUSES)[number]);
    const isRead = r.status === "READ";
    const isFailed = r.status === "FAILED";

    if (isSent) messagesSent += 1;
    if (isDelivered) messagesDelivered += 1;
    if (isRead) messagesRead += 1;
    if (isFailed) failedMessages += 1;
    if (r.repliedAt) repliesFromRecipients += 1;

    if (r.sentAt && isSent) {
      const key = dayKey(r.sentAt);
      sentByDayMap.set(key, (sentByDayMap.get(key) || 0) + 1);
    }
    if (r.deliveredAt) {
      const key = dayKey(r.deliveredAt);
      deliveredByDayMap.set(key, (deliveredByDayMap.get(key) || 0) + 1);
    }
    if (r.readAt) {
      const key = dayKey(r.readAt);
      readByDayMap.set(key, (readByDayMap.get(key) || 0) + 1);
    }
    if (r.repliedAt) {
      const key = dayKey(r.repliedAt);
      replyByDayMap.set(key, (replyByDayMap.get(key) || 0) + 1);
    }
  }

  const repliesReceived = Math.max(inboundMessages, repliesFromRecipients);

  const conversionRate =
    messagesSent > 0 ? Math.round((convertedLeads / messagesSent) * 1000) / 10 : 0;

  const deliveryRate = messagesSent > 0 ? Math.round((messagesDelivered / messagesSent) * 1000) / 10 : 0;
  const readRate =
    messagesDelivered > 0 ? Math.round((messagesRead / messagesDelivered) * 1000) / 10 : 0;
  const replyRate = messagesSent > 0 ? Math.round((repliesReceived / messagesSent) * 1000) / 10 : 0;

  const days = lastNDays(14);

  const messagesSentByDay = days.map((date) => ({
    date,
    label: new Date(date + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: sentByDayMap.get(date) || 0
  }));

  const deliveryRateByDay = days.map((date) => {
    const sent = sentByDayMap.get(date) || 0;
    const delivered = deliveredByDayMap.get(date) || 0;
    return {
      date,
      label: new Date(date + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0
    };
  });

  const readRateByDay = days.map((date) => {
    const delivered = deliveredByDayMap.get(date) || 0;
    const read = readByDayMap.get(date) || 0;
    return {
      date,
      label: new Date(date + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: delivered > 0 ? Math.round((read / delivered) * 1000) / 10 : 0
    };
  });

  const replyRateByDay = days.map((date) => {
    const sent = sentByDayMap.get(date) || 0;
    const replies = replyByDayMap.get(date) || 0;
    return {
      date,
      label: new Date(date + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: sent > 0 ? Math.round((replies / sent) * 1000) / 10 : 0
    };
  });

  const leadsByCampaign = campaigns
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      recipients: c.recipientCount,
      replies: c.replyCount,
      leadsGenerated: c.replyCount
    }))
    .filter((c) => c.recipients > 0)
    .sort((a, b) => b.leadsGenerated - a.leadsGenerated)
    .slice(0, 12);

  const viewingRequestsGenerated = viewingFromCampaignLeads || viewingBookings;

  const funnel = [
    { stage: "Recipients targeted", value: recipients.length },
    { stage: "Messages sent", value: messagesSent },
    { stage: "Delivered", value: messagesDelivered },
    { stage: "Read", value: messagesRead },
    { stage: "Replies", value: repliesReceived },
    { stage: "Viewing requests", value: viewingRequestsGenerated },
    { stage: "Converted leads", value: convertedLeads }
  ];

  const funnelMax = funnel[0]?.value || 1;

  return {
    kpis: {
      totalCampaigns,
      messagesSent,
      messagesDelivered,
      messagesRead,
      repliesReceived,
      failedMessages,
      unsubscribedUsers,
      viewingRequestsGenerated,
      agentHandoversGenerated: agentHandovers,
      conversionRate,
      deliveryRate,
      readRate,
      replyRate
    },
    charts: {
      messagesSentByDay,
      deliveryRateByDay,
      readRateByDay,
      replyRateByDay,
      leadsByCampaign,
      conversionFunnel: funnel.map((f) => ({
        ...f,
        percent: Math.round((f.value / funnelMax) * 100)
      }))
    },
    meta: {
      recipientRows: recipients.length,
      modeNote: "Delivery/read metrics in LIVE mode require Meta webhooks."
    }
  };
}
