import { sendViaActiveProvider } from "./providers";
import type { WhatsAppMessageKind } from "../whatsapp-cloud";

export type QueueSendJob = {
  phone: string;
  name?: string | null;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
};

function batchSize() {
  return Math.max(1, Number(process.env.WHATSAPP_BATCH_SIZE || 25));
}

function batchDelayMs() {
  return Math.max(500, Number(process.env.WHATSAPP_BATCH_DELAY_MS || 3000));
}

function maxRetries() {
  return Math.max(0, Number(process.env.WHATSAPP_MAX_RETRIES || 3));
}

function failurePausePercent() {
  return Math.max(1, Number(process.env.WHATSAPP_FAILURE_PAUSE_PERCENT || 10));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processSendQueue(
  jobs: QueueSendJob[],
  onProgress?: (sent: number, failed: number, total: number) => void | Promise<void>
) {
  const size = batchSize();
  const delay = batchDelayMs();
  const retries = maxRetries();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < jobs.length; i += size) {
    const batch = jobs.slice(i, i + size);

    for (const job of batch) {
      let attempt = 0;
      let ok = false;
      while (attempt <= retries && !ok) {
        attempt += 1;
        const result = await sendViaActiveProvider(job);
        ok = result.ok;
        if (!ok && attempt <= retries) await sleep(1000 * attempt);
      }
      if (ok) sent += 1;
      else failed += 1;
    }

    await onProgress?.(sent, failed, jobs.length);

    const failureRate = jobs.length ? (failed / jobs.length) * 100 : 0;
    if (failureRate >= failurePausePercent() && failed > 0) {
      throw new Error(
        `Campaign paused: failure rate ${failureRate.toFixed(1)}% exceeded ${failurePausePercent()}% threshold.`
      );
    }

    if (i + size < jobs.length) await sleep(delay);
  }

  return { sent, failed, total: jobs.length };
}
