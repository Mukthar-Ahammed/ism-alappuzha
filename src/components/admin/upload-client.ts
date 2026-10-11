/**
 * Uploads a file to a Supabase signed upload URL the same way supabase-js does
 * (multipart PUT), but with XMLHttpRequest so progress can be shown.
 */
export function putWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);

    const request = new XMLHttpRequest();
    request.open("PUT", signedUrl);
    request.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "");
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.send(body);
  });
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
