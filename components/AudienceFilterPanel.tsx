"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Filter, RefreshCw, Users } from "lucide-react";
import type { CrmAudienceFilters } from "../lib/audience-filters";
import { EMPTY_CRM_FILTERS } from "../lib/audience-filters";
import { AUDIENCE_LABELS, type BroadcastAudience } from "../lib/broadcast";

type FilterOptions = {
  areas: string[];
  sources: string[];
  agents: { id: string; name: string }[];
  propertyTypes: string[];
  tags: string[];
  leadTypes: string[];
  temperatures: string[];
  statuses: string[];
  propertyCategories: string[];
};

type PreviewLead = {
  id: string;
  name: string | null;
  phone: string | null;
  type: string;
  temperature: string;
  preferredArea: string | null;
  score: number;
};

const PRESETS: BroadcastAudience[] = [
  "OPTED_IN",
  "ALL_PHONES",
  "HOT",
  "WARM",
  "COLD",
  "BUYERS",
  "TENANTS",
  "INVESTORS",
  "VIEWING_BOOKED",
  "CALLBACKS",
  "AGENT_FOLLOW_UP"
];

export default function AudienceFilterPanel({
  primary,
  filters,
  onChange,
  selectedLeadIds,
  onSelectedLeadIdsChange,
  onMatchCountChange,
  leadsForHandPick
}: {
  primary: string;
  filters: CrmAudienceFilters;
  onChange: (f: CrmAudienceFilters) => void;
  selectedLeadIds: string[];
  onSelectedLeadIdsChange: (ids: string[]) => void;
  onMatchCountChange?: (count: number) => void;
  leadsForHandPick: Array<{ id: string; name: string | null; phone: string | null; type: string }>;
}) {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewLead[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/whatsapp/audience");
    if (res.ok) setOptions(await res.json());
  }, []);

  const runPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crmFilters: {
            ...filters,
            selectedLeadIds: filters.audiencePreset === "SELECTED" ? selectedLeadIds : undefined
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCount(data.count);
        onMatchCountChange?.(data.count);
        setPreview(data.leads || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, selectedLeadIds]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    const t = setTimeout(runPreview, 400);
    return () => clearTimeout(t);
  }, [runPreview]);

  function patch(partial: Partial<CrmAudienceFilters>) {
    onChange({ ...filters, ...partial });
  }

  function toggleArray<T extends string>(key: keyof CrmAudienceFilters, value: T, current?: T[]) {
    const list = current || [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    patch({ [key]: next.length ? next : undefined } as Partial<CrmAudienceFilters>);
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
  const labelClass = "block text-xs font-semibold text-slate-500";

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-extrabold text-slate-900">
          <Filter className="h-5 w-5" style={{ color: primary }} />
          Step 2: Select audience (CRM filters)
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm">
            {loading ? "…" : count ?? "—"} matches
          </span>
          <button type="button" onClick={runPreview} className="rounded-lg border bg-white p-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div>
        <p className={labelClass}>Quick preset</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => patch({ audiencePreset: p })}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                filters.audiencePreset === p ? "text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
              style={filters.audiencePreset === p ? { background: primary } : {}}
            >
              {AUDIENCE_LABELS[p]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => patch({ audiencePreset: "SELECTED" })}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filters.audiencePreset === "SELECTED" ? "text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
            style={filters.audiencePreset === "SELECTED" ? { background: primary } : {}}
          >
            Hand-pick
          </button>
        </div>
      </div>

      {filters.audiencePreset === "SELECTED" && (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
          {leadsForHandPick.map((lead) => (
            <label key={lead.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selectedLeadIds.includes(lead.id)}
                onChange={(e) =>
                  onSelectedLeadIdsChange(
                    e.target.checked
                      ? [...selectedLeadIds, lead.id]
                      : selectedLeadIds.filter((id) => id !== lead.id)
                  )
                }
              />
              {lead.name || lead.phone} · {lead.type}
            </label>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass}>Lead type</label>
          <div className="mt-2 flex flex-wrap gap-1">
            {(options?.leadTypes || []).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleArray("leadTypes", t, filters.leadTypes)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                  filters.leadTypes?.includes(t as never) ? "bg-amber-100 text-amber-900" : "bg-white ring-1 ring-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Preferred area</label>
          <input
            list="areas-list"
            value={filters.preferredArea || ""}
            onChange={(e) => patch({ preferredArea: e.target.value || undefined })}
            placeholder="Karachi, DHA, …"
            className={inputClass}
          />
          <datalist id="areas-list">
            {options?.areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Budget min (PKR)</label>
            <input
              type="number"
              value={filters.budgetMin ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                patch({ budgetMin: e.target.value === "" || Number.isNaN(n) ? undefined : n });
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Budget max (PKR)</label>
            <input
              type="number"
              value={filters.budgetMax ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                patch({ budgetMax: e.target.value === "" || Number.isNaN(n) ? undefined : n });
              }}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Property type</label>
          <input
            list="property-types"
            value={filters.propertyType || ""}
            onChange={(e) => patch({ propertyType: e.target.value || undefined })}
            className={inputClass}
          />
          <datalist id="property-types">
            {options?.propertyTypes.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={labelClass}>Bedrooms</label>
          <select
            value={filters.bedrooms || ""}
            onChange={(e) => patch({ bedrooms: e.target.value || undefined })}
            className={inputClass}
          >
            <option value="">Any</option>
            {["Studio", "1", "2", "3", "4", "5+"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Ready / off-plan</label>
          <select
            value={filters.propertyCategory || ""}
            onChange={(e) =>
              patch({
                propertyCategory: (e.target.value as "READY" | "OFF_PLAN") || undefined
              })
            }
            className={inputClass}
          >
            <option value="">Any</option>
            <option value="READY">Ready</option>
            <option value="OFF_PLAN">Off-plan</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Temperature</label>
          <div className="mt-2 flex gap-2">
            {(options?.temperatures || []).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleArray("temperatures", t, filters.temperatures)}
                className={`rounded-lg px-3 py-1 text-xs font-bold ${
                  filters.temperatures?.includes(t as never) ? "bg-amber-100" : "bg-white ring-1 ring-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Score min</label>
            <input
              type="number"
              value={filters.scoreMin ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                patch({ scoreMin: e.target.value === "" || Number.isNaN(n) ? undefined : n });
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Score max</label>
            <input
              type="number"
              value={filters.scoreMax ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                patch({ scoreMax: e.target.value === "" || Number.isNaN(n) ? undefined : n });
              }}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Lead status</label>
          <select
            multiple
            value={filters.statuses || []}
            onChange={(e) => {
              const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
              patch({ statuses: vals.length ? (vals as CrmAudienceFilters["statuses"]) : undefined });
            }}
            className={`${inputClass} min-h-[88px]`}
          >
            {(options?.statuses || []).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Assigned agent</label>
          <select
            value={filters.agentId || ""}
            onChange={(e) => patch({ agentId: e.target.value || undefined })}
            className={inputClass}
          >
            <option value="">Any agent</option>
            {options?.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Lead source</label>
          <select
            value={filters.sources?.[0] || ""}
            onChange={(e) => patch({ sources: e.target.value ? [e.target.value] : undefined })}
            className={inputClass}
          >
            <option value="">Any source</option>
            {options?.sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Tags</label>
          <input
            value={(filters.tags || []).join(", ")}
            onChange={(e) => {
              const tags = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              patch({ tags: tags.length ? tags : undefined, tagMatch: filters.tagMatch || "any" });
            }}
            placeholder="vip, investor, …"
            className={inputClass}
          />
          <select
            value={filters.tagMatch || "any"}
            onChange={(e) => patch({ tagMatch: e.target.value as "any" | "all" })}
            className={`${inputClass} mt-1`}
          >
            <option value="any">Match any tag</option>
            <option value="all">Match all tags</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Last interaction (from / to)</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.lastInteractionAfter?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ lastInteractionAfter: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
            <input
              type="date"
              value={filters.lastInteractionBefore?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ lastInteractionBefore: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Last WhatsApp message</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.lastWhatsAppAfter?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ lastWhatsAppAfter: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
            <input
              type="date"
              value={filters.lastWhatsAppBefore?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ lastWhatsAppBefore: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Last campaign received</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.lastCampaignAfter?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ lastCampaignAfter: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
            <input
              type="date"
              value={filters.lastCampaignBefore?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ lastCampaignBefore: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Created date</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.createdAfter?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ createdAfter: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
            <input
              type="date"
              value={filters.createdBefore?.slice(0, 10) || ""}
              onChange={(e) =>
                patch({ createdBefore: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>History & consent</label>
          {(
            [
              ["hasViewingHistory", "Has viewing history"],
              ["hasCallbackHistory", "Has callback history"],
              ["hasBrochureHistory", "Brochure requested"]
            ] as const
          ).map(([key, label]) => (
            <select
              key={key}
              value={filters[key] === undefined ? "" : filters[key] ? "yes" : "no"}
              onChange={(e) => {
                const v = e.target.value;
                patch({ [key]: v === "" ? undefined : v === "yes" } as Partial<CrmAudienceFilters>);
              }}
              className={inputClass}
            >
              <option value="">{label}: Any</option>
              <option value="yes">{label}: Yes</option>
              <option value="no">{label}: No</option>
            </select>
          ))}
          <select
            value={filters.unsubscribedOnly ? "unsub" : filters.whatsappOptIn === false ? "unsub" : "optin"}
            onChange={(e) => {
              if (e.target.value === "unsub") patch({ unsubscribedOnly: true, whatsappOptIn: undefined });
              else patch({ unsubscribedOnly: false, whatsappOptIn: true });
            }}
            className={inputClass}
          >
            <option value="optin">WhatsApp opted-in only</option>
            <option value="unsub">Unsubscribed only</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(EMPTY_CRM_FILTERS)}
        className="text-xs font-bold text-slate-500 underline"
      >
        Reset all filters
      </button>

      {preview.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
            <Users className="h-3.5 w-3.5" />
            Preview (first {preview.length})
          </div>
          <div className="max-h-28 space-y-1 overflow-y-auto text-xs">
            {preview.map((l) => (
              <div key={l.id} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                <span className="font-medium">{l.name || l.phone}</span>
                <span className="text-slate-400">
                  {l.type} · {l.temperature} · {l.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
