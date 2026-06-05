import { NextResponse } from "next/server";
import { executeCampaignSend } from "../../../../../lib/whatsapp/campaigns";

export const maxDuration = 300;

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await executeCampaignSend(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Send failed" }, { status: 500 });
  }
}
