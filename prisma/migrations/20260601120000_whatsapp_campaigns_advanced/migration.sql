-- CampaignMode
CREATE TYPE "CampaignMode" AS ENUM ('LIVE', 'DEMO');

-- Extend BroadcastStatus
ALTER TYPE "BroadcastStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "BroadcastStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Extend BroadcastRecipientStatus
ALTER TYPE "BroadcastRecipientStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
ALTER TYPE "BroadcastRecipientStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "BroadcastRecipientStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "BroadcastRecipientStatus" ADD VALUE IF NOT EXISTS 'READ';
ALTER TYPE "BroadcastRecipientStatus" ADD VALUE IF NOT EXISTS 'SIMULATED';

-- Broadcast extensions
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "mode" "CampaignMode" NOT NULL DEFAULT 'DEMO';
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "deliveredCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "readCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "replyCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "propertyRef" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "followUpSequenceId" TEXT;

-- BroadcastRecipient extensions
ALTER TABLE "BroadcastRecipient" ADD COLUMN IF NOT EXISTS "personalizedMessage" TEXT;
ALTER TABLE "BroadcastRecipient" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "BroadcastRecipient" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "BroadcastRecipient" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Broadcast_mode_idx" ON "Broadcast"("mode");
CREATE INDEX IF NOT EXISTS "Broadcast_scheduledAt_idx" ON "Broadcast"("scheduledAt");
CREATE INDEX IF NOT EXISTS "BroadcastRecipient_externalId_idx" ON "BroadcastRecipient"("externalId");
CREATE INDEX IF NOT EXISTS "BroadcastRecipient_phone_idx" ON "BroadcastRecipient"("phone");

-- FollowUpSequence
CREATE TABLE IF NOT EXISTS "FollowUpSequence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FollowUpSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FollowUpStep" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "delayHours" INTEGER NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL DEFAULT 'NO_REPLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUpStep_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FollowUpStep_sequenceId_stepOrder_key" ON "FollowUpStep"("sequenceId", "stepOrder");

CREATE TABLE IF NOT EXISTS "FollowUpEnrollment" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "broadcastId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nextRunAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "stoppedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FollowUpEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FollowUpEnrollment_status_idx" ON "FollowUpEnrollment"("status");
CREATE INDEX IF NOT EXISTS "FollowUpEnrollment_nextRunAt_idx" ON "FollowUpEnrollment"("nextRunAt");
CREATE INDEX IF NOT EXISTS "FollowUpEnrollment_leadId_idx" ON "FollowUpEnrollment"("leadId");

CREATE TABLE IF NOT EXISTS "WhatsAppWebhookEvent" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT,
    "recipientId" TEXT,
    "leadId" TEXT,
    "eventType" TEXT NOT NULL,
    "waMessageId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WhatsAppWebhookEvent_eventType_idx" ON "WhatsAppWebhookEvent"("eventType");
CREATE INDEX IF NOT EXISTS "WhatsAppWebhookEvent_waMessageId_idx" ON "WhatsAppWebhookEvent"("waMessageId");
CREATE INDEX IF NOT EXISTS "WhatsAppWebhookEvent_createdAt_idx" ON "WhatsAppWebhookEvent"("createdAt");

CREATE TABLE IF NOT EXISTS "WhatsAppInboundMessage" (
    "id" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "waMessageId" TEXT,
    "leadId" TEXT,
    "handledBy" TEXT NOT NULL DEFAULT 'PENDING',
    "aiReply" TEXT,
    "requiresAgent" BOOLEAN NOT NULL DEFAULT false,
    "agentNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppInboundMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppInboundMessage_waMessageId_key" ON "WhatsAppInboundMessage"("waMessageId");
CREATE INDEX IF NOT EXISTS "WhatsAppInboundMessage_fromPhone_idx" ON "WhatsAppInboundMessage"("fromPhone");
CREATE INDEX IF NOT EXISTS "WhatsAppInboundMessage_handledBy_idx" ON "WhatsAppInboundMessage"("handledBy");
CREATE INDEX IF NOT EXISTS "WhatsAppInboundMessage_createdAt_idx" ON "WhatsAppInboundMessage"("createdAt");

ALTER TABLE "Broadcast" DROP CONSTRAINT IF EXISTS "Broadcast_followUpSequenceId_fkey";
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_followUpSequenceId_fkey" FOREIGN KEY ("followUpSequenceId") REFERENCES "FollowUpSequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FollowUpStep" DROP CONSTRAINT IF EXISTS "FollowUpStep_sequenceId_fkey";
ALTER TABLE "FollowUpStep" ADD CONSTRAINT "FollowUpStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "FollowUpSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FollowUpEnrollment" DROP CONSTRAINT IF EXISTS "FollowUpEnrollment_sequenceId_fkey";
ALTER TABLE "FollowUpEnrollment" ADD CONSTRAINT "FollowUpEnrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "FollowUpSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FollowUpEnrollment" DROP CONSTRAINT IF EXISTS "FollowUpEnrollment_leadId_fkey";
ALTER TABLE "FollowUpEnrollment" ADD CONSTRAINT "FollowUpEnrollment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WhatsAppWebhookEvent" DROP CONSTRAINT IF EXISTS "WhatsAppWebhookEvent_broadcastId_fkey";
ALTER TABLE "WhatsAppWebhookEvent" ADD CONSTRAINT "WhatsAppWebhookEvent_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppWebhookEvent" DROP CONSTRAINT IF EXISTS "WhatsAppWebhookEvent_recipientId_fkey";
ALTER TABLE "WhatsAppWebhookEvent" ADD CONSTRAINT "WhatsAppWebhookEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "BroadcastRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppInboundMessage" DROP CONSTRAINT IF EXISTS "WhatsAppInboundMessage_leadId_fkey";
ALTER TABLE "WhatsAppInboundMessage" ADD CONSTRAINT "WhatsAppInboundMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
