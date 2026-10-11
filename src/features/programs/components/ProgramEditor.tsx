"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Button, Card, CardContent, FormField, Input, Skeleton, Textarea } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { TimeField } from "@/components/admin/TimeField";
import { utcToIstInputs } from "@/lib/programs/schedule";
import { saveProgramAction } from "@/features/programs/server/actions";
import type { AdminProgram, ProgramActionState } from "@/features/programs/types";
import type { ProgramFormat } from "@/features/programs/schemas";

const formatOptions: { value: ProgramFormat; label: string; hint: string }[] = [
  { value: "in_person", label: "In person", hint: "At the venue only" },
  { value: "online", label: "Online", hint: "Live stream only" },
  { value: "hybrid", label: "Both", hint: "At the venue and streamed live" },
];

// Loaded only when the editor opens, keeping upload code out of every other admin page.
const ImageUploadField = dynamic(() => import("@/components/admin/ImageUploadField"), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});

export function ProgramEditor({ program }: { program: AdminProgram | null }) {
  const [state, formAction, pending] = useActionState<ProgramActionState, FormData>(
    saveProgramAction,
    null
  );
  const [format, setFormat] = useState<ProgramFormat>(program?.format ?? "in_person");
  const start = program ? utcToIstInputs(program.startsAt) : null;
  const end = program?.endsAt ? utcToIstInputs(program.endsAt) : null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={program?.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" htmlFor="program-title">
              <Input id="program-title" name="title" required maxLength={200} defaultValue={program?.title} />
            </FormField>
            <FormField label="Speaker" htmlFor="program-speaker">
              <Input id="program-speaker" name="speaker" required maxLength={120} defaultValue={program?.speaker} />
            </FormField>
            <FormField label="Title (Malayalam, optional)" htmlFor="program-title-ml">
              <Input
                id="program-title-ml"
                name="titleMl"
                lang="ml"
                maxLength={200}
                className="admin-malayalam"
                defaultValue={program?.titleMl ?? ""}
              />
            </FormField>
            <FormField label="Speaker (Malayalam, optional)" htmlFor="program-speaker-ml">
              <Input
                id="program-speaker-ml"
                name="speakerMl"
                lang="ml"
                maxLength={120}
                className="admin-malayalam"
                defaultValue={program?.speakerMl ?? ""}
              />
            </FormField>
          </div>
          <p className="-mt-2 text-xs text-text-muted">
            The Malayalam fields are shown when a visitor switches the site to Malayalam; empty ones fall back to the English.
          </p>
          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-sm font-semibold text-primary">
              Date and time (Indian Standard Time)
            </legend>
            <FormField label="Date" htmlFor="program-date">
              <Input id="program-date" name="date" type="date" required defaultValue={start?.date} />
            </FormField>
            <TimeField id="program-start" label="Start time" name="startTime" required defaultValue={start?.time} />
            <TimeField id="program-end" label="End time (optional)" name="endTime" defaultValue={end?.time} />
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold text-primary">How do people attend?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle p-3 has-[:checked]:border-secondary has-[:checked]:bg-secondary-tint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-secondary"
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={() => setFormat(option.value)}
                    className="mt-1 accent-secondary"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-primary">{option.label}</span>
                    <span className="block text-xs text-text-muted">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <FormField
            label={format === "online" ? "Venue (optional for online programs)" : "Venue"}
            htmlFor="program-venue"
          >
            <Input
              id="program-venue"
              name="venue"
              required={format !== "online"}
              maxLength={200}
              defaultValue={program?.venue}
            />
          </FormField>
          {format !== "online" && (
            <FormField label="Venue (Malayalam, optional)" htmlFor="program-venue-ml">
              <Input
                id="program-venue-ml"
                name="venueMl"
                lang="ml"
                maxLength={200}
                className="admin-malayalam"
                defaultValue={program?.venueMl ?? ""}
              />
            </FormField>
          )}
          <FormField label="Description (optional)" htmlFor="program-description">
            <Textarea
              id="program-description"
              name="description"
              maxLength={1000}
              defaultValue={program?.description ?? ""}
            />
          </FormField>
          <FormField label="Description (Malayalam, optional)" htmlFor="program-description-ml">
            <Textarea
              id="program-description-ml"
              name="descriptionMl"
              lang="ml"
              maxLength={1000}
              className="admin-malayalam"
              defaultValue={program?.descriptionMl ?? ""}
            />
          </FormField>
          <FormField
            label={
              format === "in_person"
                ? "Registration or details link (optional, https only)"
                : "Live stream link (optional, https only)"
            }
            htmlFor="program-link"
          >
            <Input
              id="program-link"
              name="link"
              type="url"
              inputMode="url"
              placeholder="https://"
              defaultValue={program?.link ?? ""}
            />
          </FormField>

          <ImageUploadField
            purpose="program_poster"
            mediaInputName="posterMediaId"
            altInputName="posterAlt"
            initial={{ media: program?.poster ?? null, alt: program?.poster?.alt ?? "" }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : program ? "Save changes" : "Add program"}
            </Button>
            <ActionMessage state={state} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
