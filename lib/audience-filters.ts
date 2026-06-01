import type { LeadStatus, LeadTemperature, LeadType, Prisma, PropertyCategory } from "@prisma/client";
import { prisma } from "./prisma";
import type { BroadcastAudience } from "./broadcast";
import { filterLeadsForAudience, type LeadForAudience } from "./broadcast";

export type CrmAudienceFilters = {
  /** Quick preset layered on top of CRM filters */
  audiencePreset?: BroadcastAudience;
  selectedLeadIds?: string[];
  leadTypes?: LeadType[];
  preferredArea?: string;
  preferredAreas?: string[];
  budgetMin?: number;
  budgetMax?: number;
  propertyType?: string;
  propertyTypes?: string[];
  bedrooms?: string;
  propertyCategory?: PropertyCategory;
  temperatures?: LeadTemperature[];
  scoreMin?: number;
  scoreMax?: number;
  statuses?: LeadStatus[];
  agentId?: string;
  agentIds?: string[];
  sources?: string[];
  tags?: string[];
  tagMatch?: "any" | "all";
  lastInteractionAfter?: string;
  lastInteractionBefore?: string;
  lastWhatsAppAfter?: string;
  lastWhatsAppBefore?: string;
  lastCampaignAfter?: string;
  lastCampaignBefore?: string;
  hasViewingHistory?: boolean;
  hasCallbackHistory?: boolean;
  hasBrochureHistory?: boolean;
  whatsappOptIn?: boolean;
  unsubscribedOnly?: boolean;
  createdAfter?: string;
  createdBefore?: string;
};

export const EMPTY_CRM_FILTERS: CrmAudienceFilters = {
  whatsappOptIn: true,
  audiencePreset: "OPTED_IN"
};

type EnrichedLead = LeadForAudience & {
  email?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredArea?: string | null;
  preferredPropertyType?: string | null;
  bedrooms?: string | null;
  score?: number;
  status?: string;
  source?: string;
  tags?: string[];
  propertyCategoryPreference?: PropertyCategory | null;
  agentId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  lastWhatsAppAt?: Date | null;
  lastCampaignAt?: Date | null;
  lastInteractionAt?: Date | null;
  hasViewingHistory?: boolean;
  hasCallbackHistory?: boolean;
  hasBrochureHistory?: boolean;
  scoreReason?: string[];
};

function parseDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inRange(date: Date | null | undefined, after?: string, before?: string) {
  if (!date) return false;
  const a = parseDate(after);
  const b = parseDate(before);
  if (a && date < a) return false;
  if (b && date > b) return false;
  return true;
}

function matchesArea(lead: EnrichedLead, filters: CrmAudienceFilters) {
  const area = lead.preferredArea?.toLowerCase() || "";
  if (filters.preferredArea?.trim()) {
    return area.includes(filters.preferredArea.trim().toLowerCase());
  }
  if (filters.preferredAreas?.length) {
    return filters.preferredAreas.some((a) => area.includes(a.toLowerCase()));
  }
  return true;
}

function matchesTags(lead: EnrichedLead, filters: CrmAudienceFilters) {
  if (!filters.tags?.length) return true;
  const leadTags = lead.tags || [];
  if (filters.tagMatch === "all") {
    return filters.tags.every((t) => leadTags.includes(t));
  }
  return filters.tags.some((t) => leadTags.includes(t));
}

function matchesBrochure(lead: EnrichedLead) {
  if (lead.hasBrochureHistory) return true;
  return (lead.scoreReason || []).some((r) => /brochure|media|pack/i.test(r));
}

export function applyCrmFilters(leads: EnrichedLead[], filters: CrmAudienceFilters) {
  return leads.filter((lead) => {
    if (!lead.phone?.trim()) return false;

    if (filters.unsubscribedOnly) {
      if (lead.whatsappOptIn !== false) return false;
    } else if (filters.whatsappOptIn !== false && lead.whatsappOptIn === false) {
      return false;
    }

    if (filters.leadTypes?.length && !filters.leadTypes.includes(lead.type as LeadType)) return false;

    if (!matchesArea(lead, filters)) return false;

    if (filters.budgetMin != null && (lead.budgetMax == null || lead.budgetMax < filters.budgetMin)) return false;
    if (filters.budgetMax != null && (lead.budgetMin == null || lead.budgetMin > filters.budgetMax)) return false;

    const propType = lead.preferredPropertyType?.toLowerCase() || "";
    if (filters.propertyType?.trim() && !propType.includes(filters.propertyType.trim().toLowerCase())) return false;
    if (filters.propertyTypes?.length) {
      const ok = filters.propertyTypes.some((p) => propType.includes(p.toLowerCase()));
      if (!ok) return false;
    }

    if (filters.bedrooms?.trim() && lead.bedrooms !== filters.bedrooms) return false;

    if (filters.propertyCategory) {
      const pref = `${lead.propertyCategoryPreference || ""} ${propType} ${lead.preferredPropertyType || ""}`;
      if (filters.propertyCategory === "OFF_PLAN" && !/off.?plan|offplan/i.test(pref)) return false;
      if (filters.propertyCategory === "READY" && /off.?plan|offplan/i.test(pref)) return false;
    }

    if (filters.temperatures?.length && !filters.temperatures.includes(lead.temperature as LeadTemperature)) {
      return false;
    }

    if (filters.scoreMin != null && (lead.score ?? 0) < filters.scoreMin) return false;
    if (filters.scoreMax != null && (lead.score ?? 0) > filters.scoreMax) return false;

    if (filters.statuses?.length && !filters.statuses.includes(lead.status as LeadStatus)) return false;

    const agentIds = filters.agentIds?.length ? filters.agentIds : filters.agentId ? [filters.agentId] : [];
    if (agentIds.length && (!lead.agentId || !agentIds.includes(lead.agentId))) return false;

    if (filters.sources?.length && !filters.sources.includes(lead.source || "")) return false;

    if (!matchesTags(lead, filters)) return false;

    if (filters.hasViewingHistory === true && !lead.hasUpcomingViewing && !lead.hasViewingHistory) return false;
    if (filters.hasViewingHistory === false && (lead.hasViewingHistory || lead.hasUpcomingViewing)) return false;

    if (filters.hasCallbackHistory === true && !lead.hasCallbackHistory && lead.type !== "CALLBACK") return false;
    if (filters.hasCallbackHistory === false && (lead.hasCallbackHistory || lead.type === "CALLBACK")) return false;

    if (filters.hasBrochureHistory === true && !matchesBrochure(lead)) return false;
    if (filters.hasBrochureHistory === false && matchesBrochure(lead)) return false;

    if (
      (filters.lastInteractionAfter || filters.lastInteractionBefore) &&
      !inRange(lead.lastInteractionAt, filters.lastInteractionAfter, filters.lastInteractionBefore)
    ) {
      return false;
    }

    if (
      (filters.lastWhatsAppAfter || filters.lastWhatsAppBefore) &&
      !inRange(lead.lastWhatsAppAt, filters.lastWhatsAppAfter, filters.lastWhatsAppBefore)
    ) {
      return false;
    }

    if (
      (filters.lastCampaignAfter || filters.lastCampaignBefore) &&
      !inRange(lead.lastCampaignAt, filters.lastCampaignAfter, filters.lastCampaignBefore)
    ) {
      return false;
    }

    if (filters.createdAfter || filters.createdBefore) {
      if (!inRange(lead.createdAt, filters.createdAfter, filters.createdBefore)) return false;
    }

    return true;
  });
}

export async function queryLeadsForCrmAudience(filters: CrmAudienceFilters = EMPTY_CRM_FILTERS) {
  const upcoming = await prisma.viewingBooking.findMany({
    where: {
      preferredAt: { gte: new Date() },
      leadId: { not: null },
      status: { notIn: ["CANCELLED", "CANCELED", "cancelled"] }
    },
    select: { leadId: true },
    distinct: ["leadId"]
  });
  const upcomingSet = new Set(upcoming.map((b) => b.leadId!));

  const where: Prisma.LeadWhereInput = {
    phone: { not: null }
  };

  if (filters.unsubscribedOnly) {
    where.whatsappOptIn = false;
  } else if (filters.audiencePreset === "ALL_PHONES") {
    // Include all contacts with a phone number regardless of opt-in flag.
  } else if (filters.whatsappOptIn !== false) {
    // Treat null/legacy rows as opted-in (only explicit false opts out).
    where.whatsappOptIn = { not: false };
  }

  if (filters.leadTypes?.length) where.type = { in: filters.leadTypes };
  if (filters.temperatures?.length) where.temperature = { in: filters.temperatures };
  if (filters.statuses?.length) where.status = { in: filters.statuses };
  if (filters.scoreMin != null || filters.scoreMax != null) {
    where.score = {};
    if (filters.scoreMin != null) where.score.gte = filters.scoreMin;
    if (filters.scoreMax != null) where.score.lte = filters.scoreMax;
  }
  if (filters.agentIds?.length) where.agentId = { in: filters.agentIds };
  else if (filters.agentId) where.agentId = filters.agentId;
  if (filters.sources?.length) where.source = { in: filters.sources };
  if (filters.bedrooms?.trim()) where.bedrooms = filters.bedrooms;

  const createdAfter = parseDate(filters.createdAfter);
  const createdBefore = parseDate(filters.createdBefore);
  if (createdAfter || createdBefore) {
    where.createdAt = {};
    if (createdAfter && createdBefore && createdAfter > createdBefore) {
      where.createdAt.gte = createdBefore;
      where.createdAt.lte = createdAfter;
    } else {
      if (createdAfter) where.createdAt.gte = createdAfter;
      if (createdBefore) where.createdAt.lte = createdBefore;
    }
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      inboundMessages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      broadcastRecipients: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true, createdAt: true }
      },
      bookings: { select: { id: true } },
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const enriched: EnrichedLead[] = leads.map((lead) => {
    const lastInbound = lead.inboundMessages[0]?.createdAt ?? null;
    const lastChat = lead.conversation?.messages[0]?.createdAt ?? null;
    const lastCampaign =
      lead.broadcastRecipients[0]?.sentAt ?? lead.broadcastRecipients[0]?.createdAt ?? null;
    const lastInteraction = [lead.updatedAt, lastInbound, lastChat].filter(Boolean).sort(
      (a, b) => (b as Date).getTime() - (a as Date).getTime()
    )[0] as Date | undefined;

    const reasons = lead.scoreReason || [];
    const hasBrochureHistory = reasons.some((r) => /brochure|media|pack/i.test(r));

    return {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      type: lead.type,
      temperature: lead.temperature,
      whatsappOptIn: lead.whatsappOptIn,
      requiresHumanFollowUp: lead.requiresHumanFollowUp,
      hasUpcomingViewing: upcomingSet.has(lead.id),
      email: lead.email,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      preferredArea: lead.preferredArea,
      preferredPropertyType: lead.preferredPropertyType,
      bedrooms: lead.bedrooms,
      score: lead.score,
      status: lead.status,
      source: lead.source,
      tags: "tags" in lead ? (lead as { tags: string[] }).tags : [],
      propertyCategoryPreference:
        "propertyCategoryPreference" in lead
          ? (lead as { propertyCategoryPreference: PropertyCategory | null }).propertyCategoryPreference
          : null,
      agentId: lead.agentId,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      scoreReason: reasons,
      lastWhatsAppAt: lastInbound,
      lastCampaignAt: lastCampaign,
      lastInteractionAt: lastInteraction ?? lead.updatedAt,
      hasViewingHistory: lead.bookings.length > 0,
      hasCallbackHistory: lead.type === "CALLBACK" || lead.requiresHumanFollowUp,
      hasBrochureHistory
    };
  });

  let filtered = applyCrmFilters(enriched, filters);

  if (filters.audiencePreset && filters.audiencePreset !== "SELECTED") {
    filtered = filterLeadsForAudience(filtered, filters.audiencePreset, [], {
      requireOptIn: !filters.unsubscribedOnly
    });
  }

  if (filters.selectedLeadIds?.length) {
    const set = new Set(filters.selectedLeadIds);
    filtered = filtered.filter((l) => set.has(l.id));
  }

  if (filters.audiencePreset === "SELECTED" && filters.selectedLeadIds?.length) {
    filtered = filterLeadsForAudience(filtered, "SELECTED", filters.selectedLeadIds, {
      requireOptIn: !filters.unsubscribedOnly
    });
  }

  return filtered;
}

export async function getAudienceFilterOptions() {
  const [areas, sources, agents, propertyTypes, tagsRows] = await Promise.all([
    prisma.lead.findMany({
      where: { preferredArea: { not: null } },
      select: { preferredArea: true },
      distinct: ["preferredArea"]
    }),
    prisma.lead.findMany({ select: { source: true }, distinct: ["source"] }),
    prisma.agent.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: { preferredPropertyType: { not: null } },
      select: { preferredPropertyType: true },
      distinct: ["preferredPropertyType"]
    }),
    prisma.lead.findMany({ select: { tags: true } })
  ]);

  const tagSet = new Set<string>();
  tagsRows.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));

  return {
    areas: areas.map((a) => a.preferredArea!).filter(Boolean).sort(),
    sources: sources.map((s) => s.source).sort(),
    agents,
    propertyTypes: propertyTypes.map((p) => p.preferredPropertyType!).filter(Boolean).sort(),
    tags: [...tagSet].sort(),
    leadTypes: ["BUYER", "TENANT", "INVESTOR", "SELLER", "LANDLORD", "VIEWING", "CALLBACK"],
    temperatures: ["HOT", "WARM", "COLD"],
    statuses: [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "VIEWING_SCHEDULED",
      "FOLLOW_UP_REQUIRED",
      "NEGOTIATION",
      "CONVERTED",
      "LOST",
      "ARCHIVED"
    ],
    propertyCategories: ["READY", "OFF_PLAN"]
  };
}