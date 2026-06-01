import { NextResponse } from "next/server";
import { z } from "zod";
import { processChatMessage, type ChatHistoryItem } from "../../../lib/chat-engine";
import { prisma } from "../../../lib/prisma";
import { scoreLead } from "../../../lib/lead-scoring";

const schema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })
    )
    .optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Please type a question or choose an option." }, { status: 400 });
  }

  const message = parsed.data.message.trim();
  const history = (parsed.data.history || []) as ChatHistoryItem[];

  const result = await processChatMessage(message, history);

  let leadId: string | undefined;

  if (result.leadHint?.phone || result.leadHint?.email) {
    const leadType = (result.leadHint.type || result.intent) as
      | "BUYER"
      | "TENANT"
      | "INVESTOR"
      | "SELLER"
      | "LANDLORD"
      | "VIEWING"
      | "CALLBACK";

    const validTypes = ["BUYER", "TENANT", "INVESTOR", "SELLER", "LANDLORD", "VIEWING", "CALLBACK"];
    const type = validTypes.includes(leadType) ? leadType : "CALLBACK";

    const scored = scoreLead({
      phone: result.leadHint.phone,
      email: result.leadHint.email,
      budgetMax: result.leadHint.budgetMax,
      preferredArea: result.leadHint.preferredArea,
      requestedViewing: type === "VIEWING",
      requestedCallback: type === "CALLBACK",
      requestedAgent: type === "CALLBACK"
    });

    const lead = await prisma.lead.create({
      data: {
        type,
        name: result.leadHint.name,
        phone: result.leadHint.phone,
        email: result.leadHint.email,
        preferredArea: result.leadHint.preferredArea,
        budgetMax: result.leadHint.budgetMax,
        score: scored.score,
        temperature: scored.temperature,
        scoreReason: scored.reasons,
        requiresHumanFollowUp: true,
        source: "AI Chatbot"
      }
    });

    leadId = lead.id;
  }

  return NextResponse.json({
    message: result.message,
    intent: result.intent,
    suggestions: result.suggestions,
    properties: result.properties,
    aiPowered: result.aiPowered,
    leadId
  });
}
