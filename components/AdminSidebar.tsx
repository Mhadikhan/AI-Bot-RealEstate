"use client";

import React from "react";
import {
  BarChart3,
  Bot,
  Building2,
  Calendar,
  Globe2,
  Handshake,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Palette,
  Share2,
  Smartphone,
  Users
} from "lucide-react";

export type AdminTabId =
  | "overview"
  | "leads"
  | "properties"
  | "bookings"
  | "agents"
  | "faqs"
  | "market"
  | "brand"
  | "social"
  | "broadcast"
  | "whatsapp-analytics"
  | "whatsapp-settings"
  | "whatsapp-inbox"
  | "bot";

type NavItem = {
  id: AdminTabId | "whatsapp-analytics";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Operations",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "leads", label: "Leads & CRM", icon: Users },
      { id: "properties", label: "Properties", icon: Building2 },
      { id: "bookings", label: "Viewings", icon: Calendar },
      { id: "agents", label: "Agents", icon: Handshake }
    ]
  },
  {
    title: "Marketing",
    items: [
      { id: "broadcast", label: "WhatsApp Campaigns", icon: Megaphone },
      { id: "whatsapp-inbox", label: "WhatsApp Inbox", icon: MessageCircle, external: true },
      { id: "whatsapp-settings", label: "WhatsApp Settings", icon: Smartphone, external: true },
      { id: "whatsapp-analytics", label: "WhatsApp Analytics", icon: BarChart3, external: true },
      { id: "social", label: "Social Media", icon: Share2 }
    ]
  },
  {
    title: "Configuration",
    items: [
      { id: "brand", label: "Agency Brand", icon: Palette },
      { id: "market", label: "Market & Pricing", icon: Globe2 },
      { id: "faqs", label: "FAQs", icon: HelpCircle },
      { id: "bot", label: "AI Advisor", icon: Bot }
    ]
  }
];

export function AdminPageHeader({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export default function AdminSidebar({
  activeTab,
  primary,
  onNavigate
}: {
  activeTab: string;
  primary: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm ring-1 ring-slate-900/5">
        <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin workspace</div>
          <div className="mt-0.5 text-sm font-bold text-slate-800">Manage your agency</div>
        </div>
        <nav className="space-y-4 px-1 py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.title}</div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.external) {
                            if (item.id === "whatsapp-analytics") window.location.href = "/admin/whatsapp";
                            else if (item.id === "whatsapp-settings") window.location.href = "/admin/settings/whatsapp";
                            else if (item.id === "whatsapp-inbox") window.location.href = "/admin/whatsapp/inbox";
                            return;
                          }
                          onNavigate(item.id);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                          active ? "text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                        }`}
                        style={active ? { background: primary } : undefined}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "opacity-70"}`} />
                        <span className="leading-tight">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export const ADMIN_QUICK_ACTIONS: { id: AdminTabId; label: string; hint: string }[] = [
  { id: "properties", label: "Add listing", hint: "New property" },
  { id: "leads", label: "View leads", hint: "CRM pipeline" },
  { id: "broadcast", label: "Send WhatsApp", hint: "Campaign" },
  { id: "bookings", label: "Viewings", hint: "Appointments" }
];
