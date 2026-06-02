import { NextResponse } from "next/server";
import { processWhatsAppWebhook } from "../../../../../lib/whatsapp/webhooks";
import { prisma } from "../../../../../lib/prisma";

/** POST — simulate Meta webhook (inbound text + optional delivery status) for DEMO/LIVE testing. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text =
      typeof body.text === "string" && body.text.trim()
        ? body.text.trim()
        : "Hi, I saw your property alert. Is the DHA apartment still available?";
    const from =
      typeof body.fromPhone === "string" && body.fromPhone.trim()
        ? body.fromPhone.replace(/\D/g, "")
        : "923009999999";

    const lead = await prisma.lead.findFirst({
      where: { phone: { not: null } },
      orderBy: { updatedAt: "desc" }
    });
    const fromPhone = from || lead?.phone?.replace(/\D/g, "") || "923009999999";

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "demo_entry",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "demo" },
                messages: [
                  {
                    from: fromPhone,
                    id: `wamid.demo.${Date.now()}`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: "text",
                    text: { body: text }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    const processed = await processWhatsAppWebhook(payload);
    return NextResponse.json({ ok: true, processed, fromPhone, text });
  } catch (error) {
    console.error("[webhook simulate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
