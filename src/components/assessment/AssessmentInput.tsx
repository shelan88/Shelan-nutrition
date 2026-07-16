/**
 * AssessmentInput — universal input renderer for assessment questions.
 *
 * Switches on question.type to render the appropriate premium input UI.
 * Adding a new question type only requires a new case here — no other
 * component needs to change. This is the key to the dynamic architecture:
 * the wizard, page, and data layer never know about input implementation details.
 *
 * Supported types:
 *   text            → styled text / email / tel input
 *   number          → styled number input with optional unit badge
 *   select          → styled native <select>
 *   radio           → styled radio buttons (with optional description)
 *   checkbox        → styled checkboxes (multi-select)
 *   range           → custom range slider with live value display
 *   selection_cards → grid of SelectionCard components (multi by default)
 */
import SelectionCard from "./SelectionCard";
import type { CMSAssessmentQuestion } from "@/types/cms.types";

// ─── Shared style tokens ────────────────────────────────────────────────────────
const inputBase =
  "w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all";

// ─── Helper: coerce answer to string[] ────────────────────────────────────────
function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// ─── Helper: coerce answer to string ─────────────────────────────────────────
function toString(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

// ─── Sub-renderers ─────────────────────────────────────────────────────────────

function TextInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const isMultiline = !question.inputType && question.placeholder && question.placeholder.length > 60;

  if (isMultiline) {
    return (
      <textarea
        id={question.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        className={`${inputBase} resize-none leading-relaxed`}
      />
    );
  }

  return (
    <input
      id={question.id}
      type={question.inputType ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className={inputBase}
    />
  );
}

function NumberInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex items-center">
      <input
        id={question.id}
        type="number"
        value={value}
        min={question.rangeMin}
        max={question.rangeMax}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className={`${inputBase} ${question.unit ? "pe-16" : ""}`}
      />
      {question.unit && (
        <span className="absolute end-4 text-xs font-semibold text-deep-purple/40 pointer-events-none select-none">
          {question.unit}
        </span>
      )}
    </div>
  );
}

function SelectInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        id={question.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} appearance-none cursor-pointer pe-10`}
      >
        <option value="" disabled>
          {question.placeholder ?? "Select…"}
        </option>
        {(question.options ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Chevron icon */}
      <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-deep-purple/40"
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function RadioInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const hasDescriptions = (question.options ?? []).some((o) => o.description);

  if (hasDescriptions) {
    // Card-style radio for options with descriptions
    return (
      <div className="space-y-2.5" role="radiogroup">
        {(question.options ?? []).map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`group w-full text-start px-4 py-3.5 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
                selected
                  ? "border-primary-pink bg-gradient-to-br from-primary-pink/8 to-lavender-purple/8 shadow-sm shadow-deep-purple/10"
                  : "border-soft-purple/15 bg-white hover:border-primary-pink/25 hover:bg-light-pink/10"
              }`}
            >
              {/* Radio dot */}
              <div
                className={`shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? "border-primary-pink" : "border-soft-purple/30"
                }`}
              >
                {selected && (
                  <div className="w-2 h-2 rounded-full bg-primary-pink" />
                )}
              </div>
              <div>
                <p
                  className={`font-semibold text-sm leading-snug ${
                    selected ? "text-primary-pink" : "text-heading"
                  }`}
                >
                  {opt.label}
                </p>
                {opt.description && (
                  <p className="text-xs text-deep-purple/45 mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact inline chips for simple options
  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup">
      {(question.options ?? []).map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
              selected
                ? "border-primary-pink bg-gradient-to-r from-primary-pink to-lavender-purple text-white shadow-md shadow-deep-purple/18"
                : "border-soft-purple/20 bg-white text-heading hover:border-primary-pink/30 hover:bg-light-pink/15"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="space-y-2" role="group">
      {(question.options ?? []).map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => toggle(opt.value)}
            className={`group w-full text-start px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
              checked
                ? "border-primary-pink bg-gradient-to-br from-primary-pink/8 to-lavender-purple/8 shadow-sm shadow-deep-purple/10"
                : "border-soft-purple/15 bg-white hover:border-primary-pink/25 hover:bg-light-pink/10"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`shrink-0 mt-0.5 w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                checked
                  ? "border-primary-pink bg-gradient-to-br from-primary-pink to-lavender-purple"
                  : "border-soft-purple/30 group-hover:border-primary-pink/40"
              }`}
            >
              {checked && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path
                    d="M1 3.5L3.5 6L8 1"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm leading-snug ${checked ? "text-primary-pink" : "text-heading"}`}>
                {opt.label}
              </p>
              {opt.description && (
                <p className="text-xs text-deep-purple/45 mt-0.5 leading-relaxed">{opt.description}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RangeInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const min = question.rangeMin ?? 0;
  const max = question.rangeMax ?? 10;
  const step = question.rangeStep ?? 1;
  const current = value ? parseFloat(value) : min + (max - min) / 2;
  const pct = ((current - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      {/* Value badge */}
      <div className="flex items-center justify-center">
        <div className="px-5 py-2 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-heading font-bold text-xl shadow-md shadow-deep-purple/20">
          {value || Math.round(current)}
          {question.unit && (
            <span className="text-sm font-medium ms-1 opacity-80">{question.unit}</span>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="relative py-2">
        <input
          id={question.id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value || current}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 appearance-none rounded-full outline-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #f35e98 0%, #b889f5 ${pct}%, #e9d8f8 ${pct}%, #e9d8f8 100%)`,
          }}
        />
      </div>

      {/* Min / Max labels */}
      {question.rangeLabels && (
        <div className="flex items-center justify-between text-xs font-medium text-deep-purple/45">
          <span>{question.rangeLabels[0]}</span>
          <span>{question.rangeLabels[1]}</span>
        </div>
      )}
    </div>
  );
}

function SelectionCardsInput({
  question,
  value,
  onChange,
}: {
  question: CMSAssessmentQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {(question.options ?? []).map((opt) => (
        <SelectionCard
          key={opt.value}
          option={opt}
          selected={value.includes(opt.value)}
          onToggle={toggle}
          multi
        />
      ))}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface AssessmentInputProps {
  question: CMSAssessmentQuestion;
  value: string | string[] | undefined;
  onChange: (questionId: string, value: string | string[]) => void;
}

export default function AssessmentInput({ question, value, onChange }: AssessmentInputProps) {
  const handleSingle = (v: string) => onChange(question.id, v);
  const handleMulti = (v: string[]) => onChange(question.id, v);

  switch (question.type) {
    case "text":
      return (
        <TextInput
          question={question}
          value={toString(value)}
          onChange={handleSingle}
        />
      );

    case "number":
      return (
        <NumberInput
          question={question}
          value={toString(value)}
          onChange={handleSingle}
        />
      );

    case "select":
      return (
        <SelectInput
          question={question}
          value={toString(value)}
          onChange={handleSingle}
        />
      );

    case "radio":
      return (
        <RadioInput
          question={question}
          value={toString(value)}
          onChange={handleSingle}
        />
      );

    case "checkbox":
      return (
        <CheckboxInput
          question={question}
          value={toArray(value)}
          onChange={handleMulti}
        />
      );

    case "range":
      return (
        <RangeInput
          question={question}
          value={toString(value)}
          onChange={handleSingle}
        />
      );

    case "selection_cards":
      return (
        <SelectionCardsInput
          question={question}
          value={toArray(value)}
          onChange={handleMulti}
        />
      );

    default:
      return null;
  }
}
