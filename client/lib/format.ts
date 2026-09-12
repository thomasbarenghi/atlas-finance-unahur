const DEFAULT_LOCALE = "es-AR";

export const formatCurrency = (
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number, locale: string = DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

export const formatApproxCurrency = (
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
) => `≈ ${formatCurrency(value, currency, locale)}`;

export const formatCompactCurrency = (
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatDate = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso.length === 10 ? `${iso}T00:00:00` : iso),
  );

export const formatDateTime = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

export const formatMonth = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso.slice(0, 7)}-01T00:00:00`));

export const formatTimeAgo = (
  iso: string,
  reference: Date = new Date(),
): string => {
  const elapsedMs = reference.getTime() - new Date(iso).getTime();
  const hours = Math.floor(elapsedMs / 3_600_000);
  if (hours < 1) return "hace menos de 1 h";
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
};

export const formatMonthName = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(`${iso.slice(0, 7)}-01T00:00:00`),
  );

export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayIso = (): string => toIsoDate(new Date());

export const firstDayOfMonthIso = (date: Date = new Date()): string =>
  toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));

export const monthInputValue = (iso: string): string => iso.slice(0, 7);

export const monthStartFromInput = (value: string): string => `${value}-01`;
