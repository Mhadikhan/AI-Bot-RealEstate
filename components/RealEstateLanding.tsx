"use client";

import React, { useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Key,
  LineChart,
  MapPin,
  Phone,
  Sparkles,
  Tag,
  TrendingUp,
  Users
} from "lucide-react";
import { POPULAR_AREAS, REAL_ESTATE_SERVICES, WHY_CHOOSE_US } from "../lib/real-estate";
import type { BrandSettings } from "../lib/brand-settings";
import type { SocialLinks } from "../lib/social";

type Settings = BrandSettings;

type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  languages: string[];
  _count: { properties: number; leads: number };
};

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

type Stats = {
  listings: number;
  cities: number;
  agents: number;
  offPlan: number;
};

const serviceIcons = {
  home: Building2,
  key: Key,
  tag: Tag,
  trending: TrendingUp,
  chart: LineChart,
  calendar: Calendar
};

type RealEstateLandingProps = {
  settings: Settings;
  stats: Stats;
  agents: Agent[];
  faqs: FAQ[];
  onServiceClick: (action: string) => void;
  onAreaClick: (area: string) => void;
  onOpenChat: () => void;
  onWhatsApp: (message?: string) => void;
  purposeFilter: "All" | "Sale" | "Rent";
  categoryFilter: "All" | "Ready" | "Off-plan";
  cityFilter: string;
  onPurposeFilter: (value: "All" | "Sale" | "Rent") => void;
  onCategoryFilter: (value: "All" | "Ready" | "Off-plan") => void;
  onCityFilter: (value: string) => void;
  socialLinks: SocialLinks;
};

export function PropertySearchBar({
  settings,
  purposeFilter,
  categoryFilter,
  cityFilter,
  onPurposeFilter,
  onCategoryFilter,
  onCityFilter,
  onSearch
}: {
  settings: Settings;
  purposeFilter: "All" | "Sale" | "Rent";
  categoryFilter: "All" | "Ready" | "Off-plan";
  cityFilter: string;
  onPurposeFilter: (value: "All" | "Sale" | "Rent") => void;
  onCategoryFilter: (value: "All" | "Ready" | "Off-plan") => void;
  onCityFilter: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl ring-1 ring-slate-900/5 sm:p-6">
      <div className="mb-1 text-sm font-bold text-slate-900">Find your next property</div>
      <p className="mb-4 text-xs text-slate-500">Filter by purpose, type, and city — then browse live listings.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "Sale", "Rent"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onPurposeFilter(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              purposeFilter === tab ? "text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
            style={purposeFilter === tab ? { background: settings.primary } : {}}
          >
            {tab === "All" ? "All" : `For ${tab}`}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "Ready", "Off-plan"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onCategoryFilter(tab)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              categoryFilter === tab ? "ring-2 ring-amber-300/80" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-amber-50"
            }`}
            style={
              categoryFilter === tab
                ? { background: settings.accent, color: settings.primary }
                : undefined
            }
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={cityFilter}
          onChange={(event) => onCityFilter(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm"
          aria-label="City"
        >
          <option value="">All cities (Pakistan)</option>
          <option value="Karachi">Karachi</option>
          <option value="Lahore">Lahore</option>
          <option value="Islamabad">Islamabad</option>
        </select>
        <button
          type="button"
          onClick={onSearch}
          className="rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 sm:min-w-[160px]"
          style={{ background: settings.primary }}
        >
          Search listings
        </button>
      </div>
    </div>
  );
}

export function AgencyStatsBar({ settings, stats }: { settings: Settings; stats: Stats }) {
  const items = [
    { label: "Active Listings", value: stats.listings },
    { label: "Cities Covered", value: stats.cities },
    { label: "Expert Agents", value: stats.agents },
    { label: "Off-Plan Projects", value: stats.offPlan }
  ];

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-12 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: settings.primary }}>
              {item.value}+
            </div>
            <div className="mt-1.5 text-sm font-medium text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServicesSection({ settings, onServiceClick }: { settings: Settings; onServiceClick: (action: string) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">Our Services</div>
        <h2 className="text-3xl font-extrabold">Complete Real Estate Solutions</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Buy, sell, rent, invest, and manage property across Pakistan with AI-powered search and expert agent support.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REAL_ESTATE_SERVICES.map((service) => {
          const Icon = serviceIcons[service.icon];
          return (
            <button
              key={service.title}
              type="button"
              onClick={() => onServiceClick(service.action)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-xl p-2.5 text-white" style={{ background: settings.primary }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-bold">{service.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-bold" style={{ color: settings.accent }}>
                Get started <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PopularAreasSection({
  settings,
  onAreaClick
}: {
  settings: Settings;
  onAreaClick: (area: string) => void;
}) {
  return (
    <section className="bg-slate-100 py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">Popular Locations</div>
          <h2 className="text-3xl font-extrabold">Explore Top Areas in Pakistan</h2>
          <p className="mt-3 text-slate-600">Browse properties in the most in-demand neighborhoods.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {POPULAR_AREAS.map((group) => (
            <div key={group.city} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <MapPin className="h-4 w-4" style={{ color: settings.accent }} />
                  {group.city}
                </div>
                <span className="text-xs font-semibold text-slate-400">{group.count} listings</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.areas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => onAreaClick(area)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-200"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyChooseUsSection({ settings }: { settings: Settings }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">Why Choose Us</div>
          <h2 className="text-3xl font-extrabold">Pakistan&apos;s Trusted Real Estate Platform</h2>
          <p className="mt-4 text-slate-600 leading-7">
            {settings.agencyName} combines live property inventory, AI lead qualification, viewing bookings, and expert
            agents to deliver a complete real estate experience.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <Sparkles className="h-4 w-4" />
            AI-powered · Database-grounded · Agent-backed
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHY_CHOOSE_US.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-bold">{item.title}</div>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AgentsSection({
  settings,
  agents,
  onWhatsApp
}: {
  settings: Settings;
  agents: Agent[];
  onWhatsApp: (message?: string) => void;
}) {
  if (agents.length === 0) return null;

  return (
    <section className="bg-slate-100 py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8 text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">Our Team</div>
          <h2 className="text-3xl font-extrabold">Meet Your Property Consultants</h2>
          <p className="mt-3 text-slate-600">Licensed agents ready to help you buy, rent, sell, or invest.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold text-white"
                  style={{ background: settings.primary }}
                >
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{agent.name}</div>
                  <div className="text-xs text-slate-500">{agent.languages.join(" · ")}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-2">
                  <div className="font-extrabold">{agent._count.properties}</div>
                  <div className="text-slate-500">Listings</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <div className="font-extrabold">{agent._count.leads}</div>
                  <div className="text-slate-500">Leads</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`tel:${agent.phone}`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 py-2 text-xs font-bold"
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
                <button
                  type="button"
                  onClick={() => onWhatsApp(`Hi ${agent.name}, I need help with a property inquiry.`)}
                  className="flex-1 rounded-xl py-2 text-xs font-bold text-white"
                  style={{ background: settings.primary }}
                >
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  if (faqs.length === 0) return null;

  const grouped = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    acc[faq.category] = acc[faq.category] || [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-600">FAQ</div>
        <h2 className="text-3xl font-extrabold">Real Estate Questions Answered</h2>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {Object.entries(grouped).flatMap(([, items]) =>
          items.map((faq) => (
            <div key={faq.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{faq.category}</div>
                  <div className="mt-1 font-bold">{faq.question}</div>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition ${openId === faq.id ? "rotate-180" : ""}`} />
              </button>
              {openId === faq.id && (
                <div className="border-t border-slate-100 px-5 pb-4 text-sm leading-6 text-slate-600">{faq.answer}</div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function RealEstateCTA({
  settings,
  onOpenChat,
  onWhatsApp
}: {
  settings: Settings;
  onOpenChat: () => void;
  onWhatsApp: (message?: string) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16">
      <div className="rounded-3xl p-8 text-white md:p-12" style={{ background: settings.primary }}>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300">
              <Users className="h-4 w-4" />
              Ready to find your next property?
            </div>
            <h2 className="text-3xl font-extrabold">Start your real estate journey today</h2>
            <p className="mt-3 max-w-xl text-white/80">
              Search verified listings, talk to our AI advisor, book a viewing, or connect instantly with a property
              consultant on WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={onOpenChat}
              className="rounded-xl px-5 py-3 text-sm font-bold"
              style={{ background: settings.accent, color: settings.primary }}
            >
              Chat with AI Advisor
            </button>
            <button
              type="button"
              onClick={() => onWhatsApp("Hi, I want to discuss a property inquiry.")}
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/20"
            >
              WhatsApp an Agent
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { Agent, FAQ, Stats };
