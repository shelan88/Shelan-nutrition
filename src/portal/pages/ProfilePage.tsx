/**
 * Portal — My Profile
 * Allows the client to view and edit their own profile information.
 *
 * Avatar upload uses the shared <ImageUpload> component which provides:
 *   • Immediate FileReader-based preview
 *   • Progress overlay during upload
 *   • Error display with retry
 */

import { useState, useEffect, useRef } from "react";
import { Save, CheckCircle2, AlertCircle, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  updateOwnProfile,
  uploadAvatar,
  type ProfileUpdate,
} from "@/portal/repositories/profile.repository";
import { ImageUpload } from "@/shared/components/upload";

// ─── Style helpers ────────────────────────────────────────────────────────────
const field =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/40 transition-all";
const lbl =
  "block text-xs font-medium text-ivory/50 mb-1.5 uppercase tracking-wide";

// ─── Country list ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  "Kuwait", "Saudi Arabia", "UAE", "Bahrain", "Qatar",
  "Jordan", "Oman", "Egypt", "Lebanon", "Other",
];
const COUNTRIES_AR: Record<string, string> = {
  Kuwait: "الكويت",
  "Saudi Arabia": "المملكة العربية السعودية",
  UAE: "الإمارات",
  Bahrain: "البحرين",
  Qatar: "قطر",
  Jordan: "الأردن",
  Oman: "عُمان",
  Egypt: "مصر",
  Lebanon: "لبنان",
  Other: "أخرى",
};

// ─── Phone dial codes ─────────────────────────────────────────────────────────
const DIAL_CODES = [
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+20",  flag: "🇪🇬", name: "Egypt" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+1",   flag: "🇺🇸", name: "US/Canada" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+90",  flag: "🇹🇷", name: "Turkey" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+63",  flag: "🇵🇭", name: "Philippines" },
];

function parsePhone(raw: string | null | undefined): { dialCode: string; number: string } {
  if (!raw) return { dialCode: "+965", number: "" };
  const match = DIAL_CODES.slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find((d) => raw.startsWith(d.code));
  if (match) return { dialCode: match.code, number: raw.slice(match.code.length).trim() };
  return { dialCode: "+965", number: raw };
}

function validatePhoneNumber(num: string): string | null {
  const digits = num.replace(/[\s\-().]/g, "");
  if (digits === "") return null;
  if (!/^\d+$/.test(digits)) return "أرقام فقط";
  if (digits.length < 7)  return "رقم قصير جداً";
  if (digits.length > 15) return "رقم طويل جداً";
  return null;
}

/** Add a cache-buster to a Supabase storage URL so the browser reloads the image. */
function withCacheBust(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = url.includes("?t=") ? url.split("?t=")[0] : url;
  return `${base}?t=${Date.now()}`;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user }                             = useAuth();
  const { profile, loading, error, refresh } = useClientProfile();
  const { lang }                             = useLanguage();
  const isAr                                 = lang === "ar";

  // Form state
  const [form,        setForm]        = useState<ProfileUpdate>({});
  const [dialCode,    setDialCode]    = useState("+965");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError,  setPhoneError]  = useState<string | null>(null);

  // Save state
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<"success" | "error" | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Track the live avatar URL so ImageUpload value stays updated after save
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(null);

  // Guard against the profile-refresh cycle overwriting a freshly cache-busted URL.
  // Set to true just before refresh() is called after an avatar upload; the next
  // profile effect run clears it without resetting liveAvatarUrl.
  const avatarJustUploaded = useRef(false);

  // ── Populate form when profile first loads (or refreshes) ─────────────────
  useEffect(() => {
    if (!profile) return;
    const parsed = parsePhone(profile.phone);
    setDialCode(parsed.dialCode);
    setPhoneNumber(parsed.number);
    setForm({
      full_name:          profile.full_name,
      gender:             profile.gender ?? null,
      location:           profile.location ?? "",
      city:               profile.city ?? "",
      date_of_birth:      profile.date_of_birth ?? "",
      preferred_language: profile.preferred_language ?? "en",
      bio:                profile.bio ?? "",
    });
    // If an avatar upload just completed, liveAvatarUrl already holds the
    // cache-busted URL — don't overwrite it with the un-busted DB value that
    // arrives on the refresh() triggered by handleAvatarSuccess.
    if (avatarJustUploaded.current) {
      avatarJustUploaded.current = false;
    } else {
      setLiveAvatarUrl(
        profile.avatar_url ? withCacheBust(profile.avatar_url) : null,
      );
    }
  }, [profile]);

  const set = (key: keyof ProfileUpdate, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (kind: "success" | "error", msg: string) => {
    setToast(kind);
    setToastMsg(msg);
    setTimeout(() => setToast(null), 5000);
  };

  // ── Avatar: upload fn passed to ImageUpload ────────────────────────────────
  // Returns the public URL (string) or null on failure.
  async function handleAvatarUpload(file: File): Promise<string | null> {
    if (!user) return null;
    const { url, error: avatarErr } = await uploadAvatar(user.id, file);
    if (avatarErr || !url) return null;
    return url;
  }

  // ── Avatar: success handler — persist URL to DB ────────────────────────────
  async function handleAvatarSuccess(url: string) {
    const { error: saveErr } = await updateOwnProfile({ avatar_url: url });
    if (saveErr) {
      showToast("error", isAr ? "فشل حفظ الصورة" : "Failed to save photo");
      return;
    }
    // Set the guard BEFORE refresh() so the profile effect triggered by the
    // re-fetch does not overwrite the cache-busted URL we're about to set.
    avatarJustUploaded.current = true;
    setLiveAvatarUrl(withCacheBust(url));
    window.dispatchEvent(new CustomEvent("shelan:avatar-updated"));
    showToast("success", isAr ? "تم تحديث الصورة بنجاح ✓" : "Photo updated successfully ✓");
    refresh();
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const pErr = validatePhoneNumber(phoneNumber);
    setPhoneError(pErr);
    if (pErr) return;

    setSaving(true);

    try {
      const digits = phoneNumber.replace(/[\s\-().]/g, "");
      const combinedPhone = digits ? `${dialCode}${digits}` : null;

      const updates: ProfileUpdate = {
        ...form,
        phone:      combinedPhone,
        avatar_url: null, // avatar already saved immediately on selection
      };

      const { data: saved, error: saveErr } = await updateOwnProfile(updates);

      if (saveErr || !saved) {
        showToast("error", isAr
          ? `فشل الحفظ: ${saveErr ?? "لم يتم إرجاع أي بيانات"}`
          : `Save failed: ${saveErr ?? "no data returned"}`);
        return;
      }

      window.dispatchEvent(new CustomEvent("shelan:avatar-updated"));
      refresh();

      showToast("success", isAr
        ? "تم حفظ الملف الشخصي بنجاح."
        : "Profile saved successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast("error", isAr ? `خطأ غير متوقع: ${msg}` : `Unexpected error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading || (!profile && !error)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
        <p className="text-sm text-ivory/40">
          {isAr ? "جارٍ تحميل ملفك الشخصي…" : "Loading your profile…"}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 flex flex-col items-center text-center gap-4">
        <p className="text-ivory/50 text-sm max-w-xs">
          {isAr
            ? "تعذّر تحميل ملفك الشخصي. يرجى تحديث الصفحة أو التواصل مع الدعم."
            : "Could not load your profile. Please refresh the page or contact support."}
        </p>
        <button type="button" onClick={refresh}
          className="px-5 py-2 rounded-full border border-white/15 text-sm text-ivory/60 hover:text-ivory hover:border-white/30 transition-colors">
          {isAr ? "إعادة المحاولة" : "Try again"}
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSave} className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-ivory mb-6">
        {isAr ? "ملفي الشخصي" : "My Profile"}
      </h1>

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        {/* ImageUpload: circle shape, 80×80, handles preview + progress + retry */}
        <div className="w-20 h-20 shrink-0">
          <ImageUpload
            value={liveAvatarUrl}
            upload={handleAvatarUpload}
            onSuccess={handleAvatarSuccess}
            onError={(msg) => showToast("error", msg)}
            shape="circle"
            maxSizeMb={5}
            lang={lang as "en" | "ar"}
            fallback={
              profile.initials ? (
                <span
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#e91e8c 0%,#c084fc 100%)" }}
                >
                  {profile.initials}
                </span>
              ) : (
                <span
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#e91e8c 0%,#c084fc 100%)" }}
                >
                  <User size={28} className="text-white" />
                </span>
              )
            }
            className="w-20 h-20"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-ivory/70">
            {isAr ? "الصورة الشخصية" : "Profile Photo"}
          </p>
          <p className="text-xs text-ivory/40 mt-0.5">
            {isAr ? "JPG أو PNG أو WebP · الحجم الأقصى 5 ميغابايت" : "JPG, PNG or WebP · max 5 MB"}
          </p>
          <p className="text-xs text-ivory/30 mt-0.5">
            {isAr ? "اضغط على الصورة لتغييرها" : "Tap the photo to change it"}
          </p>
        </div>
      </div>

      {/* ── Email (read-only) ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
        <input type="email" value={profile.email ?? ""} disabled
          className={`${field} opacity-50 cursor-not-allowed`} />
      </div>

      {/* ── Full name ───────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "الاسم الكامل" : "Full Name"}</label>
        <input
          type="text"
          value={form.full_name ?? ""}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder={isAr ? "اسمك الكامل" : "Your full name"}
          className={field}
        />
      </div>

      {/* ── Phone: country selector + number ───────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "رقم الهاتف" : "Phone"}</label>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={dialCode}
              onChange={(e) => setDialCode(e.target.value)}
              className={`${field} w-auto pe-8 appearance-none cursor-pointer`}
              aria-label={isAr ? "رمز الدولة" : "Country code"}
            >
              {DIAL_CODES.map((d) => (
                <option key={d.code} value={d.code}>{d.flag} {d.code}</option>
              ))}
            </select>
            <ChevronDown size={14}
              className="absolute inset-y-0 end-2.5 my-auto text-ivory/40 pointer-events-none" />
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              setPhoneError(validatePhoneNumber(e.target.value));
            }}
            placeholder={isAr ? "رقم الهاتف" : "Phone number"}
            className={`${field} flex-1 ${phoneError ? "border-red-500/60 focus:ring-red-500/40" : ""}`}
            dir="ltr"
          />
        </div>
        {phoneError && (
          <p className="mt-1 text-xs text-red-400">{phoneError}</p>
        )}
      </div>

      {/* ── Gender ───────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "الجنس" : "Gender"}</label>
        <select
          value={form.gender ?? ""}
          onChange={(e) => set("gender", e.target.value || null)}
          className={`${field} cursor-pointer`}
        >
          <option value="">{isAr ? "يفضّل عدم الإفصاح" : "Prefer not to say"}</option>
          <option value="Female">{isAr ? "أنثى" : "Female"}</option>
          <option value="Male">{isAr ? "ذكر" : "Male"}</option>
          <option value="Other">{isAr ? "أخرى" : "Other"}</option>
        </select>
      </div>

      {/* ── Date of Birth ────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "تاريخ الميلاد" : "Date of Birth"}</label>
        <input
          type="date"
          value={form.date_of_birth ?? ""}
          onChange={(e) => set("date_of_birth", e.target.value)}
          className={field}
        />
      </div>

      {/* ── Location / Country ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "الدولة" : "Country"}</label>
        <select
          value={form.location ?? ""}
          onChange={(e) => set("location", e.target.value || null)}
          className={`${field} cursor-pointer`}
        >
          <option value="">{isAr ? "اختر الدولة" : "Select country"}</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{isAr ? (COUNTRIES_AR[c] ?? c) : c}</option>
          ))}
        </select>
      </div>

      {/* ── City ──────────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "المدينة" : "City"}</label>
        <input
          type="text"
          value={form.city ?? ""}
          onChange={(e) => set("city", e.target.value)}
          placeholder={isAr ? "مثال: الكويت" : "e.g. Kuwait City"}
          className={field}
        />
      </div>

      {/* ── Preferred Language ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "لغة التواصل" : "Preferred Language"}</label>
        <select
          value={form.preferred_language ?? "en"}
          onChange={(e) => set("preferred_language", e.target.value)}
          className={`${field} cursor-pointer`}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* ── Bio ──────────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <label className={lbl}>{isAr ? "نبذة عني" : "About Me"}</label>
        <textarea
          rows={3}
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          placeholder={isAr ? "أخبرينا عن نفسك…" : "Tell us a bit about yourself…"}
          className={`${field} resize-none`}
        />
      </div>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-sm font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={15} strokeWidth={2.2} />
        {saving ? (isAr ? "جارٍ الحفظ…" : "Saving…") : (isAr ? "حفظ التغييرات" : "Save Changes")}
      </button>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
          ${toast === "success"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {toast === "success"
            ? <CheckCircle2 size={15} className="shrink-0" />
            : <AlertCircle  size={15} className="shrink-0" />}
          {toastMsg}
        </div>
      )}
    </form>
  );
}
