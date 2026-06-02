-- Lead WhatsApp compliance fields
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappOptInSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappOptInText" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappUnsubscribed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappUnsubscribedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsappUnsubscribeReason" TEXT;

-- Property media
CREATE TYPE "PropertyMediaType" AS ENUM ('IMAGE', 'VIDEO', 'BROCHURE', 'FLOOR_PLAN', 'DOCUMENT');

CREATE TABLE IF NOT EXISTS "PropertyMedia" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "PropertyMediaType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyMedia_propertyId_idx" ON "PropertyMedia"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyMedia_type_idx" ON "PropertyMedia"("type");

ALTER TABLE "PropertyMedia" DROP CONSTRAINT IF EXISTS "PropertyMedia_propertyId_fkey";
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WhatsApp instance
CREATE TABLE IF NOT EXISTS "WhatsAppInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "connectionStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "connectedPhone" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WhatsAppInstance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppInstance_tenantId_instanceName_key" ON "WhatsAppInstance"("tenantId", "instanceName");

-- CRM inbox models
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'REPLIED', 'FAILED', 'SIMULATED');
CREATE TYPE "WaConversationMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'BUTTON_RESPONSE', 'SYSTEM');

CREATE TABLE IF NOT EXISTS "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "leadId" TEXT,
    "phone" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WhatsAppConversation_tenantId_phone_idx" ON "WhatsAppConversation"("tenantId", "phone");

ALTER TABLE "WhatsAppConversation" DROP CONSTRAINT IF EXISTS "WhatsAppConversation_leadId_fkey";
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "WhatsAppMessageDirection" NOT NULL,
    "type" "WaConversationMessageType" NOT NULL,
    "status" "WhatsAppMessageStatus" NOT NULL,
    "text" TEXT,
    "mediaUrl" TEXT,
    "externalMessageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WhatsAppMessage_conversationId_createdAt_idx" ON "WhatsAppMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_externalMessageId_idx" ON "WhatsAppMessage"("externalMessageId");

ALTER TABLE "WhatsAppMessage" DROP CONSTRAINT IF EXISTS "WhatsAppMessage_conversationId_fkey";
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Webhook idempotency
ALTER TABLE "WhatsAppWebhookEvent" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppWebhookEvent_idempotencyKey_key" ON "WhatsAppWebhookEvent"("idempotencyKey");
