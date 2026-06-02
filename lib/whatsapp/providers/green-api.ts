import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { resolvePublicMediaUrl, toWhatsAppApiPhone } from "../../whatsapp-cloud";
import type { WhatsAppMessageKind, WhatsAppSendResult } from "../../whatsapp-cloud";
import { formatGreenApiErrorForUser } from "./green-api-errors";

function greenCredentials() {
  const id = process.env.GREEN_API_INSTANCE_ID?.trim();
  const token = process.env.GREEN_API_API_TOKEN?.trim();
  if (!id || !token) return null;
  return { id, token };
}

function greenApiUrl() {
  return (process.env.GREEN_API_URL?.trim() || "https://api.green-api.com").replace(/\/$/, "");
}

/** File uploads use the same API host as messaging (7107.api.greenapi.com). Media subdomain often does not exist. */
function greenUploadBase() {
  return greenApiBase();
}

function instanceBase(host: string) {
  const creds = greenCredentials();
  if (!creds) return null;
  return `${host}/waInstance${creds.id}`;
}

export function greenApiBase() {
  const base = instanceBase(greenApiUrl());
  const creds = greenCredentials();
  if (!base || !creds) return null;
  return { ...creds, base };
}

export function isGreenApiConfigured() {
  return Boolean(greenApiBase());
}

function chatId(phone: string) {
  return `${toWhatsAppApiPhone(phone)}@c.us`;
}

function mimeFromName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".3gp": "video/3gpp"
  };
  return map[ext] || "application/octet-stream";
}

/** Resolve /uploads/... or http://localhost:3000/uploads/... to a file on disk. */
export function resolveLocalUploadPath(mediaUrl: string): string | null {
  let pathname = mediaUrl.trim();
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      return null;
    }
  }
  if (!pathname.startsWith("/uploads/")) return null;

  const filePath = path.join(process.cwd(), "public", pathname.replace(/^\//, ""));
  if (!existsSync(filePath)) return null;
  return filePath;
}

function isPrivateOrLocalUrl(mediaUrl: string) {
  const trimmed = mediaUrl.trim();
  if (trimmed.startsWith("/")) return true;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  } catch {
    return true;
  }
}

function formatFetchError(error: unknown) {
  if (!(error instanceof Error)) return "Network error";
  const cause = error.cause as { code?: string; hostname?: string } | undefined;
  if (cause?.code === "ENOTFOUND" && cause.hostname) {
    return `Cannot reach Green API host (${cause.hostname}). Use GREEN_API_URL from your Green API dashboard.`;
  }
  return error.message || "Network error";
}

async function greenPostJson(
  cfg: { base: string; token: string },
  method: string,
  body: Record<string, unknown>
): Promise<WhatsAppSendResult> {
  try {
    const response = await fetch(`${cfg.base}/${method}/${cfg.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000)
    });
    const data = await response.json();

    if (!response.ok || !data?.idMessage) {
      const raw =
        data?.message ||
        data?.error ||
        data?.describe ||
        (typeof data === "object" ? data : "Green API request failed");
      return { ok: false, error: formatGreenApiErrorForUser(raw) };
    }

    return { ok: true, messageId: String(data.idMessage) };
  } catch (error) {
    return { ok: false, error: formatFetchError(error) };
  }
}

async function greenSendFileByUpload(input: {
  chatId: string;
  filePath: string;
  caption?: string;
}): Promise<WhatsAppSendResult> {
  const cfg = greenUploadBase();
  if (!cfg) {
    return { ok: false, error: "Green API not configured" };
  }

  const fileName = path.basename(input.filePath);
  const buffer = await readFile(input.filePath);
  const mime = mimeFromName(fileName);

  const form = new FormData();
  form.append("chatId", input.chatId);
  form.append("file", new Blob([buffer], { type: mime }), fileName);
  if (input.caption?.trim()) form.append("caption", input.caption.trim().slice(0, 1024));

  const uploadUrl = `${cfg.base}/sendFileByUpload/${cfg.token}`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(600_000)
    });
    const data = await response.json();

    if (!response.ok || !data?.idMessage) {
      const raw =
        data?.message ||
        data?.error ||
        data?.describe ||
        (typeof data === "object" ? data : "File upload to WhatsApp failed");
      return { ok: false, error: formatGreenApiErrorForUser(raw) };
    }

    return { ok: true, messageId: String(data.idMessage) };
  } catch (error) {
    return { ok: false, error: formatFetchError(error) };
  }
}

export async function greenApiGetState(): Promise<{ connected: boolean; state?: string; error?: string }> {
  const cfg = greenApiBase();
  if (!cfg) return { connected: false, error: "Not configured" };

  try {
    const response = await fetch(`${cfg.base}/getStateInstance/${cfg.token}`);
    const data = await response.json();
    const state = data?.stateInstance as string | undefined;
    return {
      connected: state === "authorized",
      state,
      error: state && state !== "authorized" ? `Instance state: ${state} — scan QR in Green API dashboard` : undefined
    };
  } catch (error) {
    return { connected: false, error: formatFetchError(error) };
  }
}

export async function sendGreenApiMessage(input: {
  phone: string;
  messageType: WhatsAppMessageKind;
  text: string;
  mediaUrl?: string | null;
}): Promise<WhatsAppSendResult> {
  const id = chatId(input.phone);
  const cfg = greenApiBase();

  if (!cfg) {
    return { ok: false, error: "Green API not configured (GREEN_API_INSTANCE_ID, GREEN_API_API_TOKEN)" };
  }

  if (input.messageType === "TEXT" || !input.mediaUrl?.trim()) {
    return greenPostJson(cfg, "sendMessage", { chatId: id, message: input.text });
  }

  const rawUrl = input.mediaUrl.trim();
  const localPath = resolveLocalUploadPath(rawUrl);

  if (localPath) {
    return greenSendFileByUpload({
      chatId: id,
      filePath: localPath,
      caption: input.text || undefined
    });
  }

  if (isPrivateOrLocalUrl(rawUrl)) {
    return {
      ok: false,
      error:
        "Local file not found. Upload the image/video again in the app, or set NEXT_PUBLIC_APP_URL to a public HTTPS URL (e.g. ngrok)."
    };
  }

  const publicUrl = resolvePublicMediaUrl(rawUrl);
  if (!publicUrl.startsWith("https://")) {
    return {
      ok: false,
      error: "Media URL must be public HTTPS. Local uploads are sent directly — re-upload the file if this persists."
    };
  }

  const fileName = path.basename(new URL(publicUrl).pathname) || (input.messageType === "VIDEO" ? "video.mp4" : "image.jpg");

  return greenPostJson(cfg, "sendFileByUrl", {
    chatId: id,
    urlFile: publicUrl,
    fileName,
    caption: input.text || undefined
  });
}
