import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { properties: true, leads: true } }
    }
  });

  return NextResponse.json(agents);
}
