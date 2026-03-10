import { Navbar } from "@/components/shared/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { AgentsSection } from "@/components/landing/agents-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <AgentsSection />
      <UseCasesSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
