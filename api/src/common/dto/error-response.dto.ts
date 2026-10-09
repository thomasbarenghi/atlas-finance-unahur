import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Error body returned by the global exception filter (backend.md §7.17):
 * `{ statusCode, code, message, fieldErrors? }`.
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: "Código HTTP" })
  statusCode: number;

  @ApiProperty({
    example: "VALIDATION_ERROR",
    description: "Código de error estable (backend.md §7.17)",
  })
  code: string;

  @ApiProperty({ example: "Datos inválidos", description: "Mensaje legible" })
  message: string;

  @ApiPropertyOptional({
    description: "Errores por campo (solo en errores de validación)",
    example: { email: ["El email no es válido"] },
    additionalProperties: { type: "array", items: { type: "string" } },
  })
  fieldErrors?: Record<string, string[]>;
}
