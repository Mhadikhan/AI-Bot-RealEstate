"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Image as ImageIcon, Send, Upload, Video, X, Zap } from "lucide-react";
import type { BrandSettings } from "../lib/brand-settings";
import { IMAGE_UPLOAD_LABEL, VIDEO_UPLOAD_LABEL } from "../lib/media-upload-limits";
import { useToast } from "./ToastProvider";

type MessageType = "TEXT" | "IMAGE" | "VIDEO";
type DeliveryMethod = "template" | "session";

type PlatformStatus = {
  configured: boolean;
  mode: "LIVE" | "DEMO";
};

type ManualLink = { phone: string; url: string };

type SetupInfo = {
  ready: boolean;
  defaultTemplate: { name: string; language: string };
  testNumberHint: string;
};

export default function QuickSendPanel({
  settings,
  platform,
  sending,
  onSendingChange,
  onSent
}: {
  settings: BrandSettings;
  platform: PlatformStatus | null;
  sending: boolean;
  onSendingChange: (v: boolean) => void;
  onSent: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("Phone list broadcast");
  const [messageType, setMessageType] = useState<MessageType>("TEXT");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("template");
  const [templateName, setTemplateName] = useState("hello_world");
  const [templateLanguage, setTemplateLanguage] = useState("en_US");
  const [message, setMessage] = useState("Hi {{name}}, check out our latest property update from PropertyConnect AI.");
  const [phoneList, setPhoneList] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaFileName, setMediaFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [setup, setSetup] = useState<SetupInfo | null>(null);
  const [health, setHealth] = useState<{ connected: boolean; detail?: string; provider?: string } | null>(null);
  const [greenAllowedPhones, setGreenAllowedPhones] = useState<string[]>([]);
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
  const [testing, setTesting] = useState(false);
  const testPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+923412879311";

  const phoneCount = useMemo(() => {
    const lines = phoneList.split(/[\n,;]+/).filter((l) => l.trim().replace(/\D/g, "").length >= 10);
    return lines.length;
  }, [phoneList]);

  function clearMedia() {
    if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
    setMediaUrl("");
    setMediaPreview("");
    setMediaFileName("");
  }

  useEffect(() => {
    return () => {
      if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  useEffect(() => {
    fetch("/api/whatsapp/setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.setup) {
          setSetup(data.setup);
          if (data.setup.defaultTemplate?.name) setTemplateName(data.setup.defaultTemplate.name);
          if (data.setup.defaultTemplate?.language) setTemplateLanguage(data.setup.defaultTemplate.language);
        }
        if (data.health) {
          setHealth(data.health);
          if (data.health.provider === "green-api") setDeliveryMethod("session");
        }
        if (Array.isArray(data.greenApiAllowedPhones)) setGreenAllowedPhones(data.greenApiAllowedPhones);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!phoneList.trim()) {
        setPreviewCount(null);
        return;
      }
      try {
        const res = await fetch(`/api/whatsapp/quick-send?phones=${encodeURIComponent(phoneList)}`);
        const data = await res.json();
        if (res.ok) setPreviewCount(data.count);
      } catch {
        setPreviewCount(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [phoneList]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "whatsapp");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
      setMediaUrl(data.url);
      setMediaPreview(URL.createObjectURL(file));
      setMediaFileName(file.name);
      if (data.kind === "VIDEO") setMessageType("VIDEO");
      else if (data.kind === "IMAGE") setMessageType("IMAGE");
      toast.success(`${data.kind === "VIDEO" ? "Video" : "Image"} ready — will send on WhatsApp.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          messageType: "TEXT",
          message: message.slice(0, 200) || "Test from PropertyConnect AI",
          deliveryMethod: health?.provider === "green-api" ? "session" : deliveryMethod,
          templateName,
          templateLanguage
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const err = data.error || "Test send failed";
        if (data.mode === "DEMO") {
          toast.error(`${err} Use “Open in WhatsApp” below to send from your phone.`);
        } else {
          toast.error(err);
        }
        return;
      }
      toast.success(`WhatsApp sent to ${data.phone}. Check your phone.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function send() {
    const count = previewCount ?? phoneCount;
    if (count === 0) {
      toast.error("Add at least one valid phone number.");
      return;
    }
    if (messageType === "TEXT" && !message.trim() && deliveryMethod === "session") {
      toast.error("Enter message text.");
      return;
    }
    if ((messageType === "IMAGE" || messageType === "VIDEO") && !mediaUrl.trim()) {
      toast.error("Upload an image or video first.");
      return;
    }

    onSendingChange(true);
    setManualLinks([]);
    try {
      const res = await fetch("/api/whatsapp/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          messageType,
          message,
          mediaUrl: messageType === "TEXT" ? null : mediaUrl,
          phoneList,
          sendNow: true,
          deliveryMethod:
            platform?.mode === "LIVE" && health?.provider === "green-api" ? "session" : deliveryMethod,
          templateName,
          templateLanguage
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Send failed");

      const mode = data.mode || platform?.mode;
      const failed = data.summary?.failedCount ?? 0;
      const sent = data.summary?.sentCount ?? 0;
      const simulated = data.summary?.simulatedCount ?? 0;

      if (mode === "DEMO") {
        setManualLinks(data.manualLinks || []);
        toast.success(
          `DEMO: no real WhatsApp delivery. ${simulated} simulated. Use the links below to send from your phone, or configure API in .env.`
        );
      } else if (failed > 0 && sent === 0) {
        const errDetail =
          data.summary?.errors?.[0]?.error ||
          data.campaign?.recipients?.find((r: { status: string; error?: string }) => r.status === "FAILED")
            ?.error;
        const via = data.summary?.provider === "green-api" ? "Green API" : "Meta";
        const shortErr =
          errDetail && errDetail.length > 220 ? `${errDetail.slice(0, 220)}…` : errDetail;
        toast.error(
          shortErr
            ? `Send failed (${via}): ${shortErr}`
            : `All ${failed} failed via ${via}. Restart npm run dev after editing .env.`
        );
      } else {
        const via = data.summary?.provider === "green-api" ? "Green API" : "WhatsApp";
        toast.success(`Sent ${sent || simulated} message(s) via ${via}.`);
        onSent();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      onSendingChange(false);
    }
  }

  const isDemo = platform?.mode === "DEMO";

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-amber-900">
            <Zap className="h-5 w-5" />
            WhatsApp is currently running in Demo Mode
          </h3>
          <p className="mt-2 text-sm text-amber-900/90">
            To connect a WhatsApp test number, open{" "}
            <a href="/admin/settings/whatsapp" className="font-bold underline">
              Admin → Settings → WhatsApp
            </a>
            , configure Evolution API, create an instance, and scan the QR code from WhatsApp → Linked Devices.
          </p>
          <p className="mt-3 text-sm text-amber-900/90">
            You can still use &ldquo;Open in WhatsApp&rdquo; below to send manually from your phone.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-900/90">
            <li>
              Start Evolution API: <code>docker compose -f docker-compose.evolution.yml up -d</code>
            </li>
            <li>
              Set <code>WHATSAPP_PROVIDER=evolution</code>, <code>EVOLUTION_API_URL</code>,{" "}
              <code>EVOLUTION_API_KEY</code> in <code>.env</code>
            </li>
            <li>Restart: <code>npm run dev</code></li>
          </ol>
        </div>
      )}

      {!isDemo && health?.provider === "evolution" && health.connected && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-bold">WhatsApp Connected</p>
          <p className="mt-1">
            Provider: Evolution API · Status: Active · Number: {testPhone}
          </p>
        </div>
      )}

      {!isDemo && health?.provider === "green-api" && greenAllowedPhones.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          <p className="font-bold">Green API plan limits</p>
          <p className="mt-1">
            Free/personal plan: monthly quota + only these numbers:{" "}
            <strong>{greenAllowedPhones.join(", ")}</strong>
          </p>
          <p className="mt-2">
            Quota finished?{" "}
            <a
              href="https://console.green-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              Upgrade to Business
            </a>{" "}
            at Green API to send to any number.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900">Send to phone list</h3>
        <p className="mt-1 text-sm text-slate-600">
          Mode: <strong>{platform?.mode || "…"}</strong>
          {health?.provider && health.provider !== "none" && (
            <>
              {" "}
              · Service: <strong>{health.provider === "green-api" ? "Green API" : "Meta"}</strong>
              {health.connected ? " ✓ connected" : " — scan QR / check .env"}
            </>
          )}
          {isDemo && " — configure Evolution API in Admin → Settings → WhatsApp"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase text-slate-400">Delivery (LIVE)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDeliveryMethod("template")}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              deliveryMethod === "template" ? "text-white" : "bg-slate-100 text-slate-600"
            }`}
            style={deliveryMethod === "template" ? { background: settings.primary } : {}}
          >
            Template (new contacts)
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMethod("session")}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              deliveryMethod === "session" ? "text-white" : "bg-slate-100 text-slate-600"
            }`}
            style={deliveryMethod === "session" ? { background: settings.primary } : {}}
          >
            Session (24h window)
          </button>
        </div>
        {deliveryMethod === "template" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Template name</label>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="hello_world"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Language</label>
              <input
                value={templateLanguage}
                onChange={(e) => setTemplateLanguage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="en_US"
              />
            </div>
          </div>
        )}
        {setup?.testNumberHint && (
          <p className="mt-2 text-[10px] text-slate-500">{setup.testNumberHint}</p>
        )}

        <button
          type="button"
          disabled={testing || sending}
          onClick={sendTest}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
        >
          <Send className="h-4 w-4" />
          {testing ? "Sending test…" : `Send test to ${testPhone}`}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-xs font-bold uppercase text-slate-400">Campaign name</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />

        <p className="mt-4 text-xs font-bold uppercase text-slate-400">Message type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["TEXT", "Text", Send],
              ["IMAGE", "Image", ImageIcon],
              ["VIDEO", "Video", Video]
            ] as const
          ).map(([type, label, Icon]) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (type === "TEXT") clearMedia();
                setMessageType(type);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                messageType === type ? "text-white shadow-sm" : "bg-slate-100 text-slate-600"
              }`}
              style={messageType === type ? { background: settings.primary } : {}}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {(messageType === "IMAGE" || messageType === "VIDEO") && deliveryMethod === "template" && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Media to new contacts needs a Meta-approved template with image/video header. Use Session mode if they
            messaged you in the last 24 hours.
          </p>
        )}

        {(messageType === "IMAGE" || messageType === "VIDEO") && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-600">
              {messageType === "IMAGE" ? "Image" : "Video"} (max{" "}
              {messageType === "VIDEO" ? `${VIDEO_UPLOAD_LABEL} MP4/3GP` : IMAGE_UPLOAD_LABEL}) — sends on WhatsApp
              when you click Send
            </p>
            {!mediaUrl ? (
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-white px-4 py-8 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
                <Upload className="h-5 w-5" />
                {uploading ? "Uploading…" : `Choose ${messageType === "IMAGE" ? "image" : "video"}`}
                <input
                  type="file"
                  accept={
                  messageType === "VIDEO"
                    ? "video/mp4,video/3gpp,video/webm,video/quicktime"
                    : "image/jpeg,image/png,image/webp,image/gif"
                }
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <div className="mt-2 rounded-xl border bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-700">{mediaFileName || "File ready"}</span>
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                {mediaPreview && messageType === "IMAGE" && (
                  <img src={mediaPreview} alt="" className="mt-3 max-h-48 w-full rounded-lg object-contain" />
                )}
                {mediaPreview && messageType === "VIDEO" && (
                  <video src={mediaPreview} controls className="mt-3 max-h-48 w-full rounded-lg" />
                )}
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Upload className="h-3.5 w-3.5" />
                  Replace file
                  <input
                    type="file"
                    accept={
                  messageType === "VIDEO"
                    ? "video/mp4,video/3gpp,video/webm,video/quicktime"
                    : "image/jpeg,image/png,image/webp,image/gif"
                }
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        <label className="mt-4 block text-xs font-bold uppercase text-slate-400">
          {messageType === "TEXT" && deliveryMethod === "template"
            ? "Template body text (if your template has variables)"
            : messageType === "TEXT"
              ? "Message"
              : "Caption (optional)"}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />

        <label className="mt-4 block text-xs font-bold uppercase text-slate-400">Phone numbers</label>
        <textarea
          value={phoneList}
          onChange={(e) => setPhoneList(e.target.value)}
          rows={8}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm"
          placeholder={
            greenAllowedPhones.length
              ? `${greenAllowedPhones[0]?.replace("+", "")}\n${greenAllowedPhones[1]?.replace("+", "") || "923001234567"}`
              : `923412879311\n+923001234567`
          }
        />
        <p className="mt-1 text-xs text-slate-500">
          {previewCount !== null ? `${previewCount} valid number(s)` : "One per line or comma-separated"}
        </p>

        <button
          type="button"
          disabled={sending}
          onClick={send}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md"
          style={{ background: "#25D366" }}
        >
          <Send className="h-5 w-5" />
          {isDemo ? "Queue (DEMO — use links below for real send)" : "Send via WhatsApp API"}
        </button>
      </div>

      {manualLinks.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h4 className="font-bold text-slate-900">Send from your phone (DEMO fallback)</h4>
          <p className="mt-1 text-xs text-slate-600">Opens WhatsApp with the message pre-filled — tap Send on each chat.</p>
          <ul className="mt-3 space-y-2">
            {manualLinks.map((link) => (
              <li key={link.phone}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Open WhatsApp — {link.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
