/**
 * Admin field-label dictionary.
 *
 * Usage:
 *   import { fl } from "@/admin/i18n/fieldLabels";
 *   const { lang } = useLanguage();
 *
 *   <label>{fl("name", lang)} (EN)</label>   → "Name (EN)"  |  "الاسم (EN)"
 *   <label>{fl("name", lang)} (AR)</label>   → "Name (AR)"  |  "الاسم (AR)"
 *   <label>{fl("category", lang)}</label>    → "Category"   |  "التصنيف"
 *
 * IMPORTANT: The language indicators (EN) / (AR) are NEVER translated —
 * only the noun/descriptor before them changes.
 *
 * Or use the bound hook (no lang param needed per call):
 *   import { useAdminLabels } from "@/admin/hooks/useAdminLabels";
 *   const fl = useAdminLabels();
 *   <label>{fl("name")} (EN)</label>
 */

export const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  // ── Identity / naming ────────────────────────────────────────────────────
  name:                 { en: "Name",                        ar: "الاسم"                          },
  title:                { en: "Title",                       ar: "العنوان"                         },
  subtitle:             { en: "Subtitle",                    ar: "العنوان الفرعي"                  },
  heading:              { en: "Heading",                     ar: "العنوان الرئيسي"                 },
  subheading:           { en: "Subheading",                  ar: "العنوان الثانوي"                 },
  kicker:               { en: "Kicker",                      ar: "العنوان الصغير"                  },
  headline:             { en: "Headline",                    ar: "العنوان"                         },
  badge:                { en: "Badge",                       ar: "الشارة"                         },
  slug:                 { en: "Slug",                        ar: "الرابط المختصر"                  },
  label:                { en: "Label",                       ar: "التسمية"                         },

  // ── Content ───────────────────────────────────────────────────────────────
  description:          { en: "Description",                 ar: "الوصف"                          },
  shortDescription:     { en: "Short Description",           ar: "الوصف المختصر"                  },
  fullDescription:      { en: "Full Description",            ar: "الوصف الكامل"                   },
  excerpt:              { en: "Excerpt",                     ar: "المقتطف"                         },
  content:              { en: "Content",                     ar: "المحتوى"                         },
  story:                { en: "Story",                       ar: "القصة"                          },
  bio:                  { en: "Bio",                         ar: "السيرة الذاتية"                  },
  notes:                { en: "Notes",                       ar: "ملاحظات"                         },
  instructions:         { en: "Instructions",                ar: "التعليمات"                       },
  points:               { en: "Points",                      ar: "النقاط"                         },
  items:                { en: "Items",                       ar: "العناصر"                         },
  features:             { en: "Features",                    ar: "المميزات"                        },
  tags:                 { en: "Tags",                        ar: "الوسوم"                         },

  // ── People ────────────────────────────────────────────────────────────────
  clientName:           { en: "Client Name",                 ar: "اسم العميل"                     },
  authorName:           { en: "Author Name",                 ar: "اسم الكاتب"                     },
  authorAvatar:         { en: "Author Avatar",               ar: "صورة الكاتب"                    },
  role:                 { en: "Role",                        ar: "المسمى الوظيفي"                  },
  reviewText:           { en: "Review Text",                 ar: "نص الرأي"                       },
  displayName:          { en: "Display Name",                ar: "الاسم الكامل"                    },

  // ── Pricing ───────────────────────────────────────────────────────────────
  price:                { en: "Price",                       ar: "السعر"                          },
  currency:             { en: "Currency",                    ar: "العملة"                         },
  discount:             { en: "Discount",                    ar: "الخصم"                          },
  discountPercent:      { en: "Discount %",                  ar: "نسبة الخصم %"                   },
  finalPrice:           { en: "Final Price Preview",         ar: "معاينة السعر النهائي"            },
  billingPeriod:        { en: "Billing Period",              ar: "دورة الدفع"                     },

  // ── Time / scheduling ─────────────────────────────────────────────────────
  duration:             { en: "Duration",                    ar: "المدة"                          },
  startDate:            { en: "Start Date",                  ar: "تاريخ البدء"                    },
  endDate:              { en: "End Date",                    ar: "تاريخ الانتهاء"                  },
  publishDate:          { en: "Publish Date",                ar: "تاريخ النشر"                    },
  publishedAt:          { en: "Published At",                ar: "تاريخ النشر"                    },
  readTime:             { en: "Read Time",                   ar: "وقت القراءة"                    },
  businessHours:        { en: "Business Hours",              ar: "ساعات العمل"                    },
  workingHours:         { en: "Working Hours",               ar: "ساعات العمل"                    },
  sessionDuration:      { en: "Default Session Duration",    ar: "مدة الجلسة الافتراضية"          },
  bufferTime:           { en: "Buffer Between Appointments", ar: "الفاصل بين المواعيد"             },
  slotInterval:         { en: "Time Slot Interval",          ar: "فاصل الوقت بين الخانات"          },
  leadTime:             { en: "Minimum Lead Time",           ar: "الحد الأدنى للحجز المسبق"       },

  // ── Appearance ────────────────────────────────────────────────────────────
  icon:                 { en: "Icon",                        ar: "الأيقونة"                        },
  gradient:             { en: "Gradient",                    ar: "التدرج اللوني"                   },
  iconGradient:         { en: "Icon Gradient",               ar: "تدرج الأيقونة"                   },
  accentGradient:       { en: "Accent Gradient",             ar: "لون التمييز"                    },
  theme:                { en: "Theme",                       ar: "المظهر"                         },

  // ── Media ─────────────────────────────────────────────────────────────────
  image:                { en: "Image",                       ar: "الصورة"                         },
  imageUrl:             { en: "Image URL",                   ar: "رابط الصورة"                    },
  coverImage:           { en: "Cover Image",                 ar: "صورة الغلاف"                    },
  portrait:             { en: "Portrait Image",              ar: "الصورة الشخصية"                  },
  clientPhoto:          { en: "Client Photo",                ar: "صورة العميل"                    },
  beforePhoto:          { en: "Before Photo",                ar: "صورة قبل"                       },
  afterPhoto:           { en: "After Photo",                 ar: "صورة بعد"                       },
  favicon:              { en: "Favicon",                     ar: "الأيقونة المفضلة"                },
  ogImage:              { en: "Open Graph Image",            ar: "صورة Open Graph"                },

  // ── Contact ───────────────────────────────────────────────────────────────
  phone:                { en: "Phone",                       ar: "رقم الهاتف"                     },
  whatsapp:             { en: "WhatsApp",                    ar: "واتساب"                         },
  email:                { en: "Email Address",               ar: "البريد الإلكتروني"               },
  address:              { en: "Address",                     ar: "العنوان"                         },
  googleMapsUrl:        { en: "Google Maps URL",             ar: "رابط خرائط Google"              },
  link:                 { en: "Link",                        ar: "الرابط"                         },
  url:                  { en: "URL",                         ar: "الرابط"                         },

  // ── SEO ───────────────────────────────────────────────────────────────────
  siteTitle:            { en: "Website Title",               ar: "عنوان الموقع"                   },
  metaDescription:      { en: "Meta Description",            ar: "الوصف التعريفي"                  },
  keywords:             { en: "Keywords",                    ar: "الكلمات المفتاحية"               },
  analyticsId:          { en: "Google Analytics ID",         ar: "معرّف Google Analytics"         },
  searchConsole:        { en: "Search Console Verification", ar: "رمز التحقق من Search Console"   },

  // ── CMS meta ──────────────────────────────────────────────────────────────
  category:             { en: "Category",                    ar: "التصنيف"                         },
  sortOrder:            { en: "Sort Order",                  ar: "الترتيب"                         },
  rating:               { en: "Rating",                      ar: "التقييم"                         },
  language:             { en: "Language",                    ar: "اللغة"                          },
  navigation:           { en: "Navigation",                  ar: "قائمة التنقل"                    },

  // ── CTA / actions ─────────────────────────────────────────────────────────
  ctaButton:            { en: "CTA Button",                  ar: "زر الدعوة للعمل"                 },
  buttonLabel:          { en: "Button Label",                ar: "نص الزر"                        },

  // ── Assessment / questions ────────────────────────────────────────────────
  question:             { en: "Question",                    ar: "السؤال"                         },
  answer:               { en: "Answer",                      ar: "الإجابة"                         },
  questionLabel:        { en: "Question Label",              ar: "نص السؤال"                      },
  questionType:         { en: "Question Type",               ar: "نوع السؤال"                     },
  placeholder:          { en: "Placeholder",                 ar: "نص تلميحي"                      },
  helpText:             { en: "Help Text",                   ar: "نص مساعد"                       },
  optionLabel:          { en: "Option Label",                ar: "تسمية الخيار"                    },
  validationNote:       { en: "Validation Note",             ar: "ملاحظة التحقق"                   },
  folder:               { en: "Folder",                      ar: "المجلد"                         },
  templateName:         { en: "Template Name",               ar: "اسم القالب"                     },

  // ── Nutrition plans ───────────────────────────────────────────────────────
  planName:             { en: "Plan Name",                   ar: "اسم الخطة"                      },
  mealTitle:            { en: "Meal Title",                  ar: "عنوان الوجبة"                    },
  waterGoal:            { en: "Daily Water Intake Goal",     ar: "هدف شرب الماء اليومي"           },
  stepsGoal:            { en: "Daily Steps Goal",            ar: "هدف الخطوات اليومية"            },
  exerciseRec:          { en: "Exercise Recommendations",    ar: "توصيات التمارين"                 },
  supplementRec:        { en: "Supplement Recommendations",  ar: "توصيات المكملات"                 },
  generalInstructions:  { en: "General Instructions",        ar: "تعليمات عامة"                    },

  // ── Security ─────────────────────────────────────────────────────────────
  newPassword:          { en: "New Password",                ar: "كلمة المرور الجديدة"             },
  confirmPassword:      { en: "Confirm New Password",        ar: "تأكيد كلمة المرور الجديدة"       },

  // ── Platform / social ─────────────────────────────────────────────────────
  platformName:         { en: "Platform Name",               ar: "اسم المنصة"                     },
  iconImageUrl:         { en: "Icon Image URL",              ar: "رابط أيقونة المنصة"              },
};

/**
 * Translate a field label key to the current UI language.
 *
 * @param key  - a key from FIELD_LABELS above
 * @param lang - "en" | "ar" from useLanguage()
 * @returns the translated noun (no (EN)/(AR) suffix — append that yourself)
 */
export function fl(key: string, lang: "en" | "ar"): string {
  return FIELD_LABELS[key]?.[lang] ?? FIELD_LABELS[key]?.en ?? key;
}
