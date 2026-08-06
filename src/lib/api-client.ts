import { getApiBaseUrl, resolveApiUrl } from "@/lib/api-base";

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(resolveApiUrl(path));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  void getApiBaseUrl(); // fail fast if unset
  const res = await fetch(buildUrl(path, query));
  return parseJson<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  void getApiBaseUrl();
  const res = await fetch(resolveApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseJson<T>(res);
}
