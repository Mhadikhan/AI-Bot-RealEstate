"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      show,
      success: (message: string) => show(message, "success"),
      error: (message: string) => show(message, "error"),
      info: (message: string) => show(message, "info")
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : toast.type === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : toast.type === "error" ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
