/**
 * HomePage — Assembles all existing homepage sections.
 * This is a thin orchestrator; all content lives in content.ts and data files.
 */
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Stats from "@/components/Stats";
import InfoHub from "@/components/InfoHub";
import Journey from "@/components/Journey";
import SuccessStories from "@/components/SuccessStories";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Booking from "@/components/Booking";
import CTA from "@/components/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Services />
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
