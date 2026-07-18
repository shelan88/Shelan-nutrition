/**
 * BundlePickerModal
 *
 * Shown when the admin clicks "New Template". Offers two paths:
 *   - Blank template
 *   - Start from one of the 5 built-in bundles
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Layers } from "lucide-react";
import { ASSESSMENT_BUNDLES } from "@/admin/data/assessment-bundles";
import type { AssessmentBundle } from "@/admin/data/assessment-bundles";

interface Props {
  open: boolean;
  onClose: () => void;
  onBlank: () => void;
  onBundle: (bundle: AssessmentBundle) => void;
  creating: boolean;
  isAr: boolean;
}

export default function BundlePickerModal({ open, onClose, onBlank, onBundle, creating, isAr }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--admin-border)]">
              <div>
                <h2 className="text-[15px] font-bold text-[var(--admin-text)]">
                  {isAr ? "إنشاء قالب جديد" : "Create New Template"}
                </h2>
                <p className="text-[12px] text-[var(--admin-text-muted)] mt-0.5">
                  {isAr ? "ابدأ من الصفر أو اختر حزمة جاهزة" : "Start from scratch or pick a ready-made bundle"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Blank option */}
              <button
                onClick={onBlank}
                disabled={creating}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-dashed border-[var(--admin-border)] hover:border-primary-pink/40 hover:bg-primary-pink/3 transition-all text-start group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--admin-hover-bg)] flex items-center justify-center shrink-0 group-hover:bg-primary-pink/10 transition-colors">
                  <FileText size={18} className="text-[var(--admin-text-muted)] group-hover:text-primary-pink transition-colors" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[var(--admin-text)]">
                    {isAr ? "قالب فارغ" : "Blank Template"}
                  </p>
                  <p className="text-[12px] text-[var(--admin-text-muted)] mt-0.5">
                    {isAr ? "ابدأ بقالب فارغ وأضف أسئلتك الخاصة" : "Start empty and build your questions from scratch"}
                  </p>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--admin-border)]" />
                <span className="text-[11px] text-[var(--admin-text-faint)] uppercase tracking-wide font-semibold flex items-center gap-1.5">
                  <Layers size={11} /> {isAr ? "الحزم الجاهزة" : "Starter Bundles"}
                </span>
                <div className="flex-1 h-px bg-[var(--admin-border)]" />
              </div>

              {/* Bundle cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ASSESSMENT_BUNDLES.map((bundle) => (
                  <button
                    key={bundle.id}
                    onClick={() => onBundle(bundle)}
                    disabled={creating}
                    className="flex items-start gap-3 px-4 py-4 rounded-xl border border-[var(--admin-border)] hover:border-primary-pink/40 hover:shadow-md transition-all text-start bg-[var(--admin-surface)] hover:bg-[var(--admin-hover-bg)] group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className={`w-10 h-10 rounded-xl ${bundle.color} flex items-center justify-center text-lg shrink-0`}>
                      {bundle.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[var(--admin-text)] leading-tight">
                        {isAr ? bundle.name_ar : bundle.name_en}
                      </p>
                      <p className="text-[11px] text-[var(--admin-text-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {isAr ? bundle.description_ar : bundle.description_en}
                      </p>
                      <p className="text-[11px] font-semibold text-primary-pink mt-2">
                        {bundle.questions.length} {isAr ? "سؤال" : "questions"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {creating && (
              <div className="px-6 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
                <div className="flex items-center gap-3 text-[13px] text-[var(--admin-text-muted)]">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-pink/30 border-t-primary-pink animate-spin" />
                  {isAr ? "جارٍ إنشاء القالب…" : "Creating template…"}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
