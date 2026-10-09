import { mockConfig } from "../../../test/unit/mocks";
import { MarketScheduler } from "./market-scheduler.service";

const build = (enabled: boolean) => {
  const marketService = { refresh: jest.fn().mockResolvedValue({}) };
  const schedulerRegistry = {
    addInterval: jest.fn(),
    deleteInterval: jest.fn(),
    doesExist: jest.fn().mockReturnValue(true),
  };
  const config = mockConfig({
    market: { enabled, refreshIntervalMs: 1000 },
  });
  const scheduler = new MarketScheduler(
    config as any,
    marketService as any,
    schedulerRegistry as any,
  );
  return { scheduler, marketService, schedulerRegistry };
};

describe("MarketScheduler", () => {
  afterEach(() => jest.useRealTimers());

  it("does nothing when the market integration is disabled", () => {
    const { scheduler, marketService, schedulerRegistry } = build(false);
    scheduler.onModuleInit();
    expect(schedulerRegistry.addInterval).not.toHaveBeenCalled();
    expect(marketService.refresh).not.toHaveBeenCalled();
  });

  it("registers an interval and refreshes immediately when enabled", () => {
    jest.useFakeTimers();
    const { scheduler, marketService, schedulerRegistry } = build(true);
    scheduler.onModuleInit();

    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      "market-refresh",
      expect.anything(),
    );
    expect(marketService.refresh).toHaveBeenCalledTimes(1);

    scheduler.onModuleDestroy();
    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith(
      "market-refresh",
    );
  });

  it("does not delete a missing interval on destroy", () => {
    const { scheduler, schedulerRegistry } = build(true);
    schedulerRegistry.doesExist.mockReturnValue(false);
    scheduler.onModuleDestroy();
    expect(schedulerRegistry.deleteInterval).not.toHaveBeenCalled();
  });
});
