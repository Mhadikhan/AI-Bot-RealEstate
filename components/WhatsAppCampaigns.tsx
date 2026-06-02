"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Flame,
  History,
  Home,
  Inbox,
  Key,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  PhoneForwarded,
  PieChart,
  Play,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  UserCheck,
  Users,
  Workflow,
  Zap
} from "lucide-react";
import {
  AUDIENCE_LABELS,
  BROADCAST_TEMPLATES,
  CAMPAIGN_CATEGORY_LABELS,
  filterLeadsForAudience,
  type BroadcastAudience,
  type CampaignCategory
} from "../lib/broadcast";
import type { BrandSettings } from "../lib/brand-settings";
import AudienceFilterPanel from "./AudienceFilterPanel";
import QuickSendPanel from "./QuickSendPanel";
import { useToast } from "./ToastProvider";
import { buildCampaignRequestBody } from "../lib/campaign-payload";
import { EMPTY_CRM_FILTERS, type CrmAudienceFilters } from "../lib/audience-filters";

type WaSection =
  | "overview"
  | "create"
  | "quick-send"
  | "history"
  | "templates"
  | "segments"
  | "scheduled"
  | "automations"
  | "conversations"
  | "analytics"
  | "settings";

type LeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  type: string;
  temperature: string;
  preferredArea: string | null;
  whatsappOptIn?: boolean;
  requiresHumanFollowUp?: boolean;
  hasUpcomingViewing?: boolean;
};

type PlatformStatus = {
  configured: boolean;
  mode: "LIVE" | "DEMO";
  provider?: "meta" | "green-api" | "none";
  providerLabel?: string;
  webhookUrl: string;
  verifyTokenSet: boolean;
};

type Campaign = {
  id: string;
  title: string;
  message: string;
  category?: string;
  status: string;
  mode: string;
  audience: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  replyCount: number;
  failedCount: number;
  manualCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  followUpSequence?: { id: string; name: string } | null;
};

type InboundMsg = {
  id: string;
  fromPhone: string;
  text: string;
  handledBy: string;
  aiReply: string | null;
  requiresAgent: boolean;
  createdAt: string;
  lead?: { name: string | null; phone: string | null; temperature: string } | null;
};

type FollowUpSeq = {
  id: string;
  name: string;
  description: string | null;
  steps: { stepOrder: number; delayHours: number; messageTemplate: string }[];
  _count?: { enrollments: number };
};

const NAV: { id: WaSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "create", label: "Create Broadcast", icon: PlusCircle },
  { id: "quick-send", label: "Phone List Send", icon: PhoneForwarded },
  { id: "history", label: "Campaign History", icon: History },
  { id: "templates", label: "Message Templates", icon: FileText },
  { id: "segments", label: "Audience Segments", icon: Users },
  { id: "scheduled", label: "Scheduled Campaigns", icon: Calendar },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "conversations", label: "WhatsApp Conversations", icon: Inbox },
  { id: "analytics", label: "Analytics", icon: PieChart },
  { id: "settings", label: "Settings", icon: Settings }
];

const audienceOptions: { id: BroadcastAudience; label: string; icon: typeof Users }[] = [
  { id: "OPTED_IN", label: "Opted-in", icon: UserCheck },
  { id: "HOT", label: "Hot", icon: Flame },
  { id: "WARM", label: "Warm", icon: Zap },
  { id: "COLD", label: "Cold", icon: Users },
  { id: "BUYERS", label: "Buyers", icon: Home },
  { id: "TENANTS", label: "Tenants", icon: Key },
  { id: "INVESTORS", label: "Investors", icon: BarChart3 },
  { id: "VIEWING_BOOKED", label: "Viewings", icon: MessageSquare },
  { id: "CALLBACKS", label: "Callbacks", icon: Zap },
  { id: "AGENT_FOLLOW_UP", label: "Agent queue", icon: UserCheck },
  { id: "SELECTED", label: "Hand-pick", icon: UserCheck }
];

const SEGMENT_IDS: BroadcastAudience[] = [
  "OPTED_IN",
  "HOT",
  "WARM",
  "COLD",
  "BUYERS",
  "TENANTS",
  "INVESTORS",
  "SELLERS",
  "LANDLORDS",
  "CALLBACKS",
  "VIEWING_BOOKED",
  "AGENT_FOLLOW_UP"
];

function campaignMatchesSearch(c: Campaign, q: string) {
  const title = (c.title || "").toLowerCase();
  const message = (c.message || "").toLowerCase();
  const status = (c.status || "").toLowerCase();
  const mode = (c.mode || "").toLowerCase();
  const audience = (c.audience || "").toLowerCase();
  const audienceLabel = (AUDIENCE_LABELS[c.audience as BroadcastAudience] || "").toLowerCase();
  const categoryKey = (c.category || "").toLowerCase();
  const categoryLabel = c.category
    ? (CAMPAIGN_CATEGORY_LABELS[c.category as CampaignCategory] || c.category).toLowerCase()
    : "";

  return (
    title.includes(q) ||
    message.includes(q) ||
    status.includes(q) ||
    mode.includes(q) ||
    audience.includes(q) ||
    audienceLabel.includes(q) ||
    categoryKey.includes(q) ||
    categoryLabel.includes(q) ||
    (c.followUpSequence?.name || "").toLowerCase().includes(q)
  );
}

function StatusBadge({ status, mode }: { status: string; mode?: string }) {
  const labels: Record<string, string> = {
    SIMULATED: "Simulated",
    SUBMITTED: "Submitted",
    SENT: "Sent",
    DELIVERED: "Delivered",
    READ: "Read",
    FAILED: "Failed",
    QUEUED: "Pending send",
    SCHEDULED: "Scheduled",
    DRAFT: "Draft — not sent",
    SENDING: "Sending",
    PARTIAL: "Partial",
    CANCELLED: "Cancelled"
  };
  const simulated = status === "SIMULATED" || mode === "DEMO";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        simulated
          ? "bg-violet-100 text-violet-800"
          : status === "DELIVERED" || status === "READ"
            ? "bg-emerald-100 text-emerald-800"
            : status === "FAILED"
              ? "bg-red-100 text-red-800"
              : "bg-slate-100 text-slate-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export default function WhatsAppCampaigns({
  settings,
  leads
}: {
  settings: BrandSettings;
  leads: LeadRow[];
}) {
  const [section, setSection] = useState<WaSection>("overview");
  const [platform, setPlatform] = useState<PlatformStatus | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [inbound, setInbound] = useState<InboundMsg[]>([]);
  const [sequences, setSequences] = useState<FollowUpSeq[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  const [category, setCategory] = useState<CampaignCategory>("NEW_PROPERTY_ALERT");
  const [title, setTitle] = useState(BROADCAST_TEMPLATES[0].title);
  const [message, setMessage] = useState(BROADCAST_TEMPLATES[0].message);
  const [audience, setAudience] = useState<BroadcastAudience>("OPTED_IN");
  const [crmFilters, setCrmFilters] = useState<CrmAudienceFilters>({ ...EMPTY_CRM_FILTERS });
  const [audienceMatchCount, setAudienceMatchCount] = useState<number | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [followUpSequenceId, setFollowUpSequenceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const audienceLeads = useMemo(
    () => filterLeadsForAudience(leads, audience, selectedLeadIds, { requireOptIn: true }),
    [leads, audience, selectedLeadIds]
  );

  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of SEGMENT_IDS) {
      counts[id] = filterLeadsForAudience(leads, id, [], { requireOptIn: true }).length;
    }
    return counts;
  }, [leads]);

  const scheduledCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          c.status === "SCHEDULED" ||
          c.status === "DRAFT" ||
          (c.scheduledAt && new Date(c.scheduledAt) > new Date())
      ),
    [campaigns]
  );

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => campaignMatchesSearch(c, q));
  }, [campaigns, historySearch]);

  const totals = useMemo(
    () => ({
      campaigns: campaigns.length,
      recipients: campaigns.reduce((s, c) => s + c.recipientCount, 0),
      sent: campaigns.reduce((s, c) => s + c.sentCount, 0),
      delivered: campaigns.reduce((s, c) => s + c.deliveredCount, 0),
      read: campaigns.reduce((s, c) => s + c.readCount, 0),
      replies: campaigns.reduce((s, c) => s + c.replyCount, 0),
      simulated: campaigns.reduce((s, c) => s + (c.manualCount || 0), 0)
    }),
    [campaigns]
  );

  const activeCampaign = campaigns.find((c) => c.id === activeId);

  function applyTemplate(template: (typeof BROADCAST_TEMPLATES)[number], goCreate = false) {
    setCategory(template.category);
    setTitle(template.title);
    setMessage(template.message);
    setAudience("OPTED_IN");
    setCrmFilters({ ...EMPTY_CRM_FILTERS });
    if (goCreate) setSection("create");
  }

  function updateCrmFilters(next: CrmAudienceFilters) {
    setCrmFilters(next);
    if (next.audiencePreset) setAudience(next.audiencePreset);
  }

  const pendingQueued = useMemo(() => {
    return campaigns.reduce((sum, c) => {
      const queued = c.recipients?.filter((r) => r.status === "QUEUED").length ?? 0;
      return sum + queued;
    }, 0);
  }, [campaigns]);

  async function loadAll(notify = false) {
    setLoading(true);
    try {
      await fetch("/api/whatsapp/analytics?reconcile=1").catch(() => null);
      const [campRes, statusRes, inboundRes, seqRes] = await Promise.all([
        fetch("/api/whatsapp/campaigns"),
        fetch("/api/whatsapp/status"),
        fetch("/api/whatsapp/inbound"),
        fetch("/api/whatsapp/follow-ups")
      ]);
      const campData = await campRes.json();
      setPlatform(await statusRes.json());
      if (Array.isArray(campData.campaigns)) setCampaigns(campData.campaigns);
      setInbound(await inboundRes.json().then((d) => (Array.isArray(d) ? d : [])));
      setSequences(await seqRes.json().then((d) => (Array.isArray(d) ? d : [])));
      if (notify) toast.success("WhatsApp campaigns refreshed.");
    } catch {
      toast.error("Failed to load WhatsApp module.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics(id: string) {
    const res = await fetch(`/api/whatsapp/campaigns/${id}?analytics=1`);
    if (res.ok) setAnalytics(await res.json());
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeId) loadAnalytics(activeId);
    else setAnalytics(null);
  }, [activeId]);

  async function createCampaign(sendNow: boolean) {
    if (!title.trim() || title.trim().length < 2) {
      toast.error("Campaign title must be at least 2 characters.");
      return;
    }
    if (!message.trim()) {
      toast.error("Message body is required.");
      return;
    }

    setSending(true);
    try {
      const payload = buildCampaignRequestBody({
        title,
        message,
        category,
        audience,
        crmFilters,
        selectedLeadIds,
        scheduledAt,
        followUpSequenceId,
        sendNow
      });

      const previewRes = await fetch("/api/whatsapp/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crmFilters: payload.crmFilters })
      });
      const previewData = await previewRes.json().catch(() => ({}));
      if (!previewRes.ok) {
        throw new Error(typeof previewData.error === "string" ? previewData.error : "Could not verify audience.");
      }
      setAudienceMatchCount(previewData.count ?? 0);

      const preset = (payload.crmFilters.audiencePreset || payload.audience) as BroadcastAudience;
      if (preset === "SELECTED" && !(payload.selectedLeadIds?.length || payload.crmFilters.selectedLeadIds?.length)) {
        toast.error("Select at least one lead under Hand-pick in Step 2.");
        return;
      }

      if ((previewData.count ?? 0) === 0) {
        const relaxedRes = await fetch("/api/whatsapp/audience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crmFilters: { whatsappOptIn: true, audiencePreset: "OPTED_IN" }
          })
        });
        const relaxed = await relaxedRes.json().catch(() => ({}));
        if (relaxedRes.ok && (relaxed.count ?? 0) > 0) {
          payload.crmFilters = { whatsappOptIn: true, audiencePreset: "OPTED_IN" };
          payload.audience = "OPTED_IN";
          updateCrmFilters(payload.crmFilters);
          setAudienceMatchCount(relaxed.count);
          toast.info(`Audience widened to all opted-in contacts (${relaxed.count} match${relaxed.count === 1 ? "" : "es"}).`);
        } else {
          const label = AUDIENCE_LABELS[preset] || preset;
          toast.error(
            `No leads match "${label}". Add leads with phone numbers, use Opted-in contacts, or click Reset all filters in Step 2.`
          );
          return;
        }
      }

      const res = await fetch("/api/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Create failed");

      const processed = data.summary?.simulatedCount ?? data.summary?.sentCount ?? previewData.count ?? 0;
      const isDemo = data.campaign?.mode === "DEMO";

      if (sendNow && payload.sendNow) {
        toast.success(
          isDemo
            ? `Simulated broadcast complete — ${processed} private WhatsApp message(s) marked SIMULATED.`
            : `Live broadcast sent — ${processed} contact(s) submitted to Meta.`
        );
      } else if (payload.scheduledAt) {
        toast.success("Campaign scheduled successfully.");
      } else {
        toast.success("Campaign draft saved.");
      }

      setActiveId(data.campaign?.id);
      await loadAll();
      setSection(payload.scheduledAt ? "scheduled" : "history");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSending(false);
    }
  }

  async function runAutomation() {
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/automation/run", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Automation failed");
      toast.success(
        `Automation complete — ${data.campaignsProcessed || 0} campaign(s), ${data.followUpsProcessed || 0} follow-up(s).`
      );
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Automation failed");
    } finally {
      setSending(false);
    }
  }

  async function sendCampaignNow(id: string) {
    setSending(true);
    try {
      const res = await fetch(`/api/whatsapp/campaigns/${id}/send`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Send failed");
      const count = data.summary?.simulatedCount ?? data.summary?.sentCount ?? 0;
      toast.success(
        data.campaign?.mode === "DEMO"
          ? `Simulated broadcast — ${count} contact(s) processed.`
          : `Broadcast sent — ${count} contact(s).`
      );
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${settings.primary}, #128c7e 55%, #25d366)` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold text-white/80">
              <Megaphone className="h-3.5 w-3.5" />
              WhatsApp Campaigns
            </div>
            <h2 className="text-xl font-extrabold">Business Platform</h2>
            <p className="mt-0.5 text-xs text-white/80">Private 1:1 messages · Opted-in leads only · {platform?.mode || "…"} mode</p>
          </div>
          <button
            type="button"
            onClick={() => loadAll(true)}
            className="rounded-xl bg-white/15 p-2 backdrop-blur hover:bg-white/25"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {(scheduledCampaigns.length > 0 || pendingQueued > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>
            <strong>{scheduledCampaigns.length}</strong> scheduled/draft · <strong>{pendingQueued}</strong> contacts pending send
            {platform?.mode === "DEMO" && " (DEMO — will mark SIMULATED)"}
          </span>
          <button
            type="button"
            disabled={sending}
            onClick={runAutomation}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Process pending
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <nav className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:w-56">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp Campaigns</p>
          <ul className="space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setSection(id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    section === id ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                  }`}
                  style={section === id ? { background: settings.primary } : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="leading-tight">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          {section === "overview" && (
            <OverviewPanel
              settings={settings}
              platform={platform}
              totals={totals}
              campaigns={campaigns.slice(0, 5)}
              inboundCount={inbound.length}
              sequencesCount={sequences.length}
              agentQueue={segmentCounts.AGENT_FOLLOW_UP || 0}
              onNavigate={setSection}
              onSelectCampaign={(id) => {
                setActiveId(id);
                setSection("analytics");
              }}
            />
          )}

          {section === "quick-send" && (
            <QuickSendPanel
              settings={settings}
              platform={platform}
              sending={sending}
              onSendingChange={setSending}
              onSent={() => {
                loadAll();
                setSection("history");
              }}
            />
          )}

          {section === "create" && (
            <CreateBroadcastPanel
              settings={settings}
              platform={platform}
              category={category}
              title={title}
              message={message}
              scheduledAt={scheduledAt}
              followUpSequenceId={followUpSequenceId}
              selectedLeadIds={selectedLeadIds}
              sequences={sequences}
              leads={leads}
              sending={sending}
              crmFilters={crmFilters}
              audienceMatchCount={audienceMatchCount}
              onApplyTemplate={applyTemplate}
              onCategory={setCategory}
              onTitle={setTitle}
              onMessage={setMessage}
              onCrmFilters={updateCrmFilters}
              onAudienceMatchCount={setAudienceMatchCount}
              onScheduledAt={setScheduledAt}
              onFollowUp={setFollowUpSequenceId}
              onSelectedLeads={setSelectedLeadIds}
              onCreate={createCampaign}
            />
          )}

          {section === "history" && (
            <CampaignHistoryPanel
              campaigns={filteredHistory}
              totalCount={campaigns.length}
              search={historySearch}
              onSearch={setHistorySearch}
              activeId={activeId}
              onSelect={setActiveId}
              onOpenAnalytics={(id) => {
                setActiveId(id);
                setSection("analytics");
              }}
            />
          )}

          {section === "templates" && (
            <TemplatesPanel
              settings={settings}
              selectedCategory={category}
              onUse={(t) => {
                applyTemplate(t, true);
                toast.success(`Template applied: ${t.title}`);
              }}
            />
          )}

          {section === "segments" && (
            <SegmentsPanel
              settings={settings}
              counts={segmentCounts}
              totalOptedIn={segmentCounts.OPTED_IN || 0}
              onUseSegment={(aud) => {
                setAudience(aud);
                setCrmFilters((f) => ({ ...f, audiencePreset: aud }));
                setSection("create");
                toast.success(`Audience preset set to ${AUDIENCE_LABELS[aud]}`);
              }}
            />
          )}

          {section === "scheduled" && (
            <ScheduledPanel
              campaigns={scheduledCampaigns}
              sending={sending}
              onRunAutomation={runAutomation}
              onSendNow={sendCampaignNow}
              onSelect={setActiveId}
            />
          )}

          {section === "automations" && (
            <AutomationsPanel settings={settings} sequences={sequences} sending={sending} onRun={runAutomation} onCreated={loadAll} />
          )}

          {section === "conversations" && (
            <ConversationsPanel
              settings={settings}
              platform={platform}
              inbound={inbound}
              leads={leads}
              onRefresh={loadAll}
              onOpenSettings={() => setSection("settings")}
            />
          )}

          {section === "analytics" && (
            <div className="space-y-4">
              <Link
                href="/admin/whatsapp"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 py-6 text-sm font-bold text-violet-800 hover:bg-violet-100"
              >
                <PieChart className="h-5 w-5" />
                Open full analytics dashboard (KPIs & charts)
              </Link>
              <AnalyticsPanel
                settings={settings}
                campaigns={campaigns}
                activeCampaign={activeCampaign}
                analytics={analytics}
                totals={totals}
                platform={platform}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </div>
          )}

          {section === "settings" && platform && (
            <SettingsPanel
              platform={platform}
              copied={copied}
              onCopy={() => {
                navigator.clipboard.writeText(platform.webhookUrl);
                setCopied(true);
                toast.success("Webhook URL copied to clipboard.");
                setTimeout(() => setCopied(false), 1500);
              }}
              onRefresh={loadAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({
  settings,
  platform,
  totals,
  campaigns,
  inboundCount,
  sequencesCount,
  agentQueue,
  onNavigate,
  onSelectCampaign
}: {
  settings: BrandSettings;
  platform: PlatformStatus | null;
  totals: { campaigns: number; recipients: number; sent: number; delivered: number; replies: number; simulated: number };
  campaigns: Campaign[];
  inboundCount: number;
  sequencesCount: number;
  agentQueue: number;
  onNavigate: (s: WaSection) => void;
  onSelectCampaign: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <PanelHeader title="Overview" subtitle="Campaign health, inbox, and quick actions" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Campaigns", value: totals.campaigns, color: "bg-slate-50" },
          { label: "Recipients", value: totals.recipients, color: "bg-blue-50" },
          { label: "Delivered*", value: totals.delivered, color: "bg-emerald-50" },
          { label: "Replies", value: totals.replies, color: "bg-amber-50" }
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border border-slate-200 p-4 ${stat.color}`}>
            <div className="text-2xl font-extrabold">{stat.value}</div>
            <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
      <Link
        href="/admin/whatsapp"
        className="flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 p-4 hover:bg-violet-100"
      >
        <div className="flex items-center gap-3">
          <PieChart className="h-8 w-8 text-violet-600" />
          <div>
            <div className="font-bold text-violet-900">Full analytics dashboard</div>
            <div className="text-xs text-violet-700">KPIs, charts, funnel at /admin/whatsapp</div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-violet-500" />
      </Link>
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate("create")}
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left"
        >
          <Send className="h-8 w-8 text-emerald-600" />
          <div>
            <div className="font-bold text-emerald-900">Create broadcast</div>
            <div className="text-xs text-emerald-700">1:1 personalized messages</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("conversations")}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
        >
          <Inbox className="h-8 w-8" style={{ color: settings.primary }} />
          <div>
            <div className="font-bold">{inboundCount} conversations</div>
            <div className="text-xs text-slate-500">AI + agent handover</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("automations")}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
        >
          <Workflow className="h-8 w-8 text-violet-600" />
          <div>
            <div className="font-bold">{sequencesCount} automations</div>
            <div className="text-xs text-slate-500">{agentQueue} need agent follow-up</div>
          </div>
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-extrabold">Recent campaigns</span>
          <button type="button" onClick={() => onNavigate("history")} className="text-xs font-bold" style={{ color: settings.primary }}>
            View all
          </button>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-500">No campaigns yet. Create your first broadcast.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCampaign(c.id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-bold">{c.title}</div>
                  <div className="text-[10px] text-slate-500">
                    {c.recipientCount} contacts · {platform?.mode}
                  </div>
                </div>
                <StatusBadge status={c.status} mode={c.mode} />
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400">*Delivered/read counts update via Meta webhooks in LIVE mode only.</p>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function CreateBroadcastPanel(props: {
  settings: BrandSettings;
  platform: PlatformStatus | null;
  category: CampaignCategory;
  title: string;
  message: string;
  crmFilters: CrmAudienceFilters;
  audienceMatchCount: number | null;
  scheduledAt: string;
  followUpSequenceId: string;
  selectedLeadIds: string[];
  sequences: FollowUpSeq[];
  leads: LeadRow[];
  sending: boolean;
  onApplyTemplate: (t: (typeof BROADCAST_TEMPLATES)[number]) => void;
  onCategory: (c: CampaignCategory) => void;
  onTitle: (v: string) => void;
  onMessage: (v: string) => void;
  onCrmFilters: (f: CrmAudienceFilters) => void;
  onAudienceMatchCount: (n: number | null) => void;
  onScheduledAt: (v: string) => void;
  onFollowUp: (v: string) => void;
  onSelectedLeads: (ids: string[]) => void;
  onCreate: (sendNow: boolean) => void;
}) {
  const p = props;
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <PanelHeader title="Create Broadcast" subtitle="Step 1: Campaign · Step 2: CRM audience · Step 3: Send" />
      <p className="text-xs font-bold uppercase text-slate-400">Step 1 — Campaign type & message</p>
      <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
        {BROADCAST_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => p.onApplyTemplate(t)}
            className={`rounded-xl border p-2.5 text-left text-xs ${
              p.category === t.category ? "border-amber-400 bg-amber-50" : "border-slate-200"
            }`}
          >
            <div className="font-bold">{CAMPAIGN_CATEGORY_LABELS[t.category]}</div>
          </button>
        ))}
      </div>
      <input
        value={p.title}
        onChange={(e) => p.onTitle(e.target.value)}
        placeholder="Campaign name"
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
      />
      <textarea
        value={p.message}
        onChange={(e) => p.onMessage(e.target.value)}
        rows={5}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        placeholder="Hi {{name}}, …"
      />

      <AudienceFilterPanel
        primary={p.settings.primary}
        filters={p.crmFilters}
        onChange={p.onCrmFilters}
        selectedLeadIds={p.selectedLeadIds}
        onSelectedLeadIdsChange={p.onSelectedLeads}
        onMatchCountChange={p.onAudienceMatchCount}
        leadsForHandPick={p.leads.filter((l) => l.phone)}
      />

      <p className="text-xs font-bold uppercase text-slate-400">Step 3 — Schedule & send</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-500">
          Schedule
          <input
            type="datetime-local"
            value={p.scheduledAt}
            onChange={(e) => p.onScheduledAt(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Follow-up sequence
          <select
            value={p.followUpSequenceId}
            onChange={(e) => p.onFollowUp(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {p.sequences.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm font-bold">
        {p.audienceMatchCount ?? "…"} opted-in matches · {p.platform?.mode} mode
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={p.sending}
          onClick={() => p.onCreate(true)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "#25D366" }}
        >
          <Send className="h-4 w-4" />
          {p.platform?.mode === "DEMO" ? "Simulate broadcast" : "Send live"}
        </button>
        <button
          type="button"
          disabled={p.sending}
          onClick={() => p.onCreate(false)}
          className="rounded-xl border px-4 py-2.5 text-sm font-bold"
        >
          Save draft / schedule
        </button>
      </div>
    </div>
  );
}

function CampaignHistoryPanel({
  campaigns,
  totalCount,
  search,
  onSearch,
  activeId,
  onSelect,
  onOpenAnalytics
}: {
  campaigns: Campaign[];
  totalCount: number;
  search: string;
  onSearch: (v: string) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onOpenAnalytics: (id: string) => void;
}) {
  const query = search.trim();
  const hasFilter = query.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <PanelHeader title="Campaign History" subtitle="All broadcasts sent or simulated" />
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by title, status, type, audience…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            aria-label="Search campaigns"
          />
          {hasFilter && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>
        {totalCount > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {hasFilter
              ? `Showing ${campaigns.length} of ${totalCount} campaign${totalCount === 1 ? "" : "s"}`
              : `${totalCount} campaign${totalCount === 1 ? "" : "s"}`}
          </p>
        )}
      </div>
      <div className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
        {totalCount === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No campaigns yet. Create one under Create Broadcast.</p>
        ) : campaigns.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No campaigns match &ldquo;{query}&rdquo;. Try title, status (e.g. SENT), or category.
          </p>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className={`flex flex-wrap items-center justify-between gap-3 p-4 ${activeId === c.id ? "bg-amber-50/50" : ""}`}
            >
              <button type="button" onClick={() => onSelect(c.id)} className="min-w-0 flex-1 text-left">
                <div className="font-bold">{c.title}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                  {c.category && (
                    <span>{CAMPAIGN_CATEGORY_LABELS[c.category as CampaignCategory]}</span>
                  )}
                  <span>{AUDIENCE_LABELS[c.audience as BroadcastAudience] || c.audience}</span>
                  <span>{c.recipientCount} recipients</span>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} mode={c.mode} />
                <button
                  type="button"
                  onClick={() => onOpenAnalytics(c.id)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold"
                >
                  Analytics
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TemplatesPanel({
  settings,
  selectedCategory,
  onUse
}: {
  settings: BrandSettings;
  selectedCategory: CampaignCategory;
  onUse: (t: (typeof BROADCAST_TEMPLATES)[number]) => void;
}) {
  return (
    <div className="space-y-4">
      <PanelHeader title="Message Templates" subtitle="12 real-estate campaign types with {{name}} personalization" />
      <div className="grid gap-4 sm:grid-cols-2">
        {BROADCAST_TEMPLATES.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              selectedCategory === t.category ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
            }`}
          >
            <div className="font-extrabold text-slate-900">{CAMPAIGN_CATEGORY_LABELS[t.category]}</div>
            <p className="mt-1 text-xs text-slate-500">{t.description}</p>
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{t.message}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">
                Default: {AUDIENCE_LABELS[t.defaultAudience]}
              </span>
              <button
                type="button"
                onClick={() => onUse(t)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: settings.primary }}
              >
                Use in broadcast
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentsPanel({
  settings,
  counts,
  totalOptedIn,
  onUseSegment
}: {
  settings: BrandSettings;
  counts: Record<string, number>;
  totalOptedIn: number;
  onUseSegment: (aud: BroadcastAudience) => void;
}) {
  return (
    <div className="space-y-4">
      <PanelHeader
        title="Audience Segments"
        subtitle={`${totalOptedIn} opted-in contacts with phone numbers — segments filter who receives each broadcast`}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SEGMENT_IDS.map((id) => (
          <div key={id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-extrabold" style={{ color: settings.primary }}>
              {counts[id] ?? 0}
            </div>
            <div className="mt-1 font-bold text-slate-900">{AUDIENCE_LABELS[id]}</div>
            <button
              type="button"
              onClick={() => onUseSegment(id)}
              className="mt-3 text-xs font-bold underline"
              style={{ color: settings.primary }}
            >
              Create broadcast →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduledPanel({
  campaigns,
  sending,
  onRunAutomation,
  onSendNow,
  onSelect
}: {
  campaigns: Campaign[];
  sending: boolean;
  onRunAutomation: () => void;
  onSendNow: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHeader title="Scheduled Campaigns" subtitle="Drafts and future send times — run automation to process due items" />
        <button
          type="button"
          disabled={sending}
          onClick={onRunAutomation}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
        >
          <Play className="h-4 w-4" />
          Run due now
        </button>
      </div>
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No scheduled or draft campaigns. Use Create Broadcast and set a schedule time.
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="min-w-0 flex-1 text-left hover:opacity-80"
              >
                <div className="font-bold">{c.title}</div>
                <div className="text-xs text-slate-500">
                  {c.scheduledAt ? `Scheduled: ${new Date(c.scheduledAt).toLocaleString()}` : "Draft — not sent yet"}
                  · {c.recipientCount} recipients
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => onSendNow(c.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Send now
                </button>
                <StatusBadge status={c.status} mode={c.mode} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutomationsPanel({
  settings,
  sequences,
  sending,
  onRun,
  onCreated
}: {
  settings: BrandSettings;
  sequences: FollowUpSeq[];
  sending: boolean;
  onRun: () => void;
  onCreated: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PanelHeader title="Automations" subtitle="Follow-up sequences after campaigns + scheduled send processor" />
        <button
          type="button"
          disabled={sending}
          onClick={onRun}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ background: settings.primary }}
        >
          <Sparkles className="h-4 w-4" />
          Run automation
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sequences.map((seq) => (
          <div key={seq.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="font-extrabold">{seq.name}</div>
            <p className="mt-1 text-xs text-slate-500">{seq.description}</p>
            <div className="mt-3 space-y-2">
              {seq.steps.map((step) => (
                <div key={step.stepOrder} className="rounded-xl bg-slate-50 p-3 text-xs">
                  <div className="font-bold">
                    Step {step.stepOrder} — +{step.delayHours}h
                  </div>
                  <p className="mt-1 line-clamp-2 text-slate-600">{step.messageTemplate}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">{seq._count?.enrollments || 0} enrollments</p>
          </div>
        ))}
        <FollowUpCreator onCreated={onCreated} primary={settings.primary} />
      </div>
    </div>
  );
}

function ConversationsPanel({
  settings,
  platform,
  inbound,
  leads,
  onRefresh,
  onOpenSettings
}: {
  settings: BrandSettings;
  platform: PlatformStatus | null;
  inbound: InboundMsg[];
  leads: LeadRow[];
  onRefresh: () => void;
  onOpenSettings: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fromPhone, setFromPhone] = useState("");
  const [simulateText, setSimulateText] = useState("Hi, I am interested in your DHA listing. Is it still available?");

  const leadsWithPhone = useMemo(() => leads.filter((l) => l.phone?.trim()), [leads]);

  useEffect(() => {
    if (!fromPhone && leadsWithPhone[0]?.phone) {
      setFromPhone(leadsWithPhone[0].phone!);
    }
  }, [fromPhone, leadsWithPhone]);

  async function seedDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_demo", force: inbound.length > 0 })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load demo conversations");
      if (data.skipped) {
        toast.info("Conversations already exist. Use simulate reply to add more.");
      } else {
        toast.success(`Loaded ${data.created || 0} demo conversation(s) with AI replies.`);
      }
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function simulateReply() {
    if (!fromPhone.trim() || !simulateText.trim()) {
      toast.error("Select a contact and enter a message.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate", fromPhone: fromPhone.trim(), text: simulateText.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Simulate failed");
      toast.success(data.handledBy === "AGENT" ? "Routed to agent queue." : "Inbound simulated — AI reply saved.");
      setSimulateText("");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <PanelHeader
              title="WhatsApp Conversations"
              subtitle="Inbound replies → AI advisor or agent handover (webhook in LIVE, simulate in DEMO)"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => onRefresh()}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={seedDemo}
                className="rounded-xl px-3 py-2 text-xs font-bold text-white"
                style={{ background: settings.primary }}
              >
                Load demo conversations
              </button>
            </div>
          </div>
        </div>

        {inbound.length === 0 ? (
          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5">
              <div className="mb-2 flex items-center gap-2 font-bold text-emerald-900">
                <Inbox className="h-5 w-5" />
                Start the conversation workflow
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-emerald-900/90">
                <li>
                  <strong>DEMO (now):</strong> Click <em>Load demo conversations</em> or simulate a reply below — AI
                  responses are saved in the database (not sent to WhatsApp without LIVE credentials).
                </li>
                <li>
                  <strong>LIVE:</strong> In{" "}
                  <button type="button" onClick={onOpenSettings} className="font-bold underline">
                    Settings
                  </button>
                  , copy the webhook URL into Meta Developer Console → WhatsApp → Configuration.
                </li>
                <li>Set <code className="rounded bg-white px-1">WHATSAPP_VERIFY_TOKEN</code> in `.env` to match Meta.</li>
                <li>When a lead replies to a campaign, messages appear here with AI auto-reply or agent queue.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase text-slate-500">Simulate inbound reply</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  From (lead phone)
                  <select
                    value={fromPhone}
                    onChange={(e) => setFromPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select lead…</option>
                    {leadsWithPhone.map((l) => (
                      <option key={l.id} value={l.phone!}>
                        {l.name || l.phone} · {l.type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                  Message
                  <textarea
                    value={simulateText}
                    onChange={(e) => setSimulateText(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="Lead's WhatsApp message…"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={simulateReply}
                className="mt-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                style={{ background: "#25D366" }}
              >
                Simulate inbound message
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inbound.map((msg) => (
              <div key={msg.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-bold">{msg.lead?.name || msg.fromPhone}</div>
                    {msg.lead?.type && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {msg.lead.type}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Inbound</span>
                    <p className="mt-0.5">{msg.text}</p>
                  </div>
                  {msg.aiReply && (
                    <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                        <Bot className="h-3 w-3" />
                        AI reply {platform?.mode === "DEMO" ? "(demo — not sent to WhatsApp)" : ""}
                      </span>
                      <p className="mt-0.5">{msg.aiReply}</p>
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-center text-[10px] font-bold ${
                      msg.handledBy === "AGENT" || msg.requiresAgent
                        ? "bg-red-100 text-red-700"
                        : msg.handledBy === "AI"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {msg.handledBy}
                  </span>
                  {(msg.requiresAgent || msg.handledBy === "AGENT") && msg.handledBy !== "AGENT" && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch("/api/whatsapp/inbound", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "assign_agent", messageId: msg.id })
                        });
                        if (res.ok) {
                          toast.success("Agent assigned to conversation.");
                          onRefresh();
                        } else {
                          toast.error("Could not assign agent.");
                        }
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      style={{ background: settings.primary }}
                    >
                      Assign agent
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inbound.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Add another test message</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={fromPhone}
              onChange={(e) => setFromPhone(e.target.value)}
              className="min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {leadsWithPhone.map((l) => (
                <option key={l.id} value={l.phone!}>
                  {l.name || l.phone}
                </option>
              ))}
            </select>
            <input
              value={simulateText}
              onChange={(e) => setSimulateText(e.target.value)}
              placeholder="Simulate lead reply…"
              className="min-w-[200px] flex-[2] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={loading}
              onClick={simulateReply}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: "#25D366" }}
            >
              Send test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel({
  settings,
  campaigns,
  activeCampaign,
  analytics,
  totals,
  platform,
  activeId,
  onSelect
}: {
  settings: BrandSettings;
  campaigns: Campaign[];
  activeCampaign?: Campaign;
  analytics: Record<string, unknown> | null;
  totals: { sent: number; delivered: number; read: number; replies: number; simulated: number };
  platform: PlatformStatus | null;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const deliveryRate = totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 100) : 0;
  const readRate = totals.delivered > 0 ? Math.round((totals.read / totals.delivered) * 100) : 0;

  return (
    <div className="space-y-4">
      <PanelHeader title="Analytics" subtitle="Webhook-confirmed metrics in LIVE mode" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Sent", value: totals.sent },
          { label: "Delivered", value: totals.delivered },
          { label: "Read", value: totals.read },
          { label: "Replies", value: totals.replies },
          { label: "Simulated", value: totals.simulated }
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-xl font-extrabold">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-bold text-slate-500">Delivery rate</div>
          <div className="text-3xl font-extrabold" style={{ color: settings.primary }}>
            {deliveryRate}%
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-bold text-slate-500">Read rate</div>
          <div className="text-3xl font-extrabold text-blue-600">{readRate}%</div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-bold text-slate-500">Campaign detail</label>
        <select
          value={activeId || ""}
          onChange={(e) => onSelect(e.target.value)}
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Select a campaign…</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.status})
            </option>
          ))}
        </select>
        {activeCampaign && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Recipients" value={activeCampaign.recipientCount} />
            <Metric label="Sent" value={activeCampaign.sentCount} />
            <Metric label="Delivered" value={activeCampaign.deliveredCount} />
            <Metric label="Read" value={activeCampaign.readCount} />
          </div>
        )}
        {platform?.mode === "DEMO" && (
          <p className="mt-3 text-xs text-violet-700">Demo mode: delivery metrics stay at zero unless webhooks are simulated.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function SettingsPanel({
  platform,
  copied,
  onCopy,
  onRefresh
}: {
  platform: PlatformStatus;
  copied: boolean;
  onCopy: () => void;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [testing, setTesting] = useState(false);
  const [liveTesting, setLiveTesting] = useState(false);
  const [setup, setSetup] = useState<{
    checklist: Array<{ id: string; label: string; done: boolean; hint?: string }>;
    testNumberHint: string;
  } | null>(null);
  const testPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+923412879311";
  const appUrl = typeof window !== "undefined" ? window.location.origin : platform.webhookUrl.replace(/\/api\/whatsapp\/webhook$/, "");

  useEffect(() => {
    fetch("/api/whatsapp/setup")
      .then((r) => r.json())
      .then((d) => d.setup && setSetup(d.setup))
      .catch(() => null);
  }, []);

  async function testLiveSend() {
    setLiveTesting(true);
    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: "PropertyConnect AI — your WhatsApp API is working.",
          deliveryMethod: "template",
          templateName: "hello_world",
          templateLanguage: "en_US"
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Send failed");
      toast.success(`Message sent to ${testPhone}. Check WhatsApp on your phone.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Live test failed");
    } finally {
      setLiveTesting(false);
    }
  }

  async function testWebhookSimulate() {
    setTesting(true);
    try {
      const res = await fetch("/api/whatsapp/webhook/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "INTERESTED — please share details for the DHA apartment.",
          fromPhone: "923009999999"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Webhook test failed");
      toast.success("Webhook test OK — check Conversations tab.");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PanelHeader title="Settings" subtitle="WhatsApp Cloud API & webhook — connects campaigns to Conversations" />
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex justify-between rounded-xl bg-slate-50 p-3">
            <span>API mode</span>
            <strong className={platform.configured ? "text-emerald-700" : "text-violet-700"}>
              {platform.configured ? "LIVE" : "DEMO"}
            </strong>
          </li>
          <li className="flex justify-between rounded-xl bg-slate-50 p-3">
            <span>Service</span>
            <strong>{platform.providerLabel || "Not configured"}</strong>
          </li>
          <li className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-500">Webhook URL (paste in Meta)</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 break-all text-xs">{platform.webhookUrl}</code>
              <button type="button" onClick={onCopy} title="Copy URL">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </li>
          <li className="flex justify-between rounded-xl bg-slate-50 p-3">
            <span>Verify token</span>
            <strong>{platform.verifyTokenSet ? "Configured" : "Set WHATSAPP_VERIFY_TOKEN in .env"}</strong>
          </li>
        </ul>

        {setup?.checklist && (
          <ul className="mt-4 space-y-2">
            {setup.checklist.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl p-3 text-sm ${item.done ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
              >
                <div className="font-semibold">{item.done ? "✓" : "○"} {item.label}</div>
                {item.hint && !item.done && <div className="mt-1 text-xs opacity-80">{item.hint}</div>}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase text-slate-500">Meta setup checklist</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline"
              >
                Meta Developer Console
              </a>{" "}
              → your app → WhatsApp → Configuration
            </li>
            <li>
              Callback URL: <code className="text-xs">{platform.webhookUrl}</code>
            </li>
            <li>Verify token: same value as <code>WHATSAPP_VERIFY_TOKEN</code> in `.env`</li>
            <li>Subscribe to: <strong>messages</strong> (and message status if available)</li>
            <li>
              For local dev use ngrok: <code className="text-xs">{appUrl}</code> → public URL +{" "}
              <code>/api/whatsapp/webhook</code>
            </li>
            <li>
              <strong>Easier:</strong>{" "}
              <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Green API
              </a>{" "}
              → set <code>GREEN_API_INSTANCE_ID</code> + <code>GREEN_API_API_TOKEN</code> in `.env` → scan QR
            </li>
          </ol>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={liveTesting || !platform.configured}
            onClick={testLiveSend}
            className="rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {liveTesting ? "Sending…" : `Send real test to ${testPhone}`}
          </button>
          <button
            type="button"
            disabled={testing}
            onClick={testWebhookSimulate}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {testing ? "Testing…" : "Test webhook (simulate inbound)"}
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          <strong>DEMO:</strong> Use Conversations → Load demo / Simulate — no Meta account required.{" "}
          <strong>LIVE:</strong> Set <code className="rounded bg-slate-100 px-1">WHATSAPP_ACCESS_TOKEN</code>,{" "}
          <code className="rounded bg-slate-100 px-1">WHATSAPP_PHONE_NUMBER_ID</code>, and webhook fields in `.env`.
          Real replies appear here automatically; AI sends WhatsApp text back when LIVE.
        </p>
      </div>
    </div>
  );
}

function FollowUpCreator({ onCreated, primary }: { onCreated: () => void; primary: string }) {
  const toast = useToast();
  const [name, setName] = useState("3-day nurture");
  const [step1, setStep1] = useState("Hi {{name}}, just checking if you still need property options?");
  const [step2, setStep2] = useState("Hi {{name}}, we have new listings in your preferred area. Reply INTERESTED.");

  async function create() {
    try {
      const res = await fetch("/api/whatsapp/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: "Auto follow-up when lead does not reply",
          steps: [
            { delayHours: 24, messageTemplate: step1 },
            { delayHours: 72, messageTemplate: step2 }
          ]
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create sequence");
      }
      toast.success("Follow-up sequence created.");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="font-extrabold">New follow-up sequence</div>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" />
      <textarea value={step1} onChange={(e) => setStep1(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2 text-xs" rows={2} />
      <textarea value={step2} onChange={(e) => setStep2(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2 text-xs" rows={2} />
      <button type="button" onClick={create} className="mt-3 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: primary }}>
        Create sequence
      </button>
    </div>
  );
}
