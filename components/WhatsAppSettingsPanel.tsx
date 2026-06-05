"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Plug,
  QrCode,
  RefreshCw,
  Smartphone,
  Unplug,
  Wifi,
  WifiOff
} from "lucide-react";

type StatusPayload = {
  provider?: string;
  connectionStatus?: string;
  connectedPhone?: string | null;
  demo?: boolean;
  record?: {
    instanceName?: string;
    lastCheckedAt?: string;
    connectedPhone?: string | null;
  } | null;
  platform?: {
    mode?: string;
    providerLabel?: string;
    evolutionWebhookUrl?: string;
    demo?: boolean;
  };
  evolutionError?: string;
  evolutionHint?: string;
  evolutionReachable?: boolean;
  evolutionUrl?: string;
  instanceName?: string;
};

const PAIRING_POLL_MS = 5000;
const PAIRING_TIMEOUT_MS = 5 * 60 * 1000;

export default function WhatsAppSettingsPanel({ primary }: { primary: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState(false);
  const pairingStarted = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/whatsapp/evolution/instance/status");
    const data = (await res.json()) as StatusPayload & { error?: string };
    if (data.error) setError(data.error);
    else if (data.evolutionError) setError(data.evolutionHint ? `${data.evolutionError}\n\n${data.evolutionHint}` : data.evolutionError);
    else setError(null);
    setStatus(data);
    return data;
  }, []);

  const fetchQr = useCallback(async () => {
    setLoading("qr");
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/evolution/instance/qrcode");
      const data = (await res.json()) as { base64?: string; code?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "QR fetch failed");
      const raw = data.base64 || data.code;
      if (raw) {
        setQrBase64(raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`);
        setPairing(true);
        pairingStarted.current = Date.now();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "QR fetch failed");
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [fetchStatus]);

  useEffect(() => {
    if (!pairing) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchStatus();
        if (data.connectionStatus === "CONNECTED") {
          setPairing(false);
          setQrBase64(null);
          pairingStarted.current = null;
        } else if (
          pairingStarted.current &&
          Date.now() - pairingStarted.current > PAIRING_TIMEOUT_MS
        ) {
          setPairing(false);
          pairingStarted.current = null;
        }
      } catch {
        /* ignore polling errors */
      }
    }, PAIRING_POLL_MS);
    return () => clearInterval(interval);
  }, [pairing, fetchStatus]);

  async function action(kind: "create" | "disconnect" | "logout") {
    setLoading(kind);
    setError(null);
    try {
      const res = await fetch(`/api/whatsapp/evolution/instance/${kind}`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || `${kind} failed`);
      if (kind === "create") await fetchQr();
      else {
        setQrBase64(null);
        setPairing(false);
      }
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  const isDemo = status?.demo || status?.platform?.mode === "DEMO";
  const connectionStatus = status?.connectionStatus || "NOT_CONNECTED";
  const instanceName = status?.record?.instanceName || status?.instanceName || "propertyconnect";
  const connectedPhone = status?.connectedPhone || status?.record?.connectedPhone;

  const statusColor =
    connectionStatus === "CONNECTED"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : connectionStatus === "CONNECTING"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div className="space-y-6">
      {/* One-time setup guide — shown when Docker/Evolution API is not running */}
      {(status?.evolutionReachable === false || isDemo) && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">✓</div>
            <p className="font-extrabold text-emerald-900">
              Evolution API — 100% Free WhatsApp (self-hosted, no subscription)
            </p>
          </div>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-800">
            <li>
              <strong>Install Docker Desktop</strong> — download free from{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">docker.com/products/docker-desktop</code>{" "}
              and install it (Windows/Mac/Linux supported)
            </li>
            <li>
              <strong>Open a terminal in this project folder</strong> and run:
              <pre className="mt-1.5 overflow-x-auto rounded-xl bg-slate-800 p-3 text-xs text-green-300">
                docker compose -f docker-compose.evolution.yml up -d
              </pre>
              <span className="mt-1 block text-xs text-slate-500">
                This starts Evolution API on port 8080. Wait ~30 seconds for it to be ready.
              </span>
            </li>
            <li>
              Come back here and click <strong>Create Instance</strong> below
            </li>
            <li>
              Click <strong>Generate QR Code</strong> → scan with your WhatsApp phone
            </li>
            <li>
              Status will change to <span className="font-bold text-emerald-700">CONNECTED</span> — done!
              All broadcasts will now send as real WhatsApp messages.
            </li>
          </ol>
          {status?.evolutionReachable === false && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs">
              <p className="font-bold text-red-800">Docker is not running or Evolution API is unreachable</p>
              <p className="mt-1 text-red-700">{status.evolutionHint || status.evolutionError}</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">WhatsApp Connection</h3>
            <p className="mt-1 text-sm text-slate-500">Provider: Evolution API</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusColor}`}>
            {connectionStatus.replace(/_/g, " ")}
          </span>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs font-bold uppercase text-slate-400">Instance</dt>
            <dd className="mt-1 font-semibold text-slate-800">{instanceName}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs font-bold uppercase text-slate-400">Connected number</dt>
            <dd className="mt-1 font-semibold text-slate-800">{connectedPhone || "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs font-bold uppercase text-slate-400">Last checked</dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {status?.record?.lastCheckedAt
                ? new Date(status.record.lastCheckedAt).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs font-bold uppercase text-slate-400">Webhook URL</dt>
            <dd className="mt-1 break-all text-sm font-medium text-slate-700">
              {status?.platform?.evolutionWebhookUrl || "/api/webhooks/evolution"}
            </dd>
          </div>
        </dl>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!loading}
            onClick={() => action("create")}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: primary }}
          >
            {loading === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
            Create Instance
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={fetchQr}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading === "qr" ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Generate QR Code
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => fetchStatus().catch(() => undefined)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => action("disconnect")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
          >
            <Unplug className="h-4 w-4" />
            Disconnect
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => action("logout")}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {pairing && (
          <p className="mt-3 flex items-center gap-2 text-sm text-amber-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pairing… checking every 5 seconds
          </p>
        )}

        {connectionStatus === "CONNECTED" && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            WhatsApp Connected · Provider: Evolution API · Status: Active
          </p>
        )}
      </div>

      {qrBase64 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="flex items-center gap-2 font-bold text-slate-900">
            <Smartphone className="h-5 w-5" />
            Scan QR Code
          </h4>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Open WhatsApp on your phone.</li>
            <li>Go to Linked Devices.</li>
            <li>Tap Link a Device.</li>
            <li>Scan the QR code below.</li>
            <li>Wait for the Connected status.</li>
          </ol>
          <div className="mt-4 inline-block rounded-xl border border-slate-200 bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrBase64} alt="WhatsApp QR code" className="h-64 w-64 object-contain" />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="flex items-center gap-2 font-bold text-slate-800">
          {isDemo ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          Mode: {isDemo ? "DEMO (simulated sends)" : "LIVE"}
        </p>
        <p className="mt-2">
          Set <code>WHATSAPP_PROVIDER=evolution</code>, <code>WHATSAPP_ENABLED=true</code>, and Evolution
          credentials in <code>.env</code>. See <code>EVOLUTION_API_SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}
