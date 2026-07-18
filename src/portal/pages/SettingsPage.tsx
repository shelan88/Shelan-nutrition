/**
 * Portal — Settings
 * Change password, language preference, notification toggles, delete account.
 */

import { useState } from "react";
import { Lock, Globe, Bell, Trash2, AlertTriangle, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import { deactivateOwnAccount } from "@/portal/repositories/profile.repository";
import { updateOwnProfile } from "@/portal/repositories/profile.repository";

const field = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/40 transition-all";
const label = "block text-xs font-medium text-ivory/50 mb-1.5 uppercase tracking-wide";

function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mt-3 ${
      type === "success"
        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        : "bg-red-500/10 border border-red-500/20 text-red-400"
    }`}>
      {type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-primary-pink/70">{icon}</span>
        <h2 className="font-heading text-base font-semibold text-ivory">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [current, setCurrent]   = useState("");
  const [next,    setNext]      = useState("");
  const [confirm, setConfirm]   = useState("");
  const [show1,   setShow1]     = useState(false);
  const [show2,   setShow2]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [toast,   setToast]     = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setToast({ type: "error", msg: isAr ? "كلمتا المرور الجديدتان غير متطابقتين." : "New passwords do not match." });
      return;
    }
    if (next.length < 8) {
      setToast({ type: "error", msg: isAr ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Password must be at least 8 characters." });
      return;
    }
    setLoading(true);

    // Re-authenticate to verify current password
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: current,
      });
      if (signInError) {
        setToast({ type: "error", msg: isAr ? "كلمة المرور الحالية غير صحيحة." : "Current password is incorrect." });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (error) {
      setToast({ type: "error", msg: error.message });
    } else {
      setToast({ type: "success", msg: isAr ? "تم تحديث كلمة المرور بنجاح." : "Password updated successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    }
    setTimeout(() => setToast(null), 4000);
  };

  const PasswordField = ({
    value, onChange, show, toggleShow, placeholder,
  }: {
    value: string; onChange: (v: string) => void;
    show: boolean; toggleShow: () => void; placeholder: string;
  }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${field} pe-12`}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute top-1/2 -translate-y-1/2 end-4 text-ivory/30 hover:text-ivory/60 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  return (
    <SectionCard title={isAr ? "تغيير كلمة المرور" : "Change Password"} icon={<Lock size={16} />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{isAr ? "كلمة المرور الحالية" : "Current Password"}</label>
          <PasswordField
            value={current} onChange={setCurrent}
            show={show1} toggleShow={() => setShow1((v) => !v)}
            placeholder={isAr ? "أدخل كلمة المرور الحالية" : "Enter current password"}
          />
        </div>
        <div>
          <label className={label}>{isAr ? "كلمة المرور الجديدة" : "New Password"}</label>
          <PasswordField
            value={next} onChange={setNext}
            show={show2} toggleShow={() => setShow2((v) => !v)}
            placeholder={isAr ? "8 أحرف على الأقل" : "Min 8 characters"}
          />
        </div>
        <div>
          <label className={label}>{isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</label>
          <PasswordField
            value={confirm} onChange={setConfirm}
            show={show2} toggleShow={() => setShow2((v) => !v)}
            placeholder={isAr ? "أعد إدخال كلمة المرور الجديدة" : "Repeat new password"}
          />
        </div>
        {toast && <Toast type={toast.type} message={toast.msg} />}
        <button
          type="submit"
          disabled={loading || !current || !next || !confirm}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading
            ? (isAr ? "جارٍ التحديث…" : "Updating…")
            : (isAr ? "تحديث كلمة المرور" : "Update Password")}
        </button>
      </form>
    </SectionCard>
  );
}

// ─── Language Preference ──────────────────────────────────────────────────────

function LanguageSection() {
  const { lang, setLang } = useLanguage();
  const isAr = lang === "ar";
  const { profile, refresh } = useClientProfile();
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleChange = async (value: "en" | "ar") => {
    setLang(value);
    if (!profile) return;
    setSaving(true);
    const ok = await updateOwnProfile(profile.id, { preferred_language: value });
    setSaving(false);
    if (ok) {
      setToast({ type: "success", msg: value === "ar" ? "تم حفظ تفضيل اللغة." : "Language preference saved." });
      refresh();
    } else {
      setToast({ type: "error", msg: isAr ? "فشل حفظ التفضيل." : "Failed to save preference." });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <SectionCard title={isAr ? "تفضيل اللغة" : "Language Preference"} icon={<Globe size={16} />}>
      <div className="flex gap-3">
        {(["en", "ar"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => handleChange(l)}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
              lang === l
                ? "border-primary-pink bg-primary-pink/10 text-primary-pink"
                : "border-white/10 bg-white/5 text-ivory/50 hover:border-white/20 hover:text-ivory"
            }`}
          >
            {l === "en" ? "🇬🇧 English" : "🇸🇦 العربية"}
          </button>
        ))}
      </div>
      {saving && <p className="text-xs text-ivory/40 mt-2">{isAr ? "جارٍ الحفظ…" : "Saving…"}</p>}
      {toast && <Toast type={toast.type} message={toast.msg} />}
    </SectionCard>
  );
}

// ─── Notification Preferences (stored in localStorage) ────────────────────────

function NotificationsSection() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const stored = localStorage.getItem("shelan-notif");
  const defaults = stored ? JSON.parse(stored) : { email_updates: true, appointment_reminders: true };
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaults);

  const toggle = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem("shelan-notif", JSON.stringify(next));
  };

  const toggles = [
    {
      key: "email_updates",
      label: isAr ? "تحديثات البريد الإلكتروني من SHELAN" : "Email updates from SHELAN",
    },
    {
      key: "appointment_reminders",
      label: isAr ? "إشعارات تذكير المواعيد" : "Appointment reminder notifications",
    },
  ];

  return (
    <SectionCard title={isAr ? "تفضيلات الإشعارات" : "Notification Preferences"} icon={<Bell size={16} />}>
      <p className="text-xs text-ivory/40 mb-4">
        {isAr
          ? "يتم حفظ التفضيلات محلياً على هذا الجهاز."
          : "Preferences are saved locally on this device."}
      </p>
      <div className="space-y-3">
        {toggles.map(({ key, label: toggleLabel }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-ivory/70">{toggleLabel}</span>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 rounded-full border transition-colors ${
                prefs[key]
                  ? "bg-primary-pink border-primary-pink"
                  : "bg-white/10 border-white/10"
              }`}
              role="switch"
              aria-checked={prefs[key]}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[key] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Delete Account ───────────────────────────────────────────────────────────

function DeleteAccountSection() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { profile } = useClientProfile();
  const [confirm,  setConfirm]  = useState("");
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

  const handleDelete = async () => {
    if (!profile) return;
    setLoading(true);
    const ok = await deactivateOwnAccount(profile.id);
    if (!ok) {
      setToast({ type: "error", msg: isAr ? "فشل إلغاء تفعيل الحساب. يرجى التواصل مع الدعم." : "Failed to deactivate account. Please contact support." });
      setLoading(false);
    }
    // On success, deactivateOwnAccount calls supabase.auth.signOut() — the app will redirect.
  };

  return (
    <SectionCard title={isAr ? "حذف الحساب" : "Delete Account"} icon={<Trash2 size={16} />}>
      <p className="text-sm text-ivory/50 mb-4">
        {isAr
          ? "سيؤدي حذف حسابك إلى تسجيل خروجك وتعطيل ملفك الشخصي. سيتم الاحتفاظ ببياناتك في سجلات أخصائي التغذية."
          : "Deleting your account will sign you out and mark your profile as inactive. Your data will be retained for the nutritionist's records."}
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} /> {isAr ? "حذف حسابي" : "Delete My Account"}
        </button>
      ) : (
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={15} />
            <p className="text-sm text-red-300">
              {isAr
                ? <>اكتب <strong className="font-mono">{CONFIRM_PHRASE}</strong> للتأكيد:</>
                : <>Type <strong className="font-mono">{CONFIRM_PHRASE}</strong> to confirm:</>}
            </p>
          </div>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className={`${field} border-red-500/20 focus:ring-red-400/20`}
          />
          {toast && <Toast type={toast.type} message={toast.msg} />}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirm(""); }}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-ivory/60 hover:text-ivory transition-colors"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirm !== CONFIRM_PHRASE || loading}
              className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {loading
                ? (isAr ? "جارٍ المعالجة…" : "Processing…")
                : (isAr ? "تأكيد الحذف" : "Confirm Delete")}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-ivory">
        {isAr ? "الإعدادات" : "Settings"}
      </h1>
      <ChangePasswordSection />
      <LanguageSection />
      <NotificationsSection />
      <DeleteAccountSection />
    </div>
  );
}
