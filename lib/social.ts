export type SocialLinks = {
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  youtube: string;
  twitter: string;
};

export const defaultSocialLinks: SocialLinks = {
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+923412879311",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || ""
};

const SOCIAL_STORAGE_KEY = "propertyconnect-social-links";

export function loadSocialLinks(): SocialLinks {
  if (typeof window === "undefined") return defaultSocialLinks;

  try {
    const saved = localStorage.getItem(SOCIAL_STORAGE_KEY);
    if (!saved) return defaultSocialLinks;
    return { ...defaultSocialLinks, ...JSON.parse(saved), whatsapp: defaultSocialLinks.whatsapp };
  } catch {
    return defaultSocialLinks;
  }
}

export function saveSocialLinks(links: SocialLinks) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(links));
}

export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function whatsAppUrl(number: string, message?: string) {
  const phone = normalizeWhatsAppNumber(number).replace(/^\+/, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${phone}${text}`;
}

export function instagramUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

export function facebookUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  return `https://facebook.com/${trimmed.replace(/^@/, "")}`;
}

export function tiktokUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://tiktok.com/@${handle}`;
}

export function linkedinUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  return `https://linkedin.com/in/${trimmed.replace(/^@/, "")}`;
}

export function youtubeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://youtube.com/@${handle}`;
}

export function twitterUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://x.com/${handle}`;
}

export function propertyShareMessage(title: string, location: string, priceLabel: string) {
  return `Hi, I am interested in this property:\n${title}\n${location}\n${priceLabel}`;
}

export function facebookShareUrl(pageUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

export function twitterShareUrl(pageUrl: string, text: string) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(text)}`;
}

export function linkedinShareUrl(pageUrl: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

export function getAllSocialChannels(links: SocialLinks) {
  return [
    { id: "whatsapp", label: "WhatsApp", href: whatsAppUrl(links.whatsapp, "Hi, I need property assistance."), enabled: Boolean(links.whatsapp.trim()) },
    { id: "instagram", label: "Instagram", href: instagramUrl(links.instagram), enabled: Boolean(links.instagram.trim()) },
    { id: "facebook", label: "Facebook", href: facebookUrl(links.facebook), enabled: Boolean(links.facebook.trim()) },
    { id: "tiktok", label: "TikTok", href: tiktokUrl(links.tiktok), enabled: Boolean(links.tiktok.trim()) },
    { id: "linkedin", label: "LinkedIn", href: linkedinUrl(links.linkedin), enabled: Boolean(links.linkedin.trim()) },
    { id: "youtube", label: "YouTube", href: youtubeUrl(links.youtube), enabled: Boolean(links.youtube.trim()) },
    { id: "twitter", label: "X / Twitter", href: twitterUrl(links.twitter), enabled: Boolean(links.twitter.trim()) }
  ];
}

export function getActiveSocialChannels(links: SocialLinks) {
  return getAllSocialChannels(links).filter((channel) => channel.enabled);
}
