import { NextResponse } from "next/server";
import {
  processEvolutionWebhook,
  validateEvolutionWebhookSecret
} from "../../../../lib/whatsapp/whatsapp-webhook.service";

export async function POST(request: Request) {
  if (!validateEvolutionWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await processEvolutionWebhook(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[evolution webhook]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "PropertyConnect Evolution webhook" });
}
