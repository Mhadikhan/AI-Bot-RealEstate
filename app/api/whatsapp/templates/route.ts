import { NextResponse } from "next/server";
import { listWhatsAppTemplates } from "../../../../lib/whatsapp-cloud";

export async function GET() {
  const result = await listWhatsAppTemplates();
  if (!result.ok) {
    return NextResponse.json({ error: result.error, templates: [] }, { status: result.error ? 400 : 500 });
  }
  return NextResponse.json({ templates: result.templates });
}
