import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Hero } from "@/components/sections/Hero";
import { LiveNow } from "@/components/sections/LiveNow";
import { Videos } from "@/components/sections/Videos";
import { LatestIssue } from "@/components/sections/LatestIssue";
import { NamazGuide } from "@/components/sections/NamazGuide";
import { DhikrLibrary } from "@/components/sections/DhikrLibrary";
import { QnASection } from "@/components/sections/QnASection";
import { Leadership } from "@/components/sections/Leadership";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-bg text-text-main w-full overflow-x-hidden pt-20">
        {/* 1. Hero Section (3D Quran canvas embedded on right side) */}
        <Hero />

        {/* 2. Live Now Section */}
        <LiveNow />

        {/* 3. Speeches & Videos Section */}
        <Videos />

        {/* 4. Latest Issue Section */}
        <LatestIssue />

        {/* 5. Namaz Guide Section */}
        <NamazGuide />

        {/* 6. Dhikr & Dua Library Section */}
        <DhikrLibrary isHomePage={true} />

        {/* 7. Public Q&A Section */}
        <QnASection />

        {/* 8. Leadership Section */}
        <Leadership />

        {/* Footer */}
        <Footer />
      </main>
    </SmoothScroll>
  );
}
