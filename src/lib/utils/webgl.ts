/**
 * Utility to detect if WebGL rendering context is supported in the current browser environment.
 * Enables graceful fallback to static 2D hero image & CSS parallax when WebGL is unavailable.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") {
    return true; // Default to true during SSR to avoid mismatch, canvas client component will re-check
  }

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");

    return !!(window.WebGLRenderingContext && gl);
  } catch {
    return false;
  }
}
