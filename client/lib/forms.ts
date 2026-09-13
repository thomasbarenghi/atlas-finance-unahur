import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiErrorShape } from "@/lib/api/errors";

export const applyApiFieldErrors = <T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
): boolean => {
  if (!isApiErrorShape(error) || !error.fieldErrors) return false;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    setError(field as Path<T>, { message: messages[0] });
  }
  return true;
};
