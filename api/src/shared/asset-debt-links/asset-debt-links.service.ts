import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Debt } from "../../debts/entities/debt.entity";

/**
 * Read model shared by the assets and debts domains to resolve the debt linked
 * to an asset (FR-ACT-008). Keeping it in `shared/` avoids a circular
 * dependency between `AssetsModule` and `DebtsModule`, since the link is used
 * from both sides (asset detail shows its debt; debt validation checks asset).
 */
@Injectable()
export class AssetDebtLinksService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtsRepository: Repository<Debt>,
  ) {}

  async debtIdByAsset(userId: string): Promise<Map<string, string>> {
    const debts = await this.debtsRepository.find({ where: { userId } });
    const links = new Map<string, string>();
    for (const debt of debts) {
      if (debt.assetId && !links.has(debt.assetId)) {
        links.set(debt.assetId, debt.id);
      }
    }
    return links;
  }
}
