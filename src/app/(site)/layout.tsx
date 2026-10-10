import { Navbar } from "@/components/ui/Navbar";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgressBar />
      <Navbar />
      {children}
    </>
  );
}
