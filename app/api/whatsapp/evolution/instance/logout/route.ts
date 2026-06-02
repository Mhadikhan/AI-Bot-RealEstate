import { NextResponse } from "next/server";
import { logoutEvolutionInstance } from "../../../../../../lib/whatsapp/whatsapp-instance.service";

export async function POST() {
  try {
    await logoutEvolutionInstance();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Logout failed" },
      { status: 500 }
    );
  }
}
