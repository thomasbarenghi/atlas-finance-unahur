import {
  ArrowLeftRight,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Settings,
  Sparkles,
  Tags,
  User,
  type LucideIcon,
} from "lucide-react";

export interface AppSection {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const SECTIONS = {
  dashboard: { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  transactions: {
    href: "/transactions",
    label: "Movimientos",
    icon: ArrowLeftRight,
  },
  budgets: { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  reports: { href: "/reports", label: "Reportes", icon: LineChart },
  categories: { href: "/categories", label: "Categorías", icon: Tags },
  assistant: { href: "/assistant", label: "Asistente", icon: Sparkles },
  profile: { href: "/profile", label: "Perfil", icon: User },
  settings: { href: "/settings", label: "Ajustes", icon: Settings },
} satisfies Record<string, AppSection>;

export const ROOT_ROUTES: string[] = [
  SECTIONS.dashboard.href,
  SECTIONS.transactions.href,
  SECTIONS.reports.href,
  SECTIONS.assistant.href,
  SECTIONS.profile.href,
];
