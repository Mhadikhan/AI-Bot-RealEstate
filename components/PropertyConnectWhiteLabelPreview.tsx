"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "./ToastProvider";
import {
  BarChart3,
  Bot,
  Building2,
  Calendar,
  ChevronRight,
  Download,
  Globe2,
  Handshake,
  HelpCircle,
  Home,
  Layers,
  MapPin,
  Megaphone,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  Upload,
  Users,
  X
} from "lucide-react";
import { DEFAULT_LISTING_IMAGES } from "../lib/listing-images";
import { defaultBrandSettings, fetchBrandSettings, loadBrandSettings, persistBrandSettings, type BrandSettings } from "../lib/brand-settings";
import { defaultSocialLinks, loadSocialLinks, saveSocialLinks, type SocialLinks, whatsAppUrl } from "../lib/social";
import { PropertyShareButtons, SocialBar } from "./SocialLinks";
import WhatsAppCampaigns from "./WhatsAppCampaigns";
import PropertyMediaPanel from "./PropertyMediaPanel";
import AdminSidebar, { AdminPageHeader, ADMIN_QUICK_ACTIONS } from "./AdminSidebar";
import PublicSiteHeader from "./PublicSiteHeader";
import {
  AgencyStatsBar,
  AgentsSection,
  FAQSection,
  PopularAreasSection,
  PropertySearchBar,
  RealEstateCTA,
  ServicesSection,
  WhyChooseUsSection,
  type Agent,
  type FAQ
} from "./RealEstateLanding";

type Settings = BrandSettings;

type Listing = {
  id: string | number;
  title: string;
  type: string;
  purpose: "Sale" | "Rent";
  category: "Ready" | "Off-plan";
  location: string;
  city: string;
  beds: string | number;
  baths: number;
  size: number;
  price: number;
  featured: boolean;
  image: string;
};

type ChatProperty = {
  id: string;
  ref: string;
  title: string;
  area: string;
  city: string;
  price: number;
  currency: string;
  bedrooms: string;
  propertyType: string;
  listingPurpose: string;
  category: string;
  sizeSqFt: number;
};

type ChatMessage = {
  from: "bot" | "user";
  text: string;
  properties?: ChatProperty[];
  suggestions?: string[];
  aiPowered?: boolean;
};

type ApiProperty = {
  id: string;
  title: string;
  propertyType: string;
  listingPurpose: "SALE" | "RENT";
  category: "READY" | "OFF_PLAN";
  area: string;
  city: string;
  bedrooms: string;
  bathrooms: number;
  sizeSqFt: number;
  price: number;
  featured: boolean;
  featuredImage: string | null;
};

type ApiLead = {
  id: string;
  name: string | null;
  phone: string | null;
  type: string;
  preferredArea: string | null;
  score: number;
  temperature: "HOT" | "WARM" | "COLD";
  status: string;
  whatsappOptIn?: boolean;
  requiresHumanFollowUp?: boolean;
  hasUpcomingViewing?: boolean;
};

type ApiBooking = {
  id: string;
  reference: string;
  preferredAt: string;
  status: string;
  property: { title: string };
};

type PropertyForm = {
  title: string;
  area: string;
  city: string;
  propertyType: string;
  listingPurpose: "SALE" | "RENT";
  category: "READY" | "OFF_PLAN";
  bedrooms: string;
  bathrooms: string;
  sizeSqFt: string;
  price: string;
  description: string;
  featuredImage: string;
  featured: boolean;
};

const emptyPropertyForm = (city: string): PropertyForm => ({
  title: "",
  area: "",
  city,
  propertyType: "Apartment",
  listingPurpose: "SALE",
  category: "READY",
  bedrooms: "2",
  bathrooms: "2",
  sizeSqFt: "",
  price: "",
  description: "",
  featuredImage: "",
  featured: false
});

const baseSettings = defaultBrandSettings;

const fallbackListings: Listing[] = [
  {
    id: 1,
    title: "DHA Phase 6 2BR Apartment",
    type: "Apartment",
    purpose: "Sale",
    category: "Ready",
    location: "DHA Phase 6, Karachi",
    city: "Karachi",
    beds: 2,
    baths: 2,
    size: 1180,
    price: 28500000,
    featured: true,
    image: DEFAULT_LISTING_IMAGES[0]
  },
  {
    id: 2,
    title: "Clifton 1BR Residence",
    type: "Apartment",
    purpose: "Sale",
    category: "Ready",
    location: "Clifton, Karachi",
    city: "Karachi",
    beds: 1,
    baths: 1,
    size: 780,
    price: 22000000,
    featured: true,
    image: DEFAULT_LISTING_IMAGES[1]
  },
  {
    id: 3,
    title: "Johar Town Rental 1BR",
    type: "Apartment",
    purpose: "Rent",
    category: "Ready",
    location: "Johar Town, Lahore",
    city: "Lahore",
    beds: 1,
    baths: 1,
    size: 740,
    price: 180000,
    featured: false,
    image: DEFAULT_LISTING_IMAGES[2]
  },
  {
    id: 4,
    title: "Gulberg Off-Plan 2BR",
    type: "Apartment",
    purpose: "Sale",
    category: "Off-plan",
    location: "Gulberg, Lahore",
    city: "Lahore",
    beds: 2,
    baths: 2,
    size: 1090,
    price: 38000000,
    featured: true,
    image: DEFAULT_LISTING_IMAGES[3]
  },
  {
    id: 5,
    title: "DHA Furnished Rental 2BR",
    type: "Apartment",
    purpose: "Rent",
    category: "Ready",
    location: "DHA Phase 8, Karachi",
    city: "Karachi",
    beds: 2,
    baths: 2,
    size: 1240,
    price: 320000,
    featured: false,
    image: DEFAULT_LISTING_IMAGES[4]
  },
  {
    id: 6,
    title: "F-7 Islamabad Luxury Villa",
    type: "Villa",
    purpose: "Sale",
    category: "Ready",
    location: "F-7, Islamabad",
    city: "Islamabad",
    beds: 5,
    baths: 6,
    size: 6200,
    price: 185000000,
    featured: true,
    image: DEFAULT_LISTING_IMAGES[5]
  }
];

const quickReplies = [
  "Buy a property",
  "Rent a property",
  "Explore new developments",
  "Invest in real estate",
  "Sell my property",
  "List a rental property",
  "Book a viewing",
  "Speak with an agent"
];

const intentScores: Record<string, number> = {
  BUYER: 10,
  TENANT: 10,
  INVESTOR: 12,
  VIEWING: 20,
  CALLBACK: 15,
  FAQ: 5,
  GENERAL: 5,
  SELLER: 8,
  LANDLORD: 8
};

function formatChatPrice(price: number, listingPurpose: string) {
  const suffix = listingPurpose === "RENT" ? "/yr" : "";
  if (price >= 10_000_000) return `Rs ${(price / 10_000_000).toFixed(2)} Cr${suffix}`;
  if (price >= 100_000) return `Rs ${(price / 100_000).toFixed(1)} Lakh${suffix}`;
  return `Rs ${price.toLocaleString("en-PK")}${suffix}`;
}

function renderMessageText(text: string) {
  return text.split("\n").map((line, lineIndex) => (
    <span key={lineIndex} className="block">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={partIndex} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={partIndex}>{part}</span>;
      })}
    </span>
  ));
}

function mapProperty(property: ApiProperty, index: number): Listing {
  return {
    id: property.id,
    title: property.title,
    type: property.propertyType,
    purpose: property.listingPurpose === "RENT" ? "Rent" : "Sale",
    category: property.category === "OFF_PLAN" ? "Off-plan" : "Ready",
    location: property.area,
    city: property.city,
    beds: property.bedrooms,
    baths: property.bathrooms,
    size: property.sizeSqFt,
    price: property.price,
    featured: property.featured,
    image: property.featuredImage || DEFAULT_LISTING_IMAGES[index % DEFAULT_LISTING_IMAGES.length]
  };
}

function price(value: number, settings: Settings, rent = false) {
  return `${settings.symbol}${Number(value).toLocaleString()}${rent ? "/year" : ""}`;
}

function formatLeadType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatBookingDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

type ChipProps = { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" };

function Chip({ children, tone = "slate" }: ChipProps) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700"
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

type ListingCardProps = {
  item: Listing;
  settings: Settings;
  compact?: boolean;
  match?: number;
  socialLinks?: SocialLinks;
  showShare?: boolean;
};

function ListingCard({ item, settings, compact = false, match, socialLinks, showShare = false }: ListingCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`${compact ? "h-32" : "h-48"} relative overflow-hidden`}>
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Chip tone="green">{item.purpose}</Chip>
          <Chip tone="slate">{item.category}</Chip>
          {item.featured && <Chip tone="amber">Featured</Chip>}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-lg font-extrabold text-white drop-shadow-md">
            {price(item.price, settings, item.purpose === "Rent")}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{item.title}</h3>
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{item.location}</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {item.beds} bed · {item.baths} bath · {item.size.toLocaleString()} {settings.areaUnit}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-400">{item.type}</span>
          <div className="flex items-center gap-2">
            {showShare && socialLinks && (
              <PropertyShareButtons
                links={socialLinks}
                title={item.title}
                location={item.location}
                priceLabel={price(item.price, settings, item.purpose === "Rent")}
              />
            )}
            {match !== undefined && <Chip tone="blue">{match}% match</Chip>}
          </div>
        </div>
      </div>
    </article>
  );
}

type MetricProps = {
  title: string;
  value: string | number;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function Metric({ title, value, detail, Icon }: MetricProps) {
  return (
    <div className="admin-card relative overflow-hidden p-5">
      <div className="absolute left-0 top-0 h-full w-1 bg-amber-400" />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</div>
          <div className="mt-1.5 text-xs leading-relaxed text-slate-500">{detail}</div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyConnectWhiteLabelPreview({ variant = "public" }: { variant?: "public" | "admin" }) {
  const toast = useToast();
  const [settings, setSettings] = useState(baseSettings);
  const [adminTab, setAdminTab] = useState("overview");
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "bot", text: baseSettings.welcome }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [leadScore, setLeadScore] = useState(0);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [listings, setListings] = useState<Listing[]>(fallbackListings);
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [propertyForm, setPropertyForm] = useState<PropertyForm>(emptyPropertyForm(baseSettings.city));
  const [propertySaving, setPropertySaving] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [mediaPropertyId, setMediaPropertyId] = useState<string | null>(null);
  const [mediaPropertyTitle, setMediaPropertyTitle] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [brandError, setBrandError] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);
  const [socialSaved, setSocialSaved] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>(quickReplies);
  const [aiMode, setAiMode] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [purposeFilter, setPurposeFilter] = useState<"All" | "Sale" | "Rent">("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Ready" | "Off-plan">("All");
  const [cityFilter, setCityFilter] = useState("");
  const [leadAreaFilter, setLeadAreaFilter] = useState("Karachi");
  const [collectedPhones, setCollectedPhones] = useState<string[] | null>(null);
  const [phonesCopied, setPhonesCopied] = useState(false);

  useEffect(() => {
    fetchBrandSettings().then(setSettings).catch(() => setSettings(loadBrandSettings()));
    setSocialLinks(loadSocialLinks());
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].from === "bot") {
        return [{ from: "bot", text: settings.welcome }];
      }
      return prev;
    });
  }, [settings.welcome]);

  async function loadListings() {
    const response = await fetch("/api/properties");
    const data: ApiProperty[] = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      setListings(data.map(mapProperty));
    }
  }

  useEffect(() => {
    loadListings().catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/agents")
      .then((response) => response.json())
      .then((data: Agent[]) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch(() => undefined);

    fetch("/api/faqs")
      .then((response) => response.json())
      .then((data: FAQ[]) => {
        if (Array.isArray(data)) setFaqs(data);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (variant !== "admin") return;

    fetch("/api/leads")
      .then((response) => response.json())
      .then((data: ApiLead[]) => {
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(() => undefined);

    fetch("/api/bookings")
      .then((response) => response.json())
      .then((data: ApiBooking[]) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(() => undefined);
  }, [variant, adminTab]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const text = `${item.title} ${item.location} ${item.type}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesPurpose = purposeFilter === "All" || item.purpose === purposeFilter;
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesCity = !cityFilter || item.city.toLowerCase().includes(cityFilter.toLowerCase());
      return matchesSearch && matchesPurpose && matchesCategory && matchesCity;
    });
  }, [listings, search, purposeFilter, categoryFilter, cityFilter]);

  const saleCount = listings.filter((item) => item.purpose === "Sale").length;
  const rentCount = listings.filter((item) => item.purpose === "Rent").length;
  const offPlanCount = listings.filter((item) => item.category === "Off-plan").length;
  const cityCount = new Set(listings.map((item) => item.city)).size;
  const buyerLeads = leads.filter((lead) => lead.type === "BUYER").length;
  const tenantLeads = leads.filter((lead) => lead.type === "TENANT").length;
  const investorLeads = leads.filter((lead) => lead.type === "INVESTOR").length;

  const hotLeadCount = leads.filter((lead) => lead.temperature === "HOT").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING").length;

  async function send(text: string) {
    const value = text.trim();
    if (!value) return;

    const history = messages.map((item) => ({
      role: item.from === "user" ? ("user" as const) : ("assistant" as const),
      content: item.text
    }));

    setMessages((prev) => [...prev, { from: "user", text: value }]);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, history })
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.message,
          properties: data.properties,
          suggestions: data.suggestions,
          aiPowered: data.aiPowered
        }
      ]);
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setChatSuggestions(data.suggestions);
      }
      setAiMode(Boolean(data.aiPowered));
      setLeadScore((prev) => Math.min(100, prev + (intentScores[data.intent] || 5)));
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, I could not reach the assistant right now. Please try again." }
      ]);
    } finally {
      setTyping(false);
    }
  }

  function resetChat() {
    setMessages([{ from: "bot", text: settings.welcome }]);
    setLeadScore(0);
    setChatSuggestions(quickReplies);
    setAiMode(false);
  }

  function openAddProperty() {
    setPropertyForm(emptyPropertyForm(settings.city));
    setPropertyError("");
    setImageUploading(false);
    setShowAddProperty(true);
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setBrandError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "logos");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setBrandError(data.error || "Logo upload failed.");
        return;
      }

      const nextSettings = { ...settings, logoUrl: data.url };
      setSettings(nextSettings);
      await persistBrandSettings(nextSettings);
      toast.success("Logo uploaded and saved.");
    } catch {
      setBrandError("Logo upload failed. Please try again.");
      toast.error("Logo upload failed.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  async function saveBrandSettingsForm() {
    const saved = await persistBrandSettings(settings);
    setSettings(saved);
    setBrandSaved(true);
    toast.success("Brand settings saved.");
    setTimeout(() => setBrandSaved(false), 1200);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setPropertyError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setPropertyError(data.error || "Image upload failed.");
        return;
      }

      setPropertyForm((current) => ({ ...current, featuredImage: data.url }));
      toast.success("Property image uploaded.");
    } catch {
      setPropertyError("Image upload failed. Please try again.");
      toast.error("Image upload failed.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  async function submitProperty(event: React.FormEvent) {
    event.preventDefault();
    setPropertySaving(true);
    setPropertyError("");

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: propertyForm.title,
          description: propertyForm.description || undefined,
          area: propertyForm.area,
          city: propertyForm.city,
          propertyType: propertyForm.propertyType,
          listingPurpose: propertyForm.listingPurpose,
          category: propertyForm.category,
          bedrooms: propertyForm.bedrooms,
          bathrooms: Number(propertyForm.bathrooms),
          sizeSqFt: Number(propertyForm.sizeSqFt),
          price: Number(propertyForm.price),
          featuredImage: propertyForm.featuredImage || undefined,
          featured: propertyForm.featured
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setPropertyError(data.error?.fieldErrors ? "Please check the form fields." : "Could not save property.");
        return;
      }

      await loadListings();
      setShowAddProperty(false);
      toast.success("Property added successfully.");
    } catch {
      setPropertyError("Could not save property. Please try again.");
      toast.error("Could not save property.");
    } finally {
      setPropertySaving(false);
    }
  }

  const publicNavItems = [
    { label: "Buy", onClick: () => { setPurposeFilter("Sale"); scrollToListings(); } },
    { label: "Rent", onClick: () => { setPurposeFilter("Rent"); scrollToListings(); } },
    { label: "Off-Plan", onClick: () => { setCategoryFilter("Off-plan"); scrollToListings(); } },
    {
      label: "Agents",
      onClick: () => document.getElementById("agents-section")?.scrollIntoView({ behavior: "smooth" })
    },
    { label: "FAQ", onClick: () => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" }) }
  ];

  function handleServiceClick(action: string) {
    setChatOpen(true);
    send(action);
  }

  function handleAreaClick(area: string) {
    setSearch(area);
    setPurposeFilter("All");
    document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToListings() {
    document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function openWhatsApp(message = "Hi, I need help finding a property.") {
    if (!socialLinks.whatsapp.trim()) return;
    window.open(whatsAppUrl(socialLinks.whatsapp, message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {variant === "public" ? (
        <PublicSiteHeader
          settings={settings}
          onOpenChat={() => setChatOpen(true)}
          onBrowse={scrollToListings}
          navItems={publicNavItems}
        />
      ) : (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="" className="h-10 w-10 rounded-xl border object-contain p-1" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: settings.primary }}>
                  <Home className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-extrabold">{settings.agencyName}</div>
                <div className="text-xs text-slate-500">Admin panel</div>
              </div>
            </div>
            <a
              href="/"
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View website →
            </a>
          </div>
        </header>
      )}

      {variant === "public" ? (
        <main className="pb-safe-mobile">
          <section className="hero-mesh mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
            <div>
              {settings.logoUrl && (
                <div className="mb-6">
                  <img
                    src={settings.logoUrl}
                    alt={settings.agencyName}
                    className="h-16 w-auto max-w-[220px] rounded-2xl border border-slate-200 bg-white object-contain p-2 shadow-sm sm:h-20"
                  />
                </div>
              )}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <Sparkles className="h-4 w-4" />
                Pakistan&apos;s AI-Powered Real Estate Platform
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                Buy, rent & invest in property across Pakistan.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Search verified listings in Karachi, Lahore & Islamabad. Get AI recommendations, book viewings, and
                connect with expert property consultants — all in one platform.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg"
                  style={{ background: settings.primary }}
                >
                  Ask AI Property Advisor
                </button>
                <button
                  type="button"
                  onClick={scrollToListings}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold"
                >
                  Browse {listings.length} Listings
                </button>
              </div>
              <div className="mt-6">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Connect on social media</div>
                <SocialBar links={socialLinks} layout="strip" showAll />
              </div>
              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-2xl font-extrabold">{saleCount}</div>
                  <div className="text-xs text-slate-500">For Sale</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-2xl font-extrabold">{rentCount}</div>
                  <div className="text-xs text-slate-500">For Rent</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-2xl font-extrabold">{offPlanCount}</div>
                  <div className="text-xs text-slate-500">Off-Plan</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-2xl font-extrabold">{agents.length || 3}</div>
                  <div className="text-xs text-slate-500">Agents</div>
                </div>
              </div>
            </div>
            <PropertySearchBar
              settings={settings}
              purposeFilter={purposeFilter}
              categoryFilter={categoryFilter}
              cityFilter={cityFilter}
              onPurposeFilter={setPurposeFilter}
              onCategoryFilter={setCategoryFilter}
              onCityFilter={setCityFilter}
              onSearch={scrollToListings}
            />
          </section>

          <AgencyStatsBar
            settings={settings}
            stats={{
              listings: listings.length,
              cities: cityCount || 3,
              agents: agents.length || 3,
              offPlan: offPlanCount
            }}
          />

          <ServicesSection settings={settings} onServiceClick={handleServiceClick} />

          <section id="listings-section" className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-5">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Property listings</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredListings.length} of {listings.length} properties
              </p>
            </div>
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search area, city, or type…"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["All", "Sale", "Rent"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurposeFilter(p)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      purposeFilter === p ? "text-white" : "bg-slate-100 text-slate-600"
                    }`}
                    style={purposeFilter === p ? { background: settings.primary } : {}}
                  >
                    {p === "All" ? "All" : p}
                  </button>
                ))}
                {(["All", "Ready", "Off-plan"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      categoryFilter === c ? "ring-2 ring-amber-300" : "bg-slate-100 text-slate-600"
                    }`}
                    style={categoryFilter === c ? { background: settings.accent, color: settings.primary } : {}}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {filteredListings.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No properties match your filters. Try adjusting city, purpose, or search terms.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((item) => (
                  <ListingCard key={item.id} item={item} settings={settings} socialLinks={socialLinks} showShare />
                ))}
              </div>
            )}
          </section>

          <PopularAreasSection settings={settings} onAreaClick={handleAreaClick} />

          <WhyChooseUsSection settings={settings} />

          <div id="agents-section">
            <AgentsSection settings={settings} agents={agents} onWhatsApp={openWhatsApp} />
          </div>

          <div id="faq-section">
            <FAQSection faqs={faqs} />
          </div>

          <RealEstateCTA settings={settings} onOpenChat={() => setChatOpen(true)} onWhatsApp={openWhatsApp} />

          <section className="mx-auto max-w-7xl px-5 pb-16">
            <SocialBar links={socialLinks} layout="showcase" />
          </section>

          <footer className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-7xl px-5 py-12">
              <div className="mb-8 grid gap-8 md:grid-cols-3">
                <div>
                  <div className="font-extrabold">{settings.agencyName}</div>
                  <p className="mt-2 text-sm text-slate-500">
                    Your trusted partner for buying, selling, renting, and investing in property across Pakistan.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Services</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div>Buy Property</div>
                    <div>Rent Property</div>
                    <div>Off-Plan Investment</div>
                    <div>Property Valuation</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Markets</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div>Karachi · DHA · Clifton</div>
                    <div>Lahore · Gulberg · DHA</div>
                    <div>Islamabad · F-7 · Bahria Town</div>
                  </div>
                </div>
              </div>
              <SocialBar links={socialLinks} layout="footer" primaryColor={settings.primary} />
              <div className="mt-8 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} {settings.agencyName}. Licensed real estate services in {settings.country}.
              </div>
            </div>
          </footer>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
          <label className="mb-3 block lg:hidden">
            <span className="mb-1 block text-xs font-bold text-slate-500">Go to section</span>
            <select
              value={adminTab}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "whatsapp-analytics") window.location.href = "/admin/whatsapp";
                else setAdminTab(v);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold shadow-sm"
            >
              <option value="overview">Dashboard</option>
              <option value="leads">Leads & CRM</option>
              <option value="properties">Properties</option>
              <option value="bookings">Viewings</option>
              <option value="agents">Agents</option>
              <option value="broadcast">WhatsApp Campaigns</option>
              <option value="whatsapp-analytics">WhatsApp Analytics</option>
              <option value="social">Social Media</option>
              <option value="brand">Agency Brand</option>
              <option value="market">Market & Pricing</option>
              <option value="faqs">FAQs</option>
              <option value="bot">AI Advisor</option>
            </select>
          </label>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {ADMIN_QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setAdminTab(action.id)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm"
              >
                {action.label}
              </button>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="hidden lg:block">
              <AdminSidebar activeTab={adminTab} primary={settings.primary} onNavigate={setAdminTab} />
            </div>

            <section className="min-w-0">
              {adminTab === "overview" && (
                <>
                  <AdminPageHeader
                    title="Dashboard"
                    description="Your agency at a glance — leads, listings, viewings, and team activity."
                  />
                  <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {ADMIN_QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setAdminTab(action.id)}
                        className="admin-card flex flex-col items-start p-4 text-left transition hover:border-amber-200 hover:shadow-md"
                      >
                        <span className="text-sm font-bold text-slate-900">{action.label}</span>
                        <span className="mt-0.5 text-xs text-slate-500">{action.hint}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric title="Total Leads" value={leads.length} detail={`${hotLeadCount} hot · ${buyerLeads} buyers`} Icon={Users} />
                    <Metric title="Active Listings" value={listings.length} detail={`${saleCount} sale · ${rentCount} rent`} Icon={Building2} />
                    <Metric title="Viewing Requests" value={bookings.length} detail={`${pendingBookings} pending confirmation`} Icon={Calendar} />
                    <Metric title="Active Agents" value={agents.length} detail="Property consultants" Icon={Handshake} />
                  </div>
                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">Property Pipeline</div>
                          <div className="text-xs text-slate-500">Inventory breakdown by type</div>
                        </div>
                        <Layers className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="mt-6 flex h-52 items-end gap-4">
                        {[
                          { label: "For Sale", value: saleCount, color: settings.primary },
                          { label: "For Rent", value: rentCount, color: settings.accent },
                          { label: "Off-Plan", value: offPlanCount, color: "#64748b" }
                        ].map((bar) => (
                          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                            <div className="text-sm font-extrabold">{bar.value}</div>
                            <div
                              className="w-full rounded-t-xl"
                              style={{ height: `${Math.max(bar.value * 24, 24)}px`, background: bar.color }}
                            />
                            <span className="text-xs text-slate-500">{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="font-bold">Lead Intelligence</div>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
                          <strong>{buyerLeads}</strong> buyer leads · <strong>{tenantLeads}</strong> tenant ·{" "}
                          <strong>{investorLeads}</strong> investor
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
                          {hotLeadCount > 0
                            ? `${hotLeadCount} hot leads need immediate agent follow-up.`
                            : "No hot leads yet — AI chatbot is qualifying visitors."}
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-800">
                          {pendingBookings > 0
                            ? `${pendingBookings} viewing requests awaiting confirmation.`
                            : "Viewing calendar is clear."}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {adminTab === "leads" && (
                <>
                  <AdminPageHeader
                    title="Leads & CRM"
                    description="Buyers, tenants, investors, and callbacks captured by your AI chatbot and website."
                  >
                    <div className="flex flex-wrap gap-2">
                      {/* Collect Phone Numbers */}
                      <button
                        type="button"
                        onClick={() => {
                          const filter = leadAreaFilter.trim().toLowerCase();
                          const filtered = leads.filter((l) => {
                            if (!l.phone?.trim()) return false;
                            if (!filter) return true;
                            return (l.preferredArea || "").toLowerCase().includes(filter) ||
                                   (l.name || "").toLowerCase().includes(filter);
                          });
                          const phones = [...new Set(
                            filtered.map((l) => l.phone!.replace(/\D/g, "")).filter((p) => p.length >= 10)
                          )];
                          setCollectedPhones(phones);
                          setPhonesCopied(false);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        <Phone className="h-4 w-4" />
                        Collect Phone Numbers
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rows = [
                            ["Name", "Type", "Area", "Score", "Temperature", "Status"],
                            ...leads.map((lead) => [
                              lead.name || "Anonymous",
                              lead.type,
                              lead.preferredArea || "",
                              String(lead.score),
                              lead.temperature,
                              lead.status
                            ])
                          ];
                          const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = "realestateworkeasy-leads.csv";
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                        style={{ background: settings.primary }}
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </button>
                    </div>
                  </AdminPageHeader>

                  {/* Collect Phone Numbers Panel */}
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-bold text-slate-700">Collect phones by area</span>
                      </div>
                      <input
                        value={leadAreaFilter}
                        onChange={(e) => setLeadAreaFilter(e.target.value)}
                        placeholder="e.g. Karachi, Titanium, North Town…"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm min-w-[180px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filter = leadAreaFilter.trim().toLowerCase();
                          const filtered = leads.filter((l) => {
                            if (!l.phone?.trim()) return false;
                            if (!filter) return true;
                            return (l.preferredArea || "").toLowerCase().includes(filter) ||
                                   (l.name || "").toLowerCase().includes(filter);
                          });
                          const phones = [...new Set(
                            filtered.map((l) => l.phone!.replace(/\D/g, "")).filter((p) => p.length >= 10)
                          )];
                          setCollectedPhones(phones);
                          setPhonesCopied(false);
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        Collect
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const all = leads.filter((l) => l.phone?.trim());
                          const phones = [...new Set(
                            all.map((l) => l.phone!.replace(/\D/g, "")).filter((p) => p.length >= 10)
                          )];
                          setCollectedPhones(phones);
                          setLeadAreaFilter("");
                          setPhonesCopied(false);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                      >
                        All leads
                      </button>
                    </div>

                    {collectedPhones !== null && (
                      <div className="mt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">
                            {collectedPhones.length} phone number{collectedPhones.length !== 1 ? "s" : ""} found
                            {leadAreaFilter ? ` matching "${leadAreaFilter}"` : " (all leads)"}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(collectedPhones.join("\n"));
                                setPhonesCopied(true);
                                setTimeout(() => setPhonesCopied(false), 2000);
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              {phonesCopied ? "Copied!" : "Copy all"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCollectedPhones(null)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        {collectedPhones.length > 0 ? (
                          <textarea
                            readOnly
                            value={collectedPhones.join("\n")}
                            rows={Math.min(collectedPhones.length + 1, 8)}
                            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-xs text-slate-700"
                          />
                        ) : (
                          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            No leads with phone numbers match{leadAreaFilter ? ` "${leadAreaFilter}"` : ""}. Try a different area or click "All leads".
                          </p>
                        )}
                        {collectedPhones.length > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Copy → go to <strong>WhatsApp Campaigns → Phone List Send</strong> → paste → send broadcast
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Lead</th>
                          <th>Type</th>
                          <th>Location</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-bold">{lead.name || "Anonymous"}</td>
                            <td>{formatLeadType(lead.type)}</td>
                            <td>{lead.preferredArea || "—"}</td>
                            <td>
                              <Chip tone={lead.temperature === "HOT" ? "red" : lead.temperature === "WARM" ? "amber" : "slate"}>
                                {lead.temperature} {lead.score}
                              </Chip>
                            </td>
                            <td>{lead.status}</td>
                            <td>
                              <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">
                                Open
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {adminTab === "properties" && (
                <>
                  <div className="mb-5 flex justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold">Property Inventory</h2>
                      <p className="text-sm text-slate-500">Manage sale, rental, and off-plan listings.</p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddProperty}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                      style={{ background: settings.primary }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Property
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {listings.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <ListingCard item={item} settings={settings} />
                        {typeof item.id === "string" && (
                          <button
                            type="button"
                            onClick={() => {
                              setMediaPropertyId(String(item.id));
                              setMediaPropertyTitle(item.title);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            WhatsApp media (images, video, PDF)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {mediaPropertyId && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
                      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-extrabold">Property media</h3>
                            <p className="text-sm text-slate-500">{mediaPropertyTitle}</p>
                          </div>
                          <button type="button" onClick={() => setMediaPropertyId(null)}>
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <PropertyMediaPanel propertyId={mediaPropertyId} primary={settings.primary} />
                      </div>
                    </div>
                  )}

                  {showAddProperty && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
                      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-extrabold">Add Property</h3>
                            <p className="text-sm text-slate-500">Create a new listing in the inventory.</p>
                          </div>
                          <button type="button" onClick={() => setShowAddProperty(false)}>
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <form onSubmit={submitProperty} className="space-y-4">
                          <label className="block">
                            <span className="mb-1 block text-xs font-semibold text-slate-500">Title</span>
                            <input
                              required
                              value={propertyForm.title}
                              onChange={(event) => setPropertyForm({ ...propertyForm, title: event.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              placeholder="DHA Phase 6 2BR Apartment"
                            />
                          </label>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Area / Location</span>
                              <input
                                required
                                value={propertyForm.area}
                                onChange={(event) => setPropertyForm({ ...propertyForm, area: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                placeholder="DHA Phase 6"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">City</span>
                              <input
                                required
                                value={propertyForm.city}
                                onChange={(event) => setPropertyForm({ ...propertyForm, city: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                placeholder="Karachi"
                              />
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Property type</span>
                              <select
                                value={propertyForm.propertyType}
                                onChange={(event) => setPropertyForm({ ...propertyForm, propertyType: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              >
                                {["Apartment", "House", "Villa", "Townhouse", "Studio", "Penthouse"].map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Purpose</span>
                              <select
                                value={propertyForm.listingPurpose}
                                onChange={(event) =>
                                  setPropertyForm({
                                    ...propertyForm,
                                    listingPurpose: event.target.value as PropertyForm["listingPurpose"]
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              >
                                <option value="SALE">Sale</option>
                                <option value="RENT">Rent</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Category</span>
                              <select
                                value={propertyForm.category}
                                onChange={(event) =>
                                  setPropertyForm({
                                    ...propertyForm,
                                    category: event.target.value as PropertyForm["category"]
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              >
                                <option value="READY">Ready</option>
                                <option value="OFF_PLAN">Off-plan</option>
                              </select>
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-4">
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Bedrooms</span>
                              <input
                                required
                                value={propertyForm.bedrooms}
                                onChange={(event) => setPropertyForm({ ...propertyForm, bedrooms: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Bathrooms</span>
                              <input
                                required
                                type="number"
                                min="1"
                                value={propertyForm.bathrooms}
                                onChange={(event) => setPropertyForm({ ...propertyForm, bathrooms: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Size (sq ft)</span>
                              <input
                                required
                                type="number"
                                min="1"
                                value={propertyForm.sizeSqFt}
                                onChange={(event) => setPropertyForm({ ...propertyForm, sizeSqFt: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Price (PKR)</span>
                              <input
                                required
                                type="number"
                                min="1"
                                value={propertyForm.price}
                                onChange={(event) => setPropertyForm({ ...propertyForm, price: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                          </div>

                          <label className="block">
                            <span className="mb-1 block text-xs font-semibold text-slate-500">Description</span>
                            <textarea
                              value={propertyForm.description}
                              onChange={(event) => setPropertyForm({ ...propertyForm, description: event.target.value })}
                              className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              placeholder="Optional property description"
                            />
                          </label>

                          <div className="block">
                            <span className="mb-2 block text-xs font-semibold text-slate-500">Property image</span>
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                              <Upload className="h-4 w-4" />
                              {imageUploading ? "Uploading image..." : "Choose image from computer"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageUpload}
                                disabled={imageUploading}
                                className="hidden"
                              />
                            </label>
                            {propertyForm.featuredImage && (
                              <img
                                src={propertyForm.featuredImage}
                                alt="Property preview"
                                className="mt-3 h-40 w-full rounded-xl border border-slate-200 object-cover"
                              />
                            )}
                          </div>

                          <label className="flex items-center gap-2 text-sm font-semibold">
                            <input
                              type="checkbox"
                              checked={propertyForm.featured}
                              onChange={(event) => setPropertyForm({ ...propertyForm, featured: event.target.checked })}
                            />
                            Mark as featured listing
                          </label>

                          {propertyError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{propertyError}</div>}

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setShowAddProperty(false)}
                              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={propertySaving}
                              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                              style={{ background: settings.primary }}
                            >
                              {propertySaving ? "Saving..." : "Save Property"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              )}

              {adminTab === "bookings" && (
                <>
                  <h2 className="text-2xl font-extrabold">Viewing Bookings</h2>
                  <p className="mb-5 text-sm text-slate-500">Property tour requests from website visitors and AI chat.</p>
                  {bookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                      No viewing bookings yet.
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div>
                          <div className="font-bold">{booking.property.title}</div>
                          <div className="text-xs text-slate-500">
                            {booking.reference} · {formatBookingDate(booking.preferredAt)}
                          </div>
                        </div>
                        <Chip tone={booking.status === "PENDING" ? "amber" : "green"}>{booking.status}</Chip>
                      </div>
                    ))
                  )}
                </>
              )}

              {adminTab === "agents" && (
                <>
                  <div className="mb-5">
                    <h2 className="text-2xl font-extrabold">Property Agents</h2>
                    <p className="text-sm text-slate-500">Consultants managing listings, leads, and viewings.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                            <div className="text-xs text-slate-500">{agent.email}</div>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Phone</span>
                            <span className="font-semibold">{agent.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Languages</span>
                            <span className="font-semibold">{agent.languages.join(", ")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Listings</span>
                            <span className="font-semibold">{agent._count.properties}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Leads</span>
                            <span className="font-semibold">{agent._count.leads}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {adminTab === "faqs" && (
                <>
                  <div className="mb-5">
                    <h2 className="text-2xl font-extrabold">Real Estate FAQs</h2>
                    <p className="text-sm text-slate-500">Questions shown on the website and used by the AI advisor.</p>
                  </div>
                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <Chip tone="amber">{faq.category}</Chip>
                        <div className="mt-2 font-bold">{faq.question}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {adminTab === "market" && (
                <>
                  <h2 className="text-2xl font-extrabold">Market & Pricing</h2>
                  <p className="mb-5 text-sm text-slate-500">
                    Configure country, city, currency (PKR), and area units for all listings.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="font-bold">Market Configuration</div>
                      <div className="mt-4 space-y-3">
                        {(
                          [
                            ["Country", "country"],
                            ["Default city", "city"],
                            ["Currency code", "currency"],
                            ["Currency symbol", "symbol"],
                            ["Area unit", "areaUnit"]
                          ] as const
                        ).map(([label, key]) => (
                          <label className="block" key={key}>
                            <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
                            <input
                              value={settings[key]}
                              onChange={(event) => setSettings({ ...settings, [key]: event.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="font-bold">Live Market Preview</div>
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <div className="text-sm text-slate-500">Configured market</div>
                        <div className="mt-1 text-lg font-extrabold">
                          {settings.city}, {settings.country}
                        </div>
                        <div className="mt-4 text-sm text-slate-500">Sample property price</div>
                        <div className="mt-1 text-2xl font-extrabold" style={{ color: settings.accent }}>
                          {price(listings[0]?.price || 425000, settings)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {(listings[0]?.size || 1280).toLocaleString()} {settings.areaUnit}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await persistBrandSettings(settings);
                      setSaved(true);
                      toast.success("Market settings saved.");
                      setTimeout(() => setSaved(false), 1200);
                    }}
                    className="mt-4 rounded-xl px-4 py-3 text-sm font-bold text-white"
                    style={{ background: settings.primary }}
                  >
                    {saved ? "Market Settings Saved ✓" : "Save Market Settings"}
                  </button>
                </>
              )}

              {adminTab === "brand" && (
                <>
                  <h2 className="text-2xl font-extrabold">Agency Brand</h2>
                  <p className="mb-5 text-sm text-slate-500">Logo, colors, and agency identity for your real estate business.</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Agency name</span>
                        <input
                          value={settings.agencyName}
                          onChange={(event) => setSettings({ ...settings, agencyName: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Primary color</span>
                        <input
                          type="color"
                          value={settings.primary}
                          onChange={(event) => setSettings({ ...settings, primary: event.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-200 p-1"
                        />
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Accent color</span>
                        <input
                          type="color"
                          value={settings.accent}
                          onChange={(event) => setSettings({ ...settings, accent: event.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-200 p-1"
                        />
                      </label>
                      <div className="mt-3 block">
                        <span className="mb-2 block text-xs font-semibold text-slate-500">Agency logo</span>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                          <Upload className="h-4 w-4" />
                          {logoUploading ? "Uploading logo..." : "Upload logo from computer"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleLogoUpload}
                            disabled={logoUploading}
                            className="hidden"
                          />
                        </label>
                        {settings.logoUrl && (
                          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                            <img src={settings.logoUrl} alt="Agency logo preview" className="h-14 w-14 rounded-lg object-contain" />
                            <button
                              type="button"
                              onClick={async () => {
                                const nextSettings = { ...settings, logoUrl: "" };
                                setSettings(nextSettings);
                                await persistBrandSettings(nextSettings);
                                toast.success("Logo removed.");
                              }}
                              className="text-xs font-bold text-red-600"
                            >
                              Remove logo
                            </button>
                          </div>
                        )}
                      </div>
                      {brandError && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{brandError}</div>}
                      <button
                        type="button"
                        onClick={saveBrandSettingsForm}
                        className="mt-4 rounded-xl px-4 py-3 text-sm font-bold text-white"
                        style={{ background: settings.primary }}
                      >
                        {brandSaved ? "Brand Saved ✓" : "Save Brand Settings"}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="rounded-2xl p-5 text-white" style={{ background: settings.primary }}>
                        <div className="flex items-center gap-3">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                              <Home className="h-6 w-6" />
                            </div>
                          )}
                          <div className="text-lg font-extrabold">{settings.agencyName}</div>
                        </div>
                        <div className="mt-1 text-sm opacity-80">Premium real estate assistance</div>
                        <button type="button" className="mt-4 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: settings.accent }}>
                          Primary CTA
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {adminTab === "social" && (
                <>
                  <h2 className="text-2xl font-extrabold">Social Channels</h2>
                  <p className="mb-5 text-sm text-slate-500">
                    Connect WhatsApp, Instagram, Facebook, TikTok, LinkedIn, YouTube, and X with your agency profile.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="space-y-3">
                        {(
                          [
                            ["WhatsApp number", "whatsapp", "03412879311"],
                            ["Instagram username or URL", "instagram", "youragency"],
                            ["Facebook page or URL", "facebook", "youragency"],
                            ["TikTok username or URL", "tiktok", "youragency"],
                            ["LinkedIn profile or URL", "linkedin", "youragency"],
                            ["YouTube channel or URL", "youtube", "youragency"],
                            ["X / Twitter username or URL", "twitter", "youragency"]
                          ] as const
                        ).map(([label, key, placeholder]) => (
                          <label className="block" key={key}>
                            <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
                            <input
                              value={socialLinks[key]}
                              onChange={(event) => setSocialLinks({ ...socialLinks, [key]: event.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              placeholder={placeholder}
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          saveSocialLinks(socialLinks);
                          setSocialSaved(true);
                          toast.success("Social links saved.");
                          setTimeout(() => setSocialSaved(false), 1200);
                        }}
                        className="mt-4 rounded-xl px-4 py-3 text-sm font-bold text-white"
                        style={{ background: settings.primary }}
                      >
                        {socialSaved ? "Social Links Saved ✓" : "Save Social Links"}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="font-bold">Live preview</div>
                      <p className="mt-1 text-sm text-slate-500">How social icons appear on the public website.</p>
                      <div className="mt-5 space-y-5">
                        <SocialBar links={socialLinks} layout="strip" />
                        <SocialBar links={socialLinks} layout="showcase" />
                        <SocialBar links={socialLinks} layout="footer" primaryColor={settings.primary} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {adminTab === "broadcast" && <WhatsAppCampaigns settings={settings} leads={leads} />}

              {adminTab === "bot" && (
                <>
                  <h2 className="text-2xl font-extrabold">Bot Settings</h2>
                  <p className="mb-5 text-sm text-slate-500">Customize your AI advisor identity, welcome message, and chat behavior.</p>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Bot name</span>
                      <input
                        value={settings.botName}
                        onChange={(event) => setSettings({ ...settings, botName: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Welcome message</span>
                      <textarea
                        value={settings.welcome}
                        onChange={(event) => setSettings({ ...settings, welcome: event.target.value })}
                        className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={saveBrandSettingsForm}
                      className="mt-4 rounded-xl px-4 py-3 text-sm font-bold text-white"
                      style={{ background: settings.primary }}
                    >
                      {brandSaved ? "Bot Settings Saved ✓" : "Save Bot Settings"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      )}

      {variant === "public" && <SocialBar links={socialLinks} layout="dock" />}

      {chatOpen && variant === "public" && (
        <div className="fixed bottom-20 left-3 right-3 z-40 flex max-h-[min(690px,calc(100vh-6rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-[min(400px,calc(100vw-3rem))]">
          <div className="flex items-center justify-between px-4 py-4 text-white" style={{ background: settings.primary }}>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  {settings.botName}
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">AI</span>
                </div>
                <div className="text-xs text-emerald-300">● {aiMode ? "GPT-powered" : "Smart advisor online"}</div>
              </div>
            </div>
            <button type="button" onClick={() => setChatOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div key={index} className={`mb-3 flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] ${message.from === "user" ? "" : "space-y-2"}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-5 ${
                      message.from === "user" ? "text-white" : "border border-slate-200 bg-white text-slate-700"
                    }`}
                    style={message.from === "user" ? { background: settings.primary } : {}}
                  >
                    {message.from === "bot" ? renderMessageText(message.text) : message.text}
                  </div>
                  {message.from === "bot" && message.properties && message.properties.length > 0 && (
                    <div className="space-y-2">
                      {message.properties.map((property) => (
                        <div
                          key={property.id}
                          className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <div className="text-xs font-bold text-slate-900">{property.title}</div>
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              {property.ref}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {property.bedrooms} bed · {property.propertyType} · {property.area}, {property.city}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-sm font-extrabold" style={{ color: settings.primary }}>
                              {formatChatPrice(property.price, property.listingPurpose)}
                            </div>
                            <button
                              type="button"
                              onClick={() => send(`Tell me more about ${property.ref}`)}
                              className="rounded-lg px-2 py-1 text-[11px] font-bold text-white"
                              style={{ background: settings.primary }}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="mb-3 flex items-center gap-2">
                <div className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:100ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:200ms]" />
                </div>
                <span className="text-xs font-medium text-slate-500">Analyzing listings...</span>
              </div>
            )}
            <div className="grid gap-2">
              {chatSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => send(item)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-amber-50"
                >
                  {item}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200 p-3">
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => openWhatsApp("Hi, I would like to speak with a property agent.")}
                className="flex-1 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:bg-[#1ebe57]"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => send("Speak with an agent")}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
              >
                <Phone className="mr-1 inline h-3 w-3" />
                Speak with Agent
              </button>
              <button type="button" onClick={resetChat} className="rounded-xl border border-slate-200 px-3 py-2">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && send(input)}
                placeholder="Ask about areas, budget, or properties..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="button" onClick={() => send(input)} className="rounded-xl px-3 text-white" style={{ background: settings.primary }}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              Lead score: {leadScore}/100 · {aiMode ? "OpenAI + live database" : "AI advisor + live database"}
            </div>
          </div>
        </div>
      )}

      {!chatOpen && variant === "public" && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-20 right-4 z-20 rounded-full p-4 text-white shadow-2xl sm:bottom-6 sm:right-6"
          style={{ background: settings.primary }}
          aria-label={settings.tooltip}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
