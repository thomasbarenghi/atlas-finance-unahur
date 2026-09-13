import { HttpStatus, Injectable } from "@nestjs/common";
import {
  ASSET_TYPE_VALUES,
  CreateAssetDto,
} from "../../../assets/dto/create-asset.dto";
import { CreateValuationDto } from "../../../assets/dto/create-valuation.dto";
import { UpdateAssetDto } from "../../../assets/dto/update-asset.dto";
import { AssetsService } from "../../../assets/assets.service";
import { ApiException } from "../../../common/errors/api.exception";
import { ErrorCode } from "../../../common/errors/error-codes";
import { UsersService } from "../../../users/users.service";
import { ReferenceResolver } from "../reference-resolver.service";
import { jsonSchema, optionalString, validateToolArgs } from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const assetEntity = (asset: {
  id: string;
  name: string;
  type: string;
  currency: string;
}): AssistantActionEntity => ({
  id: asset.id,
  name: asset.name,
  type: asset.type,
  currency: asset.currency,
});

const normalizeName = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

@Injectable()
export class AssetTools {
  constructor(
    private readonly assets: AssetsService,
    private readonly users: UsersService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listAssets",
        title: "Listar activos",
        description:
          "Lista los activos del usuario (propiedades, vehículos, etc.) con su valuación vigente, deuda vinculada y estado.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const assets = await this.assets.listAssets(userId);
          return {
            ok: true,
            summary: `${assets.length} activo(s).`,
            data: { assets },
          };
        },
      },
      {
        name: "listValuations",
        title: "Listar valuaciones",
        description:
          "Lista el historial de valuaciones de un activo (id o nombre).",
        classification: "read",
        parameters: jsonSchema(
          { asset: { type: "string", description: "Activo (id o nombre)." } },
          ["asset"],
        ),
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const assetId = await this.resolver.resolveAssetId(
            userId,
            args.asset,
          );
          const valuations = await this.assets.listValuations(userId, assetId);
          return {
            ok: true,
            summary: `${valuations.length} valuación(es).`,
            data: { valuations },
          };
        },
      },
      {
        name: "createAsset",
        title: "Crear activo",
        description:
          "Crea un activo con su valuación inicial. Si no indicás moneda, se usa la moneda base del usuario. No crea otro activo con un nombre ya existente: para eso editá el existente.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            name: { type: "string" },
            type: { type: "string", enum: ASSET_TYPE_VALUES },
            currency: { type: "string" },
            initialValue: {
              type: "number",
              description: "Valor inicial (>= 0).",
            },
            date: {
              type: "string",
              description: "Fecha de valuación YYYY-MM-DD.",
            },
            notes: { type: "string" },
          },
          ["name", "type", "initialValue", "date"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const user = await this.users.getById(userId);
          const dto = await validateToolArgs(CreateAssetDto, {
            name: args.name,
            type: args.type,
            currency: optionalString(args.currency) ?? user.baseCurrency,
            initialValue: args.initialValue,
            date: args.date,
            notes: optionalString(args.notes) ?? null,
          });
          const existing = await this.assets.listAssets(userId);
          const duplicate = existing.find(
            (asset) =>
              !asset.archived &&
              normalizeName(asset.name) === normalizeName(dto.name),
          );
          if (duplicate) {
            throw new ApiException(
              ErrorCode.VALIDATION_ERROR,
              HttpStatus.BAD_REQUEST,
              `Ya existe el activo "${duplicate.name}". Para corregirlo usá updateAsset (o createValuation); no crees otro con el mismo nombre.`,
            );
          }
          return {
            args: dto as unknown as Record<string, unknown>,
            createdEntityName: dto.name,
            summary: `Crear activo "${dto.name}" por ${dto.initialValue} ${dto.currency}`,
            preview: {
              title: "Crear activo",
              summary: `Se creará "${dto.name}" con su valuación inicial.`,
              fields: [
                { label: "Nombre", value: dto.name },
                { label: "Tipo", value: dto.type },
                {
                  label: "Valor",
                  value: `${dto.initialValue} ${dto.currency}`,
                },
                { label: "Fecha", value: dto.date },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateAssetDto, args);
          const asset = await this.assets.createAsset(userId, dto);
          return {
            ok: true,
            summary: `Creé el activo "${asset.name}".`,
            data: { asset },
            entity: assetEntity(asset),
          };
        },
      },
      {
        name: "updateAsset",
        title: "Editar activo",
        description: "Edita los datos de un activo (id o nombre).",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            asset: { type: "string", description: "Activo (id o nombre)." },
            name: { type: "string" },
            type: { type: "string", enum: ASSET_TYPE_VALUES },
            currency: { type: "string" },
            notes: { type: "string" },
          },
          ["asset"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const { asset, ...rest } = args;
          const id = await this.resolver.resolveAssetId(userId, asset);
          const dto = await this.changes(rest);
          return {
            args: { asset, ...dto },
            summary: `Editar el activo ${id}`,
            preview: {
              title: "Editar activo",
              summary: "Se actualizarán los datos del activo.",
              fields: [
                { label: "Activo", value: await this.label(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { asset, ...rest } = args;
          const id = await this.resolver.resolveAssetId(userId, asset);
          const dto = await validateToolArgs(UpdateAssetDto, rest);
          const updated = await this.assets.updateAsset(userId, id, dto);
          return {
            ok: true,
            summary: `Actualicé el activo "${updated.name}".`,
            data: { asset: updated },
            entity: assetEntity(updated),
          };
        },
      },
      {
        name: "createValuation",
        title: "Registrar valuación",
        description:
          "Agrega una nueva valuación manual a un activo sin borrar las anteriores. Si no indicás moneda, se usa la del activo.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            asset: { type: "string", description: "Activo (id o nombre)." },
            value: { type: "number", description: "Nuevo valor (>= 0)." },
            date: { type: "string", description: "Fecha YYYY-MM-DD." },
            currency: { type: "string" },
          },
          ["asset", "value", "date"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const assetId = await this.resolver.resolveAssetId(
            userId,
            args.asset,
          );
          const asset = await this.assets.getAsset(userId, assetId);
          const dto = await validateToolArgs(CreateValuationDto, {
            value: args.value,
            currency: optionalString(args.currency) ?? asset.currency,
            date: args.date,
            source: "manual",
          });
          return {
            args: { asset: assetId, ...dto },
            summary: `Registrar valuación de ${asset.name} por ${dto.value} ${dto.currency}`,
            preview: {
              title: "Registrar valuación",
              summary: `Nueva valuación para "${asset.name}".`,
              fields: [
                { label: "Activo", value: asset.name },
                { label: "Valor", value: `${dto.value} ${dto.currency}` },
                { label: "Fecha", value: dto.date },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { asset, ...rest } = args;
          const assetId = await this.resolver.resolveAssetId(userId, asset);
          const dto = await validateToolArgs(CreateValuationDto, rest);
          const valuation = await this.assets.createValuation(
            userId,
            assetId,
            dto,
          );
          return {
            ok: true,
            summary: `Registré una valuación de ${valuation.value} ${valuation.currency}.`,
            data: { valuation },
            entity: { id: valuation.id, name: "Valuación" },
          };
        },
      },
      {
        name: "archiveAsset",
        title: "Archivar activo",
        description: "Archiva un activo (id o nombre). Conserva su historial.",
        classification: "sensitive",
        parameters: jsonSchema(
          { asset: { type: "string", description: "Activo (id o nombre)." } },
          ["asset"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveAssetId(userId, args.asset);
          return {
            args: { asset: id },
            summary: `Archivar el activo ${await this.label(userId, id)}`,
            preview: {
              title: "Archivar activo",
              summary: "El activo dejará de contar en tu patrimonio.",
              fields: [
                { label: "Activo", value: await this.label(userId, id) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveAssetId(userId, args.asset);
          const asset = await this.assets.archiveAsset(userId, id);
          return {
            ok: true,
            summary: `Archivé el activo "${asset.name}".`,
            data: { asset },
            entity: assetEntity(asset),
          };
        },
      },
    ];
  }

  private async changes(
    args: Record<string, unknown>,
  ): Promise<UpdateAssetDto> {
    const candidate = {
      name: args.name,
      type: args.type,
      currency: optionalString(args.currency),
      notes: optionalString(args.notes),
    };
    const defined = Object.fromEntries(
      Object.entries(candidate).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para el activo.",
      );
    }
    return validateToolArgs(UpdateAssetDto, defined);
  }

  private async label(userId: string, id: string): Promise<string> {
    const asset = await this.assets.getAsset(userId, id);
    return `${asset.name} (${asset.currency})`;
  }
}
