import { mockRepository } from "../../../test/unit/mocks";
import { AssetDebtLinksService } from "./asset-debt-links.service";

describe("AssetDebtLinksService", () => {
  it("maps each asset to its first linked debt, ignoring unlinked ones", async () => {
    const repository = mockRepository();
    repository.find.mockResolvedValue([
      { id: "d1", assetId: null },
      { id: "d2", assetId: "asset-1" },
      { id: "d3", assetId: "asset-1" },
    ]);
    const service = new AssetDebtLinksService(repository as any);

    const links = await service.debtIdByAsset("u1");
    expect(links.get("asset-1")).toBe("d2");
    expect(links.has("null")).toBe(false);
  });
});
