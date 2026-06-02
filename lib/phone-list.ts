import { toWhatsAppApiPhone } from "./whatsapp-cloud";

/** Parse pasted phone list: one per line, or comma/semicolon separated. */
export function parsePhoneList(raw: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const part of raw.split(/[\n,;]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const digits = trimmed.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 10) continue;

    const normalized = toWhatsAppApiPhone(trimmed);
    if (normalized.length < 10 || seen.has(normalized)) continue;

    seen.add(normalized);
    results.push(normalized);
  }

  return results;
}
