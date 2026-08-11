export function getApiBaseUrl(): string {
  const base = (
    import.meta.env?.VITE_API_BASE_URL ??
    (typeof process !== "undefined" ? process.env.VITE_API_BASE_URL : undefined)
  )?.trim();
  if (!base) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return base.replace(/\/$/, "");
}

/** Join API base with a path that may be absolute URL, absolute path, or relative. */
export function resolveApiUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getApiBaseUrl()}${path}`;
}
