"use client";

import React, { useState } from "react";
import { Home, Menu, MessageCircle, Search, X } from "lucide-react";
import type { BrandSettings } from "../lib/brand-settings";

type NavAction = { label: string; onClick: () => void };

export default function PublicSiteHeader({
  settings,
  onOpenChat,
  onBrowse,
  navItems
}: {
  settings: BrandSettings;
  onOpenChat: () => void;
  onBrowse: () => void;
  navItems: NavAction[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.agencyName}
                className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1 sm:h-11 sm:w-11"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white sm:h-11 sm:w-11" style={{ background: settings.primary }}>
                <Home className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-extrabold tracking-tight">{settings.agencyName}</div>
              <div className="truncate text-xs text-slate-500">
                {settings.city} · Buy · Rent · Invest
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenChat}
              className="ml-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
              style={{ background: settings.primary }}
            >
              AI Advisor
            </button>
          </nav>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2.5 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setMenuOpen(false);
                  }}
                  className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onOpenChat();
                  setMenuOpen(false);
                }}
                className="mt-1 rounded-xl px-3 py-3 text-left text-sm font-bold text-white"
                style={{ background: settings.primary }}
              >
                Ask AI Property Advisor
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={onBrowse}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold text-slate-600"
          >
            <Search className="h-5 w-5" />
            Search
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg"
            style={{ background: settings.primary }}
          >
            <MessageCircle className="h-5 w-5" />
            AI Chat
          </button>
        </div>
      </div>
    </>
  );
}
