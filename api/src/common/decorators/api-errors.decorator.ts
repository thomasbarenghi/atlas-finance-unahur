import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { ErrorResponseDto } from "../dto/error-response.dto";

export type ApiErrorStatus =
  400 | 401 | 403 | 404 | 409 | 422 | 429 | 502 | 503;

const DESCRIPTIONS: Record<ApiErrorStatus, string> = {
  400: "Solicitud inválida (validación de body/query)",
  401: "No autenticado",
  403: "Sin permiso sobre el recurso",
  404: "Recurso no encontrado",
  409: "Conflicto de estado",
  422: "Entidad no procesable",
  429: "Demasiadas solicitudes",
  502: "Proveedor externo no disponible",
  503: "Servicio no disponible",
};

/**
 * Documents the error responses a route can return. All share the
 * `ErrorResponseDto` shape (backend.md §7.17).
 *
 * Usage: `@ApiErrors(400, 401, 404, 409)`.
 */
export const ApiErrors = (...statuses: ApiErrorStatus[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: DESCRIPTIONS[status],
        type: ErrorResponseDto,
      }),
    ),
  );
