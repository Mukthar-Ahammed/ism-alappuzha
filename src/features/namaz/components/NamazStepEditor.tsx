"use client";

import { useActionState, useState } from "react";
import { Button, Card, CardContent, FormField, Input, Textarea } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { TimelineStep } from "@/components/ui/TimelineStep";
import type { PrayerStep } from "@/data/namaz";
import { saveNamazStepAction } from "@/features/namaz/server/actions";
import { maxGuidanceItems, type AdminNamazStep, type NamazActionState } from "@/features/namaz/types";
import { guidanceLines } from "@/features/namaz/workflow";

export function NamazStepEditor({
  step,
  stepNumber,
  totalSteps,
}: {
  step: AdminNamazStep | null;
  /** Where this card sits in the guide, for the preview's "Step n of m". */
  stepNumber: number;
  totalSteps: number;
}) {
  const [state, formAction, pending] = useActionState<NamazActionState, FormData>(
    saveNamazStepAction,
    null
  );
  const [name, setName] = useState(step?.name ?? "");
  const [whatToDo, setWhatToDo] = useState(step?.whatToDo ?? "");
  const [arabic, setArabic] = useState(step?.arabic ?? "");
  const [transliteration, setTransliteration] = useState(step?.transliteration ?? "");
  const [malayalam, setMalayalam] = useState(step?.malayalam ?? "");
  const [dos, setDos] = useState((step?.dos ?? []).join("\n"));
  const [donts, setDonts] = useState((step?.donts ?? []).join("\n"));
  const [isRepeatNode, setIsRepeatNode] = useState(step?.isRepeatNode ?? false);

  const preview: PrayerStep = {
    id: step?.id ?? "preview",
    stepNumber,
    name: name || "Step name",
    whatToDo: whatToDo || "What to do in this step.",
    arabic: arabic || "النص العربي",
    transliteration,
    malayalam,
    dos: guidanceLines(dos),
    donts: guidanceLines(donts),
    isRepeatNode,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={step?.id ?? ""} />
            {/* The guide shows exactly what is typed here in both site languages. Any older
                Malayalam versions are carried over unchanged so saving does not erase them. */}
            <input type="hidden" name="nameMl" value={step?.nameMl ?? ""} />
            <input type="hidden" name="whatToDoMl" value={step?.whatToDoMl ?? ""} />
            <input type="hidden" name="transliterationMl" value={step?.transliterationMl ?? ""} />
            <input type="hidden" name="dosMl" value={(step?.dosMl ?? []).join("\n")} />
            <input type="hidden" name="dontsMl" value={(step?.dontsMl ?? []).join("\n")} />
            <FormField label="Step name" htmlFor="namaz-name">
              <Input
                id="namaz-name"
                name="name"
                required
                maxLength={120}
                placeholder="e.g. Ruku (Bowing)"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FormField>


            <FormField label="What to do" htmlFor="namaz-what">
              <Textarea
                id="namaz-what"
                name="whatToDo"
                required
                maxLength={600}
                rows={3}
                value={whatToDo}
                onChange={(event) => setWhatToDo(event.target.value)}
              />
            </FormField>


            <FormField label="Arabic text" htmlFor="namaz-arabic">
              <Textarea
                id="namaz-arabic"
                name="arabic"
                required
                dir="rtl"
                lang="ar"
                maxLength={2000}
                rows={3}
                className="font-arabic text-xl leading-loose"
                value={arabic}
                onChange={(event) => setArabic(event.target.value)}
              />
            </FormField>

            <FormField label="Transliteration" htmlFor="namaz-transliteration">
              <Textarea
                id="namaz-transliteration"
                name="transliteration"
                maxLength={1000}
                rows={2}
                value={transliteration}
                onChange={(event) => setTransliteration(event.target.value)}
              />
            </FormField>


            <FormField label="Malayalam explanation" htmlFor="namaz-malayalam">
              <Textarea
                id="namaz-malayalam"
                name="malayalam"
                lang="ml"
                maxLength={2000}
                rows={3}
                className="font-malayalam"
                value={malayalam}
                onChange={(event) => setMalayalam(event.target.value)}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={`Recommended (Do), one per line, up to ${maxGuidanceItems}`} htmlFor="namaz-dos">
                <Textarea
                  id="namaz-dos"
                  name="dos"
                  rows={4}
                  value={dos}
                  onChange={(event) => setDos(event.target.value)}
                />
              </FormField>
              <FormField label={`Avoid (Don't), one per line, up to ${maxGuidanceItems}`} htmlFor="namaz-donts">
                <Textarea
                  id="namaz-donts"
                  name="donts"
                  rows={4}
                  value={donts}
                  onChange={(event) => setDonts(event.target.value)}
                />
              </FormField>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border-subtle p-3 text-sm">
              <input
                type="checkbox"
                name="isRepeatNode"
                className="mt-0.5 h-4 w-4 accent-[var(--secondary)]"
                checked={isRepeatNode}
                onChange={(event) => setIsRepeatNode(event.target.checked)}
              />
              <span>
                <span className="font-semibold text-primary">Repeat cycle step</span>
                <span className="block text-text-muted">
                  Adds the &ldquo;Repeat cycle&rdquo; badge, e.g. for &ldquo;Second Rakah&rdquo;.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : step ? "Save changes" : "Save as draft"}
              </Button>
              <ActionMessage state={state} />
            </div>
          </form>
        </CardContent>
      </Card>

      <aside aria-label="Preview" className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
          Preview{stepNumber === 1 ? " (shown as the featured first card on the website)" : ""}
        </p>
        <TimelineStep step={preview} status="active" totalSteps={totalSteps} />
      </aside>
    </div>
  );
}
