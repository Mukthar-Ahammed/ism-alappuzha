"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteData } from "@/data/site";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils/cn";
import { defineCopy, useCopy } from "@/lib/i18n/locale";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

const copy = defineCopy({
  en: {
    home: "ISM Alappuzha Home",
    committee: "District Committee",
    links: {
      "/#videos": "Videos",
      "/#issue": "Issue",
      "/#namaz": "Namaz",
      "/#dhikr": "Dhikr & Dua",
      "/#qna": "Q&A",
      "/#leaders": "Leaders",
    } as Record<string, string>,
    mainNav: "Main Navigation",
    mobileNav: "Mobile Navigation",
    live: "LIVE",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    watchNow: "Watch now",
    ask: "Ask a question",
    language: "Language",
  },
  ml: {
    home: "ISM ആലപ്പുഴ ഹോം",
    committee: "ജില്ലാ കമ്മിറ്റി",
    links: {
      "/#videos": "വീഡിയോകൾ",
      "/#issue": "പ്രസിദ്ധീകരണം",
      "/#namaz": "നമസ്കാരം",
      "/#dhikr": "ദിക്ർ & ദുആ",
      "/#qna": "ചോദ്യോത്തരം",
      "/#leaders": "നേതൃത്വം",
    },
    mainNav: "പ്രധാന നാവിഗേഷൻ",
    mobileNav: "മൊബൈൽ നാവിഗേഷൻ",
    live: "തത്സമയം",
    openMenu: "മെനു തുറക്കുക",
    closeMenu: "മെനു അടയ്ക്കുക",
    watchNow: "ഇപ്പോൾ കാണുക",
    ask: "ചോദ്യം ചോദിക്കുക",
    language: "ഭാഷ",
  },
});

export const Navbar: React.FC<{ isLive: boolean }> = ({ isLive }) => {
  const t = useCopy(copy);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > 120) {
        if (currentScrollY > lastScrollY && !mobileMenuOpen) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  // While the phone menu is open: the page behind it stays still, Escape closes it, and
  // widening past the md breakpoint (rotating a tablet) closes it too.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-[transform,padding,box-shadow] duration-300 font-body bg-white/95 backdrop-blur-md",
        isVisible ? "translate-y-0" : "-translate-y-full",
        isScrolled || mobileMenuOpen
          ? "border-b border-primary/10 shadow-soft py-2.5 sm:py-3"
          : "py-3.5 sm:py-5"
      )}
    >
      <Container className="flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg p-1 group"
          aria-label={t.home}
        >
          <Image
            src={siteData.logo}
            alt="ISM Alappuzha Logo"
            width={44}
            height={44}
            className="h-9 sm:h-10 w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-lg min-[380px]:text-xl sm:text-2xl font-bold tracking-tight text-primary leading-none whitespace-nowrap">
              ISM <span className="text-secondary font-normal">Alappuzha</span>
            </span>
            <span className="text-[10px] sm:text-xs text-text-muted font-medium tracking-wide">
              {t.committee}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center space-x-7 text-sm font-medium text-text-main"
          aria-label={t.mainNav}
        >
          {siteData.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-md px-2 py-1"
            >
              {t.links[link.href] ?? link.label}
            </Link>
          ))}
        </nav>

        {/* Action Group: LIVE Pill & Mobile Button */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden min-[420px]:inline-flex" />

          {/* Conditional Pulsing Red LIVE Pill */}
          {isLive && (
            <Link
              href="/#live"
              onClick={closeMenu}
              className="flex min-h-9 items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shadow-xs animate-in fade-in"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="font-semibold tracking-wide">{t.live}</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={cn(
              "md:hidden flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              mobileMenuOpen ? "bg-primary-tint" : "hover:bg-primary-tint"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7h16M4 12h16M4 17h10"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile Drawer Menu; tapping the dimmed page behind it closes it */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-x-0 top-full h-[100dvh] bg-primary/30 animate-in fade-in"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            className="md:hidden absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-white border-b border-primary/10 shadow-floating rounded-b-[22px] animate-in fade-in slide-in-from-top-4"
          >
            <nav className="flex flex-col px-4 pt-2 pb-5 font-body" aria-label={t.mobileNav}>
              {siteData.navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-12 items-center justify-between rounded-xl px-3 text-base font-medium text-text-main transition-colors hover:bg-primary-tint active:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  onClick={closeMenu}
                >
                  {t.links[link.href] ?? link.label}
                  <svg className="h-4 w-4 text-text-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-primary/10 pt-4">
                <Link
                  href="/#videos"
                  onClick={closeMenu}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  {t.watchNow}
                </Link>
                <Link
                  href="/#qna"
                  onClick={closeMenu}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/30 bg-secondary-tint px-4 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  {t.ask}
                </Link>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 px-1">
                <span className="text-sm font-medium text-text-muted">{t.language}</span>
                <LanguageToggle />
              </div>

              <p className="mt-4 px-1 text-xs leading-relaxed text-text-muted">
                {siteData.contact.address}
              </p>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
