/**
 * AdminProfilePage — administrator's own account settings.
 *
 * Sections:
 *   1. Identity   — initials avatar, display name (editable), email (read-only), role badge
 *   2. Security   — change password
 *   3. Preferences — language, theme
 *
 * Data sources:
 *   • supabase.auth.getUser()  → email, user_metadata.full_name
 *   • admin_profiles table     → role, created_at
 *
 * Never loads any client medical data.
 */
import { useState, useEffect } from "react";
import {
  User, Mail, Shield, Key, Globe, Sun, Moon,
  Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { useAdmin } from "../context/AdminContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminInfo {
  email:     string;
  fullName:  string;
  role:      "admin" | "staff";
  joinedAt:  string;
}

type StatusMsg = { type: "success" | "error"; text: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (name.trim()) return name.trim()[0].toUpperCase();
  return (email[0] ?? "A").toUpperCase();
}

function RoleBadge({ role }: { role: "admin" | "staff" }) {
  const cls =
    role === "admin"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : "bg-blue-100 text-blue-700 border-blue-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <Shield size={11} />
      {role === "admin" ? "Administrator" : "Staff"}
    </span>
  );
}

function Feedback({ msg }: { msg: StatusMsg }) {
  const ok = msg.type === "success";
  return (
    <div
      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg.text}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({
  title,
  icon: Icon,
  children,
}: {
  title:    string;
  icon:     React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--admin-border)]">
        <div className="w-8 h-8 rounded-lg bg-primary-pink/10 flex items-center justify-center">
          <Icon size={15} className="text-primary-pink" />
        </div>
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field components ─────────────────────────────────────────────────────────

const inputCls = `
  w-full h-10 px-3 rounded-lg text-sm
  bg-[var(--admin-bg)] border border-[var(--admin-border)]
  text-[var(--admin-text)] placeholder:text-[var(--admin-text-faint)]
  focus:outline-none focus:ring-2 focus:ring-primary-pink/30 focus:border-primary-pink/50
`;

const btnPrimaryCls = `
  inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
  bg-primary-pink text-white hover:bg-primary-pink/90
  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
`;

const btnSecondCls = `
  flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
  bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)]
  hover:bg-[var(--admin-border)] hover:text-[var(--admin-text)]
  transition-colors border border-[var(--admin-border)]
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useAdmin();

  const [info,       setInfo]       = useState<AdminInfo | null>(null);
  const [loading,    setLoading]    = useState(true);

  // Name
  const [nameValue,  setNameValue]  = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameStatus, setNameStatus] = useState<StatusMsg | null>(null);

  // Password
  const [pwNew,        setPwNew]        = useState("");
  const [pwConfirm,    setPwConfirm]    = useState("");
  const [pwShowNew,    setPwShowNew]    = useState(false);
  const [pwShowConf,   setPwShowConf]   = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [pwStatus,     setPwStatus]     = useState<StatusMsg | null>(null);

  const isAr = lang === "ar";

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: ap } = await supabase
        .from("admin_profiles")
        .select("role, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const name = (user.user_metadata?.full_name as string | undefined) ?? "";
      const loaded: AdminInfo = {
        email:    user.email ?? "",
        fullName: name,
        role:     (ap?.role as "admin" | "staff") ?? "staff",
        joinedAt: ap?.created_at ?? user.created_at ?? "",
      };
      setInfo(loaded);
      setNameValue(name);
      setLoading(false);
    }
    load();
  }, []);

  // ── Save name ───────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setNameSaving(true);
    setNameStatus(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    if (error) {
      setNameStatus({ type: "error", text: error.message });
    } else {
      setInfo((p) => (p ? { ...p, fullName: trimmed } : p));
      setNameStatus({
        type: "success",
        text: isAr ? "تم حفظ الاسم بنجاح" : "Name updated successfully",
      });
    }
    setNameSaving(false);
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwNew) return;
    if (pwNew !== pwConfirm) {
      setPwStatus({
        type: "error",
        text: isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
      });
      return;
    }
    if (pwNew.length < 8) {
      setPwStatus({
        type: "error",
        text: isAr
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"
          : "Password must be at least 8 characters",
      });
      return;
    }
    setPwSaving(true);
    setPwStatus(null);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    if (error) {
      setPwStatus({ type: "error", text: error.message });
    } else {
      setPwStatus({
        type: "success",
        text: isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully",
      });
      setPwNew("");
      setPwConfirm("");
    }
    setPwSaving(false);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl h-48 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const inits = info ? getInitials(info.fullName, info.email) : "A";

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6" dir={isAr ? "rtl" : "ltr"}>

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--admin-text)]">
          {isAr ? "ملفي الشخصي" : "My Profile"}
        </h1>
        <p className="text-sm text-[var(--admin-text-muted)] mt-1">
          {isAr
            ? "إدارة معلومات حسابك وإعدادات الأمان والتفضيلات"
            : "Manage your account information, security settings, and preferences"}
        </p>
      </div>

      {/* ── 1. Identity ─────────────────────────────────────────────────────── */}
      <Card title={isAr ? "الهوية" : "Identity"} icon={User}>
        {/* Avatar + role summary */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white text-xl font-bold shadow-md select-none shrink-0">
            {inits}
          </div>
          <div>
            <p className="font-semibold text-[var(--admin-text)] text-base leading-snug">
              {info?.fullName || info?.email}
            </p>
            <p className="text-xs text-[var(--admin-text-faint)] mb-2">{info?.email}</p>
            {info && <RoleBadge role={info.role} />}
          </div>
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--admin-text-muted)]">
            {isAr ? "الاسم الكامل" : "Display Name"}
          </label>
          <input
            type="text"
            value={nameValue}
            onChange={(e) => { setNameValue(e.target.value); setNameStatus(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            className={inputCls}
            placeholder={isAr ? "اسمك الكامل" : "Your full name"}
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5 mt-4">
          <label className="block text-xs font-medium text-[var(--admin-text-muted)]">
            {isAr ? "البريد الإلكتروني" : "Email Address"}
            <span className="ms-2 text-[10px] text-[var(--admin-text-faint)]">
              ({isAr ? "لا يمكن تغييره" : "cannot be changed"})
            </span>
          </label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-[var(--admin-hover-bg)] border border-[var(--admin-border)] text-sm text-[var(--admin-text-muted)]">
            <Mail size={14} className="text-[var(--admin-text-faint)] shrink-0" />
            {info?.email}
          </div>
        </div>

        {nameStatus && (
          <div className="mt-3">
            <Feedback msg={nameStatus} />
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveName}
            disabled={nameSaving || nameValue.trim() === info?.fullName}
            className={btnPrimaryCls}
          >
            {nameSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isAr ? "حفظ" : "Save"}
          </button>
        </div>
      </Card>

      {/* ── 2. Security ─────────────────────────────────────────────────────── */}
      <Card title={isAr ? "الأمان" : "Security"} icon={Key}>
        <div className="space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--admin-text-muted)]">
              {isAr ? "كلمة المرور الجديدة" : "New Password"}
            </label>
            <div className="relative">
              <input
                type={pwShowNew ? "text" : "password"}
                value={pwNew}
                onChange={(e) => { setPwNew(e.target.value); setPwStatus(null); }}
                className={`${inputCls} pe-10`}
                placeholder={isAr ? "8 أحرف على الأقل" : "At least 8 characters"}
              />
              <button
                type="button"
                onClick={() => setPwShowNew((v) => !v)}
                className="absolute inset-y-0 end-0 px-3 flex items-center text-[var(--admin-text-faint)] hover:text-[var(--admin-text-muted)]"
              >
                {pwShowNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--admin-text-muted)]">
              {isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
            </label>
            <div className="relative">
              <input
                type={pwShowConf ? "text" : "password"}
                value={pwConfirm}
                onChange={(e) => { setPwConfirm(e.target.value); setPwStatus(null); }}
                className={`${inputCls} pe-10`}
                placeholder={isAr ? "أعد إدخال كلمة المرور الجديدة" : "Re-enter new password"}
              />
              <button
                type="button"
                onClick={() => setPwShowConf((v) => !v)}
                className="absolute inset-y-0 end-0 px-3 flex items-center text-[var(--admin-text-faint)] hover:text-[var(--admin-text-muted)]"
              >
                {pwShowConf ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {pwStatus && <Feedback msg={pwStatus} />}

          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !pwNew || !pwConfirm}
              className={btnPrimaryCls}
            >
              {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              {isAr ? "تغيير كلمة المرور" : "Change Password"}
            </button>
          </div>
        </div>
      </Card>

      {/* ── 3. Preferences ──────────────────────────────────────────────────── */}
      <Card title={isAr ? "التفضيلات" : "Preferences"} icon={Globe}>
        <div className="space-y-1">
          {/* Language */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[var(--admin-text)]">
                {isAr ? "اللغة" : "Language"}
              </p>
              <p className="text-xs text-[var(--admin-text-faint)] mt-0.5">
                {isAr ? "اللغة الحالية: العربية" : "Current: English"}
              </p>
            </div>
            <button onClick={toggleLang} className={btnSecondCls}>
              <Globe size={14} />
              {lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
            </button>
          </div>

          <div className="h-px bg-[var(--admin-border)]" />

          {/* Theme */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[var(--admin-text)]">
                {isAr ? "المظهر" : "Theme"}
              </p>
              <p className="text-xs text-[var(--admin-text-faint)] mt-0.5">
                {theme === "light"
                  ? (isAr ? "الوضع الفاتح مفعّل" : "Light mode active")
                  : (isAr ? "الوضع الداكن مفعّل" : "Dark mode active")}
              </p>
            </div>
            <button onClick={toggleTheme} className={btnSecondCls}>
              {theme === "light"
                ? <><Moon size={14} />{isAr ? "الوضع الداكن" : "Dark Mode"}</>
                : <><Sun  size={14} />{isAr ? "الوضع الفاتح" : "Light Mode"}</>}
            </button>
          </div>
        </div>
      </Card>

    </div>
  );
}
