"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Button, Card, CardContent, CardHeader, FormField, Input, Skeleton, Textarea } from "@/components/admin/ui";
import type { ImageFieldValue } from "@/components/admin/ImageUploadField";
import { LeaderCard } from "@/components/ui/LeaderCard";
import { saveLeaderAction } from "@/features/leaders/server/actions";
import type { AdminLeader, LeaderActionState } from "@/features/leaders/types";
import { ActionMessage } from "@/components/admin/ActionMessage";

// Loaded only when the editor opens, keeping upload code out of every other admin page.
const ImageUploadField = dynamic(() => import("@/components/admin/ImageUploadField"), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});

export function LeaderEditor({ leader }: { leader: AdminLeader | null }) {
  const [state, formAction, pending] = useActionState<LeaderActionState, FormData>(
    saveLeaderAction,
    null
  );
  const [draft, setDraft] = useState({
    name: leader?.name ?? "",
    role: leader?.role ?? "",
    bio: leader?.bio ?? "",
    nameMl: leader?.nameMl ?? "",
    roleMl: leader?.roleMl ?? "",
    bioMl: leader?.bioMl ?? "",
    linkedin: leader?.linkedin ?? "",
    instagram: leader?.instagram ?? "",
  });
  const [photo, setPhoto] = useState<ImageFieldValue>({
    media: leader?.photo ?? null,
    alt: leader?.photo?.alt ?? "",
  });

  function field(name: keyof typeof draft) {
    return {
      name,
      value: draft[name],
      onChange: (event: { target: { value: string } }) =>
        setDraft((current) => ({ ...current, [name]: event.target.value })),
    };
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-primary">Details</h2>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={leader?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Name" htmlFor="leader-name">
                <Input id="leader-name" required maxLength={120} {...field("name")} />
              </FormField>
              <FormField label="Role" htmlFor="leader-role">
                <Input id="leader-role" required maxLength={120} {...field("role")} />
              </FormField>
            </div>
            <FormField label="Short bio" htmlFor="leader-bio">
              <Textarea id="leader-bio" maxLength={600} className="min-h-28" {...field("bio")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Name (Malayalam, optional)" htmlFor="leader-name-ml">
                <Input
                  id="leader-name-ml"
                  lang="ml"
                  maxLength={120}
                  className="admin-malayalam"
                  {...field("nameMl")}
                />
              </FormField>
              <FormField label="Role (Malayalam, optional)" htmlFor="leader-role-ml">
                <Input
                  id="leader-role-ml"
                  lang="ml"
                  maxLength={120}
                  className="admin-malayalam"
                  {...field("roleMl")}
                />
              </FormField>
            </div>
            <FormField label="Short bio (Malayalam, optional)" htmlFor="leader-bio-ml">
              <Textarea
                id="leader-bio-ml"
                lang="ml"
                maxLength={600}
                className="admin-malayalam min-h-28"
                {...field("bioMl")}
              />
            </FormField>
            <p className="text-xs text-text-muted">
              Visitors who switch the site to Malayalam see the Malayalam fields; any left empty
              show the English.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="LinkedIn link (optional)" htmlFor="leader-linkedin">
                <Input
                  id="leader-linkedin"
                  type="url"
                  inputMode="url"
                  placeholder="https://www.linkedin.com/in/…"
                  {...field("linkedin")}
                />
              </FormField>
              <FormField label="Instagram link (optional)" htmlFor="leader-instagram">
                <Input
                  id="leader-instagram"
                  type="url"
                  inputMode="url"
                  placeholder="https://www.instagram.com/…"
                  {...field("instagram")}
                />
              </FormField>
            </div>
            <p className="text-xs text-text-muted">
              Do not add phone numbers or personal email addresses.
            </p>

            <ImageUploadField
              purpose="leader_photo"
              mediaInputName="photoMediaId"
              altInputName="photoAlt"
              initial={photo}
              onChange={setPhoto}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : leader ? "Save changes" : "Create draft"}
              </Button>
              <ActionMessage state={state} />
            </div>
          </form>
        </CardContent>
      </Card>

      <aside aria-label="Live preview" className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
          Live preview
        </p>
        <LeaderCard
          leader={{
            id: leader?.id ?? "preview",
            name: draft.name || "Name",
            role: draft.role || "Role",
            bio: draft.bio,
            nameMl: draft.nameMl || undefined,
            roleMl: draft.roleMl || undefined,
            bioMl: draft.bioMl || undefined,
            photo: photo.media?.url ?? null,
            photoAlt: photo.alt,
            photoBlurDataUrl: photo.media?.blurDataUrl,
            linkedin: draft.linkedin || undefined,
            instagram: draft.instagram || undefined,
          }}
        />
        <p className="text-xs text-text-muted">Hover the card to see the bio and links.</p>
      </aside>
    </div>
  );
}
