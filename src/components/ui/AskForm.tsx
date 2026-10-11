"use client";

import React, { useCallback, useState } from "react";
import { questionCategories, type QuestionCategory } from "@/lib/types/qa";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

/** Display names for the question categories; the English value stays the stored key. */
export const questionCategoryCopy = defineCopy({
  en: {
    All: "All",
    Prayer: "Prayer",
    Faith: "Faith",
    "Daily life": "Daily life",
    Family: "Family",
    Other: "Other",
  } as Record<string, string>,
  ml: {
    All: "എല്ലാം",
    Prayer: "നമസ്കാരം",
    Faith: "വിശ്വാസം",
    "Daily life": "ദൈനംദിന ജീവിതം",
    Family: "കുടുംബം",
    Other: "മറ്റുള്ളവ",
  },
});

const copy = defineCopy({
  en: {
    name: "Your Name",
    optional: "(optional)",
    namePlaceholder: "e.g. Ahmad or Anonymous",
    email: "Email",
    emailPlaceholder: "you@example.com",
    emailHint:
      "Optional. Email replies are not available yet, so please save your ticket ID to read the answer.",
    category: "Category",
    question: "Your Question",
    questionPlaceholder: "Type your question clearly here (minimum 10 characters)...",
    private: "Private question",
    privateHint: "Private questions are never published on the public Q&A list.",
    emailNote:
      "Email is stored with your question for future reply support. For now, your Ticket ID is the only way to read the answer.",
    sent: "Question sent. Save this Ticket ID to check the answer later.",
    copied: "Copied",
    copy: "Copy",
    saveWarning: "Save this ticket ID somewhere safe. It cannot be recovered.",
    sending: "Sending...",
    send: "Send question",
    // Server and validation messages arrive in English; these are shown in their place.
    errors: {} as Record<string, string>,
  },
  ml: {
    name: "നിങ്ങളുടെ പേര്",
    optional: "(നിർബന്ധമില്ല)",
    namePlaceholder: "ഉദാ: അഹ്മദ് അല്ലെങ്കിൽ പേര് വെളിപ്പെടുത്താതെ",
    email: "ഇമെയിൽ",
    emailPlaceholder: "നിങ്ങളുടെ ഇമെയിൽ വിലാസം",
    emailHint:
      "നിർബന്ധമില്ല. ഇമെയിൽ വഴി മറുപടി ഇപ്പോൾ ലഭ്യമല്ല, അതിനാൽ ഉത്തരം വായിക്കാൻ ടിക്കറ്റ് ഐഡി സൂക്ഷിച്ചുവെക്കുക.",
    category: "വിഭാഗം",
    question: "നിങ്ങളുടെ ചോദ്യം",
    questionPlaceholder: "നിങ്ങളുടെ ചോദ്യം ഇവിടെ വ്യക്തമായി എഴുതുക (കുറഞ്ഞത് 10 അക്ഷരങ്ങൾ)...",
    private: "സ്വകാര്യ ചോദ്യം",
    privateHint: "സ്വകാര്യ ചോദ്യങ്ങൾ പൊതു ചോദ്യോത്തര പട്ടികയിൽ ഒരിക്കലും പ്രസിദ്ധീകരിക്കില്ല.",
    emailNote:
      "ഭാവിയിൽ മറുപടി അയയ്ക്കാനായി ഇമെയിൽ നിങ്ങളുടെ ചോദ്യത്തോടൊപ്പം സൂക്ഷിക്കുന്നു. ഇപ്പോൾ ഉത്തരം വായിക്കാനുള്ള ഏക മാർഗം ടിക്കറ്റ് ഐഡിയാണ്.",
    sent: "ചോദ്യം അയച്ചു. പിന്നീട് ഉത്തരം പരിശോധിക്കാൻ ഈ ടിക്കറ്റ് ഐഡി സൂക്ഷിക്കുക.",
    copied: "പകർത്തി",
    copy: "പകർത്തുക",
    saveWarning: "ഈ ടിക്കറ്റ് ഐഡി സുരക്ഷിതമായി സൂക്ഷിക്കുക. ഇത് വീണ്ടെടുക്കാൻ കഴിയില്ല.",
    sending: "അയയ്ക്കുന്നു...",
    send: "ചോദ്യം അയയ്ക്കുക",
    errors: {
      "Please check the form and try again.": "ഫോം പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
      "Please send a valid question.": "സാധുവായ ഒരു ചോദ്യം അയയ്ക്കുക.",
      "Name must be 50 characters or fewer.": "പേര് 50 അക്ഷരങ്ങളിൽ കൂടരുത്.",
      "Enter a valid email address.": "സാധുവായ ഒരു ഇമെയിൽ വിലാസം നൽകുക.",
      "Your question must be between 10 and 500 characters long.":
        "ചോദ്യം 10 മുതൽ 500 വരെ അക്ഷരങ്ങൾക്കുള്ളിൽ ആയിരിക്കണം.",
      "Could not send your question. Please try again later.":
        "ചോദ്യം അയയ്ക്കാൻ കഴിഞ്ഞില്ല. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
      "Could not send. Check your connection and try again.":
        "അയയ്ക്കാൻ കഴിഞ്ഞില്ല. ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
      "Could not send your question. Please check your connection and try again.":
        "ചോദ്യം അയയ്ക്കാൻ കഴിഞ്ഞില്ല. ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
      "Too many question submissions from your network. Please try again later.":
        "നിങ്ങളുടെ നെറ്റ്‌വർക്കിൽ നിന്ന് ധാരാളം ചോദ്യങ്ങൾ അയച്ചുകഴിഞ്ഞു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    },
  },
});

export const AskForm: React.FC = () => {
  const t = useCopy(copy);
  const categoryLabels = useCopy(questionCategoryCopy);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<QuestionCategory>("Prayer");
  const [question, setQuestion] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  // Kept in English (as the API sends it) and translated at render, so it follows the toggle.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const charCount = question.length;
  const isValidLength = charCount >= 10 && charCount <= 500;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setTicketId(null);
      setErrorMessage(null);
      setCopied(false);

      // The validation library loads on first submit, not with the homepage.
      const { askQuestionSchema } = await import("@/lib/qa/schemas");
      const parsed = askQuestionSchema.safeParse({
        name,
        email,
        category,
        question,
        isPrivate,
        website,
      });

      if (!parsed.success) {
        setErrorMessage(
          parsed.error.issues[0]?.message ??
            "Please check the form and try again."
        );
        return;
      }

      setSubmitting(true);

      try {
        const res = await fetch("/api/qa/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parsed.data.name ?? undefined,
            email: parsed.data.email ?? undefined,
            category: parsed.data.category,
            question: parsed.data.question,
            isPrivate: parsed.data.isPrivate,
            website,
          }),
        });

        const data: unknown = await res.json();

        if (
          res.ok &&
          typeof data === "object" &&
          data !== null &&
          "success" in data &&
          data.success === true &&
          "ticketId" in data &&
          typeof data.ticketId === "string"
        ) {
          setTicketId(data.ticketId);
          setName("");
          setEmail("");
          setQuestion("");
          setIsPrivate(false);
          setWebsite("");
        } else {
          setErrorMessage(readError(data));
        }
      } catch {
        setErrorMessage("Could not send. Check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [name, email, category, question, isPrivate, website]
  );

  async function copyTicketId() {
    if (!ticketId) return;

    try {
      await navigator.clipboard.writeText(ticketId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bg-white rounded-[var(--radius-card)] p-6 sm:p-8 border border-border-subtle shadow-[var(--shadow-soft)] font-body">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="qa-name"
            className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2"
          >
            {t.name} <span className="text-text-muted font-normal lowercase">{t.optional}</span>
          </label>
          <input
            type="text"
            id="qa-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.namePlaceholder}
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label
            htmlFor="qa-email"
            className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2"
          >
            {t.email} <span className="text-text-muted font-normal lowercase">{t.optional}</span>
          </label>
          <input
            type="email"
            id="qa-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.emailPlaceholder}
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
          <p className="mt-2 text-xs leading-5 text-text-muted">
            {t.emailHint}
          </p>
        </div>

        <div>
          <label
            htmlFor="qa-category"
            className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2"
          >
            {t.category} <span className="text-secondary">*</span>
          </label>
          <select
            id="qa-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as QuestionCategory)}
            required
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 cursor-pointer"
          >
            {questionCategories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabels[cat] ?? cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="qa-question"
              className="block text-xs font-semibold uppercase tracking-wider text-primary"
            >
              {t.question} <span className="text-secondary">*</span>
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
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t.questionPlaceholder}
            rows={4}
            minLength={10}
            maxLength={500}
            required
            className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-bg text-sm text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border-subtle bg-primary-tint p-4 text-sm font-medium text-primary">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border-subtle text-secondary focus:ring-secondary"
          />
          <span>
            {t.private}
            <span className="mt-1 block text-xs font-normal leading-5 text-text-muted">
              {t.privateHint}
            </span>
          </span>
        </label>

        <p className="rounded-xl border border-border-subtle bg-bg px-4 py-3 text-xs leading-5 text-text-muted">
          {t.emailNote}
        </p>

        <div aria-live="polite">
          {ticketId && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 animate-in fade-in">
              <p className="text-sm font-semibold">{t.sent}</p>
              <div className="flex flex-col gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono text-lg font-bold tracking-wide text-primary">
                  {ticketId}
                </span>
                <button
                  type="button"
                  onClick={copyTicketId}
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              <p className="text-xs leading-5">
                {t.saveWarning}
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium animate-in fade-in">
              {t.errors[errorMessage] ?? errorMessage}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !isValidLength}
          className="w-full py-3.5 px-6 rounded-full bg-secondary text-primary font-semibold text-sm transition-all duration-200 shadow-soft hover:bg-secondary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center justify-center gap-2"
        >
          {submitting ? t.sending : t.send}
        </button>
      </form>
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

  return "Could not send your question. Please check your connection and try again.";
}
