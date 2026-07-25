/**
 * src/lib/authErrors.ts
 *
 * Translates raw Supabase AuthError objects into user-friendly, localized
 * strings.  Raw Supabase messages (e.g. "Invalid login credentials") must
 * never be shown directly in the UI.
 *
 * Usage:
 *   import { localizeAuthError } from "@/lib/authErrors";
 *   const msg = localizeAuthError(error, lang);
 */

import type { AuthError } from "@supabase/supabase-js";

type Lang = "en" | "ar";

interface Messages {
  en: string;
  ar: string;
}

// ── Per-error-code friendly messages ─────────────────────────────────────────

const ERROR_MAP: Record<string, Messages> = {
  // Wrong email or password on sign-in
  invalid_credentials: {
    en: "Incorrect email or password.",
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  },

  // Signup with an already-registered email
  email_address_already_registered: {
    en: "An account with this email already exists.",
    ar: "يوجد حساب مرتبط بهذا البريد الإلكتروني بالفعل.",
  },
  // Supabase also surfaces this as "User already registered"
  user_already_registered: {
    en: "An account with this email already exists.",
    ar: "يوجد حساب مرتبط بهذا البريد الإلكتروني بالفعل.",
  },

  // Password too short / fails policy
  weak_password: {
    en: "Password is too weak. Please choose a stronger password.",
    ar: "كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.",
  },

  // updateUser — new password is the same as the current one
  same_password: {
    en: "New password must be different from the current one.",
    ar: "يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية.",
  },

  // Email not yet confirmed
  email_not_confirmed: {
    en: "Please confirm your email address before signing in.",
    ar: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.",
  },

  // Too many requests
  over_request_rate_limit: {
    en: "Too many attempts. Please wait a moment and try again.",
    ar: "عدد المحاولات كثير جداً. يرجى الانتظار قليلاً والمحاولة مجدداً.",
  },
  over_email_send_rate_limit: {
    en: "Too many attempts. Please wait a moment and try again.",
    ar: "عدد المحاولات كثير جداً. يرجى الانتظار قليلاً والمحاولة مجدداً.",
  },
};

// ── Message-substring fallbacks (for errors Supabase returns without a code) ─

const MESSAGE_FRAGMENTS: Array<{ fragment: string; messages: Messages }> = [
  {
    fragment: "invalid login credentials",
    messages: ERROR_MAP.invalid_credentials,
  },
  {
    fragment: "invalid_credentials",
    messages: ERROR_MAP.invalid_credentials,
  },
  {
    fragment: "user already registered",
    messages: ERROR_MAP.user_already_registered,
  },
  {
    fragment: "email already",
    messages: ERROR_MAP.email_address_already_registered,
  },
  {
    fragment: "password should be",
    messages: ERROR_MAP.weak_password,
  },
  {
    fragment: "same password",
    messages: ERROR_MAP.same_password,
  },
  {
    fragment: "new password should be different",
    messages: ERROR_MAP.same_password,
  },
  {
    fragment: "email not confirmed",
    messages: ERROR_MAP.email_not_confirmed,
  },
  {
    fragment: "rate limit",
    messages: ERROR_MAP.over_request_rate_limit,
  },
];

// ── Generic fallback ──────────────────────────────────────────────────────────

const GENERIC: Messages = {
  en: "Something went wrong. Please try again.",
  ar: "حدث خطأ ما. يرجى المحاولة مجدداً.",
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert a Supabase AuthError into a user-friendly localized string.
 * Never returns a raw Supabase message.
 */
export function localizeAuthError(error: AuthError, lang: Lang): string {
  // 1. Try exact code match first (most reliable)
  if (error.code) {
    const mapped = ERROR_MAP[error.code];
    if (mapped) return mapped[lang];
  }

  // 2. Try substring match on the raw message (case-insensitive)
  const lower = error.message?.toLowerCase() ?? "";
  for (const { fragment, messages } of MESSAGE_FRAGMENTS) {
    if (lower.includes(fragment)) return messages[lang];
  }

  // 3. Generic fallback — never expose the raw Supabase string
  return GENERIC[lang];
}
