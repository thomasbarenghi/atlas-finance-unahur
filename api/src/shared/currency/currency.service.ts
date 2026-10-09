import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { AppConfig } from "../../config/configuration";

/**
 * Centralizes the supported-currency rule (backend.md §7.14). Money-bearing
 * resources must use a currency from `SUPPORTED_CURRENCIES` so that consolidation
 * and reports never have to assume a 1:1 conversion (BUG-1).
 */
@Injectable()
export class CurrencyService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  isSupported(currency: string): boolean {
    return this.config
      .get("supportedCurrencies", { infer: true })
      .includes(currency.toUpperCase());
  }

  /** Returns the normalized (upper-case) currency or throws VALIDATION_ERROR. */
  assertSupported(currency: string): string {
    const normalized =
      typeof currency === "string" ? currency.toUpperCase() : "";
    if (!normalized || !this.isSupported(normalized)) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "La moneda no está soportada",
        { currency: ["Moneda no soportada"] },
      );
    }
    return normalized;
  }
}
