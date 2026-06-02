import { NextResponse } from "next/server";
import { syncConnectionStatus, getWhatsAppInstanceRecord } from "../../../../../../lib/whatsapp/whatsapp-instance.service";
import { createWhatsAppProvider } from "../../../../../../lib/whatsapp/whatsapp-provider.factory";
import { getWhatsAppStatus } from "../../../../../../lib/whatsapp/config";

export async function GET(request: Request) {
  try {
    const status = await syncConnectionStatus();
    const record = await getWhatsAppInstanceRecord();
    const provider = createWhatsAppProvider();
    return NextResponse.json({
      ...status,
      record,
      platform: getWhatsAppStatus(new URL(request.url).origin),
      instanceName: process.env.EVOLUTION_API_INSTANCE_NAME || "propertyconnect"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 200 }
    );
  }
}
