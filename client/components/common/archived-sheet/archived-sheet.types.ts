import type { ReactNode } from "react";

export interface ArchivedSheetProps<T> {
  /** Plural label used in the trigger (e.g. "cuentas", "metas"). */
  label: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}
