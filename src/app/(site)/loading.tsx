"use client";

import { BrandLoader } from "@/components/ui/BrandLoader";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: { loading: "Loading" },
  ml: { loading: "ലോഡ് ചെയ്യുന്നു" },
});

export default function SiteLoading() {
  const t = useCopy(copy);

  return <BrandLoader variant="page" label={t.loading} className="min-h-screen" />;
}
