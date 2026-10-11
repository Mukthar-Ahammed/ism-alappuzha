/** Reads one property of an untyped JSON value (such as an RPC result) without casting. */
export function jsonField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  return Object.entries(value).find(([entryKey]) => entryKey === key)?.[1];
}
