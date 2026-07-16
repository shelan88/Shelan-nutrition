/**
 * ContactPage — Contact form + info panel in a two-column layout.
 *
 * To connect Supabase (form submission):
 *   In ContactForm.tsx, replace the setTimeout in handleSubmit with:
 *   await supabase.from('contact_submissions').insert({ ...form, created_at: new Date().toISOString() })
 */
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { contactData } from "@/data/contact.data";
import { contactFormStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import ContactForm from "@/sections/contact/ContactForm";
import ContactInfo from "@/sections/contact/ContactInfo";
import CTABanner from "@/components/ui/CTABanner";

export default function ContactPage() {
  const { lang } = useLanguage();
  const data = contactData[lang];
  const str = contactFormStrings[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "تواصلي معي | SHELAN" : "Contact | SHELAN Nutrition";
  }, [lang]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "تواصلي معي" : "Contact" },
  ];

  const ctaData = {
    kicker: lang === "ar" ? "أو ابدأي مباشرةً" : "Or Jump Right In",
    headline: lang === "ar" ? "احجزي استشارتكِ الأولى." : "Book Your First Consultation.",
    description:
      lang === "ar"
        ? "لا تحتاجين للانتظار — احجزي الآن واتخذي الخطوة الأولى نحو صحتكِ."
        : "Don't wait — book now and take the first step toward your health transformation.",
    buttonLabel: lang === "ar" ? "احجزي الآن" : "Book Now",
    buttonHref: "/booking",
  };

  return (
    <>
      <PageHero
        kicker={data.hero.kicker}
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        breadcrumbs={breadcrumbs}
      />

      <section className="py-20 bg-light-pink/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_420px] gap-10 xl:gap-16 items-start">
            <ContactForm strings={str} />
            <ContactInfo
              info={data.info}
              strings={{
                whatsappLabel: data.info.whatsappLabel,
                emailLabel2: str.emailLabel2,
                locationLabel: str.locationLabel,
                hoursLabel: str.hoursLabel,
                closedLabel: str.closedLabel,
              }}
            />
          </div>
        </div>
      </section>

      <CTABanner {...ctaData} />
    </>
  );
}
