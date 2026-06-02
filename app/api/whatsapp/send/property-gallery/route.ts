import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMatchingPropertyCovers } from "../../../../../lib/whatsapp/whatsapp-media.service";

const schema = z.object({
  phone: z.string().min(10),
  propertyIds: z.array(z.string()).min(1).max(5)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await sendMatchingPropertyCovers(body.phone, body.propertyIds);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gallery send failed" },
      { status: 400 }
    );
  }
}
