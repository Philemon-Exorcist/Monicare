import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import HowItWorksSection from "./components/HowItWorksSection";
import CommunitySection from "./components/CommunitySection";
import SecuritySection from "./components/SecuritySection";
import Footer from "./components/cta";

export default function Home() {
  return (
    <div className="bg-slate-950 text-white">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <CommunitySection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
}
