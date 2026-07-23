import { useLanguage } from "@/context/LanguageContext";
import { useAdminLabels } from "@/admin/hooks/useAdminLabels";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  getGuideSettings,
  updateGuideSettings,
  getLeadEmails,
  deleteLeadEmail,
} from "@/admin/repositories/freeGuide.repository";
import type { FreeGuideSettings, LeadEmail } from "@/admin/repositories/freeGuide.repository";
import FileUploadField from "../components/FileUploadField";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const inp =
  "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const lbl =
  "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

type Tab = "settings" | "emails";

function initForm(): Omit<FreeGuideSettings, "id" | "created_at" | "updated_at"> {
  return {
    title_en: "",
    title_ar: "",
    subtitle_en: "",
    subtitle_ar: "",
    description_en: "",
    description_ar: "",
    cta_text_en: "",
    cta_text_ar: "",
    pdf_url: null,
    email_collection_enabled: true,
    active: true,
  };
}

export default function FreeGuideAdminPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const fl = useAdminLabels();
  const L = (en: string, arStr: string) => (ar ? arStr : en);

  const [settings, setSettings] = useState<FreeGuideSettings | null>(null);
  const [form, setForm] = useState(initForm());
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [emails, setEmails] = useState<LeadEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("settings");

  // ── Load guide settings ──────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    const data = await getGuideSettings();
    setSettings(data);
    if (data) {
      setForm({
        title_en: data.title_en ?? "",
        title_ar: data.title_ar ?? "",
        subtitle_en: data.subtitle_en ?? "",
        subtitle_ar: data.subtitle_ar ?? "",
        description_en: data.description_en ?? "",
        description_ar: data.description_ar ?? "",
        cta_text_en: data.cta_text_en ?? "",
        cta_text_ar: data.cta_text_ar ?? "",
        pdf_url: data.pdf_url ?? null,
        email_collection_enabled: data.email_collection_enabled ?? true,
        active: data.active ?? true,
      });
    }
    setLoadingSettings(false);
  }, []);

  // ── Load lead emails ─────────────────────────────────────────────────────────
  const loadEmails = useCallback(async () => {
    setLoadingEmails(true);
    const data = await getLeadEmails();
    setEmails(data);
    setLoadingEmails(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (activeTab === "emails") {
      loadEmails();
    }
  }, [activeTab, loadEmails]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const ok = await updateGuideSettings(settings.id, form);
    setSaving(false);
    if (!ok) {
      setSaveError(ar ? "فشل الحفظ. يرجى المحاولة مرة أخرى." : "Save failed. Please try again.");
      return;
    }
    setSaveSuccess(true);
    // Refresh settings (e.g., updated_at)
    await loadSettings();
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function handleDeleteEmail(id: string) {
    const confirmed = window.confirm(
      ar
        ? "هل تريد حذف هذا البريد الإلكتروني؟"
        : "Delete this email address?"
    );
    if (!confirmed) return;
    setDeletingId(id);
    await deleteLeadEmail(id);
    setEmails((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  const noPdf = !form.pdf_url;

  return (
    <div>
      <PageHeader
        title={L("Free Guide", "الدليل المجاني")}
        description={L(
          "Manage the free downloadable guide, email collection, and PDF delivery.",
          "إدارة الدليل المجاني القابل للتنزيل وجمع البريد الإلكتروني وتسليم PDF."
        )}
        breadcrumbs={[
          { label: L("Admin", "الإدارة"), href: "/admin" },
          { label: L("Free Guide", "الدليل المجاني") },
        ]}
      />

      {/* Tabs */}
      <motion.div {...fadeUp(0)} className="flex items-center gap-1 mb-5">
        {(["settings", "emails"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
              activeTab === tab
                ? "bg-gradient-to-r from-primary-pink to-lavender-purple text-white shadow-sm"
                : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"
            }`}
          >
            {tab === "settings"
              ? L("Guide Settings", "إعدادات الدليل")
              : L(
                  `Collected Emails${emails.length > 0 ? ` (${emails.length})` : ""}`,
                  `البريد المُجمَّع${emails.length > 0 ? ` (${emails.length})` : ""}`
                )}
          </button>
        ))}
      </motion.div>

      {/* ── SETTINGS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <motion.div {...fadeUp(0.05)} className="space-y-5">
          {/* PDF warning banner */}
          {!loadingSettings && noPdf && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-[13px]">
              <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
              <p>
                {ar
                  ? "لم يُرفع ملف PDF بعد. سيواجه الزوار زر تحميل معطّل. ارفع ملف PDF أعلاه."
                  : "No PDF uploaded yet. Visitors will see a broken download button. Upload a PDF above."}
              </p>
            </div>
          )}

          {loadingSettings ? (
            <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
              {L("Loading…", "جارٍ التحميل…")}
            </div>
          ) : (
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {L("Guide Settings", "إعدادات الدليل")}
                </h2>
                <button
                  onClick={handleSave}
                  disabled={saving || !settings}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving ? L("Saving…", "جارٍ الحفظ…") : L("Save Changes", "حفظ التغييرات")}
                </button>
              </div>

              {/* Error / Success */}
              {saveError && (
                <div className="mx-5 mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">
                  <span className="font-semibold">⚠</span> {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mx-5 mt-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-medium">
                  {L("Changes saved successfully.", "تم حفظ التغييرات بنجاح.")}
                </div>
              )}

              {!settings && !loadingSettings && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
                  {L(
                    "No guide settings found. Please seed the database first.",
                    "لم يتم العثور على إعدادات الدليل. يرجى إعداد قاعدة البيانات أولاً."
                  )}
                </div>
              )}

              {settings && (
                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>{fl("title")} (EN)</label>
                      <input
                        value={form.title_en}
                        onChange={(e) => set("title_en", e.target.value)}
                        className={inp}
                        placeholder={L("Guide title in English", "عنوان الدليل بالإنجليزية")}
                      />
                    </div>
                    <div>
                      <label className={lbl}>{fl("title")} (AR)</label>
                      <input
                        dir="rtl"
                        value={form.title_ar}
                        onChange={(e) => set("title_ar", e.target.value)}
                        className={inp}
                        placeholder={L("Guide title in Arabic", "عنوان الدليل بالعربية")}
                      />
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>
                        {fl("subtitle")} (EN){" "}
                        <span className="font-normal normal-case opacity-60">
                          — {L("optional", "اختياري")}
                        </span>
                      </label>
                      <input
                        value={form.subtitle_en ?? ""}
                        onChange={(e) => set("subtitle_en", e.target.value)}
                        className={inp}
                        placeholder={L("Short subtitle", "عنوان فرعي قصير")}
                      />
                    </div>
                    <div>
                      <label className={lbl}>{fl("subtitle")} (AR)</label>
                      <input
                        dir="rtl"
                        value={form.subtitle_ar ?? ""}
                        onChange={(e) => set("subtitle_ar", e.target.value)}
                        className={inp}
                        placeholder={L("Short subtitle in Arabic", "عنوان فرعي قصير بالعربية")}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>{fl("description")} (EN)</label>
                      <textarea
                        rows={4}
                        value={form.description_en ?? ""}
                        onChange={(e) => set("description_en", e.target.value)}
                        className={`${inp} resize-y`}
                        placeholder={L(
                          "Describe the guide in English…",
                          "وصف الدليل بالإنجليزية…"
                        )}
                      />
                    </div>
                    <div>
                      <label className={lbl}>{fl("description")} (AR)</label>
                      <textarea
                        dir="rtl"
                        rows={4}
                        value={form.description_ar ?? ""}
                        onChange={(e) => set("description_ar", e.target.value)}
                        className={`${inp} resize-y`}
                        placeholder={L(
                          "Describe the guide in Arabic…",
                          "وصف الدليل بالعربية…"
                        )}
                      />
                    </div>
                  </div>

                  {/* CTA Button Text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>{fl("ctaButton")} (EN)</label>
                      <input
                        value={form.cta_text_en}
                        onChange={(e) => set("cta_text_en", e.target.value)}
                        className={inp}
                        placeholder={L("e.g. Download Free Guide", "مثال: تنزيل الدليل المجاني")}
                      />
                    </div>
                    <div>
                      <label className={lbl}>{fl("ctaButton")} (AR)</label>
                      <input
                        dir="rtl"
                        value={form.cta_text_ar}
                        onChange={(e) => set("cta_text_ar", e.target.value)}
                        className={inp}
                        placeholder="تنزيل الدليل المجاني"
                      />
                    </div>
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <label className={lbl}>
                      {L("PDF File", "ملف PDF")}
                      {noPdf && (
                        <span className="ms-2 text-amber-600 font-semibold normal-case">
                          {L("— not uploaded yet", "— لم يُرفع بعد")}
                        </span>
                      )}
                    </label>
                    <FileUploadField
                      value={form.pdf_url ?? ""}
                      onChange={(url) => set("pdf_url", url || null)}
                      accept="application/pdf,image/*"
                      folder="guides"
                      lang={lang}
                      placeholder="https://…"
                    />
                    {form.pdf_url && (
                      <a
                        href={form.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1.5 text-[11px] text-primary-pink hover:underline"
                      >
                        {L("Preview PDF ↗", "معاينة PDF ↗")}
                      </a>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="border-t border-[var(--admin-border)] pt-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        id="guide-email-collection"
                        type="checkbox"
                        checked={form.email_collection_enabled}
                        onChange={(e) => set("email_collection_enabled", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label
                        htmlFor="guide-email-collection"
                        className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none"
                      >
                        {L(
                          "Email collection enabled (require email before PDF download)",
                          "تفعيل جمع البريد الإلكتروني (يُطلب البريد قبل تنزيل PDF)"
                        )}
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        id="guide-active"
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => set("active", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label
                        htmlFor="guide-active"
                        className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none"
                      >
                        {L("Active (visible on site)", "نشط (مرئي على الموقع)")}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF warning banner below form too (for visibility) */}
          {!loadingSettings && noPdf && settings && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-[13px]">
              <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
              <p>
                {ar
                  ? "لم يُرفع ملف PDF بعد. سيواجه الزوار زر تحميل معطّل. ارفع ملف PDF أعلاه."
                  : "No PDF uploaded yet. Visitors will see a broken download button. Upload a PDF above."}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── EMAILS TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "emails" && (
        <motion.div {...fadeUp(0.05)}>
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
              <p className="text-[13px] text-[var(--admin-text-muted)]">
                {ar
                  ? `${emails.length} بريد إلكتروني مُجمَّع`
                  : `${emails.length} collected email${emails.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {loadingEmails ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                {L("Loading…", "جارٍ التحميل…")}
              </div>
            ) : emails.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                {L("No emails collected yet.", "لم يُجمَّع أي بريد إلكتروني بعد.")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--admin-hover-bg)]">
                    <tr>
                      {[
                        L("Email", "البريد الإلكتروني"),
                        L("Date Collected", "تاريخ الجمع"),
                        L("Actions", "إجراءات"),
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors"
                      >
                        <td className="py-3 px-4 text-[13px] text-[var(--admin-text)] font-medium">
                          {e.email}
                        </td>
                        <td className="py-3 px-4 text-[13px] text-[var(--admin-text-muted)]">
                          {formatDate(e.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteEmail(e.id)}
                            disabled={deletingId === e.id}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            {deletingId === e.id ? "…" : L("Delete", "حذف")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
