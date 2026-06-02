import { NextResponse } from "next/server";
import { fetchSetupHealth, fetchSetupTemplatesPreview, getWhatsAppSetupStatus } from "../../../../lib/whatsapp/setup";
import { getWhatsAppStatus } from "../../../../lib/whatsapp/config";
import { getGreenApiAllowedPhones } from "../../../../lib/whatsapp/providers/green-api-errors";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeTemplates = url.searchParams.get("templates") === "1";
  const setup = getWhatsAppSetupStatus();
  const platform = getWhatsAppStatus(url.origin);

  let templates: { templates: Array<{ name: string; language: string; status: string; category: string }>; error?: string } = {
    templates: []
  };
  if (includeTemplates && platform.configured) {
    templates = await fetchSetupTemplatesPreview();
  }

  const health = await fetchSetupHealth();

  return NextResponse.json({
    setup,
    platform,
    health,
    greenApiAllowedPhones: getGreenApiAllowedPhones().map((p) => `+${p}`),
    templates: templates.templates,
    templatesError: templates.error
  });
}
