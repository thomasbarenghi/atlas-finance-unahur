import { Injectable } from "@nestjs/common";
import { AssetsService } from "../assets/assets.service";
import { CreateDebtDto } from "./dto/create-debt.dto";
import { DebtResponseDto } from "./dto/debt-response.dto";
import { UpdateDebtDto } from "./dto/update-debt.dto";
import { DebtsService } from "./debts.service";

/**
 * Composite use cases of the debts domain that need the assets domain: linking
 * a debt to an asset requires validating that the asset belongs to the user
 * (FR-ACT-008). The orchestrator defines the order and delegates persistence to
 * `DebtsService`.
 */
@Injectable()
export class DebtsOrchestrator {
  constructor(
    private readonly debtsService: DebtsService,
    private readonly assetsService: AssetsService,
  ) {}

  listDebts(userId: string): Promise<DebtResponseDto[]> {
    return this.debtsService.listDebts(userId);
  }

  async createDebt(
    userId: string,
    dto: CreateDebtDto,
  ): Promise<DebtResponseDto> {
    if (dto.assetId) {
      await this.assetsService.assertOwnedAsset(userId, dto.assetId);
    }
    return this.debtsService.createDebt(userId, dto);
  }

  async updateDebt(
    userId: string,
    id: string,
    dto: UpdateDebtDto,
  ): Promise<DebtResponseDto> {
    if (dto.assetId) {
      await this.assetsService.assertOwnedAsset(userId, dto.assetId);
    }
    return this.debtsService.updateDebt(userId, id, dto);
  }

  archiveDebt(userId: string, id: string): Promise<DebtResponseDto> {
    return this.debtsService.archiveDebt(userId, id);
  }
}
