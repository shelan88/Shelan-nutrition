/**
 * src/lib/countries.ts
 * Curated country list for the international phone input.
 * Middle East countries are listed first (priority for this clinic).
 */

export interface Country {
  iso:     string; // ISO 3166-1 alpha-2
  flag:    string; // emoji flag
  name:    string; // English name
  nameAr:  string; // Arabic name
  dialCode: string; // calling code without leading +
}

export const COUNTRIES: Country[] = [
  // ── Middle East & North Africa (priority) ────────────────────────────────
  { iso: "JO", flag: "🇯🇴", name: "Jordan",         nameAr: "الأردن",            dialCode: "962" },
  { iso: "SA", flag: "🇸🇦", name: "Saudi Arabia",   nameAr: "السعودية",          dialCode: "966" },
  { iso: "AE", flag: "🇦🇪", name: "UAE",             nameAr: "الإمارات",          dialCode: "971" },
  { iso: "KW", flag: "🇰🇼", name: "Kuwait",          nameAr: "الكويت",            dialCode: "965" },
  { iso: "QA", flag: "🇶🇦", name: "Qatar",           nameAr: "قطر",               dialCode: "974" },
  { iso: "BH", flag: "🇧🇭", name: "Bahrain",         nameAr: "البحرين",           dialCode: "973" },
  { iso: "OM", flag: "🇴🇲", name: "Oman",            nameAr: "عُمان",             dialCode: "968" },
  { iso: "EG", flag: "🇪🇬", name: "Egypt",           nameAr: "مصر",               dialCode: "20"  },
  { iso: "LB", flag: "🇱🇧", name: "Lebanon",         nameAr: "لبنان",             dialCode: "961" },
  { iso: "IQ", flag: "🇮🇶", name: "Iraq",            nameAr: "العراق",            dialCode: "964" },
  { iso: "SY", flag: "🇸🇾", name: "Syria",           nameAr: "سوريا",             dialCode: "963" },
  { iso: "PS", flag: "🇵🇸", name: "Palestine",       nameAr: "فلسطين",            dialCode: "970" },
  { iso: "YE", flag: "🇾🇪", name: "Yemen",           nameAr: "اليمن",             dialCode: "967" },
  { iso: "LY", flag: "🇱🇾", name: "Libya",           nameAr: "ليبيا",             dialCode: "218" },
  { iso: "MA", flag: "🇲🇦", name: "Morocco",         nameAr: "المغرب",            dialCode: "212" },
  { iso: "TN", flag: "🇹🇳", name: "Tunisia",         nameAr: "تونس",              dialCode: "216" },
  { iso: "DZ", flag: "🇩🇿", name: "Algeria",         nameAr: "الجزائر",           dialCode: "213" },
  { iso: "SD", flag: "🇸🇩", name: "Sudan",           nameAr: "السودان",           dialCode: "249" },
  { iso: "SO", flag: "🇸🇴", name: "Somalia",         nameAr: "الصومال",           dialCode: "252" },
  { iso: "MR", flag: "🇲🇷", name: "Mauritania",      nameAr: "موريتانيا",         dialCode: "222" },
  // ── Europe ───────────────────────────────────────────────────────────────
  { iso: "GB", flag: "🇬🇧", name: "United Kingdom",  nameAr: "المملكة المتحدة",   dialCode: "44"  },
  { iso: "DE", flag: "🇩🇪", name: "Germany",         nameAr: "ألمانيا",           dialCode: "49"  },
  { iso: "FR", flag: "🇫🇷", name: "France",          nameAr: "فرنسا",             dialCode: "33"  },
  { iso: "IT", flag: "🇮🇹", name: "Italy",           nameAr: "إيطاليا",           dialCode: "39"  },
  { iso: "ES", flag: "🇪🇸", name: "Spain",           nameAr: "إسبانيا",           dialCode: "34"  },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands",     nameAr: "هولندا",            dialCode: "31"  },
  { iso: "SE", flag: "🇸🇪", name: "Sweden",          nameAr: "السويد",            dialCode: "46"  },
  { iso: "NO", flag: "🇳🇴", name: "Norway",          nameAr: "النرويج",           dialCode: "47"  },
  { iso: "CH", flag: "🇨🇭", name: "Switzerland",     nameAr: "سويسرا",            dialCode: "41"  },
  { iso: "AT", flag: "🇦🇹", name: "Austria",         nameAr: "النمسا",            dialCode: "43"  },
  { iso: "BE", flag: "🇧🇪", name: "Belgium",         nameAr: "بلجيكا",            dialCode: "32"  },
  { iso: "PL", flag: "🇵🇱", name: "Poland",          nameAr: "بولندا",            dialCode: "48"  },
  { iso: "RO", flag: "🇷🇴", name: "Romania",         nameAr: "رومانيا",           dialCode: "40"  },
  { iso: "GR", flag: "🇬🇷", name: "Greece",          nameAr: "اليونان",           dialCode: "30"  },
  { iso: "PT", flag: "🇵🇹", name: "Portugal",        nameAr: "البرتغال",          dialCode: "351" },
  { iso: "TR", flag: "🇹🇷", name: "Turkey",          nameAr: "تركيا",             dialCode: "90"  },
  { iso: "RU", flag: "🇷🇺", name: "Russia",          nameAr: "روسيا",             dialCode: "7"   },
  { iso: "UA", flag: "🇺🇦", name: "Ukraine",         nameAr: "أوكرانيا",          dialCode: "380" },
  // ── Americas ─────────────────────────────────────────────────────────────
  { iso: "US", flag: "🇺🇸", name: "United States",   nameAr: "الولايات المتحدة",  dialCode: "1"   },
  { iso: "CA", flag: "🇨🇦", name: "Canada",          nameAr: "كندا",              dialCode: "1"   },
  { iso: "BR", flag: "🇧🇷", name: "Brazil",          nameAr: "البرازيل",          dialCode: "55"  },
  { iso: "MX", flag: "🇲🇽", name: "Mexico",          nameAr: "المكسيك",           dialCode: "52"  },
  { iso: "AR", flag: "🇦🇷", name: "Argentina",       nameAr: "الأرجنتين",         dialCode: "54"  },
  // ── Asia-Pacific ─────────────────────────────────────────────────────────
  { iso: "IN", flag: "🇮🇳", name: "India",           nameAr: "الهند",             dialCode: "91"  },
  { iso: "PK", flag: "🇵🇰", name: "Pakistan",        nameAr: "باكستان",           dialCode: "92"  },
  { iso: "BD", flag: "🇧🇩", name: "Bangladesh",      nameAr: "بنغلاديش",          dialCode: "880" },
  { iso: "CN", flag: "🇨🇳", name: "China",           nameAr: "الصين",             dialCode: "86"  },
  { iso: "JP", flag: "🇯🇵", name: "Japan",           nameAr: "اليابان",           dialCode: "81"  },
  { iso: "KR", flag: "🇰🇷", name: "South Korea",     nameAr: "كوريا الجنوبية",   dialCode: "82"  },
  { iso: "SG", flag: "🇸🇬", name: "Singapore",       nameAr: "سنغافورة",          dialCode: "65"  },
  { iso: "MY", flag: "🇲🇾", name: "Malaysia",        nameAr: "ماليزيا",           dialCode: "60"  },
  { iso: "ID", flag: "🇮🇩", name: "Indonesia",       nameAr: "إندونيسيا",         dialCode: "62"  },
  { iso: "PH", flag: "🇵🇭", name: "Philippines",     nameAr: "الفلبين",           dialCode: "63"  },
  { iso: "TH", flag: "🇹🇭", name: "Thailand",        nameAr: "تايلاند",           dialCode: "66"  },
  { iso: "AU", flag: "🇦🇺", name: "Australia",       nameAr: "أستراليا",          dialCode: "61"  },
  { iso: "NZ", flag: "🇳🇿", name: "New Zealand",     nameAr: "نيوزيلندا",         dialCode: "64"  },
  // ── Africa ───────────────────────────────────────────────────────────────
  { iso: "NG", flag: "🇳🇬", name: "Nigeria",         nameAr: "نيجيريا",           dialCode: "234" },
  { iso: "ZA", flag: "🇿🇦", name: "South Africa",    nameAr: "جنوب أفريقيا",     dialCode: "27"  },
  { iso: "KE", flag: "🇰🇪", name: "Kenya",           nameAr: "كينيا",             dialCode: "254" },
  { iso: "GH", flag: "🇬🇭", name: "Ghana",           nameAr: "غانا",              dialCode: "233" },
  { iso: "ET", flag: "🇪🇹", name: "Ethiopia",        nameAr: "إثيوبيا",           dialCode: "251" },
];

/** Default country for the phone input. Jordan (+962). */
export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

/**
 * Parse an E.164 string into a Country + local number.
 * Falls back to DEFAULT_COUNTRY when nothing matches.
 */
export function parseE164(e164: string): { country: Country; local: string } {
  if (!e164.startsWith("+")) return { country: DEFAULT_COUNTRY, local: e164 };
  const raw = e164.slice(1);
  // Longest dial-code match first to avoid e.g. "1" matching before "971"
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (raw.startsWith(country.dialCode)) {
      return { country, local: raw.slice(country.dialCode.length) };
    }
  }
  return { country: DEFAULT_COUNTRY, local: raw };
}
