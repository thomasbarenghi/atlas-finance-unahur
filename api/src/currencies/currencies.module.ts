import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account } from "../accounts/entities/account.entity";
import { User } from "../users/entities/user.entity";
import { CurrenciesController } from "./currencies.controller";
import { CurrenciesService } from "./currencies.service";
import { ExchangeRatesProvider } from "./exchange-rates.provider";

@Module({
  imports: [TypeOrmModule.forFeature([User, Account])],
  controllers: [CurrenciesController],
  providers: [CurrenciesService, ExchangeRatesProvider],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
