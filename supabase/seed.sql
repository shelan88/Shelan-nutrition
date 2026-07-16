-- ============================================================
-- SHELAN Nutrition Clinic — Seed Data
-- All 12 MOCK_CLIENTS with their assessments, timeline events,
-- nutrition plans, and uploaded file metadata.
--
-- Apply after the schema migration:
--   psql <connection_string> -f supabase/seed.sql
--
-- Uses fixed UUIDs for stable FK references.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- clients
-- ─────────────────────────────────────────────────────────────
INSERT INTO clients (id, full_name, full_name_ar, email, phone, age, gender, status, risk_level, risk_percentage,
  location, initials, avatar_color, join_date, last_visit,
  diagnosis_category, diagnosis_category_ar, notes, notes_ar,
  consultations, risk_indicators)
VALUES

-- c-001: Lara Hassan
('00000000-0000-0000-0000-000000000001',
 'Lara Hassan', 'لارا حسن', 'lara.hassan@email.com', '+9659900 1234', 29, 'Female', 'Active', 'Low', 18.00,
 'Kuwait', 'LH', 'bg-gradient-to-br from-primary-pink to-soft-pink',
 '2026-03-10', '2026-07-14',
 'Overweight — Low Risk', 'زيادة الوزن — خطر منخفض',
 'Patient responds well to a low-GI dietary approach. No known food allergies. Mild lactose sensitivity.',
 'تستجيب المريضة بشكل جيد لنهج غذائي منخفض المؤشر الجلايسيمي.',
 '[{"id":"cn-1","date":"Jul 14, 2026","type":"Follow-up Session","typeAr":"جلسة متابعة","notes":"Weight down 1.2 kg. Good adherence to meal plan.","notesAr":"انخفاض الوزن 1.2 كجم.","duration":"45 min"},{"id":"cn-2","date":"Jun 28, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Full health assessment conducted. Goals set for 3 months.","notesAr":"تقييم صحي شامل.","duration":"60 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"27.4","level":"warning"},{"label":"Blood Sugar","labelAr":"سكر الدم","value":"98 mg/dL","level":"normal"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"118/76","level":"normal"},{"label":"Cholesterol","labelAr":"الكوليسترول","value":"190 mg/dL","level":"normal"}]'),

-- c-002: Reem Al-Ahmad
('00000000-0000-0000-0000-000000000002',
 'Reem Al-Ahmad', 'ريم الأحمد', 'reem.alahmad@email.com', '+966550 09876', 42, 'Female', 'Active', 'Medium', 45.00,
 'Saudi Arabia', 'RA', 'bg-gradient-to-br from-lavender-purple to-soft-purple',
 '2026-04-05', '2026-07-10',
 'Metabolic Syndrome — Medium Risk', 'متلازمة التمثيل الغذائي — خطر متوسط',
 'Managed with Metformin 1000mg twice daily. Monitor carbohydrate intake closely.',
 'تتناول ميتفورمين 1000 ملغ مرتين يومياً.',
 '[{"id":"cn-3","date":"Jul 10, 2026","type":"Follow-up","typeAr":"متابعة","notes":"HbA1c improved from 7.4 to 7.1.","notesAr":"تحسن HbA1c من 7.4 إلى 7.1.","duration":"50 min"},{"id":"cn-4","date":"May 15, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Full metabolic panel reviewed.","notesAr":"مراجعة الملف الأيضي الكامل.","duration":"75 min"}]',
 '[{"label":"HbA1c","labelAr":"الهيموجلوبين السكري","value":"7.1%","level":"warning"},{"label":"Fasting Sugar","labelAr":"سكر الصيام","value":"128 mg/dL","level":"warning"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"138/88","level":"warning"},{"label":"Cholesterol","labelAr":"الكوليسترول","value":"218 mg/dL","level":"warning"}]'),

-- c-003: Nora Mohammed
('00000000-0000-0000-0000-000000000003',
 'Nora Mohammed', 'نورا محمد', 'nora.mohammed@email.com', '+971502 23344', 35, 'Female', 'Waiting', 'High', 78.00,
 'UAE', 'NM', 'bg-gradient-to-br from-soft-purple to-deep-purple',
 '2026-06-01', '2026-07-16',
 'Lipedema + Metabolic — High Risk', 'ليبيديما + أيضي — خطر مرتفع',
 'Lipedema confirmed by specialist. Anti-inflammatory diet essential.',
 'تأكدت الليبيديما من قبل متخصص.',
 '[{"id":"cn-5","date":"Jul 16, 2026","type":"Nutritional Assessment","typeAr":"تقييم تغذوي","notes":"Detailed body composition analysis.","notesAr":"تحليل تفصيلي لتكوين الجسم.","duration":"90 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"34.2","level":"critical"},{"label":"TSH (Thyroid)","labelAr":"هرمون الغدة الدرقية","value":"6.8 mIU/L","level":"critical"},{"label":"Inflammation","labelAr":"الالتهاب (CRP)","value":"8.2 mg/L","level":"critical"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"145/92","level":"critical"}]'),

-- c-004: Fatima Al-Rashid
('00000000-0000-0000-0000-000000000004',
 'Fatima Al-Rashid', 'فاطمة الراشد', 'fatima.rashid@email.com', '+973330 05566', 31, 'Female', 'Active', 'Low', 8.00,
 'Bahrain', 'FR', 'bg-gradient-to-br from-primary-pink to-lavender-purple',
 '2026-05-15', '2026-07-02',
 'Healthy — Preventive', 'صحية — وقائية',
 'Excellent baseline health. Focus on optimisation — energy levels, gut health, and hormonal balance.',
 'صحة أساسية ممتازة. التركيز على التحسين.',
 '[{"id":"cn-6","date":"Jul 2, 2026","type":"Follow-up","typeAr":"متابعة","notes":"All markers excellent.","notesAr":"جميع المؤشرات ممتازة.","duration":"40 min"},{"id":"cn-7","date":"May 22, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Preventive nutrition plan initiated.","notesAr":"بدء خطة التغذية الوقائية.","duration":"60 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"22.1","level":"normal"},{"label":"Blood Sugar","labelAr":"سكر الدم","value":"88 mg/dL","level":"normal"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"112/72","level":"normal"},{"label":"Cholesterol","labelAr":"الكوليسترول","value":"168 mg/dL","level":"normal"}]'),

-- c-005: Sara Khalid
('00000000-0000-0000-0000-000000000005',
 'Sara Khalid', 'سارة خالد', 'sara.khalid@email.com', '+974551 17788', 26, 'Female', 'Completed', 'Low', 6.00,
 'Qatar', 'SK', 'bg-gradient-to-br from-soft-pink to-primary-pink',
 '2026-01-08', '2026-06-20',
 'Healthy — Programme Complete', 'صحية — اكتمل البرنامج',
 'Completed 6-month weight management programme. Lost 8kg total. Excellent compliance throughout.',
 'أتمّت برنامج إدارة الوزن لمدة 6 أشهر.',
 '[{"id":"cn-8","date":"Jun 20, 2026","type":"Discharge Consultation","typeAr":"جلسة الإنهاء","notes":"Programme complete. BMI now healthy.","notesAr":"اكتمل البرنامج.","duration":"60 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"23.8","level":"normal"},{"label":"Blood Sugar","labelAr":"سكر الدم","value":"92 mg/dL","level":"normal"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"110/70","level":"normal"}]'),

-- c-006: Mira Al-Ali
('00000000-0000-0000-0000-000000000006',
 'Mira Al-Ali', 'ميرا العلي', 'mira.alali@email.com', '+962770 04433', 48, 'Female', 'Active', 'High', 85.00,
 'Jordan', 'MA', 'bg-gradient-to-br from-deep-purple to-lavender-purple',
 '2026-02-20', '2026-07-12',
 'Complex Multi-condition — High Risk', 'حالات متعددة معقدة — خطر مرتفع',
 'Complex case requiring multidisciplinary coordination. Lipedema Stage III with metabolic complications.',
 'حالة معقدة تستوجب التنسيق متعدد التخصصات.',
 '[{"id":"cn-9","date":"Jul 12, 2026","type":"Monthly Review","typeAr":"مراجعة شهرية","notes":"Slow but consistent progress.","notesAr":"تقدم بطيء لكن ثابت.","duration":"60 min"},{"id":"cn-10","date":"May 20, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Multi-condition management plan initiated.","notesAr":"بدء خطة شاملة.","duration":"90 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"38.5","level":"critical"},{"label":"HbA1c","labelAr":"الهيموجلوبين السكري","value":"8.2%","level":"critical"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"152/96","level":"critical"},{"label":"Inflammation","labelAr":"الالتهاب (CRP)","value":"12.4 mg/L","level":"critical"}]'),

-- c-007: Dana Al-Shamri
('00000000-0000-0000-0000-000000000007',
 'Dana Al-Shamri', 'دانا الشمري', 'dana.shamri@email.com', '+965661 12200', 38, 'Female', 'Waiting', 'Medium', 52.00,
 'Kuwait', 'DS', 'bg-gradient-to-br from-primary-pink to-soft-purple',
 '2026-05-30', '2026-07-08',
 'PCOS + Pre-diabetes — Medium Risk', 'تكيس المبايض + ما قبل السكري — خطر متوسط',
 'PCOS with insulin resistance. Low-GI diet critical.',
 'تكيس المبايض مع مقاومة الأنسولين.',
 '[{"id":"cn-11","date":"Jul 8, 2026","type":"Dietary Guidance","typeAr":"إرشادات غذائية","notes":"Interim dietary advice provided.","notesAr":"تقديم نصائح غذائية مؤقتة.","duration":"45 min"}]',
 '[{"label":"Fasting Sugar","labelAr":"سكر الصيام","value":"112 mg/dL","level":"warning"},{"label":"Insulin","labelAr":"الأنسولين","value":"18 µU/mL","level":"warning"},{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"29.1","level":"warning"},{"label":"Testosterone","labelAr":"هرمون التستوستيرون","value":"64 ng/dL","level":"warning"}]'),

-- c-008: Hana Al-Qahtani
('00000000-0000-0000-0000-000000000008',
 'Hana Al-Qahtani', 'هنا القحطاني', 'hana.qahtani@email.com', '+966554 48899', 33, 'Female', 'Active', 'Medium', 38.00,
 'Saudi Arabia', 'HQ', 'bg-gradient-to-br from-lavender-purple to-primary-pink',
 '2026-04-22', '2026-07-05',
 'Metabolic — Medium Risk', 'أيضي — خطر متوسط',
 'Fatty liver Grade 1 — avoid fructose and saturated fats.',
 'كبد دهني درجة أولى — تجنب الفركتوز والدهون المشبعة.',
 '[{"id":"cn-12","date":"Jul 5, 2026","type":"Follow-up","typeAr":"متابعة","notes":"Liver enzymes improving. Weight down 2kg.","notesAr":"إنزيمات الكبد تتحسن.","duration":"45 min"},{"id":"cn-13","date":"May 3, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Liver health plan initiated.","notesAr":"بدء خطة صحة الكبد.","duration":"60 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"30.2","level":"warning"},{"label":"ALT","labelAr":"إنزيم ALT","value":"52 U/L","level":"warning"},{"label":"Triglycerides","labelAr":"الدهون الثلاثية","value":"185 mg/dL","level":"warning"}]'),

-- c-009: Salma Al-Dosari
('00000000-0000-0000-0000-000000000009',
 'Salma Al-Dosari', 'سلمى الدوسري', 'salma.dosari@email.com', '+974553 31122', 52, 'Female', 'Active', 'High', 88.00,
 'Qatar', 'SD', 'bg-gradient-to-br from-deep-purple to-soft-purple',
 '2026-03-01', '2026-07-09',
 'Complex Lipedema — High Risk', 'ليبيديما معقدة — خطر مرتفع',
 'Post-menopausal Lipedema Stage III. Levothyroxine 75mcg. Compression therapy ongoing.',
 'ليبيديما مرحلة ثالثة بعد انقطاع الطمث.',
 '[{"id":"cn-14","date":"Jul 9, 2026","type":"Monthly Review","typeAr":"مراجعة شهرية","notes":"Oedema slightly reduced.","notesAr":"الوذمة انخفضت قليلاً.","duration":"60 min"},{"id":"cn-15","date":"Apr 5, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Lipedema education provided.","notesAr":"تقديم تثقيف حول الليبيديما.","duration":"90 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"41.0","level":"critical"},{"label":"TSH","labelAr":"هرمون الغدة الدرقية","value":"8.1 mIU/L","level":"critical"},{"label":"Blood Pressure","labelAr":"ضغط الدم","value":"148/94","level":"critical"},{"label":"Oedema Score","labelAr":"درجة الوذمة","value":"Grade 3","level":"critical"}]'),

-- c-010: Yasmin Al-Farsi
('00000000-0000-0000-0000-000000000010',
 'Yasmin Al-Farsi', 'ياسمين الفارسي', 'yasmin.alfarsi@email.com', '+968990 06677', 27, 'Female', 'Inactive', 'Low', 12.00,
 'Oman', 'YF', 'bg-gradient-to-br from-soft-pink to-lavender-purple',
 '2026-02-01', '2026-04-10',
 'Healthy — Inactive', 'صحية — غير نشطة',
 'Was on a general nutrition plan but went inactive.',
 'كانت على خطة تغذية عامة لكنها أصبحت غير نشطة.',
 '[{"id":"cn-16","date":"Apr 10, 2026","type":"Follow-up","typeAr":"متابعة","notes":"Good progress noted.","notesAr":"ملاحظة تقدم جيد.","duration":"40 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"21.5","level":"normal"},{"label":"Blood Sugar","labelAr":"سكر الدم","value":"85 mg/dL","level":"normal"}]'),

-- c-011: Aisha Al-Mansoori
('00000000-0000-0000-0000-000000000011',
 'Aisha Al-Mansoori', 'عائشة المنصوري', 'aisha.mansoori@email.com', '+971503 37799', 45, 'Female', 'Active', 'Medium', 48.00,
 'UAE', 'AM', 'bg-gradient-to-br from-primary-pink to-deep-purple',
 '2026-06-10', '2026-07-11',
 'T2D New Onset — Medium Risk', 'سكري نوع ثانٍ حديث — خطر متوسط',
 'Newly diagnosed T2D. On Metformin 500mg once daily.',
 'تشخيص حديث بالسكري من النوع الثاني.',
 '[{"id":"cn-17","date":"Jul 11, 2026","type":"Follow-up","typeAr":"متابعة","notes":"Blood sugars trending down.","notesAr":"مستويات السكر تتراجع.","duration":"50 min"},{"id":"cn-18","date":"Jun 18, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Diabetes remission roadmap explained.","notesAr":"شرح خارطة طريق الشفاء.","duration":"75 min"}]',
 '[{"label":"HbA1c","labelAr":"الهيموجلوبين السكري","value":"7.4%","level":"warning"},{"label":"Fasting Sugar","labelAr":"سكر الصيام","value":"138 mg/dL","level":"warning"},{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"28.8","level":"warning"}]'),

-- c-012: Lina Al-Zahrani
('00000000-0000-0000-0000-000000000012',
 'Lina Al-Zahrani', 'لينا الزهراني', 'lina.zahrani@email.com', '+966557 73344', 30, 'Female', 'Active', 'Low', 14.00,
 'Saudi Arabia', 'LZ', 'bg-gradient-to-br from-lavender-purple to-primary-pink',
 '2026-04-15', '2026-06-30',
 'Digestive Health — Low Risk', 'صحة الجهاز الهضمي — خطر منخفض',
 'IBS-C type. Increase soluble fibre gradually.',
 'قولون عصبي نوع C.',
 '[{"id":"cn-19","date":"Jun 30, 2026","type":"Follow-up","typeAr":"متابعة","notes":"IBS symptoms significantly improved.","notesAr":"تحسن ملحوظ في أعراض القولون العصبي.","duration":"40 min"},{"id":"cn-20","date":"Apr 22, 2026","type":"Initial Consultation","typeAr":"استشارة أولية","notes":"Low-FODMAP protocol initiated.","notesAr":"بدء بروتوكول FODMAP المنخفض.","duration":"60 min"}]',
 '[{"label":"BMI","labelAr":"مؤشر كتلة الجسم","value":"24.3","level":"normal"},{"label":"Vitamin D","labelAr":"فيتامين D","value":"18 ng/mL","level":"warning"},{"label":"Iron","labelAr":"الحديد","value":"72 µg/dL","level":"normal"}]')

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- assessments
-- ─────────────────────────────────────────────────────────────
INSERT INTO assessments (client_id, score, risk_level, risk_percentage, diagnosis_category, diagnosis_category_ar, submitted_at)
VALUES
('00000000-0000-0000-0000-000000000001',82,'Low',  18,'Overweight — Low Risk',              'زيادة الوزن — خطر منخفض',                    '2026-06-20T10:00:00Z'),
('00000000-0000-0000-0000-000000000002',61,'Medium',45,'Metabolic Syndrome — Medium Risk',     'متلازمة التمثيل الغذائي — خطر متوسط',        '2026-04-28T10:00:00Z'),
('00000000-0000-0000-0000-000000000003',38,'High', 78,'Lipedema + Metabolic — High Risk',     'ليبيديما + أيضي — خطر مرتفع',               '2026-06-05T10:00:00Z'),
('00000000-0000-0000-0000-000000000004',88,'Low',   8,'Healthy — Preventive',                 'صحية — وقائية',                              '2026-05-12T10:00:00Z'),
('00000000-0000-0000-0000-000000000005',91,'Low',   6,'Healthy — Programme Complete',          'صحية — اكتمل البرنامج',                      '2026-01-08T10:00:00Z'),
('00000000-0000-0000-0000-000000000006',32,'High', 85,'Complex Multi-condition — High Risk',   'حالات متعددة معقدة — خطر مرتفع',             '2026-02-20T10:00:00Z'),
('00000000-0000-0000-0000-000000000007',55,'Medium',52,'PCOS + Pre-diabetes — Medium Risk',   'تكيس المبايض + ما قبل السكري — خطر متوسط',  '2026-05-30T10:00:00Z'),
('00000000-0000-0000-0000-000000000008',68,'Medium',38,'Metabolic — Medium Risk',             'أيضي — خطر متوسط',                           '2026-04-22T10:00:00Z'),
('00000000-0000-0000-0000-000000000009',29,'High', 88,'Complex Lipedema — High Risk',         'ليبيديما معقدة — خطر مرتفع',                '2026-03-01T10:00:00Z'),
('00000000-0000-0000-0000-000000000010',79,'Low',  12,'Healthy — Inactive',                   'صحية — غير نشطة',                            '2026-02-01T10:00:00Z'),
('00000000-0000-0000-0000-000000000011',59,'Medium',48,'T2D New Onset — Medium Risk',         'سكري نوع ثانٍ حديث — خطر متوسط',            '2026-06-10T10:00:00Z'),
('00000000-0000-0000-0000-000000000012',85,'Low',  14,'Digestive Health — Low Risk',          'صحة الجهاز الهضمي — خطر منخفض',              '2026-04-15T10:00:00Z');

-- ─────────────────────────────────────────────────────────────
-- timeline_events
-- ─────────────────────────────────────────────────────────────
INSERT INTO timeline_events (client_id, event, event_ar, type, date) VALUES
-- c-001
('00000000-0000-0000-0000-000000000001','Assessment Submitted','تم تقديم التقييم','assessment','2026-06-20'),
('00000000-0000-0000-0000-000000000001','Consultation Booked','تم حجز الاستشارة','booking','2026-06-22'),
('00000000-0000-0000-0000-000000000001','Initial Consultation','الاستشارة الأولية','consultation','2026-06-28'),
('00000000-0000-0000-0000-000000000001','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-06-28'),
('00000000-0000-0000-0000-000000000001','Follow-up Scheduled','تمت جدولة المتابعة','followup','2026-07-14'),
-- c-002
('00000000-0000-0000-0000-000000000002','Assessment Submitted','تم تقديم التقييم','assessment','2026-04-28'),
('00000000-0000-0000-0000-000000000002','Consultation Booked','تم حجز الاستشارة','booking','2026-05-05'),
('00000000-0000-0000-0000-000000000002','Initial Consultation','الاستشارة الأولية','consultation','2026-05-15'),
('00000000-0000-0000-0000-000000000002','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-05-15'),
('00000000-0000-0000-0000-000000000002','Follow-up Completed','اكتملت المتابعة','followup','2026-07-10'),
-- c-003
('00000000-0000-0000-0000-000000000003','Assessment Submitted','تم تقديم التقييم','assessment','2026-06-05'),
('00000000-0000-0000-0000-000000000003','Consultation Booked','تم حجز الاستشارة','booking','2026-06-10'),
('00000000-0000-0000-0000-000000000003','Initial Consultation','الاستشارة الأولية','consultation','2026-07-16'),
('00000000-0000-0000-0000-000000000003','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-07-16'),
-- c-004
('00000000-0000-0000-0000-000000000004','Assessment Submitted','تم تقديم التقييم','assessment','2026-05-12'),
('00000000-0000-0000-0000-000000000004','Consultation Booked','تم حجز الاستشارة','booking','2026-05-18'),
('00000000-0000-0000-0000-000000000004','Initial Consultation','الاستشارة الأولية','consultation','2026-05-22'),
('00000000-0000-0000-0000-000000000004','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-05-22'),
('00000000-0000-0000-0000-000000000004','Follow-up Completed','اكتملت المتابعة','followup','2026-07-02'),
-- c-005
('00000000-0000-0000-0000-000000000005','Assessment Submitted','تم تقديم التقييم','assessment','2026-01-08'),
('00000000-0000-0000-0000-000000000005','Initial Consultation','الاستشارة الأولية','consultation','2026-01-15'),
('00000000-0000-0000-0000-000000000005','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-01-15'),
('00000000-0000-0000-0000-000000000005','Follow-up Completed','اكتملت المتابعة','followup','2026-04-10'),
('00000000-0000-0000-0000-000000000005','Programme Completed','اكتمل البرنامج','consultation','2026-06-20'),
-- c-006
('00000000-0000-0000-0000-000000000006','Assessment Submitted','تم تقديم التقييم','assessment','2026-02-20'),
('00000000-0000-0000-0000-000000000006','Consultation Booked','تم حجز الاستشارة','booking','2026-03-01'),
('00000000-0000-0000-0000-000000000006','Initial Consultation','الاستشارة الأولية','consultation','2026-05-20'),
('00000000-0000-0000-0000-000000000006','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-05-20'),
('00000000-0000-0000-0000-000000000006','Monthly Review','المراجعة الشهرية','followup','2026-07-12'),
-- c-007
('00000000-0000-0000-0000-000000000007','Assessment Submitted','تم تقديم التقييم','assessment','2026-05-30'),
('00000000-0000-0000-0000-000000000007','Consultation Booked','تم حجز الاستشارة','booking','2026-06-05'),
('00000000-0000-0000-0000-000000000007','Dietary Guidance','إرشادات غذائية','consultation','2026-07-08'),
-- c-008
('00000000-0000-0000-0000-000000000008','Assessment Submitted','تم تقديم التقييم','assessment','2026-04-22'),
('00000000-0000-0000-0000-000000000008','Consultation Booked','تم حجز الاستشارة','booking','2026-04-28'),
('00000000-0000-0000-0000-000000000008','Initial Consultation','الاستشارة الأولية','consultation','2026-05-03'),
('00000000-0000-0000-0000-000000000008','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-05-03'),
('00000000-0000-0000-0000-000000000008','Follow-up Completed','اكتملت المتابعة','followup','2026-07-05'),
-- c-009
('00000000-0000-0000-0000-000000000009','Assessment Submitted','تم تقديم التقييم','assessment','2026-03-01'),
('00000000-0000-0000-0000-000000000009','Initial Consultation','الاستشارة الأولية','consultation','2026-04-05'),
('00000000-0000-0000-0000-000000000009','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-04-05'),
('00000000-0000-0000-0000-000000000009','Monthly Review','المراجعة الشهرية','followup','2026-07-09'),
-- c-010
('00000000-0000-0000-0000-000000000010','Assessment Submitted','تم تقديم التقييم','assessment','2026-02-01'),
('00000000-0000-0000-0000-000000000010','Initial Consultation','الاستشارة الأولية','consultation','2026-02-10'),
('00000000-0000-0000-0000-000000000010','Follow-up Completed','اكتملت المتابعة','followup','2026-04-10'),
-- c-011
('00000000-0000-0000-0000-000000000011','Assessment Submitted','تم تقديم التقييم','assessment','2026-06-10'),
('00000000-0000-0000-0000-000000000011','Initial Consultation','الاستشارة الأولية','consultation','2026-06-18'),
('00000000-0000-0000-0000-000000000011','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-06-18'),
('00000000-0000-0000-0000-000000000011','Follow-up Completed','اكتملت المتابعة','followup','2026-07-11'),
-- c-012
('00000000-0000-0000-0000-000000000012','Assessment Submitted','تم تقديم التقييم','assessment','2026-04-15'),
('00000000-0000-0000-0000-000000000012','Consultation Booked','تم حجز الاستشارة','booking','2026-04-18'),
('00000000-0000-0000-0000-000000000012','Initial Consultation','الاستشارة الأولية','consultation','2026-04-22'),
('00000000-0000-0000-0000-000000000012','Nutrition Plan Created','تم إنشاء خطة التغذية','plan','2026-04-22'),
('00000000-0000-0000-0000-000000000012','Follow-up Completed','اكتملت المتابعة','followup','2026-06-30');

-- ─────────────────────────────────────────────────────────────
-- nutrition_plans  (clients c-001,c-002,c-003,c-004,c-006,c-008,c-009,c-011,c-012)
-- c-005, c-007, c-010 have no plan.
-- ─────────────────────────────────────────────────────────────
INSERT INTO nutrition_plans (client_id, plan_data) VALUES
('00000000-0000-0000-0000-000000000001','{"name":"Weight Management Phase 1","nameAr":"إدارة الوزن — المرحلة الأولى","startDate":"Jun 28, 2026","endDate":"Sep 28, 2026","calories":1600,"macros":[{"label":"Protein","labelAr":"بروتين","value":120,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":160,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":55,"unit":"g"}],"notes":"Low-GI carbs only. Avoid refined sugars. Hydration goal: 2.5 L/day.","notesAr":"كربوهيدرات منخفضة المؤشر الجلايسيمي فقط."}'),
('00000000-0000-0000-0000-000000000002','{"name":"Diabetic Control Plan","nameAr":"خطة ضبط السكري","startDate":"May 15, 2026","endDate":"Nov 15, 2026","calories":1750,"macros":[{"label":"Protein","labelAr":"بروتين","value":100,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":175,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":65,"unit":"g"}],"notes":"Distribute carbs evenly across 5 meals.","notesAr":"توزيع الكربوهيدرات بالتساوي على 5 وجبات."}'),
('00000000-0000-0000-0000-000000000003','{"name":"Lipedema Anti-Inflammatory Protocol","nameAr":"بروتوكول الليبيديما المضاد للالتهابات","startDate":"Jul 16, 2026","endDate":"Jan 16, 2027","calories":1800,"macros":[{"label":"Protein","labelAr":"بروتين","value":130,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":130,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":80,"unit":"g"}],"notes":"Ketogenic-adjacent. Anti-inflammatory fats.","notesAr":"نهج قريب من الكيتو."}'),
('00000000-0000-0000-0000-000000000004','{"name":"Hormonal Balance & Optimisation","nameAr":"التوازن الهرموني والتحسين","startDate":"May 22, 2026","endDate":"Nov 22, 2026","calories":1900,"macros":[{"label":"Protein","labelAr":"بروتين","value":110,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":220,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":70,"unit":"g"}],"notes":"Whole foods approach. High fibre. Iron-rich foods.","notesAr":"نهج الأغذية الكاملة."}'),
('00000000-0000-0000-0000-000000000006','{"name":"Lipedema + Diabetes Integrated Protocol","nameAr":"بروتوكول ليبيديما + سكري متكامل","startDate":"May 20, 2026","endDate":"Nov 20, 2026","calories":1600,"macros":[{"label":"Protein","labelAr":"بروتين","value":120,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":100,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":70,"unit":"g"}],"notes":"Modified ketogenic. Strict carb management.","notesAr":"كيتو معدّل."}'),
('00000000-0000-0000-0000-000000000008','{"name":"Liver Health & Weight Loss","nameAr":"صحة الكبد وفقدان الوزن","startDate":"May 3, 2026","endDate":"Nov 3, 2026","calories":1700,"macros":[{"label":"Protein","labelAr":"بروتين","value":115,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":165,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":55,"unit":"g"}],"notes":"No fructose from added sugars. Mediterranean base.","notesAr":"لا سكريات مضافة."}'),
('00000000-0000-0000-0000-000000000009','{"name":"Lipedema Ketogenic Protocol","nameAr":"بروتوكول الكيتو لليبيديما","startDate":"Apr 5, 2026","endDate":"Oct 5, 2026","calories":1500,"macros":[{"label":"Protein","labelAr":"بروتين","value":110,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":50,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":100,"unit":"g"}],"notes":"Therapeutic ketogenic for lipedema.","notesAr":"كيتو علاجي لليبيديما."}'),
('00000000-0000-0000-0000-000000000011','{"name":"T2D Remission Protocol","nameAr":"بروتوكول شفاء السكري من النوع الثاني","startDate":"Jun 18, 2026","endDate":"Dec 18, 2026","calories":1650,"macros":[{"label":"Protein","labelAr":"بروتين","value":120,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":100,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":75,"unit":"g"}],"notes":"Low-carb Mediterranean. No refined carbs.","notesAr":"متوسطي منخفض الكربوهيدرات."}'),
('00000000-0000-0000-0000-000000000012','{"name":"Gut Healing & Vitamin Optimisation","nameAr":"علاج الأمعاء وتحسين الفيتامينات","startDate":"Apr 22, 2026","endDate":"Oct 22, 2026","calories":1850,"macros":[{"label":"Protein","labelAr":"بروتين","value":105,"unit":"g"},{"label":"Carbs","labelAr":"كربوهيدرات","value":220,"unit":"g"},{"label":"Fat","labelAr":"دهون","value":65,"unit":"g"}],"notes":"Low-FODMAP phase 1 (6 weeks), then reintroduction phase.","notesAr":"مرحلة FODMAP المنخفض 1."}')
ON CONFLICT (client_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- uploaded_files (IDs generated by Postgres)
-- ─────────────────────────────────────────────────────────────
INSERT INTO uploaded_files (client_id, filename, type, size, uploaded_at) VALUES
('00000000-0000-0000-0000-000000000001','Blood Test Results.pdf','Lab Report',1258291,'2026-06-25'),
('00000000-0000-0000-0000-000000000001','Body Composition Scan.pdf','PDF',838860,'2026-06-28'),
('00000000-0000-0000-0000-000000000002','HbA1c Results May 2026.pdf','Lab Report',943718,'2026-05-10'),
('00000000-0000-0000-0000-000000000002','HbA1c Results Jul 2026.pdf','Lab Report',943718,'2026-07-08'),
('00000000-0000-0000-0000-000000000003','Lipedema Specialist Report.pdf','PDF',2202009,'2026-06-15'),
('00000000-0000-0000-0000-000000000003','Thyroid Panel Results.pdf','Lab Report',1048576,'2026-06-10'),
('00000000-0000-0000-0000-000000000003','Body Scan Image.jpg','Image',3565158,'2026-07-16'),
('00000000-0000-0000-0000-000000000004','Hormone Panel.pdf','Lab Report',1153433,'2026-05-18'),
('00000000-0000-0000-0000-000000000005','Final Progress Report.pdf','PDF',1887436,'2026-06-20'),
('00000000-0000-0000-0000-000000000006','Specialist Referral Letter.pdf','PDF',524288,'2026-02-25'),
('00000000-0000-0000-0000-000000000006','Metabolic Panel Jun 2026.pdf','Lab Report',1363149,'2026-06-18'),
('00000000-0000-0000-0000-000000000007','PCOS Hormonal Panel.pdf','Lab Report',1468006,'2026-06-28'),
('00000000-0000-0000-0000-000000000008','Liver Ultrasound Report.pdf','Lab Report',1677721,'2026-04-28'),
('00000000-0000-0000-0000-000000000009','Lymphatic Assessment.pdf','PDF',1887436,'2026-03-08'),
('00000000-0000-0000-0000-000000000009','Thyroid Panel Results.pdf','Lab Report',943718,'2026-03-25'),
('00000000-0000-0000-0000-000000000009','Progress Photos Jun.jpg','Image',4300185,'2026-06-30'),
('00000000-0000-0000-0000-000000000011','Initial Diabetes Panel.pdf','Lab Report',1153433,'2026-06-15'),
('00000000-0000-0000-0000-000000000012','Gut Health Panel.pdf','Lab Report',1258291,'2026-04-18'),
('00000000-0000-0000-0000-000000000012','Vitamin D Results.pdf','Lab Report',734003,'2026-06-25');
