import { NextResponse } from "next/server";
import { getWhatsAppDashboardAnalytics } from "../../../../lib/whatsapp/analytics";
import { reconcileCampaignStats } from "../../../../lib/whatsapp/campaigns";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("reconcile") === "1") {
      await reconcileCampaignStats();
    }
    const data = await getWhatsAppDashboardAnalytics();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[whatsapp analytics]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analytics failed" },
      { status: 500 }
    );
  }
}
