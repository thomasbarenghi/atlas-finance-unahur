import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { Debt } from "../debts/entities/debt.entity";
import {
  AssetResponseDto,
  ValuationResponseDto,
} from "./dto/asset-response.dto";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { CreateValuationDto } from "./dto/create-valuation.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";
import { Asset } from "./entities/asset.entity";
import { Valuation } from "./entities/valuation.entity";

const toValuationResponse = (valuation: Valuation): ValuationResponseDto => ({
  id: valuation.id,
  assetId: valuation.assetId,
  value: valuation.value,
  currency: valuation.currency,
  date: valuation.date,
  source: valuation.source,
  createdAt: valuation.createdAt.toISOString(),
});

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    @InjectRepository(Valuation)
    private readonly valuationsRepository: Repository<Valuation>,
    @InjectRepository(Debt)
    private readonly debtsRepository: Repository<Debt>,
  ) {}

  async listAssets(userId: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    return this.derive(userId, assets);
  }

  async getAsset(userId: string, id: string): Promise<AssetResponseDto> {
    const asset = await this.findOwnedAsset(userId, id);
    const [response] = await this.derive(userId, [asset]);
    return response;
  }

  async createAsset(
    userId: string,
    dto: CreateAssetDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetsRepository.save(
      this.assetsRepository.create({
        userId,
        name: dto.name.trim(),
        type: dto.type,
        currency: dto.currency.toUpperCase(),
        notes: dto.notes?.trim() || null,
      }),
    );
    await this.valuationsRepository.save(
      this.valuationsRepository.create({
        assetId: asset.id,
        value: dto.initialValue,
        currency: dto.currency.toUpperCase(),
        date: dto.date,
        source: "manual",
      }),
    );
    const [response] = await this.derive(userId, [asset]);
    return response;
  }

  async updateAsset(
    userId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.findOwnedAsset(userId, id);

    if (dto.name !== undefined) asset.name = dto.name.trim();
    if (dto.type !== undefined) asset.type = dto.type;
    if (dto.currency !== undefined) asset.currency = dto.currency.toUpperCase();
    if (dto.notes !== undefined) asset.notes = dto.notes?.trim() || null;

    const saved = await this.assetsRepository.save(asset);
    const [response] = await this.derive(userId, [saved]);
    return response;
  }

  async archiveAsset(userId: string, id: string): Promise<AssetResponseDto> {
    const asset = await this.findOwnedAsset(userId, id);
    asset.archived = true;
    const saved = await this.assetsRepository.save(asset);
    const [response] = await this.derive(userId, [saved]);
    return response;
  }

  async listValuations(
    userId: string,
    assetId: string,
  ): Promise<ValuationResponseDto[]> {
    await this.findOwnedAsset(userId, assetId);
    const valuations = await this.valuationsRepository.find({
      where: { assetId },
      order: { date: "DESC" },
    });
    return valuations.map(toValuationResponse);
  }

  async createValuation(
    userId: string,
    assetId: string,
    dto: CreateValuationDto,
  ): Promise<ValuationResponseDto> {
    await this.findOwnedAsset(userId, assetId);
    const valuation = await this.valuationsRepository.save(
      this.valuationsRepository.create({
        assetId,
        value: dto.value,
        currency: dto.currency.toUpperCase(),
        date: dto.date,
        source: dto.source ?? "manual",
      }),
    );
    return toValuationResponse(valuation);
  }

  private async derive(
    userId: string,
    assets: Asset[],
  ): Promise<AssetResponseDto[]> {
    if (assets.length === 0) return [];
    const assetIds = assets.map((asset) => asset.id);
    const [valuations, debts] = await Promise.all([
      this.valuationsRepository.find({
        where: { assetId: In(assetIds) },
        order: { date: "DESC" },
      }),
      this.debtsRepository.find({ where: { userId } }),
    ]);

    return assets.map((asset) => {
      const latest = valuations.find(
        (valuation) => valuation.assetId === asset.id,
      );
      const debt = debts.find((item) => item.assetId === asset.id);
      return {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        currency: asset.currency,
        currentValue: latest?.value ?? 0,
        valuationDate:
          latest?.date ?? asset.createdAt.toISOString().slice(0, 10),
        archived: asset.archived,
        notes: asset.notes,
        debtId: debt?.id ?? null,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
      };
    });
  }

  private async findOwnedAsset(userId: string, id: string): Promise<Asset> {
    const asset = await this.assetsRepository.findOneBy({ id, userId });
    if (!asset) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El activo no existe",
      );
    }
    return asset;
  }
}
