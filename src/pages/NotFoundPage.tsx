/**
 * NotFoundPage — 404 catch-all for unmatched public routes.
 */
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useSEO } from "@/hooks/useSEO";

export default function NotFoundPage() {
  const { lang } = useLanguage();

  useSEO({
    title: lang === "ar" ? "الصفحة غير موجودة | SHELAN" : "Page Not Found | SHELAN",
    description:
      lang === "ar"
        ? "الصفحة التي تبحثين عنها غير موجودة. عودي إلى الصفحة الرئيسية."
        : "The page you're looking for doesn't exist. Return to the homepage.",
    path: "/404",
    lang,
    noIndex: true,
  });

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 text-center py-32">
      <p className="text-7xl font-heading font-bold text-primary-pink">404</p>
      <h1 className="font-heading text-2xl font-bold text-heading">
        {lang === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
      </h1>
      <p className="text-body opacity-70 max-w-md">
        {lang === "ar"
          ? "الصفحة التي تبحثين عنها غير موجودة أو تمت إزالتها."
          : "The page you're looking for doesn't exist or has been removed."}
      </p>
      <Link
        to="/"
        className="px-7 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
      >
        {lang === "ar" ? "العودة إلى الرئيسية" : "Back to Home"}
      </Link>
    </main>
  );
}
