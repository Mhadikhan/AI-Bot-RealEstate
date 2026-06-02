import { NextResponse } from "next/server";
import { assignInboundToAgent, listInboundMessages } from "../../../../lib/whatsapp/inbound-ai";
import { seedDemoInboundConversations, simulateInboundMessage } from "../../../../lib/whatsapp/demo-inbound";

export async function GET() {
  try {
    const messages = await listInboundMessages(80);
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "assign_agent" && body.messageId) {
      const msg = await assignInboundToAgent(body.messageId);
      return NextResponse.json(msg);
    }

    if (body.action === "simulate") {
      const fromPhone = typeof body.fromPhone === "string" ? body.fromPhone.trim() : "";
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!fromPhone || !text) {
        return NextResponse.json({ error: "fromPhone and text are required." }, { status: 400 });
      }
      const msg = await simulateInboundMessage({ fromPhone, text });
      return NextResponse.json(msg);
    }

    if (body.action === "seed_demo") {
      const result = await seedDemoInboundConversations(Boolean(body.force));
      const messages = await listInboundMessages(80);
      return NextResponse.json({ ...result, messages });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
