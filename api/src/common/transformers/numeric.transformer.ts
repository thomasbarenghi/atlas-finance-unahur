import { ValueTransformer } from "typeorm";

export const numericTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null || value === undefined ? null : parseFloat(value),
};
