"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/reports", label: "General" },
  { href: "/reports/investments", label: "Patrimonio" },
];

export const ReportsTabs = () => {
  const pathname = usePathname();

  return (
    <nav
      className="bg-card flex w-fit gap-1 rounded-full border p-1"
      aria-label="Secciones de reportes"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
