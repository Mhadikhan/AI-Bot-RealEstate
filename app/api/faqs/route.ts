import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const faqs = await prisma.fAQ.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }]
  });

  return NextResponse.json(faqs);
}
