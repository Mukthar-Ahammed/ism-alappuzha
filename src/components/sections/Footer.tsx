"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/siteConfig";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    logoAlt: "ISM Alappuzha Logo",
    brand: "ISM",
    district: "Alappuzha",
    organization: siteConfig.organization,
    description: siteConfig.description,
    address: "Address:",
    addressValue: siteConfig.contact.address,
    phone: "Phone:",
    email: "Email:",
    quickLinks: "Quick Links",
    links: Object.fromEntries(siteConfig.navLinks.map((link) => [link.href, link.label])) as Record<
      string,
      string
    >,
    connect: "Connect With Us",
    youtube: "YouTube Channel",
    instagram: "Instagram",
    facebook: "Facebook Page",
    whatsapp: "WhatsApp Channel",
    copyright: "© 2026 ISM Alappuzha. All rights reserved.",
    backToTop: "Back to top",
  },
  ml: {
    logoAlt: "ഐ.എസ്.എം ആലപ്പുഴ ലോഗോ",
    brand: "ഐ.എസ്.എം",
    district: "ആലപ്പുഴ",
    organization: "ഇത്തിഹാദു ശുബ്ബാനിൽ മുജാഹിദീൻ — ആലപ്പുഴ ജില്ലാ കമ്മിറ്റി",
    description:
      "ആധികാരിക ഇസ്‌ലാമിക അറിവിലൂടെയും ധാർമിക ജീവിതത്തിലൂടെയും സാമൂഹിക നേതൃത്വത്തിലൂടെയും ആലപ്പുഴ ജില്ലയിലെ യുവതയെ ശാക്തീകരിക്കുന്നു.",
    address: "വിലാസം:",
    addressValue: "ഐ.എസ്.എം ജില്ലാ കേന്ദ്രം, ജില്ലാ കോടതി പാലത്തിന് സമീപം, ആലപ്പുഴ, കേരളം 688001",
    phone: "ഫോൺ:",
    email: "ഇമെയിൽ:",
    quickLinks: "ദ്രുത ലിങ്കുകൾ",
    links: {
      "/#videos": "വീഡിയോകൾ",
      "/#issue": "പ്രസിദ്ധീകരണം",
      "/#namaz": "നമസ്കാരം",
      "/#dhikr": "ദിക്ർ & ദുആ",
      "/#qna": "ചോദ്യോത്തരം",
      "/#leaders": "നേതൃത്വം",
    },
    connect: "ഞങ്ങളുമായി ബന്ധപ്പെടുക",
    youtube: "യൂട്യൂബ് ചാനൽ",
    instagram: "ഇൻസ്റ്റാഗ്രാം",
    facebook: "ഫേസ്ബുക്ക് പേജ്",
    whatsapp: "വാട്സ്ആപ്പ് ചാനൽ",
    copyright: "© 2026 ഐ.എസ്.എം ആലപ്പുഴ. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.",
    backToTop: "മുകളിലേക്ക് പോകുക",
  },
});

function scrollToTop() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

export const Footer: React.FC = () => {
  const t = useCopy(copy);
  return (
    <footer className="w-full bg-primary border-t border-secondary/20 text-white pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-16 font-body">
      <Container className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 md:gap-12">
        {/* Brand & Organization Info */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src={siteConfig.logo}
              alt={t.logoAlt}
              width={48}
              height={48}
              className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {t.brand} <span className="text-secondary font-normal">{t.district}</span>
              </span>
              <span className="text-xs text-white/60 font-medium tracking-wide">
                {t.organization}
              </span>
            </div>
          </Link>

          <p className="mt-5 text-sm text-white/75 max-w-md leading-relaxed font-body">
            {t.description}
          </p>

          <div className="mt-6 space-y-2 text-xs text-white/60">
            <p>
              <span className="text-secondary font-semibold">{t.address}</span>{" "}
              {t.addressValue}
            </p>
            <p>
              <span className="text-secondary font-semibold">{t.phone}</span>{" "}
              <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="hover:text-secondary transition-colors">
                {siteConfig.contact.phone}
              </a>
            </p>
            <p>
              <span className="text-secondary font-semibold">{t.email}</span>{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="break-all hover:text-secondary transition-colors">
                {siteConfig.contact.email}
              </a>
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-display text-lg font-medium text-secondary mb-4 tracking-wide">
            {t.quickLinks}
          </h3>
          <ul className="space-y-1 sm:space-y-2.5 text-sm text-white/75">
            {siteConfig.navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-10 items-center sm:min-h-0 hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded-xs"
                >
                  {t.links[link.href] ?? link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect & Socials */}
        <div>
          <h3 className="font-display text-lg font-medium text-secondary mb-4 tracking-wide">
            {t.connect}
          </h3>
          <ul className="space-y-1 sm:space-y-2.5 text-sm text-white/75">
            <li>
              <a
                href={siteConfig.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 sm:min-h-0 hover:text-secondary transition-colors"
              >
                <span>{t.youtube}</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 sm:min-h-0 hover:text-secondary transition-colors"
              >
                <span>{t.instagram}</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 sm:min-h-0 hover:text-secondary transition-colors"
              >
                <span>{t.facebook}</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 sm:min-h-0 hover:text-secondary transition-colors"
              >
                <span>{t.whatsapp}</span>
              </a>
            </li>
          </ul>
        </div>
      </Container>

      {/* Copyright Bar */}
      <Container className="mt-10 sm:mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-xs text-white/50 gap-4">
        <button
          type="button"
          onClick={scrollToTop}
          className="group order-first sm:order-last inline-flex min-h-11 items-center gap-2.5 rounded-full border border-secondary/40 bg-secondary/10 py-1.5 pl-4 pr-1.5 text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          <span>{t.backToTop}</span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary transition-transform group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-secondary motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
          >
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6l6-6 6 6" />
            </svg>
          </span>
        </button>
        <div className="space-y-1">
          <p>{t.copyright}</p>
          <p className="font-display text-white/40">
            {t.organization}
          </p>
        </div>
      </Container>
    </footer>
  );
};
