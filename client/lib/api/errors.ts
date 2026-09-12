import type { ApiError as ApiErrorShape } from "./types";

export interface ApiErrorLike {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const isApiErrorShape = (value: unknown): value is ApiErrorShape => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ApiErrorShape>;
  return (
    typeof candidate.statusCode === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isApiErrorShape(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
