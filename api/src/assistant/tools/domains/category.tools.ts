import { Injectable } from "@nestjs/common";
import { CategoriesService } from "../../../categories/categories.service";
import {
  CATEGORY_TYPE_VALUES,
  CreateCategoryDto,
} from "../../../categories/dto/create-category.dto";
import { UpdateCategoryDto } from "../../../categories/dto/update-category.dto";
import { ReferenceResolver } from "../reference-resolver.service";
import { jsonSchema, validateChanges, validateToolArgs } from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const categoryEntity = (category: {
  id: string;
  name: string;
  type: string;
}): AssistantActionEntity => ({
  id: category.id,
  name: category.name,
  type: category.type,
});

@Injectable()
export class CategoryTools {
  constructor(
    private readonly categories: CategoriesService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listCategories",
        title: "Listar categorías",
        description:
          "Lista las categorías de ingresos y gastos disponibles (del sistema y propias) con id, nombre, tipo, color y si es del sistema. Al usar una categoría en otra herramienta, pasá el campo name exacto (por ejemplo other_expense), no la etiqueta traducida.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const categories = await this.categories.listCategories(userId);
          return {
            ok: true,
            summary: `Hay ${categories.length} categoría(s) disponibles.`,
            data: { categories },
          };
        },
      },
      {
        name: "createCategory",
        title: "Crear categoría",
        description:
          "Crea una categoría personalizada de ingreso o gasto. El color debe ser un hex (por ejemplo #22c55e).",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            name: { type: "string", description: "Nombre de la categoría." },
            type: { type: "string", enum: CATEGORY_TYPE_VALUES },
            color: {
              type: "string",
              description: "Color hex, por ejemplo #22c55e.",
            },
            icon: { type: "string", description: "Ícono opcional." },
          },
          ["name", "type", "color"],
        ),
        prepare: async (_userId, args): Promise<PreparedAction> => {
          const dto = await validateToolArgs(CreateCategoryDto, args);
          return {
            args: dto as unknown as Record<string, unknown>,
            createdEntityName: dto.name,
            summary: `Crear la categoría "${dto.name}" (${dto.type})`,
            preview: {
              title: "Crear categoría",
              summary: `Se creará la categoría "${dto.name}".`,
              fields: [
                { label: "Nombre", value: dto.name },
                { label: "Tipo", value: dto.type },
                { label: "Color", value: dto.color },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateCategoryDto, args);
          const category = await this.categories.createCategory(userId, dto);
          return {
            ok: true,
            summary: `Creé la categoría "${category.name}".`,
            data: { category },
            entity: categoryEntity(category),
          };
        },
      },
      {
        name: "updateCategory",
        title: "Editar categoría",
        description:
          "Edita una categoría propia. No permite editar categorías del sistema.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            categoryId: {
              type: "string",
              description: "Id (uuid) o nombre de la categoría.",
            },
            name: { type: "string" },
            type: { type: "string", enum: CATEGORY_TYPE_VALUES },
            color: { type: "string", description: "Color hex." },
            icon: { type: "string" },
          },
          ["categoryId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const { categoryId, ...changes } = args;
          const id = await this.resolver.resolveCategoryId(userId, categoryId);
          const dto = await validateChanges(
            UpdateCategoryDto,
            changes,
            "No indicaste ningún cambio para la categoría.",
          );
          return {
            args: { categoryId: id, ...dto },
            summary: `Editar la categoría ${id}`,
            preview: {
              title: "Editar categoría",
              summary: "Se actualizarán los datos de la categoría.",
              fields: [
                { label: "Categoría", value: await this.label(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { categoryId, ...changes } = args;
          const id = await this.resolver.resolveCategoryId(userId, categoryId);
          const dto = await validateToolArgs(UpdateCategoryDto, changes);
          const category = await this.categories.updateCategory(
            userId,
            id,
            dto,
          );
          return {
            ok: true,
            summary: `Actualicé la categoría "${category.name}".`,
            data: { category },
            entity: categoryEntity(category),
          };
        },
      },
      {
        name: "archiveCategory",
        title: "Archivar categoría",
        description:
          "Archiva una categoría propia. Las categorías del sistema no se archivan.",
        classification: "sensitive",
        parameters: jsonSchema(
          {
            categoryId: {
              type: "string",
              description: "Id (uuid) o nombre de la categoría.",
            },
          },
          ["categoryId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveCategoryId(
            userId,
            args.categoryId,
          );
          return {
            args: { categoryId: id },
            summary: `Archivar la categoría ${await this.label(userId, id)}`,
            preview: {
              title: "Archivar categoría",
              summary:
                "La categoría dejará de estar disponible para clasificar.",
              fields: [
                { label: "Categoría", value: await this.label(userId, id) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveCategoryId(
            userId,
            args.categoryId,
          );
          const category = await this.categories.archiveCategory(userId, id);
          return {
            ok: true,
            summary: `Archivé la categoría "${category.name}".`,
            data: { category },
            entity: categoryEntity(category),
          };
        },
      },
    ];
  }

  private async label(userId: string, id: string): Promise<string> {
    const category = await this.categories.assertCategoryUsable(userId, id);
    return `${category.name} (${category.type})`;
  }
}
