export type BrandSettings = {
  agencyName: string;
  botName: string;
  primary: string;
  accent: string;
  country: string;
  city: string;
  currency: string;
  symbol: string;
  areaUnit: string;
  tooltip: string;
  welcome: string;
  logoUrl: string;
};

export const defaultBrandSettings: BrandSettings = {
  agencyName: "PropertyConnect AI",
  botName: "PropertyConnect AI",
  primary: "#1a2744",
  accent: "#c9a84c",
  country: "Pakistan",
  city: "Karachi",
  currency: "PKR",
  symbol: "Rs ",
  areaUnit: "sq ft",
  tooltip: "Need help finding a property?",
  welcome:
    "Hi! I'm your AI property advisor. I can search live listings, compare prices in PKR, recommend areas, book viewings, and connect you with agents across Pakistan. What are you looking for today?",
  logoUrl: ""
};

const BRAND_STORAGE_KEY = "propertyconnect-brand-settings";

export function loadBrandSettings(): BrandSettings {
  if (typeof window === "undefined") return defaultBrandSettings;

  try {
    const saved = localStorage.getItem(BRAND_STORAGE_KEY);
    if (!saved) return defaultBrandSettings;
    return { ...defaultBrandSettings, ...JSON.parse(saved) };
  } catch {
    return defaultBrandSettings;
  }
}

export function saveBrandSettings(settings: BrandSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(settings));
}

export async function fetchBrandSettings(): Promise<BrandSettings> {
  try {
    const response = await fetch("/api/brand", { cache: "no-store" });
    if (!response.ok) return loadBrandSettings();
    const data = await response.json();
    const settings = { ...defaultBrandSettings, ...data };
    saveBrandSettings(settings);
    return settings;
  } catch {
    return loadBrandSettings();
  }
}

export async function persistBrandSettings(settings: BrandSettings): Promise<BrandSettings> {
  saveBrandSettings(settings);

  try {
    const response = await fetch("/api/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (response.ok) {
      const data = await response.json();
      const saved = { ...defaultBrandSettings, ...data };
      saveBrandSettings(saved);
      return saved;
    }
  } catch {
    // Keep local copy if API fails offline.
  }

  return settings;
}
