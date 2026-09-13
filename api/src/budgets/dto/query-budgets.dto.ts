import { IsOptional, Matches } from "class-validator";
import { MONTH_OR_DATE } from "./create-budget.dto";

export class QueryBudgetsDto {
  @IsOptional()
  @Matches(MONTH_OR_DATE, {
    message: "period debe ser YYYY-MM o YYYY-MM-DD",
  })
  period?: string;
}
