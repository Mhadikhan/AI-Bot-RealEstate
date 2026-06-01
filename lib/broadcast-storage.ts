import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { isWhatsAppApiConfigured, personalizeBroadcastMessage, sendWhatsAppText } from "./whatsapp-cloud";

export type StoredRecipient = {
  id: string;
  broadcastId: string;
  leadId: string | null;
  phone: string;
  name: string | null;
  status: string;
  externalId: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type StoredBroadcast = {
  id: string;
  title: string;
  message: string;
  status: string;
  audience: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  manualCount: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipients: StoredRecipient[];
};

const storePath = path.join(process.cwd(), "data", "broadcasts.json");

function newId() {
  return `bc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function canUsePrismaBroadcast() {
  return typeof (prisma as { broadcast?: unknown }).broadcast !== "undefined";
}

function isMissingTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("does not exist") ||
    message.includes("Unknown model") ||
    message.includes("Cannot read properties of undefined") ||
    message.includes("Prisma client missing Broadcast")
  );
}

async function readFileStore(): Promise<StoredBroadcast[]> {
  try {
    const raw = await readFile(storePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data.broadcasts) ? data.broadcasts : [];
  } catch {
    return [];
  }
}

async function writeFileStore(broadcasts: StoredBroadcast[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify({ broadcasts }, null, 2));
}

function mapPrismaBroadcast(
  broadcast: {
    id: string;
    title: string;
    message: string;
    status: string;
    audience: string;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    manualCount: number;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    recipients: {
      id: string;
      broadcastId: string;
      leadId: string | null;
      phone: string;
      name: string | null;
      status: string;
      externalId: string | null;
      error: string | null;
      sentAt: Date | null;
      createdAt: Date;
    }[];
  }
): StoredBroadcast {
  return {
    id: broadcast.id,
    title: broadcast.title,
    message: broadcast.message,
    status: broadcast.status,
    audience: broadcast.audience,
    recipientCount: broadcast.recipientCount,
    sentCount: broadcast.sentCount,
    failedCount: broadcast.failedCount,
    manualCount: broadcast.manualCount,
    sentAt: broadcast.sentAt?.toISOString() ?? null,
    createdAt: broadcast.createdAt.toISOString(),
    updatedAt: broadcast.updatedAt.toISOString(),
    recipients: broadcast.recipients.map((recipient) => ({
      id: recipient.id,
      broadcastId: recipient.broadcastId,
      leadId: recipient.leadId,
      phone: recipient.phone,
      name: recipient.name,
      status: recipient.status,
      externalId: recipient.externalId,
      error: recipient.error,
      sentAt: recipient.sentAt?.toISOString() ?? null,
      createdAt: recipient.createdAt.toISOString()
    }))
  };
}

export async function listBroadcasts(limit = 50): Promise<StoredBroadcast[]> {
  if (!canUsePrismaBroadcast()) {
    return (await readFileStore()).slice(0, limit);
  }

  try {
    const rows = await prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        recipients: { orderBy: { createdAt: "asc" } }
      }
    });

    return rows.map(mapPrismaBroadcast);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return (await readFileStore()).slice(0, limit);
  }
}

export async function getBroadcast(id: string): Promise<StoredBroadcast | null> {
  if (!canUsePrismaBroadcast()) {
    return (await readFileStore()).find((item) => item.id === id) ?? null;
  }

  try {
    const row = await prisma.broadcast.findUnique({
      where: { id },
      include: { recipients: { orderBy: { createdAt: "asc" } } }
    });

    return row ? mapPrismaBroadcast(row) : null;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return (await readFileStore()).find((item) => item.id === id) ?? null;
  }
}

type CreateInput = {
  title: string;
  message: string;
  audience: string;
  recipients: { leadId: string; phone: string; name: string | null; message: string }[];
  sendNow: boolean;
};

export async function createBroadcast(input: CreateInput) {
  const now = new Date().toISOString();

  if (!canUsePrismaBroadcast()) {
    return createBroadcastFile(input, now);
  }

  try {
    const broadcast = await prisma.broadcast.create({
      data: {
        title: input.title,
        message: input.message,
        audience: input.audience,
        recipientCount: input.recipients.length,
        status: input.sendNow ? "SENDING" : "DRAFT",
        recipients: {
          create: input.recipients.map((recipient) => ({
            leadId: recipient.leadId,
            phone: recipient.phone,
            name: recipient.name
          }))
        }
      },
      include: { recipients: true }
    });

    if (!input.sendNow) {
      return { broadcast: mapPrismaBroadcast(broadcast), summary: null };
    }

    return sendBroadcastPrisma(broadcast.id, input.message, input.recipients);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return createBroadcastFile(input, now);
  }
}

async function createBroadcastFile(input: CreateInput, now: string) {
  const id = newId();
  const recipients: StoredRecipient[] = input.recipients.map((recipient) => ({
    id: newId(),
    broadcastId: id,
    leadId: recipient.leadId,
    phone: recipient.phone,
    name: recipient.name,
    status: input.sendNow ? "MANUAL" : "PENDING",
    externalId: null,
    error: null,
    sentAt: null,
    createdAt: now
  }));

  const broadcast: StoredBroadcast = {
    id,
    title: input.title,
    message: input.message,
    status: input.sendNow ? "SENT" : "DRAFT",
    audience: input.audience,
    recipientCount: recipients.length,
    sentCount: 0,
    failedCount: 0,
    manualCount: input.sendNow ? recipients.length : 0,
    sentAt: input.sendNow ? now : null,
    createdAt: now,
    updatedAt: now,
    recipients
  };

  const all = await readFileStore();
  all.unshift(broadcast);
  await writeFileStore(all);

  return {
    broadcast,
    summary: input.sendNow ? { sentCount: 0, failedCount: 0, manualCount: recipients.length } : null
  };
}

async function sendBroadcastPrisma(
  broadcastId: string,
  message: string,
  payloads: { leadId: string; phone: string; name: string | null; message: string }[]
) {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    include: { recipients: true }
  });

  if (!broadcast) throw new Error("Broadcast not found");

  const apiConfigured = isWhatsAppApiConfigured();
  let sentCount = 0;
  let failedCount = 0;
  let manualCount = 0;

  for (const recipient of broadcast.recipients) {
    const payload = payloads.find((item) => item.leadId === recipient.leadId);
    const body = payload?.message || personalizeBroadcastMessage(message, recipient.name);

    if (!apiConfigured) {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "MANUAL" }
      });
      manualCount += 1;
      continue;
    }

    const result = await sendWhatsAppText(recipient.phone, body);

    if (result.ok) {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "SENT", externalId: result.messageId ?? null, sentAt: new Date(), error: null }
      });
      sentCount += 1;
    } else {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED", error: result.error ?? "Send failed" }
      });
      failedCount += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const finalStatus =
    sentCount === broadcast.recipientCount
      ? "SENT"
      : sentCount > 0
        ? "PARTIAL"
        : apiConfigured
          ? "FAILED"
          : "SENT";

  const updated = await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: finalStatus,
      sentCount: apiConfigured ? sentCount : 0,
      failedCount,
      manualCount: apiConfigured ? 0 : manualCount,
      sentAt: new Date()
    },
    include: { recipients: { orderBy: { createdAt: "asc" } } }
  });

  return {
    broadcast: mapPrismaBroadcast(updated),
    summary: { sentCount, failedCount, manualCount }
  };
}

export async function sendBroadcast(id: string) {
  const existing = await getBroadcast(id);
  if (!existing) throw new Error("Broadcast not found");

  if (!canUsePrismaBroadcast()) {
    const now = new Date().toISOString();
    const all = await readFileStore();
    const index = all.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Broadcast not found");

    all[index] = {
      ...all[index],
      status: "SENT",
      manualCount: all[index].recipients.length,
      sentAt: now,
      updatedAt: now,
      recipients: all[index].recipients.map((recipient) => ({
        ...recipient,
        status: "MANUAL"
      }))
    };

    await writeFileStore(all);
    return {
      broadcast: all[index],
      summary: { sentCount: 0, failedCount: 0, manualCount: all[index].recipients.length }
    };
  }

  try {
    await prisma.broadcast.update({ where: { id }, data: { status: "SENDING" } });

    const payloads = existing.recipients.map((recipient) => ({
      leadId: recipient.leadId || recipient.id,
      phone: recipient.phone,
      name: recipient.name,
      message: personalizeBroadcastMessage(existing.message, recipient.name)
    }));

    return sendBroadcastPrisma(id, existing.message, payloads);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;

    const now = new Date().toISOString();
    const all = await readFileStore();
    const index = all.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Broadcast not found");

    all[index] = {
      ...all[index],
      status: "SENT",
      manualCount: all[index].recipients.length,
      sentAt: now,
      updatedAt: now,
      recipients: all[index].recipients.map((recipient) => ({
        ...recipient,
        status: "MANUAL"
      }))
    };

    await writeFileStore(all);
    return {
      broadcast: all[index],
      summary: { sentCount: 0, failedCount: 0, manualCount: all[index].recipients.length }
    };
  }
}

export async function deleteBroadcast(id: string) {
  if (canUsePrismaBroadcast()) {
    try {
      await prisma.broadcast.delete({ where: { id } });
      return;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  const all = (await readFileStore()).filter((item) => item.id !== id);
  await writeFileStore(all);
}
