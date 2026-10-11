/** The admin home (the questions dashboard). /admin/dashboard redirects here. */
export const adminHomePath = "/admin";

const adminLoginRoot = "/admin/login";
const internalOrigin = "https://ism.local";

function isLoginPath(pathname: string): boolean {
  return pathname === adminLoginRoot || pathname.startsWith(`${adminLoginRoot}/`);
}

/**
 * Returns a safe internal admin destination for the `next` parameter, or the admin home.
 * Rejects anything that is not, after normalisation, /admin or a path under /admin/
 * (other sites, protocol-relative URLs, backslashes, `..` tricks, /administrator, ...)
 * and the sign-in pages themselves, which would loop.
 */
export function sanitizeAdminNext(value: string | null | undefined): string {
  if (!value) {
    return adminHomePath;
  }

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    return adminHomePath;
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(decoded)
  ) {
    return adminHomePath;
  }

  try {
    const parsed = new URL(decoded, internalOrigin);
    const { pathname } = parsed;

    if (parsed.origin !== internalOrigin) {
      return adminHomePath;
    }

    if (pathname !== adminHomePath && !pathname.startsWith(`${adminHomePath}/`)) {
      return adminHomePath;
    }

    if (isLoginPath(pathname)) {
      return adminHomePath;
    }

    return `${pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return adminHomePath;
  }
}

export function adminLoginPath(next: string): string {
  return `${adminLoginRoot}?next=${encodeURIComponent(sanitizeAdminNext(next))}`;
}
