import type { ActionResult } from "@/lib/auth/types";

export type IssuedUpload = {
  uploadPath: string;
  signedUrl: string;
};

export type MediaPreview = {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  bytes: number;
  blurDataUrl: string;
  alt: string;
};

export type StoredPdf = {
  path: string;
  url: string;
  bytes: number;
};

export type IssueUploadResult = ActionResult<IssuedUpload>;
export type FinalizePdfResult = ActionResult<StoredPdf>;
export type FinalizeUploadResult = ActionResult<MediaPreview>;
