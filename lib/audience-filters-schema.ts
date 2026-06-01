import { z } from "zod";

const optionalInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}, z.number().int().optional());

const optionalDateString = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return String(value);
}, z.string().optional());

export const crmFiltersObjectSchema = z.object({
  audiencePreset: z
    .enum([
      "OPTED_IN",
      "ALL_PHONES",
      "HOT",
      "WARM",
      "COLD",
      "BUYERS",
      "TENANTS",
      "INVESTORS",
      "SELLERS",
      "LANDLORDS",
      "CALLBACKS",
      "VIEWING_BOOKED",
      "AGENT_FOLLOW_UP",
      "SELECTED"
    ])
    .optional(),
  selectedLeadIds: z.array(z.string()).optional(),
  leadTypes: z
    .array(z.enum(["BUYER", "TENANT", "INVESTOR", "SELLER", "LANDLORD", "VIEWING", "CALLBACK"]))
    .optional(),
  preferredArea: z.string().optional(),
  preferredAreas: z.array(z.string()).optional(),
  budgetMin: optionalInt,
  budgetMax: optionalInt,
  propertyType: z.string().optional(),
  propertyTypes: z.array(z.string()).optional(),
  bedrooms: z.string().optional(),
  propertyCategory: z.enum(["READY", "OFF_PLAN"]).optional(),
  temperatures: z.array(z.enum(["HOT", "WARM", "COLD"])).optional(),
  scoreMin: optionalInt,
  scoreMax: optionalInt,
  statuses: z
    .array(
      z.enum([
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "VIEWING_SCHEDULED",
        "FOLLOW_UP_REQUIRED",
        "NEGOTIATION",
        "CONVERTED",
        "LOST",
        "ARCHIVED"
      ])
    )
    .optional(),
  agentId: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  tagMatch: z.enum(["any", "all"]).optional(),
  lastInteractionAfter: optionalDateString,
  lastInteractionBefore: optionalDateString,
  lastWhatsAppAfter: optionalDateString,
  lastWhatsAppBefore: optionalDateString,
  lastCampaignAfter: optionalDateString,
  lastCampaignBefore: optionalDateString,
  hasViewingHistory: z.boolean().optional(),
  hasCallbackHistory: z.boolean().optional(),
  hasBrochureHistory: z.boolean().optional(),
  whatsappOptIn: z.boolean().optional(),
  unsubscribedOnly: z.boolean().optional(),
  createdAfter: optionalDateString,
  createdBefore: optionalDateString
});

export const crmFiltersSchema = crmFiltersObjectSchema.optional();
