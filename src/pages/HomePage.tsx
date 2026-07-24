/**
 * HomePage — Assembles all homepage sections.
 * Page order:
 *   Hero → About → TrustStrip → Services → Programs → Stats →
 *   InfoHub → Journey → SuccessStories → Testimonials →
 *   SymptomsQuiz → FAQ → LeadMagnet → Booking → CTA
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import About from "@/components/About";
import TrustStrip from "@/components/TrustStrip";
import Services from "@/components/Services";
import Programs from "@/components/Programs";
import Stats from "@/components/Stats";
import InfoHub from "@/components/InfoHub";
import Journey from "@/components/Journey";
import SuccessStories from "@/components/SuccessStories";
import Testimonials from "@/components/Testimonials";
import SymptomsQuiz from "@/components/SymptomsQuiz";
import FAQ from "@/components/FAQ";
import LeadMagnet from "@/components/LeadMagnet";
import Booking from "@/components/Booking";
import CTA from "@/components/CTA";
import { supabase } from "@/lib/supabase";
import {
  getSectionSettings,
  type SectionSettingsRow,
} from "@/admin/repositories/aboutCms.repository";

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);

  // undefined = loading (show optimistically), null = no DB row (show by default), row = use row.visible
  const [certSectionRow, setCertSectionRow] = useState<
    SectionSettingsRow | null | undefined
  >(undefined);

  useEffect(() => {
    getSectionSettings("certifications")
      .then((row) => setCertSectionRow(row))
      .catch(() => setCertSectionRow(null));
  }, []);

  const trustStripVisible =
    certSectionRow === undefined ? true
    : certSectionRow === null    ? true
    : certSectionRow.visible;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("id")
        .eq("user_id", data.session.user.id)
        .in("role", ["admin", "staff"])
        .maybeSingle();
      setIsAdmin(!!profile);
    });
  }, []);

  return (
    <>
      {import.meta.env.DEV && isAdmin && (
        <Link
          to="/admin"
          className="fixed bottom-5 end-5 z-[9999] flex items-center gap-2 rounded-full bg-[#1c1033] px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg hover:bg-[#2d1a52] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#f35e98] animate-pulse" />
          Open Admin Dashboard
        </Link>
      )}

      {/* 1. Hero — dark brand gradient */}
      <Hero />

      {/* 2. About — dark brand gradient */}
      <About />

      {/* 3. TrustStrip — white, authority builder; hidden when admin disables certifications section */}
      {trustStripVisible && <TrustStrip />}

      {/* 4. Services — off-white #F9FAFB */}
      <Services />

      {/* 5. Programs — white */}
      <Programs />

      {/* 6. Stats — dark brand gradient */}
      <Stats />

      {/* 7. InfoHub — off-white #F9FAFB */}
      <InfoHub />

      {/* 8. Journey — white */}
      <Journey />

      {/* 9. SuccessStories — off-white #F9FAFB */}
      <SuccessStories />

      {/* 10. Testimonials — existing light-pink tint */}
      <Testimonials />

      {/* 11. SymptomsQuiz — interactive, #F3F4F6 */}
      <SymptomsQuiz />

      {/* 12. FAQ — off-white #F9FAFB */}
      <FAQ />

      {/* 13. LeadMagnet — dark, PDF email capture */}
      <LeadMagnet />

      {/* 14. Booking — dark brand gradient */}
      <Booking />

      {/* 15. CTA — dark brand gradient */}
      <CTA />
    </>
  );
}
