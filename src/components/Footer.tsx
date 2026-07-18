import { useLanguage } from "@/context/LanguageContext";
import { footer, siteMeta } from "@/content/content";
import { useState, useEffect } from "react";
import { getSetting } from "@/admin/repositories/settings.repository";
import { getSocialIcon, getPlatformEntry } from "@/components/SocialIcons";

// ─── Social link shape ─────────────────────────────────────────────────────────

type SocialLink = {
  id: string;
  platform: string;
  iconEmoji: string;
  customIconUrl?: string;
  url: string;
  visible: boolean;
  order: number;
};

// ─── Parse both legacy flat-object and new array format ───────────────────────

/**
 * Parses the site.social setting value into a sorted list of visible links.
 * Returns null ONLY when the value is absent/null (no setting in DB yet) — caller falls back to hardcoded defaults.
 * Returns [] when the setting exists but has no visible entries — respects admin intent (show nothing).
 */
function parseSocialLinks(val: unknown): SocialLink[] | null {
  if (val === null || val === undefined) return null;

  if (Array.isArray(val)) {
    return (val as SocialLink[])
      .filter((l) => l.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  if (typeof val === "object") {
    // Legacy flat object: { instagram: "url", tiktok: "url", … }
    const old = val as Record<string, string>;
    const mapping = [
      { key: "instagram", platform: "Instagram" },
      { key: "tiktok",    platform: "TikTok" },
      { key: "youtube",   platform: "YouTube" },
      { key: "facebook",  platform: "Facebook" },
      { key: "snapchat",  platform: "Snapchat" },
      { key: "whatsapp",  platform: "WhatsApp" },
      { key: "telegram",  platform: "Telegram" },
    ];
    return mapping
      .filter((m) => old[m.key])
      .map((m, i) => ({ id: m.key, platform: m.platform, iconEmoji: "", url: old[m.key], visible: true, order: i }));
  }

  return [];
}

// ─── Hardcoded fallback (shown when DB has no data yet) ───────────────────────

const FALLBACK_LINKS: SocialLink[] = [
  { id: "whatsapp",  platform: "WhatsApp",  iconEmoji: "", url: "#", visible: true, order: 0 },
  { id: "instagram", platform: "Instagram", iconEmoji: "", url: "#", visible: true, order: 1 },
  { id: "telegram",  platform: "Telegram",  iconEmoji: "", url: "#", visible: true, order: 2 },
];

// ─── Footer ───────────────────────────────────────────────────────────────────

export default function Footer() {
  const { lang } = useLanguage();
  const t    = footer[lang];
  const meta = siteMeta[lang];
  const [dynamicLinks, setDynamicLinks] = useState<SocialLink[] | null>(null);

  useEffect(() => {
    getSetting("site.social").then((val) => {
      setDynamicLinks(parseSocialLinks(val));
    });
  }, []);

  // null  → setting not in DB yet → show hardcoded fallback
  // []    → setting exists, admin intentionally has no visible links → show nothing
  // [...] → show the admin-configured links
  const linksToShow = dynamicLinks ?? FALLBACK_LINKS;

  return (
    <footer
      id="site-footer"
      className="section-dark bg-gradient-to-br from-deep-purple to-soft-purple text-ivory-muted pt-16 pb-10 border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col items-center text-center gap-7 mb-10">
        {/* Logo */}
        <div className="inline-flex bg-white/95 rounded-2xl px-5 py-3 shadow-lg shadow-black/40">
          <img
            src="/logo.png"
            alt="SHELAN Nutritionist Logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Tagline */}
        <p className="text-sm text-ivory-muted">{t.tagline}</p>

        {/* Social label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-ivory/60">
          {t.socialTitle}
        </p>

        {/* Social icons — dynamic from DB, brand SVGs */}
        {linksToShow.length > 0 && (
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {linksToShow.map((link, i) => {
              const { frameClass, hoverClass } = getPlatformEntry(link.platform);
              return (
                <a
                  key={link.id}
                  href={link.url || "#"}
                  aria-label={link.platform}
                  target={link.url && link.url !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  className={[
                    "social-icon-active",
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "border backdrop-blur-md transition-all duration-300 hover:scale-110",
                    frameClass,
                    hoverClass,
                  ].join(" ")}
                >
                  {getSocialIcon(link.platform, {
                    customIconUrl: link.customIconUrl,
                    iconEmoji: link.iconEmoji,
                    size: 22,
                  })}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 border-t border-white/10 text-xs text-ivory-muted/70 text-center">
        © {new Date().getFullYear()} {meta.name}. {t.rights}
      </div>
    </footer>
  );
}
