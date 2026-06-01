-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "BroadcastRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'MANUAL');

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "city" SET DEFAULT 'Karachi',
ALTER COLUMN "currency" SET DEFAULT 'PKR';

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" TEXT NOT NULL DEFAULT 'ALL_PHONES',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "manualCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "leadId" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "status" "BroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Broadcast_status_idx" ON "Broadcast"("status");

-- CreateIndex
CREATE INDEX "Broadcast_createdAt_idx" ON "Broadcast"("createdAt");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_broadcastId_idx" ON "BroadcastRecipient"("broadcastId");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_status_idx" ON "BroadcastRecipient"("status");

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
