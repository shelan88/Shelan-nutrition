import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { nav, siteMeta } from "@/content/content";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const items = nav[lang];
  const meta = siteMeta[lang];

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/80 border-b border-lavender-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-20">
        <a
          href="#top"
          className="font-heading text-xl font-bold tracking-tight text-lavender-700"
        >
          {meta.name}
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {items.map((item: (typeof items)[number]) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-lavender-200 text-lavender-700 hover:bg-lavender-50 transition-colors"
            aria-label="Toggle language"
          >
            <Globe size={16} />
            {lang === "en" ? "العربية" : "English"}
          </button>
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-lavender-100"
          >
            <div className="flex flex-col px-6 py-4 gap-4">
              {items.map((item: (typeof items)[number]) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollTo(item.id);
                    setOpen(false);
                  }}
                  className="text-start text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
