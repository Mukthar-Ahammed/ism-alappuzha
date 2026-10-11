"use client";

import { useEffect, useRef, useActionState } from "react";
import {
  addAdminAction,
  changeRoleAction,
  removeAdminAction,
  resetAuthenticatorAction,
  resetPasswordAction,
} from "@/features/team/server/actions";
import { Badge, Button, FormField, Input, Select } from "@/components/admin/ui";
import { CopySecretButton } from "@/features/team/components/CopySecretButton";
import type { TeamActionState, TeamMember } from "@/features/team/types";

const initialState: TeamActionState = { ok: false };

function ActionMessage({ state }: { state: TeamActionState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
      >
        {state.error}
      </p>
    );
  }

  if (state.ok && state.message) {
    return (
      <p
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
      >
        {state.message}
      </p>
    );
  }

  return null;
}

function TemporaryPasswordCard({ state }: { state: TeamActionState }) {
  if (!state.temporaryPassword) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Temporary password"
      className="rounded-xl border border-secondary/40 bg-secondary-tint p-4"
    >
      <p className="text-sm font-bold text-primary">
        Temporary password for {state.targetEmail}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 break-all rounded-lg border border-border-subtle bg-bg px-3 py-2 text-sm font-bold text-primary">
          {state.temporaryPassword}
        </code>
        <CopySecretButton value={state.temporaryPassword} />
      </div>
      <p className="mt-3 text-sm leading-6 text-text-muted">
        Shown once. Share it through a secure channel and ask the admin to change
        it after signing in.
      </p>
    </div>
  );
}

export function AddAdminForm() {
  const [state, formAction, pending] = useActionState(
    addAdminAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <FormField label="Email" htmlFor="new-admin-email">
          <Input
            id="new-admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            required
          />
        </FormField>
        <FormField label="Role" htmlFor="new-admin-role">
          <Select id="new-admin-role" name="role" defaultValue="reviewer">
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add admin"}
      </Button>
      <ActionMessage state={state} />
      <TemporaryPasswordCard state={state} />
    </form>
  );
}

export function TeamMemberActions({
  member,
  currentAdminEmail = "",
  totalAdminsCount = 1,
}: {
  member: TeamMember;
  currentAdminEmail?: string;
  totalAdminsCount?: number;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    changeRoleAction,
    initialState
  );
  const [authState, authAction, authPending] = useActionState(
    resetAuthenticatorAction,
    initialState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    resetPasswordAction,
    initialState
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeAdminAction,
    initialState
  );

  const authDialogRef = useRef<HTMLDialogElement>(null);
  const passwordDialogRef = useRef<HTMLDialogElement>(null);
  const removeDialogRef = useRef<HTMLDialogElement>(null);

  // Close dialog on success
  useEffect(() => {
    if (authState.ok) {
      authDialogRef.current?.close();
    }
  }, [authState.ok]);

  useEffect(() => {
    if (passwordState.ok) {
      passwordDialogRef.current?.close();
    }
  }, [passwordState.ok]);

  useEffect(() => {
    if (removeState.ok) {
      removeDialogRef.current?.close();
    }
  }, [removeState.ok]);

  const isSelf =
    Boolean(currentAdminEmail) &&
    member.email.trim().toLowerCase() === currentAdminEmail.trim().toLowerCase();

  const isLastAdmin = member.role === "admin" && totalAdminsCount <= 1;

  return (
    <div className="space-y-4">
      {/* Role Management */}
      <div className="space-y-1">
        <form action={roleAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="email" value={member.email} />
          <Select
            name="role"
            defaultValue={member.role}
            aria-label={`Role for ${member.email}`}
            disabled={isSelf || (isLastAdmin && member.role === "admin")}
          >
            <option value="admin">Admin</option>
            <option value="reviewer" disabled={isLastAdmin}>
              Reviewer {isLastAdmin ? "(Last admin)" : ""}
            </option>
          </Select>
          <Button
            type="submit"
            variant="secondary"
            disabled={rolePending || isSelf || (isLastAdmin && member.role === "admin")}
          >
            {rolePending ? "Saving..." : "Change role"}
          </Button>
        </form>

        {isSelf && (
          <p className="text-xs text-text-muted">
            You cannot change your own role.
          </p>
        )}
        {!isSelf && isLastAdmin && member.role === "admin" && (
          <p className="text-xs text-text-muted">
            At least one admin must remain.
          </p>
        )}
      </div>

      <ActionMessage state={roleState} />

      {/* Action Buttons & Modals */}
      {isSelf ? (
        <div className="rounded-lg border border-border-subtle bg-primary-tint/30 px-3 py-2 text-xs text-text-muted">
          Current account. Use{" "}
          <a
            href="/admin/security"
            className="font-semibold text-primary underline underline-offset-2"
          >
            Security
          </a>{" "}
          to manage your password or authenticator devices.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {/* Reset Authenticator Button & Dialog */}
          <Button
            type="button"
            variant="secondary"
            disabled={!member.userId}
            onClick={() => authDialogRef.current?.showModal()}
          >
            Reset authenticator
          </Button>

          <dialog
            ref={authDialogRef}
            aria-labelledby={`auth-dialog-title-${member.email}`}
            className="w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border-subtle bg-bg p-0 text-text-main shadow-floating backdrop:bg-primary/40"
          >
            <form action={authAction} className="space-y-5 p-6">
              <input type="hidden" name="email" value={member.email} />
              <div>
                <h2
                  id={`auth-dialog-title-${member.email}`}
                  className="font-display text-xl font-bold text-primary"
                >
                  Reset authenticator
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  This will remove all verified authenticator devices for{" "}
                  <strong className="text-primary">{member.email}</strong>. They
                  will be required to enrol a new authenticator app at their next
                  sign-in.
                </p>
              </div>

              <FormField
                label="Type RESET to confirm"
                htmlFor={`reset-auth-input-${member.email}`}
              >
                <Input
                  id={`reset-auth-input-${member.email}`}
                  name="confirm"
                  autoComplete="off"
                  placeholder="RESET"
                  required
                />
              </FormField>

              {authState.error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-800">
                  {authState.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => authDialogRef.current?.close()}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="secondary" disabled={authPending}>
                  {authPending ? "Resetting..." : "Confirm reset"}
                </Button>
              </div>
            </form>
          </dialog>

          {/* Reset Password Button & Dialog */}
          <Button
            type="button"
            variant="secondary"
            disabled={!member.userId}
            onClick={() => passwordDialogRef.current?.showModal()}
          >
            Reset password
          </Button>

          <dialog
            ref={passwordDialogRef}
            aria-labelledby={`password-dialog-title-${member.email}`}
            className="w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border-subtle bg-bg p-0 text-text-main shadow-floating backdrop:bg-primary/40"
          >
            <form action={passwordAction} className="space-y-5 p-6">
              <input type="hidden" name="email" value={member.email} />
              <div>
                <h2
                  id={`password-dialog-title-${member.email}`}
                  className="font-display text-xl font-bold text-primary"
                >
                  Reset password
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Generate a new temporary password for{" "}
                  <strong className="text-primary">{member.email}</strong>. The
                  current password will stop working immediately. The new temporary
                  password will be shown once on screen.
                </p>
              </div>

              <FormField
                label="Type PASSWORD to confirm"
                htmlFor={`reset-password-input-${member.email}`}
              >
                <Input
                  id={`reset-password-input-${member.email}`}
                  name="confirm"
                  autoComplete="off"
                  placeholder="PASSWORD"
                  required
                />
              </FormField>

              {passwordState.error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-800">
                  {passwordState.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => passwordDialogRef.current?.close()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={passwordPending}
                >
                  {passwordPending ? "Resetting..." : "Confirm reset"}
                </Button>
              </div>
            </form>
          </dialog>

          {/* Remove Admin Button & Dialog */}
          <Button
            type="button"
            variant="danger"
            disabled={isLastAdmin}
            onClick={() => removeDialogRef.current?.showModal()}
          >
            Remove admin
          </Button>

          <dialog
            ref={removeDialogRef}
            aria-labelledby={`remove-dialog-title-${member.email}`}
            className="w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border-subtle bg-bg p-0 text-text-main shadow-floating backdrop:bg-primary/40"
          >
            <form action={removeAction} className="space-y-5 p-6">
              <input type="hidden" name="email" value={member.email} />
              <div>
                <h2
                  id={`remove-dialog-title-${member.email}`}
                  className="font-display text-xl font-bold text-red-700"
                >
                  Remove admin access
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  This will permanently remove{" "}
                  <strong className="text-primary">{member.email}</strong> from the
                  allowlist and delete their Supabase Auth account. This action
                  cannot be undone.
                </p>
              </div>

              <FormField
                label="Type REMOVE to confirm"
                htmlFor={`remove-input-${member.email}`}
              >
                <Input
                  id={`remove-input-${member.email}`}
                  name="confirm"
                  autoComplete="off"
                  placeholder="REMOVE"
                  required
                />
              </FormField>

              {removeState.error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-800">
                  {removeState.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeDialogRef.current?.close()}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={removePending}>
                  {removePending ? "Removing..." : "Confirm removal"}
                </Button>
              </div>
            </form>
          </dialog>
        </div>
      )}

      {/* Action feedback */}
      <ActionMessage state={authState} />
      <ActionMessage state={passwordState} />
      <TemporaryPasswordCard state={passwordState} />
      <ActionMessage state={removeState} />
    </div>
  );
}

export function AuthenticatorBadge({ member }: { member: TeamMember }) {
  if (!member.userId) {
    return <Badge tone="red">No auth user</Badge>;
  }

  if (!member.hasVerifiedAuthenticator) {
    return <Badge tone="gold">No verified device</Badge>;
  }

  return (
    <Badge tone="green">
      {member.verifiedAuthenticatorCount} verified device
      {member.verifiedAuthenticatorCount === 1 ? "" : "s"}
    </Badge>
  );
}
