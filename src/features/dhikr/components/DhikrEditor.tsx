"use client";

import { useActionState, useState } from "react";
import { Button, Card, CardContent, FormField, Input, Select, Textarea } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { DhikrCard } from "@/components/ui/DhikrCard";
import { dhikrEntryCategories, type DhikrItem } from "@/data/dhikr";
import { saveDhikrAction } from "@/features/dhikr/server/actions";
import type { AdminDhikr, DhikrActionState } from "@/features/dhikr/types";

const noop = () => {};

export function DhikrEditor({ entry }: { entry: AdminDhikr | null }) {
  const [state, formAction, pending] = useActionState<DhikrActionState, FormData>(
    saveDhikrAction,
    null
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [category, setCategory] = useState<DhikrItem["category"]>(entry?.category ?? dhikrEntryCategories[0]);
  const [arabic, setArabic] = useState(entry?.arabic ?? "");
  const [transliteration, setTransliteration] = useState(entry?.transliteration ?? "");
  const [malayalam, setMalayalam] = useState(entry?.malayalam ?? "");
  const [reference, setReference] = useState(entry?.reference ?? "");
  const [repeatCount, setRepeatCount] = useState(entry?.repeatCount ? String(entry.repeatCount) : "");

  const repeat = Number.parseInt(repeatCount, 10);
  const previewItem: DhikrItem = {
    id: entry?.id ?? "preview",
    category,
    arabic: arabic || "النص العربي",
    transliteration,
    malayalam,
    source: reference,
    repeat: Number.isInteger(repeat) && repeat > 0 ? repeat : undefined,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={entry?.id ?? ""} />
            {/* The website shows exactly what is typed here in both site languages. Any older Malayalam
                versions are carried over unchanged, so saving neither erases them nor clears the check. */}
            <input type="hidden" name="transliterationMl" value={entry?.transliterationMl ?? ""} />
            <input type="hidden" name="referenceMl" value={entry?.referenceMl ?? ""} />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <FormField label="Short name (admin only)" htmlFor="dhikr-title">
                <Input
                  id="dhikr-title"
                  name="title"
                  required
                  maxLength={120}
                  placeholder="e.g. After eating"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </FormField>
              <FormField label="Category" htmlFor="dhikr-category">
                <Select
                  id="dhikr-category"
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as DhikrItem["category"])}
                >
                  {dhikrEntryCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Arabic text" htmlFor="dhikr-arabic">
              <Textarea
                id="dhikr-arabic"
                name="arabic"
                required
                dir="rtl"
                lang="ar"
                maxLength={2000}
                rows={4}
                className="font-arabic text-xl leading-loose"
                value={arabic}
                onChange={(event) => setArabic(event.target.value)}
              />
            </FormField>

            <FormField label="Transliteration" htmlFor="dhikr-transliteration">
              <Textarea
                id="dhikr-transliteration"
                name="transliteration"
                maxLength={2000}
                rows={2}
                value={transliteration}
                onChange={(event) => setTransliteration(event.target.value)}
              />
            </FormField>


            <FormField label="Malayalam meaning" htmlFor="dhikr-malayalam">
              <Textarea
                id="dhikr-malayalam"
                name="malayalam"
                lang="ml"
                maxLength={3000}
                rows={3}
                className="font-malayalam"
                value={malayalam}
                onChange={(event) => setMalayalam(event.target.value)}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <FormField label="Source" htmlFor="dhikr-reference">
                <Input
                  id="dhikr-reference"
                  name="reference"
                  maxLength={300}
                  placeholder="e.g. Sahih Muslim 2723"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </FormField>
              <FormField label="Times to repeat" htmlFor="dhikr-repeat">
                <Input
                  id="dhikr-repeat"
                  name="repeatCount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  placeholder="1"
                  value={repeatCount}
                  onChange={(event) => setRepeatCount(event.target.value)}
                />
              </FormField>
            </div>


            {entry?.reviewedBy && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This text has been checked. Changing the Arabic, the pronunciation, the meaning or the source
                clears the check and takes it off the website until it is checked again.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : entry ? "Save changes" : "Save as draft"}
              </Button>
              <ActionMessage state={state} />
            </div>
          </form>
        </CardContent>
      </Card>

      <aside aria-label="Preview" className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Preview</p>
        <DhikrCard item={previewItem} isFavorite={false} onToggleFavorite={noop} />
      </aside>
    </div>
  );
}
