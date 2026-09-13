import type { ApiError as ApiErrorShape } from "./types";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(error: ApiErrorShape) {
    super(error.message);
    this.name = "ApiError";
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Sesión no válida") {
    super({ statusCode: 401, code: "UNAUTHENTICATED", message });
    this.name = "UnauthorizedError";
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  stream?: boolean;
  headers?: Record<string, string>;
}

const NO_REFRESH_PATHS = ["/auth/login", "/auth/register"];

let refreshPromise: Promise<boolean> | null = null;

export const refreshAuthSession = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const request = (path: string, options: ApiFetchOptions): Promise<Response> => {
  const { method = "GET", body, signal, headers } = options;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: isFormData
      ? headers
      : { "Content-Type": "application/json", ...headers },
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiErrorShape | null;
  return new ApiError(
    payload ?? {
      statusCode: response.status,
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error inesperado",
    },
  );
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> => {
  let response = await request(path, options);

  if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      response = await request(path, options);
    }
  }

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return parseResponse<T>(response);
};

export const get = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "GET" });

export const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body });

export const patch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body });

export const del = <T>(path: string) => apiFetch<T>(path, { method: "DELETE" });
