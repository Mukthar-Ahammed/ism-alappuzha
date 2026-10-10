"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { siteData } from "@/data/site";
import { liveData } from "@/data/live";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils/cn";

export const Navbar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLive, setIsLive] = useState(liveData.isLive);

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

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-transform duration-300 font-body bg-white/95 backdrop-blur-md",
        isVisible ? "translate-y-0" : "-translate-y-full",
        isScrolled ? "border-b border-primary/10 shadow-soft py-3" : "py-5"
      )}
    >
      <Container className="flex items-center justify-between">
        {/* Brand Logo & Title */}
        <a
          href="#"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg p-1 group"
          aria-label="ISM Alappuzha Home"
        >
          <Image
            src={siteData.logo}
            alt="ISM Alappuzha Logo"
            width={44}
            height={44}
            className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="flex flex-col">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-primary leading-none">
              ISM <span className="text-secondary font-normal">Alappuzha</span>
            </span>
            <span className="text-[10px] sm:text-xs text-text-muted font-medium tracking-wide">
              District Committee
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center space-x-7 text-sm font-medium text-text-main"
          aria-label="Main Navigation"
        >
          {siteData.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-md px-2 py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Group: LIVE Pill, Dev Toggle & Mobile Button */}
        <div className="flex items-center gap-3">
          {/* Developer Preview Toggle for Live State */}
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className="hidden sm:inline-flex items-center px-2 py-1 rounded bg-gray-100 text-[10px] font-mono text-text-muted hover:text-primary hover:bg-gray-200 transition-colors"
            title="Dev Toggle: Switch Live Badge on/off for testing"
          >
            [DEV: {isLive ? "Live ON" : "Live OFF"}]
          </button>

          {/* Conditional Pulsing Red LIVE Pill */}
          {isLive && (
            <a
              href="#live"
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shadow-xs animate-in fade-in"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="font-semibold tracking-wide">LIVE</span>
            </a>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-primary hover:text-secondary rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-full bg-white border-b border-primary/10 px-6 py-6 shadow-floating animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-4 font-body">
            {siteData.navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-text-main hover:text-secondary transition-colors py-1.5 border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {siteData.contact.address}
              </span>
              <button
                type="button"
                onClick={() => setIsLive(!isLive)}
                className="px-2 py-1 rounded bg-gray-100 text-[10px] font-mono text-text-muted"
              >
                DEV: {isLive ? "Live ON" : "Live OFF"}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
