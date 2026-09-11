const DEFAULT_LOCALE = "es-AR";

export const formatCurrency = (
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

export const formatPercent = (value: number, locale: string = DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

export const formatDate = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );
