import type { SocialLinks } from "../lib/social";
import { getActiveSocialChannels, getAllSocialChannels } from "../lib/social";

type IconProps = { className?: string };

function WhatsAppIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 3H16V0h-2.5C10.9 0 9 1.9 9 4.5V7H6v3h3v14h3.5V10H16l.5-3h-3V5c0-.8.7-1.5 1.5-1.5z" />
    </svg>
  );
}

function TikTokIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3c.6 2.4 2.4 4.2 4.8 4.8V11c-2.1-.1-4-.8-5.6-2v7.8c0 4.1-3.3 7.4-7.4 7.4S1 20.9 1 16.8s3.3-7.4 7.4-7.4c.4 0 .8 0 1.2.1v3.8a3.7 3.7 0 1 0 2.6 3.5V3h4.3z" />
    </svg>
  );
}

function LinkedInIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4 0 4.7 2.6 4.7 6V24h-4v-7.1c0-1.7 0-3.9-2.4-3.9-2.4 0-2.8 1.9-2.8 3.8V24h-4V8z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

function TwitterIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const iconMap = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon
} as const;

const brandStyles = {
  whatsapp: {
    bg: "bg-[#25D366]",
    ring: "ring-[#25D366]/30",
    glow: "shadow-[0_8px_24px_rgba(37,211,102,0.35)]",
    action: "Chat now"
  },
  instagram: {
    bg: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
    ring: "ring-[#dd2a7b]/30",
    glow: "shadow-[0_8px_24px_rgba(221,42,123,0.28)]",
    action: "Follow us"
  },
  facebook: {
    bg: "bg-[#1877F2]",
    ring: "ring-[#1877F2]/30",
    glow: "shadow-[0_8px_24px_rgba(24,119,242,0.28)]",
    action: "Like page"
  },
  tiktok: {
    bg: "bg-black",
    ring: "ring-black/20",
    glow: "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
    action: "Watch videos"
  },
  linkedin: {
    bg: "bg-[#0A66C2]",
    ring: "ring-[#0A66C2]/30",
    glow: "shadow-[0_8px_24px_rgba(10,102,194,0.28)]",
    action: "Connect"
  },
  youtube: {
    bg: "bg-[#FF0000]",
    ring: "ring-[#FF0000]/30",
    glow: "shadow-[0_8px_24px_rgba(255,0,0,0.28)]",
    action: "Subscribe"
  },
  twitter: {
    bg: "bg-black",
    ring: "ring-black/20",
    glow: "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
    action: "Follow"
  }
} as const;

type ChannelId = keyof typeof iconMap;

type SocialChannel = {
  id: ChannelId;
  label: string;
  href: string;
  enabled?: boolean;
};

function getChannels(links: SocialLinks, showAll = false): SocialChannel[] {
  const source = showAll ? getAllSocialChannels(links) : getActiveSocialChannels(links);
  return source.map((channel) => ({
    id: channel.id as ChannelId,
    label: channel.label,
    href: channel.href,
    enabled: channel.enabled
  }));
}

type SocialTileProps = {
  channel: SocialChannel;
  variant?: "card" | "compact" | "pill";
};

function SocialTile({ channel, variant = "card" }: SocialTileProps) {
  const Icon = iconMap[channel.id];
  const style = brandStyles[channel.id];
  const disabled = channel.enabled === false;

  if (disabled) {
    if (variant === "compact") {
      return (
        <div
          title={`${channel.label} not linked yet`}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-300"
        >
          <Icon className="h-5 w-5" />
        </div>
      );
    }

    if (variant === "pill") {
      return (
        <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-300">
          <Icon className="h-4 w-4" />
          {channel.label}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-white/35">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="font-bold">{channel.label}</div>
          <div className="text-xs">Not linked yet</div>
        </div>
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={channel.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 ${style.bg} ${style.glow}`}
      >
        <Icon className="h-4 w-4" />
        {channel.label}
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <a
        href={channel.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={channel.label}
        title={channel.label}
        className={`group flex h-12 w-12 items-center justify-center rounded-2xl text-white ring-1 transition duration-200 hover:-translate-y-1 hover:scale-105 ${style.bg} ${style.ring} ${style.glow}`}
      >
        <Icon className="h-5 w-5 transition group-hover:scale-110" />
      </a>
    );
  }

  return (
    <a
      href={channel.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg ${style.glow}`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${style.bg}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="font-bold">{channel.label}</div>
        <div className="text-xs text-white/70">{style.action}</div>
      </div>
      <span className="ml-auto text-xs font-semibold text-white/50 transition group-hover:text-white">Open →</span>
    </a>
  );
}

type SocialBarProps = {
  links: SocialLinks;
  layout?: "dock" | "footer" | "inline" | "showcase" | "strip";
  primaryColor?: string;
  showAll?: boolean;
};

export function SocialBar({ links, layout = "inline", primaryColor = "#1a2744", showAll = false }: SocialBarProps) {
  const channels = getChannels(links, showAll || layout === "showcase" || layout === "footer");
  const activeCount = channels.filter((channel) => channel.enabled !== false).length;

  if (!showAll && layout !== "showcase" && layout !== "footer" && activeCount === 0) return null;

  if (layout === "dock") {
    return (
      <div className="fixed bottom-28 left-4 z-20 sm:left-5">
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur-md">
          <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Connect</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {getChannels(links, false).map((channel) => (
              <SocialTile key={channel.id} channel={channel} variant="compact" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === "footer") {
    return (
      <section className="overflow-hidden rounded-3xl p-6 text-white sm:p-8" style={{ background: primaryColor }}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Social media</div>
            <h3 className="mt-1 text-2xl font-extrabold">Stay connected with us</h3>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              Follow us for new listings, market updates, and instant property support on your favourite platform.
            </p>
          </div>
          <div className="text-sm font-semibold text-white/70">{activeCount} of {channels.length} channels active</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel) => (
            <SocialTile key={channel.id} channel={channel} variant="card" />
          ))}
        </div>
      </section>
    );
  }

  if (layout === "showcase") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-sm font-bold text-slate-700">Connect on social media</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => {
            if (channel.enabled === false) {
              return <SocialTile key={channel.id} channel={channel} variant="card" />;
            }
            const Icon = iconMap[channel.id];
            const style = brandStyles[channel.id];
            return (
              <a
                key={channel.id}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${style.bg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{channel.label}</div>
                  <div className="text-xs text-slate-500">{style.action}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  if (layout === "strip") {
    return (
      <div className="flex flex-wrap gap-2">
        {channels.map((channel) => (
          <SocialTile key={channel.id} channel={channel} variant="pill" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((channel) => (
        <SocialTile key={channel.id} channel={channel} variant="compact" />
      ))}
    </div>
  );
}

type PropertyShareProps = {
  links: SocialLinks;
  title: string;
  location: string;
  priceLabel: string;
};

export function PropertyShareButtons({ links, title, location, priceLabel }: PropertyShareProps) {
  const message = `Hi, I am interested in this property:%0A${title}%0A${location}%0A${priceLabel}`;
  const whatsappHref = links.whatsapp
    ? `https://wa.me/${links.whatsapp.replace(/[^\d]/g, "")}?text=${message}`
    : "";

  if (!whatsappHref) return null;

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1ebe57] hover:shadow-md"
    >
      <WhatsAppIcon className="h-3.5 w-3.5" />
      WhatsApp
    </a>
  );
}

export function SocialButton({ id, label, href }: { id: ChannelId; label: string; href: string }) {
  return <SocialTile channel={{ id, label, href }} variant="compact" />;
}
