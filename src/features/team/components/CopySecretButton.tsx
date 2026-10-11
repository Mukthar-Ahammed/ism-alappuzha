"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/admin/ui";

export function CopySecretButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="secondary"
      aria-label={copied ? "Password copied to clipboard" : "Copy temporary password"}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

