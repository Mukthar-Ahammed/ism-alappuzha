const fallbackAdminPath = "/admin";

export function sanitizeAdminNext(value: string | null | undefined): string {
  if (!value) {
    return fallbackAdminPath;
  }

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallbackAdminPath;
  }

  if (!decoded.startsWith("/admin")) {
    return fallbackAdminPath;
  }

  if (decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("\n")) {
    return fallbackAdminPath;
  }

  try {
    const parsed = new URL(decoded, "https://ism.local");

    if (parsed.origin !== "https://ism.local") {
      return fallbackAdminPath;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackAdminPath;
  }
}

export function adminLoginPath(next: string): string {
  const safeNext = sanitizeAdminNext(next);

  return `/admin/login?next=${encodeURIComponent(safeNext)}`;
}
