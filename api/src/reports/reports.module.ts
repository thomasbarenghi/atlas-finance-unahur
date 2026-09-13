import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BudgetsModule } from "../budgets/budgets.module";
import { Category } from "../categories/entities/category.entity";
import { DashboardModule } from "../dashboard/dashboard.module";
import { FxModule } from "../fx/fx.module";
import { Transaction } from "../transactions/entities/transaction.entity";
import { User } from "../users/entities/user.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Transaction, Category]),
    DashboardModule,
    BudgetsModule,
    FxModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
