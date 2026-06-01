import { NextResponse } from "next/server";
import { z } from "zod";
import { crmFiltersSchema } from "../../../../lib/audience-filters-schema";
import { getAudienceFilterOptions, queryLeadsForCrmAudience } from "../../../../lib/audience-filters";

const previewSchema = z.object({
  crmFilters: crmFiltersSchema
});

export async function GET() {
  try {
    const options = await getAudienceFilterOptions();
    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load filter options" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = previewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid audience filters." }, { status: 400 });
    }

    const leads = await queryLeadsForCrmAudience(parsed.data.crmFilters || { whatsappOptIn: true });

    return NextResponse.json({
      count: leads.length,
      leads: leads.slice(0, 50).map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        type: l.type,
        temperature: l.temperature,
        preferredArea: l.preferredArea,
        score: l.score,
        status: l.status,
        source: l.source,
        tags: l.tags
      }))
    });
  } catch (error) {
    console.error("[whatsapp audience]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audience preview failed" },
      { status: 500 }
    );
  }
}
