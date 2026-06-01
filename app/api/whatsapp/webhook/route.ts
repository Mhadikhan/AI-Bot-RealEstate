import { NextResponse } from "next/server";
import { processWhatsAppWebhook } from "../../../../lib/whatsapp/webhooks";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const processed = await processWhatsAppWebhook(body);
    return NextResponse.json({ received: true, processed });
  } catch (error) {
    console.error("[whatsapp webhook]", error);
    return NextResponse.json({ received: true, error: "Processing error logged" });
  }
}
