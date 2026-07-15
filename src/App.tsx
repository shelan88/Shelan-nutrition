import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
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
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ProgressBar from "@/components/ProgressBar";

export default function App() {
  return (
    <LanguageProvider>
      <ProgressBar />
      <Navbar />
      <main>
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
      </main>
      <Footer />
      <BackToTop />
    </LanguageProvider>
  );
}
