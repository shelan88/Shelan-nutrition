import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[1100] h-[3px] bg-transparent pointer-events-none">
      <motion.div
        className="h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #f35e98 0%, #b889f5 55%, #8d5fd3 100%)",
        }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  );
}
