import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorksSection";
import CommunitySection from "../components/CommunitySection";
import SecuritySection from "../components/SecuritySection";
import Cta from "../components/cta";
import Footer from "../components/Footer";
import AnimatedSection from "../components/AnimatedSection";

export default function Home() {
  return (
    <div className="bg-slate-950 text-white">
      <Header />
      <main>
        <AnimatedSection>
          <HeroSection />
        </AnimatedSection>
        <AnimatedSection>
          <HowItWorksSection />
        </AnimatedSection>
        <AnimatedSection>
          <CommunitySection />
        </AnimatedSection>
        <AnimatedSection>
          <SecuritySection />
        </AnimatedSection>
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
