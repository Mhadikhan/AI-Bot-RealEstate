-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('BUYER', 'TENANT', 'INVESTOR', 'SELLER', 'LANDLORD', 'VIEWING', 'CALLBACK');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'FOLLOW_UP_REQUIRED', 'NEGOTIATION', 'CONVERTED', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingPurpose" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('READY', 'OFF_PLAN');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'RENTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "languages" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "type" "LeadType" NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "preferredArea" TEXT,
    "preferredPropertyType" TEXT,
    "bedrooms" TEXT,
    "timeline" TEXT,
    "paymentPreference" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'COLD',
    "scoreReason" TEXT[],
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'Website Chatbot',
    "requiresHumanFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listingPurpose" "ListingPurpose" NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "propertyType" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Dubai',
    "area" TEXT NOT NULL,
    "community" TEXT,
    "developer" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "bedrooms" TEXT NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "sizeSqFt" INTEGER NOT NULL,
    "furnishing" TEXT,
    "paymentPlan" TEXT,
    "handoverDate" TIMESTAMP(3),
    "availability" TEXT NOT NULL DEFAULT 'Available',
    "featuredImage" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewingBooking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "leadId" TEXT,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "preferredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE INDEX "Lead_temperature_idx" ON "Lead"("temperature");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_agentId_idx" ON "Lead"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_leadId_key" ON "Conversation"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_ref_key" ON "Property"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_listingPurpose_idx" ON "Property"("listingPurpose");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_area_idx" ON "Property"("area");

-- CreateIndex
CREATE INDEX "Property_price_idx" ON "Property"("price");

-- CreateIndex
CREATE INDEX "Property_bedrooms_idx" ON "Property"("bedrooms");

-- CreateIndex
CREATE UNIQUE INDEX "ViewingBooking_reference_key" ON "ViewingBooking"("reference");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingBooking" ADD CONSTRAINT "ViewingBooking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingBooking" ADD CONSTRAINT "ViewingBooking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingBooking" ADD CONSTRAINT "ViewingBooking_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
