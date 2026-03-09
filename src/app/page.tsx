// ============================================
// Landing Page — The Symphix grand entrance
// ============================================

import { Navbar } from "@/components/shared/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <FeaturesSection />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Symphix. One prompt. Perfect harmony.</p>
      </footer>
    </main>
  );
}
