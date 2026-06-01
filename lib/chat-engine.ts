import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { defaultBrandSettings, type BrandSettings } from "./brand-settings";

export type ChatHistoryItem = { role: "user" | "assistant"; content: string };

export type ChatProperty = {
  id: string;
  ref: string;
  title: string;
  area: string;
  city: string;
  price: number;
  currency: string;
  bedrooms: string;
  propertyType: string;
  listingPurpose: string;
  category: string;
  sizeSqFt: number;
};

export type ChatResult = {
  message: string;
  intent: string;
  suggestions: string[];
  properties: ChatProperty[];
  aiPowered: boolean;
  leadHint?: {
    type: string;
    name?: string;
    phone?: string;
    email?: string;
    preferredArea?: string;
    budgetMax?: number;
  };
};

type UserPreferences = {
  purpose?: "SALE" | "RENT";
  area?: string;
  city?: string;
  bedrooms?: string;
  budgetMax?: number;
  propertyType?: string;
  category?: "READY" | "OFF_PLAN";
  name?: string;
  phone?: string;
  email?: string;
  wantsAgent?: boolean;
  wantsViewing?: boolean;
};

const PAKISTAN_AREAS = [
  "DHA Phase 6",
  "DHA Phase 8",
  "DHA",
  "Clifton",
  "Bahria Town",
  "Gulberg",
  "Johar Town",
  "F-7",
  "Islamabad",
  "Karachi",
  "Lahore"
];

const INTENT_KEYWORDS: Record<string, string[]> = {
  BUYER: ["buy", "purchase", "own", "investment property", "for sale"],
  TENANT: ["rent", "rental", "lease", "tenant"],
  INVESTOR: ["invest", "off-plan", "off plan", "roi", "return", "development"],
  VIEWING: ["viewing", "visit", "see the property", "book a tour", "schedule"],
  CALLBACK: ["agent", "callback", "call me", "speak with", "human", "consultant"],
  SELLER: ["sell my", "list my property", "sell property"],
  LANDLORD: ["list a rental", "rent out", "landlord"]
};

async function readBrandSettings(): Promise<BrandSettings> {
  try {
    const settingsPath = path.join(process.cwd(), "data", "brand-settings.json");
    const raw = await readFile(settingsPath, "utf-8");
    return { ...defaultBrandSettings, ...JSON.parse(raw) };
  } catch {
    return defaultBrandSettings;
  }
}

function formatPrice(price: number, symbol = "Rs ") {
  if (price >= 10_000_000) return `${symbol}${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000) return `${symbol}${(price / 100_000).toFixed(1)} Lakh`;
  return `${symbol}${price.toLocaleString("en-PK")}`;
}

function mapProperty(property: {
  id: string;
  ref: string;
  title: string;
  area: string;
  city: string;
  price: number;
  currency: string;
  bedrooms: string;
  propertyType: string;
  listingPurpose: string;
  category: string;
  sizeSqFt: number;
}): ChatProperty {
  return {
    id: property.id,
    ref: property.ref,
    title: property.title,
    area: property.area,
    city: property.city,
    price: property.price,
    currency: property.currency,
    bedrooms: property.bedrooms,
    propertyType: property.propertyType,
    listingPurpose: property.listingPurpose,
    category: property.category,
    sizeSqFt: property.sizeSqFt
  };
}

function parseBudget(text: string): number | undefined {
  const lower = text.toLowerCase();
  const croreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr\b)/);
  if (croreMatch) return Math.round(parseFloat(croreMatch[1]) * 10_000_000);

  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac\b)/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100_000);

  const millionMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:million|m\b)/);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1_000_000);

  const numericMatch = lower.match(/(?:budget|under|max|upto|up to|around|about)\s*(?:pkr|rs\.?)?\s*([\d,]+)/);
  if (numericMatch) return parseInt(numericMatch[1].replace(/,/g, ""), 10);

  const plainNumber = lower.match(/\b(\d{7,9})\b/);
  if (plainNumber) return parseInt(plainNumber[1], 10);

  return undefined;
}

function parseBedrooms(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\bstudio\b/.test(lower)) return "Studio";
  const match = lower.match(/\b(\d+)\s*(?:bed|bedroom|br|bhk)\b/);
  if (match) return match[1];
  return undefined;
}

function parsePhone(text: string): string | undefined {
  const match = text.match(/(?:\+92|0)3[\d\s-]{9,11}/);
  return match ? match[0].replace(/[\s-]/g, "") : undefined;
}

function parseEmail(text: string): string | undefined {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match?.[0];
}

function parseName(text: string): string | undefined {
  const patterns = [
    /(?:my name is|i am|i'm|this is)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i,
    /^([A-Za-z][A-Za-z\s'-]{1,40}),?\s*(?:\+92|0)?3[\d-]/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function detectIntent(text: string): string {
  const lower = text.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return intent;
  }
  return "GENERAL";
}

function extractPreferences(history: ChatHistoryItem[], message: string): UserPreferences {
  const combined = [...history.filter((item) => item.role === "user").map((item) => item.content), message].join(" ");
  const lower = combined.toLowerCase();
  const prefs: UserPreferences = {};

  if (/(rent|rental|lease)/.test(lower)) prefs.purpose = "RENT";
  else if (/(buy|purchase|sale|invest|off-plan|off plan)/.test(lower)) prefs.purpose = "SALE";

  if (/(off-plan|off plan|new development)/.test(lower)) prefs.category = "OFF_PLAN";
  else if (/(ready|move-in|move in)/.test(lower)) prefs.category = "READY";

  for (const area of PAKISTAN_AREAS) {
    if (lower.includes(area.toLowerCase())) {
      prefs.area = area;
      break;
    }
  }

  if (lower.includes("karachi")) prefs.city = "Karachi";
  if (lower.includes("lahore")) prefs.city = "Lahore";
  if (lower.includes("islamabad")) prefs.city = "Islamabad";

  const bedrooms = parseBedrooms(combined);
  if (bedrooms) prefs.bedrooms = bedrooms;

  const budget = parseBudget(combined);
  if (budget) prefs.budgetMax = budget;

  if (/villa/.test(lower)) prefs.propertyType = "Villa";
  else if (/apartment|flat/.test(lower)) prefs.propertyType = "Apartment";

  prefs.phone = parsePhone(combined);
  prefs.email = parseEmail(combined);
  prefs.name = parseName(combined);
  prefs.wantsAgent = /(agent|consultant|callback|call me|speak with)/.test(lower);
  prefs.wantsViewing = /(viewing|visit|see the property|book a tour)/.test(lower);

  return prefs;
}

async function searchProperties(prefs: UserPreferences, limit = 3) {
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (prefs.purpose) where.listingPurpose = prefs.purpose;
  if (prefs.category) where.category = prefs.category;
  if (prefs.city) where.city = { contains: prefs.city, mode: "insensitive" };
  if (prefs.area) where.area = { contains: prefs.area, mode: "insensitive" };
  if (prefs.bedrooms) where.bedrooms = prefs.bedrooms;
  if (prefs.propertyType) where.propertyType = { contains: prefs.propertyType, mode: "insensitive" };
  if (prefs.budgetMax) where.price = { lte: prefs.budgetMax };

  let properties = await prisma.property.findMany({
    where,
    orderBy: [{ featured: "desc" }, { price: "asc" }],
    take: limit
  });

  if (properties.length === 0 && (prefs.area || prefs.budgetMax || prefs.purpose)) {
    properties = await prisma.property.findMany({
      where: {
        status: "ACTIVE",
        ...(prefs.purpose ? { listingPurpose: prefs.purpose } : {}),
        ...(prefs.budgetMax ? { price: { lte: Math.round(prefs.budgetMax * 1.25) } } : {})
      },
      orderBy: [{ featured: "desc" }, { price: "asc" }],
      take: limit
    });
  }

  if (properties.length === 0) {
    properties = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit
    });
  }

  return properties.map(mapProperty);
}

async function buildContext() {
  const [properties, faqs, brand] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 12
    }),
    prisma.fAQ.findMany({ where: { active: true }, take: 8 }),
    readBrandSettings()
  ]);

  return { properties: properties.map(mapProperty), faqs, brand };
}

function buildSuggestions(intent: string, prefs: UserPreferences, hasProperties: boolean): string[] {
  if (prefs.wantsAgent && !prefs.phone) {
    return ["Share my phone number", "WhatsApp me instead", "Show matching properties"];
  }

  if (prefs.wantsViewing && !prefs.phone) {
    return ["Book viewing for top match", "Share my contact details", "See more options"];
  }

  switch (intent) {
    case "BUYER":
      return hasProperties
        ? ["Compare these options", "Book a viewing", "Speak with an agent"]
        : ["DHA Karachi", "Under 3 Crore", "2 bedroom apartment"];
    case "TENANT":
      return hasProperties
        ? ["Schedule a visit", "Show cheaper rentals", "Speak with an agent"]
        : ["DHA rental", "Furnished 2BR", "Under 4 Lakh/year"];
    case "INVESTOR":
      return hasProperties
        ? ["Payment plan details", "Expected handover", "Speak with investment advisor"]
        : ["Off-plan Lahore", "Gulberg projects", "Budget under 2 Crore"];
    case "VIEWING":
      return ["Tomorrow afternoon", "This weekend", "Share my phone number"];
    case "CALLBACK":
      return ["Call me today", "WhatsApp is better", "Show properties first"];
    default:
      return hasProperties
        ? ["Tell me more about the first one", "Book a viewing", "Speak with an agent"]
        : ["Buy in Karachi", "Rent in Lahore", "Off-plan investments"];
  }
}

function buildLeadHint(intent: string, prefs: UserPreferences) {
  if (!prefs.phone && !prefs.email && !prefs.wantsAgent && !prefs.wantsViewing) return undefined;
  if (!prefs.phone && !prefs.email) return undefined;

  return {
    type: intent === "GENERAL" ? (prefs.wantsViewing ? "VIEWING" : "CALLBACK") : intent,
    name: prefs.name,
    phone: prefs.phone,
    email: prefs.email,
    preferredArea: prefs.area,
    budgetMax: prefs.budgetMax
  };
}

function generateSmartResponse(
  message: string,
  history: ChatHistoryItem[],
  prefs: UserPreferences,
  properties: ChatProperty[],
  faqs: { question: string; answer: string }[],
  brand: BrandSettings
): ChatResult {
  const intent = detectIntent(message);
  const symbol = brand.symbol || "Rs ";
  const lower = message.toLowerCase();

  const faq = faqs.find(
    (item) =>
      lower.includes(item.question.toLowerCase().slice(0, 20)) ||
      item.question.toLowerCase().split(" ").some((word) => word.length > 4 && lower.includes(word))
  );

  if (faq) {
    return {
      message: faq.answer,
      intent: "FAQ",
      suggestions: buildSuggestions(intent, prefs, properties.length > 0),
      properties: properties.slice(0, 2),
      aiPowered: false
    };
  }

  if (prefs.wantsAgent || intent === "CALLBACK") {
    const contactLine = prefs.phone
      ? `Thanks${prefs.name ? `, ${prefs.name}` : ""}. I have noted your number (${prefs.phone}). A property consultant from ${brand.agencyName} will reach out shortly.`
      : `I can connect you with a senior consultant at ${brand.agencyName}. Please share your name and phone number, or tap WhatsApp for instant support.`;

    return {
      message: contactLine,
      intent: "CALLBACK",
      suggestions: buildSuggestions("CALLBACK", prefs, properties.length > 0),
      properties: properties.slice(0, 2),
      aiPowered: false,
      leadHint: buildLeadHint("CALLBACK", prefs)
    };
  }

  if (properties.length > 0 && (prefs.area || prefs.budgetMax || prefs.bedrooms || prefs.purpose || /show|find|recommend|option|property|properties/.test(lower))) {
    const intro = prefs.purpose === "RENT"
      ? `Based on your rental preferences${prefs.area ? ` in ${prefs.area}` : ""}${prefs.budgetMax ? ` under ${formatPrice(prefs.budgetMax, symbol)}/year` : ""}, here are my top matches:`
      : `Based on your search${prefs.area ? ` in ${prefs.area}` : ""}${prefs.budgetMax ? ` under ${formatPrice(prefs.budgetMax, symbol)}` : ""}, I found these strong options:`;

    const lines = properties.map(
      (property, index) =>
        `${index + 1}. **${property.title}** (${property.ref}) — ${property.bedrooms} bed ${property.propertyType.toLowerCase()} in ${property.area}, ${property.city}. ${formatPrice(property.price, symbol)}${property.listingPurpose === "RENT" ? "/year" : ""}.`
    );

    const followUp = prefs.phone
      ? "Would you like to book a viewing for any of these?"
      : "Tell me which one interests you, or share your phone number and I will arrange a viewing.";

    return {
      message: `${intro}\n\n${lines.join("\n")}\n\n${followUp}`,
      intent: intent === "GENERAL" ? (prefs.purpose === "RENT" ? "TENANT" : "BUYER") : intent,
      suggestions: buildSuggestions(intent, prefs, true),
      properties,
      aiPowered: false,
      leadHint: buildLeadHint(intent, prefs)
    };
  }

  const responses: Record<string, string> = {
    BUYER: `Great choice. I can help you buy in ${brand.city} and across Pakistan. Tell me your preferred area (e.g. DHA, Clifton, Gulberg), budget in PKR, and bedrooms — I will instantly match live listings from our database.`,
    TENANT: `I can find rental homes across ${brand.city}. Share the area, property type, number of bedrooms, and annual budget — I will recommend verified options right away.`,
    INVESTOR: `For off-plan and investment opportunities, share your target city, budget range, and whether you prefer apartments or villas. I will shortlist projects with payment plans from our inventory.`,
    VIEWING: `I can schedule a viewing for you. Share the property reference (e.g. PC-1001), your preferred date/time, name, and phone number.`,
    SELLER: `We can help you sell or list your property. Share the location, property type, size, and expected price — a consultant will follow up with a valuation plan.`,
    LANDLORD: `We can list your rental property professionally. Share the area, bedrooms, expected annual rent, and your contact number.`,
    GENERAL: `I'm your AI property advisor for ${brand.agencyName}. I can search live listings, compare prices, answer FAQs, book viewings, and connect you with agents across Pakistan. What are you looking for today?`
  };

  return {
    message: responses[intent] || responses.GENERAL,
    intent,
    suggestions: buildSuggestions(intent, prefs, false),
    properties: [],
    aiPowered: false
  };
}

async function callOpenAI(
  message: string,
  history: ChatHistoryItem[],
  context: { properties: ChatProperty[]; faqs: { question: string; answer: string }[]; brand: BrandSettings },
  prefs: UserPreferences
): Promise<ChatResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const propertyContext = context.properties
    .map(
      (property) =>
        `[${property.ref}] ${property.title} | ${property.listingPurpose} | ${property.category} | ${property.bedrooms} bed ${property.propertyType} | ${property.area}, ${property.city} | ${property.price} ${property.currency} | ${property.sizeSqFt} sq ft`
    )
    .join("\n");

  const faqContext = context.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n");

  const systemPrompt = `You are ${context.brand.botName}, an advanced AI property advisor for ${context.brand.agencyName} in ${context.brand.country}.
You help users buy, rent, invest in, sell, and view properties. Currency: ${context.brand.currency}. Default city: ${context.brand.city}.

Rules:
- Only recommend properties from the LIVE LISTINGS below. Never invent listings.
- When recommending properties, mention their ref code (e.g. PC-1001).
- Be conversational, concise, and proactive. Ask one smart follow-up question when helpful.
- Use PKR formatting (Lakh/Crore) when discussing prices.
- If the user shares contact details, acknowledge and confirm a consultant will follow up.
- If you cannot answer from listings/FAQs, offer to connect them with a human agent.

LIVE LISTINGS:
${propertyContext || "No listings loaded."}

FAQs:
${faqContext || "No FAQs loaded."}

User preferences detected: ${JSON.stringify(prefs)}

Respond in JSON only:
{
  "message": "your reply in plain text, use **bold** for property names",
  "intent": "BUYER|TENANT|INVESTOR|VIEWING|CALLBACK|FAQ|GENERAL|SELLER|LANDLORD",
  "suggestions": ["3 short follow-up chips"],
  "propertyRefs": ["PC-1001"]
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8).map((item) => ({ role: item.role, content: item.content })),
    { role: "user", content: message }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      message: string;
      intent?: string;
      suggestions?: string[];
      propertyRefs?: string[];
    };

    const refs = parsed.propertyRefs || [];
    const matched = context.properties.filter((property) => refs.includes(property.ref));
    const intent = parsed.intent || detectIntent(message);

    return {
      message: parsed.message,
      intent,
      suggestions: parsed.suggestions?.slice(0, 4) || buildSuggestions(intent, prefs, matched.length > 0),
      properties: matched.length > 0 ? matched : (await searchProperties(prefs, 3)).slice(0, refs.length || 0),
      aiPowered: true,
      leadHint: buildLeadHint(intent, prefs)
    };
  } catch {
    return null;
  }
}

export async function processChatMessage(message: string, history: ChatHistoryItem[] = []): Promise<ChatResult> {
  const context = await buildContext();
  const prefs = extractPreferences(history, message);
  const intent = detectIntent(message);
  const matchedProperties = await searchProperties(prefs, 3);

  const aiResult = await callOpenAI(message, history, context, prefs);
  if (aiResult) return aiResult;

  return generateSmartResponse(message, history, prefs, matchedProperties, context.faqs, context.brand);
}

export { detectIntent, extractPreferences, formatPrice };
