# Exploración técnica — Del Asistente IA de solo consulta a ejecutor de acciones

> **Estado:** documento de exploración. No implementa cambios.
> **Fecha:** 2026-09-12
> **Ámbito:** `client/` (Next.js + Capacitor) y `api/` (NestJS).
> **Objetivo:** evaluar cómo evolucionar el Asistente IA desde un modo de solo consulta
> (`FR-IA-006`, P0: "impedir que el asistente cree, edite o elimine información") hacia uno
> capaz de **ejecutar acciones reales** sobre el sistema, de forma segura, auditable y sin
> duplicar lógica de negocio.

---

## 0. Resumen ejecutivo

1. **El asistente actual es estrictamente de lectura y sin *tool calling*.** Inyecta un resumen
   de texto precalculado en un único prompt y streamea la respuesta
   (`api/src/assistant/assistant.service.ts:37-45,164-231`). `AiService` no envía `tools` ni
   interpreta `tool_calls` (`api/src/shared/ai/ai.service.ts:8-90`).
2. **Hallazgo crítico: el API de finanzas no está implementado.** Solo existen *entidades* para
   `accounts`, `transactions`, `categories`, `budgets`, `goals`, `assets`, `debts`, `positions`,
   `quotes`; no hay controllers, services, DTOs ni orquestadores. `app.module.ts` solo registra
   `AuthModule`, `HealthModule`, `AssistantModule` (`api/src/app.module.ts:13-29`). Incluso el
   `AuthController/AuthService` real no existe (solo estrategia JWT). El cliente funciona
   **100% con mocks** (`client/lib/mocks/api.ts`).
3. **Consecuencia directa:** hoy no hay "servicios/use cases existentes que reutilizar" en el
   backend. La acción correcta no es que la IA llame endpoints HTTP, sino **construir primero la
   capa de casos de uso** (servicios primarios + orquestadores) y que **tanto los controllers REST
   como el ejecutor de acciones del asistente usen esas mismas clases in-process**. Así se evita
   duplicar lógica por construcción.
4. **La propuesta es una capa de *tools* tipadas y clasificadas** (`read`, `write_safe`,
   `sensitive`, `destructive`), con resolución de referencias por nombre, confirmación de doble
   fase (propuesta → token de un solo uso), *idempotency keys*, auditoría en tabla dedicada y un
   *flag* explícito `assistantDestructiveEnabled` en `users`.
5. **FR-IA-006 (P0) fue reescrito** de "prohibido escribir" a un modelo de capacidades
   graduado. Ya está alineado en el FRD y en `docs/backend.md` (§9.2/§7).

---

## 1. Arquitectura actual relevante

### 1.1 Monorepo y capas

```
atlas-finance-unahur/
├── client/   # Next.js 16 (App Router, client-only/static export) + Capacitor Android
├── api/      # NestJS monolith: auth + health + assistant (esqueleto de dominios)
├── docs/     # FRD, backend.md (contrato REST §7), frontend.md
└── scripts/  # tooling raíz (Husky)
```

- **Cliente:** REST puro. Regla dura: sin `fetch` en componentes; todo pasa por
  `lib/query/*` → `lib/api/endpoints.ts` → `lib/api/client.ts` (`apiFetch`).
- **API:** monolito modular. Patrón objetivo **Controller → Orchestrator (si aplica) →
  primary services → repositories** (`api/.agents/skills/orchestrator-domain-architecture/SKILL.md`).
  Regla de oro: *un servicio primario nunca llama a otro servicio primario*.

### 1.2 Estado real del API (hallazgo crítico)

| Componente | Estado | Evidencia |
| :--- | :--- | :--- |
| Auth (login/register/refresh) | ❌ Solo estrategia JWT y módulo | `api/src/auth/auth.module.ts`, `jwt.strategy.ts`; no hay `auth.controller.ts` |
| Accounts / Transactions / Categories | ❌ Solo entidades | `api/src/<dominio>/entities/*.entity.ts` |
| Budgets / Assets / Debts / Positions / Quotes / Goals | ❌ Solo entidades | ídem |
| Calculations | ✅ Implementado | `api/src/shared/calculations/calculations.service.ts` |
| AI client | ✅ Implementado (streaming, sin tools) | `api/src/shared/ai/ai.service.ts` |
| Assistant | ✅ Implementado (solo lectura) | `api/src/assistant/*` |
| Migrations + seed | ✅ Existen | `api/src/database/migrations/`, `seeds/seed.ts` |

El propio `docs/backend.md:858` lo reconoce: *"el API aún no expone el resto de los dominios
(accounts, transactions, budgets, etc. solo tienen entidades)"*.

**Implicancia para este plan:** la "reutilización de lógica existente" hoy es una **restricción
de diseño futura**, no una fuente inmediata. El asistente ejecutor debe montarse sobre la capa
de casos de uso que se construya para el REST, no sobre endpoints.

### 1.3 El asistente hoy

Flujo de un turno (`api/src/assistant/assistant.controller.ts:31-67`,
`assistant.service.ts:164-231`):

```
POST /api/assistant/messages
  → OptionalJwtAuthGuard (público condicionado; fallback demo en dev)
  → resolveUserId()                        (assistant.service.ts:69-91)
  → assertAiEnabled()  → 403 AI_DISABLED   (assistant.service.ts:93-110)
  → flushHeaders SSE
  → AssistantContextService.build(userId, dto)  → resumen textual
  → AiService.streamChat([system, user])        → tokens
  → persiste ai_conversations (pregunta/respuesta/contextMeta)
```

Características clave:

- **Sin historial conversacional real:** `conversationId` solo agrupa/persiste; no se reinyectan
  turnos previos al modelo (`assistant.service.ts:197-203`).
- **Contexto precalculado de solo lectura:** consulta repositorios directamente y usa
  `CalculationsService` (`assistant-context.service.ts:53-191`). Es una *deviación conocida*
  documentada en `docs/backend.md:852`.
- **System prompt fijo** que declara alcance acotado y trata los datos del usuario como no
  confiables (defensa de prompt injection textual, `assistant.service.ts:37-45`).
- **SSE** con eventos `meta` / `token` / `done` / `error` (`docs/backend.md:754-776`).
- **No hay tools, acciones, confirmaciones, permisos ni auditoría** en ningún punto.

### 1.4 Preferencias de usuario

- `User.aiEnabled` (DB `ai_enabled`, default `false`), `baseCurrency`, `theme`
  (`api/src/users/entities/user.entity.ts:24-31`).
- Se actualizan por `PATCH /users/me` y se exponen en `GET /auth/me`
  (`docs/backend.md:530-541`). El cliente las gestiona con `useUpdateMe`
  (`client/lib/query/users.ts:6-15`).
- **No existe** ningún flag de acciones destructivas ni de "acciones habilitadas".

### 1.5 Cliente: capa de datos y UI del asistente

- Estado del chat: `AssistantChatProvider` (Context) + `localStorage["atlassfin.assistant.threads.v1"]`
  (`client/providers/assistant-chat-provider.tsx:12`). Sin Zustand.
- Orquestación: `useAssistantConversation` (`.../assistant-chat/hooks/use-assistant-conversation.ts`)
  → `streamAssistantMessage` (`client/lib/api/assistant-stream.ts:32-116`), que usa `fetch` crudo
  (excepción documentada) y **no** pasa por `apiFetch`.
- Render: `MarkdownText` **solo soporta texto/bold/código/listas/títulos**; no hay protocolo de
  tarjetas, botones ni acciones (`client/components/common/markdown-text/markdown.utils.tsx`).
- Componentes reutilizables para confirmaciones: `ConfirmDialog`
  (`client/components/common/confirm-dialog`), `ConfirmActionDialog`, `useConfirmAction`
  (`client/hooks/use-confirm-action.ts`), y toasts con `sonner`.
- Invalidación/cascada de queries ya definida por dominio (p. ej.
  `client/lib/query/transactions.ts:21-28` invalida `transactionsBase`, `accounts`, `budgetsBase`,
  `dashboardBase`).

---

## 2. Inventario de acciones existentes

> **Aclaración:** las acciones de la columna "UI" existen en el cliente y funcionan **contra
> mocks**. La columna "API real" indica si el caso de uso existe en el backend.

### 2.1 Matriz de acciones de usuario

| # | Acción de UI | Endpoint previsto | API real | Clasificación propuesta |
| :--- | :--- | :--- | :--- | :--- |
| A1 | Listar cuentas / detalle | `GET /accounts` | ❌ | read |
| A2 | Crear cuenta | `POST /accounts` | ❌ | write_safe |
| A3 | Editar cuenta | `PATCH /accounts/:id` | ❌ | write_safe |
| A4 | Archivar / restaurar cuenta | `POST /accounts/:id/{archive,restore}` | ❌ | sensitive |
| B1 | Crear/editar/archivar categoría | `POST/PATCH /categories`, `/archive` | ❌ | write_safe |
| C1 | Listar/buscar movimientos | `GET /transactions` | ❌ | read |
| C2 | Crear/editar movimiento | `POST/PATCH /transactions` | ❌ | write_safe |
| C3 | Eliminar movimiento | `DELETE /transactions/:id` | ❌ | **destructive** |
| C4 | Registrar transferencia | `POST /transactions` (`type=transfer`) | ❌ | sensitive |
| D1 | Listar presupuestos | `GET /budgets` | ❌ | read |
| D2 | Crear/editar presupuesto | `POST/PATCH /budgets` | ❌ | write_safe |
| D3 | Eliminar presupuesto | `DELETE /budgets/:id` | ❌ | **destructive** |
| D4 | Copiar presupuestos del mes anterior | `POST /budgets/copy-previous` | ❌ | write_safe (bulk) |
| E1 | Crear objetivo (cuenta `type=goal`) | `POST /accounts` | ❌ | write_safe |
| E2 | Editar / archivar objetivo | `PATCH /accounts/:id` | ❌ | write_safe / sensitive |
| E3 | Registrar aporte a objetivo | (vía transferencia) | ❌ | sensitive |
| F1 | Listar activos / valuaciones | `GET /assets`, `/assets/:id/valuations` | ❌ | read |
| F2 | Crear activo (+ valuación inicial) | `POST /assets` | ❌ | write_safe (compuesto) |
| F3 | Editar activo | `PATCH /assets/:id` | ❌ | write_safe |
| F4 | Registrar valuación | `POST /assets/:id/valuations` | ❌ | write_safe |
| F5 | Archivar activo | `POST /assets/:id/archive` | ❌ | sensitive |
| G1 | Listar deudas | `GET /debts` | ❌ | read |
| G2 | Crear/editar deuda (vincular activo) | `POST/PATCH /debts` | ❌ | write_safe / sensitive |
| G3 | Archivar deuda | `POST /debts/:id/archive` | ❌ | sensitive |
| H1 | Listar posiciones / cotizaciones | `GET /positions`, `GET /quotes` | ❌ | read |
| H2 | Crear/editar posición | `POST/PATCH /positions` | ❌ | write_safe |
| H3 | Eliminar posición | `DELETE /positions/:id` | ❌ | **destructive** |
| I1 | Ver dashboard / reportes | `GET /dashboard`, `/reports/*` | ❌ | read |
| J1 | Actualizar perfil/preferencias (`aiEnabled`, tema, moneda) | `PATCH /users/me` | ❌ | sensitive |
| K1 | Historial del asistente (listar/borrar) | `GET/DELETE /assistant/conversations` | ✅ | read / destructive |

### 2.2 Acciones locales (no-API) que la IA **no** debe tocar

Layout del dashboard, hilos locales del asistente, selector de período, tema en
`localStorage`. Pertenecen a preferencias de dispositivo, no al dominio financiero
(`client/hooks/use-dashboard-layout.ts`, `client/providers/assistant-chat-provider.tsx`).

### 2.3 Criterio de clasificación

- **read:** no muta estado; ejecutable automáticamente por la IA.
- **write_safe:** mutación reversible o de bajo impacto (crear movimiento, presupuesto, activo,
  categoría). Ejecutable con confirmación ligera/inline y resultado visible.
- **sensitive:** afecta saldos o patrimonio de forma relevante (transferencias, archivar,
  vinculaciones, preferencias de IA). Requiere confirmación explícita siempre.
- **destructive:** elimina información o es difícil de revertir (borrar movimiento, presupuesto,
  posición, historial). Requiere confirmación + habilitación previa del usuario en Configuración.

---

## 3. Propuesta de arquitectura

### 3.1 Principio rector

> **La IA nunca implementa lógica de negocio ni llama HTTP. Es un orquestador de casos de uso.**

El ejecutor de acciones del asistente vive **dentro del API** y depende de los **mismos
servicios primarios/orquestadores** que usan los controllers REST. Esto garantiza:
una sola fuente de verdad, una sola validación, un solo control de propiedad.

### 3.2 Diagrama objetivo

```
                 ┌──────────────────────────── API (NestJS) ────────────────────────────┐
 client SSE      │                                                                       │
 POST /assistant │  AssistantController → AssistantService (turno + streaming)            │
 /messages  ─────►│        │                                                              │
                 │        ├─► AssistantContextService (lectura, resumen)                  │
                 │        ├─► AiService (chat + TOOL CALLING)  ──► DeepSeek/OpenAI         │
                 │        └─► AssistantActionOrchestrator (EJECUCIÓN)                     │
                 │                 │                                                       │
                 │                 ├─► ToolRegistry (definiciones tipadas + permisos)      │
                 │                 ├─► ReferenceResolver (nombres → ids del usuario)       │
                 │                 ├─► PendingActionService (preview + confirmación)       │
                 │                 └─► AuditService (assistant_actions)                    │
                 │                          │                                              │
                 │                          ▼                                              │
                 │   ┌──────────── mismos casos de uso que el REST ────────────┐          │
                 │   │ AccountsService · TransactionsService · BudgetsService  │          │
                 │   │ AssetsService · DebtsService · PositionsService …       │          │
                 │   │ TransferOrchestrator · CreateAssetOrchestrator …       │          │
                 │   └─────────────────────────────────────────────────────────┘          │
                 └───────────────────────────────────────────────────────────────────────┘
                          ▲
                          │ usan las MISMAS clases
                 REST Controllers (accounts, transactions, …)
```

### 3.3 Dónde vive cada pieza (respetando los skills)

- **`src/assistant/`** sigue siendo el dominio del asistente (controller, service, contexto,
  DTOs) y suma:
  - `assistant-action.orchestrator.ts` — coordina el ciclo de tools, NO hace queries ni lógica de
    dominio; llama a los primary services/orquestadores existentes.
  - `tools/` — definiciones tipadas de acciones (registro) y handlers finos que validan input,
    resuelven referencias y delegan al caso de uso correspondiente.
  - `pending-actions/` — servicio de acciones pendientes/confirmaciones.
  - `entities/assistant-action.entity.ts` — auditoría.
- **Cero lógica financiera nueva en `assistant/`.** Toda fórmula sigue en
  `CalculationsService` (`api/AGENTS.md` regla 7).
- **Los handlers de tools son adaptadores**, análogos a un controller: traducen un input JSON
  validado a la llamada del caso de uso y mapean a un resultado. No contienen reglas de negocio.
- Para casos compuestos (transferencia, crear activo + valuación) se reutiliza el **orquestador
  existente** en lugar de re-encadenar servicios.

> **Nota de diseño a resolver:** el skill de orquestación prohíbe *primary service → primary
> service*, pero no define explícitamente si un orquestador puede invocar a otro orquestador.
> El `AssistantActionOrchestrator` necesitará invocar orquestadores compuestos (p. ej.
> `TransferOrchestrator`). Recomendación: permitirlo y documentarlo como "orquestador de
> orquestadores" en `orchestrator-domain-architecture/SKILL.md`, o exponer los orquestadores
> compuestos a través de una fachada de aplicación reutilizable.

---

## 4. Modelo de tools/actions

### 4.1 Contrato de una acción

```ts
export type ActionClass = "read" | "write_safe" | "sensitive" | "destructive";

export interface ActionDescriptor<TInput, TOutput> {
  name: string;                     // "createTransaction"
  title: string;                    // etiqueta para la UI ("Crear movimiento")
  description: string;              // para el LLM (cuándo usarla)
  class: ActionClass;
  inputSchema: JSONSchema;          // JSON Schema para function calling + validación
  outputSchema: JSONSchema;
  requiresConfirmation: boolean;    // write_safe: opcional; sensitive/destructive: true
  requiresDestructiveOptIn: boolean;// solo destructive
  idempotent: boolean;              // si soporta idempotency key
  handler(userId, input, ctx): Promise<ActionResult<TOutput>>;
  buildPreview(userId, input): Promise<ActionPreview>;  // resumen legible + valores resueltos
}
```

- **Un `ToolRegistry`** exporta el catálogo filtrado por permisos del usuario y por el *flag* de
  destructivas. Solo se envían al modelo las tools habilitadas.
- Los `name` de las tools son estables y en imperativo, alineados a los métodos de servicio
  (`createAccount`, `transferBetweenAccounts`, `createValuation`, …) para trazabilidad.

### 4.2 Tool calling en `AiService`

Hoy `AiService.streamChat(messages)` no soporta herramientas. Cambios:

1. Aceptar `tools` y `tool_choice` en la request (DeepSeek es OpenAI-compatible).
2. Modelar el *chunk* de tool calls (acumular `tool_calls` por índice/`id`).
3. Nuevos eventos SSE propuestos:
   - `tool_call` (el modelo pidió ejecutar/consultar algo),
   - `action_proposal` (preview + `actionId` pendiente de confirmación),
   - `action_result` (`status`, `summary`, ids afectados),
   - `action_error` (`code`, `message`, `fieldErrors?`).
4. Ciclo multi-step controlado: `máx. N iteraciones` de tool calls por turno (p. ej. 5) para
   evitar loops infinitos y controlar costo/latencia.

> **Importante:** las tools de **lectura** pueden ejecutarse automáticamente y devolver su
> resultado al modelo en el mismo turno. Las de **escritura** deben pasar por el flujo de
> confirmación (sección 6) — no se ejecutan "en caliente" dentro del loop del LLM.

### 4.3 Resolución de referencias ("Banco ARS", "Comida", "Vacaciones")

Problema: el usuario/LLM nombra entidades en lenguaje natural, pero el sistema usa `id` (uuid).
Reglas:

1. **ReferenceResolver** por tipo, siempre acotado al `userId`:
   - cuentas (por `name`, filtrando archivadas/no-archivadas según la acción),
   - categorías (por `name`, respetando `type` income/expense y `isSystem`),
   - activos, deudas, posiciones (por `name`/`symbol`),
   - monedas (catálogo `GET /currencies`).
2. **Coincidencia exacta primero, luego difusa** (normalización de mayúsculas/acentos). Ante
   **ambigüedad** (p. ej. dos "Banco ARS") o **cero resultados**, no adivinar:
   devolver candidatos en la propuesta y pedir al usuario que elija (multi-step).
3. **Nunca resolver a un id de otro usuario.** La resolución consulta siempre por `userId`; un id
   que venga del modelo **no otorga autorización** (`api/AGENTS.md` regla 3).
4. **Snapshot de resolución por turno:** resolver una vez y reutilizar dentro del mismo turno
   para evitar que una edición concurrente cambie los ids entre la preview y la ejecución.
5. La preview debe mostrar el nombre **y** el id resuelto (o al menos el nombre y un detalle
   distintivo: moneda, saldo, tipo) para que el usuario confirme con contexto.

### 4.4 Acciones multi-step y datos faltantes

- El LLM debe poder **pedir datos faltantes** en lugar de inventarlos. Comportamiento:
  - Si falta un campo obligatorio → la tool no se ejecuta; se emite una pregunta al usuario.
  - Si un valor es ambiguo → se ofrecen opciones (candidatos de `ReferenceResolver`).
- El ciclo de tool calling puede encadenar **lecturas** para completar el contexto antes de
  proponer una escritura (p. ej. resolver la cuenta destino de una transferencia).
- Ejemplo completo de flujo compuesto:
  1. usuario: *"Pasá 50.000 de Banco ARS a la cuenta de vacaciones"*;
  2. el modelo llama `listAccounts` / `resolveAccounts` (read);
  3. se resuelve `Banco ARS` y `Vacaciones` (posible desambiguación);
  4. se construye una `action_proposal` de `transferBetweenAccounts` con preview;
  5. el usuario confirma; el backend ejecuta el `TransferOrchestrator`;
  6. resultado + `action_result` + invalidación de queries en el cliente.

### 4.5 Borradores de tools por dominio

| Dominio | Tools de lectura | Tools de escritura |
| :--- | :--- | :--- |
| Cuentas | `listAccounts`, `getAccountBalance` | `createAccount`, `updateAccount`, `archiveAccount`, `restoreAccount` |
| Transacciones | `listTransactions`, `searchTransactions` | `createTransaction`, `updateTransaction`, `deleteTransaction` \* |
| Transferencias | — | `transferBetweenAccounts` |
| Categorías | `listCategories` | `createCategory`, `updateCategory`, `archiveCategory` |
| Presupuestos | `listBudgets`, `getBudgetStatus` | `createBudget`, `updateBudget`, `deleteBudget` \*, `copyPreviousBudgets` |
| Metas | `listGoals`, `getGoalProgress` | `createGoal`, `updateGoal`, `contributeToGoal` |
| Activos | `listAssets`, `listValuations` | `createAsset`, `updateAsset`, `createValuation`, `archiveAsset` |
| Deudas | `listDebts` | `createDebt`, `updateDebt`, `linkDebtToAsset`, `archiveDebt` |
| Inversiones | `listPositions`, `getQuotes` | `createPosition`, `updatePosition`, `deletePosition` \* |
| Perfil | `getProfile` | `updatePreferences` (tema/IA) — **no** cambiar `baseCurrency` sin cuidado |

`*` = destructive.

---

## 5. Estrategia de permisos y seguridad

### 5.1 La IA nunca tiene más permisos que el usuario

Controles en capas:

1. **Sesión obligatoria (producción).** Se elimina/bypasea el fallback demo para acciones de
   escritura: el `userId` sale siempre del JWT (`@CurrentUser()`), nunca del modelo ni del body.
2. **Mismos casos de uso y mismas validaciones** que el REST. Toda acción pasa por el mismo
   servicio que valida propiedad, estados (cuenta archivada), unicidad, etc.
3. **Re-resolución de propiedad en el momento de ejecutar.** Aunque la preview resolvió ids, la
   ejecución vuelve a verificar `userId` (defensa contra TOCTOU).
4. **Catálogo de tools ∩ capacidades de UI.** Una tool solo existe si el usuario podría hacer esa
   acción desde la UI. No se crean "superpoderes" para la IA.
5. **Gate de IA habilitada** (`aiEnabled`) ya existente, extendido a acciones.
6. **Gate de destructivas** (`assistantDestructiveEnabled`, nuevo) solo para `destructive`.
7. **Prompt injection:** los datos del usuario (descripciones, notas) siguen viajando como datos
   no confiables; las instrucciones del sistema son fijas. La decisión de ejecutar **nunca** la
   toma el texto del usuario, sino la confirmación + validación del backend.
8. **Validación de salida del modelo:** todo input de tool se valida con el `inputSchema` +
   `class-validator`/DTO antes de tocar el caso de uso. Nada de "confiar en el JSON del LLM".
9. **Throttling** en el endpoint del asistente (NFR-SEG-010; hoy `ThrottlerModule` está importado
   pero sin guard activo).

### 5.2 Resumen de gates

| clase | aiEnabled | sesión | confirmación | destructivas ON | auditoría |
| :--- | :---: | :---: | :---: | :---: | :---: |
| read | ✅ | ✅ | ❌ | n/a | opcional |
| write_safe | ✅ | ✅ | ✅ (ligera) | n/a | ✅ |
| sensitive | ✅ | ✅ | ✅ (fuerte) | n/a | ✅ |
| destructive | ✅ | ✅ | ✅ (fuerte) | **requiere** | ✅ |

---

## 6. Tratamiento de acciones destructivas

### 6.1 Habilitación explícita desde Configuración

- Nuevo campo de usuario: `assistantDestructiveEnabled` (DB `assistant_destructive_enabled`,
  `boolean NOT NULL DEFAULT false`), agregado a `users`, a `User`/`UpdateUserInput` en el cliente
  y a `PATCH /users/me` (`docs/backend.md:532-541`).
- UI en `SettingsForm` y `SettingsMenu` junto a `aiEnabled` (o deshabilitado si `aiEnabled` es
  `false`), con `ConfirmDialog` de advertencia al activarlo.
- **Por defecto OFF.** Sin este flag, las tools destructivas ni siquiera se envían al modelo
  (no aparecen en el catálogo), no solo se bloquean al ejecutar.

### 6.2 Doble confirmación

1. **Propuesta (preview):** el modelo propone la acción; el backend la guarda como **acción
   pendiente** (`pending_action`) con estado `proposed`, `actionId` y TTL corto (p. ej. 2 min).
2. **Confirmación del usuario:** el cliente muestra una tarjeta con el resumen (qué se va a
   borrar, cuántos registros, impacto) y un botón destructivo. Enviar la confirmación con
   `actionId` + token de un solo uso.
3. **Ejecución:** el backend valida token/estado/TTL, re-resuelve propiedad, ejecuta el caso de
   uso y marca la acción como `executed`/`failed`.

Para acciones destructivas que afectan varias filas (p. ej. borrar una transferencia = 2
movimientos) la preview debe decirlo explícitamente (ya existe copy en la UI:
`client/components/features/transactions/transactions-view/index.tsx:131-135`).

---

## 7. Riesgos

| # | Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- | :--- |
| R1 | **FR-IA-006 (P0) prohibía escribir** | Alto (producto/legal) | Requisito ya reescrito a un modelo de capacidades y docs alineadas (FRD, `backend.md` §9.2/§7) |
| R2 | Prompt injection que dispare escrituras | Alto | Instrucciones fijas + datos no confiables + confirmación humana obligatoria en mutaciones + validación server-side |
| R3 | El LLM alucina ids/montos o al usuario equivocado | Alto | `ReferenceResolver` por `userId`, validación de schema, preview con nombres, re-verificación de propiedad |
| R4 | **Doble ejecución** por reintentos/streaming | Alto (transferencias duplicadas) | Idempotency key + estado de acción pendiente + unique constraint + token de un solo uso |
| R5 | Sin lógica de dominio en el API todavía | Alto (bloqueante) | Construir servicios/orquestadores primero; el asistente se apoya en ellos |
| R6 | Deriva de esquema (goal, campos de cuenta, signo de transferencias) | Medio | Resolver `docs/backend.md` §2.1/§4 antes de construir tools |
| R7 | Fórmulas duplicadas en la IA | Medio | Toda métrica vía `CalculationsService`; previews usan los mappers de los servicios |
| R8 | Conversión FX inexistente (montos multi-moneda) | Medio | No prometer acciones cross-currency hasta implementar `fx`; validar moneda por acción |
| R9 | Costo/latencia del loop de tools | Medio | Límite de iteraciones, tools mínimas, cachear resolución de referencias |
| R10 | Privacidad/auditoría | Medio | Auditar acciones con datos ya del usuario; nunca loguear prompts completos (NFR-SEG-007/008) |
| R11 | UI solo texto (sin tarjetas de acción) | Medio | Extender el contrato SSE + modelo de mensaje a *parts* estructuradas |
| R12 | `@Public()` condicionado del stream | Medio | Para acciones, exigir sesión real siempre |

---

## 8. Cambios necesarios en frontend / backend

### 8.1 Backend (`api/`)

1. **Construir la capa de dominio** (prerequisito): primary services + DTOs + mappers +
   transactions para accounts, transactions, categories, budgets, assets/valuations, debts,
   positions, y orquestadores para transfers / create-asset / copy-budgets. **Sin esto no hay
   nada que la IA pueda ejecutar de forma segura.**
2. `AiService`: soporte de `tools` / `tool_calls` en streaming.
3. `AssistantService`: ciclo de tool calling acotado y emisión de eventos SSE nuevos.
4. `assistant/tools/`: `ToolRegistry`, `ActionDescriptor`, handlers por dominio, `ReferenceResolver`.
5. `assistant/pending-actions/`: servicio de propuestas/confirmaciones con TTL + token.
6. `assistant/entities/assistant-action.entity.ts` + migración: auditoría.
7. `User`: campo `assistantDestructiveEnabled` + migración + DTO + `PATCH /users/me`.
8. Endpoints de confirmación (p. ej. `POST /assistant/actions/:id/confirm` y
   `POST /assistant/actions/:id/cancel`) o reutilizar el stream con un evento de confirmación.
9. Throttling efectivo en el asistente; exigir sesión para escrituras.

### 8.2 Frontend (`client/`)

1. **Modelo de mensaje estructurado:** `AssistantChatMessage` hoy es `content: string`; agregar
   *parts* opcionales (`text | action_proposal | action_result | error`) y persistirlas en el
   `AssistantChatProvider`.
2. **Renderer de acciones:** componentes nuevos en `components/features/assistant/` para tarjeta
   de propuesta (con Confirmar/Cancelar), resultado y error. Reutilizar `ConfirmDialog`/
   `AlertDialog` para destructivas.
3. **Transporte SSE:** extender `AssistantStreamHandlers` y el parser de
   `client/lib/api/assistant-stream.ts` con los eventos nuevos.
4. **Invalidación de queries:** al recibir `action_result`, invalidar el mismo set que la mutación
   equivalente (patrón `client/lib/query/transactions.ts:21-28`), idealmente reutilizando los
   hooks de mutación o una tabla acción→query keys.
5. **Confirmación de escrituras:** enviar `actionId` + token y manejar errores (`getErrorMessage`,
   `toast`).
6. **Settings:** switch "Permitir acciones destructivas del asistente" + diálogo de advertencia,
   en `SettingsForm` y `SettingsMenu`.
7. **Tipos:** extender `client/lib/api/types.ts` (`User`, eventos de acción) y el mock
   (`client/lib/mocks/api.ts`) para poder desarrollar sin el backend real.

---

## 9. Propuesta de implementación por etapas

| Etapa | Contenido | Entregable | Depende de |
| :--- | :--- | :--- | :--- |
| **0. Prerequisitos de dominio** | Auth real + servicios/orquestadores/DTOs de accounts, categories, transactions (+ transfers) | REST end-to-end con datos reales | — |
| **1. Infra de tools (solo lectura)** | `AiService` con tool calling; `ToolRegistry`; tools `read` (listar cuentas, movimientos, presupuestos, activos); `ReferenceResolver`; ciclo multi-step de lectura | El asistente consulta datos por tools en vez de un único resumen | Etapa 0 |
| **2. Escritura segura + confirmación** | `PendingActionService`, auditoría, idempotency keys; tools `write_safe` (movimiento, categoría, presupuesto, activo, valuación, deuda, posición); tarjetas de acción en la UI; invalidación | Crear/editar con preview + confirmar desde el chat | Etapa 1 |
| **3. Sensibles** | Transferencias, archivar/restaurar, vincular deuda↔activo, aportes a metas; confirmación fuerte; preview con impacto | Acciones de alto impacto confirmadas | Etapa 2 |
| **4. Destructivas (opt-in)** | Flag `assistantDestructiveEnabled` + UI; tools `destructive` (borrar movimiento/presupuesto/posición/historial); catálogo condicionado | Borrado solo si el usuario lo habilitó | Etapa 3 |
| **5. Multi-step avanzado** | Desambiguación rica, flujos compuestos (crear activo + valuación, aportes a metas), mejoras de UX del chat | Experiencia conversacional completa | Etapa 4 |

**Criterio de corte por etapa:** cada etapa debe pasar `lint`, `typecheck`, `test`, `build` y
tests de seguridad (ownership, doble ejecución, prompt injection) según el skill `test-quality`.

---

## 10. Recomendación final

1. **No empezar por el asistente.** El bloqueante real es que el backend de finanzas no tiene
   casos de uso. Se debe construir primero la capa de servicios/orquestadores; recién entonces el
   asistente podrá "reutilizar lógica" sin duplicarla.
2. **La IA debe ser un orquestador de casos de uso, nunca un cliente HTTP ni un acceso directo a
   repositorios.** Esa única decisión resuelve DRY, permisos, validación y auditoría de una vez.
3. **Modelo de tools tipadas y clasificadas** (`read` / `write_safe` / `sensitive` /
   `destructive`), con:
   - resolución de referencias por nombre **siempre acotada al usuario**, con desambiguación;
   - preview + confirmación de doble fase y token de un solo uso;
   - *idempotency keys* y unique constraint para evitar duplicados;
   - auditoría en `assistant_actions`.
4. **Las destructivas son opt-in** (`assistantDestructiveEnabled`, default `false`) y no se
   exponen al modelo si el usuario no las habilitó.
5. **La IA nunca tendrá más permisos que el usuario:** mismos casos de uso, misma propiedad,
   mismos DTOs y validaciones que el REST.
6. **Era un cambio de requisito P0 (FR-IA-006).** Ya se actualizó el FRD y
   `docs/backend.md` §9.2/§7 reemplazando "el asistente no escribe" por el modelo de
   capacidades con confirmación.
7. **Secuencia recomendada:** Etapa 0 (dominio) → 1 (lectura por tools) → 2 (escritura segura) →
   3 (sensible) → 4 (destructiva opt-in) → 5 (multi-step). Cada una es desplegable y testeable de
   forma independiente.

---

## Anexo A — Deltas de contrato necesarios (a validar con producto)

- `PATCH /users/me`: agregar `assistantDestructiveEnabled?: boolean`.
- `GET /auth/me` / `User`: exponer `assistantDestructiveEnabled`.
- `POST /assistant/messages`: nuevos eventos SSE `tool_call`, `action_proposal`, `action_result`,
  `action_error`; documentar en `docs/backend.md` §7.16.
- Nuevos endpoints de confirmación de acciones (o evento equivalente en el stream).
- Catálogo de errores nuevos: p. ej. `ACTION_NOT_ALLOWED`, `ACTION_CONFIRMATION_REQUIRED`,
  `ACTION_ALREADY_EXECUTED`, `DESTRUCTIVE_DISABLED`, `ACTION_EXPIRED` (`docs/backend.md` §7.17).

## Anexo B — Preguntas abiertas

1. ¿La confirmación de `write_safe` es siempre obligatoria o se puede configurar un modo
   "confianza"?
2. ¿Las acciones del asistente deben compartir el mismo rate limit que el chat?
3. ¿Se requiere un "modo borrador" (la IA prepara el formulario pre-cargado y el usuario lo
   completa en la UI) como alternativa de menor riesgo? Sería un buen paso intermedio entre
   "solo lectura" y "ejecución".
4. ¿Cómo se reconcilia el `goal` deprecado en `docs/backend.md` con la entidad/tabla `goals`
   todavía presente?
5. ¿Conviene registrar también en la auditoría las tools de lectura para trazabilidad completa?
