/**
 * ContactForm — Controlled form with subject dropdown and success state.
 * Props-only for strings, CMS-ready for labels.
 * No backend. When ready: replace handleSubmit with fetch/Supabase call.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface ContactFormStrings {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  subjectLabel: string;
  subjects: string[];
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successText: string;
}

interface Props {
  strings: ContactFormStrings;
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const INITIAL: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all";

const labelClass = "block text-sm font-semibold text-heading mb-1.5";

export default function ContactForm({ strings }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.subject) e.subject = "Please select a subject";
    if (!form.message.trim() || form.message.length < 10) e.message = "Please write at least 10 characters";
    return e;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    // Placeholder: replace with your API / Supabase call
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <div className="bg-white rounded-3xl p-8 lg:p-10 border border-soft-purple/12 shadow-lg shadow-deep-purple/8 h-full">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center h-full min-h-64 gap-5 py-12"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-lg shadow-deep-purple/20">
              <CheckCircle2 size={30} className="text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold text-heading">{strings.successTitle}</h3>
            <p className="text-body leading-relaxed max-w-xs">{strings.successText}</p>
            <button
              onClick={() => { setSuccess(false); setForm(INITIAL); }}
              className="mt-2 text-sm font-semibold text-primary-pink hover:text-deep-purple transition-colors"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Name + Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{strings.nameLabel}</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={strings.namePlaceholder}
                  className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>{strings.emailLabel}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={strings.emailPlaceholder}
                  className={`${inputClass} ${errors.email ? "border-red-400" : ""}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Phone + Subject */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{strings.phoneLabel}</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={strings.phonePlaceholder}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{strings.subjectLabel}</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.subject ? "border-red-400" : ""} cursor-pointer`}
                >
                  <option value="">— Select —</option>
                  {strings.subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={labelClass}>{strings.messageLabel}</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={strings.messagePlaceholder}
                rows={5}
                className={`${inputClass} resize-none ${errors.message ? "border-red-400" : ""}`}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl hover:shadow-deep-purple/30 transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? strings.submittingLabel : strings.submitLabel}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
