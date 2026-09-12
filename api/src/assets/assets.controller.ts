import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AssetsService } from "./assets.service";
import {
  AssetResponseDto,
  ValuationResponseDto,
} from "./dto/asset-response.dto";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { CreateValuationDto } from "./dto/create-valuation.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";

@ApiTags("assets")
@Controller("assets")
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: "Lista activos con su valuación vigente" })
  @ApiOkResponse({ description: "AssetResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<AssetResponseDto[]> {
    return this.assetsService.listAssets(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea un activo con su valuación inicial" })
  @ApiOkResponse({ description: "AssetResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.assetsService.createAsset(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene un activo" })
  @ApiOkResponse({ description: "AssetResponseDto" })
  get(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AssetResponseDto> {
    return this.assetsService.getAsset(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita un activo" })
  @ApiOkResponse({ description: "AssetResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.assetsService.updateAsset(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva un activo" })
  @ApiOkResponse({ description: "AssetResponseDto" })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AssetResponseDto> {
    return this.assetsService.archiveAsset(userId, id);
  }

  @Get(":id/valuations")
  @ApiOperation({ summary: "Historial de valuaciones de un activo" })
  @ApiOkResponse({ description: "ValuationResponseDto[]" })
  listValuations(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<ValuationResponseDto[]> {
    return this.assetsService.listValuations(userId, id);
  }

  @Post(":id/valuations")
  @ApiOperation({ summary: "Registra una valuación (no sobrescribe historia)" })
  @ApiOkResponse({ description: "ValuationResponseDto" })
  createValuation(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CreateValuationDto,
  ): Promise<ValuationResponseDto> {
    return this.assetsService.createValuation(userId, id, dto);
  }
}
