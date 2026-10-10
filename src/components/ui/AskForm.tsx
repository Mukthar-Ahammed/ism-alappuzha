"use client";

import React, { useCallback, useState } from "react";
import { questionCategories, type QuestionCategory } from "@/lib/types/qa";

const CLIENT_RATE_LIMIT_KEY = "ism_qa_last_submit_ts";
const RATE_LIMIT_SECONDS = 60;

export const AskForm: React.FC = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<QuestionCategory>("Prayer");
  const [question, setQuestion] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot field
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedQuestion = question.trim();
  const charCount = question.length;
  const isValidLength = charCount >= 10 && charCount <= 500;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSuccessMessage(null);
      setErrorMessage(null);

      // 1. Client-side length check
      if (!isValidLength) {
        setErrorMessage(
          "Your question must be between 10 and 500 characters long."
        );
        return;
      }

      // 2. Client-side rate limit check (1 submission per 60 seconds per browser)
      try {
        const lastSubmitRaw = localStorage.getItem(CLIENT_RATE_LIMIT_KEY);
        if (lastSubmitRaw) {
          const lastSubmitTs = parseInt(lastSubmitRaw, 10);
          const elapsedSeconds = Math.floor((Date.now() - lastSubmitTs) / 1000);
          if (elapsedSeconds < RATE_LIMIT_SECONDS) {
            const waitTime = RATE_LIMIT_SECONDS - elapsedSeconds;
            setErrorMessage(
              `Please wait ${waitTime} second${
                waitTime === 1 ? "" : "s"
              } before submitting another question.`
            );
            return;
          }
        }
      } catch {
        /* localStorage unavailable/disabled */
      }

      setSubmitting(true);

      try {
        const res = await fetch("/api/qa/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            category,
            question: trimmedQuestion,
            website, // honeypot
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Record client rate limit timestamp
          try {
            localStorage.setItem(CLIENT_RATE_LIMIT_KEY, Date.now().toString());
          } catch {
            /* ignore */
          }

          setSuccessMessage(
            data.message ||
              "Question sent. It will appear here after a scholar answers it."
          );
          // Clear form
          setName("");
          setQuestion("");
          setWebsite("");
        } else {
          setErrorMessage(
            data.error ||
              "Could not send your question. Please check your connection and try again."
          );
        }
      } catch {
        setErrorMessage(
          "Could not send. Check your connection and try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [name, category, trimmedQuestion, website, isValidLength]
  );

  return (
    <div className="bg-white rounded-[var(--radius-card)] p-6 sm:p-8 border border-border-subtle shadow-[var(--shadow-soft)] font-body">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Honeypot field (hidden from humans) */}
        <div
          aria-hidden="true"
          className="hidden"
          style={{ display: "none", opacity: 0, position: "absolute", left: "-9999px" }}
        >
          <label htmlFor="website-hp">Website</label>
          <input
            type="text"
            id="website-hp"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Name (Optional) */}
        <div>
          <label
            htmlFor="qa-name"
            className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2"
          >
            Your Name <span className="text-text-muted font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            id="qa-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmad or Anonymous"
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary placeholder:text-text-muted/50
              focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="qa-category"
            className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2"
          >
            Category <span className="text-secondary">*</span>
          </label>
          <select
            id="qa-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as QuestionCategory)}
            required
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary font-medium
              focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 cursor-pointer"
          >
            {questionCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Question Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="qa-question"
              className="block text-xs font-semibold uppercase tracking-wider text-primary"
            >
              Your Question <span className="text-secondary">*</span>
            </label>
            <span
              className={`text-xs font-mono font-medium ${
                charCount > 0 && !isValidLength
                  ? "text-red-600 font-bold"
                  : "text-text-muted"
              }`}
            >
              {charCount} / 500
            </span>
          </div>
          <textarea
            id="qa-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question clearly here (minimum 10 characters)..."
            rows={4}
            minLength={10}
            maxLength={500}
            required
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary placeholder:text-text-muted/50 resize-none
              focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Feedback Messages (Announced with aria-live) */}
        <div aria-live="polite">
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-start gap-3 animate-in fade-in">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-emerald-600 mt-0.5"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-start gap-3 animate-in fade-in">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-red-600 mt-0.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !isValidLength}
          className="w-full py-3.5 px-6 rounded-full bg-secondary text-primary font-semibold text-sm transition-all duration-200 shadow-soft
            hover:bg-secondary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <span>Send question</span>
          )}
        </button>

        {/* Privacy Note */}
        <p className="text-xs text-text-muted/70 text-center leading-relaxed">
          🔒 Do not share phone numbers or private details in your question.
        </p>
      </form>
    </div>
  );
};
