import { getApiBaseUrl, resolveApiUrl } from "@/shared/http/api-base";

/**
 * Cliente HTTP contra isp-customer-service-api.
 * Contrato real: casi todo responde `{ data: ... }`; errores `{ error: { type, message } }`
 * (isp-customer-service-api/docs/API_ENDPOINTS.md). Ver docs/spec/00_OVERVIEW.md.
 *
 * `credentials: "include"` en cada request: la identidad real ahora viaja
 * en la cookie httpOnly de sesion (docs/spec/06_BACKEND_GAPS.md §1.b), no en
 * un header que el cliente declara. El backend valida esa cookie en cada
 * peticion — nunca confia en lo que este cliente afirme.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly type?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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

async function parseEnvelope<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  if (!res.ok) {
    const errorBody = json as { error?: { type?: string; message?: string } } | undefined;
    const message = errorBody?.error?.message || res.statusText || `Error HTTP ${res.status}`;
    throw new ApiError(message, res.status, errorBody?.error?.type);
  }
  const body = json as { data?: T } | undefined;
  return (body?.data ?? (json as T)) as T;
}

export type RequestOptions = {
  query?: Record<string, string | number | undefined>;
  /** Identidad del agente actor — se envía como header x-agent-id cuando el contrato lo exige. */
  agentId?: string | null;
};

function buildHeaders(agentId?: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (agentId) headers["x-agent-id"] = agentId;
  return headers;
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  void getApiBaseUrl(); // fail fast if unset
  const res = await fetch(buildUrl(path, options?.query), {
    headers: buildHeaders(options?.agentId),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  void getApiBaseUrl();
  const res = await fetch(resolveApiUrl(path), {
    method: "POST",
    headers: buildHeaders(options?.agentId),
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  void getApiBaseUrl();
  const res = await fetch(resolveApiUrl(path), {
    method: "PUT",
    headers: buildHeaders(options?.agentId),
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  void getApiBaseUrl();
  const res = await fetch(resolveApiUrl(path), {
    method: "DELETE",
    headers: buildHeaders(options?.agentId),
    credentials: "include",
  });
  return parseEnvelope<T>(res);
}
