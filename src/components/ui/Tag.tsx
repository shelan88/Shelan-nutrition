/**
 * Tag / Badge — Compact label chip. Used for blog categories, service types, etc.
 */
interface TagProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

export default function Tag({
  children,
  variant = "primary",
  size = "sm",
  className = "",
}: TagProps) {
  const variants = {
    primary: "bg-primary-pink/12 text-primary-pink border-primary-pink/20",
    secondary: "bg-lavender-purple/12 text-deep-purple border-lavender-purple/20",
    outline: "bg-transparent text-deep-purple border-soft-purple/30",
    ghost: "bg-white/10 text-white border-white/15",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-[0.7rem]",
    md: "px-3.5 py-1.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
