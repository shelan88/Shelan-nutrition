import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { nav } from "@/content/content";

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
  exit: { opacity: 0, transition: { duration: 0.25 } },
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
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-plum-950/75 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-24">
        <a href="#top" className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="SHELAN Nutritionist Logo"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </a>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-white/15 text-ivory hover:bg-white/10 transition-colors"
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
            variants={overlayVariants}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-plum-950/98 backdrop-blur-xl"
          >
            <nav className="flex flex-col items-center gap-7">
              {items.map((item: (typeof items)[number]) => (
                <motion.button
                  key={item.id}
                  type="button"
                  variants={linkVariants}
                  onClick={() => handleNavClick(item.id)}
                  className="font-heading text-3xl sm:text-4xl font-bold text-ivory hover:text-nude-300 transition-colors"
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
