import Image from "next/image";

export function AuthBrand() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <Image
        src="/images/logo/ism-logo.png"
        alt="ISM Alappuzha"
        width={56}
        height={56}
        priority
        className="h-12 w-auto object-contain"
      />
      <span className="text-lg font-bold text-primary">Admin</span>
    </div>
  );
}
