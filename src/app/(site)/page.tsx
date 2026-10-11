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
import { getPublicLeaders } from "@/features/leaders/server/data";
import { getPublicLive } from "@/features/live/server/data";
import { getPublicPrograms } from "@/features/programs/server/data";
import { getPublicVideos } from "@/features/videos/server/data";
import { getPublicIssues } from "@/features/issues/server/data";
import { getPublicDhikr } from "@/features/dhikr/server/data";
import { getPublicNamazSteps } from "@/features/namaz/server/data";

export default async function Home() {
  const [leaders, live, programs, videos, issues, dhikr, namazSteps] = await Promise.all([
    getPublicLeaders(),
    getPublicLive(),
    getPublicPrograms(),
    getPublicVideos(),
    getPublicIssues(),
    getPublicDhikr(),
    getPublicNamazSteps(),
  ]);

  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-bg text-text-main w-full overflow-x-hidden pt-20">
        {/* 1. Hero Section (3D Quran canvas embedded on right side) */}
        <Hero />

        {/* 2. Live Now Section */}
        <LiveNow live={live} programs={programs} />

        {/* 3. Speeches & Videos Section */}
        <Videos videos={videos} />

        {/* 4. Latest Issue Section */}
        <LatestIssue issues={issues} />

        {/* 5. Namaz Guide Section */}
        <NamazGuide steps={namazSteps} />

        {/* 6. Dhikr & Dua Library Section */}
        <DhikrLibrary items={dhikr} isHomePage={true} />

        {/* 7. Public Q&A Section */}
        <QnASection />

        {/* 8. Leadership Section */}
        <Leadership leaders={leaders} />

        {/* Footer */}
        <Footer />
      </main>
    </SmoothScroll>
  );
}
