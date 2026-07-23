/**
 * useAdminLabels — returns a bound field-label translator for the current UI language.
 *
 * Usage:
 *   const fl = useAdminLabels();
 *
 *   <label>{fl("name")} (EN)</label>   → "Name (EN)"  |  "الاسم (EN)"
 *   <label>{fl("name")} (AR)</label>   → "Name (AR)"  |  "الاسم (AR)"
 *   <label>{fl("category")}</label>    → "Category"   |  "التصنيف"
 *
 * The language indicators (EN) / (AR) are NEVER translated —
 * only the noun/descriptor before them changes.
 */
import { useLanguage } from "@/context/LanguageContext";
import { fl as _fl } from "@/admin/i18n/fieldLabels";

export function useAdminLabels(): (key: string) => string {
  const { lang } = useLanguage();
  return (key: string) => _fl(key, lang);
}
