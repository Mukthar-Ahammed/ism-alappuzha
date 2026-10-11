import type { MessageActionState } from "@/lib/auth/types";

/** Shows the outcome of a form action: a status on success, an alert on failure. */
export function ActionMessage({ state }: { state: MessageActionState }) {
  if (!state) {
    return null;
  }

  return state.ok ? (
    <p role="status" className="text-sm font-semibold text-emerald-800">
      {state.data.message}
    </p>
  ) : (
    <p role="alert" className="text-sm font-semibold text-red-800">
      {state.error}
    </p>
  );
}
