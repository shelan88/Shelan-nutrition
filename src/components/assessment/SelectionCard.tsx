/**
 * SelectionCard — beautiful interactive card for selection_cards question type.
 * Supports both single-select (radio) and multi-select (checkbox) behaviour.
 * Reusable for any assessment or preference-selection flow.
 */
import { Check, Scale, Heart, Leaf, Activity, Shield, Sparkles, Star, Plus } from "lucide-react";
import type { CMSAssessmentOption } from "@/types/cms.types";

// Icon resolver — add new icons here as the option set grows
const ICON_MAP: Record<string, React.ElementType> = {
  Scale,
  Heart,
  Leaf,
  Activity,
  Shield,
  Sparkles,
  Star,
  Plus,
};

interface SelectionCardProps {
  option: CMSAssessmentOption;
  selected: boolean;
  onToggle: (value: string) => void;
  /** multi=true → checkbox semantics; multi=false → radio semantics */
  multi?: boolean;
}

export default function SelectionCard({ option, selected, onToggle, multi = true }: SelectionCardProps) {
  const Icon = option.iconName ? (ICON_MAP[option.iconName] ?? Star) : Star;

  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={() => onToggle(option.value)}
      className={`group w-full text-start p-4 rounded-2xl border-2 transition-all duration-200 flex gap-4 items-start ${
        selected
          ? "border-primary-pink bg-gradient-to-br from-primary-pink/8 to-lavender-purple/8 shadow-md shadow-deep-purple/12"
          : "border-soft-purple/15 bg-white hover:border-primary-pink/30 hover:bg-light-pink/15 hover:shadow-sm"
      }`}
    >
      {/* Icon */}
      <div
        className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
          selected
            ? "bg-gradient-to-br from-primary-pink to-lavender-purple shadow-md shadow-deep-purple/20"
            : "bg-light-pink/40 group-hover:bg-light-pink/70"
        }`}
      >
        <Icon
          size={18}
          className={selected ? "text-white" : "text-deep-purple/50"}
          strokeWidth={2}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p
          className={`font-heading font-bold text-sm leading-snug mb-0.5 ${
            selected ? "text-primary-pink" : "text-heading"
          }`}
        >
          {option.label}
        </p>
        {option.description && (
          <p className="text-xs text-deep-purple/50 leading-relaxed">{option.description}</p>
        )}
      </div>

      {/* Check indicator */}
      <div
        className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          selected
            ? "border-primary-pink bg-primary-pink"
            : "border-soft-purple/30 group-hover:border-primary-pink/40"
        }`}
      >
        {selected && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}
