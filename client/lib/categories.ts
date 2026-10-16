import type { Category } from "./api/types";

const collator = new Intl.Collator("es", {
  sensitivity: "base",
  numeric: true,
});

export const sortCategories = (categories: Category[]): Category[] =>
  [...categories].sort((first, second) =>
    collator.compare(first.name, second.name),
  );
