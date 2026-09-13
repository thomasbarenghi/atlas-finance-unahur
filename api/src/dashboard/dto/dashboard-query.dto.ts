import { IsOptional, IsString, Length, Matches } from "class-validator";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class DashboardQueryDto {
  @IsOptional()
  @Matches(ISO_DATE, { message: "from debe ser YYYY-MM-DD" })
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "to debe ser YYYY-MM-DD" })
  to?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
