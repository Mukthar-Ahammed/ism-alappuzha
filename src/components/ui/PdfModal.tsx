"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IssueFlipbook } from "@/components/ui/IssueFlipbook";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: { reader: "Issue Reader", download: "Download PDF", close: "Close reader" },
  ml: { reader: "ലക്കം വായിക്കുക", download: "പി.ഡി.എഫ് ഡൗൺലോഡ് ചെയ്യുക", close: "അടയ്ക്കുക" },
});

export interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
}

export const PdfModal: React.FC<PdfModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  title: titleProp,
}) => {
  const t = useCopy(copy);
  const title = titleProp ?? t.reader;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col font-body animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      {/* Backdrop: a dim reading room around the book */}
      <div
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,#1d3a31_0%,#0c1b16_70%)]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-secondary" />
          <h3
            id="pdf-modal-title"
            className="font-display text-base sm:text-lg font-bold text-white truncate"
          >
            {title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href={pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.download}
            className="inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">{t.download}</span>
          </a>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label={t.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* The book: pages drawn from the PDF and turned like paper */}
      <div className="relative z-10 flex-1 min-h-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6">
        <IssueFlipbook pdfUrl={pdfUrl} title={title} />
      </div>
    </div>,
    document.body
  );
};
