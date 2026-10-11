"use client";

import React, { useState } from "react";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

type QuestionStatus = "pending" | "draft" | "answered" | "archived";

type StatusResult =
  | {
      ok: true;
      status: QuestionStatus;
      answer: string | null;
    }
  // `error` stays in English (as the API sends it) and is translated at render.
  | { ok: false; error: string };

const copy = defineCopy({
  en: {
    title: "Check answer status",
    intro: "Enter your Ticket ID to read the answer when it is ready.",
    ticketId: "Ticket ID",
    checking: "Checking...",
    check: "Check status",
    status: (status: QuestionStatus) => `Status: ${status}`,
    notVisible: "The answer is not visible yet. Please check again later.",
    errors: {} as Record<string, string>,
  },
  ml: {
    title: "ഉത്തരത്തിന്റെ നില പരിശോധിക്കുക",
    intro: "ഉത്തരം തയ്യാറാകുമ്പോൾ വായിക്കാൻ നിങ്ങളുടെ ടിക്കറ്റ് ഐഡി നൽകുക.",
    ticketId: "ടിക്കറ്റ് ഐഡി",
    checking: "പരിശോധിക്കുന്നു...",
    check: "നില പരിശോധിക്കുക",
    status: (status: QuestionStatus) =>
      `നില: ${
        {
          pending: "പരിശോധനയിൽ",
          draft: "ഉത്തരം തയ്യാറാക്കുന്നു",
          answered: "ഉത്തരം നൽകി",
          archived: "ആർക്കൈവ് ചെയ്തു",
        }[status]
      }`,
    notVisible: "ഉത്തരം ഇതുവരെ ലഭ്യമല്ല. പിന്നീട് വീണ്ടും പരിശോധിക്കുക.",
    errors: {
      "Could not check now. Please try again.":
        "ഇപ്പോൾ പരിശോധിക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.",
      "We could not find an answer for those details.":
        "ഈ വിവരങ്ങൾക്ക് ഒരു ഉത്തരവും കണ്ടെത്താനായില്ല.",
      "Too many attempts. Please try again later.":
        "ധാരാളം ശ്രമങ്ങൾ നടന്നു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    },
  },
});

export const CheckStatus: React.FC = () => {
  const t = useCopy(copy);
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/qa/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
        }),
      });
      const data: unknown = await response.json();

      if (
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        isQuestionStatus(data.status)
      ) {
        setResult({
          ok: true,
          status: data.status,
          answer:
            "answer" in data && typeof data.answer === "string"
              ? data.answer
              : null,
        });
      } else {
        setResult({ ok: false, error: readError(data) });
      }
    } catch {
      setResult({ ok: false, error: "Could not check now. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-white p-6 shadow-soft font-body">
      <h3 className="font-display text-2xl font-semibold text-primary">
        {t.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        {t.intro}
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="qa-ticket-id" className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            {t.ticketId}
          </label>
          <input
            id="qa-ticket-id"
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value.toUpperCase())}
            placeholder="Q-XXXXXXXXXXXX"
            required
            className="w-full rounded-xl border border-border-subtle bg-bg px-4 py-3 font-mono text-sm text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {loading ? t.checking : t.check}
        </button>
      </form>

      <div className="mt-5" aria-live="polite">
        {result?.ok && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold capitalize">{t.status(result.status)}</p>
            {result.answer ? (
              <p className="mt-3 whitespace-pre-wrap leading-7 text-text-main">
                {result.answer}
              </p>
            ) : (
              <p className="mt-2 leading-6">
                {t.notVisible}
              </p>
            )}
          </div>
        )}
        {result && !result.ok && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {t.errors[result.error] ?? result.error}
          </p>
        )}
      </div>
    </div>
  );
};

function readError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "We could not find an answer for those details.";
}

function isQuestionStatus(value: unknown): value is QuestionStatus {
  return (
    value === "pending" ||
    value === "draft" ||
    value === "answered" ||
    value === "archived"
  );
}
