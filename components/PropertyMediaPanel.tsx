"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Image, Trash2, Upload, Video } from "lucide-react";

type MediaItem = {
  id: string;
  type: string;
  fileName: string;
  storageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
};

const TABS = [
  { id: "IMAGE", label: "Images" },
  { id: "VIDEO", label: "Videos" },
  { id: "FLOOR_PLAN", label: "Floor Plans" },
  { id: "BROCHURE", label: "Brochures" }
] as const;

export default function PropertyMediaPanel({
  propertyId,
  primary
}: {
  propertyId: string;
  primary: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("IMAGE");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/properties/${propertyId}/media`);
    const data = await res.json();
    setMedia(data.media || []);
  }, [propertyId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const filtered = media.filter((m) => m.type === tab);

  async function upload(file: File, isPrimary = false) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", tab);
      form.append("isPrimary", String(isPrimary && tab === "IMAGE"));
      const res = await fetch(`/api/properties/${propertyId}/media`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(mediaId: string) {
    await fetch(`/api/properties/${propertyId}/media?mediaId=${mediaId}`, { method: "DELETE" });
    await load();
  }

  const accept =
    tab === "VIDEO"
      ? "video/mp4"
      : tab === "BROCHURE" || tab === "FLOOR_PLAN"
        ? "application/pdf,image/jpeg,image/png,image/webp"
        : "image/jpeg,image/png,image/webp";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="font-bold text-slate-900">Property media (WhatsApp)</h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? "text-white" : "bg-slate-100 text-slate-600"
            }`}
            style={tab === t.id ? { background: primary } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : `Upload ${tab.toLowerCase().replace("_", " ")}`}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, tab === "IMAGE" && filtered.length === 0);
            e.target.value = "";
          }}
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 space-y-2">
        {filtered.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2">
            {m.type === "VIDEO" ? (
              <Video className="h-8 w-8 text-slate-400" />
            ) : (
              <Image className="h-8 w-8 text-slate-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{m.fileName}</p>
              {m.isPrimary && <span className="text-[10px] font-bold uppercase text-emerald-600">Primary</span>}
            </div>
            <button type="button" onClick={() => remove(m.id)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-slate-400">No {tab.toLowerCase()} uploaded yet.</li>
        )}
      </ul>
    </div>
  );
}
