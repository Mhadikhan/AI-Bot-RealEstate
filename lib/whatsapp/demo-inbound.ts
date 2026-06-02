import { prisma } from "../prisma";
import { handleInboundWhatsAppMessage } from "./inbound-ai";

export async function simulateInboundMessage(input: { fromPhone: string; text: string }) {
  const waMessageId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  return handleInboundWhatsAppMessage({
    fromPhone: input.fromPhone,
    text: input.text,
    waMessageId
  });
}

/** Create sample inbound threads from CRM leads (DEMO / local testing). */
export async function seedDemoInboundConversations(force = false) {
  if (!force) {
    const existing = await prisma.whatsAppInboundMessage.count();
    if (existing > 0) return { created: 0, skipped: true, reason: "already_has_messages" };
  }

  const leads = await prisma.lead.findMany({
    where: { phone: { not: null } },
    take: 3,
    orderBy: { updatedAt: "desc" }
  });

  const templates = [
    "Hi, I am looking for a 2 bed apartment in DHA under 3 crore.",
    "Can you share rental listings in Clifton around 200k per month?",
    "I need to speak with an agent about booking a viewing tomorrow."
  ];

  let created = 0;
  if (leads.length > 0) {
    for (let i = 0; i < leads.length; i++) {
      await simulateInboundMessage({
        fromPhone: leads[i].phone!,
        text: templates[i] ?? templates[0]
      });
      created += 1;
    }
  } else {
    await simulateInboundMessage({
      fromPhone: "+923001234567",
      text: templates[0]
    });
    created = 1;
  }

  return { created, skipped: false };
}
