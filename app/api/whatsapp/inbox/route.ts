import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const conversations = await prisma.whatsAppConversation.findMany({
    where: { tenantId: "default" },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      lead: {
        select: {
          name: true,
          score: true,
          temperature: true,
          preferredArea: true,
          budgetMax: true
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 30
      },
      _count: { select: { messages: true } }
    }
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      ...c,
      messages: [...c.messages].reverse()
    }))
  });
}
