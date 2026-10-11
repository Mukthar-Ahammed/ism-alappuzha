"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, FormField, Input, Select, Switch } from "@/components/admin/ui";
import {
  questionCategories,
  questionStatuses,
  type QuestionStatusCounts,
} from "@/features/questions/types";
import type { QuestionFilters } from "@/features/questions/schemas";

export function QuestionFilters({
  filters,
  counts,
}: {
  filters: QuestionFilters;
  counts: QuestionStatusCounts;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState(filters);

  function update(next: QuestionFilters) {
    setValues(next);
    const params = new URLSearchParams();
    params.set("status", next.status);
    params.set("sort", next.sort);

    if (next.category) params.set("category", next.category);
    if (next.private) params.set("private", "1");
    if (next.published) params.set("published", "1");
    if (next.hasEmail) params.set("hasEmail", "1");
    if (next.search) params.set("search", next.search);

    startTransition(() => router.push(`/admin?${params.toString()}`));
  }

  return (
    <section className="space-y-4" aria-label="Question filters">
      <div className="flex flex-wrap gap-2">
        {questionStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => update({ ...values, status, page: 1 })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              values.status === status
                ? "border-secondary bg-secondary text-primary"
                : "border-border-subtle text-text-muted hover:bg-primary-tint hover:text-primary"
            }`}
          >
            {status} <span className="ml-1 text-xs">{counts[status]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_12rem_10rem_auto]">
        <FormField label="Search" htmlFor="question-search">
          <Input
            id="question-search"
            value={values.search ?? ""}
            placeholder="Ticket ID or question text"
            onChange={(event) => setValues({ ...values, search: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                update({ ...values, page: 1 });
              }
            }}
          />
        </FormField>
        <FormField label="Category" htmlFor="question-category">
          <Select
            id="question-category"
            value={values.category ?? ""}
            onChange={(event) =>
              update({
                ...values,
                category: event.target.value
                  ? (event.target.value as QuestionFilters["category"])
                  : undefined,
                page: 1,
              })
            }
          >
            <option value="">All categories</option>
            {questionCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Sort" htmlFor="question-sort">
          <Select
            id="question-sort"
            value={values.sort}
            onChange={(event) =>
              update({
                ...values,
                sort: event.target.value === "oldest" ? "oldest" : "newest",
                page: 1,
              })
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </FormField>
        <div className="flex items-end">
          <Button type="button" onClick={() => update({ ...values, page: 1 })}>
            {pending ? "Filtering..." : "Apply"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Switch
            checked={values.private}
            onChange={(event) =>
              update({ ...values, private: event.target.checked, page: 1 })
            }
          />
          Private only
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Switch
            checked={values.published}
            onChange={(event) =>
              update({ ...values, published: event.target.checked, page: 1 })
            }
          />
          Published only
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Switch
            checked={values.hasEmail}
            onChange={(event) =>
              update({ ...values, hasEmail: event.target.checked, page: 1 })
            }
          />
          Has email
        </label>
      </div>
    </section>
  );
}
