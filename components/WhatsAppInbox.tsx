"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle, Send, User } from "lucide-react";

type Conversation = {
  id: string;
  phone: string;
  status: string;
  lastMessageAt?: string;
  lead?: {
    name?: string | null;
    score?: number;
    temperature?: string;
    preferredArea?: string | null;
    budgetMax?: number | null;
  } | null;
  messages: Array<{
    id: string;
    direction: string;
    type: string;
    status: string;
    text?: string | null;
    createdAt: string;
  }>;
  _count?: { messages: number };
};

export default function WhatsAppInbox({ primary }: { primary: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = conversations.find((c) => c.id === selectedId) || conversations[0];

  useEffect(() => {
    fetch("/api/whatsapp/inbox")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations || []);
        if (data.conversations?.[0]?.id) setSelectedId(data.conversations[0].id);
      })
      .catch(() => undefined);
  }, []);

  async function sendReply() {
    if (!selected?.phone || !reply.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/whatsapp/send/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selected.phone, text: reply.trim() })
      });
      setReply("");
      const res = await fetch("/api/whatsapp/inbox");
      const data = await res.json();
      setConversations(data.conversations || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-3">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-900">Inbox</h3>
          <p className="text-xs text-slate-500">{conversations.length} conversations</p>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selected?.id === c.id ? "bg-slate-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">{c.lead?.name || c.phone}</span>
                  <span className="text-[10px] uppercase text-slate-400">{c.lead?.temperature || "—"}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {c.messages[0]?.text || "No messages yet"}
                </p>
              </button>
            </li>
          ))}
          {conversations.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-500">No WhatsApp conversations yet.</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white lg:col-span-5">
        <div className="border-b border-slate-100 p-4">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <MessageCircle className="h-4 w-4" />
            {selected ? selected.lead?.name || selected.phone : "Select a conversation"}
          </h3>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {(selected?.messages || []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.direction === "OUTBOUND"
                  ? "ml-auto bg-emerald-50 text-emerald-950"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <p>{m.text}</p>
              <p className="mt-1 text-[10px] opacity-60">
                {m.direction} · {m.status} · {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        {selected && (
          <div className="border-t border-slate-100 p-4">
            <div className="flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={loading}
                onClick={sendReply}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: primary }}
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-4">
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          <User className="h-4 w-4" />
          Lead profile
        </h3>
        {selected?.lead ? (
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-slate-400">Score</dt>
              <dd className="font-semibold">{selected.lead.score ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-400">Budget</dt>
              <dd>{selected.lead.budgetMax ? `Up to ${selected.lead.budgetMax.toLocaleString()}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-400">Preferred area</dt>
              <dd>{selected.lead.preferredArea || "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Lead details appear when linked to a CRM record.</p>
        )}
      </div>
    </div>
  );
}
