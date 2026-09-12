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
