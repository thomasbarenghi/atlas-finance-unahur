import { SECTIONS, type AppSection } from "@/lib/sections";

export type NavItem = AppSection;

export const NAV_ITEMS: NavItem[] = [
  SECTIONS.dashboard,
  SECTIONS.transactions,
  SECTIONS.budgets,
  SECTIONS.reports,
  SECTIONS.settings,
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  SECTIONS.dashboard,
  SECTIONS.assistant,
  SECTIONS.reports,
  SECTIONS.profile,
];
