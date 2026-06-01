import type { Lead } from "@prisma/client";
import { personalizeBroadcastMessage } from "./whatsapp-cloud";

/** Real-estate campaign types — each send is a private 1:1 WhatsApp message (never a group). */
export const CAMPAIGN_CATEGORIES = [
  "NEW_PROPERTY_ALERT",
  "RENTAL_LISTING_UPDATE",
  "OFF_PLAN_ANNOUNCEMENT",
  "VIEWING_REMINDER",
  "OPEN_HOUSE_INVITE",
  "COLD_LEAD_REACTIVATION",
  "INVESTOR_CAMPAIGN",
  "PAYMENT_PLAN_UPDATE",
  "BROCHURE_CAMPAIGN",
  "CALLBACK_FOLLOW_UP",
  "AGENT_FOLLOW_UP",
  "CUSTOM"
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

export type BroadcastAudience =
  | "OPTED_IN"
  | "ALL_PHONES"
  | "HOT"
  | "WARM"
  | "COLD"
  | "BUYERS"
  | "TENANTS"
  | "INVESTORS"
  | "SELLERS"
  | "LANDLORDS"
  | "CALLBACKS"
  | "VIEWING_BOOKED"
  | "AGENT_FOLLOW_UP"
  | "SELECTED";

export type LeadForAudience = Pick<Lead, "id" | "name" | "phone" | "type" | "temperature"> & {
  whatsappOptIn?: boolean;
  requiresHumanFollowUp?: boolean;
  hasUpcomingViewing?: boolean;
};

export const BROADCAST_TEMPLATES: Array<{
  id: string;
  category: CampaignCategory;
  title: string;
  description: string;
  defaultAudience: BroadcastAudience;
  message: string;
}> = [
  {
    id: "new_property_alert",
    category: "NEW_PROPERTY_ALERT",
    title: "New property alert",
    description: "Notify buyers when a matching listing goes live",
    defaultAudience: "BUYERS",
    message:
      "Hi {{name}}, we have a new property that may match your search in your preferred area. Reply INTERESTED and our consultant will share full details and arrange a viewing."
  },
  {
    id: "rental_listing_update",
    category: "RENTAL_LISTING_UPDATE",
    title: "Rental listing update",
    description: "Fresh rentals for tenants and relocations",
    defaultAudience: "TENANTS",
    message:
      "Hi {{name}}, new rental listings are available that may suit your budget and area. Reply RENT and we will send options on WhatsApp today."
  },
  {
    id: "off_plan_announcement",
    category: "OFF_PLAN_ANNOUNCEMENT",
    title: "Off-plan project announcement",
    description: "Launch payment plans and handover timelines",
    defaultAudience: "BUYERS",
    message:
      "Hi {{name}}, a new off-plan project with flexible payment plans is now open for booking. Reply PLAN for brochure, floor plans, and consultant callback."
  },
  {
    id: "viewing_reminder",
    category: "VIEWING_REMINDER",
    title: "Viewing reminder",
    description: "Confirm or reschedule upcoming viewings",
    defaultAudience: "VIEWING_BOOKED",
    message:
      "Hi {{name}}, this is a reminder about your upcoming property viewing. Reply YES to confirm or RESCHEDULE if you need a different time."
  },
  {
    id: "open_house_invite",
    category: "OPEN_HOUSE_INVITE",
    title: "Open-house invitation",
    description: "Invite warm leads to a site visit or open house",
    defaultAudience: "WARM",
    message:
      "Hi {{name}}, you are invited to our open-house viewing this week. Reply RSVP and we will confirm your time slot and location."
  },
  {
    id: "cold_lead_reactivation",
    category: "COLD_LEAD_REACTIVATION",
    title: "Cold-lead reactivation",
    description: "Re-engage leads who have gone quiet",
    defaultAudience: "COLD",
    message:
      "Hi {{name}}, we are checking if you are still looking for property in Karachi, Lahore, or Islamabad. Reply YES for updated options or STOP to opt out."
  },
  {
    id: "investor_campaign",
    category: "INVESTOR_CAMPAIGN",
    title: "Investor campaign",
    description: "ROI, rental yield, and portfolio opportunities",
    defaultAudience: "INVESTORS",
    message:
      "Hi {{name}}, new investment opportunities with strong rental yield are available. Reply ROI for a curated investor pack and analyst call."
  },
  {
    id: "payment_plan_update",
    category: "PAYMENT_PLAN_UPDATE",
    title: "Payment-plan update",
    description: "Installment changes for off-plan buyers",
    defaultAudience: "BUYERS",
    message:
      "Hi {{name}}, updated payment-plan options are available on select projects. Reply PLAN for the latest schedule and booking steps."
  },
  {
    id: "brochure_campaign",
    category: "BROCHURE_CAMPAIGN",
    title: "Brochure campaign",
    description: "Send brochure / media pack requests",
    defaultAudience: "HOT",
    message:
      "Hi {{name}}, your property brochure and media pack are ready. Reply SEND and our team will share files on WhatsApp immediately."
  },
  {
    id: "callback_follow_up",
    category: "CALLBACK_FOLLOW_UP",
    title: "Callback follow-up",
    description: "Leads who requested a phone or WhatsApp callback",
    defaultAudience: "CALLBACKS",
    message:
      "Hi {{name}}, following up on your callback request. Our property consultant is available today — reply CALL to confirm your preferred time."
  },
  {
    id: "agent_follow_up",
    category: "AGENT_FOLLOW_UP",
    title: "Agent follow-up",
    description: "Human handover and consultant outreach",
    defaultAudience: "AGENT_FOLLOW_UP",
    message:
      "Hi {{name}}, your dedicated property consultant would like to follow up on your inquiry. Reply when you are free for a quick WhatsApp chat."
  },
  {
    id: "custom_campaign",
    category: "CUSTOM",
    title: "Custom campaign",
    description: "Write your own message and audience",
    defaultAudience: "OPTED_IN",
    message:
      "Hi {{name}}, thank you for connecting with us. Reply to this message and our team will assist you with your property needs."
  }
];

export const CAMPAIGN_CATEGORY_LABELS: Record<CampaignCategory, string> = {
  NEW_PROPERTY_ALERT: "New property alerts",
  RENTAL_LISTING_UPDATE: "Rental listing updates",
  OFF_PLAN_ANNOUNCEMENT: "Off-plan announcements",
  VIEWING_REMINDER: "Viewing reminders",
  OPEN_HOUSE_INVITE: "Open-house invitations",
  COLD_LEAD_REACTIVATION: "Cold-lead reactivation",
  INVESTOR_CAMPAIGN: "Investor campaigns",
  PAYMENT_PLAN_UPDATE: "Payment-plan updates",
  BROCHURE_CAMPAIGN: "Brochure campaigns",
  CALLBACK_FOLLOW_UP: "Callback follow-ups",
  AGENT_FOLLOW_UP: "Agent follow-ups",
  CUSTOM: "Custom campaigns"
};

export const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  OPTED_IN: "Opted-in contacts",
  ALL_PHONES: "All contacts with phone",
  HOT: "Hot leads",
  WARM: "Warm leads",
  COLD: "Cold leads",
  BUYERS: "Buyers",
  TENANTS: "Tenants",
  INVESTORS: "Investors",
  SELLERS: "Sellers",
  LANDLORDS: "Landlords",
  CALLBACKS: "Callback requests",
  VIEWING_BOOKED: "Upcoming viewings",
  AGENT_FOLLOW_UP: "Needs agent follow-up",
  SELECTED: "Hand-picked leads"
};

export function getTemplateByCategory(category: CampaignCategory) {
  return BROADCAST_TEMPLATES.find((t) => t.category === category) ?? BROADCAST_TEMPLATES[BROADCAST_TEMPLATES.length - 1];
}

export function defaultAudienceForCategory(category: CampaignCategory): BroadcastAudience {
  return getTemplateByCategory(category).defaultAudience;
}

/** Only leads who opted in to WhatsApp marketing (default true for legacy rows). */
export function isWhatsAppOptedIn(lead: Pick<LeadForAudience, "whatsappOptIn">) {
  return lead.whatsappOptIn !== false;
}

export function filterLeadsForAudience(
  leads: LeadForAudience[],
  audience: BroadcastAudience,
  selectedLeadIds: string[] = [],
  options?: { requireOptIn?: boolean }
) {
  const requireOptIn = options?.requireOptIn !== false;
  const withPhone = leads.filter((lead) => {
    if (!lead.phone?.trim()) return false;
    if (requireOptIn && !isWhatsAppOptedIn(lead)) return false;
    return true;
  });

  switch (audience) {
    case "HOT":
      return withPhone.filter((lead) => lead.temperature === "HOT");
    case "WARM":
      return withPhone.filter((lead) => lead.temperature === "WARM");
    case "COLD":
      return withPhone.filter((lead) => lead.temperature === "COLD");
    case "BUYERS":
      return withPhone.filter((lead) => lead.type === "BUYER");
    case "TENANTS":
      return withPhone.filter((lead) => lead.type === "TENANT");
    case "INVESTORS":
      return withPhone.filter((lead) => lead.type === "INVESTOR");
    case "SELLERS":
      return withPhone.filter((lead) => lead.type === "SELLER");
    case "LANDLORDS":
      return withPhone.filter((lead) => lead.type === "LANDLORD");
    case "CALLBACKS":
      return withPhone.filter((lead) => lead.type === "CALLBACK");
    case "VIEWING_BOOKED":
      return withPhone.filter((lead) => lead.hasUpcomingViewing);
    case "AGENT_FOLLOW_UP":
      return withPhone.filter((lead) => lead.requiresHumanFollowUp);
    case "SELECTED":
      return withPhone.filter((lead) => selectedLeadIds.includes(lead.id));
    case "ALL_PHONES":
      return withPhone;
    case "OPTED_IN":
    default:
      return withPhone;
  }
}

export function buildRecipientPayloads(
  leads: Pick<Lead, "id" | "name" | "phone">[],
  messageTemplate: string
) {
  const seen = new Set<string>();

  return leads
    .map((lead) => {
      const phone = lead.phone!.trim();
      const normalized = phone.replace(/\D/g, "");
      if (seen.has(normalized)) return null;
      seen.add(normalized);

      return {
        leadId: lead.id,
        phone,
        name: lead.name,
        message: personalizeBroadcastMessage(messageTemplate, lead.name)
      };
    })
    .filter(Boolean) as { leadId: string; phone: string; name: string | null; message: string }[];
}
