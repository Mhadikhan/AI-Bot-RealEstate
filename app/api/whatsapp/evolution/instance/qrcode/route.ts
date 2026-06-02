import { NextResponse } from "next/server";
import { fetchEvolutionQrCode } from "../../../../../../lib/whatsapp/whatsapp-instance.service";

export async function GET() {
  try {
    const qr = await fetchEvolutionQrCode();
    return NextResponse.json(qr);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "QR fetch failed" },
      { status: 500 }
    );
  }
}
