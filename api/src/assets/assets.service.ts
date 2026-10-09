import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AssetDebtLinksService } from "../shared/asset-debt-links/asset-debt-links.service";
import { CurrencyService } from "../shared/currency/currency.service";
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
    private readonly links: AssetDebtLinksService,
    private readonly currency: CurrencyService,
    private readonly dataSource: DataSource,
  ) {}

  async listAssets(userId: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    return this.derive(userId, assets);
  }

  async listOwnedAssets(userId: string): Promise<Asset[]> {
    return this.assetsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
  }

  async listValuationsForUser(userId: string): Promise<Valuation[]> {
    const assets = await this.assetsRepository.find({
      where: { userId },
      select: ["id"],
    });
    const assetIds = assets.map((asset) => asset.id);
    if (assetIds.length === 0) return [];
    return this.valuationsRepository.find({
      where: { assetId: In(assetIds) },
      order: { date: "ASC" },
    });
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
    const asset = await this.dataSource.transaction(async (manager) => {
      const currency = this.currency.assertSupported(dto.currency);
      const created = await manager.save(
        manager.create(Asset, {
          userId,
          name: dto.name.trim(),
          type: dto.type,
          currency,
          notes: dto.notes?.trim() || null,
        }),
      );
      await manager.save(
        manager.create(Valuation, {
          assetId: created.id,
          value: dto.initialValue,
          currency,
          date: dto.date,
          source: "manual",
        }),
      );
      return created;
    });
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
    if (dto.currency !== undefined)
      asset.currency = this.currency.assertSupported(dto.currency);
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
        currency: this.currency.assertSupported(dto.currency),
        date: dto.date,
        source: dto.source ?? "manual",
      }),
    );
    return toValuationResponse(valuation);
  }

  async assertOwnedAsset(userId: string, id: string): Promise<void> {
    await this.findOwnedAsset(userId, id);
  }

  private async derive(
    userId: string,
    assets: Asset[],
  ): Promise<AssetResponseDto[]> {
    if (assets.length === 0) return [];
    const assetIds = assets.map((asset) => asset.id);
    const [valuations, debtLinks] = await Promise.all([
      this.valuationsRepository.find({
        where: { assetId: In(assetIds) },
        order: { date: "DESC" },
      }),
      this.links.debtIdByAsset(userId),
    ]);

    return assets.map((asset) => {
      const latest = valuations.find(
        (valuation) => valuation.assetId === asset.id,
      );
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
        debtId: debtLinks.get(asset.id) ?? null,
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
