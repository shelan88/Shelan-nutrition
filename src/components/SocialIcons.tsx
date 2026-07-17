/**
 * SocialIcons — Official SVG brand icons for all supported social platforms.
 * Used in both the admin Social Media Manager and the public Footer.
 *
 * Usage:
 *   getSocialIcon("Instagram")         → React node (SVG icon)
 *   getPlatformEntry("Instagram")      → { Icon, frameClass, hoverClass }
 *   platformKey("X (Twitter)")         → "xtwitter"
 */
import { useId } from "react";

type IconProps = { size?: number; className?: string };

// ── Facebook ──────────────────────────────────────────────────────────────────
export const FacebookIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M15.9 7.5h-1.9c-.7 0-.8.3-.8.8v1.2h2.6l-.35 2.6h-2.25V19H10.6v-6.9H8.5V9.5h2.1V7.95C10.6 5.92 11.87 4.83 13.74 4.83c.9 0 1.92.14 2.16.17V7.5z"
      fill="white"
    />
  </svg>
);

// ── Instagram ─────────────────────────────────────────────────────────────────
export const InstagramIcon = ({ size = 24, className = "" }: IconProps) => {
  const uid = useId().replace(/:/g, "");
  const gid = `ig${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <radialGradient id={gid} cx="30%" cy="106%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill={`url(#${gid})`} />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="16.3" cy="7.7" r="0.85" fill="white" />
    </svg>
  );
};

// ── TikTok ────────────────────────────────────────────────────────────────────
export const TikTokIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#010101" />
    {/* Cyan shadow layer */}
    <path
      d="M13.2 7.3c.4 1.4 1.4 2.4 2.8 2.8v2.3c-.7 0-1.5-.2-2.2-.6v4.2a4 4 0 11-3.5-4v2.3a1.7 1.7 0 101.7 1.7V7.3h1.2z"
      fill="#69C9D0"
    />
    {/* Red shadow layer (offset) */}
    <path
      d="M12.8 6.9c.4 1.4 1.4 2.4 2.8 2.8v2.3c-.7 0-1.5-.2-2.2-.6v4.2a4 4 0 11-3.5-4v2.3a1.7 1.7 0 101.7 1.7V6.9h1.2z"
      fill="#EE1D52"
    />
    {/* White main layer */}
    <path
      d="M13 7.1c.4 1.4 1.4 2.4 2.8 2.8v2.3c-.7 0-1.5-.2-2.2-.6v4.2a4 4 0 11-3.5-4v2.3a1.7 1.7 0 101.7 1.7V7.1H13z"
      fill="white"
    />
  </svg>
);

// ── YouTube ───────────────────────────────────────────────────────────────────
export const YouTubeIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#FF0000" />
    <path
      d="M19.6 8.5a2.5 2.5 0 00-1.76-1.77C16.27 6.4 12 6.4 12 6.4s-4.27 0-5.84.33A2.5 2.5 0 004.4 8.5C4.07 10.07 4.07 12 4.07 12s0 1.93.33 3.5a2.5 2.5 0 001.76 1.77C7.73 17.6 12 17.6 12 17.6s4.27 0 5.84-.33a2.5 2.5 0 001.76-1.77C19.93 13.93 19.93 12 19.93 12s0-1.93-.33-3.5z"
      fill="white"
    />
    <polygon points="10.2,14.8 10.2,9.2 14.8,12" fill="#FF0000" />
  </svg>
);

// ── Telegram ──────────────────────────────────────────────────────────────────
export const TelegramIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="12" fill="#26A5E4" />
    <path
      d="M5.5 11.8L17 7l-1.6 9.5-3.6-2.8-1.7 1.6V13.3l5.2-4.8-6.8 3.8-2.1-.5z"
      fill="white"
    />
  </svg>
);

// ── WhatsApp ──────────────────────────────────────────────────────────────────
export const WhatsAppIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="12" fill="#25D366" />
    <path
      d="M17.47 14.38c-.3-.14-1.76-.87-2.03-.97-.27-.1-.47-.14-.67.14-.2.28-.77.97-.94 1.17-.17.2-.35.22-.65.07-1.83-.9-3.04-1.62-4.25-3.67-.32-.55.32-.51.91-1.7.1-.2.05-.37-.03-.52-.08-.14-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51H8.06c-.18 0-.47.07-.72.35-.25.28-1.4 1.37-.85 3.33.55 1.96 2 3.72 4.48 5.22.95.57 1.7.9 2.28 1.15.96.38 1.83.33 2.52.2.77-.14 2.36-.97 2.7-1.9.34-.95.34-1.76.24-1.93-.1-.16-.38-.25-.68-.4z"
      fill="white"
    />
    <path
      d="M12 4a8 8 0 00-6.9 12.03L4 20l4.1-1.07A8 8 0 1012 4z"
      stroke="white"
      strokeWidth="0.5"
      fill="none"
    />
  </svg>
);

// ── X (Twitter) ───────────────────────────────────────────────────────────────
export const XIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#000000" />
    <path
      d="M13.62 11.1L18.5 5.5H17.3l-4.17 4.84L9.7 5.5H5.5l5.18 7.54L5.5 18.8h1.2l4.53-5.27 3.62 5.27H19L13.62 11.1zm-1.6 1.86l-.52-.75L7.1 6.4h1.79l3.36 4.8.52.75 4.36 6.24h-1.79l-3.52-5.03z"
      fill="white"
    />
  </svg>
);

// ── LinkedIn ──────────────────────────────────────────────────────────────────
export const LinkedInIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.5 10H5.5v8.5h2V10zm-1-1.5a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" fill="white" />
    <path
      d="M17 10c-1.3 0-2.2.6-2.7 1.2V10h-2v8.5h2v-4.6c0-.9.7-1.6 1.7-1.6 1 0 1.5.7 1.5 1.7v4.5H19.5v-5c0-2.4-1.4-3.5-2.5-3.5z"
      fill="white"
    />
  </svg>
);

// ── Snapchat ──────────────────────────────────────────────────────────────────
export const SnapchatIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#FFFC00" />
    <path
      d="M12 4.5c-2.76 0-4.5 1.97-4.5 4.7v.88c-.46.1-.95.4-.95.92 0 .46.28.8.7 1 .1.43.5 1.24 1.46 2.05.18.15.1.38-.1.48-.6.28-1.5.58-1.97.88-.1.07-.1.18 0 .28.2.22.7.5 1.5.63.1.28.2.5.42.6.1.04.22.04.34.04.4 0 .8-.2 1.26-.38.5-.2 1.05-.32 1.79-.32.74 0 1.29.12 1.79.32.46.18.86.38 1.26.38.12 0 .24 0 .34-.05.22-.1.32-.32.42-.6.8-.12 1.3-.4 1.5-.62.1-.1.1-.2 0-.28-.47-.3-1.37-.6-1.97-.88-.2-.1-.28-.33-.1-.48.96-.81 1.36-1.62 1.46-2.05.42-.2.7-.54.7-1 0-.52-.49-.82-.95-.92V9.2c0-2.73-1.74-4.7-4.5-4.7z"
      fill="#1A1A1A"
    />
  </svg>
);

// ── Pinterest ─────────────────────────────────────────────────────────────────
export const PinterestIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="12" fill="#E60023" />
    <path
      d="M12 5C8.7 5 6 7.7 6 11c0 2.4 1.4 4.5 3.4 5.5-.05-.4-.1-1 0-1.5l.7-3s-.2-.4-.2-1c0-.95.55-1.66 1.24-1.66.58 0 .87.44.87 1.02 0 .62-.4 1.55-.6 2.4-.17.72.36 1.3 1.07 1.3 1.28 0 2.27-1.35 2.27-3.3 0-1.72-1.24-2.93-3-2.93-2.05 0-3.25 1.53-3.25 3.12 0 .62.24 1.28.54 1.64.06.07.07.13.05.2l-.2.8c-.03.12-.1.15-.22.09C7.6 13.93 7 12.76 7 11c0-2.76 2-5.3 5.78-5.3 3.03 0 5.39 2.16 5.39 5.04 0 3.01-1.9 5.43-4.53 5.43-.88 0-1.72-.46-2-.99l-.54 2.04c-.2.76-.73 1.7-1.09 2.28.82.25 1.68.38 2.57.38a7 7 0 000-14z"
      fill="white"
    />
  </svg>
);

// ── Threads ───────────────────────────────────────────────────────────────────
export const ThreadsIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#000000" />
    {/* Threads logo: stylised @ mark with open top */}
    <path
      d="M15.6 11.22a5.5 5.5 0 00-.34-.15c-.2-2.1-1.52-3.32-3.35-3.32h-.03c-1.1 0-2.07.47-2.65 1.28L10.28 10a2.1 2.1 0 011.57-.71h.03c.88 0 1.47.51 1.7 1.43a6.4 6.4 0 00-1.36-.15c-1.7 0-2.8.9-2.8 2.26 0 1.37 1.12 2.17 2.54 2.17 1.3 0 2.22-.57 2.8-1.7a5.9 5.9 0 00.44 1.44h1.3a7.3 7.3 0 01-.54-2.53c.04-.27.04-.55 0-.82zm-3.03 2.63c-.7 0-1.24-.33-1.24-.92 0-.67.63-1 1.56-1 .43 0 .83.05 1.2.14-.16 1.07-.83 1.78-1.52 1.78z"
      fill="white"
    />
    <path
      d="M12 5a7 7 0 100 14A7 7 0 0012 5zm0 12.6a5.6 5.6 0 110-11.2 5.6 5.6 0 010 11.2z"
      fill="white"
    />
  </svg>
);

// ── Discord ───────────────────────────────────────────────────────────────────
export const DiscordIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#5865F2" />
    <path
      d="M17.36 7.3a13.4 13.4 0 00-3.3-.97.05.05 0 00-.05.03c-.14.25-.3.58-.41.84a12.4 12.4 0 00-3.2 0 8.4 8.4 0 00-.41-.84.05.05 0 00-.05-.03 13.4 13.4 0 00-3.3.97.05.05 0 00-.02.02C4.82 10.1 4.2 12.84 4.49 15.55c0 .01.01.03.02.03a13.4 13.4 0 003.4 1.46.05.05 0 00.05-.02c.26-.36.5-.74.7-1.14a.05.05 0 00-.03-.07 8.8 8.8 0 01-1.07-.43.05.05 0 010-.08l.21-.17a.05.05 0 01.05-.01c2.26 1.04 4.7 1.04 6.94 0a.05.05 0 01.05.01l.21.17a.05.05 0 010 .08 8.9 8.9 0 01-1.07.43.05.05 0 00-.03.07c.2.4.44.78.7 1.14a.05.05 0 00.05.02 13.4 13.4 0 003.4-1.46.05.05 0 00.02-.03c.35-3.17-.59-5.9-2.5-8.23a.04.04 0 00-.02-.02zM9.52 13.87c-.69 0-1.26-.63-1.26-1.41s.56-1.41 1.26-1.41c.7 0 1.27.64 1.26 1.41 0 .78-.56 1.41-1.26 1.41zm4.97 0c-.7 0-1.26-.63-1.26-1.41s.56-1.41 1.26-1.41c.7 0 1.27.64 1.26 1.41 0 .78-.55 1.41-1.26 1.41z"
      fill="white"
    />
  </svg>
);

// ── Reddit ────────────────────────────────────────────────────────────────────
export const RedditIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="12" fill="#FF4500" />
    <path
      d="M19.5 12a1.5 1.5 0 00-2.53-1.08c-.95-.62-2.23-1-3.63-1.07l.67-2.97 2.05.46a1.04 1.04 0 102.04-.12 1.04 1.04 0 00-1.96.45l-2.27-.51a.22.22 0 00-.25.15l-.75 3.32c-1.44.05-2.75.45-3.72 1.08a1.5 1.5 0 101.63 2.42c.05.2.08.4.08.61 0 1.93 2.25 3.5 5.04 3.5s5.04-1.57 5.04-3.5c0-.21-.03-.42-.08-.61A1.5 1.5 0 0019.5 12zm-9.45 2c0-.58.47-1.04 1.04-1.04.58 0 1.04.46 1.04 1.04 0 .57-.46 1.04-1.04 1.04A1.04 1.04 0 0110.05 14zm5.77 2.76c-.71.72-2.07.77-2.82.77s-2.11-.05-2.82-.77a.25.25 0 01.35-.35c.48.48 1.5.65 2.47.65.97 0 2-.17 2.47-.65a.25.25 0 01.35.35zm-.18-1.72A1.04 1.04 0 0116.68 14c0-.58.46-1.04 1.04-1.04.57 0 1.04.46 1.04 1.04a1.04 1.04 0 01-1.04 1.04z"
      fill="white"
    />
  </svg>
);

// ── Spotify ───────────────────────────────────────────────────────────────────
export const SpotifyIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path
      d="M16.9 14.6c-.2 0-.35-.06-.48-.17-1.4-.89-3.16-1.35-5.12-1.35-.9 0-1.83.1-2.76.3-.18.04-.35.06-.5.06a.72.72 0 01-.72-.73c0-.43.28-.73.65-.81a14.2 14.2 0 013.33-.38c2.28 0 4.32.55 5.96 1.6.28.17.46.42.46.75 0 .4-.32.73-.72.73z"
      fill="white"
    />
    <path
      d="M18.1 11.8c-.25 0-.43-.08-.6-.2-1.7-1.05-4.24-1.67-6.65-1.67-1.08 0-2.13.14-3.05.38a.95.95 0 01-.32.05.88.88 0 01-.87-.9c0-.5.3-.87.72-.98a15.7 15.7 0 013.52-.4c2.76 0 5.56.66 7.6 1.9.34.2.56.5.56.93 0 .5-.4.9-.9.9z"
      fill="white"
    />
    <path
      d="M7.8 16.7a.62.62 0 01-.62-.62c0-.27.17-.5.44-.6 1.07-.3 2.1-.44 3.1-.44 1.63 0 3.1.38 4.3 1.04.22.12.37.35.37.62 0 .34-.28.62-.62.62-.14 0-.28-.04-.4-.12-1.03-.58-2.29-.9-3.65-.9-.92 0-1.87.14-2.87.42-.08.02-.15.03-.2.03z"
      fill="white"
    />
  </svg>
);

// ── Email ─────────────────────────────────────────────────────────────────────
export const EmailIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#6B7280" />
    <rect x="4.5" y="7.5" width="15" height="10" rx="1.5" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M4.5 9.5l7.5 5.5 7.5-5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ── Website ───────────────────────────────────────────────────────────────────
export const WebsiteIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="6" fill="#6B7280" />
    <circle cx="12" cy="12" r="6.5" stroke="white" strokeWidth="1.4" fill="none" />
    <path d="M12 5.5C10.5 7.2 9.7 9.5 9.7 12s.8 4.8 2.3 6.5M12 5.5c1.5 1.7 2.3 4 2.3 6.5s-.8 4.8-2.3 6.5" stroke="white" strokeWidth="1.3" fill="none" />
    <line x1="5.5" y1="12" x2="18.5" y2="12" stroke="white" strokeWidth="1.3" />
    <line x1="6.3" y1="9" x2="17.7" y2="9" stroke="white" strokeWidth="1" />
    <line x1="6.3" y1="15" x2="17.7" y2="15" stroke="white" strokeWidth="1" />
  </svg>
);

// ── Platform registry ─────────────────────────────────────────────────────────

export type PlatformEntry = {
  Icon: React.ComponentType<IconProps>;
  frameClass: string;
  hoverClass: string;
};

const PLATFORM_MAP: Record<string, PlatformEntry> = {
  facebook: {
    Icon: FacebookIcon,
    frameClass: "bg-[#1877F2]/10 border-[#1877F2]/40 shadow-[0_0_16px_rgba(24,119,242,0.2)]",
    hoverClass: "hover:bg-[#1877F2]/25 hover:border-[#1877F2]/70 hover:shadow-[0_0_24px_rgba(24,119,242,0.45)]",
  },
  instagram: {
    Icon: InstagramIcon,
    frameClass: "bg-[#dc2743]/10 border-[#cc2366]/45 shadow-[0_0_16px_rgba(220,39,67,0.25)]",
    hoverClass: "hover:bg-[#dc2743]/20 hover:border-[#cc2366]/80 hover:shadow-[0_0_24px_rgba(220,39,67,0.5)]",
  },
  tiktok: {
    Icon: TikTokIcon,
    frameClass: "bg-white/20 border-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)]",
    hoverClass: "hover:bg-white/35 hover:border-white/65",
  },
  youtube: {
    Icon: YouTubeIcon,
    frameClass: "bg-[#FF0000]/10 border-[#FF0000]/40 shadow-[0_0_16px_rgba(255,0,0,0.2)]",
    hoverClass: "hover:bg-[#FF0000]/20 hover:border-[#FF0000]/70 hover:shadow-[0_0_24px_rgba(255,0,0,0.4)]",
  },
  telegram: {
    Icon: TelegramIcon,
    frameClass: "bg-[#29B6F6]/10 border-[#29B6F6]/45 shadow-[0_0_16px_rgba(41,182,246,0.25)]",
    hoverClass: "hover:bg-[#29B6F6]/20 hover:border-[#29B6F6]/80 hover:shadow-[0_0_24px_rgba(41,182,246,0.5)]",
  },
  whatsapp: {
    Icon: WhatsAppIcon,
    frameClass: "bg-[#25D366]/10 border-[#25D366]/45 shadow-[0_0_16px_rgba(37,211,102,0.25)]",
    hoverClass: "hover:bg-[#25D366]/20 hover:border-[#25D366]/80 hover:shadow-[0_0_24px_rgba(37,211,102,0.5)]",
  },
  xtwitter: {
    Icon: XIcon,
    frameClass: "bg-white/20 border-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)]",
    hoverClass: "hover:bg-white/35 hover:border-white/65",
  },
  linkedin: {
    Icon: LinkedInIcon,
    frameClass: "bg-[#0A66C2]/10 border-[#0A66C2]/40 shadow-[0_0_16px_rgba(10,102,194,0.2)]",
    hoverClass: "hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/70 hover:shadow-[0_0_24px_rgba(10,102,194,0.4)]",
  },
  snapchat: {
    Icon: SnapchatIcon,
    frameClass: "bg-[#FFFC00]/20 border-[#FFFC00]/60 shadow-[0_0_16px_rgba(255,252,0,0.2)]",
    hoverClass: "hover:bg-[#FFFC00]/35 hover:border-[#FFFC00]/85",
  },
  pinterest: {
    Icon: PinterestIcon,
    frameClass: "bg-[#E60023]/10 border-[#E60023]/40 shadow-[0_0_16px_rgba(230,0,35,0.2)]",
    hoverClass: "hover:bg-[#E60023]/20 hover:border-[#E60023]/70 hover:shadow-[0_0_24px_rgba(230,0,35,0.4)]",
  },
  threads: {
    Icon: ThreadsIcon,
    frameClass: "bg-white/20 border-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)]",
    hoverClass: "hover:bg-white/35 hover:border-white/65",
  },
  discord: {
    Icon: DiscordIcon,
    frameClass: "bg-[#5865F2]/10 border-[#5865F2]/40 shadow-[0_0_16px_rgba(88,101,242,0.2)]",
    hoverClass: "hover:bg-[#5865F2]/20 hover:border-[#5865F2]/70 hover:shadow-[0_0_24px_rgba(88,101,242,0.4)]",
  },
  reddit: {
    Icon: RedditIcon,
    frameClass: "bg-[#FF4500]/10 border-[#FF4500]/40 shadow-[0_0_16px_rgba(255,69,0,0.2)]",
    hoverClass: "hover:bg-[#FF4500]/20 hover:border-[#FF4500]/70 hover:shadow-[0_0_24px_rgba(255,69,0,0.4)]",
  },
  spotify: {
    Icon: SpotifyIcon,
    frameClass: "bg-[#1DB954]/10 border-[#1DB954]/40 shadow-[0_0_16px_rgba(29,185,84,0.2)]",
    hoverClass: "hover:bg-[#1DB954]/20 hover:border-[#1DB954]/70 hover:shadow-[0_0_24px_rgba(29,185,84,0.4)]",
  },
  email: {
    Icon: EmailIcon,
    frameClass: "bg-white/10 border-white/25 shadow-[0_0_16px_rgba(255,255,255,0.1)]",
    hoverClass: "hover:bg-white/20 hover:border-white/50",
  },
  website: {
    Icon: WebsiteIcon,
    frameClass: "bg-white/10 border-white/25 shadow-[0_0_16px_rgba(255,255,255,0.1)]",
    hoverClass: "hover:bg-white/20 hover:border-white/50",
  },
};

const DEFAULT_ENTRY: PlatformEntry = {
  Icon: WebsiteIcon,
  frameClass: "bg-white/10 border-white/20 shadow-[0_0_16px_rgba(255,255,255,0.1)]",
  hoverClass: "hover:bg-white/20 hover:border-white/40",
};

/** Normalise any platform name/variant into a PLATFORM_MAP key. */
export function platformKey(platform: string): string {
  const s = platform.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[\s/_-]/g, "").replace(/[^a-z]/g, "");
  if (s === "twitter" || s === "xtwitter" || s === "x") return "xtwitter";
  return s;
}

/** Returns the full registry entry (icon component + frame styles) for a platform. */
export function getPlatformEntry(platform: string): PlatformEntry {
  return PLATFORM_MAP[platformKey(platform)] ?? DEFAULT_ENTRY;
}

/**
 * Returns a React node for the platform icon.
 * Priority: known SVG brand icon → customIconUrl image → emoji span → generic globe.
 */
export function getSocialIcon(
  platform: string,
  opts?: { customIconUrl?: string; iconEmoji?: string; size?: number; className?: string }
): React.ReactNode {
  const { customIconUrl, iconEmoji, size = 20, className = "" } = opts ?? {};
  const key = platformKey(platform);
  const entry = PLATFORM_MAP[key];

  if (entry) return <entry.Icon size={size} className={className} />;
  if (customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt={platform}
        width={size}
        height={size}
        className={`rounded object-contain ${className}`}
      />
    );
  }
  if (iconEmoji) return <span className="text-lg leading-none">{iconEmoji}</span>;
  return <WebsiteIcon size={size} className={className} />;
}

/** All preset platform names (the admin's dropdown list). */
export const PRESET_PLATFORM_NAMES = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "WhatsApp",
  "Telegram",
  "X (Twitter)",
  "LinkedIn",
  "Snapchat",
  "Pinterest",
  "Threads",
  "Discord",
  "Reddit",
  "Spotify",
  "Email",
  "Website",
] as const;
