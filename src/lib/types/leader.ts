export interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Malayalam versions from the admin; absent shows the English. */
  nameMl?: string;
  roleMl?: string;
  bioMl?: string;
  /** Raster photo URL; SVG placeholders and missing photos show initials. */
  photo?: string | null;
  photoAlt?: string;
  photoBlurDataUrl?: string;
  instagram?: string;
  linkedin?: string;
}
