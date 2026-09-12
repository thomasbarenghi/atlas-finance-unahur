import type { Category } from "./api/types";

const collator = new Intl.Collator("es", {
  sensitivity: "base",
  numeric: true,
});

export const sortCategories = (categories: Category[]): Category[] =>
  [...categories].sort((first, second) => {
    if (first.isSystem !== second.isSystem) {
      return first.isSystem ? -1 : 1;
    }
    return collator.compare(first.name, second.name);
  });
