/**
 * EmptyState — premium "Coming Soon" placeholder for unbuilt admin pages.
 *
 * Renders a unique SVG illustration per section, a "Coming Soon" badge,
 * the page title, and description. Reusable for any section that hasn't
 * been implemented yet.
 *
 * illustrationVariant → selects the abstract SVG composition for that section.
 */
import { motion } from "framer-motion";

// ─── Illustration compositions ─────────────────────────────────────────────────

const illustrations: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="20" width="70" height="50" rx="8" fill="#f35e98" fillOpacity=".12" stroke="#f35e98" strokeOpacity=".3" strokeWidth="1.5"/>
      <rect x="110" y="20" width="70" height="50" rx="8" fill="#b889f5" fillOpacity=".12" stroke="#b889f5" strokeOpacity=".3" strokeWidth="1.5"/>
      <rect x="20" y="85" width="160" height="55" rx="8" fill="#8d5fd3" fillOpacity=".07" stroke="#8d5fd3" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="32" y="97" width="24" height="32" rx="4" fill="#f35e98" fillOpacity=".35"/>
      <rect x="64" y="107" width="24" height="22" rx="4" fill="#b889f5" fillOpacity=".35"/>
      <rect x="96" y="102" width="24" height="27" rx="4" fill="#8d5fd3" fillOpacity=".35"/>
      <rect x="128" y="112" width="24" height="17" rx="4" fill="#f88eb8" fillOpacity=".35"/>
      <circle cx="55" cy="45" r="12" fill="#f35e98" fillOpacity=".2"/>
      <path d="M50 45l4 4 8-8" stroke="#f35e98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="145" cy="45" r="12" fill="#b889f5" fillOpacity=".2"/>
      <path d="M140 44h10M145 39v10" stroke="#b889f5" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  builder: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="25" y="20" width="150" height="100" rx="10" fill="#f7f5fb" stroke="#8d5fd3" strokeOpacity=".25" strokeWidth="1.5"/>
      <rect x="25" y="20" width="150" height="22" rx="10" fill="#8d5fd3" fillOpacity=".12"/>
      <circle cx="40" cy="31" r="4" fill="#f35e98" fillOpacity=".4"/>
      <circle cx="54" cy="31" r="4" fill="#b889f5" fillOpacity=".4"/>
      <circle cx="68" cy="31" r="4" fill="#8d5fd3" fillOpacity=".4"/>
      <rect x="37" y="52" width="126" height="12" rx="4" fill="#f35e98" fillOpacity=".18"/>
      <rect x="37" y="72" width="90" height="8" rx="3" fill="#b889f5" fillOpacity=".18"/>
      <rect x="37" y="87" width="110" height="8" rx="3" fill="#8d5fd3" fillOpacity=".12"/>
      <rect x="37" y="102" width="60" height="8" rx="3" fill="#f88eb8" fillOpacity=".25"/>
      <rect x="55" y="128" width="90" height="24" rx="8" fill="none" stroke="#f35e98" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="4 2"/>
      <path d="M96 136l4 4 8-8" stroke="#f35e98" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  services: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="25" y="25" width="65" height="75" rx="10" fill="#f35e98" fillOpacity=".07" stroke="#f35e98" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="100" y="25" width="75" height="35" rx="10" fill="#b889f5" fillOpacity=".08" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="100" y="68" width="75" height="32" rx="10" fill="#8d5fd3" fillOpacity=".07" stroke="#8d5fd3" strokeOpacity=".18" strokeWidth="1.5"/>
      <circle cx="57" cy="55" r="16" fill="#f35e98" fillOpacity=".15"/>
      <path d="M52 55l4 4 8-8" stroke="#f35e98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="36" y="80" width="42" height="6" rx="3" fill="#f35e98" fillOpacity=".25"/>
      <rect x="112" y="38" width="50" height="6" rx="3" fill="#b889f5" fillOpacity=".35"/>
      <rect x="112" y="50" width="35" height="5" rx="2.5" fill="#b889f5" fillOpacity=".2"/>
      <rect x="112" y="80" width="50" height="6" rx="3" fill="#8d5fd3" fillOpacity=".3"/>
      <rect x="112" y="92" width="40" height="5" rx="2.5" fill="#8d5fd3" fillOpacity=".18"/>
      <rect x="25" y="112" width="150" height="28" rx="8" fill="none" stroke="#f35e98" strokeOpacity=".2" strokeWidth="1.5" strokeDasharray="4 2"/>
    </svg>
  ),
  assessment: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="55" y="15" width="90" height="120" rx="10" fill="#f7f5fb" stroke="#8d5fd3" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="68" y="32" width="64" height="8" rx="4" fill="#f35e98" fillOpacity=".3"/>
      <circle cx="71" cy="52" r="4" fill="none" stroke="#b889f5" strokeWidth="1.5"/>
      <path d="M78 52h38" stroke="#b889f5" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="71" cy="66" r="4" fill="#f35e98" fillOpacity=".4"/>
      <path d="M68.5 66l2 2 4-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M78 66h38" stroke="#8d5fd3" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="71" cy="80" r="4" fill="none" stroke="#b889f5" strokeWidth="1.5"/>
      <path d="M78 80h25" stroke="#b889f5" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="71" cy="94" r="4" fill="#f35e98" fillOpacity=".4"/>
      <path d="M68.5 94l2 2 4-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M78 94h32" stroke="#8d5fd3" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="68" y="110" width="64" height="14" rx="7" fill="#f35e98" fillOpacity=".15" stroke="#f35e98" strokeOpacity=".3" strokeWidth="1"/>
    </svg>
  ),
  blog: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="20" width="160" height="120" rx="10" fill="#fdf8ff" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="35" y="35" width="90" height="12" rx="6" fill="#f35e98" fillOpacity=".3"/>
      <rect x="35" y="56" width="130" height="6" rx="3" fill="#8d5fd3" fillOpacity=".15"/>
      <rect x="35" y="68" width="120" height="6" rx="3" fill="#8d5fd3" fillOpacity=".12"/>
      <rect x="35" y="80" width="100" height="6" rx="3" fill="#8d5fd3" fillOpacity=".10"/>
      <rect x="35" y="98" width="60" height="6" rx="3" fill="#b889f5" fillOpacity=".2"/>
      <rect x="35" y="112" width="80" height="6" rx="3" fill="#b889f5" fillOpacity=".15"/>
      <circle cx="155" cy="38" r="18" fill="#f35e98" fillOpacity=".1" stroke="#f35e98" strokeOpacity=".25" strokeWidth="1.5"/>
      <path d="M150 38l3 3 6-6" stroke="#f35e98" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  testimonials: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="15" y="20" width="80" height="65" rx="10" fill="#fdf8ff" stroke="#f35e98" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="105" y="20" width="80" height="65" rx="10" fill="#fdf8ff" stroke="#b889f5" strokeOpacity=".2" strokeWidth=".5"/>
      <rect x="15" y="95" width="80" height="50" rx="10" fill="#fdf8ff" stroke="#8d5fd3" strokeOpacity=".15" strokeWidth="1.5" strokeDasharray="3 2"/>
      <path d="M28 40c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#f35e98" fillOpacity=".3"/>
      <path d="M40 40c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#f35e98" fillOpacity=".3"/>
      <rect x="28" y="52" width="55" height="5" rx="2.5" fill="#f35e98" fillOpacity=".2"/>
      <rect x="28" y="62" width="42" height="5" rx="2.5" fill="#f35e98" fillOpacity=".15"/>
      <path d="M118 36c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#b889f5" fillOpacity=".3"/>
      <path d="M130 36c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#b889f5" fillOpacity=".3"/>
      <rect x="118" y="50" width="55" height="5" rx="2.5" fill="#b889f5" fillOpacity=".2"/>
      <rect x="118" y="60" width="42" height="5" rx="2.5" fill="#b889f5" fillOpacity=".15"/>
      <path d="M55 110l4-4 4 4" stroke="#8d5fd3" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  media: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="20" width="50" height="50" rx="8" fill="#f35e98" fillOpacity=".12" stroke="#f35e98" strokeOpacity=".25" strokeWidth="1.5"/>
      <rect x="80" y="20" width="50" height="50" rx="8" fill="#b889f5" fillOpacity=".1" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="140" y="20" width="40" height="50" rx="8" fill="#8d5fd3" fillOpacity=".08" stroke="#8d5fd3" strokeOpacity=".18" strokeWidth="1.5"/>
      <rect x="20" y="80" width="40" height="60" rx="8" fill="#f88eb8" fillOpacity=".1" stroke="#f88eb8" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="70" y="80" width="60" height="60" rx="8" fill="#f35e98" fillOpacity=".08" stroke="#f35e98" strokeOpacity=".18" strokeWidth="1.5"/>
      <rect x="140" y="80" width="40" height="60" rx="8" fill="#b889f5" fillOpacity=".08" stroke="#b889f5" strokeOpacity=".18" strokeWidth="1.5"/>
      <path d="M35 53l8-10 8 8 5-5 9 12H35z" fill="#f35e98" fillOpacity=".25"/>
      <circle cx="105" cy="40" r="8" fill="#b889f5" fillOpacity=".25"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="30" y="25" width="140" height="115" rx="12" fill="#fdf8ff" stroke="#8d5fd3" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="30" y="25" width="140" height="38" rx="12" fill="#f35e98" fillOpacity=".1"/>
      <rect x="30" y="55" width="140" height="8" fill="#f35e98" fillOpacity=".06"/>
      <path d="M65 20v16M135 20v16" stroke="#8d5fd3" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round"/>
      <text x="80" y="46" fill="#f35e98" fillOpacity=".7" fontSize="11" fontWeight="600">July 2026</text>
      {[0,1,2,3,4,5,6].map((i) => (
        <text key={i} x={44 + i * 18} y="74" fill="#8d5fd3" fillOpacity=".3" fontSize="8" fontWeight="600">{["S","M","T","W","T","F","S"][i]}</text>
      ))}
      <circle cx="63" cy="100" r="9" fill="#f35e98" fillOpacity=".2"/>
      <text x="59" y="104" fill="#f35e98" fontSize="9" fontWeight="700">7</text>
      {[81,99,117,135,153].map((x, i) => (
        <text key={x} x={x-4} y="104" fill="#8d5fd3" fillOpacity=".4" fontSize="9">{i+8}</text>
      ))}
      <circle cx="117" cy="122" r="9" fill="#b889f5" fillOpacity=".2"/>
      <text x="113" y="126" fill="#b889f5" fontSize="9" fontWeight="700">15</text>
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <circle cx="70" cy="55" r="25" fill="#f35e98" fillOpacity=".12" stroke="#f35e98" strokeOpacity=".25" strokeWidth="1.5"/>
      <circle cx="130" cy="55" r="25" fill="#b889f5" fillOpacity=".1" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <circle cx="70" cy="48" r="10" fill="#f35e98" fillOpacity=".25"/>
      <path d="M50 70c0-8.8 7.2-14 20-14s20 5.2 20 14" stroke="#f35e98" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="130" cy="48" r="10" fill="#b889f5" fillOpacity=".25"/>
      <path d="M110 70c0-8.8 7.2-14 20-14s20 5.2 20 14" stroke="#b889f5" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <rect x="25" y="95" width="150" height="18" rx="9" fill="#f35e98" fillOpacity=".07" stroke="#f35e98" strokeOpacity=".15" strokeWidth="1"/>
      <rect x="25" y="120" width="150" height="18" rx="9" fill="#b889f5" fillOpacity=".06" stroke="#b889f5" strokeOpacity=".12" strokeWidth="1"/>
      <rect x="33" y="99" width="20" height="10" rx="5" fill="#f35e98" fillOpacity=".2"/>
      <rect x="33" y="124" width="20" height="10" rx="5" fill="#b889f5" fillOpacity=".2"/>
      <rect x="60" y="101" width="80" height="6" rx="3" fill="#f35e98" fillOpacity=".15"/>
      <rect x="60" y="126" width="60" height="6" rx="3" fill="#b889f5" fillOpacity=".15"/>
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="35" width="160" height="100" rx="14" fill="#f7f5fb" stroke="#8d5fd3" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="20" y="35" width="160" height="35" rx="14" fill="url(#pg)" fillOpacity=".9"/>
      <defs>
        <linearGradient id="pg" x1="20" y1="35" x2="180" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6a35b5"/>
          <stop offset="1" stopColor="#f35e98"/>
        </linearGradient>
      </defs>
      <circle cx="158" cy="52" r="14" fill="#f35e98" fillOpacity=".25"/>
      <circle cx="148" cy="52" r="14" fill="#b889f5" fillOpacity=".3"/>
      <rect x="35" y="85" width="50" height="8" rx="4" fill="#f35e98" fillOpacity=".2"/>
      <rect x="35" y="100" width="40" height="8" rx="4" fill="#8d5fd3" fillOpacity=".15"/>
      <rect x="35" y="115" width="55" height="8" rx="4" fill="#b889f5" fillOpacity=".15"/>
      <rect x="130" y="85" width="42" height="30" rx="8" fill="#f35e98" fillOpacity=".1" stroke="#f35e98" strokeOpacity=".2" strokeWidth="1"/>
      <path d="M142 100h18M151 91v18" stroke="#f35e98" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="20" width="120" height="70" rx="14" fill="#fdf8ff" stroke="#f35e98" strokeOpacity=".25" strokeWidth="1.5"/>
      <path d="M20 78l20 20v-20" fill="#fdf8ff" stroke="#f35e98" strokeOpacity=".25" strokeWidth="1.5"/>
      <rect x="32" y="38" width="90" height="8" rx="4" fill="#f35e98" fillOpacity=".2"/>
      <rect x="32" y="52" width="70" height="8" rx="4" fill="#f35e98" fillOpacity=".15"/>
      <rect x="60" y="68" width="120" height="65" rx="14" fill="#fdf8ff" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <path d="M180 120l-20 20v-20" fill="#fdf8ff" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <rect x="72" y="85" width="90" height="8" rx="4" fill="#b889f5" fillOpacity=".2"/>
      <rect x="72" y="99" width="65" height="8" rx="4" fill="#b889f5" fillOpacity=".15"/>
      <circle cx="165" cy="30" r="10" fill="#f35e98"/>
      <text x="161" y="34" fill="white" fontSize="10" fontWeight="700">3</text>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="110" width="24" height="40" rx="6" fill="#f35e98" fillOpacity=".35"/>
      <rect x="52" y="80" width="24" height="70" rx="6" fill="#b889f5" fillOpacity=".35"/>
      <rect x="84" y="95" width="24" height="55" rx="6" fill="#8d5fd3" fillOpacity=".28"/>
      <rect x="116" y="55" width="24" height="95" rx="6" fill="#f35e98" fillOpacity=".45"/>
      <rect x="148" y="70" width="24" height="80" rx="6" fill="#b889f5" fillOpacity=".4"/>
      <path d="M20 105 52 75 84 88 116 48 148 62" stroke="#f35e98" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {[20, 52, 84, 116, 148].map((x, i) => {
        const ys = [105, 75, 88, 48, 62];
        return <circle key={x} cx={x + 12} cy={ys[i]} r="4" fill="#f35e98"/>;
      })}
      <rect x="20" y="18" width="60" height="20" rx="6" fill="#f35e98" fillOpacity=".1" stroke="#f35e98" strokeOpacity=".2" strokeWidth="1"/>
      <rect x="90" y="18" width="90" height="20" rx="6" fill="#b889f5" fillOpacity=".08" stroke="#b889f5" strokeOpacity=".18" strokeWidth="1"/>
    </svg>
  ),
  seo: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <circle cx="95" cy="75" r="50" fill="none" stroke="#8d5fd3" strokeOpacity=".15" strokeWidth="1.5"/>
      <circle cx="95" cy="75" r="35" fill="none" stroke="#b889f5" strokeOpacity=".2" strokeWidth="1.5"/>
      <circle cx="95" cy="75" r="20" fill="#f35e98" fillOpacity=".1" stroke="#f35e98" strokeOpacity=".3" strokeWidth="1.5"/>
      <circle cx="95" cy="75" r="6" fill="#f35e98" fillOpacity=".4"/>
      <path d="M135 115l20 25" stroke="#f35e98" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="120" cy="100" r="16" fill="none" stroke="#f35e98" strokeOpacity=".35" strokeWidth="2"/>
      <path d="M82 75h26M95 62v26" stroke="#8d5fd3" strokeOpacity=".25" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <circle cx="100" cy="80" r="35" fill="none" stroke="#8d5fd3" strokeOpacity=".2" strokeWidth="1.5" strokeDasharray="6 3"/>
      <circle cx="100" cy="80" r="18" fill="#f35e98" fillOpacity=".1" stroke="#f35e98" strokeOpacity=".3" strokeWidth="1.5"/>
      <circle cx="100" cy="80" r="7" fill="#f35e98" fillOpacity=".3"/>
      {[0,60,120,180,240,300].map((deg) => {
        const r = 36;
        const x = 100 + r * Math.cos((deg * Math.PI) / 180);
        const y = 80 + r * Math.sin((deg * Math.PI) / 180);
        return <circle key={deg} cx={x} cy={y} r="5" fill="#b889f5" fillOpacity=".3"/>;
      })}
      <rect x="30" y="25" width="55" height="10" rx="5" fill="#f35e98" fillOpacity=".15"/>
      <rect x="30" y="42" width="40" height="10" rx="5" fill="#b889f5" fillOpacity=".12"/>
      <rect x="115" y="130" width="55" height="10" rx="5" fill="#8d5fd3" fillOpacity=".15"/>
      <rect x="130" y="145" width="40" height="10" rx="5" fill="#f35e98" fillOpacity=".1"/>
    </svg>
  ),
};

// Fallback for unknown variants
const defaultIllustration = illustrations.dashboard;

// ─── Component ─────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description: string;
  illustrationVariant?: string;
  /** Show or hide the Coming Soon badge */
  showBadge?: boolean;
}

export default function EmptyState({
  title,
  description,
  illustrationVariant = "dashboard",
  showBadge = true,
}: EmptyStateProps) {
  const illustration = illustrations[illustrationVariant] ?? defaultIllustration;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      {/* Illustration */}
      <div className="relative mb-8 w-52 h-40 drop-shadow-sm">
        {illustration}
      </div>

      {/* Coming Soon badge */}
      {showBadge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-pink/10 text-primary-pink text-[11px] font-semibold tracking-wide uppercase mb-4 border border-primary-pink/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-pink animate-pulse" />
          Coming Soon
        </span>
      )}

      {/* Title */}
      <h2 className="text-xl font-semibold text-[var(--admin-text)] mb-2 !font-sans">
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm text-[var(--admin-text-muted)] leading-relaxed max-w-sm">
        {description}
      </p>
    </motion.div>
  );
}
