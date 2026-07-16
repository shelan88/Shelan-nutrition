/**
 * Booking page CMS data — placeholder content.
 *
 * To connect Supabase:
 *   const { data } = await supabase.from('booking_services').select('*').eq('locale', lang)
 *   const { data: slots } = await supabase.from('time_slots').select('*').eq('date', selectedDate)
 */
import type { CMSBookingData } from "@/types/cms.types";

export const bookingData: { en: CMSBookingData; ar: CMSBookingData } = {
  en: {
    hero: {
      kicker: "Take the First Step",
      headline: "Book Your Consultation.",
      subheadline:
        "Choose your service, pick a time that works for you, and let's begin building your personalized path to wellness.",
    },
    services: [
      {
        id: "svc-001",
        name: "Initial Consultation",
        duration: "60 minutes",
        price: "$65",
        priceNote: "one-time session",
        description:
          "A comprehensive first session covering your health history, goals, and a personalized nutrition overview. Perfect for getting started.",
        iconName: "Calendar",
      },
      {
        id: "svc-002",
        name: "3-Month Wellness Program",
        duration: "3 months",
        price: "$350",
        priceNote: "full program",
        description:
          "Our most popular option. Six sessions over 3 months with full plan design, regular follow-ups, and direct messaging support.",
        iconName: "Star",
      },
      {
        id: "svc-003",
        name: "Monthly Follow-Up",
        duration: "30 minutes",
        price: "$120",
        priceNote: "per month",
        description:
          "Ongoing monthly sessions for existing clients. Review progress, refine your plan, and stay on track with your goals.",
        iconName: "RefreshCw",
      },
    ],
    timeSlots: [
      { time: "9:00 AM", available: true },
      { time: "9:30 AM", available: false },
      { time: "10:00 AM", available: true },
      { time: "10:30 AM", available: true },
      { time: "11:00 AM", available: false },
      { time: "11:30 AM", available: true },
      { time: "12:00 PM", available: false },
      { time: "1:00 PM", available: true },
      { time: "1:30 PM", available: true },
      { time: "2:00 PM", available: true },
      { time: "2:30 PM", available: false },
      { time: "3:00 PM", available: true },
      { time: "4:00 PM", available: true },
      { time: "4:30 PM", available: true },
      { time: "5:00 PM", available: false },
    ],
    paymentNote:
      "Payment is processed securely after your booking is confirmed. No charge until you confirm.",
    confirmButtonLabel: "Confirm Booking",
    successMessage:
      "Your booking is confirmed! Check your email for the session details and video call link.",
  },

  ar: {
    hero: {
      kicker: "اتخذي الخطوة الأولى",
      headline: "احجزي استشارتكِ.",
      subheadline:
        "اختاري خدمتكِ، وحددي وقتاً يناسبكِ، ولنبدأ معاً في بناء مسارك المخصص نحو الرفاهية.",
    },
    services: [
      {
        id: "svc-001",
        name: "الاستشارة الأولية",
        duration: "٦٠ دقيقة",
        price: "٦٥$",
        priceNote: "جلسة واحدة",
        description:
          "جلسة أولى شاملة تغطي تاريخكِ الصحي وأهدافكِ ونظرة عامة مخصصة على التغذية. مثالية للبدء.",
        iconName: "Calendar",
      },
      {
        id: "svc-002",
        name: "برنامج الرفاهية لمدة ٣ أشهر",
        duration: "٣ أشهر",
        price: "٣٥٠$",
        priceNote: "البرنامج كاملاً",
        description:
          "خيارنا الأكثر شعبية. ست جلسات على مدى ٣ أشهر مع تصميم خطة كامل ومتابعات منتظمة ودعم مراسلة مباشر.",
        iconName: "Star",
      },
      {
        id: "svc-003",
        name: "متابعة شهرية",
        duration: "٣٠ دقيقة",
        price: "١٢٠$",
        priceNote: "في الشهر",
        description:
          "جلسات شهرية مستمرة للعميلات الحاليات. راجعي التقدم وحسّني خطتكِ وابقي على المسار نحو أهدافكِ.",
        iconName: "RefreshCw",
      },
    ],
    timeSlots: [
      { time: "٩:٠٠ ص", available: true },
      { time: "٩:٣٠ ص", available: false },
      { time: "١٠:٠٠ ص", available: true },
      { time: "١٠:٣٠ ص", available: true },
      { time: "١١:٠٠ ص", available: false },
      { time: "١١:٣٠ ص", available: true },
      { time: "١٢:٠٠ م", available: false },
      { time: "١:٠٠ م", available: true },
      { time: "١:٣٠ م", available: true },
      { time: "٢:٠٠ م", available: true },
      { time: "٢:٣٠ م", available: false },
      { time: "٣:٠٠ م", available: true },
      { time: "٤:٠٠ م", available: true },
      { time: "٤:٣٠ م", available: true },
      { time: "٥:٠٠ م", available: false },
    ],
    paymentNote:
      "تتم معالجة الدفع بأمان بعد تأكيد حجزكِ. لا يتم تحصيل أي رسوم حتى تؤكدي.",
    confirmButtonLabel: "تأكيد الحجز",
    successMessage:
      "تم تأكيد حجزكِ! تحققي من بريدكِ الإلكتروني للحصول على تفاصيل الجلسة ورابط مكالمة الفيديو.",
  },
};
