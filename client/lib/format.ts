/**
 * Default/fallback currency. v0.4 is multi-currency: amounts carry their own
 * currency and the user's primary currency lives in the session. `CURRENCY` is
 * only a fallback for legacy helpers/tests.
 */
export const CURRENCY = "ARS";

const DEFAULT_LOCALE = "es-AR";

export interface CurrencyFormatOptions {
  showCents?: boolean;
}

export const formatCurrency = (
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
  options: CurrencyFormatOptions = {},
) => {
  const showCents = options.showCents ?? true;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);
};

export const formatPercent = (value: number, locale: string = DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

export const formatPercentPoints = (
  value: number,
  locale: string = DEFAULT_LOCALE,
) => formatPercent(value / 100, locale);

export const formatMoneyInput = (
  value: number | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    value,
  );
};

export const sanitizeMoneyInput = (input: string): string => {
  const cleaned = input.replace(/[^\d.,]/g, "");
  const commaIndex = cleaned.indexOf(",");
  if (commaIndex === -1) return cleaned;
  return (
    cleaned.slice(0, commaIndex + 1) +
    cleaned.slice(commaIndex + 1).replace(/,/g, "")
  );
};

const THOUSANDS_FORMATTER = new Intl.NumberFormat(DEFAULT_LOCALE, {
  maximumFractionDigits: 0,
});

export const formatMoneyTyping = (input: string): string => {
  const [integerPart, decimalPart] = sanitizeMoneyInput(input).split(",");
  const digits = integerPart.replace(/\./g, "");
  const formattedInteger =
    digits === "" ? "" : THOUSANDS_FORMATTER.format(Number(digits));
  return decimalPart === undefined
    ? formattedInteger
    : `${formattedInteger},${decimalPart}`;
};

export const parseMoneyInput = (input: string): number | null => {
  let normalized = sanitizeMoneyInput(input);
  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    const parts = normalized.split(".");
    if (parts.length > 1) {
      const decimals = parts[parts.length - 1];
      normalized =
        decimals.length > 0 && decimals.length <= 2
          ? `${parts.slice(0, -1).join("")}.${decimals}`
          : parts.join("");
    }
  }
  if (normalized === "" || normalized === ".") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

export const formatDate = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso.length === 10 ? `${iso}T00:00:00` : iso),
  );

export const formatDayMonth = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso));

export const formatWeekRange = (
  start: string,
  end: string,
  locale: string = DEFAULT_LOCALE,
): string => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const day = (date: Date) =>
    new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
  const month = (date: Date) =>
    new Intl.DateTimeFormat(locale, { month: "short" }).format(date);

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${day(startDate)}–${day(endDate)} ${month(endDate)}`;
  }
  return `${day(startDate)} ${month(startDate)}–${day(endDate)} ${month(endDate)}`;
};

export const formatMonth = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso.slice(0, 7)}-01T00:00:00`));

const formatMonthLabel = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso.slice(0, 7)}-01T00:00:00`));

export const formatMonthTitle = (
  iso: string,
  locale: string = DEFAULT_LOCALE,
): string => {
  const label = formatMonthLabel(iso, locale).replace(" de ", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayIso = (): string => toIsoDate(new Date());
