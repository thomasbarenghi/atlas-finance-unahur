import { IsIn, IsOptional, Matches } from "class-validator";
import { MONTH_OR_DATE } from "../../budgets/dto/create-budget.dto";
import { DashboardQueryDto } from "../../dashboard/dto/dashboard-query.dto";

export class BudgetReportQueryDto {
  @IsOptional()
  @Matches(MONTH_OR_DATE, {
    message: "period debe ser YYYY-MM o YYYY-MM-DD",
  })
  period?: string;
}

export class ExportQueryDto extends DashboardQueryDto {
  @IsOptional()
  @IsIn(["transactions", "summary"])
  type?: "transactions" | "summary";

  @IsOptional()
  @IsIn(["csv"])
  format?: "csv";
}
