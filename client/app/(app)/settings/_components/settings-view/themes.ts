export type ThemePreference = "light" | "dark" | "system";

export const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Auto" },
];
