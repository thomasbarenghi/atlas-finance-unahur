import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AccountsModule } from "./accounts/accounts.module";
import { AssetsModule } from "./assets/assets.module";
import { AssistantModule } from "./assistant/assistant.module";
import { AuthModule } from "./auth/auth.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { CategoriesModule } from "./categories/categories.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { configuration } from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { DebtsModule } from "./debts/debts.module";
import { FxModule } from "./fx/fx.module";
import { GoalsModule } from "./goals/goals.module";
import { HealthModule } from "./health/health.module";
import { PositionsModule } from "./positions/positions.module";
import { QuotesModule } from "./quotes/quotes.module";
import { ReferenceModule } from "./reference/reference.module";
import { ReportsModule } from "./reports/reports.module";
import { MarketModule } from "./shared/market/market.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    FxModule,
    AuthModule,
    UsersModule,
    ReferenceModule,
    HealthModule,
    AssistantModule,
    GoalsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    AssetsModule,
    DebtsModule,
    PositionsModule,
    QuotesModule,
    DashboardModule,
    ReportsModule,
    MarketModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
