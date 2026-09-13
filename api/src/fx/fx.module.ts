import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExchangeRate } from "./entities/exchange-rate.entity";
import { FxService } from "./fx.service";

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  providers: [FxService],
  exports: [FxService],
})
export class FxModule {}
