import { NextResponse } from "next/server";
import { createEvolutionInstance } from "../../../../../../lib/whatsapp/whatsapp-instance.service";

export async function POST() {
  try {
    const result = await createEvolutionInstance();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create instance failed" },
      { status: 500 }
    );
  }
}
