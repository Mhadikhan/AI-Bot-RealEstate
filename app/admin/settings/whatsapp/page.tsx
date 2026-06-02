"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadBrandSettings } from "../../../../lib/brand-settings";
import { AdminPageHeader } from "../../../../components/AdminSidebar";
import WhatsAppSettingsPanel from "../../../../components/WhatsAppSettingsPanel";

export default function AdminWhatsAppSettingsPage() {
  const [primary, setPrimary] = useState("#059669");

  useEffect(() => {
    setPrimary(loadBrandSettings().primary);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-4 text-sm">
          <Link href="/admin" className="font-semibold text-emerald-700 hover:underline">
            ← Back to Admin
          </Link>
        </div>
        <AdminPageHeader
          title="WhatsApp Settings"
          description="Connect Evolution API, scan QR code, and configure webhooks."
        />
        <WhatsAppSettingsPanel primary={primary} />
      </div>
    </div>
  );
}
