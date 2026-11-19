import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AccountsModule } from "./accounts/accounts.module";
import { AssistantModule } from "./assistant/assistant.module";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { configuration } from "./config/configuration";
import { CurrenciesModule } from "./currencies/currencies.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AssistantModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    DashboardModule,
    CurrenciesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
