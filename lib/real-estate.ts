export const REAL_ESTATE_SERVICES = [
  {
    title: "Buy Property",
    description: "Find apartments, villas, and plots for sale across Pakistan with AI-matched recommendations.",
    icon: "home",
    action: "Buy a property"
  },
  {
    title: "Rent Property",
    description: "Discover furnished and unfurnished rentals in DHA, Clifton, Gulberg, and top neighborhoods.",
    icon: "key",
    action: "Rent a property"
  },
  {
    title: "Sell Property",
    description: "List your property with professional marketing, lead capture, and agent follow-up.",
    icon: "tag",
    action: "Sell my property"
  },
  {
    title: "Off-Plan Investment",
    description: "Explore new developments with flexible payment plans and handover timelines.",
    icon: "trending",
    action: "Invest in real estate"
  },
  {
    title: "Property Valuation",
    description: "Get market-aware price guidance based on area, size, and current inventory trends.",
    icon: "chart",
    action: "Speak with an agent"
  },
  {
    title: "Viewing & Tours",
    description: "Schedule property visits with our consultants in Karachi, Lahore, and Islamabad.",
    icon: "calendar",
    action: "Book a viewing"
  }
] as const;

export const POPULAR_AREAS = [
  { city: "Karachi", areas: ["DHA Phase 6", "DHA Phase 8", "Clifton", "Bahria Town"], count: "120+" },
  { city: "Lahore", areas: ["DHA", "Gulberg", "Johar Town", "Bahria Town"], count: "95+" },
  { city: "Islamabad", areas: ["F-7", "F-8", "Bahria Town", "DHA"], count: "60+" }
] as const;

export const WHY_CHOOSE_US = [
  { title: "Verified Listings", description: "Every property is checked against live inventory before recommendation." },
  { title: "AI Property Advisor", description: "24/7 intelligent search, budget parsing, and instant matching in PKR." },
  { title: "Expert Agents", description: "Licensed consultants for buying, renting, investing, and selling." },
  { title: "End-to-End Support", description: "From first inquiry to viewing, negotiation, and handover." }
] as const;

export const AGENCY_STATS = [
  { label: "Active Listings", key: "listings" as const },
  { label: "Cities Covered", key: "cities" as const },
  { label: "Expert Agents", key: "agents" as const },
  { label: "Off-Plan Projects", key: "offPlan" as const }
];
