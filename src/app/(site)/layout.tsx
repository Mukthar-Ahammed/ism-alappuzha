import { Navbar } from "@/components/ui/Navbar";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { HtmlLang } from "@/components/ui/LanguageToggle";
import { getPublicLive } from "@/features/live/server/data";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const live = await getPublicLive();

  return (
    <>
      <HtmlLang />
      <ScrollProgressBar />
      <Navbar isLive={live.isLive} />
      {children}
    </>
  );
}
