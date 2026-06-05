import { NextResponse } from "next/server";
import { z } from "zod";
import { createCampaign, listCampaigns } from "../../../lib/whatsapp/campaigns";

export const maxDuration = 300;
import { getWhatsAppStatus } from "../../../lib/whatsapp/config";
import { CAMPAIGN_CATEGORIES, type BroadcastAudience } from "../../../lib/broadcast";
import { crmFiltersSchema } from "../../../lib/audience-filters-schema";

const createSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(1),
  category: z.enum(CAMPAIGN_CATEGORIES).optional(),
  audience: z.enum([
    "OPTED_IN",
    "ALL_PHONES",
    "HOT",
    "WARM",
    "COLD",
    "BUYERS",
    "TENANTS",
    "INVESTORS",
    "SELLERS",
    "LANDLORDS",
    "CALLBACKS",
    "VIEWING_BOOKED",
    "AGENT_FOLLOW_UP",
    "SELECTED"
  ]),
  selectedLeadIds: z.array(z.string()).optional(),
  crmFilters: crmFiltersSchema,
  sendNow: z.boolean().optional()
});

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

/** @deprecated Use /api/whatsapp/campaigns */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const campaigns = await listCampaigns(50);
    const platform = getWhatsAppStatus(url.origin);
    return NextResponse.json({
      broadcasts: campaigns,
      campaigns,
      whatsappApiConfigured: platform.configured,
      platform
    });
  } catch (error) {
    console.error("[broadcasts GET]", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

/** @deprecated Use /api/whatsapp/campaigns */
export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid campaign data." }, { status: 400 });
    }

    const result = await createCampaign({
      title: parsed.data.title,
      message: parsed.data.message,
      category: parsed.data.category,
      audience: parsed.data.audience as BroadcastAudience,
      selectedLeadIds: parsed.data.selectedLeadIds,
      crmFilters: parsed.data.crmFilters,
      sendNow: parsed.data.sendNow
    });

    return NextResponse.json(
      {
        broadcast: result.campaign,
        campaign: result.campaign,
        summary: result.summary,
        platform: getWhatsAppStatus()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[broadcasts POST]", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}
