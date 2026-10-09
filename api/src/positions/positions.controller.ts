import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AddToPositionDto } from "./dto/add-to-position.dto";
import { CreatePositionDto } from "./dto/create-position.dto";
import { PositionResponseDto } from "./dto/position-response.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PositionsOrchestrator } from "./positions.orchestrator";

@ApiTags("positions")
@ApiBearerAuth()
@ApiErrors(400, 401, 404, 409)
@Controller("positions")
export class PositionsController {
  constructor(private readonly positionsOrchestrator: PositionsOrchestrator) {}

  @Get()
  @ApiOperation({ summary: "Lista posiciones con su valorización de mercado" })
  @ApiOkResponse({ type: [PositionResponseDto] })
  list(@CurrentUser("id") userId: string): Promise<PositionResponseDto[]> {
    return this.positionsOrchestrator.listPositions(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una posición" })
  @ApiOkResponse({ type: PositionResponseDto })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.createPosition(userId, dto);
  }

  @Post(":id/add")
  @ApiOperation({
    summary:
      "Suma una compra a una posición (monto + precio unitario) y recalcula cantidad y costo promedio",
  })
  @ApiOkResponse({ type: PositionResponseDto })
  addToPosition(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: AddToPositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.addToPosition(userId, id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una posición" })
  @ApiOkResponse({ type: PositionResponseDto })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.updatePosition(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una posición" })
  @ApiOkResponse({ type: PositionResponseDto })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.archivePosition(userId, id);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restaura una posición archivada" })
  @ApiOkResponse({ type: PositionResponseDto })
  restore(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.restorePosition(userId, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Elimina una posición" })
  @ApiOkResponse({ description: "Posición eliminada" })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.positionsOrchestrator.deletePosition(userId, id);
  }
}
