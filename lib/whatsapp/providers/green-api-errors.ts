const GREEN_CONSOLE_URL = "https://console.green-api.com";

export type ParsedGreenApiError = {
  title: string;
  message: string;
  allowedPhones: string[];
  upgradeUrl: string;
  isQuotaError: boolean;
};

function extractPhonesFromText(text: string): string[] {
  const matches = text.match(/\d{10,15}@c\.us/g) || [];
  return matches.map((m) => m.replace("@c.us", ""));
}

export function getGreenApiAllowedPhones(): string[] {
  const raw = process.env.GREEN_API_ALLOWED_PHONES?.trim();
  if (raw) {
    return raw
      .split(/[\s,;]+/)
      .map((p) => p.replace(/\D/g, ""))
      .filter((p) => p.length >= 10);
  }
  return ["923149880311", "923412878311", "923412879311"];
}

export function parseGreenApiError(raw: unknown): ParsedGreenApiError | null {
  let data: Record<string, unknown> | null = null;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      try {
        data = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        return null;
      }
    } else if (/quota|QUOTE_ALLOWED|CORRESPONDENTS_QUOTE/i.test(trimmed)) {
      return {
        title: "Green API monthly limit reached",
        message: trimmed,
        allowedPhones: extractPhonesFromText(trimmed),
        upgradeUrl: GREEN_CONSOLE_URL,
        isQuotaError: true
      };
    } else {
      return null;
    }
  } else if (raw && typeof raw === "object") {
    data = raw as Record<string, unknown>;
  }

  if (!data) return null;

  const invoke = data.invokeStatus as { description?: string; status?: string } | undefined;
  const correspondents = data.correspondentsStatus as { description?: string; status?: string } | undefined;
  const description = invoke?.description || correspondents?.description || (data.message as string) || "";
  const status = invoke?.status || correspondents?.status || "";

  const isQuota =
    /quota|QUOTE_ALLOWED|CORRESPONDENTS_QUOTE|tariff/i.test(description) ||
    /quota|QUOTE/i.test(status);

  if (!isQuota && !description) return null;

  const allowedPhones = extractPhonesFromText(description);
  const phones =
    allowedPhones.length > 0 ? allowedPhones : getGreenApiAllowedPhones();

  return {
    title: "Green API plan limit",
    message: isQuota
      ? "Your Green API free/personal monthly quota is finished. Upgrade to Business to send to any number, or use only the test numbers below on the current plan."
      : description,
    allowedPhones: phones,
    upgradeUrl: GREEN_CONSOLE_URL,
    isQuotaError: isQuota
  };
}

export function formatGreenApiErrorForUser(raw: unknown): string {
  const parsed = parseGreenApiError(raw);
  if (!parsed) {
    return typeof raw === "string" ? raw : "Green API send failed";
  }

  const numbers = parsed.allowedPhones.map((p) => `+${p}`).join(", ");
  return `${parsed.title}. ${parsed.message}${
    parsed.allowedPhones.length ? ` Allowed numbers on your plan: ${numbers}.` : ""
  } Upgrade: ${parsed.upgradeUrl}`;
}

export function phoneAllowedOnGreenPlan(phone: string, allowed = getGreenApiAllowedPhones()) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("92") ? digits : digits.startsWith("0") ? `92${digits.slice(1)}` : digits;
  return allowed.some((a) => normalized === a || normalized.endsWith(a) || a.endsWith(normalized));
}
