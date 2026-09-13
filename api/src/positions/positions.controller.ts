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
import { PositionsService } from "./positions.service";

@ApiTags("positions")
@Controller("positions")
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @ApiOperation({ summary: "Lista posiciones con su valorización de mercado" })
  @ApiOkResponse({ description: "PositionResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<PositionResponseDto[]> {
    return this.positionsService.listPositions(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una posición" })
  @ApiOkResponse({ description: "PositionResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsService.createPosition(userId, dto);
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
    return this.positionsService.addToPosition(userId, id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una posición" })
  @ApiOkResponse({ description: "PositionResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.positionsService.updatePosition(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Elimina una posición" })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.positionsService.deletePosition(userId, id);
  }
}
