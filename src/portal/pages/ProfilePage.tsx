/**
 * Portal — My Profile
 * Allows the client to view and edit their own profile information.
 */

import { useState, useRef, useEffect } from "react";
import { Camera, Save, CheckCircle2, AlertCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  updateOwnProfile,
  uploadAvatar,
  type ProfileUpdate,
} from "@/portal/repositories/profile.repository";

const field = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/40 transition-all";
const label = "block text-xs font-medium text-ivory/50 mb-1.5 uppercase tracking-wide";

const COUNTRIES = [
  "Kuwait","Saudi Arabia","UAE","Bahrain","Qatar","Jordan","Oman","Egypt","Lebanon","Other",
];
const COUNTRIES_AR: Record<string, string> = {
  "Kuwait": "الكويت",
  "Saudi Arabia": "المملكة العربية السعودية",
  "UAE": "الإمارات",
  "Bahrain": "البحرين",
  "Qatar": "قطر",
  "Jordan": "الأردن",
  "Oman": "عُمان",
  "Egypt": "مصر",
  "Lebanon": "لبنان",
  "Other": "أخرى",
};
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, error, refresh } = useClientProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [form, setForm] = useState<ProfileUpdate>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState<"success" | "error" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name:         profile.full_name,
      phone:             profile.phone ?? "",
      gender:            profile.gender ?? null,
      location:          profile.location ?? "",
      city:              profile.city ?? "",
      date_of_birth:     profile.date_of_birth ?? "",
      preferred_language: profile.preferred_language ?? "en",
      bio:               profile.bio ?? "",
    });
  }, [profile]);

  const set = (key: keyof ProfileUpdate, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setSaving(true);

    try {
      let updates: ProfileUpdate = { ...form };

      // Upload avatar if changed
      if (avatarFile) {
        const url = await uploadAvatar(user.id, profile.id, avatarFile);
        if (url) updates.avatar_url = url;
      }

      const result = await updateOwnProfile(profile.id, updates);
      if (result) {
        setToast("success");
        setAvatarFile(null);
        refresh();
      } else {
        setToast("error");
      }
    } catch {
      setToast("error");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  // Show spinner while loading OR while auto-recovery is in progress.
  // useClientProfile auto-creates the row if it doesn't exist yet,
  // so we stay in the loading state until it either succeeds or fails.
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

  // Only reached if the DB returned an error even after the auto-recovery attempt.
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

  return (
    <form onSubmit={handleSave} className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-ivory mb-6">
        {isAr ? "ملفي الشخصي" : "My Profile"}
      </h1>

      {/* Avatar */}
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
              style={{ background: "linear-gradient(135deg, #e91e8c 0%, #c084fc 100%)" }}
            >
              {profile.initials ?? <User size={28} />}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
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
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Email (read-only) */}
      <div className="mb-4">
        <label className={label}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
        <input
          type="email"
          value={profile.email ?? ""}
          disabled
          className={`${field} opacity-50 cursor-not-allowed`}
        />
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className={label}>{isAr ? "الاسم الكامل" : "Full Name"}</label>
        <input
          type="text"
          value={form.full_name ?? ""}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder={isAr ? "اسمك الكامل" : "Your full name"}
          className={field}
        />
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label className={label}>{isAr ? "رقم الهاتف" : "Phone"}</label>
        <input
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+965 9999 9999"
          className={field}
        />
      </div>

      {/* Date of birth + Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>{isAr ? "تاريخ الميلاد" : "Date of Birth"}</label>
          <input
            type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => set("date_of_birth", e.target.value)}
            className={`${field} [color-scheme:dark]`}
          />
        </div>
        <div>
          <label className={label}>{isAr ? "الجنس" : "Gender"}</label>
          <select
            value={form.gender ?? ""}
            onChange={(e) => set("gender", e.target.value || null)}
            className={field}
          >
            <option value="">{isAr ? "اختر…" : "Select…"}</option>
            <option value="Female">{isAr ? "أنثى" : "Female"}</option>
            <option value="Male">{isAr ? "ذكر" : "Male"}</option>
            <option value="Other">{isAr ? "آخر" : "Other"}</option>
          </select>
        </div>
      </div>

      {/* Country + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>{isAr ? "الدولة" : "Country"}</label>
          <select
            value={form.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            className={field}
          >
            <option value="">{isAr ? "اختر…" : "Select…"}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{isAr ? (COUNTRIES_AR[c] ?? c) : c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>{isAr ? "المدينة" : "City"}</label>
          <input
            type="text"
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            placeholder={isAr ? "مدينتك" : "Your city"}
            className={field}
          />
        </div>
      </div>

      {/* Preferred language */}
      <div className="mb-4">
        <label className={label}>{isAr ? "اللغة المفضلة" : "Preferred Language"}</label>
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

      {/* Bio */}
      <div className="mb-8">
        <label className={label}>{isAr ? "نبذة / أهداف صحية" : "Bio / Health Goals"}</label>
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

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 ${
          toast === "success"
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {toast === "success"
            ? <CheckCircle2 size={16} />
            : <AlertCircle size={16} />}
          {toast === "success"
            ? (isAr ? "تم حفظ الملف الشخصي بنجاح!" : "Profile saved successfully!")
            : (isAr ? "فشل الحفظ. يرجى المحاولة مجدداً." : "Failed to save. Please try again.")}
        </div>
      )}

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
