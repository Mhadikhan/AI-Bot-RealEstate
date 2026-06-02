-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN "messageType" "WhatsAppMessageType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "Broadcast" ADD COLUMN "mediaUrl" TEXT;
