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
import type { AppSectionId } from "@/lib/sections";

export const SECTION_ICONS: Record<AppSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  transactions: ArrowLeftRight,
  budgets: PiggyBank,
  reports: LineChart,
  categories: Tags,
  assistant: Sparkles,
  profile: User,
  settings: Settings,
};
