import { NextResponse } from "next/server";
import { checkEvolutionApiReachable } from "../../../../../lib/whatsapp/evolution-health";

export async function GET() {
  const health = await checkEvolutionApiReachable();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
