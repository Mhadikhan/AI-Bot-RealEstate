import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";

const schema = z.object({
  propertyId: z.string(),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  preferredAt: z.string().datetime(),
  notes: z.string().optional()
});

export async function GET() {
  const bookings = await prisma.viewingBooking.findMany({ include: { property: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const booking = await prisma.viewingBooking.create({
    data: {
      reference: `VIEW-${Date.now()}`,
      ...parsed.data,
      preferredAt: new Date(parsed.data.preferredAt)
    }
  });

  return NextResponse.json(booking, { status: 201 });
}
