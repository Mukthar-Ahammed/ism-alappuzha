"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Chips } from "@/components/ui/Chips";
import { DhikrCard } from "@/components/ui/DhikrCard";
import { StudyMode } from "@/components/ui/StudyMode";
import {
  dhikrData,
  dhikrCategories,
  dhikrScholarNote,
  type DhikrCategory,
} from "@/data/dhikr";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

const FAVORITES_KEY = "ism-dhikr-favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveFavorites(favs: Set<string>): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
  } catch {
    /* ignore */
  }
}

interface DhikrLibraryProps {
  isHomePage?: boolean;
}

export const DhikrLibrary: React.FC<DhikrLibraryProps> = ({
  isHomePage = false,
}) => {
  // ── State ──
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<DhikrCategory>("All");
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [showStudyMode, setShowStudyMode] = useState(false);
  const hasMounted = useHasMounted();

  // ── Derived categories (add Favorites chip when any exist) ──
  const allCategories = useMemo(() => {
    const base = [...dhikrCategories] as string[];
    if (favorites.size > 0) {
      base.splice(1, 0, "Favorites");
    }
    return base;
  }, [favorites.size]);

  // ── Toggle favorite ──
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  // ── Filtering ──
  const filteredItems = useMemo(() => {
    let items = dhikrData;

    // Category filter
    if (activeCategory === ("Favorites" as string)) {
      items = items.filter((i) => favorites.has(i.id));
    } else if (activeCategory !== "All") {
      items = items.filter((i) => i.category === activeCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.arabic.includes(q) ||
          i.transliteration.toLowerCase().includes(q) ||
          i.malayalam.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q)
      );
    }

    return items;
  }, [search, activeCategory, favorites]);

  // ── Limit items on homepage (show max 6: 2 rows of 3 columns) ──
  const displayedItems = isHomePage ? filteredItems.slice(0, 6) : filteredItems;

  // ── Clear search ──
  const clearSearch = useCallback(() => {
    setSearch("");
    setActiveCategory("All");
  }, []);

  // ── Scroll-reveal ref ──
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="dhikr"
        className="relative w-full py-24 md:py-32 bg-bg overflow-hidden"
      >
        <Container>
          {/* Back button on dedicated page */}
          {!isHomePage && (
            <div className="mb-6">
              <Link
                href="/#dhikr"
                className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors group"
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
                  className="transition-transform group-hover:-translate-x-1"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Home
              </Link>
            </div>
          )}

          {/* ── Heading ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-12 md:mb-16"
          >
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-[1.1] text-primary">
              Dhikr &amp; dua library
            </h2>
            <p className="mt-4 text-lg sm:text-xl font-body font-light leading-relaxed text-text-muted">
              Search, listen and study daily remembrances.
            </p>
          </motion.div>

          {/* ── Toolbar ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            {/* Search bar */}
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
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
                placeholder="Search dhikr by Arabic, transliteration, or category…"
                aria-label="Search dhikr"
                className="w-full pl-11 pr-4 py-3 rounded-full border border-border-subtle bg-white text-sm text-primary placeholder:text-text-muted/50 font-body
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

            {/* Category chips + Study mode */}
            <div className="flex flex-wrap items-center gap-3">
              <Chips
                categories={allCategories}
                activeCategory={activeCategory}
                onChange={(cat) =>
                  setActiveCategory(cat as DhikrCategory)
                }
                className="flex-1 min-w-0"
              />
              <button
                onClick={() => setShowStudyMode(true)}
                disabled={filteredItems.length === 0}
                aria-label="Open study mode"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap
                  bg-secondary text-white hover:bg-secondary-hover transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Study mode
              </button>
            </div>
          </motion.div>

          {/* ── Results grid ── */}
          {displayedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.45,
                    delay: 0.15 + idx * 0.06,
                  }}
                >
                  <DhikrCard
                    item={item}
                    isFavorite={hasMounted && favorites.has(item.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            /* ── Empty state ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <p className="text-lg font-medium text-primary mb-1">
                No results
              </p>
              <p className="text-sm text-text-muted mb-6">
                Try another word or clear the filter.
              </p>
              <button
                onClick={clearSearch}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Clear search
              </button>
            </motion.div>
          )}

          {/* ── Show All Button (Home Page only) ── */}
          {isHomePage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.4 }}
              className="mt-12 flex justify-center"
            >
              <Link
                href="/dhikr"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-soft transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <span>Show all dhikr &amp; dua ({dhikrData.length})</span>
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
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </motion.div>
          )}

          {/* ── Scholar note ── */}
          <div className="mt-16 pt-8 border-t border-border-subtle">
            <p className="text-xs text-text-muted/60 italic leading-relaxed max-w-2xl">
              ⚠️ {dhikrScholarNote}
            </p>
          </div>
        </Container>
      </section>

      {/* ── Study Mode Modal ── */}
      {showStudyMode && (
        <StudyMode
          items={filteredItems}
          onClose={() => setShowStudyMode(false)}
        />
      )}
    </>
  );
};
