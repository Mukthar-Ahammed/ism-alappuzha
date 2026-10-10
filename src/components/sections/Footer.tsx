"use client";

import React from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/siteConfig";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-primary border-t border-secondary/20 text-white py-16 font-body">
      <Container className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand & Organization Info */}
        <div className="md:col-span-2">
          <a href="#" className="flex items-center gap-3 group">
            <Image
              src={siteConfig.logo}
              alt="ISM Alappuzha Logo"
              width={48}
              height={48}
              className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                ISM <span className="text-secondary font-normal">Alappuzha</span>
              </span>
              <span className="text-xs text-white/60 font-medium tracking-wide">
                {siteConfig.organization}
              </span>
            </div>
          </a>

          <p className="mt-5 text-sm text-white/75 max-w-md leading-relaxed font-body">
            {siteConfig.description}
          </p>

          <div className="mt-6 space-y-1.5 text-xs text-white/60">
            <p className="flex items-center gap-2">
              <span className="text-secondary font-semibold">Address:</span>{" "}
              {siteConfig.contact.address}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-secondary font-semibold">Phone:</span>{" "}
              {siteConfig.contact.phone}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-secondary font-semibold">Email:</span>{" "}
              {siteConfig.contact.email}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-display text-lg font-medium text-secondary mb-4 tracking-wide">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm text-white/75">
            {siteConfig.navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded-xs"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect & Socials */}
        <div>
          <h3 className="font-display text-lg font-medium text-secondary mb-4 tracking-wide">
            Connect With Us
          </h3>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li>
              <a
                href={siteConfig.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors flex items-center gap-2"
              >
                <span>YouTube Channel</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors flex items-center gap-2"
              >
                <span>Instagram</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors flex items-center gap-2"
              >
                <span>Facebook Page</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors flex items-center gap-2"
              >
                <span>WhatsApp Channel</span>
              </a>
            </li>
          </ul>
        </div>
      </Container>

      {/* Copyright Bar */}
      <Container className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
        <p>© 2026 ISM Alappuzha. All rights reserved.</p>
        <p className="font-display text-white/40">
          Islamic Students Movement — Alappuzha District Committee
        </p>
      </Container>
    </footer>
  );
};
