/**
 * CurrencySelect — searchable currency dropdown for admin forms.
 * Stores the raw symbol (e.g. "$") as the value so it can be
 * shown directly on public-facing cards without lookup.
 */
import { useState, useRef, useEffect } from "react";

export interface Currency {
  code:   string;
  symbol: string;
  name:   string;
  nameAr: string;
}

export const CURRENCIES: Currency[] = [
  // ── Arab World ──────────────────────────────────────────────
  { code: "JOD", symbol: "JD",    name: "Jordanian Dinar",   nameAr: "دينار أردني" },
  { code: "SAR", symbol: "﷼",     name: "Saudi Riyal",       nameAr: "ريال سعودي" },
  { code: "AED", symbol: "د.إ",   name: "UAE Dirham",        nameAr: "درهم إماراتي" },
  { code: "KWD", symbol: "د.ك",   name: "Kuwaiti Dinar",     nameAr: "دينار كويتي" },
  { code: "QAR", symbol: "ر.ق",   name: "Qatari Riyal",      nameAr: "ريال قطري" },
  { code: "BHD", symbol: "BD",    name: "Bahraini Dinar",    nameAr: "دينار بحريني" },
  { code: "OMR", symbol: "RO",    name: "Omani Rial",        nameAr: "ريال عُماني" },
  { code: "EGP", symbol: "E£",    name: "Egyptian Pound",    nameAr: "جنيه مصري" },
  { code: "IQD", symbol: "ع.د",   name: "Iraqi Dinar",       nameAr: "دينار عراقي" },
  { code: "LBP", symbol: "ل.ل",   name: "Lebanese Pound",    nameAr: "ليرة لبنانية" },
  { code: "SYP", symbol: "ل.س",   name: "Syrian Pound",      nameAr: "ليرة سورية" },
  // ── Major World ─────────────────────────────────────────────
  { code: "USD", symbol: "$",     name: "US Dollar",         nameAr: "دولار أمريكي" },
  { code: "EUR", symbol: "€",     name: "Euro",              nameAr: "يورو" },
  { code: "GBP", symbol: "£",     name: "British Pound",     nameAr: "جنيه إسترليني" },
  { code: "CHF", symbol: "Fr",    name: "Swiss Franc",       nameAr: "فرنك سويسري" },
  { code: "CAD", symbol: "CA$",   name: "Canadian Dollar",   nameAr: "دولار كندي" },
  { code: "AUD", symbol: "A$",    name: "Australian Dollar", nameAr: "دولار أسترالي" },
  { code: "JPY", symbol: "¥",     name: "Japanese Yen",      nameAr: "ين ياباني" },
  { code: "CNY", symbol: "元",    name: "Chinese Yuan",      nameAr: "يوان صيني" },
  { code: "INR", symbol: "₹",     name: "Indian Rupee",      nameAr: "روبية هندية" },
  { code: "TRY", symbol: "₺",     name: "Turkish Lira",      nameAr: "ليرة تركية" },
  { code: "SEK", symbol: "kr",    name: "Swedish Krona",     nameAr: "كرونة سويدية" },
  { code: "NOK", symbol: "kr",    name: "Norwegian Krone",   nameAr: "كرونة نرويجية" },
  { code: "DKK", symbol: "kr",    name: "Danish Krone",      nameAr: "كرونة دنماركية" },
  { code: "SGD", symbol: "S$",    name: "Singapore Dollar",  nameAr: "دولار سنغافوري" },
  { code: "MYR", symbol: "RM",    name: "Malaysian Ringgit", nameAr: "رينغيت ماليزي" },
  { code: "NGN", symbol: "₦",     name: "Nigerian Naira",    nameAr: "نيرة نيجيرية" },
  { code: "ZAR", symbol: "R",     name: "South African Rand",nameAr: "راند جنوب أفريقي" },
];

// ─── helpers ───────────────────────────────────────────────────────────────────

function findBySymbol(symbol: string | null | undefined): Currency | undefined {
  if (!symbol) return undefined;
  return CURRENCIES.find((c) => c.symbol === symbol);
}

function displayLabel(c: Currency, ar: boolean): string {
  return `${c.code} — ${ar ? c.nameAr : c.name} (${c.symbol})`;
}

// ─── component ─────────────────────────────────────────────────────────────────

interface Props {
  value:     string;       // the stored symbol, e.g. "$"
  onChange:  (symbol: string) => void;
  className?: string;
  lang:       "en" | "ar";
}

const inp = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";

export default function CurrencySelect({ value, onChange, className, lang }: Props) {
  const ar          = lang === "ar";
  const [open,      setOpen]   = useState(false);
  const [search,    setSearch] = useState("");
  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef= useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = findBySymbol(value);

  const filtered = CURRENCIES.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(search) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  function handleSelect(c: Currency) {
    onChange(c.symbol);
    setSearch("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={open ? search : (selected ? displayLabel(selected, ar) : value)}
        onFocus={() => { setOpen(true); setSearch(""); }}
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
        placeholder={ar ? "ابحث عن عملة…" : "Search currency…"}
        className={`${inp} ${className ?? ""}`}
        autoComplete="off"
      />
      {/* Dropdown arrow */}
      <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[var(--admin-text-faint)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4"/></svg>
      </span>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] start-0 end-0 max-h-52 overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl shadow-black/10">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-[var(--admin-text-faint)] text-center">
              {ar ? "لا نتائج" : "No results"}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onMouseDown={() => handleSelect(c)}
                className={`w-full text-start px-3 py-2 text-[13px] flex items-center gap-2.5 hover:bg-[var(--admin-hover-bg)] transition-colors ${
                  c.symbol === value ? "bg-primary-pink/5 text-primary-pink font-semibold" : "text-[var(--admin-text)]"
                }`}
              >
                <span className="font-mono text-[12px] w-7 shrink-0 text-center text-[var(--admin-text-muted)]">
                  {c.symbol}
                </span>
                <span className="font-semibold w-10 shrink-0">{c.code}</span>
                <span className="text-[var(--admin-text-muted)] truncate">
                  {ar ? c.nameAr : c.name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
