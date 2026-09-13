# Auditoría integral del sistema de Tool Calling del agente de IA

> **Proyecto:** Atlass Fin (monorepo `client/` + `api/`)
> **Alcance:** sistema de *tool calling* del asistente y su relación con toda la lógica de negocio, evaluado sobre el **diff local actual** de la rama `feature/finance-backend-api`.
> **Método:** lectura completa de UI, frontend, API, servicios, DTOs, entidades, cálculo, docs y tests. Toda afirmación se apoya en el código con `archivo:línea`.
> **Fecha:** 2026-09-12
> **Estado del diff:** `api` typecheck ✅ · `api` tests ✅ (6 suites / 40 tests) · `client` typecheck ✅. No se ejecutó e2e ni build.

---

## 1. Executive Summary

El sistema pasó de un asistente **de solo lectura + 2 tools de cuentas** (`assistant-tools.service.ts`, eliminado) a un **catálogo de 41 tools tipadas y clasificadas** (`read` / `write_safe` / `sensitive` / `destructive`), con **confirmación de doble fase** (propuesta → token de un solo uso → ejecución), resolución de referencias por nombre, agrupación en *planes* con `planId`+`step`, memoria conversacional y auditoría en `assistant_actions`.

La cobertura funcional es **alta**: prácticamente todo el CRUD existente en el backend tiene una tool que reutiliza el **mismo servicio de dominio** que el REST (no hay lógica financiera duplicada en el asistente, que era el objetivo central del diseño en `docs/exploracion_acciones_asistente_ia.md`). Las operaciones destructivas son *opt-in* (`assistantDestructiveEnabled`) y están bloqueadas en tres capas.

Sin embargo, la auditoría detecta que **la composición multi-acción real tiene fallas de arquitectura** (orden de plan sólo en el cliente, deadlock en pasos fallidos, ausencia de idempotencia real, escrituras compuestas no atómicas), **varias capacidades del backend no son alcanzables por el agente** (`updateTransaction` parcial, sin tools de reportes/dashboard, `addToPosition` sin endpoint REST), y **la cobertura de tests es muy baja para el tamaño del catálogo** (0 tests de los 41 handlers y 0 de `PendingActionsService`).

**Veredicto:** el agente **casi puede** operar la app conversacionalmente, pero todavía **no de forma completamente confiable**: puede proponer y ejecutar casi todo, pero no puede garantizar consistencia ante fallos parciales, duplicados ni secuencias dependientes. Score global: **69 / 100 (Aceptable)**.

---

## 2. Application Understanding

Atlass Fin es un gestor financiero personal (inspirado en sure.am) con cliente Next.js estático/Capacitor y API NestJS. Módulos de dominio reales (controllers + services + DTOs + entidades): `auth`, `users`, `accounts`, `transactions`, `categories`, `budgets`, `assets`(+`valuations`), `debts`, `goals`, `positions`, `quotes`, `dashboard`, `reports`, `reference`, `health` y `assistant`.

### 2.1 Entidades y relaciones

```
users ──1:N── accounts ──1:N── transactions (account_id)
                 │                 └─ transfer_account_id (otra account, mismo user)
                 │                 └─ category_id (system o propia)
                 ├──1:N── goals.source_account_id (opcional)
                 └──1:N── assets ──1:N── valuations
                                 └──0:1── debts.asset_id (vínculo deuda↔activo)
      ──1:N── categories (user_id NULL = sistema)
      ──1:N── budgets (category_id, period, recurring)
      ──1:N── debts
      ──1:N── positions (symbol/currency ↔ quotes)
      ──1:N── ai_conversations (messages jsonb)
      ──1:N── assistant_actions (auditoría de acciones propuestas)
```

### 2.2 Reglas de negocio y validaciones relevantes (evidencia)

- **Transacciones** (`api/src/transactions/transactions.service.ts`): `amount` siempre positivo, signo por `type`; moneda debe coincidir con la cuenta (`assertCurrencyMatches`, línea 345); cuenta archivada rechazada (`assertAccountUsable`, 320); transferencia = **dos filas atómicas** con `transferGroupId` (180-235); editar/borrar transferencia afecta ambos lados (126-166, 168-178).
- **Presupuestos** (`api/src/budgets/budgets.service.ts`): único por `(user, category, period)` → `DUPLICATE_BUDGET`; `recurring` proyecta plantilla hacia adelante (`projectForMonth`, 230); `period` normalizado al día 1.
- **Activos** (`api/src/assets/assets.service.ts`): la valuación vigente es la de mayor `date`; `createAsset` hace **dos escrituras separadas** (asset + valuation, líneas 52-76) **sin transacción**.
- **Deudas** (`api/src/debts/debts.service.ts`): `assetId` se valida contra el usuario (33-35, 76-88).
- **Posiciones** (`api/src/positions/positions.service.ts`): valor actual = `quantity × precio`; `addToPosition` recalcula cantidad y costo promedio ponderado (81-100).
- **Metas** (`api/src/goals/goals.service.ts` + `goals.orchestrator.ts`): `savedAmount` es un **valor absoluto** editable; el orquestador valida `sourceAccountId` de propiedad.
- **Cálculos centralizados** (`api/src/shared/calculations/calculations.service.ts`): CAL-001..009, reutilizados por contexto del asistente.

### 2.3 Qué puede hacer el usuario desde la UI

CRUD de cuentas (crear/editar/archivar/restaurar/detalle), movimientos (crear/editar/eliminar, transferencias colapsadas, búsqueda), categorías propias (crear/editar/archivar), presupuestos (crear/editar/eliminar/copiar mes anterior/recurrentes/detalle), activos (crear/editar/archivar + historial de valuaciones), deudas (crear/editar/archivar, vincular activo), posiciones (crear/editar/eliminar), metas (crear/editar/archivar/restaurar/aportes), reportes y dashboard, ajustes (moneda base, tema, IA on/off, destructivas on/off, borrar historial), perfil.

`docs/frontend.md` §§4.1–4.11 y `docs/backend.md` §7 confirman esta superficie; el mapeo endpoint↔UI es 1:1 salvo `addToPosition`.

---

## 3. Architecture Overview

```
POST /assistant/messages (SSE, @Public + OptionalJwtAuthGuard)
  → AssistantService.answer()                       (assistant.service.ts:229)
      1. assertAiEnabled                              (:233)
      2. AssistantContextService.build() → resumen    (assistant-context.service.ts:53)
      3. historial del hilo (messages jsonb)          (conversation-history.ts)
      4. bucle hasta MAX_TOOL_STEPS=5                 (assistant.service.ts:277)
           AiService.streamChat() con tools           (shared/ai/ai.service.ts:67)
           read  → ToolRegistry.executeRead()  → servicio de dominio
           write → definition.prepare() → PendingActionsService.propose()  (acción `proposed`)
      5. emite `action_proposal` / `action_error`     (:318-320)
      6. persiste ai_conversations (turno + transcript)
POST /assistant/actions/:id/confirm  → PendingActionsService.confirm()  (pending-actions.service.ts:92)
POST /assistant/actions/:id/cancel   → PendingActionsService.cancel()
```

Piezas clave:

- **`ToolRegistry`** (`tools/tool-registry.service.ts:56`): arma `AiTool[]` filtrando `destructive` según `user.assistantDestructiveEnabled` (`list()`, 89-94); garantiza unicidad de nombres (`:49`).
- **Tools por dominio** (`tools/domains/*.tools.ts`): 41 definiciones con `description` para el LLM, JSON Schema (`jsonSchema()`), y `prepare`/`execute` que **reutilizan los servicios de dominio**.
- **`ReferenceResolver`** (`tools/reference-resolver.service.ts`): resuelve id-o-nombre **siempre acotado al `userId`**; exacto → difuso; 0 coincidencias → `REFERENCE_PENDING`; >1 → `VALIDATION_ERROR` pidiendo precisión.
- **`PendingActionsService`** (`actions/pending-actions.service.ts`): guarda la propuesta con `token_hash` (sha256), `expiresAt` (TTL `AI_ACTION_TTL_MS`, default 120 s), `planId`, `step`, `resolved`; al confirmar usa `pessimistic_write`, valida estado/TTL/token y **re-resuelve** dependencias (`resolveDeferred`, 222).
- **Cliente**: `use-assistant-conversation.ts` acumula `action_proposal`/`action_error`, ordena tarjetas por `step`, las bloquea hasta ejecutar la previa (`isActionLocked`, 296-311) y llama `confirm/cancel`.

---

## 4. Application Capability Map

Leyenda: ✅ completa · ◐ parcial · ❌ ausente. "Agente" = existe tool.

| # | Funcionalidad | Acción | Entidad | Endpoint backend | Tool | Agente | Notas |
|---|---|---|---|---|---|---|---|
| A1 | Cuentas | listar | account | `GET /accounts` | `listAccounts` | ✅ | |
| A2 | Cuentas | crear | account | `POST /accounts` | `createAccount` | ✅ | no default de moneda |
| A3 | Cuentas | editar | account | `PATCH /accounts/:id` | `updateAccount` | ✅ | |
| A4 | Cuentas | archivar/restaurar | account | `POST /accounts/:id/{archive,restore}` | `archiveAccount`/`restoreAccount` | ✅ | sensitive |
| B1 | Categorías | listar/crear/editar/archivar | category | `GET/POST/PATCH` + `/archive` | 4 tools | ✅ | |
| C1 | Movimientos | listar/filtrar | transaction | `GET /transactions` | `listTransactions` | ✅ | |
| C2 | Movimientos | crear ingreso/gasto | transaction | `POST /transactions` | `createTransaction` | ✅ | |
| C3 | Movimientos | editar | transaction | `PATCH /transactions/:id` | `updateTransaction` | ◐ | no permite `type`/`accountId`/`transferAccountId`/`currency` |
| C4 | Movimientos | transferir | transaction | `POST /transactions` (transfer) | `transferBetweenAccounts` | ✅ | sensitive |
| C5 | Movimientos | eliminar | transaction | `DELETE /transactions/:id` | `deleteTransaction` | ✅ | destructive opt-in |
| D1 | Presupuestos | listar | budget | `GET /budgets` | `listBudgets` | ✅ | |
| D2 | Presupuestos | crear/editar | budget | `POST/PATCH` | `createBudget`/`updateBudget` | ✅ | |
| D3 | Presupuestos | copiar mes | budget | `POST /budgets/copy-previous` | `copyPreviousBudgets` | ✅ | |
| D4 | Presupuestos | eliminar | budget | `DELETE /budgets/:id` | `deleteBudget` | ✅ | destructive opt-in |
| E1 | Patrimonio | listar activos/valuaciones | asset/valuation | `GET /assets`, `/assets/:id/valuations` | `listAssets`/`listValuations` | ✅ | |
| E2 | Patrimonio | crear/editar activo | asset | `POST/PATCH /assets` | `createAsset`/`updateAsset` | ✅ | |
| E3 | Patrimonio | valuar | valuation | `POST /assets/:id/valuations` | `createValuation` | ✅ | |
| E4 | Patrimonio | archivar activo | asset | `POST /assets/:id/archive` | `archiveAsset` | ✅ | no hay restore en backend |
| F1 | Deudas | listar/crear/editar/archivar/vincular | debt | `GET/POST/PATCH` + `/archive` | 4 tools | ✅ | |
| G1 | Inversiones | listar/crear/editar | position | `GET/POST/PATCH` | 3 tools | ✅ | |
| G2 | Inversiones | aportar (monto+precio) | position | **sin endpoint REST** | `addToPosition` | ✅ (solo agente) | asimetría UI↔agente |
| G3 | Inversiones | eliminar | position | `DELETE /positions/:id` | `deletePosition` | ✅ | destructive opt-in |
| H1 | Metas | listar/crear/editar/aportar/archivar/restaurar | goal | `GET/POST/PATCH` + `/archive`,`/restore` | 5 tools | ✅ | aporte = `savedAmount` absoluto |
| I1 | Perfil | ver / preferencias | user | `GET /auth/me`, `PATCH /users/me` | `getProfile`/`updatePreferences` | ◐ | no cambia `baseCurrency` ni destructivas (intencional) |
| J1 | Análisis | dashboard | dashboard | `GET /dashboard` | — | ❌ | sólo resumen precalculado |
| J2 | Análisis | reportes | reports | `GET /reports/*` | — | ❌ | |
| J3 | Mercado | cotizaciones | quote | `GET /quotes` | — | ❌ | referenciado por `addToPosition` |
| J4 | Mercado | refrescar | market | `POST /market/refresh` | — | ❌ | |
| K1 | Monedas | catálogo | reference | `GET /currencies` | — | ❌ | |
| K2 | Historial IA | listar/borrar | conversation | `GET/DELETE /assistant/conversations` | — | ❌ (por diseño) | |

---

## 5. Tool Coverage Matrix

41 tools: 10 `read`, 19 `write_safe`, 9 `sensitive`, 3 `destructive`.

| Tool | Clase | Servicio reutilizado | Validación | Multi-step | Tests tool |
|---|---|---|---|---|---|
| `listAccounts` | read | `AccountsService.listAccounts` | — | — | ❌ |
| `createAccount` | write_safe | `AccountsService.createAccount` | `CreateAccountDto` | — | ❌ |
| `updateAccount` | write_safe | `AccountsService.updateAccount` | `UpdateAccountDto` | resolver | ❌ |
| `archiveAccount`/`restoreAccount` | sensitive | idem | — | resolver | ❌ |
| `listCategories` | read | `CategoriesService` | — | — | ❌ |
| `createCategory`/`updateCategory`/`archiveCategory` | write_safe/sensitive | `CategoriesService` | DTOs | resolver | ❌ |
| `listTransactions` | read | `TransactionsService` | `QueryTransactionsDto` | resolver | ❌ |
| `createTransaction` | write_safe | `TransactionsService` | `CreateTransactionDto` | resolver | ❌ |
| `transferBetweenAccounts` | sensitive | `TransactionsService.createTransaction` | `CreateTransactionDto` | resolver | ❌ |
| `updateTransaction` | write_safe | `TransactionsService.updateTransaction` | `UpdateTransactionDto` | — | ❌ |
| `deleteTransaction` | destructive | `TransactionsService.deleteTransaction` | — | — | ❌ |
| `listBudgets`/`createBudget`/`updateBudget`/`deleteBudget`/`copyPreviousBudgets` | read/write/destructive | `BudgetsService` | DTOs | resolver, period | ❌ |
| `listAssets`/`listValuations` | read | `AssetsService` | — | resolver | ❌ |
| `createAsset`/`updateAsset`/`createValuation`/`archiveAsset` | write/sensitive | `AssetsService` | DTOs | resolver + dedupe nombre | ❌ |
| `listDebts`/`createDebt`/`updateDebt`/`archiveDebt` | read/write/sensitive | `DebtsService` | DTOs | resolver | ❌ |
| `listPositions`/`createPosition`/`updatePosition`/`addToPosition`/`deletePosition` | read/write/destructive | `PositionsService` | DTOs | resolver | ◐ (sólo `addToPosition` service) |
| `listGoals`/`createGoal`/`updateGoal`/`archiveGoal`/`restoreGoal` | read/write/sensitive | `GoalsService`/`GoalsOrchestrator` | DTOs | resolver | ❌ |
| `getProfile`/`updatePreferences` | read/sensitive | `UsersService` | `UpdateUserDto` | — | ❌ |

---

## 6. Multi-action & Workflow Analysis

**Lo que funciona:** el bucle de `AssistantService.answer()` permite N llamadas a tools por turno (hasta 5 rondas); las `read` se ejecutan y devuelven datos al modelo; las `write` se convierten en propuestas con `planId` común y `step` incremental (`plan.step++`, `assistant.service.ts:425`). El cliente acumula cards y las numera.

**Lo que falla / riesgos:**

1. **Orden de plan sólo en el cliente.** El backend no valida `planId`/`step` al confirmar; `resolveDeferred` sólo actúa si `resolved === false` (`pending-actions.service.ts:227`). Nada impide confirmar el paso 2 antes del 1 vía API. La salvaguarda es puramente de UI (`isActionLocked`).
2. **Deadlock por paso fallido.** `isActionLocked` bloquea si un paso anterior no está `executed` **ni** `cancelled` (líneas 305-306). Un paso `failed` no puede cancelarse desde la tarjeta (el botón Cancelar sólo se muestra en `isPending`, `assistant-action-card/index.tsx:122`), así que los pasos dependientes quedan bloqueados **para siempre**.
3. **Ejecución secuencial.** `for (const call of pendingToolCalls) await this.runTool(...)` (`assistant.service.ts:299`) no paraleliza lecturas independientes.
4. **Sin consistencia transaccional entre pasos.** Cada confirmación es una request independiente; no hay rollback ni compensación de un plan parcialmente ejecutado.
5. **Errores enmascarados.** `runTool` sólo reconoce `ApiException`; cualquier error de infraestructura cae a `VALIDATION_ERROR "No se pudo preparar la acción."` sin log (`assistant.service.ts:470-474`).

---

## 7. Dependency & Planning Analysis

- **Resolución de IDs dinámica:** sí. El modelo usa `list*` para obtener ids, o pasa nombres que `ReferenceResolver` traduce. Nunca se confía en ids sin verificar pertenencia (`reference-resolver.service.ts:105-113`).
- **Dependencias entre entidades:** soportadas por el mecanismo `REFERENCE_PENDING` → acción `pending` con args crudos → re-resolución al confirmar (`assistant.service.ts:441-465`; `pending-actions.service.ts:222-253`). Esto cubre el caso "crear activo → crear deuda vinculada".
- **Bug conceptual:** `ReferenceResolver` usa **el mismo código `REFERENCE_PENDING`** para "todavía no existe" y para "no existe en absoluto / nombre mal escrito" (`reference-resolver.service.ts:127-132`). Cualquier typo (p. ej. categoría inexistente o de tipo equivocado) genera una **tarjeta pendiente que nunca podrá resolverse**, en lugar de un `action_error` claro. Además, en `createTransaction.prepare` la categoría se filtra por `type` (`transaction.tools.ts:127-134`); usar una categoría de gasto en un ingreso produce ese falso "pending".
- **Precondiciones:** el modelo tiene la instrucción de leer antes de escribir (`SYSTEM_PROMPT`), pero no hay enforcement server-side de que se haya consultado.
- **No hay un planificador explícito**; el plan emerge del orden en que el LLM emite las tool calls. No hay detección automática de dependencias ni re-planificación formal.
- **IDs generados pasados a pasos siguientes:** **no** dentro del mismo turno (las escrituras no se ejecutan, sólo se proponen). Se resuelven al confirmar, que es donde el ID real existe.

---

## 8. Business Logic Gaps

1. **Fecha "hoy" no provista.** `createTransaction`/`transferBetweenAccounts` exigen `date` (`transaction.tools.ts:100, 199`) y el contexto sólo informa el rango del período (`assistant-context.service.ts:163-183`). Sin fecha actual explícita, "registrá un gasto hoy" puede fallar validación.
2. **`createAccount` no defaultea moneda** (`account.tools.ts:61-102`), a diferencia de activos/deudas/presupuestos/metas que usan `user.baseCurrency`. Inconsistencia que produce `action_error` ante "creame una cuenta de ahorro".
3. **Aporte a meta con semántica absoluta.** `updateGoal.savedAmount` fija el acumulado (`goal.tools.ts:141-163`); no existe `contributeToGoal`. El modelo debe leer el valor actual y sumarle, con riesgo de sobrescribir.
4. **`savedAmount` y `targetAmount` se validan `>= 0`**, pero no hay validación de que un aporte no reduzca el acumulado ni de que `savedAmount <= targetAmount`.
5. **Presupuesto no se restringe a categoría de gasto** (`budget.tools.ts:82-113`; backend tampoco: `budgets.service.ts:65-95`).
6. **Categoría en `updateTransaction` no se filtra por tipo** (`transaction.tools.ts:412-439`), a diferencia de la creación.
7. **Entidades archivadas resolubles.** `listAccounts`/`listAssets`/`listDebts` incluyen archivadas y el resolver las acepta; la operación puede fallar recién al confirmar (p. ej. `ACCOUNT_ARCHIVED`).
8. **No se valida moneda soportada** en cuentas/movimientos/activos/etc. (sólo `baseCurrency` lo hace en `users.service.ts:30-38`).
9. **`createValuation` permite `source: "market"`** desde el modelo (`asset.tools.ts:227`), cuando la fuente real de datos manuales es `manual`.

---

## 9. Backend Compatibility Review

| Punto | Evidencia | Veredicto |
|---|---|---|
| Tools usan los mismos servicios | `*.tools.ts` inyectan `AccountsService`, `TransactionsService`, etc. | ✅ Sin duplicación de dominio |
| DTOs reutilizados | `validateToolArgs(CreateAccountDto, ...)`, `tool-input.ts:30` | ✅ Mismas validaciones que REST |
| Propiedad resuelta por usuario | `ReferenceResolver` siempre con `userId`; `execute(userId, ...)` | ✅ |
| `addToPosition` sin endpoint REST | `positions.controller.ts` (sólo GET/POST/PATCH/DELETE); `positions.service.ts:81` | ❌ Capacidad asimétrica: la tool supera a la UI/REST |
| `listQuotes` inexistente | `position.tools.ts:72` lo referencia; no hay tool; sí existe `QuotesService.listQuotes` (`quotes.service.ts:34`) | ❌ Descripción inválida para el LLM |
| `updateTransaction` parcial vs backend | DTO soporta `type/accountId/transferAccountId/currency` (`update-transaction.dto.ts`); la tool no los expone | ◐ Cobertura parcial |
| `createAsset` no atómico | `assets.service.ts:52-76` (dos `save` sin `dataSource.transaction`) | ❌ Riesgo de activo sin valuación |
| `ACTION_CONFIRMATION_REQUIRED` definido y no usado | `error-codes.ts:10`; sin referencias | ◐ Código muerto |
| `assistant_actions` sin migración | `database.module.ts` usa `synchronize: true`; docs §5.15 | ❌ Esquema por synchronize en runtime |

---

## 10. Tool Quality Review

**Fortalezas:** estructura uniforme por dominio, JSON Schema centralizado (`jsonSchema()`), clasificación explícita, `prepare`/`execute` separadas, preview legible, naming imperativo alineado a los métodos de servicio, `ToolRegistry` con detección de duplicados y filtro de destructivas.

**Debilidades:**

- **Validación duplicada**: cada tool valida en `prepare` y vuelve a validar en `execute` (`account.tools.ts:83` y `:104`, etc.). Es defendible para re-ejecución, pero duplica código.
- **Patrón `assertChanges` repetido** en cuenta/categoría/activo/deuda/posición/meta (DRY).
- **`deferredPreview` expone claves crudas en inglés** ("asset", "transactionId") al usuario (`assistant.service.ts:478-500`).
- **Entidad `valuation` engañosa**: `createValuation.execute` devuelve `entity: { id: assetId, name: "Valuación" }` (`asset.tools.ts:270`).
- **`parseArgs` (write) vs `parseToolArgs` (read)**: el primero traga JSON inválido devolviendo `{}` (`assistant.service.ts:502-511`); el segundo lanza `VALIDATION_ERROR` (`tool-input.ts:14-28`). Inconsistente.
- **Acoplamiento del registry al constructor** con 9 clases: aceptable, pero difícil de testear individualmente (los specs usan `stub`).
- 41 tools en un solo prompt es un volumen alto para el modelo (riesgo de selección incorrecta), sin agrupación ni jerarquía.

---

## 11. LLM Usability Review

- **Nombres:** claros e imperativos; consistentes con los casos de uso.
- **Descripciones:** buenas; incluyen cuándo usar y defaults ("Usá 0 como saldo inicial", "No sirve para transferencias"). `listCategories` explica pasar el `name` interno.
- **Problemas:**
  - `addToPosition` menciona `listQuotes` que **no existe** → el modelo puede llamar una tool fantasma y recibir "no disponible".
  - No hay **ejemplos** en los schemas ni sección "NO usar cuando".
  - Varias descripciones de parámetros son enums implícitos no explicados (p. ej. `type` de cuenta sin labels en español).
  - `createAccount` no aclara que la moneda es obligatoria; el modelo puede omitirla.
  - `updatePreferences` aclara correctamente lo que **no** cambia. Buen patrón a replicar.
- **Reglas del sistema:** el `SYSTEM_PROMPT` (`assistant.service.ts:67-90`) es sólido: obliga a llamar la tool para proponer, prohíbe afirmar éxito sin resultado, trata datos como no confiables, aclara que el usuario no puede saltar la confirmación.

---

## 12. Validation Review

**Correcto:** reutilización de DTOs con `whitelist`+`forbidNonWhitelisted` (`tool-input.ts:37-40`); `Min` en `amount`, `balance`, `limit`, `initialValue`, `quantity`, `avgCost`; `IsDateString`+regex en fechas; `IsUUID` en relaciones; resolución de referencias con desambiguación (`reference-resolver.service.ts:135-143`); `.toUpperCase()` de monedas en servicios.

**Faltante/incorrecto:**

- **Monto `NaN`/`Infinity`** no se controla explícitamente (JSON no debería producirlo, pero `enableImplicitConversion` puede coercionar strings raros).
- **Fechas futuras** permitidas (no siempre inválidas, pero sin regla).
- **Moneda soportada** no validada fuera de `baseCurrency`.
- **`CreateBudgetDto.period`** usa regex `YYYY-MM` que acepta meses inválidos (`2026-13`), sin `IsDateString` → posible error de DB.
- **`updateTransaction`** no valida coherencia `type`↔`category.type`.
- **`parseArgs` silencioso** en el camino de escritura.
- **`REFERENCE_PENDING`** sobrecargado (ver §7), lo que convierte un error de validación en una acción pendiente inválida.

---

## 13. Security & Destructive Actions

**Controles implementados (bien):**

1. Las tools destructivas **no se envían al modelo** si el flag está apagado (`tool-registry.service.ts:89-94`).
2. `runTool` re-verifica el flag al proponer (`assistant.service.ts:398-406`).
3. `PendingActionsService.confirm` vuelve a verificar el flag antes de ejecutar (`pending-actions.service.ts:150-159`).
4. Token de un solo uso hasheado (sha256) con `timingSafeEqual` (`:23-27`), TTL y bloqueo pesimista (`:99-140`).
5. Confirmar/cancelar requieren JWT global (no `@Public`).
6. Los servicios de dominio re-verifican propiedad (`userId`) en cada operación (regla AGENTS).
7. El asistente **no puede** habilitar destructivas ni cambiar `baseCurrency` (`profile.tools.ts:39-48`).

**Riesgos:**

- **`@Public()` + fallback demo en no-producción** (`assistant.controller.ts:33`; `assistant.service.ts:116-138`): en un entorno distinto de `production` sin sesión, el stream opera como `AI_DEV_USER_EMAIL`. Aunque la confirmación exige JWT real, en un staging `NODE_ENV != production` cualquier persona puede proponer acciones sobre el usuario demo. **Riesgo alto si se despliega tal cual.**
- **Token en `localStorage`**: los hilos se persisten con el token de confirmación (TTL 120 s) en `atlassfin.assistant.threads.v2` (`assistant-chat-provider.tsx`). Riesgo bajo pero real ante XSS.
- **Prompt injection vía tool output**: los datos del usuario vuelven como mensajes `role:"tool"` (`assistant.service.ts:307-311`) sin envoltorio de "contenido no confiable", a diferencia del resumen.
- **Sin rate-limit específico de acciones**: sólo el global (100/min, `app.module.ts:37,61`).

---

## 14. Reliability & Idempotency

- **Doble ejecución:** mitigada por `status` + lock pesimista + token, no por *idempotency keys* (que el diseño original pedía: `exploracion_acciones_asistente_ia.md` R4). Dos propuestas idénticas generadas por el modelo siguen siendo dos acciones válidas → **duplicados posibles** si el usuario confirma ambas.
- **Reintento de `failed`:** permitido (`confirm` acepta `status === "failed"`, `pending-actions.service.ts:110-140`). Para `createAsset` (dos escrituras no atómicas) un fallo parcial + reintento puede duplicar el activo o dejar valuación huérfana.
- **Propuestas creadas sin entrega:** las acciones se persisten durante el stream y se emiten **al final** (`assistant.service.ts:318-320`). Si el stream falla antes, quedan `proposed` en DB, invisibles para el usuario, y expiran por TTL.
- **Persistencia del turno al final**: si el cliente corta, no se guarda conversación; las acciones ya creadas quedan huérfanas.
- **`expired` nunca se persiste**: una acción vencida sigue con `status="proposed"`; cada confirm devuelve `ACTION_EXPIRED` sin cambiar estado.
- **Sin rollback/compensación** de planes multi-acción parcialmente ejecutados.
- **El asistente no registra el resultado de las confirmaciones** en `ai_conversations`, por lo que en el turno siguiente no "sabe" qué acciones se ejecutaron (sólo lo ve por las tools de lectura si vuelve a consultar).

---

## 15. Test Coverage

**Existe (6 suites, 40 tests, todas verdes):**

- `tool-registry.service.spec.ts`: filtrado de destructivas, duplicados, tool desconocida, `executeRead`.
- `reference-resolver.service.spec.ts`: match exacto/difuso, scoping por usuario, id ajeno, ambigüedad, 0 match.
- `assistant.service.spec.ts`: emite `action_proposal`, no propone si falla, propuesta `pending` ante `REFERENCE_PENDING`.
- `conversation-history.spec.ts`: trimming, orden, límites.
- `positions.service.spec.ts`: `addToPosition` promedio ponderado y propiedad.

**No existe (gaps concretos):**

| Qué falta | Capa / archivo | Escenario |
|---|---|---|
| Confirm/cancel completos | `pending-actions.service.spec.ts` (nuevo) | token inválido, TTL vencido, `ACTION_ALREADY_EXECUTED`, doble confirmación concurrente, destructiva OFF, `resolveDeferred` OK y `ACTION_DEPENDENCY_PENDING` |
| Handlers de las 41 tools | `tools/domains/*.spec.ts` | cada `prepare`/`execute`: defaults, resolución, errores, dedupe de activo, `addToPosition`, `updateDebt` desvincular |
| Gate destructivo end-to-end | e2e/`assistant` | flag OFF → tool ausente → confirm 403 |
| Orden de plan server-side | `pending-actions` | confirmar paso 2 sin paso 1 |
| `AssistantContextService` | `assistant-context.spec.ts` | período inválido, cálculo de net worth, top categorías |
| Controller SSE | e2e | headers, `@Public` + dev fallback, `AI_DISABLED` |
| Cliente | Vitest/MSW (no configurado) | `isActionLocked`, confirm/cancel, invalidación de queries |
| Mock de acciones | `client/lib/mocks` | el mock no emite `action_proposal`; `confirmAction`/`cancelAction` **ignoran** `USE_MOCKS` (`endpoints.ts:260-273`) |

---

## 16. Missing Capabilities

> **P0 — Crítico**

- **Ninguna capacidad P0 ausente.** El CRUD esencial está cubierto.

> **P1 — Alto**

- **Herramientas de análisis (dashboard/reportes).** El usuario ve patrimonio, series, gastos por categoría, presupuestos, export (`GET /dashboard`, `GET /reports/*`); el agente sólo tiene el resumen precalculado (`assistant-context.service.ts`). No puede responder "mostrame mis gastos de este mes por categoría" con datos completos ni exportar. → Tools `getDashboard`/`getReportsSummary`/`getExpensesByCategory`. Dependencia: `DashboardService`/`ReportsService`.

> **P2 — Medio**

- **Edición completa de movimientos.** La tool omite `type`, `accountId`, `transferAccountId`, `currency` que el `PATCH` sí soporta; tampoco edita transferencias. → ampliar `updateTransaction`.
- **Cotizaciones.** `position.tools.ts:72` referencia `listQuotes` inexistente; el usuario ve cotizaciones. → `listQuotes` read.
- **Aporte a meta aditivo.** No hay `contributeToGoal`; sólo `savedAmount` absoluto.
- **`addToPosition` sin UI/REST.** Capacidad exclusiva del agente (viola el principio "catálogo ∩ capacidades de UI" del diseño).

> **P3 — Bajo / conveniencia**

- Cambiar `baseCurrency` y `assistantDestructiveEnabled` por el asistente (intencionalmente prohibido; documentar).
- `POST /market/refresh`, `GET /currencies`, listar/borrar conversaciones.
- Borrar/restaurar activos y deudas (tampoco existen en backend → no aplica).

---

## 17. Dangerous Capabilities

1. **Fallback dev sin sesión** (`assistant.service.ts:116-138`): permite proponer acciones (no confirmar) como usuario demo fuera de producción. **Alto.**
2. **`updatePreferences` puede desactivar `aiEnabled`** (`profile.tools.ts:44`): el agente puede apagar el asistente. Bajo, pero conviene excluirlo.
3. **Acciones `sensitive` siempre disponibles** (archivar cuenta/activo/deuda/meta, transferir): sólo requieren click de confirmación; un usuario apurado puede confirmar sin revisar la preview. Medio (UX/safety).
4. **Preview incompleta en algunos casos**: `deferredPreview` usa claves crudas y no muestra impacto; en transfers sí hay `impact` (`transaction.tools.ts:237-238`). Confirma a ciegas una acción dependiente. Medio.
5. **Sin límite de acciones por turno**: `MAX_TOOL_STEPS=5` limita rondas, no propuestas; el modelo puede proponer decenas de tarjetas. Bajo.
6. **No hay confirmación adicional para operaciones financieramente sensibles** más allá del botón de la tarjeta (transferencias, archivar). El diseño pedía "confirmación fuerte" para `sensitive` (§5.2 del diseño), no implementada.

---

## 18. Realistic User Scenarios

### 18.1 Simples

| Mensaje | Intent | Tools | Orden | Resultado |
|---|---|---|---|---|
| "Registrá un gasto de $50.000 en comida." | crear gasto | `listCategories`→`createTransaction` | read→propose | ✅ si el modelo provee fecha/descripción/cuenta; ⚠️ falla si omite fecha o cuenta |
| "¿Cuánto gasté este mes?" | consulta | (resumen) o `listTransactions` | — | ◐ resumen top-5; sin desglose completo |
| "Creame una cuenta nueva para mis ahorros." | crear cuenta | `createAccount` | propose | ⚠️ falla si omite `currency` (no hay default) |
| "Modificá mi última transacción." | editar | `listTransactions`→`updateTransaction` | read→propose | ✅ (el modelo elige la última) |
| "¿Cuál es mi patrimonio?" | consulta | (resumen) | — | ✅ net worth del resumen |
| "Mostrame mis gastos de este mes por categoría." | consulta | `listTransactions` | read | ◐ requiere sumar a mano; sin tool de reportes |

### 18.2 Ambiguos

| Mensaje | Comportamiento esperado | Evidencia |
|---|---|---|
| "Mové plata." | no ejecutar; pedir cuentas/monto | prompt + validación |
| "Creá una cuenta." | pedir nombre/moneda (o default) | ⚠️ moneda sin default |
| "Modificá lo último." | `listTransactions` y elegir | ✅ |
| "Agregá 100." | pedir contexto | ✅ validación |
| "Compré algo." | pedir detalle | ✅ |
| "Registrá una deuda." | pedir nombre/monto | ✅ |

### 18.3 Complejos / multi-acción

| Escenario | Flujo | Veredicto |
|---|---|---|
| "Creame una cuenta de ahorro y poné $100.000." | `createAccount` (propose) + `updateAccount`/movimiento | ✅ si el modelo encadena; el segundo paso se propone con la cuenta inexistente → queda `pending`, se resuelve al confirmar la cuenta (`pending-actions`) |
| "Creá una cuenta, registrá una deuda y agregá un movimiento." | 3 propuestas con `planId`+steps | ◐ orden sólo cliente; sin rollback |
| "Creá una cuenta de inversión, cargale $500.000 y registrá la inversión." | `createAccount`+`createTransaction`+`createPosition` | ⚠️ no hay vinculación real entre "cargar" y la posición; el modelo decide |
| "Creá una cuenta, mové $100.000 desde el banco y registrá una inversión de $50.000." | `createAccount`→`transferBetweenAccounts`→`createPosition` | ✅ dependencia por nombre → pending→resolución |
| "Registrá mis gastos de hoy: super $50k, transporte $10k, comida $20k." | 3 `createTransaction` | ✅; ⚠️ debe resolver 3 categorías y la fecha |
| "Le debo $300.000 a Juan y agregá el movimiento." | `createDebt` + `createTransaction` | ◐ deuda y movimiento no se relacionan; decisión del modelo |

### 18.4 Verificación de la cadena completa

`Mensaje → intent → plan → Tool A (read) → resultado → Tool B (write, propose) → confirmación → ejecución → invalidación de queries`. La cadena **existe y funciona**, pero el punto 4-5 (composición y consistencia) es donde se concentran los riesgos descritos en §§6, 7, 14.

---

## 19. Findings

### CRITICAL

**C1 — Orden de plan y dependencias no se validan en el backend**
- **Problema:** el cliente bloquea pasos posteriores, pero la API `confirm` no verifica `planId`/`step`. Se puede ejecutar el paso 2 sin el 1; `resolveDeferred` sólo cubre acciones no resueltas.
- **Ubicación:** `api/src/assistant/actions/pending-actions.service.ts:92-174`; `api/src/assistant/assistant.service.ts:441-465`; `client/.../use-assistant-conversation.ts:296-311`.
- **Evidencia:** `confirm()` no lee `planId` ni `step`; `isActionLocked` vive sólo en el cliente.
- **Por qué importa:** la dependencia declarada por el sistema (docs §7.16) no es enforceable; una integración distinta a la UI puede romper la secuencia.
- **Impacto:** datos inconsistentes (deudas/valuaciones sin su entidad base).
- **Solución:** validar en `confirm` que todos los pasos `step' < step` del mismo `planId` estén `executed` o `cancelled`; devolver `ACTION_DEPENDENCY_PENDING` si no.
- **Prioridad:** P0.

**C2 — Escrituras compuestas no atómicas expuestas por el agente**
- **Problema:** `createAsset` guarda asset y su valuación inicial en dos `save` sin transacción; una falla intermedia deja un activo sin valuación y un reintento duplica.
- **Ubicación:** `api/src/assets/assets.service.ts:52-76`.
- **Evidencia:** `assetsRepository.save(...)` seguido de `valuationsRepository.save(...)`, sin `dataSource.transaction`.
- **Por qué importa:** el agente expone `createAsset` con confirmación y reintento; el fallo parcial es invisible.
- **Impacto:** patrimonio inconsistente/duplicado.
- **Solución:** envolver en `dataSource.transaction`; opcionalmente idempotency key por propuesta.
- **Prioridad:** P0.

### HIGH

**H1 — Ausencia de idempotencia real (duplicados por doble propuesta/confirmación)**
- **Ubicación:** `pending-actions.service.ts:53-90` (propuesta) y `:92-174` (confirmación).
- **Evidencia:** token+estado evitan doble ejecución de *la misma* acción, pero no hay `idempotencyKey` ni unicidad; dos propuestas iguales generan dos registros.
- **Impacto:** movimientos/inversiones/deudas duplicadas.
- **Solución:** idempotency key derivada de `(tool,args)` por plan/turno, o unique parcial.
- **Prioridad:** P1.

**H2 — `REFERENCE_PENDING` sobrecargado genera tarjetas zombi**
- **Ubicación:** `reference-resolver.service.ts:127-132`; `assistant.service.ts:441-465`.
- **Evidencia:** "no existe" y "todavía no existe" comparten código.
- **Impacto:** typos/tipo de categoría equivocado crean acciones `pending` que nunca resuelven.
- **Solución:** distinguir `REFERENCE_NOT_FOUND` (error) de `REFERENCE_PENDING` (dependencia), o resolver dependencias por entidad referenciada en el mismo plan.
- **Prioridad:** P1.

**H3 — Deadlock de pasos dependientes ante fallo**
- **Ubicación:** `client/.../use-assistant-conversation.ts:296-311`; `assistant-action-card/index.tsx:122`.
- **Evidencia:** un `failed` bloquea a los posteriores y no ofrece Cancelar.
- **Impacto:** workflows multi-acción quedan trabados.
- **Solución:** permitir cancelar `failed`, o desbloquear cuando el paso previo esté `executed|cancelled|failed` con decisión explícita.
- **Prioridad:** P1.

**H4 — Fallback dev sin sesión en el stream**
- **Ubicación:** `assistant.controller.ts:33`; `assistant.service.ts:116-138`.
- **Evidencia:** `@Public()` + `NODE_ENV !== production` → usuario demo.
- **Impacto:** superficie de escritura propuesta sin autenticación en staging.
- **Solución:** exigir sesión para `POST /assistant/messages` cuando se habilitan tools de escritura, o gatear el fallback por bandera explícita de dev.
- **Prioridad:** P1.

**H5 — Falta de tools de reportes/dashboard**
- **Ubicación:** no existen tools sobre `DashboardService`/`ReportsService`.
- **Impacto:** el agente no cubre la analítica que sí ve el usuario; responde con top-5 del resumen.
- **Solución:** `getDashboard`, `getReportSummary`, `getExpensesByCategory`.
- **Prioridad:** P1.

### MEDIUM

**M1 — `createAccount` sin default de moneda** (`account.tools.ts:61-102`) — inconsistente con el resto; falla ante pedidos incompletos. Solución: usar `user.baseCurrency`.
**M2 — Falta fecha "hoy" en el contexto** (`assistant-context.service.ts:163-183`) — errores de validación para "hoy". Solución: incluir `today` en el resumen.
**M3 — `addToPosition` sin endpoint REST/UI** (`positions.service.ts:81`; `positions.controller.ts`) — asimetría agente>usuario. Solución: exponer endpoint o aceptar la excepción documentada.
**M4 — `addToPosition` referencia `listQuotes` inexistente** (`position.tools.ts:72`). Solución: crear la tool o corregir el texto.
**M5 — `updateTransaction` parcial** (no edita `type/account/transfer/currency`). Solución: ampliar schema.
**M6 — `updateGoal` aporte absoluto** (riesgo de sobrescritura). Solución: `contributeToGoal` aditivo.
**M7 — `parseArgs` de escritura traga JSON inválido** (`assistant.service.ts:502-511`). Solución: usar `parseToolArgs`.
**M8 — Errores no-`ApiException` enmascarados como validación sin log** (`assistant.service.ts:470-474`). Solución: log + `INTERNAL_ERROR`.
**M9 — Propuestas creadas durante el stream pero emitidas al final** (`assistant.service.ts:318-320`): si falla el stream, quedan huérfanas. Solución: emitir la propuesta en el momento de crearla o limpiar en error.
**M10 — `expired` no se persiste; no hay job de limpieza** (`pending-actions.service.ts:124-133`).
**M11 — Prompt injection vía tool output sin envoltorio** (`assistant.service.ts:307-311`).
**M12 — Preview de acciones diferidas con claves crudas** (`assistant.service.ts:478-500`).
**M13 — Presupuesto/ valuación sin restricciones de dominio** (categoría de gasto; `source=market`).
**M14 — `action_error` no expone `fieldErrors` al cliente** (`AssistantActionErrorData` en `assistant.service.ts:48-53`), perdiendo detalle útil.
**M15 — `confirmAction`/`cancelAction` del cliente no respetan `USE_MOCKS`** (`endpoints.ts:260-273`).

### LOW

**L1 — `ACTION_CONFIRMATION_REQUIRED` es código muerto** (`error-codes.ts:10`).
**L2 — `AiConversation.messages`/`assistant_actions` sin migración; dependen de `synchronize: true`** (`database.module.ts`), riesgo de producción.
**L3 — Ejecución secuencial de tool calls** (`assistant.service.ts:299`).
**L4 — `entity` de valuación semi-falso** (`asset.tools.ts:270`).
**L5 — Duplicación de validaciones y de `assertChanges`** en los dominios de tools.
**L6 — Token de acción persistido en `localStorage`**.
**L7 — Sin agrupación/categorización de las 41 tools** para el prompt.
**L8 — `assistant_actions` no guarda `result` de lectura ni las lecturas para auditoría** (el diseño lo dejaba abierto).
**L9 — Sin tests de las tools ni de PendingActions** (§15).

---

## 20. Recommended Architecture

```
AssistantController (SSE + confirm/cancel, JWT obligatorio para escrituras)
  └─ AssistantService (turno, streaming, contexto, memoria)
       ├─ AssistantContextService (resumen vía servicios/orquestadores, no repos)
       ├─ AiService (tool calling)
       ├─ ToolRegistry (catálogo tipado + permisos; agrupa por dominio)
       │    └─ Tools (adaptadores finos → primary services / orquestadores)
       │         · ReferenceResolver (id|nombre, scoped, con desambiguación rica)
       │         · PreviewBuilder (labels en español, impacto, valores resueltos)
       └─ ActionPlanService
            · persiste plan + pasos (planId, step, dependencyOf, idempotencyKey)
            · valida orden de pasos en confirm  ← hoy ausente
            · ejecuta con transacción/compensación cuando el caso de uso lo requiera
            · marca expired y limpia TTL
            · audita propuesta + ejecución + resultado
```

Principios a sostener:
1. **Cero lógica de dominio en `assistant/`** (ya se cumple).
2. **Una tool ↔ un caso de uso**, con precondiciones y "no usar cuando".
3. **Enforcement server-side** de permisos, orden y destructivas (no confiar en la UI).
4. **Idempotencia explícita** en mutaciones.
5. **Atomicidad** en casos compuestos (`createAsset`, `copyPreviousBudgets` bulk).
6. **Contexto analítico** mediante tools de dashboard/reportes en lugar de resúmenes incompletos.

---

## 21. Implementation Roadmap

| Orden | Ítem | Findings | Impacto |
|---|---|---|---|
| 1 | Enforcar orden de plan en `confirm` (paso previo `executed|cancelled`) | C1 | P0 |
| 2 | Transacción en `createAsset` (y auditoría de compuestos) | C2 | P0 |
| 3 | Idempotency key en `propose`/`confirm` | H1 | P1 |
| 4 | Separar `REFERENCE_NOT_FOUND` de `REFERENCE_PENDING` | H2 | P1 |
| 5 | Permitir cancelar/desbloquear `failed` en la UI | H3 | P1 |
| 6 | Gatear fallback dev del stream | H4 | P1 |
| 7 | Tools de dashboard/reportes | H5 | P1 |
| 8 | Defaults de moneda/fecha (`createAccount`, `today` en contexto) | M1/M2 | P2 |
| 9 | Ampliar `updateTransaction`; `contributeToGoal`; `listQuotes` | M4/M5/M6 | P2 |
| 10 | Endurecer errores/observabilidad (`parseArgs`, log de no-ApiException) | M7/M8 | P2 |
| 11 | Tests: `PendingActionsService`, handlers por dominio, e2e de seguridad y orden | §15 | Continuo |
| 12 | Migrar tablas del asistente a migración explícita; `synchronize:false` | L2 | P2 |

---

## 22. Final Score

| Dimensión | Score | Razón |
|---|---:|---|
| Functional Coverage | **85** | Cobertura casi total del CRUD; faltan analítica (dashboard/reportes), edición completa de movimientos, cotizaciones |
| Tool Coverage | **88** | 41 tools ↔ endpoints, con `addToPosition` extra y `updateTransaction` parcial |
| Business Logic Coverage | **68** | Reutiliza servicios, pero no enforce orden, defaults, semántica de aportes y coherencia de tipos |
| Composition Capability | **70** | Multi-tool + dependencias diferidas funcionan, pero sin rollback, secuencial y con deadlock de pasos |
| Planning Capability | **70** | Plan emerge del LLM; IDs vía reads; sin planificador ni enforcement server-side |
| Safety | **80** | Excelente defensa en capas para destructivas; penaliza el fallback dev y la falta de confirmación "fuerte" |
| Validation | **74** | DTOs + resolución de referencias; gaps en moneda/fecha/tipo y `parseArgs` |
| Reliability | **56** | Token+lock+TTL, pero sin idempotencia, sin atomicidad y con propuestas huérfanas |
| Test Coverage | **38** | Infra cubierta; 0 tests de handlers, 0 de PendingActions, 0 e2e, 0 de cliente |

### Score global: **69 / 100 — Aceptable**

El sistema es una **base arquitectónica sólida y coherente** con el objetivo de "la IA como orquestadora de casos de uso". Logra que el agente pueda, con confirmación humana, ejecutar prácticamente todas las operaciones del usuario reutilizando el dominio. Pero **todavía no es una interfaz completa, segura y confiable** en el sentido estricto: la composición multi-acción carece de garantías transaccionales y de orden server-side, la idempotencia es parcial y la cobertura de tests no acompaña el tamaño del catálogo. Con los ítems P0/P1 del roadmap resueltos, el sistema puede alcanzar la franja **Buena (76-90)**.

### Respuesta directa a las preguntas de la consigna

- **¿Podría un usuario dejar la UI y operar solo con el agente?** Casi: puede ejecutar todos los CRUD con confirmación, pero **no** la analítica completa (dashboard/reportes) ni la edición total de movimientos. **Parcialmente sí.**
- **¿Puede ejecutar múltiples operaciones en una solicitud?** **Sí**, con propuestas por tool y `planId`.
- **¿Detecta dependencias y las ordena?** **Sí en la UI**, mediante acciones `pending` y re-resolución; **no hay enforcement server-side** y un fallo puede trabar el plan.
- **¿Usa el resultado de una operación como input de la siguiente?** **Sí para lecturas** (ids resueltos al vuelo); para escrituras la resolución ocurre al confirmar, no dentro del turno.
- **¿Se recupera de errores parciales?** **No de forma robusta**: no hay rollback/compensación ni idempotencia, y hay escrituras compuestas no atómicas.
- **¿Lo hace sin romper reglas de negocio ni ejecutar acciones peligrosas?** **Mayormente sí**: reutiliza validaciones de dominio y las destructivas están triplemente gateadas; persisten riesgos de duplicación, orden y el fallback dev.

---

## Anexo — Estado de remediación (aplicada en este cambio)

Se resolvieron los siguientes findings del informe (se excluyó, por decisión explícita, el fallback dev **H4**):

| Finding | Estado | Qué se hizo |
|---|---|---|
| **C1** orden de plan server-side | ✅ Resuelto | `PendingActionsService.assertPlanOrder` bloquea un paso si un paso anterior del mismo `planId` no está `executed`/`cancelled` (`pending-actions.service.ts`). |
| **C2** `createAsset` no atómico | ✅ Resuelto | `AssetsService.createAsset` envuelve asset + valuación en `dataSource.transaction()`. |
| **H1** idempotencia | ✅ Resuelto (dedupe por plan) | `AssistantService` deduplica propuestas idénticas por `tool + argumentos` dentro del mismo plan; la doble confirmación ya la bloqueaba token+estado+lock. |
| **H2** referencias zombi | ✅ Resuelto | `createdEntityName` en las tools de creación + `canDefer`; una referencia inexistente que no fue creada en el plan emite `action_error NOT_FOUND` en vez de una tarjeta pendiente irresoluble. |
| **H3** deadlock por paso fallido | ✅ Resuelto | `isActionLocked` ya no bloquea por pasos `failed`; la tarjeta fallida ofrece **Reintentar** y **Cancelar**. |
| **H5** analítica ausente | ✅ Resuelto | Nuevas tools read `getDashboard`, `getReportSummary`, `getReportByCategory` y `listQuotes` (`insight.tools.ts`). |
| **M1** moneda por defecto | ✅ Resuelto | `createAccount` default `user.baseCurrency` (moneda ya no requerida en el schema). |
| **M2** fecha "hoy" | ✅ Resuelto | El resumen incluye `Fecha de hoy`. |
| **M3** `addToPosition` sin REST | ✅ Resuelto | `POST /positions/:id/add` (`positions.controller.ts`). |
| **M4** `listQuotes` fantasma | ✅ Resuelto | `listQuotes` existe como tool real. |
| **M5** `updateTransaction` parcial | ✅ Resuelto | Acepta `type`, `account`, `currency` además de monto/fecha/descripción/notas/categoría. |
| **M6** aporte a meta aditivo | ✅ Resuelto | `GoalsService.contributeToGoal` + tool `contributeToGoal`. |
| **M7/M8/M12/M14** runtime | ✅ Resuelto | `parseToolArgs` en escrituras (sin tragar JSON inválido), log + `INTERNAL_ERROR` para fallos inesperados, labels humanos en previews diferidas, `fieldErrors` propagados. |
| **M9/M10** propuestas/expiración | ✅ Resuelto | Las propuestas se emiten apenas se crean (por paso, no al final); al vencer el TTL la acción se persiste como `expired`. |
| **M11** tool output no confiable | ✅ Resuelto | Los resultados se envuelven como `tool_result` con nota de contenido no confiable. |
| **M13** reglas de dominio | ✅ Resuelto | Presupuestos sólo sobre categorías de gasto; valuaciones del asistente sólo `manual`. |
| **M15** mocks de acciones | ✅ Resuelto | `mockApi.confirmAction/cancelAction` y `endpoints.ts` respeta `USE_MOCKS`. |
| **L1** código muerto | ✅ Resuelto | Se eliminó `ACTION_CONFIRMATION_REQUIRED`. |
| **L2** esquema por synchronize | 🔧 Decisión del proyecto | Se mantiene `synchronize: true` (sin migración), según lo indicado. |
| **L3** lecturas en serie | ✅ Resuelto | Las lecturas de un mismo paso se ejecutan con `Promise.all`. |
| **L4** entity de valuación | ✅ Resuelto | Devuelve el id real de la valuación. |
| **L5** duplicación de validación | ✅ Resuelto | Helper `validateChanges` compartido en `tool-input.ts`. |
| **L6** token en `localStorage` | ✅ Resuelto | `AssistantChatProvider` persiste los hilos **sin** el token de confirmación; al rehidratar, las acciones que seguían pendientes quedan como fallidas e invitan a pedirlas de nuevo. |
| **L7** agrupación de tools | ✅ Resuelto | `ToolRegistry` etiqueta cada tool con su dominio y expone `catalog(user)`; el catálogo agrupado se inyecta en el system prompt como índice. |
| **L8** auditoría de lecturas | ✅ Resuelto | `PendingActionsService.recordRead` registra las lecturas ejecutadas en `assistant_actions` (best-effort); `preview`/`token_hash` pasan a nullable. |
| **L9** tests | ✅ Mejorado | Specs de `PendingActionsService` (orden, TTL, token, destructivas, dependencias, auditoría de lecturas), de `AccountTools` (moneda por defecto) y `AssistantService` (dedupe, referencia diferida vs. error); catálogo en `ToolRegistry`. Total: 8 suites / 54 tests. |
| **H4** fallback dev | ⛔ Fuera de alcance por pedido | Sin cambios. |

Con C1, C2, H1, H2, H3 y H5 resueltos, los ejes de **Composition, Planning, Reliability y Safety** suben; la cobertura de tests sigue siendo el principal pendiente para monitorear regresiones.
