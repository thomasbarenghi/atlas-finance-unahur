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
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AddToPositionDto } from "./dto/add-to-position.dto";
import { CreatePositionDto } from "./dto/create-position.dto";
import { PositionResponseDto } from "./dto/position-response.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PositionsOrchestrator } from "./positions.orchestrator";

@ApiTags("positions")
@Controller("positions")
export class PositionsController {
  constructor(private readonly positionsOrchestrator: PositionsOrchestrator) {}

  @Get()
  @ApiOperation({ summary: "Lista posiciones con su valorización de mercado" })
  @ApiOkResponse({ description: "PositionResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<PositionResponseDto[]> {
    return this.positionsOrchestrator.listPositions(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una posición" })
  @ApiOkResponse({ description: "PositionResponseDto" })
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
  @ApiOkResponse({ description: "PositionResponseDto" })
  addToPosition(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: AddToPositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.addToPosition(userId, id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una posición" })
  @ApiOkResponse({ description: "PositionResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.updatePosition(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una posición" })
  @ApiOkResponse({ description: "PositionResponseDto" })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.archivePosition(userId, id);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restaura una posición archivada" })
  @ApiOkResponse({ description: "PositionResponseDto" })
  restore(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<PositionResponseDto> {
    return this.positionsOrchestrator.restorePosition(userId, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Elimina una posición" })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.positionsOrchestrator.deletePosition(userId, id);
  }
}
