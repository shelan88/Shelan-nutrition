/**
 * Portal — My Profile
 * Allows the client to view and edit their own profile information.
 */

import { useState, useRef, useEffect } from "react";
import { Camera, Save, CheckCircle2, AlertCircle, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  updateOwnProfile,
  uploadAvatar,
  type ProfileUpdate,
} from "@/portal/repositories/profile.repository";

// ─── Style helpers ────────────────────────────────────────────────────────────
const field =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/40 transition-all";
const lbl =
  "block text-xs font-medium text-ivory/50 mb-1.5 uppercase tracking-wide";

// ─── Country / region list ────────────────────────────────────────────────────
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

/** Split a stored phone string (e.g. "+965 9999 9999") into dialCode + number. */
function parsePhone(raw: string | null | undefined): { dialCode: string; number: string } {
  if (!raw) return { dialCode: "+965", number: "" };
  // Find the longest matching prefix
  const match = DIAL_CODES.slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find((d) => raw.startsWith(d.code));
  if (match) {
    return { dialCode: match.code, number: raw.slice(match.code.length).trim() };
  }
  return { dialCode: "+965", number: raw };
}

/** Validate the local part of a phone number (7–15 digits, spaces/dashes OK). */
function validatePhoneNumber(num: string): string | null {
  const digits = num.replace(/[\s\-().]/g, "");
  if (digits === "") return null; // empty is allowed (nullable field)
  if (!/^\d+$/.test(digits)) return "أرقام فقط";
  if (digits.length < 7)  return "رقم قصير جداً";
  if (digits.length > 15) return "رقم طويل جداً";
  return null;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user }                          = useAuth();
  const { profile, loading, error, refresh } = useClientProfile();
  const { lang }                          = useLanguage();
  const isAr                              = lang === "ar";

  const [form,          setForm]          = useState<ProfileUpdate>({});
  const [dialCode,      setDialCode]      = useState("+965");
  const [phoneNumber,   setPhoneNumber]   = useState("");
  const [phoneError,    setPhoneError]    = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState<"success" | "error" | null>(null);
  const [toastMsg,      setToastMsg]      = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Populate form when profile loads ───────────────────────────────────────
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
  }, [profile]);

  const set = (key: keyof ProfileUpdate, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Avatar picker ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", isAr ? "الحجم الأقصى 5 ميغابايت" : "Max file size is 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (kind: "success" | "error", msg: string) => {
    setToast(kind);
    setToastMsg(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    // Validate phone before submitting
    const pErr = validatePhoneNumber(phoneNumber);
    setPhoneError(pErr);
    if (pErr) return;

    setSaving(true);

    try {
      // Combine dial code + number into a single E.164-style string
      const digits = phoneNumber.replace(/[\s\-().]/g, "");
      const combinedPhone = digits ? `${dialCode}${digits}` : null;

      let updates: ProfileUpdate = { ...form, phone: combinedPhone ?? undefined };

      // ── Upload avatar first if changed ─────────────────────────────────────
      if (avatarFile) {
        const { url, error: avatarErr } = await uploadAvatar(user.id, profile.id, avatarFile);
        if (avatarErr) {
          showToast("error", isAr
            ? `فشل رفع الصورة: ${avatarErr}`
            : `Avatar upload failed: ${avatarErr}`);
          setSaving(false);
          return;
        }
        if (url) {
          updates.avatar_url = url;
          // Notify Navbar to re-fetch avatar immediately
          window.dispatchEvent(new CustomEvent("shelan:avatar-updated"));
        }
      }

      // ── Save profile fields ────────────────────────────────────────────────
      const { data: saved, error: saveErr } = await updateOwnProfile(profile.id, updates);

      if (saveErr || !saved) {
        // Show the real Postgres/RLS error — never hide it
        const detail = saveErr ?? "No rows returned";
        showToast("error", isAr
          ? `فشل الحفظ: ${detail}`
          : `Save failed: ${detail}`);
        return;
      }

      setAvatarFile(null);
      refresh();

      // Notify Navbar to re-fetch avatar (covers the case where only fields changed)
      window.dispatchEvent(new CustomEvent("shelan:avatar-updated"));

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
        <button
          type="button"
          onClick={refresh}
          className="px-5 py-2 rounded-full border border-white/15 text-sm text-ivory/60 hover:text-ivory hover:border-white/30 transition-colors"
        >
          {isAr ? "إعادة المحاولة" : "Try again"}
        </button>
      </div>
    );
  }

  const avatarSrc = avatarPreview ?? profile.avatar_url;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSave} className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-ivory mb-6">
        {isAr ? "ملفي الشخصي" : "My Profile"}
      </h1>

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative group">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={isAr ? "الصورة الشخصية" : "Avatar"}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <span
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: "linear-gradient(135deg,#e91e8c 0%,#c084fc 100%)" }}
            >
              {profile.initials ?? <User size={28} />}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={isAr ? "تغيير الصورة" : "Change photo"}
          >
            <Camera size={20} className="text-white" />
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm font-medium text-primary-pink hover:text-light-pink transition-colors"
          >
            {isAr ? "تغيير الصورة" : "Change Photo"}
          </button>
          <p className="text-xs text-ivory/40 mt-0.5">
            {isAr ? "JPG أو PNG أو WebP · الحجم الأقصى 5 ميغابايت" : "JPG, PNG or WebP · max 5 MB"}
          </p>
          {avatarFile && (
            <p className="text-xs text-emerald-400 mt-0.5">
              {isAr ? "✓ صورة جديدة جاهزة للرفع" : `✓ ${avatarFile.name} ready to upload`}
            </p>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          capture="user"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* ── Email (read-only) ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
        <input
          type="email"
          value={profile.email ?? ""}
          disabled
          className={`${field} opacity-50 cursor-not-allowed`}
        />
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
          {/* Country code select */}
          <div className="relative">
            <select
              value={dialCode}
              onChange={(e) => setDialCode(e.target.value)}
              className={`${field} w-auto pe-8 appearance-none cursor-pointer`}
              style={{ paddingInlineEnd: "2rem" }}
              aria-label={isAr ? "رمز الدولة" : "Country code"}
            >
              {DIAL_CODES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.flag} {d.code}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute inset-y-0 end-2.5 my-auto text-ivory/40 pointer-events-none"
            />
          </div>

          {/* Number input */}
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
          <p className="mt-1 text-xs text-red-400">{isAr ? phoneError : phoneError}</p>
        )}
      </div>

      {/* ── Date of birth + Gender ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={lbl}>{isAr ? "تاريخ الميلاد" : "Date of Birth"}</label>
          <input
            type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => set("date_of_birth", e.target.value || null)}
            className={`${field} [color-scheme:dark]`}
          />
        </div>
        <div>
          <label className={lbl}>{isAr ? "الجنس" : "Gender"}</label>
          <select
            value={form.gender ?? ""}
            onChange={(e) => set("gender", e.target.value || null)}
            className={field}
          >
            <option value="">{isAr ? "اختر…" : "Select…"}</option>
            <option value="Female">{isAr ? "أنثى" : "Female"}</option>
            <option value="Male">{isAr ? "ذكر" : "Male"}</option>
          </select>
        </div>
      </div>

      {/* ── Country + City ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={lbl}>{isAr ? "الدولة" : "Country"}</label>
          <select
            value={form.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            className={field}
          >
            <option value="">{isAr ? "اختر…" : "Select…"}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {isAr ? (COUNTRIES_AR[c] ?? c) : c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>{isAr ? "المدينة" : "City"}</label>
          <input
            type="text"
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            placeholder={isAr ? "مدينتك" : "Your city"}
            className={field}
          />
        </div>
      </div>

      {/* ── Preferred language ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <label className={lbl}>{isAr ? "اللغة المفضلة" : "Preferred Language"}</label>
        <select
          value={form.preferred_language ?? "en"}
          onChange={(e) => set("preferred_language", e.target.value)}
          className={field}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* ── Bio ─────────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <label className={lbl}>{isAr ? "نبذة / أهداف صحية" : "Bio / Health Goals"}</label>
        <textarea
          rows={4}
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          placeholder={isAr
            ? "شارك أهدافك الصحية أو أي ملاحظات لأخصائي التغذية…"
            : "Share any health goals or notes for your nutritionist…"}
          className={`${field} resize-none`}
        />
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4 ${
            toast === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {toast === "success"
            ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            : <AlertCircle  size={16} className="mt-0.5 shrink-0" />}
          <span className="break-words">{toastMsg}</span>
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 ${isAr ? "flex-row-reverse" : ""}`}
      >
        <Save size={16} />
        {saving
          ? (isAr ? "جارٍ الحفظ…" : "Saving…")
          : (isAr ? "حفظ التغييرات" : "Save Changes")}
      </button>
    </form>
  );
}
