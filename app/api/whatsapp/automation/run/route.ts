import { NextResponse } from "next/server";
import { processDueScheduledCampaigns, reconcileCampaignStats } from "../../../../../lib/whatsapp/campaigns";
import { processDueFollowUps } from "../../../../../lib/whatsapp/follow-ups";

export async function POST() {
  try {
    const [reconciled, campaigns, followUps] = await Promise.all([
      reconcileCampaignStats(),
      processDueScheduledCampaigns(),
      processDueFollowUps()
    ]);

    return NextResponse.json({
      reconciled: reconciled.updated,
      campaignsProcessed: campaigns.length,
      followUpsProcessed: followUps.length,
      campaigns,
      followUps
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
