export type AppSectionId =
  | "dashboard"
  | "transactions"
  | "categories"
  | "assistant"
  | "profile"
  | "settings";

interface AppSection {
  href: string;
  label: string;
}

export const SECTIONS = {
  dashboard: { href: "/dashboard", label: "Inicio" },
  transactions: { href: "/transactions", label: "Movimientos" },
  categories: { href: "/categories", label: "Categorías" },
  assistant: { href: "/assistant", label: "Asistente" },
  profile: { href: "/profile", label: "Perfil" },
  settings: { href: "/settings", label: "Ajustes" },
} satisfies Record<AppSectionId, AppSection>;

export const ROOT_ROUTES: string[] = [
  SECTIONS.dashboard.href,
  SECTIONS.transactions.href,
  SECTIONS.categories.href,
  SECTIONS.assistant.href,
  SECTIONS.profile.href,
  SECTIONS.settings.href,
];

export const isSectionActive = (pathname: string, href: string): boolean => {
  if (href === SECTIONS.dashboard.href) {
    return (
      pathname === SECTIONS.dashboard.href ||
      pathname.startsWith(`${SECTIONS.dashboard.href}/`) ||
      pathname.startsWith("/accounts")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};
