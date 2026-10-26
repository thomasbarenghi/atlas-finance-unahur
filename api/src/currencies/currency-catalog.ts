/**
 * Static catalog of the currencies the app can display (v0.4 multimoneda).
 * The catalog is the single source of truth for validation on the API and for
 * the selector in the client (`GET /currencies`). Rates are stored separately
 * per user in `user_currencies` (see `CurrenciesService`).
 */
export interface CurrencyCatalogEntry {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const CURRENCY_CATALOG: CurrencyCatalogEntry[] = [
  { code: "ARS", name: "Peso argentino", symbol: "$", decimals: 2 },
  { code: "USD", name: "Dólar estadounidense", symbol: "US$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", name: "Libra esterlina", symbol: "£", decimals: 2 },
  { code: "INR", name: "Rupia india", symbol: "₹", decimals: 2 },
  { code: "JPY", name: "Yen japonés", symbol: "¥", decimals: 0 },
  { code: "MXN", name: "Peso mexicano", symbol: "MX$", decimals: 2 },
  { code: "UYU", name: "Peso uruguayo", symbol: "$U", decimals: 2 },
  { code: "BRL", name: "Real brasileño", symbol: "R$", decimals: 2 },
  { code: "CLP", name: "Peso chileno", symbol: "CLP$", decimals: 0 },
  { code: "COP", name: "Peso colombiano", symbol: "COL$", decimals: 2 },
  { code: "PEN", name: "Sol peruano", symbol: "S/", decimals: 2 },
  { code: "BOB", name: "Boliviano", symbol: "Bs", decimals: 2 },
  { code: "PYG", name: "Guaraní", symbol: "₲", decimals: 0 },
  { code: "VES", name: "Bolívar", symbol: "Bs.S", decimals: 2 },
  { code: "CAD", name: "Dólar canadiense", symbol: "CA$", decimals: 2 },
  { code: "AUD", name: "Dólar australiano", symbol: "A$", decimals: 2 },
  { code: "NZD", name: "Dólar neozelandés", symbol: "NZ$", decimals: 2 },
  { code: "CHF", name: "Franco suizo", symbol: "CHF", decimals: 2 },
  { code: "CNY", name: "Yuan chino", symbol: "CN¥", decimals: 2 },
  { code: "KRW", name: "Won surcoreano", symbol: "₩", decimals: 0 },
  { code: "TRY", name: "Lira turca", symbol: "₺", decimals: 2 },
  { code: "RUB", name: "Rublo ruso", symbol: "₽", decimals: 2 },
  { code: "ZAR", name: "Rand sudafricano", symbol: "R", decimals: 2 },
  { code: "SEK", name: "Corona sueca", symbol: "kr", decimals: 2 },
  { code: "NOK", name: "Corona noruega", symbol: "kr", decimals: 2 },
  { code: "DKK", name: "Corona danesa", symbol: "kr", decimals: 2 },
  { code: "PLN", name: "Zloty polaco", symbol: "zł", decimals: 2 },
  { code: "CZK", name: "Corona checa", symbol: "Kč", decimals: 2 },
  { code: "HUF", name: "Forinto húngaro", symbol: "Ft", decimals: 0 },
  { code: "RON", name: "Leu rumano", symbol: "lei", decimals: 2 },
  { code: "BGN", name: "Lev búlgaro", symbol: "лв", decimals: 2 },
  { code: "ISK", name: "Corona islandesa", symbol: "kr", decimals: 0 },
  { code: "ILS", name: "Nuevo séquel", symbol: "₪", decimals: 2 },
  { code: "AED", name: "Dírham", symbol: "د.إ", decimals: 2 },
  { code: "SAR", name: "Riyal saudí", symbol: "﷼", decimals: 2 },
  { code: "QAR", name: "Riyal catarí", symbol: "﷼", decimals: 2 },
  { code: "KWD", name: "Dinar kuwaití", symbol: "د.ك", decimals: 3 },
  { code: "EGP", name: "Libra egipcia", symbol: "E£", decimals: 2 },
  { code: "MAD", name: "Dírham marroquí", symbol: "د.م.", decimals: 2 },
  { code: "NGN", name: "Naira", symbol: "₦", decimals: 2 },
  { code: "KES", name: "Chelín keniano", symbol: "KSh", decimals: 2 },
  { code: "GHS", name: "Cedi", symbol: "₵", decimals: 2 },
  { code: "TND", name: "Dinar tunecino", symbol: "د.ت", decimals: 3 },
  { code: "PKR", name: "Rupia pakistaní", symbol: "₨", decimals: 2 },
  { code: "BDT", name: "Taka", symbol: "৳", decimals: 2 },
  { code: "LKR", name: "Rupia de Sri Lanka", symbol: "₨", decimals: 2 },
  { code: "NPR", name: "Rupia nepalesa", symbol: "₨", decimals: 2 },
  { code: "PHP", name: "Peso filipino", symbol: "₱", decimals: 2 },
  { code: "IDR", name: "Rupia indonesia", symbol: "Rp", decimals: 0 },
  { code: "MYR", name: "Ringgit", symbol: "RM", decimals: 2 },
  { code: "SGD", name: "Dólar de Singapur", symbol: "S$", decimals: 2 },
  { code: "THB", name: "Baht", symbol: "฿", decimals: 2 },
  { code: "VND", name: "Dong", symbol: "₫", decimals: 0 },
];

export const CURRENCY_CODES = CURRENCY_CATALOG.map((entry) => entry.code);

const CATALOG_BY_CODE = new Map(
  CURRENCY_CATALOG.map((entry) => [entry.code, entry]),
);

export const isSupportedCurrency = (code: string): boolean =>
  CATALOG_BY_CODE.has(code.toUpperCase());

export const normalizeCurrency = (code: string): string => code.toUpperCase();

export const getCurrency = (code: string): CurrencyCatalogEntry | undefined =>
  CATALOG_BY_CODE.get(code.toUpperCase());
