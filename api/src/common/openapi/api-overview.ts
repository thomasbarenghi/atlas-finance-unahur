import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Markdown shown as the API reference overview (home page of Scalar and
 * Swagger UI). The file is copied to `dist/common/openapi` by the Nest CLI
 * `assets` configuration, so the lookup works in watch and production builds.
 *
 * Falls back to a short summary if the asset is missing: documentation must
 * never prevent the API from booting.
 */
export const getApiOverview = (): string => {
  try {
    return readFileSync(join(__dirname, "api-overview.md"), "utf8");
  } catch {
    // Missing docs asset must not take the API down.
    return "Atlass Fin personal finance REST API";
  }
};
