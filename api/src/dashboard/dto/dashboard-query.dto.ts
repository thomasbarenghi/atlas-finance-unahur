import { IsDateString, IsOptional, Matches } from "class-validator";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class DashboardQueryDto {
  @IsOptional()
  @Matches(ISO_DATE, { message: "from debe ser YYYY-MM-DD" })
  @IsDateString({}, { message: "from debe ser una fecha válida" })
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "to debe ser YYYY-MM-DD" })
  @IsDateString({}, { message: "to debe ser una fecha válida" })
  to?: string;
}
