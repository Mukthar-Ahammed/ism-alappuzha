"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/Container";
import { IssueCover } from "@/components/ui/IssueCover";
import { PdfModal } from "@/components/ui/PdfModal";
import { ArchiveCarousel } from "@/components/ui/ArchiveCarousel";
import { issuesData, Issue } from "@/data/issues";

export const LatestIssue: React.FC = () => {
  const featuredIssue = issuesData.find((i) => i.isFeatured) || issuesData[0];
  const pastIssues = issuesData.filter((i) => i.id !== featuredIssue.id);

  const [activePdf, setActivePdf] = useState<Issue | null>(null);

  return (
    <section
      id="issue"
      className="py-20 md:py-28 bg-primary-tint border-y border-primary/10 font-body text-text-main overflow-hidden"
    >
      <Container>
        {/* Main Section Header */}
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Publications &amp; Journals
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-primary tracking-tight mt-1">
            Latest Issue
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted leading-relaxed">
            Read our monthly editorial publication on campus activism, spiritual growth, and Islamic intellectual discourse in Alappuzha.
          </p>
        </div>

        {/* Featured Issue Spotlight (2 Columns Desktop, Stacked Mobile) */}
        <div className="bg-white rounded-[22px] border border-primary/10 shadow-floating p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Magazine Cover Card with 3D Tilt */}
          <div className="lg:col-span-5 max-w-sm mx-auto lg:max-w-none w-full">
            <IssueCover
              issue={featuredIssue}
              onClick={() => setActivePdf(featuredIssue)}
            />
          </div>

          {/* Right Column: Issue Details & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary-tint text-primary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Current Edition • {featuredIssue.month} {featuredIssue.year}</span>
            </div>

            <h3 className="font-display text-3xl sm:text-4xl font-bold text-primary tracking-tight mt-4 leading-tight">
              {featuredIssue.title}
            </h3>

            <p className="mt-4 text-sm sm:text-base text-text-muted leading-relaxed font-body">
              {featuredIssue.summary}
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setActivePdf(featuredIssue)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                <span>Read online</span>
              </button>

              <a
                href={featuredIssue.pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-secondary-tint hover:bg-secondary/20 text-primary border border-secondary/30 px-7 py-3.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Past Issues Archive Carousel */}
        {pastIssues.length > 0 && (
          <ArchiveCarousel
            issues={pastIssues}
            onRead={(issue) => setActivePdf(issue)}
          />
        )}
      </Container>

      {/* Accessible PDF Reader Modal */}
      {activePdf && (
        <PdfModal
          isOpen={!!activePdf}
          onClose={() => setActivePdf(null)}
          pdfUrl={activePdf.pdfUrl}
          title={`${activePdf.title} (${activePdf.month} ${activePdf.year})`}
        />
      )}
    </section>
  );
};
