import { NextResponse } from "next/server";
import { z } from "zod";
import { createQuickSendCampaign, previewPhoneList } from "../../../../lib/whatsapp/quick-send";
import { getWhatsAppStatus } from "../../../../lib/whatsapp/config";
import { getProviderHealth } from "../../../../lib/whatsapp/providers";

const quickSendSchema = z.object({
  title: z.string().optional(),
  messageType: z.enum(["TEXT", "IMAGE", "VIDEO"]),
  message: z.string().optional().default(""),
  mediaUrl: z.string().optional().nullable(),
  phoneList: z.string().min(1),
  sendNow: z.boolean().optional(),
  deliveryMethod: z.enum(["template", "session"]).optional(),
  templateName: z.string().optional(),
  templateLanguage: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = quickSendSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request" },
        { status: 400 }
      );
    }

    const result = await createQuickSendCampaign({
      title: parsed.data.title || "Phone list broadcast",
      messageType: parsed.data.messageType,
      message: parsed.data.message,
      mediaUrl: parsed.data.mediaUrl,
      phoneListRaw: parsed.data.phoneList,
      sendNow: parsed.data.sendNow,
      deliveryMethod: parsed.data.deliveryMethod,
      templateName: parsed.data.templateName,
      templateLanguage: parsed.data.templateLanguage
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[whatsapp quick-send]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Quick send failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("phones") || "";
  const count = previewPhoneList(raw).length;
  const platform = getWhatsAppStatus(url.origin);
  const health = await getProviderHealth();

  return NextResponse.json({
    count,
    platform,
    health,
    hint:
      platform.mode === "DEMO"
        ? "DEMO mode — restart npm run dev after adding Green API keys to .env."
        : health.provider === "green-api"
          ? "Green API — use Session delivery (free text). Template mode is for Meta only."
          : "Meta — use Template for new contacts."
  });
}
