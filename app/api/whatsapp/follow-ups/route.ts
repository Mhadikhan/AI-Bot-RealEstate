import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createFollowUpSequence,
  listFollowUpSequences,
  processDueFollowUps
} from "../../../../lib/whatsapp/follow-ups";

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        delayHours: z.number().int().positive(),
        messageTemplate: z.string().min(1),
        triggerCondition: z.string().optional()
      })
    )
    .min(1)
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("process") === "1") {
      const processed = await processDueFollowUps();
      return NextResponse.json({ processed });
    }
    const sequences = await listFollowUpSequences();
    return NextResponse.json(sequences);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sequence data" }, { status: 400 });
    }
    const sequence = await createFollowUpSequence(parsed.data);
    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
