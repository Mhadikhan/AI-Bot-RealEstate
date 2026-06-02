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
      {status?.evolutionReachable === false && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold">Evolution API not reachable</p>
          <p className="mt-2 whitespace-pre-wrap">{status.evolutionError}</p>
          <p className="mt-2 font-semibold">{status.evolutionHint}</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-red-100/80 p-3 text-xs">
            docker compose -f docker-compose.evolution.yml up -d
          </pre>
        </div>
      )}
      {isDemo && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-bold text-amber-900">Demo Mode — Evolution API is not connected.</p>
          <p className="mt-2 text-sm text-amber-900/90">
            Start Docker (<code>docker compose -f docker-compose.evolution.yml up -d</code>), copy{" "}
            <code>.env.evolution.example</code> → <code>.env.evolution</code>, set matching keys in{" "}
            <code>.env</code>, then create an instance and scan the QR code.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        <strong>Testing notice:</strong> Use a separate WhatsApp test number. WHATSAPP-BAILEYS relies on
        WhatsApp Web and has limitations vs the official Meta WhatsApp Business API. For high-volume
        production, switch to <code>WHATSAPP_PROVIDER=meta</code>.
      </div>

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
