import { NextResponse } from "next/server";
import { z } from "zod";
import { sendWhatsAppTestMessage } from "../../../../lib/whatsapp/test-send";
import { getWhatsAppStatus } from "../../../../lib/whatsapp/config";
import { buildManualWhatsAppUrl } from "../../../../lib/whatsapp-cloud";

const schema = z.object({
  phone: z.string().min(10),
  messageType: z.enum(["TEXT", "IMAGE", "VIDEO"]).optional().default("TEXT"),
  message: z.string().optional().default("Hello from PropertyConnect AI"),
  mediaUrl: z.string().optional().nullable(),
  deliveryMethod: z.enum(["template", "session"]).optional().default("template"),
  templateName: z.string().optional(),
  templateLanguage: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTestMessage(parsed.data);
    const manualUrl = buildManualWhatsAppUrl(parsed.data.phone, parsed.data.message);

    return NextResponse.json({
      ...result,
      manualUrl,
      platform: getWhatsAppStatus(new URL(request.url).origin)
    });
  } catch (error) {
    console.error("[whatsapp test-send]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test send failed" },
      { status: 500 }
    );
  }
}
