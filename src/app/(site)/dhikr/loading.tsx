import { Container } from "@/components/ui/Container";
import { DhikrCardSkeleton } from "@/components/ui/CardSkeletons";

/** Mirrors the dhikr library: heading, search and category chips, then the card grid. */
export default function DhikrLoading() {
  return (
    <main className="relative min-h-screen bg-bg w-full overflow-x-hidden pt-24">
      <section className="py-24 md:py-32">
        <Container>
          <p role="status" className="sr-only">Loading dhikr and dua…</p>
          <div aria-hidden="true" className="mb-12 space-y-4">
            <div className="skeleton h-4 w-32 rounded-md" />
            <div className="skeleton h-10 w-72 max-w-full rounded-lg" />
            <div className="skeleton h-4 w-[30rem] max-w-full rounded-md" />
            <div className="skeleton mt-8 h-12 w-full rounded-full" />
            <div className="flex gap-2 overflow-hidden">
              {[16, 36, 26, 16, 18, 16, 28, 24].map((width, chip) => (
                <div key={chip} className="skeleton h-9 shrink-0 rounded-full" style={{ width: `${width * 4}px` }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, card) => (
              <DhikrCardSkeleton key={card} />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
