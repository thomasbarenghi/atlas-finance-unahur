import type { LucideIcon } from "lucide-react";
import { SECTIONS, type AppSectionId } from "@/lib/sections";
import { SECTION_ICONS } from "./section-icons";

export interface NavItem {
  id: AppSectionId;
  href: string;
  label: string;
  icon: LucideIcon;
}

const toNavItem = (id: AppSectionId): NavItem => ({
  id,
  ...SECTIONS[id],
  icon: SECTION_ICONS[id],
});

export const NAV_ITEMS: NavItem[] = (
  ["dashboard", "transactions", "budgets", "reports", "settings"] as const
).map(toNavItem);

export const MOBILE_NAV_ITEMS: NavItem[] = (
  ["dashboard", "assistant", "reports", "profile"] as const
).map(toNavItem);
