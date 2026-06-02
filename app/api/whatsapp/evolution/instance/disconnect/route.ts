import { NextResponse } from "next/server";
import { disconnectEvolutionInstance } from "../../../../../../lib/whatsapp/whatsapp-instance.service";

export async function POST() {
  try {
    await disconnectEvolutionInstance();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Disconnect failed" },
      { status: 500 }
    );
  }
}
