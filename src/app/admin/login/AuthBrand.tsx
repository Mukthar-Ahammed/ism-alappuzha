import Image from "next/image";

export function AuthBrand() {
  return (
    <div className="mb-6 flex justify-end">
      <Image
        src="/images/logo/ism-logo.png"
        alt="ISM Alappuzha"
        width={56}
        height={56}
        priority
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}
