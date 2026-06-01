import { NextResponse } from "next/server";
import { getWhatsAppStatus } from "../../../../lib/whatsapp/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  return NextResponse.json(getWhatsAppStatus(origin));
}
