"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PageFlip } from "page-flip";
import type { PDFDocumentLoadingTask } from "pdfjs-dist";
import "page-flip/src/Style/stPageFlip.css";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; pageCount: number; pageRatio: number }
  | { status: "error" };

type BookLayout = { pageWidth: number; pageHeight: number; portrait: boolean };

/** Rendered page images never exceed this width, so a long issue stays light on memory. */
const maxRenderWidth = 1600;
/** Below this stage width the book shows one page at a time. */
const twoPageMinWidth = 720;
/** Room kept for the side arrows on wide screens. */
const sideArrowSpace = 64;

let pdfWorker: Worker | null = null;

/** pdf.js parses in a Web Worker; one is shared by every reader the visitor opens. */
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");

  if (!pdfWorker) {
    pdfWorker = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
      type: "module",
    });
    pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
  }

  return pdfjs;
}

/** Largest page size that fits the stage, as one page (phones) or an open spread. */
function computeLayout(stageWidth: number, stageHeight: number, pageRatio: number): BookLayout {
  const portrait = stageWidth < twoPageMinWidth;
  const usableWidth = portrait ? stageWidth : stageWidth - sideArrowSpace * 2;
  const pageWidth = Math.floor(Math.min(portrait ? usableWidth : usableWidth / 2, stageHeight * pageRatio));

  return { pageWidth, pageHeight: Math.floor(pageWidth / pageRatio), portrait };
}

function createPageElement(index: number, pageCount: number): HTMLDivElement {
  const page = document.createElement("div");
  const isCover = index === 0 || index === pageCount - 1;
  // With the cover shown alone, odd pages sit on the left of each spread.
  page.className = `issue-page ${index % 2 === 1 ? "issue-page--left" : "issue-page--right"}`;
  page.dataset.density = isCover ? "hard" : "soft";

  // The alt text is set (and kept in the visitor's language) by IssueFlipbook.
  const image = document.createElement("img");
  image.draggable = false;
  image.decoding = "async";
  page.append(image);

  return page;
}

const copy = defineCopy({
  en: {
    page: (n: number) => `Page ${n}`,
    pageOf: (n: number, total: number) => `Page ${n} of ${total}`,
    pagesOf: (from: number, to: number, total: number) => `Pages ${from}–${to} of ${total}`,
    error: "This issue could not be opened as a book here.",
    openPdf: "Open the PDF",
    opening: "Opening the issue",
    prevPage: "Previous page",
    nextPage: "Next page",
    hint: " · drag a corner or use the arrow keys",
  },
  ml: {
    page: (n: number) => `പേജ് ${n}`,
    pageOf: (n: number, total: number) => `${total}-ൽ പേജ് ${n}`,
    pagesOf: (from: number, to: number, total: number) => `${total}-ൽ പേജുകൾ ${from}–${to}`,
    error: "ഈ ലക്കം ഇവിടെ പുസ്തകരൂപത്തിൽ തുറക്കാനായില്ല.",
    openPdf: "പി.ഡി.എഫ് തുറക്കുക",
    opening: "ലക്കം തുറക്കുന്നു",
    prevPage: "മുൻ പേജ്",
    nextPage: "അടുത്ത പേജ്",
    hint: " · മൂല വലിച്ചോ ആരോ കീകൾ ഉപയോഗിച്ചോ പേജ് മറിക്കുക",
  },
});

function spreadLabel(current: number, pageCount: number, portrait: boolean, t: (typeof copy)["en"]): string {
  if (portrait || current === 0 || current >= pageCount - 1) {
    return t.pageOf(current + 1, pageCount);
  }

  return t.pagesOf(current + 1, current + 2, pageCount);
}

export const IssueFlipbook: React.FC<{ pdfUrl: string; title: string }> = ({ pdfUrl, title }) => {
  const t = useCopy(copy);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookHostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const pagesRef = useRef<HTMLDivElement[]>([]);
  const currentRef = useRef(0);
  const renderWidthRef = useRef(0);

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [portrait, setPortrait] = useState(false);
  const [prefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Track the stage size; the book is rebuilt to fit whenever it changes.
  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(([entry]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }, 120);
    });

    observer.observe(stage);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Page alt text follows the chosen language without reopening the PDF.
  useEffect(() => {
    pagesRef.current.forEach((page, index) => {
      const image = page.querySelector("img");
      if (image) image.alt = t.page(index + 1);
    });
  }, [t, loadState]);

  // Open the PDF, then draw its pages into images, nearest to the open spread first.
  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    const objectUrls: string[] = [];

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        loadingTask = pdfjs.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        const firstPage = await pdf.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 1 });
        const pageCount = pdf.numPages;

        pagesRef.current = Array.from({ length: pageCount }, (_, index) => createPageElement(index, pageCount));
        setLoadState({ status: "ready", pageCount, pageRatio: firstViewport.width / firstViewport.height });

        const rendered = new Set<number>();

        while (!cancelled && rendered.size < pageCount) {
          // Wait for the first layout so pages are drawn at the size they are shown.
          if (renderWidthRef.current === 0) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            continue;
          }

          const focus = currentRef.current;
          let next = -1;

          for (let index = 0; index < pageCount; index += 1) {
            if (!rendered.has(index) && (next === -1 || Math.abs(index - focus) < Math.abs(next - focus))) {
              next = index;
            }
          }

          rendered.add(next);

          const page = await pdf.getPage(next + 1);
          const baseViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: renderWidthRef.current / baseViewport.width });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          await page.render({ canvas, viewport }).promise;
          page.cleanup();

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));

          if (cancelled || !blob) continue;

          const url = URL.createObjectURL(blob);
          objectUrls.push(url);

          const pageElement = pagesRef.current[next];
          const image = pageElement?.querySelector("img");

          if (image) {
            image.src = url;
            pageElement.classList.add("issue-page--ready");
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[issue reader] could not open the PDF:", error instanceof Error ? error.name : error);
          setLoadState({ status: "error" });
        }
      }
    })();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      void loadingTask?.destroy();
    };
  }, [pdfUrl]);

  // Build (or rebuild after a resize) the flipping book around the page elements.
  useEffect(() => {
    const host = bookHostRef.current;

    if (loadState.status !== "ready" || !stageSize || !host) return;

    const layout = computeLayout(stageSize.width, stageSize.height, loadState.pageRatio);

    if (layout.pageWidth < 80) return;

    if (renderWidthRef.current === 0) {
      renderWidthRef.current = Math.min(maxRenderWidth, Math.ceil(layout.pageWidth * Math.min(window.devicePixelRatio || 1, 2)));
    }

    // page-flip removes its root element on destroy, so it gets one React does not own.
    const block = document.createElement("div");
    host.style.width = `${layout.portrait ? layout.pageWidth : layout.pageWidth * 2}px`;
    host.append(block);

    let cancelled = false;
    let pageFlip: PageFlip | null = null;

    // page-flip touches the DOM, so it loads only once a reader is open.
    void import("page-flip").then(({ PageFlip: PageFlipBook }) => {
      if (cancelled) return;

      const book = new PageFlipBook(block, {
        startPage: currentRef.current,
        size: "stretch",
        width: layout.pageWidth,
        height: layout.pageHeight,
        minWidth: Math.floor(layout.pageWidth * 0.6),
        maxWidth: layout.pageWidth,
        minHeight: 100,
        maxHeight: 4000,
        autoSize: true,
        usePortrait: true,
        showCover: true,
        drawShadow: true,
        maxShadowOpacity: 0.55,
        flippingTime: prefersReducedMotion ? 1 : 900,
        mobileScrollSupport: false,
        showPageCorners: !prefersReducedMotion,
      });

      book.loadFromHTML(pagesRef.current);
      book.on("flip", (event) => {
        const page = Number(event.data);
        currentRef.current = page;
        setCurrentPage(page);
      });

      pageFlip = book;
      flipRef.current = book;
      setPortrait(layout.portrait);
      setCurrentPage(book.getCurrentPageIndex());
    });

    return () => {
      cancelled = true;
      flipRef.current = null;
      // Keep the page elements (and their drawn images) for the next build.
      pagesRef.current.forEach((page) => page.remove());

      if (pageFlip) {
        pageFlip.destroy();
      } else {
        block.remove();
      }
    };
  }, [loadState, stageSize, prefersReducedMotion]);

  const flipNext = useCallback(() => flipRef.current?.flipNext(), []);
  const flipPrev = useCallback(() => flipRef.current?.flipPrev(), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") flipNext();
      if (event.key === "ArrowLeft") flipPrev();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipNext, flipPrev]);

  const pageCount = loadState.status === "ready" ? loadState.pageCount : 0;
  const atStart = currentPage === 0;
  const atEnd = pageCount > 0 && currentPage >= pageCount - (portrait ? 1 : 2);

  return (
    <div className="flex h-full flex-col">
      <div ref={stageRef} className="relative flex-1 min-h-0">
        {loadState.status === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-sm text-white/80">{t.error}</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t.openPdf}
            </a>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {loadState.status === "loading" && (
              <BrandLoader variant="overlay" label={t.opening} />
            )}

            {!portrait && loadState.status === "ready" && (
              <button
                type="button"
                onClick={flipPrev}
                disabled={atStart}
                aria-label={t.prevPage}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <ChevronIcon direction="left" />
              </button>
            )}

            <div ref={bookHostRef} className="issue-book" aria-label={`${title}, ${spreadLabel(currentPage, pageCount, portrait, t)}`} />

            {!portrait && loadState.status === "ready" && (
              <button
                type="button"
                onClick={flipNext}
                disabled={atEnd}
                aria-label={t.nextPage}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <ChevronIcon direction="right" />
              </button>
            )}
          </div>
        )}
      </div>

      {loadState.status === "ready" && (
        <div className="flex items-center justify-center gap-4 pt-4 text-white">
          {portrait && (
            <button
              type="button"
              onClick={flipPrev}
              disabled={atStart}
              aria-label={t.prevPage}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <ChevronIcon direction="left" />
            </button>
          )}
          <p className="text-xs sm:text-sm text-white/75 tabular-nums" aria-live="polite">
            {spreadLabel(currentPage, pageCount, portrait, t)}
            <span className="hidden sm:inline text-white/45">{t.hint}</span>
          </p>
          {portrait && (
            <button
              type="button"
              onClick={flipNext}
              disabled={atEnd}
              aria-label={t.nextPage}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <ChevronIcon direction="right" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ChevronIcon: React.FC<{ direction: "left" | "right" }> = ({ direction }) => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
    />
  </svg>
);
