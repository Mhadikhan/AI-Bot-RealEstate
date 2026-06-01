"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "./ToastProvider";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Eye,
  MessageCircle,
  Megaphone,
  RefreshCw,
  Send,
  TrendingUp,
  UserMinus,
  UserPlus,
  XCircle
} from "lucide-react";

type AnalyticsPayload = {
  kpis: {
    totalCampaigns: number;
    messagesSent: number;
    messagesDelivered: number;
    messagesRead: number;
    repliesReceived: number;
    failedMessages: number;
    unsubscribedUsers: number;
    viewingRequestsGenerated: number;
    agentHandoversGenerated: number;
    conversionRate: number;
    deliveryRate: number;
    readRate: number;
    replyRate: number;
  };
  charts: {
    messagesSentByDay: { date: string; label: string; value: number }[];
    deliveryRateByDay: { date: string; label: string; value: number }[];
    readRateByDay: { date: string; label: string; value: number }[];
    replyRateByDay: { date: string; label: string; value: number }[];
    leadsByCampaign: { id: string; title: string; category: string; recipients: number; replies: number; leadsGenerated: number }[];
    conversionFunnel: { stage: string; value: number; percent: number }[];
  };
  meta: { recipientRows: number; modeNote: string };
};

function KpiCard({
  label,
  value,
  suffix = "",
  icon: Icon,
  accent = "bg-white"
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: typeof Send;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 p-4 shadow-sm ${accent}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">
        {value}
        {suffix}
      </div>
    </div>
  );
}

function BarChart({
  data,
  valueSuffix = "",
  maxHeight = 160,
  barClass = "bg-emerald-500"
}: {
  data: { label: string; value: number }[];
  valueSuffix?: string;
  maxHeight?: number;
  barClass?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-48 items-end gap-1 border-b border-slate-100 pb-6 pt-2">
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-slate-600">
            {d.value}
            {valueSuffix}
          </span>
          <div
            className={`w-full max-w-[28px] rounded-t-md ${barClass} transition-all`}
            style={{ height: Math.max(4, (d.value / max) * maxHeight) }}
            title={`${d.label}: ${d.value}${valueSuffix}`}
          />
          <span className="w-full truncate text-center text-[8px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function FunnelChart({ stages }: { stages: { stage: string; value: number; percent: number }[] }) {
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.stage}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold text-slate-700">{s.stage}</span>
            <span className="font-bold text-slate-900">{s.value.toLocaleString()}</span>
          </div>
          <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
            <div
              className="flex h-full items-center rounded-lg px-2 text-[10px] font-bold text-white transition-all"
              style={{
                width: `${Math.max(s.percent, s.value > 0 ? 8 : 0)}%`,
                background: `linear-gradient(90deg, #128c7e, #25d366 ${100 - i * 8}%)`
              }}
            >
              {s.percent}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WhatsAppAnalyticsDashboard({ primary = "#0f766e" }: { primary?: string }) {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load(notify = false) {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/analytics?reconcile=1");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json);
      if (notify) toast.success("Analytics refreshed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  const k = data?.kpis;

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8"
        style={{ borderBottomColor: `${primary}22` }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Admin
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <Megaphone className="h-6 w-6" style={{ color: primary }} />
                WhatsApp Analytics
              </h1>
              <p className="text-sm text-slate-500">Campaign performance · Last 14 days on charts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: primary }}
            >
              Campaign manager
            </Link>
            <button
              type="button"
              onClick={() => load(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
        {loading && !data && <p className="text-center text-slate-500">Loading analytics…</p>}

        {k && data && (
          <>
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Key metrics</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <KpiCard label="Total campaigns" value={k.totalCampaigns} icon={Megaphone} />
                <KpiCard label="Messages sent" value={k.messagesSent} icon={Send} accent="bg-emerald-50/80" />
                <KpiCard label="Messages delivered" value={k.messagesDelivered} icon={TrendingUp} accent="bg-teal-50/80" />
                <KpiCard label="Messages read" value={k.messagesRead} icon={Eye} accent="bg-blue-50/80" />
                <KpiCard label="Replies received" value={k.repliesReceived} icon={MessageCircle} accent="bg-amber-50/80" />
                <KpiCard label="Failed messages" value={k.failedMessages} icon={XCircle} accent="bg-red-50/80" />
                <KpiCard label="Unsubscribed users" value={k.unsubscribedUsers} icon={UserMinus} />
                <KpiCard label="Viewing requests" value={k.viewingRequestsGenerated} icon={Calendar} />
                <KpiCard label="Agent handovers" value={k.agentHandoversGenerated} icon={UserPlus} />
                <KpiCard
                  label="Conversion rate"
                  value={k.conversionRate}
                  suffix="%"
                  icon={BarChart3}
                  accent="bg-violet-50/80"
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <div className="text-lg font-extrabold text-emerald-700">{k.deliveryRate}%</div>
                  <div className="text-xs text-slate-500">Overall delivery rate</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <div className="text-lg font-extrabold text-blue-700">{k.readRate}%</div>
                  <div className="text-xs text-slate-500">Overall read rate</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <div className="text-lg font-extrabold text-amber-700">{k.replyRate}%</div>
                  <div className="text-xs text-slate-500">Overall reply rate</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Charts</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-extrabold text-slate-900">Messages sent by day</h3>
                  <p className="mb-4 text-xs text-slate-500">Individual 1:1 sends per calendar day</p>
                  <BarChart data={data.charts.messagesSentByDay} barClass="bg-emerald-500" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-extrabold text-slate-900">Delivery rate</h3>
                  <p className="mb-4 text-xs text-slate-500">Daily % delivered ÷ sent (webhook-confirmed in LIVE)</p>
                  <BarChart data={data.charts.deliveryRateByDay} valueSuffix="%" barClass="bg-teal-600" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-extrabold text-slate-900">Read rate</h3>
                  <p className="mb-4 text-xs text-slate-500">Daily % read ÷ delivered</p>
                  <BarChart data={data.charts.readRateByDay} valueSuffix="%" barClass="bg-blue-500" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-extrabold text-slate-900">Reply rate</h3>
                  <p className="mb-4 text-xs text-slate-500">Daily % replies ÷ sent</p>
                  <BarChart data={data.charts.replyRateByDay} valueSuffix="%" barClass="bg-amber-500" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <h3 className="font-extrabold text-slate-900">Leads generated by campaign</h3>
                  <p className="mb-4 text-xs text-slate-500">Replies and engagement per campaign (proxy for leads)</p>
                  {data.charts.leadsByCampaign.length === 0 ? (
                    <p className="text-sm text-slate-500">No campaign data yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b text-xs uppercase text-slate-400">
                            <th className="py-2 pr-4">Campaign</th>
                            <th className="py-2 pr-4">Recipients</th>
                            <th className="py-2 pr-4">Replies</th>
                            <th className="py-2">Leads generated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.charts.leadsByCampaign.map((row) => (
                            <tr key={row.id} className="border-b border-slate-50">
                              <td className="py-3 pr-4 font-semibold">{row.title}</td>
                              <td className="py-3 pr-4">{row.recipients}</td>
                              <td className="py-3 pr-4">{row.replies}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 max-w-[120px] rounded-full bg-slate-100">
                                    <div
                                      className="h-2 rounded-full bg-emerald-500"
                                      style={{
                                        width: `${Math.min(100, (row.leadsGenerated / Math.max(row.recipients, 1)) * 100)}%`
                                      }}
                                    />
                                  </div>
                                  <span className="font-bold">{row.leadsGenerated}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <h3 className="font-extrabold text-slate-900">Campaign conversion funnel</h3>
                  <p className="mb-4 text-xs text-slate-500">
                    Recipients → sent → delivered → read → replies → viewings → conversions
                  </p>
                  <FunnelChart stages={data.charts.conversionFunnel} />
                </div>
              </div>
            </section>

            <p className="text-center text-xs text-slate-400">{data.meta.modeNote}</p>
          </>
        )}
      </div>
    </div>
  );
}
