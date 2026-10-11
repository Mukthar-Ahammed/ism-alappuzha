import { BrandLoader } from "@/components/ui/BrandLoader";

export default function LoginLoading() {
  return <BrandLoader variant="page" label="Checking your session" className="bg-primary-tint min-h-screen" />;
}
