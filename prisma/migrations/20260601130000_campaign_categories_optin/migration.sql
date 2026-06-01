-- CreateEnum
CREATE TYPE "CampaignCategory" AS ENUM (
  'NEW_PROPERTY_ALERT',
  'RENTAL_LISTING_UPDATE',
  'OFF_PLAN_ANNOUNCEMENT',
  'VIEWING_REMINDER',
  'OPEN_HOUSE_INVITE',
  'COLD_LEAD_REACTIVATION',
  'INVESTOR_CAMPAIGN',
  'PAYMENT_PLAN_UPDATE',
  'BROCHURE_CAMPAIGN',
  'CALLBACK_FOLLOW_UP',
  'AGENT_FOLLOW_UP',
  'CUSTOM'
);

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lead" ADD COLUMN "whatsappOptInAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN "category" "CampaignCategory" NOT NULL DEFAULT 'CUSTOM';

CREATE INDEX "Broadcast_category_idx" ON "Broadcast"("category");
CREATE INDEX "Lead_whatsappOptIn_idx" ON "Lead"("whatsappOptIn");
