export interface Issue {
  id: string;
  title: string;
  /** Malayalam versions entered in the admin; the English is shown when they are missing. */
  titleMl?: string;
  month: string;
  year: number;
  summary: string;
  summaryMl?: string;
  coverImage?: string;
  /** Tiny placeholder shown while the cover loads. */
  coverBlurDataUrl?: string;
  coverAlt?: string;
  pdfUrl: string;
  isFeatured?: boolean;
}
