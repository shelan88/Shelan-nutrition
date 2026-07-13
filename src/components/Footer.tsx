import { AtSign, Share2, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { footer, siteMeta } from "@/content/content";

export default function Footer() {
  const { lang } = useLanguage();
  const t = footer[lang];
  const meta = siteMeta[lang];

  return (
    <footer className="bg-lavender-700 text-lavender-50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid sm:grid-cols-3 gap-10 mb-12">
        <div>
          <div className="inline-flex bg-cream-50 rounded-2xl px-5 py-3 mb-4 shadow-md">
            <img
              src="/logo.png"
              alt="SHELAN Nutritionist Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-lavender-200">{t.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-4 text-lavender-100">
            {t.contactTitle}
          </p>
          <ul className="space-y-3 text-sm text-lavender-200">
            <li className="flex items-center gap-2">
              <Mail size={16} /> {t.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> {t.phone}
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> {t.location}
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-4 text-lavender-100">
            {t.socialTitle}
          </p>
          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-lavender-600 flex items-center justify-center hover:bg-peach-300 hover:text-rose-700 transition-colors"
            >
              <AtSign size={18} />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-lavender-600 flex items-center justify-center hover:bg-peach-300 hover:text-rose-700 transition-colors"
            >
              <Share2 size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 border-t border-lavender-600 text-xs text-lavender-300 text-center">
        © {new Date().getFullYear()} {meta.name}. {t.rights}
      </div>
    </footer>
  );
}
