import type { Metadata } from "next";
import { DhikrLibrary } from "@/components/sections/DhikrLibrary";
import { Footer } from "@/components/sections/Footer";
import { getPublicDhikr } from "@/features/dhikr/server/data";

export const metadata: Metadata = {
  title: "Dhikr & Dua Library",
  description:
    "Complete collection of authentic daily dhikr and dua with Arabic text, transliteration, Malayalam translation, and audio.",
};

export default async function DhikrPage() {
  const dhikr = await getPublicDhikr();

  return (
    <main className="relative min-h-screen bg-bg text-text-main w-full overflow-x-hidden pt-24">
      {/* Full Dhikr Library component */}
      <DhikrLibrary items={dhikr} isHomePage={false} />

      {/* Page Footer */}
      <Footer />
    </main>
  );
}
