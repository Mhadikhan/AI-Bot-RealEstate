"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Flame,
  Home,
  Key,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserCheck,
  Users,
  Zap
} from "lucide-react";
import { BROADCAST_TEMPLATES, filterLeadsForAudience, type BroadcastAudience, type LeadForAudience } from "../lib/broadcast";
import { buildManualWhatsAppUrl, personalizeBroadcastMessage } from "../lib/whatsapp-cloud";
import type { BrandSettings } from "../lib/brand-settings";

type LeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  type: string;
  temperature: string;
  preferredArea: string | null;
};

type BroadcastRecipient = {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  error: string | null;
  sentAt: string | null;
};

type Broadcast = {
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
  recipients?: BroadcastRecipient[];
};

type BroadcastManagerProps = {
  settings: BrandSettings;
  leads: LeadRow[];
};

const audienceOptions: {
  id: BroadcastAudience;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  { id: "ALL_PHONES", label: "All contacts", description: "Every lead with a phone", icon: Users, tone: "bg-slate-100 text-slate-700" },
  { id: "HOT", label: "Hot leads", description: "Ready to close", icon: Flame, tone: "bg-red-50 text-red-700" },
  { id: "WARM", label: "Warm leads", description: "Engaged prospects", icon: Zap, tone: "bg-amber-50 text-amber-700" },
  { id: "BUYERS", label: "Buyers", description: "Purchase intent", icon: Home, tone: "bg-blue-50 text-blue-700" },
  { id: "TENANTS", label: "Tenants", description: "Rental intent", icon: Key, tone: "bg-violet-50 text-violet-700" },
  { id: "SELECTED", label: "Hand-pick", description: "Choose individuals", icon: UserCheck, tone: "bg-emerald-50 text-emerald-700" }
];

function statusChip(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    SENT: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
    FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
    MANUAL: { label: "Ready to send", className: "bg-amber-100 text-amber-800" },
    PENDING: { label: "Pending", className: "bg-slate-100 text-slate-600" },
    SENDING: { label: "Sending…", className: "bg-blue-100 text-blue-800" },
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600" },
    PARTIAL: { label: "Partial", className: "bg-amber-100 text-amber-800" }
  };
  const item = map[status] || { label: status, className: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${item.className}`}>{item.label}</span>;
}

function initials(name: string | null, phone: string) {
  if (name?.trim()) return name.trim().slice(0, 2).toUpperCase();
  return phone.slice(-2);
}

function WhatsAppPreview({ message, name, agencyName }: { message: string; name: string; agencyName: string }) {
  const preview = personalizeBroadcastMessage(message, name);
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#e5ddd5] shadow-xl">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">PC</div>
          <div>
            <div className="text-sm font-bold">{agencyName}</div>
            <div className="text-[11px] text-emerald-200">Business account</div>
          </div>
        </div>
        <div
          className="min-h-[220px] bg-cover bg-center px-3 py-4"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        >
          <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-[13px] leading-5 text-slate-800 shadow-sm">
            {preview}
            <div className="mt-1 text-right text-[10px] text-slate-500">{time}</div>
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-500">Recipients only see their own chat</div>
        </div>
      </div>
    </div>
  );
}

export default function BroadcastManager({ settings, leads }: BroadcastManagerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("Property update");
  const [message, setMessage] = useState(BROADCAST_TEMPLATES[0].message);
  const [audience, setAudience] = useState<BroadcastAudience>("ALL_PHONES");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeBroadcastId, setActiveBroadcastId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<Broadcast | null>(null);
  const [copied, setCopied] = useState(false);

  const leadsWithPhone = useMemo(() => leads.filter((lead) => lead.phone?.trim()), [leads]);

  const audienceLeads = useMemo(
    () => filterLeadsForAudience(leads as LeadForAudience[], audience, selectedLeadIds),
    [leads, audience, selectedLeadIds]
  );

  const filteredLeadsForPicker = useMemo(() => {
    const query = leadSearch.toLowerCase();
    return leadsWithPhone.filter(
      (lead) =>
        !query ||
        lead.name?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.preferredArea?.toLowerCase().includes(query)
    );
  }, [leadsWithPhone, leadSearch]);

  const previewName = audienceLeads[0]?.name || "Ali";

  async function loadBroadcasts() {
    setLoading(true);
    try {
      const response = await fetch("/api/broadcasts");
      const data = await response.json();
      if (Array.isArray(data.broadcasts)) setBroadcasts(data.broadcasts);
      setApiConfigured(Boolean(data.whatsappApiConfigured));
    } catch {
      setError("Could not load broadcasts.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBroadcastDetail(id: string) {
    const response = await fetch(`/api/broadcasts/${id}`);
    if (response.ok) setActiveDetail(await response.json());
  }

  useEffect(() => {
    loadBroadcasts();
  }, []);

  useEffect(() => {
    if (activeBroadcastId) loadBroadcastDetail(activeBroadcastId);
    else setActiveDetail(null);
  }, [activeBroadcastId]);

  function toggleLead(id: string) {
    setSelectedLeadIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
    if (audience !== "SELECTED") setAudience("SELECTED");
  }

  function selectAllVisible() {
    setAudience("SELECTED");
    setSelectedLeadIds(filteredLeadsForPicker.map((lead) => lead.id));
  }

  async function createBroadcast(sendNow: boolean) {
    setSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          audience,
          selectedLeadIds: audience === "SELECTED" ? selectedLeadIds : undefined,
          sendNow
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create broadcast.");
        return;
      }

      setSuccess(
        sendNow
          ? apiConfigured
            ? `Successfully sent to ${data.broadcast?.sentCount || 0} contacts.`
            : `Campaign created — ${data.summary?.manualCount || data.broadcast?.manualCount || 0} WhatsApp links ready.`
          : "Draft saved. Send when you're ready."
      );

      await loadBroadcasts();
      setActiveBroadcastId(data.broadcast.id);
      setStep(3);
    } catch {
      setError("Network error — could not reach the server. Restart npm run dev and try again.");
    } finally {
      setSending(false);
    }
  }

  async function sendExisting(id: string) {
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/broadcasts/${id}/send`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Send failed.");
        return;
      }
      setSuccess(
        apiConfigured
          ? `Sent to ${data.summary?.sentCount || 0} contacts.`
          : `${data.summary?.manualCount || 0} contacts ready — use Open WhatsApp below.`
      );
      await loadBroadcasts();
      await loadBroadcastDetail(id);
    } catch {
      setError("Send failed.");
    } finally {
      setSending(false);
    }
  }

  function openManualBatch(recipients: BroadcastRecipient[], template: string) {
    const pending = recipients.filter((item) => item.status === "MANUAL" || item.status === "PENDING");
    pending.slice(0, 8).forEach((recipient, index) => {
      setTimeout(() => {
        window.open(
          buildManualWhatsAppUrl(recipient.phone, personalizeBroadcastMessage(template, recipient.name)),
          "_blank",
          "noopener,noreferrer"
        );
      }, index * 600);
    });
  }

  function copyAllManualLinks(recipients: BroadcastRecipient[], template: string) {
    const links = recipients
      .map(
        (r) =>
          `${r.name || r.phone}: ${buildManualWhatsAppUrl(r.phone, personalizeBroadcastMessage(template, r.name))}`
      )
      .join("\n");
    navigator.clipboard.writeText(links);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg md:p-8"
        style={{ background: `linear-gradient(135deg, ${settings.primary} 0%, #128c7e 55%, #25d366 100%)` }}
      >
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
              <Megaphone className="h-3.5 w-3.5" />
              WhatsApp Broadcast
            </div>
            <h2 className="text-2xl font-extrabold md:text-3xl">Reach all your leads at once</h2>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Like WhatsApp broadcast lists — one message, private delivery to each contact. Personalized with their name.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div
              className={`rounded-2xl px-4 py-2 text-center text-xs font-bold backdrop-blur ${
                apiConfigured ? "bg-white/20" : "bg-black/20"
              }`}
            >
              {apiConfigured ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> API Auto-send ON
                </span>
              ) : (
                <span>Manual send via wa.me</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
                <div className="text-lg font-extrabold">{leadsWithPhone.length}</div>
                <div className="text-white/70">Contacts</div>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
                <div className="text-lg font-extrabold">{broadcasts.length}</div>
                <div className="text-white/70">Campaigns</div>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
                <div className="text-lg font-extrabold">{audienceLeads.length}</div>
                <div className="text-white/70">Selected</div>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {success}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { n: 1 as const, label: "Compose" },
          { n: 2 as const, label: "Audience" },
          { n: 3 as const, label: "Review & send" }
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <button
              type="button"
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                step === s.n ? "text-white shadow-md" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
              style={step === s.n ? { background: settings.primary } : {}}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  step === s.n ? "bg-white/20" : "bg-slate-100"
                }`}
              >
                {s.n}
              </span>
              {s.label}
            </button>
            {i < 2 && <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Main composer */}
        <div className="space-y-4">
          {step === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" style={{ color: settings.primary }} />
                <h3 className="font-extrabold">Compose your message</h3>
              </div>

              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick templates</p>
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {BROADCAST_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setTitle(template.title);
                      setMessage(template.message);
                    }}
                    className={`group rounded-2xl border p-4 text-left transition hover:shadow-md ${
                      message === template.message
                        ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{template.title}</span>
                      {message === template.message && <Check className="h-4 w-4 text-amber-600" />}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{template.message}</p>
                  </button>
                ))}
              </div>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Campaign name</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="e.g. March DHA listings"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Message</span>
                  <span className="font-normal text-slate-400">Type {"{{name}}"} for personalization</span>
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <div className="mt-1 text-right text-xs text-slate-400">{message.length} characters</div>
              </label>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white sm:w-auto sm:px-8"
                style={{ background: settings.primary }}
              >
                Choose audience <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: settings.primary }} />
                  <h3 className="font-extrabold">Select audience</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  {audienceLeads.length} recipients
                </span>
              </div>

              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {audienceOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = audience === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAudience(option.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-transparent shadow-md ring-2 ring-amber-400"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                      style={selected ? { background: `${settings.primary}08` } : {}}
                    >
                      <div className={`mb-2 inline-flex rounded-xl p-2 ${option.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="font-bold text-slate-900">{option.label}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{option.description}</div>
                    </button>
                  );
                })}
              </div>

              {audience === "SELECTED" && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder="Search name or phone…"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
                      />
                    </div>
                    <button type="button" onClick={selectAllVisible} className="text-xs font-bold text-emerald-600 hover:underline">
                      Select all visible
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filteredLeadsForPicker.map((lead) => {
                      const checked = selectedLeadIds.includes(lead.id);
                      return (
                        <label
                          key={lead.id}
                          className={`flex cursor-pointer items-center gap-3 border-b border-slate-50 px-4 py-3 transition last:border-0 ${
                            checked ? "bg-emerald-50/50" : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLead(lead.id)}
                            className="h-4 w-4 rounded accent-emerald-600"
                          />
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: settings.primary }}
                          >
                            {initials(lead.name, lead.phone!)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold">{lead.name || "Unknown"}</div>
                            <div className="text-xs text-slate-500">{lead.phone}</div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              lead.temperature === "HOT"
                                ? "bg-red-100 text-red-700"
                                : lead.temperature === "WARM"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {lead.temperature}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recipient preview strip */}
              {audienceLeads.length > 0 && audience !== "SELECTED" && (
                <div className="mb-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview recipients</p>
                  <div className="flex flex-wrap gap-2">
                    {audienceLeads.slice(0, 12).map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3"
                      >
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: settings.primary }}
                        >
                          {initials(lead.name, lead.phone!)}
                        </div>
                        <span className="text-xs font-semibold">{lead.name || lead.phone}</span>
                      </div>
                    ))}
                    {audienceLeads.length > 12 && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                        +{audienceLeads.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold">
                  Back
                </button>
                <button
                  type="button"
                  disabled={audienceLeads.length === 0}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: settings.primary }}
                >
                  Review & send <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: settings.accent }} />
                <h3 className="font-extrabold">Review & send</h3>
              </div>

              <div className="mb-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Campaign</div>
                  <div className="mt-1 font-bold">{title}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Recipients</div>
                  <div className="mt-1 text-2xl font-extrabold" style={{ color: settings.primary }}>
                    {audienceLeads.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Delivery</div>
                  <div className="mt-1 font-bold">{apiConfigured ? "Automatic (API)" : "Manual WhatsApp"}</div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 text-xs font-semibold text-slate-400">Message preview</div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {personalizeBroadcastMessage(message, previewName)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold">
                  Back
                </button>
                <button
                  type="button"
                  disabled={sending || audienceLeads.length === 0}
                  onClick={() => createBroadcast(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={sending || audienceLeads.length === 0}
                  onClick={() => createBroadcast(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 sm:flex-none sm:px-8"
                  style={{ background: "linear-gradient(135deg, #128c7e, #25d366)" }}
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Sending…" : `Send to ${audienceLeads.length} contacts`}
                </button>
              </div>
            </div>
          )}

          {/* Campaign detail */}
          {activeDetail && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold">{activeDetail.title}</h3>
                      {statusChip(activeDetail.status)}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{activeDetail.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeDetail.status === "DRAFT" && (
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => sendExisting(activeDetail.id)}
                        className="rounded-xl px-4 py-2 text-sm font-bold text-white"
                        style={{ background: settings.primary }}
                      >
                        Send now
                      </button>
                    )}
                    {!apiConfigured && activeDetail.recipients && (
                      <>
                        <button
                          type="button"
                          onClick={() => openManualBatch(activeDetail.recipients!, activeDetail.message)}
                          className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:bg-[#1ebe57]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open batch
                        </button>
                        <button
                          type="button"
                          onClick={() => copyAllManualLinks(activeDetail.recipients!, activeDetail.message)}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copied!" : "Copy links"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {activeDetail.recipientCount > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {activeDetail.sentCount} sent · {activeDetail.manualCount} manual · {activeDetail.failedCount} failed
                      </span>
                      <span>
                        {Math.round(
                          ((activeDetail.sentCount + activeDetail.manualCount) / activeDetail.recipientCount) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#25d366] transition-all"
                        style={{
                          width: `${Math.min(100, ((activeDetail.sentCount + activeDetail.manualCount) / activeDetail.recipientCount) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {activeDetail.recipients?.map((recipient) => (
                  <div key={recipient.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: settings.primary }}
                    >
                      {initials(recipient.name, recipient.phone)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{recipient.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{recipient.phone}</div>
                    </div>
                    {statusChip(recipient.status)}
                    {(recipient.status === "MANUAL" || recipient.status === "PENDING") && (
                      <a
                        href={buildManualWhatsAppUrl(
                          recipient.phone,
                          personalizeBroadcastMessage(activeDetail.message, recipient.name)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe57]"
                      >
                        Send
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: preview + history */}
        <div className="space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-slate-400">Live preview</p>
              <WhatsAppPreview message={message} name={previewName} agencyName={settings.agencyName} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-extrabold">Recent campaigns</span>
                <button
                  type="button"
                  onClick={loadBroadcasts}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="max-h-[340px] overflow-y-auto p-2">
                {loading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : broadcasts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Megaphone className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-500">No campaigns yet</p>
                  </div>
                ) : (
                  broadcasts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveBroadcastId(item.id);
                        setStep(3);
                      }}
                      className={`mb-1 w-full rounded-xl p-3 text-left transition ${
                        activeBroadcastId === item.id ? "bg-amber-50 ring-1 ring-amber-200" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-bold">{item.title}</span>
                        {statusChip(item.status)}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>{item.recipientCount} contacts</span>
                        <span>·</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {!apiConfigured && (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                <p className="text-xs font-bold text-emerald-900">Upgrade to auto-send</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                  Add <code className="rounded bg-white px-1">WHATSAPP_ACCESS_TOKEN</code> in .env for one-click delivery via Meta API.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
