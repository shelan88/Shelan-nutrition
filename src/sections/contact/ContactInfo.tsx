/**
 * ContactInfo — Right-side contact info panel.
 * WhatsApp button, email, location, map iframe, business hours.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import { Mail, MapPin, Clock } from "lucide-react";
import type { CMSContactData } from "@/types/cms.types";

// WhatsApp SVG (native brand color)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface Props {
  info: CMSContactData["info"];
  strings: {
    whatsappLabel?: string;
    emailLabel2: string;
    locationLabel: string;
    hoursLabel: string;
    closedLabel: string;
  };
}

export default function ContactInfo({ info, strings }: Props) {
  const infoItems = [
    {
      icon: Mail,
      label: strings.emailLabel2,
      content: <a href={`mailto:${info.email}`} className="text-primary-pink hover:text-deep-purple transition-colors break-all">{info.email}</a>,
    },
    {
      icon: MapPin,
      label: strings.locationLabel,
      content: (
        <div>
          <p className="font-medium text-heading">{info.locationName}</p>
          <p className="text-sm opacity-75 mt-0.5">{info.locationDescription}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* WhatsApp CTA */}
      <motion.a
        href={`https://wa.me/${info.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/18 hover:border-[#25D366]/50 hover:shadow-lg hover:shadow-[rgba(37,211,102,0.2)] transition-all duration-300 group"
      >
        <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
          <WhatsAppIcon />
        </div>
        <div>
          <p className="font-semibold text-heading">{info.whatsappLabel}</p>
          <p className="text-xs text-deep-purple/50 mt-0.5">+{info.whatsappNumber}</p>
        </div>
      </motion.a>

      {/* Info items */}
      <div className="bg-white rounded-2xl border border-soft-purple/12 p-6 shadow-md shadow-deep-purple/8 space-y-5">
        {infoItems.map(({ icon: Icon, label, content }) => (
          <div key={label} className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-lg bg-primary-pink/10 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-primary-pink" />
            </div>
            <div>
              <p className="text-xs font-semibold text-deep-purple/45 uppercase tracking-wide mb-1">{label}</p>
              {content}
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-soft-purple/12 shadow-md shadow-deep-purple/8 bg-light-pink/20 flex-1 min-h-44">
        <iframe
          src={info.mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: "180px" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location map"
          className="grayscale hover:grayscale-0 transition-all duration-500"
        />
      </div>

      {/* Business hours */}
      <div className="bg-white rounded-2xl border border-soft-purple/12 p-6 shadow-md shadow-deep-purple/8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-lavender-purple/12 flex items-center justify-center">
            <Clock size={14} className="text-lavender-purple" />
          </div>
          <p className="text-sm font-semibold text-heading">{strings.hoursLabel}</p>
        </div>
        <ul className="space-y-2">
          {info.hours.map((h) => (
            <li key={h.day} className="flex items-center justify-between text-sm">
              <span className="text-deep-purple/60">{h.day}</span>
              <span className={`font-medium ${h.closed ? "text-deep-purple/35 italic" : "text-heading"}`}>
                {h.closed ? strings.closedLabel : h.hours}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
