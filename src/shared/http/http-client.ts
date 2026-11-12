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

async function parseEnvelope<T>(res: Response, raw = false): Promise<T> {
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
    const errorBody = json as
      { error?: { type?: string; message?: string }; message?: string | string[] } | undefined;
    let message = res.statusText || `Error HTTP ${res.status}`;
    if (errorBody) {
      if (errorBody.error?.message) {
        message = String(errorBody.error.message);
      } else if (errorBody.message) {
        if (Array.isArray(errorBody.message)) {
          message = errorBody.message.join(", ");
        } else {
          message = String(errorBody.message);
        }
      }
    }
    throw new ApiError(message, res.status, errorBody?.error?.type);
  }
  if (raw) {
    return json as T;
  }
  const body = json as { data?: T; token?: string } | undefined;
  if (
    body &&
    typeof body === "object" &&
    typeof body.token === "string" &&
    typeof window !== "undefined"
  ) {
    localStorage.setItem("auth_token", body.token);
  }
  return (body?.data ?? (json as T)) as T;
}

export type RequestOptions = {
  query?: Record<string, string | number | undefined>;
  /** Identidad del agente actor — se envía como header x-agent-id cuando el contrato lo exige. */
  agentId?: string | null;
  /** Si es true, retorna el payload JSON completo sin desenvolver data. */
  raw?: boolean;
  /** Señal opcional de cancelación externa. */
  signal?: AbortSignal;
  /** Tiempo máximo de espera en ms (por defecto 20000 ms; <= 0 desactiva timeout). */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 20_000;

function createAbortError(): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options?: RequestOptions,
): Promise<Response> {
  if (typeof AbortController === "undefined") {
    return fetch(url, init);
  }

  const externalSignal = options?.signal;
  if (externalSignal?.aborted) {
    throw createAbortError();
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => {
    controller.abort();
  };
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut && !externalSignal?.aborted) {
      throw new ApiError(
        "Tiempo de espera agotado al consultar el servidor.",
        408,
        "REQUEST_TIMEOUT",
      );
    }
    throw error;
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

function buildHeaders(agentId?: string | null, isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  if (agentId) headers["x-agent-id"] = agentId;
  return headers;
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  void getApiBaseUrl(); // fail fast if unset
  const res = await fetchWithTimeout(
    buildUrl(path, options?.query),
    {
      headers: buildHeaders(options?.agentId),
      credentials: "include",
    },
    options,
  );
  return parseEnvelope<T>(res, options?.raw);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  void getApiBaseUrl();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetchWithTimeout(
    resolveApiUrl(path),
    {
      method: "POST",
      headers: buildHeaders(options?.agentId, isFormData),
      body: isFormData ? (body as FormData) : body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    },
    options,
  );
  return parseEnvelope<T>(res, options?.raw);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  void getApiBaseUrl();
  const res = await fetchWithTimeout(
    resolveApiUrl(path),
    {
      method: "PUT",
      headers: buildHeaders(options?.agentId),
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    },
    options,
  );
  return parseEnvelope<T>(res, options?.raw);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  void getApiBaseUrl();
  const res = await fetchWithTimeout(
    resolveApiUrl(path),
    {
      method: "PATCH",
      headers: buildHeaders(options?.agentId),
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    },
    options,
  );
  return parseEnvelope<T>(res, options?.raw);
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  void getApiBaseUrl();
  const res = await fetchWithTimeout(
    resolveApiUrl(path),
    {
      method: "DELETE",
      headers: buildHeaders(options?.agentId),
      credentials: "include",
    },
    options,
  );
  return parseEnvelope<T>(res, options?.raw);
}
