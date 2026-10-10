import type { Metadata } from "next";
import { DhikrLibrary } from "@/components/sections/DhikrLibrary";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Dhikr & Dua Library",
  description:
    "Complete collection of authentic daily dhikr and dua with Arabic text, transliteration, Malayalam translation, and audio.",
};

export default function DhikrPage() {
  return (
    <main className="relative min-h-screen bg-bg text-text-main w-full overflow-x-hidden pt-24">
      {/* Full Dhikr Library component */}
      <DhikrLibrary isHomePage={false} />

      {/* Page Footer */}
      <Footer />
    </main>
  );
}
