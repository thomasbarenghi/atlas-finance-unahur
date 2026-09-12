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

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> => {
  const { method = "GET", body, signal, headers } = options;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: isFormData
      ? headers
      : { "Content-Type": "application/json", ...headers },
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as ApiErrorShape | null;
    throw new ApiError(
      payload ?? {
        statusCode: response.status,
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado",
      },
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const get = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, { ...options, method: "GET" });

export const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body });

export const patch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body });

export const del = <T>(path: string) => apiFetch<T>(path, { method: "DELETE" });
