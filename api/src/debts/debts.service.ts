import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Asset } from "../assets/entities/asset.entity";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CreateDebtDto } from "./dto/create-debt.dto";
import { DebtResponseDto, toDebtResponse } from "./dto/debt-response.dto";
import { UpdateDebtDto } from "./dto/update-debt.dto";
import { Debt } from "./entities/debt.entity";

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtsRepository: Repository<Debt>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
  ) {}

  async listDebts(userId: string): Promise<DebtResponseDto[]> {
    const debts = await this.debtsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    return debts.map(toDebtResponse);
  }

  async createDebt(
    userId: string,
    dto: CreateDebtDto,
  ): Promise<DebtResponseDto> {
    if (dto.assetId) {
      await this.assertAsset(userId, dto.assetId);
    }
    const debt = await this.debtsRepository.save(
      this.debtsRepository.create({
        userId,
        name: dto.name.trim(),
        type: dto.type,
        balance: dto.balance,
        currency: dto.currency.toUpperCase(),
        date: dto.date,
        assetId: dto.assetId ?? null,
      }),
    );
    return toDebtResponse(debt);
  }

  async updateDebt(
    userId: string,
    id: string,
    dto: UpdateDebtDto,
  ): Promise<DebtResponseDto> {
    const debt = await this.findOwnedDebt(userId, id);

    if (dto.name !== undefined) debt.name = dto.name.trim();
    if (dto.type !== undefined) debt.type = dto.type;
    if (dto.balance !== undefined) debt.balance = dto.balance;
    if (dto.currency !== undefined) debt.currency = dto.currency.toUpperCase();
    if (dto.date !== undefined) debt.date = dto.date;
    if (dto.assetId !== undefined) {
      if (dto.assetId) await this.assertAsset(userId, dto.assetId);
      debt.assetId = dto.assetId;
    }

    return toDebtResponse(await this.debtsRepository.save(debt));
  }

  async archiveDebt(userId: string, id: string): Promise<DebtResponseDto> {
    const debt = await this.findOwnedDebt(userId, id);
    debt.archived = true;
    return toDebtResponse(await this.debtsRepository.save(debt));
  }

  private async assertAsset(userId: string, assetId: string): Promise<void> {
    const asset = await this.assetsRepository.findOneBy({
      id: assetId,
      userId,
    });
    if (!asset) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El activo no existe",
      );
    }
  }

  private async findOwnedDebt(userId: string, id: string): Promise<Debt> {
    const debt = await this.debtsRepository.findOneBy({ id, userId });
    if (!debt) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La deuda no existe",
      );
    }
    return debt;
  }
}
