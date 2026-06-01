import { NextResponse } from "next/server";
import { getCampaign } from "../../../../lib/whatsapp/campaigns";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const broadcast = await getCampaign(id);
    if (!broadcast) return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    return NextResponse.json(broadcast);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { prisma } = await import("../../../../lib/prisma");
    await prisma.broadcast.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
