/**
 * src/components/PhoneInput.tsx
 *
 * International phone number input.
 * - Country flag + dial-code selector with search
 * - Default country: Jordan (+962)
 * - Emits E.164 format: "+962XXXXXXXXX"
 * - Designed to match the existing form input aesthetic
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, parseE164 } from "@/lib/countries";
import type { Country } from "@/lib/countries";

interface PhoneInputProps {
  /** Current value in E.164 format ("+962XXXXXXXXX") or empty string. */
  value: string;
  /** Called with the new E.164 value on every change. */
  onChange: (e164: string) => void;
  lang?: "en" | "ar";
  /** When true, renders a red border (controlled externally). */
  error?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}

export default function PhoneInput({
  value,
  onChange,
  lang = "en",
  error = false,
  placeholder,
  onBlur,
}: PhoneInputProps) {
  const { country: initCountry, local: initLocal } = parseE164(value || "");

  const [selectedCountry, setSelectedCountry] = useState<Country>(initCountry);
  const [localNumber,     setLocalNumber]     = useState(initLocal);
  const [isOpen,          setIsOpen]          = useState(false);
  const [search,          setSearch]          = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // ── Build E.164 ────────────────────────────────────────────────────────────
  const buildE164 = useCallback((country: Country, local: string): string => {
    const digits = local.replace(/\D/g, "").replace(/^0+/, "");
    return digits ? `+${country.dialCode}${digits}` : "";
  }, []);

  // ── Sync if parent resets value to "" ──────────────────────────────────────
  useEffect(() => {
    if (!value) {
      setSelectedCountry(DEFAULT_COUNTRY);
      setLocalNumber("");
    }
  }, [value]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Auto-focus search when dropdown opens ──────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 40);
  }, [isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    onChange(buildE164(country, localNumber));
    // Refocus the number input after selecting
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, spaces, hyphens, parentheses — strip everything else
    const raw = e.target.value.replace(/[^\d\s\-()+]/g, "");
    setLocalNumber(raw);
    onChange(buildE164(selectedCountry, raw));
  };

  // ── Filter countries ────────────────────────────────────────────────────────
  const filtered = COUNTRIES.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(search) ||
      c.dialCode.includes(q) ||
      c.iso.toLowerCase().includes(q)
    );
  });

  // ── Styles ─────────────────────────────────────────────────────────────────
  const wrapperBorder = error
    ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-400/15"
    : "border-soft-purple/20 focus-within:border-primary-pink/50 focus-within:ring-primary-pink/15";

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger row ──────────────────────────────────────────────────── */}
      <div
        className={`flex items-stretch w-full rounded-xl border bg-white transition-all focus-within:ring-2 ${wrapperBorder}`}
        dir="ltr"
      >
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-3 border-e border-soft-purple/15 hover:bg-light-pink/20 transition-colors rounded-s-xl shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-pink/30"
          aria-label="Select country calling code"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-xl leading-none select-none">{selectedCountry.flag}</span>
          <span className="text-xs font-semibold text-deep-purple/60 tabular-nums">
            +{selectedCountry.dialCode}
          </span>
          <ChevronDown
            size={13}
            className={`text-deep-purple/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Number input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={onBlur}
          placeholder={placeholder ?? (lang === "ar" ? "7 9000 0000" : "7 9000 0000")}
          className="flex-1 px-4 py-3 text-sm text-heading placeholder:text-deep-purple/35 bg-transparent focus:outline-none rounded-e-xl min-w-0"
          aria-label="Phone number"
        />
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="absolute top-full start-0 mt-1 bg-white rounded-xl border border-soft-purple/15 shadow-xl z-50 w-72 overflow-hidden"
          role="listbox"
          aria-label="Countries"
        >
          {/* Search field */}
          <div className="p-2 border-b border-soft-purple/10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-light-pink/20">
              <Search size={13} className="text-deep-purple/40 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "ar" ? "ابحث عن دولة…" : "Search country…"}
                className="flex-1 text-sm bg-transparent focus:outline-none text-heading placeholder:text-deep-purple/35"
                dir="auto"
                aria-label="Search countries"
              />
            </div>
          </div>

          {/* Country list */}
          <ul className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-deep-purple/40 text-center">
                {lang === "ar" ? "لا توجد نتائج" : "No results"}
              </li>
            ) : (
              filtered.map((country) => (
                <li key={country.iso} role="option" aria-selected={selectedCountry.iso === country.iso}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-light-pink/30 transition-colors text-start ${
                      selectedCountry.iso === country.iso
                        ? "bg-light-pink/40 font-semibold"
                        : ""
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0 select-none">{country.flag}</span>
                    <span className="flex-1 text-heading truncate">
                      {lang === "ar" ? country.nameAr : country.name}
                    </span>
                    <span className="text-deep-purple/40 tabular-nums text-xs shrink-0 font-mono" dir="ltr">
                      +{country.dialCode}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
