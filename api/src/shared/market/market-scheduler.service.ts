import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { AppConfig } from "../../config/configuration";
import { MarketService } from "./market.service";

const INTERVAL_NAME = "market-refresh";

@Injectable()
export class MarketScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("MarketScheduler");

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly marketService: MarketService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const market = this.config.get("market", { infer: true });
    if (!market.enabled) {
      this.logger.log("Market refresh disabled");
      return;
    }
    const interval = setInterval(
      () => void this.marketService.refresh(),
      market.refreshIntervalMs,
    );
    this.schedulerRegistry.addInterval(INTERVAL_NAME, interval);
    void this.marketService.refresh();
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist("interval", INTERVAL_NAME)) {
      this.schedulerRegistry.deleteInterval(INTERVAL_NAME);
    }
  }
}
