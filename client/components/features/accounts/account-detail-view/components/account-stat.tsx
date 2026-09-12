import type { ReactNode } from "react";

export interface AccountStatProps {
  label: string;
  value: ReactNode;
}

export const AccountStat = ({ label, value }: AccountStatProps) => {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-2xl border p-3">
      <span className="text-muted-foreground truncate text-xs">{label}</span>
      <span className="truncate text-sm font-semibold">{value}</span>
    </div>
  );
};
