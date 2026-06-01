import { NextResponse } from "next/server";
import { z } from "zod";
import { createCampaign, listCampaigns, processDueScheduledCampaigns } from "../../../../lib/whatsapp/campaigns";
import { getWhatsAppStatus } from "../../../../lib/whatsapp/config";
import { CAMPAIGN_CATEGORIES, type BroadcastAudience } from "../../../../lib/broadcast";
import { crmFiltersSchema } from "../../../../lib/audience-filters-schema";

const audienceEnum = z.enum([
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
]);

const createSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(1),
  category: z.enum(CAMPAIGN_CATEGORIES).optional(),
  audience: audienceEnum,
  selectedLeadIds: z.array(z.string()).optional(),
  scheduledAt: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z.union([z.string().datetime(), z.null()]).optional()
  ),
  propertyRef: z.string().optional().nullable(),
  followUpSequenceId: z.string().optional().nullable(),
  crmFilters: crmFiltersSchema,
  sendNow: z.boolean().optional()
});

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("processScheduled") === "1") {
      const processed = await processDueScheduledCampaigns();
      return NextResponse.json({ processed, status: getWhatsAppStatus(url.origin) });
    }

    const campaigns = await listCampaigns(50);
    return NextResponse.json({
      campaigns,
      platform: getWhatsAppStatus(url.origin)
    });
  } catch (error) {
    console.error("[whatsapp campaigns GET]", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const detail = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid campaign data.";
      return NextResponse.json({ error: detail }, { status: 400 });
    }

    const result = await createCampaign({
      title: parsed.data.title,
      message: parsed.data.message,
      category: parsed.data.category,
      audience: parsed.data.audience as BroadcastAudience,
      selectedLeadIds: parsed.data.selectedLeadIds,
      crmFilters: parsed.data.crmFilters,
      scheduledAt: parsed.data.scheduledAt,
      propertyRef: parsed.data.propertyRef,
      followUpSequenceId: parsed.data.followUpSequenceId,
      sendNow: parsed.data.sendNow
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[whatsapp campaigns POST]", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}
