import { HttpStatus, Injectable } from "@nestjs/common";
import { AddToPositionDto } from "../../../positions/dto/add-to-position.dto";
import { CreatePositionDto } from "../../../positions/dto/create-position.dto";
import { UpdatePositionDto } from "../../../positions/dto/update-position.dto";
import { PositionsService } from "../../../positions/positions.service";
import { ApiException } from "../../../common/errors/api.exception";
import { ErrorCode } from "../../../common/errors/error-codes";
import { ReferenceResolver } from "../reference-resolver.service";
import { jsonSchema, optionalString, validateToolArgs } from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const positionEntity = (position: {
  id: string;
  symbol: string;
  instrument: string;
  currency: string;
}): AssistantActionEntity => ({
  id: position.id,
  name: `${position.symbol} · ${position.instrument}`,
  currency: position.currency,
});

@Injectable()
export class PositionTools {
  constructor(
    private readonly positions: PositionsService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listPositions",
        title: "Listar inversiones",
        description:
          "Lista las inversiones (posiciones) del usuario con cantidad, costo promedio, precio y resultado cuando hay cotización.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const positions = await this.positions.listPositions(userId);
          return {
            ok: true,
            summary: `${positions.length} posición(es).`,
            data: { positions },
          };
        },
      },
      {
        name: "addToPosition",
        title: "Aportar a inversión",
        description:
          "Suma una compra a una inversión existente: recibe el monto invertido y el precio unitario, y el sistema recalcula la cantidad y el costo promedio (no los calcules a mano). El monto y el precio van en la moneda de la inversión.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            position: {
              type: "string",
              description: "Inversión (id, símbolo o instrumento).",
            },
            amount: {
              type: "number",
              description: "Monto invertido, en la moneda de la inversión.",
            },
            unitPrice: {
              type: "number",
              description:
                "Precio por unidad al que compraste (si no lo sabés, obtenelo con listPositions o listQuotes).",
            },
          },
          ["position", "amount", "unitPrice"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolvePositionId(
            userId,
            args.position,
          );
          const positions = await this.positions.listPositions(userId);
          const current = positions.find((item) => item.id === id);
          const dto = await validateToolArgs(AddToPositionDto, {
            amount: args.amount,
            unitPrice: args.unitPrice,
          });
          const currency = current?.currency ?? "";
          const addedQuantity = dto.amount / dto.unitPrice;
          return {
            args: { position: id, ...dto },
            summary: `Aportar ${dto.amount} a ${current?.symbol ?? id}`,
            preview: {
              title: "Aportar a inversión",
              summary: `Se sumará la compra a ${current?.symbol ?? id} · ${current?.instrument ?? ""}.`,
              fields: [
                {
                  label: "Inversión",
                  value: `${current?.symbol ?? id} · ${current?.instrument ?? ""}`,
                },
                { label: "Monto", value: `${dto.amount} ${currency}` },
                {
                  label: "Precio unitario",
                  value: `${dto.unitPrice} ${currency}`,
                },
                {
                  label: "Cantidad aprox.",
                  value: addedQuantity.toFixed(8),
                },
              ],
              impact:
                "El sistema recalcula la cantidad y el costo promedio ponderado.",
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { position, ...rest } = args;
          const id = await this.resolver.resolvePositionId(userId, position);
          const dto = await validateToolArgs(AddToPositionDto, rest);
          const updated = await this.positions.addToPosition(userId, id, dto);
          return {
            ok: true,
            summary: `Sumé ${dto.amount} ${updated.currency} a ${updated.symbol}; ahora tenés ${updated.quantity} unidades a un costo promedio de ${updated.avgCost}.`,
            data: { position: updated },
            entity: positionEntity(updated),
          };
        },
      },
      {
        name: "createPosition",
        title: "Crear inversión",
        description:
          "Crea una posición de inversión (por ejemplo BTC o ETH) con su cantidad, costo promedio y moneda.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            symbol: {
              type: "string",
              description: "Símbolo, por ejemplo BTC.",
            },
            instrument: {
              type: "string",
              description: "Nombre del instrumento.",
            },
            quantity: { type: "number", description: "Cantidad (>= 0)." },
            avgCost: { type: "number", description: "Costo promedio (>= 0)." },
            currency: { type: "string", description: "Moneda ISO." },
          },
          ["symbol", "instrument", "quantity", "avgCost", "currency"],
        ),
        prepare: async (_userId, args): Promise<PreparedAction> => {
          const dto = await validateToolArgs(CreatePositionDto, args);
          return {
            args: dto as unknown as Record<string, unknown>,
            createdEntityName: dto.symbol,
            summary: `Crear inversión ${dto.symbol} por ${dto.quantity} unidades`,
            preview: {
              title: "Crear inversión",
              summary: `Se registrará ${dto.symbol} · ${dto.instrument}.`,
              fields: [
                { label: "Símbolo", value: dto.symbol.toUpperCase() },
                { label: "Instrumento", value: dto.instrument },
                { label: "Cantidad", value: String(dto.quantity) },
                {
                  label: "Costo promedio",
                  value: `${dto.avgCost} ${dto.currency}`,
                },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreatePositionDto, args);
          const position = await this.positions.createPosition(userId, dto);
          return {
            ok: true,
            summary: `Creé la inversión ${position.symbol}.`,
            data: { position },
            entity: positionEntity(position),
          };
        },
      },
      {
        name: "updatePosition",
        title: "Editar inversión",
        description:
          "Edita una inversión (id, símbolo o nombre del instrumento).",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            position: {
              type: "string",
              description: "Inversión (id, símbolo o instrumento).",
            },
            symbol: { type: "string" },
            instrument: { type: "string" },
            quantity: { type: "number" },
            avgCost: { type: "number" },
            currency: { type: "string" },
          },
          ["position"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const { position, ...rest } = args;
          const id = await this.resolver.resolvePositionId(userId, position);
          const dto = await this.changes(rest);
          return {
            args: { position, ...dto },
            summary: `Editar la inversión ${id}`,
            preview: {
              title: "Editar inversión",
              summary: "Se actualizarán los datos de la inversión.",
              fields: [
                { label: "Inversión", value: await this.label(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { position, ...rest } = args;
          const id = await this.resolver.resolvePositionId(userId, position);
          const dto = await validateToolArgs(UpdatePositionDto, rest);
          const updated = await this.positions.updatePosition(userId, id, dto);
          return {
            ok: true,
            summary: `Actualicé la inversión ${updated.symbol}.`,
            data: { position: updated },
            entity: positionEntity(updated),
          };
        },
      },
      {
        name: "deletePosition",
        title: "Eliminar inversión",
        description:
          "Elimina una inversión (id, símbolo o instrumento). Es una acción destructiva.",
        classification: "destructive",
        parameters: jsonSchema(
          {
            position: {
              type: "string",
              description: "Inversión (id, símbolo o instrumento).",
            },
          },
          ["position"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolvePositionId(
            userId,
            args.position,
          );
          return {
            args: { position: id },
            summary: `Eliminar la inversión ${await this.label(userId, id)}`,
            preview: {
              title: "Eliminar inversión",
              summary: "Se eliminará la inversión seleccionada.",
              fields: [
                { label: "Inversión", value: await this.label(userId, id) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolvePositionId(
            userId,
            args.position,
          );
          await this.positions.deletePosition(userId, id);
          return {
            ok: true,
            summary: "Eliminé la inversión.",
            data: { id },
          };
        },
      },
    ];
  }

  private async changes(
    args: Record<string, unknown>,
  ): Promise<UpdatePositionDto> {
    const candidate = {
      symbol: optionalString(args.symbol),
      instrument: optionalString(args.instrument),
      quantity: args.quantity,
      avgCost: args.avgCost,
      currency: optionalString(args.currency),
    };
    const defined = Object.fromEntries(
      Object.entries(candidate).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para la inversión.",
      );
    }
    return validateToolArgs(UpdatePositionDto, defined);
  }

  private async label(userId: string, id: string): Promise<string> {
    const positions = await this.positions.listPositions(userId);
    const position = positions.find((item) => item.id === id);
    return position ? `${position.symbol} · ${position.instrument}` : id;
  }
}
