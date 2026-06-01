import type { CrmAudienceFilters } from "./audience-filters";
import type { BroadcastAudience } from "./broadcast";

export function sanitizeCrmFilters(filters: CrmAudienceFilters): CrmAudienceFilters {
  const next: CrmAudienceFilters = { ...filters };

  const intKeys = ["budgetMin", "budgetMax", "scoreMin", "scoreMax"] as const;
  for (const key of intKeys) {
    const value = next[key];
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      delete next[key];
    }
  }

  const stringKeys = [
    "preferredArea",
    "propertyType",
    "bedrooms",
    "agentId",
    "lastInteractionAfter",
    "lastInteractionBefore",
    "lastWhatsAppAfter",
    "lastWhatsAppBefore",
    "lastCampaignAfter",
    "lastCampaignBefore",
    "createdAfter",
    "createdBefore"
  ] as const;

  for (const key of stringKeys) {
    const value = next[key];
    if (typeof value === "string" && !value.trim()) {
      delete next[key];
    }
  }

  if (next.tags?.length === 0) delete next.tags;
  if (next.leadTypes?.length === 0) delete next.leadTypes;
  if (next.temperatures?.length === 0) delete next.temperatures;
  if (next.statuses?.length === 0) delete next.statuses;
  if (next.sources?.length === 0) delete next.sources;

  return next;
}

export function buildCampaignRequestBody(input: {
  title: string;
  message: string;
  category?: string;
  audience: BroadcastAudience;
  crmFilters: CrmAudienceFilters;
  selectedLeadIds: string[];
  scheduledAt: string;
  followUpSequenceId: string;
  sendNow: boolean;
}) {
  const preset = (input.crmFilters.audiencePreset || input.audience) as BroadcastAudience;
  const filters = sanitizeCrmFilters({
    ...input.crmFilters,
    audiencePreset: preset,
    whatsappOptIn:
      input.crmFilters.unsubscribedOnly || preset === "ALL_PHONES"
        ? undefined
        : input.crmFilters.whatsappOptIn ?? true,
    selectedLeadIds:
      (input.crmFilters.audiencePreset || input.audience) === "SELECTED"
        ? input.selectedLeadIds
        : undefined
  });

  const sendNow = Boolean(input.sendNow);
  const scheduledAt =
    !sendNow && input.scheduledAt?.trim()
      ? new Date(input.scheduledAt).toISOString()
      : null;

  return {
    title: input.title.trim(),
    message: input.message.trim(),
    category: input.category,
    audience: preset,
    crmFilters: filters,
    selectedLeadIds: filters.selectedLeadIds,
    scheduledAt,
    followUpSequenceId: input.followUpSequenceId || null,
    sendNow
  };
}
