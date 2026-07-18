/**
 * HomePage — Assembles all existing homepage sections.
 * This is a thin orchestrator; all content lives in content.ts and data files.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Programs from "@/components/Programs";
import Stats from "@/components/Stats";
import InfoHub from "@/components/InfoHub";
import Journey from "@/components/Journey";
import SuccessStories from "@/components/SuccessStories";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Booking from "@/components/Booking";
import CTA from "@/components/CTA";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);

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
      <Hero />
      <About />
      <Services />
      <Programs />
      <Stats />
      <InfoHub />
      <Journey />
      <SuccessStories />
      <Testimonials />
      <FAQ />
      <Booking />
      <CTA />
    </>
  );
}
