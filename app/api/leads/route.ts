import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { scoreLead } from "../../../lib/lead-scoring";

const schema = z.object({
  type: z.enum(["BUYER", "TENANT", "INVESTOR", "SELLER", "LANDLORD", "VIEWING", "CALLBACK"]),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  preferredArea: z.string().optional(),
  preferredPropertyType: z.string().optional(),
  bedrooms: z.string().optional(),
  budgetMax: z.number().int().positive().optional(),
  timeline: z.string().optional(),
  paymentPreference: z.string().optional(),
  requestedViewing: z.boolean().optional(),
  requestedCallback: z.boolean().optional(),
  requestedAgent: z.boolean().optional()
});

export async function GET() {
  const upcoming = await prisma.viewingBooking.findMany({
    where: {
      preferredAt: { gte: new Date() },
      leadId: { not: null },
      status: { notIn: ["CANCELLED", "CANCELED", "cancelled"] }
    },
    select: { leadId: true },
    distinct: ["leadId"]
  });
  const viewingLeadIds = new Set(upcoming.map((b) => b.leadId!));
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(
    leads.map((lead) => ({
      ...lead,
      hasUpcomingViewing: viewingLeadIds.has(lead.id)
    }))
  );
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const scored = scoreLead(parsed.data);
  const lead = await prisma.lead.create({
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      preferredArea: parsed.data.preferredArea,
      preferredPropertyType: parsed.data.preferredPropertyType,
      bedrooms: parsed.data.bedrooms,
      budgetMax: parsed.data.budgetMax,
      timeline: parsed.data.timeline,
      paymentPreference: parsed.data.paymentPreference,
      score: scored.score,
      temperature: scored.temperature,
      scoreReason: scored.reasons,
      requiresHumanFollowUp: Boolean(parsed.data.requestedAgent || parsed.data.requestedCallback),
      whatsappOptIn: true,
      whatsappOptInAt: parsed.data.phone ? new Date() : undefined
    }
  });

  return NextResponse.json(lead, { status: 201 });
}
