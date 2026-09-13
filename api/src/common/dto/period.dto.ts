import { IsDateString, IsOptional, Matches } from "class-validator";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class PeriodDto {
  @IsOptional()
  @Matches(DATE_PATTERN, { message: "from debe tener formato YYYY-MM-DD" })
  @IsDateString({}, { message: "from debe ser una fecha válida" })
  from?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: "to debe tener formato YYYY-MM-DD" })
  @IsDateString({}, { message: "to debe ser una fecha válida" })
  to?: string;
}
