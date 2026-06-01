import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { defaultBrandSettings, type BrandSettings } from "../../../lib/brand-settings";

const settingsPath = path.join(process.cwd(), "data", "brand-settings.json");

async function readSettings(): Promise<BrandSettings> {
  try {
    const raw = await readFile(settingsPath, "utf-8");
    return { ...defaultBrandSettings, ...JSON.parse(raw) };
  } catch {
    return defaultBrandSettings;
  }
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const settings: BrandSettings = { ...defaultBrandSettings, ...body };

  await mkdir(path.dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, JSON.stringify(settings, null, 2));

  return NextResponse.json(settings);
}
