import { NextResponse } from "next/server";
import { z } from "zod";
import { sendWhatsAppTextMessage, sendWhatsAppMediaMessage } from "../../../../../lib/whatsapp/whatsapp-message.service";

const textSchema = z.object({ phone: z.string().min(10), text: z.string().min(1) });
const mediaSchema = z.object({
  phone: z.string().min(10),
  messageType: z.enum(["IMAGE", "VIDEO"]),
  text: z.string().optional(),
  mediaUrl: z.string().min(1),
  mimeType: z.string().optional(),
  fileName: z.string().optional()
});

export async function POST(request: Request) {
  const url = new URL(request.url);
  const kind = url.pathname.split("/").pop();

  try {
    const body = await request.json();
    if (kind === "text") {
      const parsed = textSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      return NextResponse.json(await sendWhatsAppTextMessage(parsed.data.phone, parsed.data.text));
    }
    if (kind === "image" || kind === "video" || kind === "document") {
      const parsed = mediaSchema.safeParse({
        ...body,
        messageType: kind === "video" ? "VIDEO" : kind === "document" ? "TEXT" : "IMAGE"
      });
      if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      return NextResponse.json(
        await sendWhatsAppMediaMessage({
          phone: parsed.data.phone,
          messageType: parsed.data.messageType,
          text: parsed.data.text || "",
          mediaUrl: parsed.data.mediaUrl,
          mimeType: parsed.data.mimeType,
          fileName: parsed.data.fileName
        })
      );
    }
    return NextResponse.json({ error: "Unknown send type" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send failed" },
      { status: 500 }
    );
  }
}
