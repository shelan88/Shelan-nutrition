import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { nav } from "@/content/content";

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const curtainVariants = {
  hidden: { y: "-100%", opacity: 0.6 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeInOut" as const,
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
  exit: {
    y: "-100%",
    opacity: 0.8,
    transition: { duration: 0.4, ease: "easeInOut" as const },
  },
};

const linkVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: { opacity: 0, y: 12 },
};

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const items = nav[lang];

  const handleNavClick = (id: string) => {
    // Close first, then let the exit animation finish before scrolling so
    // the collapsing overlay never shifts layout mid-scroll.
    setOpen(false);
    window.setTimeout(() => scrollToSection(id), 320);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-[1000] backdrop-blur-md bg-gradient-to-b from-deep-purple/95 to-soft-purple/90 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-24 sm:h-28">
        <a href="#top" className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="SHELAN Nutritionist Logo"
            className="h-[77px] sm:h-24 w-auto object-contain"
          />
        </a>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-white/15 text-ivory hover:bg-white/15 transition-colors"
            aria-label="Toggle language"
          >
            <Globe size={16} />
            {lang === "en" ? "العربية" : "English"}
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="relative w-11 h-11 flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition-colors"
          >
            <span className="relative w-5 h-4 flex flex-col justify-between">
              <motion.span
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="block h-[1.5px] w-full bg-ivory rounded-full origin-center"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="block h-[1.5px] w-full bg-ivory rounded-full"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="block h-[1.5px] w-full bg-ivory rounded-full origin-center"
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={curtainVariants}
            className="fixed inset-x-0 top-0 z-[999] w-full min-h-[60vh] sm:min-h-screen flex flex-col bg-[rgba(15,23,42,0.95)] backdrop-blur-[12px] shadow-2xl shadow-black/40"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-6 end-6 sm:top-10 sm:end-10 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-ivory hover:bg-white/10 hover:border-white/40 transition-colors"
            >
              <X size={26} />
            </button>

            <nav className="flex-1 flex flex-col items-center justify-center gap-10 sm:gap-12 text-center px-6 py-28">
              {items.map((item: (typeof items)[number]) => (
                <motion.button
                  key={item.id}
                  type="button"
                  variants={linkVariants}
                  onClick={() => handleNavClick(item.id)}
                  className="font-heading text-[1.5rem] sm:text-4xl lg:text-5xl font-bold text-ivory hover:text-light-pink transition-colors"
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
