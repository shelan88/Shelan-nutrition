import { useRef, type ReactNode, type ElementType, type ComponentPropsWithoutRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Wraps any interactive element (button/a) with a subtle "magnetic" hover
 * effect: the element gently follows the cursor within its own bounds and
 * settles back into place with a soft spring, plus a light scale-up. Used
 * for primary CTAs to give the cinematic, premium feel requested for the
 * redesign — kept subtle so it never breaks layout or reads as gimmicky.
 */
export default function MagneticButton<T extends ElementType = "button">({
  as,
  className,
  children,
  strength = 0.35,
  ...props
}: {
  as?: T;
  className?: string;
  children: ReactNode;
  strength?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">) {
  // Loosely typed on purpose: this component is polymorphic over `as`
  // (button/a/etc.) and framer-motion's per-element ref types don't unify
  // cleanly across that union, so we intentionally widen here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Component = motion[(as ?? "button") as "button"];

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
