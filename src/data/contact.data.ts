/**
 * Contact page CMS data — placeholder content.
 *
 * To connect Supabase:
 *   const { data } = await supabase.from('contact_page').select('*').eq('locale', lang).single()
 */
import type { CMSContactData } from "@/types/cms.types";

export const contactData: { en: CMSContactData; ar: CMSContactData } = {
  en: {
    hero: {
      kicker: "Get in Touch",
      headline: "Let's Start a Conversation.",
      subheadline:
        "Whether you have a question about a service, want to learn more about Lipedema care, or are simply ready to take the first step — I'd love to hear from you.",
    },
    info: {
      whatsappNumber: "96599000000",
      whatsappLabel: "Chat on WhatsApp",
      email: "hello@shelan-nutrition.com",
      locationName: "Kuwait City, Kuwait",
      locationDescription:
        "Consultations are conducted online via secure video call, accessible from anywhere in the world.",
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d222.33890856174764!2d47.97852!3d29.3759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDIyJzMzLjIiTiA0N8KwNTgnNDIuNyJF!5e0!3m2!1sen!2skw!4v1620000000000!5m2!1sen!2skw",
      hours: [
        { day: "Monday", hours: "9:00 AM – 6:00 PM" },
        { day: "Tuesday", hours: "9:00 AM – 6:00 PM" },
        { day: "Wednesday", hours: "9:00 AM – 6:00 PM" },
        { day: "Thursday", hours: "9:00 AM – 6:00 PM" },
        { day: "Friday", hours: "10:00 AM – 2:00 PM" },
        { day: "Saturday", hours: "10:00 AM – 4:00 PM" },
        { day: "Sunday", hours: "Closed", closed: true },
      ],
    },
  },

  ar: {
    hero: {
      kicker: "تواصلي معي",
      headline: "لنبدأ محادثة.",
      subheadline:
        "سواء كان لديكِ سؤال عن خدمة، أو تريدين معرفة المزيد عن رعاية الليبيديما، أو كنتِ ببساطة مستعدة لاتخاذ الخطوة الأولى — أود سماعكِ.",
    },
    info: {
      whatsappNumber: "96599000000",
      whatsappLabel: "تحدثي عبر واتساب",
      email: "hello@shelan-nutrition.com",
      locationName: "مدينة الكويت، الكويت",
      locationDescription:
        "تُجرى الاستشارات عبر الإنترنت من خلال مكالمة فيديو آمنة، متاحة من أي مكان في العالم.",
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d222.33890856174764!2d47.97852!3d29.3759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDIyJzMzLjIiTiA0N8KwNTgnNDIuNyJF!5e0!3m2!1sen!2skw!4v1620000000000!5m2!1sen!2skw",
      hours: [
        { day: "الاثنين", hours: "٩:٠٠ ص – ٦:٠٠ م" },
        { day: "الثلاثاء", hours: "٩:٠٠ ص – ٦:٠٠ م" },
        { day: "الأربعاء", hours: "٩:٠٠ ص – ٦:٠٠ م" },
        { day: "الخميس", hours: "٩:٠٠ ص – ٦:٠٠ م" },
        { day: "الجمعة", hours: "١٠:٠٠ ص – ٢:٠٠ م" },
        { day: "السبت", hours: "١٠:٠٠ ص – ٤:٠٠ م" },
        { day: "الأحد", hours: "مغلق", closed: true },
      ],
    },
  },
};
