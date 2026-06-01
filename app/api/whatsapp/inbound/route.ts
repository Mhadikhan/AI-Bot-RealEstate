import { NextResponse } from "next/server";
import { assignInboundToAgent, listInboundMessages } from "../../../../lib/whatsapp/inbound-ai";

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
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
