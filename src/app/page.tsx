import Hero from "@/components/landing/Hero";
import ProcessSection from "@/components/landing/ProcessSection";
import TrustedBy from "@/components/landing/TrustedBy";
import Services from "@/components/landing/Services";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <Hero />
      <ProcessSection />
      <TrustedBy />
      <Services />
      <WhyChooseUs />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
