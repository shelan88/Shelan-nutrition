/**
 * UploadProgressBar — unified progress bar for all upload surfaces.
 *
 * Props:
 *   progress  number 0-100 → deterministic fill bar
 *   progress  null         → indeterminate animated pulse
 *   className              → wrapper override (height, rounding, etc.)
 */

interface UploadProgressBarProps {
  progress: number | null;
  className?: string;
}

export default function UploadProgressBar({ progress, className }: UploadProgressBarProps) {
  const wrapper = className ?? "h-0.5 rounded-full bg-black/10";

  if (progress === null) {
    // Indeterminate pulse
    return (
      <div className={wrapper}>
        <div className="h-full w-full bg-gradient-to-r from-primary-pink to-lavender-purple animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className={wrapper} style={{ overflow: "hidden" }}>
      <div
        className="h-full bg-gradient-to-r from-primary-pink to-lavender-purple rounded-full transition-[width] duration-150 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
