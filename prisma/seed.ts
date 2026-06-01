import { PrismaClient, ListingPurpose, PropertyCategory, PropertyStatus, LeadType, LeadTemperature } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@propertyconnect.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "PropertyConnect Admin", role: "ADMIN" }
  });

  const agents = [
    { name: "Sara Khan", email: "sara@propertyconnect.local", phone: "+923001234501", languages: ["English", "Urdu"] },
    { name: "Omar Ali", email: "omar@propertyconnect.local", phone: "+923001234502", languages: ["English", "Urdu"] },
    { name: "Ayesha Noor", email: "ayesha@propertyconnect.local", phone: "+923001234503", languages: ["English", "Urdu"] }
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { email: agent.email },
      update: { phone: agent.phone, languages: agent.languages },
      create: agent
    });
  }

  const sara = await prisma.agent.findUniqueOrThrow({ where: { email: "sara@propertyconnect.local" } });
  const omar = await prisma.agent.findUniqueOrThrow({ where: { email: "omar@propertyconnect.local" } });
  const ayesha = await prisma.agent.findUniqueOrThrow({ where: { email: "ayesha@propertyconnect.local" } });

  const properties = [
    ["PC-1001", "dha-phase-6-2br-apartment", "DHA Phase 6 2BR Apartment", "DHA Phase 6", "Karachi", "Apartment", "2", 2, 1180, 28500000, ListingPurpose.SALE, PropertyCategory.READY, sara.id],
    ["PC-1002", "clifton-1br-residence", "Clifton 1BR Residence", "Clifton", "Karachi", "Apartment", "1", 1, 780, 22000000, ListingPurpose.SALE, PropertyCategory.READY, omar.id],
    ["PC-1003", "bahria-town-karachi-family-villa", "Bahria Town Karachi Family Villa", "Bahria Town", "Karachi", "Villa", "4", 5, 4250, 95000000, ListingPurpose.SALE, PropertyCategory.READY, sara.id],
    ["PC-1004", "gulberg-offplan-studio", "Gulberg Off-Plan Studio", "Gulberg", "Lahore", "Apartment", "Studio", 1, 520, 12500000, ListingPurpose.SALE, PropertyCategory.OFF_PLAN, omar.id],
    ["PC-1005", "johar-town-rental-1br", "Johar Town Rental 1BR Apartment", "Johar Town", "Lahore", "Apartment", "1", 1, 740, 180000, ListingPurpose.RENT, PropertyCategory.READY, ayesha.id],
    ["PC-1006", "dha-furnished-rental-2br", "DHA Furnished Rental 2BR", "DHA Phase 8", "Karachi", "Apartment", "2", 2, 1240, 320000, ListingPurpose.RENT, PropertyCategory.READY, ayesha.id],
    ["PC-1007", "bahria-town-lahore-offplan-2br", "Bahria Town Lahore Off-Plan 2BR", "Bahria Town", "Lahore", "Apartment", "2", 2, 1090, 38000000, ListingPurpose.SALE, PropertyCategory.OFF_PLAN, omar.id],
    ["PC-1008", "f7-islamabad-luxury-villa", "F-7 Islamabad Luxury Villa", "F-7", "Islamabad", "Villa", "5", 6, 6200, 185000000, ListingPurpose.SALE, PropertyCategory.READY, sara.id]
  ];

  for (const p of properties) {
    const data = {
      slug: p[1] as string,
      title: p[2] as string,
      description: `${p[2]} sample listing for the PropertyConnect AI demo.`,
      area: p[3] as string,
      city: p[4] as string,
      propertyType: p[5] as string,
      bedrooms: p[6] as string,
      bathrooms: p[7] as number,
      sizeSqFt: p[8] as number,
      price: p[9] as number,
      currency: "PKR",
      listingPurpose: p[10] as ListingPurpose,
      category: p[11] as PropertyCategory,
      agentId: p[12] as string,
      status: PropertyStatus.ACTIVE,
      featured: true
    };

    await prisma.property.upsert({
      where: { ref: p[0] as string },
      update: data,
      create: { ref: p[0] as string, ...data }
    });
  }

  const faqs = [
    ["Buying", "Can overseas Pakistanis purchase property in Pakistan?", "Overseas Pakistanis can purchase eligible properties in approved housing schemes. A consultant should confirm the latest eligibility and transaction requirements for the selected property."],
    ["Off-plan", "What is an off-plan property?", "An off-plan property is purchased before completion. Payment milestones, handover timelines, and availability must be confirmed for each project."],
    ["Viewing", "How do I book a viewing?", "Choose a property, submit your preferred date and time, and a consultant will confirm the appointment."],
    ["General", "Can I speak with an agent?", "Yes. Share your name and phone number and a consultant will contact you."]
  ];

  for (const [category, question, answer] of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question } });
    if (existing) {
      await prisma.fAQ.update({ where: { id: existing.id }, data: { category, answer, active: true } });
    } else {
      await prisma.fAQ.create({ data: { category, question, answer } });
    }
  }

  await prisma.fAQ.updateMany({
    where: { question: { contains: "Dubai", mode: "insensitive" } },
    data: { active: false }
  });

  const existingSequence = await prisma.followUpSequence.findFirst({ where: { name: "3-day property nurture" } });
  if (!existingSequence) {
    await prisma.followUpSequence.create({
      data: {
        name: "3-day property nurture",
        description: "Follow up when a lead does not reply after a campaign",
        steps: {
          create: [
            {
              stepOrder: 1,
              delayHours: 24,
              messageTemplate:
                "Hi {{name}}, following up on your property inquiry. Would you like updated listings in your area?"
            },
            {
              stepOrder: 2,
              delayHours: 72,
              messageTemplate:
                "Hi {{name}}, we have new properties matching your preferences. Reply INTERESTED and our agent will assist you."
            }
          ]
        }
      }
    });
  }

  const demoLead = await prisma.lead.findFirst({ where: { email: "buyer@example.com" } });
  if (demoLead) {
    await prisma.lead.update({
      where: { id: demoLead.id },
      data: {
        phone: "+923009999999",
        preferredArea: "DHA Phase 6, Karachi",
        budgetMax: 30000000,
        whatsappOptIn: true
      }
    });
  } else if ((await prisma.lead.count()) === 0) {
    await prisma.lead.create({
      data: {
        type: LeadType.BUYER,
        name: "Demo Buyer",
        phone: "+923009999999",
        email: "buyer@example.com",
        preferredArea: "DHA Phase 6, Karachi",
        preferredPropertyType: "Apartment",
        bedrooms: "2",
        budgetMax: 30000000,
        score: 70,
        temperature: LeadTemperature.HOT,
        scoreReason: ["Phone number provided", "Email provided", "Budget defined", "Preferred area selected", "High urgency timeline"],
        timeline: "Within 30 days",
        requiresHumanFollowUp: true,
        whatsappOptIn: true
      }
    });
  }

  await prisma.lead.updateMany({
    where: { phone: { not: null } },
    data: { whatsappOptIn: true }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
