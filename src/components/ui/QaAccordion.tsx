"use client";

import React, { useState } from "react";
import type { Question } from "@/lib/types/qa";
import { Chips } from "@/components/ui/Chips";

interface QaAccordionProps {
  questions: Question[];
  loading?: boolean;
}

export const QaAccordion: React.FC<QaAccordionProps> = ({
  questions,
  loading = false,
}) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(8);

  const categories = ["All", "Prayer", "Faith", "Daily life", "Family", "Other"];

  // Filter items based on search and active category
  const filtered = questions.filter((q) => {
    const matchesCategory =
      activeCategory === "All" || q.category === activeCategory;

    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      q.question.toLowerCase().includes(query) ||
      (q.answer && q.answer.toLowerCase().includes(query)) ||
      (q.answeredBy && q.answeredBy.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="space-y-4 font-body" aria-label="Loading questions">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-white rounded-[var(--radius-card)] p-6 border border-border-subtle animate-pulse space-y-3"
          >
            <div className="h-4 w-24 bg-primary-tint rounded-full" />
            <div className="h-6 w-3/4 bg-primary-tint rounded-md" />
            <div className="h-4 w-1/2 bg-primary-tint rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search answered questions…"
            aria-label="Search answered questions"
            className="w-full pl-11 pr-4 py-3 rounded-full border border-border-subtle bg-white text-sm text-primary placeholder:text-text-muted/50
              focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-primary transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Chips */}
        <Chips
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
          variant="dark"
        />
      </div>

      {/* Accordion List */}
      {displayed.length > 0 ? (
        <div className="space-y-4">
          {displayed.map((q) => {
            const isOpen = openId === q.id;

            return (
              <div
                key={q.id}
                className="bg-white rounded-[var(--radius-card)] border border-border-subtle overflow-hidden shadow-soft transition-shadow duration-300 hover:shadow-md"
              >
                {/* Accordion Header / Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleItem(q.id)}
                  aria-expanded={isOpen}
                  aria-controls={`qa-content-${q.id}`}
                  id={`qa-header-${q.id}`}
                  className="w-full p-6 text-left flex items-start justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
                >
                  <div className="space-y-2">
                    {/* Category Pill */}
                    <span className="inline-flex px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-secondary-tint text-secondary">
                      {q.category}
                    </span>

                    {/* Question Text */}
                    <h3 className="font-display text-lg sm:text-xl font-medium leading-snug text-primary">
                      {q.question}
                    </h3>
                  </div>

                  {/* Expand/Collapse Chevron Icon */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full bg-primary-tint flex items-center justify-center text-primary transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-secondary-tint text-secondary" : ""
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Accordion Body with CSS Grid 0fr -> 1fr smooth height animation */}
                <div
                  id={`qa-content-${q.id}`}
                  role="region"
                  aria-labelledby={`qa-header-${q.id}`}
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-2 border-t border-border-subtle/50 space-y-4">
                      {/* Answer Text */}
                      <p className="text-sm sm:text-base font-body leading-relaxed text-text-main">
                        {q.answer || "Answer pending scholar review."}
                      </p>

                      {/* Metadata: Answered By & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted pt-2 border-t border-border-subtle/30">
                        {q.answeredBy && (
                          <span className="font-medium text-secondary">
                            Answered by: {q.answeredBy}
                          </span>
                        )}
                        {q.answeredAt && (
                          <span className="text-text-muted/70">
                            {new Date(q.answeredAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show More Button */}
          {hasMore && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-full bg-primary-tint text-primary text-xs font-semibold hover:bg-primary/10 transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Show more questions ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-[var(--radius-card)] p-12 text-center border border-border-subtle shadow-soft">
          <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-4 text-text-muted">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="text-lg font-medium text-primary mb-1">
            No answered questions yet.
          </p>
          <p className="text-sm text-text-muted">
            Ask the first one using the form on the left.
          </p>
        </div>
      )}
    </div>
  );
};
