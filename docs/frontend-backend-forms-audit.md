# Auditoría de formularios Frontend ↔ Backend

Fecha: 2026-09-12
Alcance: todos los formularios, inputs y flujos de envío del cliente (`client/`) y su contrato real con la API (`api/`).
Fuentes de verdad: `docs/backend.md` §7, `docs/frontend.md`, DTOs (`class-validator`) y schemas Zod.

> Nota de alcance: por decisión explícita del usuario **no se incorporó un runner de tests en el cliente** (Vitest no está instalado y `npm run test` no existe todavía). La API conserva Jest y sus 17 tests pasan. La verificación ejecutada para este cambio fue: `typecheck`, `lint`, `format:check` y `build` en ambos proyectos, más `test` en `api/`.

---

## 1. Inventario de formularios

Todas las entradas se validan con **React Hook Form + Zod** (`lib/validation/*`), salvo el input del asistente (estado local). Convenciones del contrato: JSON `camelCase`, fechas `YYYY-MM-DD`, decimales `number`.

| # | Formulario | Ubicación | Propósito | Endpoint | Método |
|---|------------|-----------|-----------|----------|--------|
| 1 | `LoginForm` | `components/features/auth/login-form` | Iniciar sesión | `/auth/login` | POST |
| 2 | `RegisterForm` | `components/features/auth/register-form` | Crear cuenta | `/auth/register` | POST |
| 3 | `ForgotPasswordForm` | `components/features/auth/forgot-password-form` | Solicitar reset | `/auth/forgot-password` | POST |
| 4 | `ResetPasswordForm` | `components/features/auth/reset-password-form` | Cambiar contraseña con token | `/auth/reset-password` | POST |
| 5 | `SettingsForm` | `components/features/settings/settings-form` | Perfil + IA (desktop) | `/users/me` | PATCH |
| 6 | `SettingsMenu` | `components/features/settings/settings-menu` | Moneda/IA (mobile) | `/users/me` | PATCH |
| 7 | `ProfileMenu` (tema) | `components/features/profile/profile-menu` | Tema de UI | `/users/me` | PATCH |
| 8 | `AccountFormDialog` | `components/features/accounts/account-form-dialog` | Alta/edición/archivo de cuenta | `/accounts`, `/accounts/:id`, `/archive`, `/restore` | POST/PATCH |
| 9 | `TransactionFormDialog` | `components/features/transactions/transaction-form-dialog` | Alta/edición de movimiento | `/transactions`, `/transactions/:id` | POST/PATCH |
| 10 | `BudgetFormDialog` | `components/features/budgets/budget-form-dialog` | Alta/edición de presupuesto | `/budgets`, `/budgets/:id` | POST/PATCH |
| 11 | `CategoryFormDialog` | `components/features/categories/category-form-dialog` | Alta/edición/archivo de categoría | `/categories`, `/categories/:id`, `/archive` | POST/PATCH |
| 12 | `GoalFormDialog` | `components/features/goals/goal-form-dialog` | Alta/edición/archivo de meta | `/goals`, `/goals/:id`, `/archive`, `/restore` | POST/PATCH |
| 13 | `AssetFormDialog` | `components/features/assets/asset-form-dialog` | Alta/edición/archivo/valuación de activo | `/assets`, `/assets/:id`, `/archive`, `/valuations` | POST/PATCH |
| 14 | `ValuationSheet` | `components/features/assets/valuation-sheet` | Nueva valuación manual | `/assets/:id/valuations` | POST |
| 15 | `DebtFormDialog` | `components/features/assets/debt-form-dialog` | Alta/edición/archivo de deuda | `/debts`, `/debts/:id`, `/archive` | POST/PATCH |
| 16 | `PositionFormDialog` | `components/features/assets/position-form-dialog` | Alta/edición de posición | `/positions`, `/positions/:id` | POST/PATCH |
| 17 | `AssistantChat` (input) | `components/features/assistant/assistant-chat` | Pregunta al asistente (SSE) | `/assistant/messages` | POST (stream) |

Formularios reutilizables/inputs compartidos auditados: `FormShell`, `FormDialog`, `FormTextField`, `FormSelectField`, `FormCurrencyField`, `FormMoneyField`, `FormDateField`, `MoneyInput`, `DatePicker`, `AmountKeypad`. Todos construyen valores tipados y no hacen `fetch` directo.

No se detectaron formularios ocultos adicionales: el barrido incluyó `useForm(`, `onSubmit`, `handleSubmit`, `type="submit"`, `mutate`/`mutateAsync`, `post/patch/del`, `<form>` y modals/sheets. Las vistas de detalle (`account-detail-view`, `goal-detail-view`, `position-detail-view`, etc.) y `ConfirmActionDialog`/`ConfirmDialog` solo disparan acciones sin payload.

---

## 2. Matriz Frontend ↔ Backend

Leyenda de Estado: `OK` (contrato compatible) · `CORREGIDO` (mismatch resuelto en este cambio) · `FE estricto` (el frontend rechaza valores que el backend acepta, sin riesgo) · `PENDIENTE` (documentado, requiere decisión).

### 2.1 `LoginForm` → `POST /auth/login`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| email | `string` | `email` | `email: string` `@IsEmail()` | email | `IsEmail` | OK |
| password | `string` | `password` | `password: string` `@Length(1,72)` | req, 1–72 | `Length(1,72)` | CORREGIDO (se agregó máx 72) |

### 2.2 `RegisterForm` → `POST /auth/register`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name: string` `@Length(2,80)` | trim, 2–80 | `Length(2,80)` | OK |
| email | `string` | `email` | `email: string` `@IsEmail()` | email | `IsEmail` | OK |
| password | `string` | `password` | `password: string` `@Length(8,72)` + letra/número | 8–72, letra+número | `Length(8,72)` + `Matches` | OK |
| confirmPassword | `string` | **no se envía** | — | igual a password | — | OK (FE-only) |

### 2.3 `ForgotPasswordForm` → `POST /auth/forgot-password`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| email | `string` | `email` | `email: string` `@IsEmail()` | email | `IsEmail` | OK |

### 2.4 `ResetPasswordForm` → `POST /auth/reset-password`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| token | query `?token=` | `token` | `token: string` `@Length(1,2048)` | req (presencia) | `Length(1,2048)` | OK |
| password | `string` | `password` | `password: string` `@Length(8,72)` + letra/número | 8–72, letra+número | `Length(8,72)` + `Matches` | OK |
| confirmPassword | `string` | **no se envía** | — | igual a password | — | OK (FE-only) |

### 2.5 `SettingsForm` / `SettingsMenu` → `PATCH /users/me`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name?: string` `@Length(2,80)` | trim, 2–80 | `Length(2,80)` | OK |
| baseCurrency | `string` | `baseCurrency` | `baseCurrency?: string` `@Length(3,3)` + lista soportada | 3 letras | `Length(3,3)` + `supportedCurrencies` | CORREGIDO (schema 3 letras) |
| aiEnabled | `boolean` | `aiEnabled` | `aiEnabled?: boolean` `@IsBoolean()` | boolean | `IsBoolean` | OK |
| theme (`ProfileMenu`) | `"light"\|"dark"\|"system"` | `theme` | `theme?: Theme` `@IsIn` | enum | `IsIn(THEME_VALUES)` | OK |

### 2.6 `AccountFormDialog` → `/accounts`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name: string` `@Length(1,80)` | trim, 1–80 | `Length(1,80)` | OK |
| type | enum 5 | `type` | `type: AccountType` `@IsIn` | enum | `IsIn` | OK |
| currency | `string` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | CORREGIDO (y bloqueado en edición) |
| initialBalance | `number` | `initialBalance` | `initialBalance?: number` `@IsNumber()` | número | `IsNumber` | OK |
| notes | `string\|null` | `notes` (null si vacío) | `notes?: string \| null` `@MaxLength(500)` | ≤500 | `MaxLength(500)` | CORREGIDO (BE null-safe; antes `null.trim()` → 500) |
| archived (switch) | `boolean` | — | — | — | — | OK (usa `/archive` \| `/restore`) |

### 2.7 `TransactionFormDialog` → `/transactions`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| type | enum 3 | `type` | `type: TransactionType` `@IsIn` | enum | `IsIn` | OK |
| amount | `number` | `amount` | `amount: number` `@Min(0.0001)` | >0, ≤MAX_MONEY | `Min(0.0001)` | OK |
| currency | derivada de la cuenta | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` + **coincide con la cuenta** | CORREGIDO (antes usaba moneda base) |
| date | `string` | `date` | `date` `@Matches(YYYY-MM-DD)` + `@IsDateString` | `YYYY-MM-DD` | regex + `IsDateString` | OK |
| accountId | `string` | `accountId` | `accountId: string` `@IsUUID()` | UUID | `IsUUID` | CORREGIDO |
| categoryId | `string?` | `categoryId` (null en transfer) | `categoryId?: string \| null` `@IsUUID()` | UUID / obligatorio en ingreso/gasto | `IsUUID` opcional | OK |
| transferAccountId | `string?` | `transferAccountId` (null si no transfer) | `transferAccountId?: string \| null` `@IsUUID()` | UUID distinto + **misma moneda** | `IsUUID` + **misma moneda** | CORREGIDO |
| description | `string` | `description` | `description: string` `@Length(1,200)` | trim, 1–120 | `Length(1,200)` | FE estricto |
| notes | `string?` | `notes` (null si vacío) | `notes?: string \| null` `@MaxLength(500)` | ≤500 | `MaxLength(500)` | OK |

### 2.8 `BudgetFormDialog` → `/budgets`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| categoryId | `string` | `categoryId` | `categoryId: string` `@IsUUID()` | UUID | `IsUUID` | CORREGIDO |
| period | `YYYY-MM` (UI) | `YYYY-MM-DD` (`-01`) | `period` `@Matches(YYYY-MM\|YYYY-MM-DD)` | `YYYY-MM` | regex | OK |
| limit | `number` | `limit` | `limit: number` `@Min(0)` | ≥0 | `Min(0)` | CORREGIDO (antes >0; el backend admite 0, caso CAL probado) |
| currency | `string` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | CORREGIDO |
| recurring | `boolean` | `recurring` | `recurring?: boolean` `@IsBoolean()` | boolean | `IsBoolean` | OK |
| (update) | — | solo `limit, currency, recurring` | `UpdateBudgetDto` parcial | — | — | OK |

### 2.9 `CategoryFormDialog` → `/categories`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name: string` `@Length(1,60)` | trim, 1–60 | `Length(1,60)` | OK |
| type | enum 2 | `type` | `type: CategoryType` `@IsIn` | enum | `IsIn` | OK |
| color | hex | `color` | `color: string` `@Matches(HEX)` | hex `#RGB`/`#RRGGBB` | `Matches(HEX_COLOR)` | CORREGIDO (antes `min(4)`) |
| icon | no se usa | **no se envía** | `icon?: string \| null` `@MaxLength(60)` | — | opcional | OK |

### 2.10 `GoalFormDialog` → `/goals`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name: string` `@Length(1,80)` | trim, 1–80 | `Length(1,80)` | OK |
| targetAmount | `number` | `targetAmount` | `targetAmount: number` `@Min(0)` | ≥0 | `Min(0)` | OK |
| savedAmount | `number` | `savedAmount` | `savedAmount?: number` `@Min(0)` | ≥0 | `Min(0)` | OK |
| currency | `string` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | CORREGIDO |
| targetDate | `string?` | `targetDate` (null si vacío) | `targetDate?: string \| null` `@Matches` | `YYYY-MM-DD`/vacío | regex | CORREGIDO (tipo nullable en BE) |
| sourceAccountId | `string?` | `sourceAccountId` (null si vacío) | `sourceAccountId?: string \| null` `@IsUUID` | UUID/vacío | `IsUUID` + ownership (orquestador) | CORREGIDO (tipo nullable en BE) |

### 2.11 `AssetFormDialog` → `/assets` (+ valuación)

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name: string` `@Length(1,80)` | trim, 1–80 | `Length(1,80)` | CORREGIDO (se agregó máx 80) |
| type | enum 6 | `type` | `type: AssetType` `@IsIn` | enum | `IsIn` | OK |
| currency | `string` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | CORREGIDO (bloqueado en edición) |
| initialValue | `number` | `initialValue` (solo alta) | `initialValue: number` `@Min(0)` | ≥0 | `Min(0)` | CORREGIDO (antes >0 bloqueaba la edición si el valor era 0) |
| newValue | `number?` | → `POST /valuations` | `value: number` `@Min(0)` | ≥0 | `Min(0)` | OK |
| date | `string` | `date` | `date` `@Matches(YYYY-MM-DD)` | `YYYY-MM-DD` | regex | OK |
| notes | `string?` | `notes` (null si vacío) | `notes?: string \| null` `@MaxLength(500)` | ≤500 | `MaxLength(500)` | OK |
| source (valuación) | `"manual"` | `source` | `source?: "manual"\|"market"` `@IsIn` | literal | `IsIn` | OK |

### 2.12 `ValuationSheet` → `POST /assets/:id/valuations`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| value | `number` | `value` | `value: number` `@Min(0)` | ≥0 | `Min(0)` | CORREGIDO (antes >0) |
| date | `string` | `date` | `date` `@Matches(YYYY-MM-DD)` | `YYYY-MM-DD` | regex | OK |
| currency | `asset.currency` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | OK |
| source | `"manual"` | `source` | `source?: ValuationSource` | literal | `IsIn` | OK |

### 2.13 `DebtFormDialog` → `/debts`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| name | `string` | `name` | `name: string` `@Length(1,80)` | trim, 1–80 | `Length(1,80)` | CORREGIDO (se agregó máx 80) |
| type | enum 4 | `type` | `type: DebtType` `@IsIn` | enum | `IsIn` | OK |
| balance | `number` | `balance` | `balance: number` `@Min(0)` | ≥0 | `Min(0)` | CORREGIDO (antes >0) |
| currency | `string` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | OK (default ahora = moneda base) |
| date | `string` | `date` | `date` `@Matches(YYYY-MM-DD)` | `YYYY-MM-DD` | regex | OK |
| assetId | `string?` | `assetId` (null si "sin vincular") | `assetId?: string \| null` `@IsUUID` | UUID/vacío | `IsUUID` + ownership | CORREGIDO (sentinel "none" → "") |

### 2.14 `PositionFormDialog` → `/positions`

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| symbol | `string` | `symbol` | `symbol: string` `@Length(1,20)` | trim, 1–20 | `Length(1,20)` | CORREGIDO (se agregó máx 20) |
| instrument | `string` | `instrument` | `instrument: string` `@Length(1,80)` | trim, 1–80 | `Length(1,80)` | CORREGIDO (se agregó máx 80) |
| quantity | `number` | `quantity` | `quantity: number` `@Min(0)` | ≥0 | `Min(0)` | CORREGIDO (antes >0) |
| avgCost | `number` | `avgCost` | `avgCost: number` `@Min(0)` | ≥0 | `Min(0)` | CORREGIDO (antes >0) |
| currency | `string` | `currency` | `currency: string` `@Length(3,3)` | 3 letras | `Length(3,3)` | CORREGIDO (bloqueado en edición) |

### 2.15 `AssistantChat` input → `POST /assistant/messages` (SSE)

| Campo | Frontend | Payload enviado | Backend espera | Validación FE | Validación BE | Estado |
|-------|----------|-----------------|----------------|---------------|---------------|--------|
| question | `string` | `question` (trim) | `question: string` `@Length(1,1000)` | trim, `maxLength=1000` | `Length(1,1000)` | CORREGIDO (faltaba máx) |
| conversationId | `string?` | `conversationId` (null si nueva) | `conversationId?: string \| null` `@IsUUID` | UUID del servidor | `IsUUID` opcional | OK |
| period | `{from,to}` | `period` | `period?: PeriodDto` `@ValidateNested` | rango del provider | `Matches(YYYY-MM-DD)` | OK |
| currency | `string?` | `currency` | `currency?: string` `@Length(3,3)` | moneda base | `Length(3,3)` | OK |
| audio | grabación + dictado | **no se envía audio** | no existe `/assistant/audio` | — | — | CORREGIDO (se eliminó cliente muerto) |

---

## 3. Problemas encontrados

### CRITICAL

- **C1 — La moneda del movimiento no se derivaba de la cuenta.** `TransactionFormDialog` usaba `user.baseCurrency` y no permitía elegir moneda. Con cuentas en otra moneda, el backend acreditaba/debitaba el saldo de la cuenta con la moneda base (los movimientos se suman “en moneda de la cuenta”, `docs/backend.md` §5.2). **Corrección:** la moneda ahora se deriva de la cuenta origen, se bloquean transferencias entre monedas distintas y el backend valida la invariante (`transactions.service.assertCurrencyMatches`) también en edición. Mock alineado.
- **C2 — `PATCH /accounts/:id` con `notes: null` producía 500.** `accounts.service.updateAccount` hacía `dto.notes.trim()` sin optional chaining, y el tipo del cliente permite `null` (y los ejemplos de `docs/backend.md` usan `notes: null`). **Corrección:** DTO `notes?: string | null` y `dto.notes?.trim() || null`.

### HIGH

- **H1 — Transferencias entre monedas distintas no se prevenían.** El backend persiste ambas patas con `dto.currency` y sin FX. **Corrección:** el destino solo lista cuentas de la misma moneda, se resetea si deja de ser válido, mensaje de ayuda y validación backend.
- **H2 — `budgetSchema.limit` y `debtSchema.balance` exigían `> 0`.** El backend admite `0` (`@Min(0)`), y `limit = 0` es un caso de borde explícitamente cubierto por CAL-004. **Corrección:** `≥ 0`.
- **H3 — Validación oculta en la edición de activos.** `assetSchema.initialValue` era `positive` y el campo no se renderiza al editar; si `currentValue` era `0`, el submit fallaba sin campo visible. **Corrección:** `≥ 0`.
- **H4 — Faltaban longitudes máximas en el FE** para `asset.name` (80), `debt.name` (80), `position.symbol` (20) e `instrument` (80); el backend devolvía 400. **Corrección:** agregadas.
- **H5 — IDs sin validación de formato y sentinelas inconsistentes.** Se agregó `uuid`/`optionalIdSchema`; se corrigió el default `"none"` de `assetId` en deuda.
- **H6 — El input del asistente no limitaba a 1000 caracteres** (contrato `@Length(1,1000)`). **Corrección:** `maxLength={1000}`.
- **H7 — Cliente muerto con contrato inválido.** `assistantEndpoints.send` hacía POST JSON a un endpoint SSE y `sendAudio` apuntaba a `/assistant/audio` (inexistente). Eran usados solo por hooks sin consumidores. **Corrección:** eliminados `send`, `sendAudio`, `useSendAssistantMessage`, `useSendAssistantAudio`, `AssistantAudioInput` y `mockApi.sendAudioMessage`.

### MEDIUM

- **M1 — `DebtFormDialog` hardcodeaba `"ARS"`** como moneda por defecto en vez de la moneda base. **Corrección:** `user.baseCurrency`.
- **M2 — Moneda editable en registros con hijos.** Cuenta (movimientos), activo (valuaciones) y posición (matching de cotización por `symbol+currency`) permitían cambiar la moneda dejando los datos hijos en la moneda anterior. **Corrección FE:** moneda bloqueada al editar. El backend sigue permitiéndolo (documentado) para consumidores API.
- **M3 — `budgets.service` suma montos crudos sin convertir** a la moneda del presupuesto; con cuentas en distintas monedas el `spent` es incorrecto. **PENDIENTE:** requiere integrar `fx`/`calculations` y una decisión de producto; no se modificó por riesgo sin tests.
- **M4 — `currency` FE usaba `min(3)`** permitiendo >3 letras. **Corrección:** regex de 3 letras.
- **M5 — Reglas duplicadas** (moneda, monto, fecha, notas). **Corrección:** nuevos primitivos reutilizables en `lib/validation/common.ts`.
- **M6 — Login sin máximo de contraseña** (BE `Length(1,72)`). **Corrección:** máx 72.
- **M7 — `UpdateAccountInput`** (`Partial<Omit<...>> & { initialBalance?: number }`) es redundante; sin impacto funcional. **PENDIENTE** (menor).

### LOW

- **L1 — Color de categoría** validaba `min(4)` en vez de hex. **Corrección:** regex hex igual al backend.
- **L2 — `assets.service` elige la última valuación por fecha** sin desempate por `createdAt`, ambiguo ante misma fecha. **PENDIENTE.**
- **L3 — `UpdateTransactionDto.type`** permite cambiar el tipo de un movimiento existente, pero el FE lo deshabilita al editar. Sin mismatch práctico.
- **L4 — Sin límite superior de monto en el FE** (columnas `numeric(18,4)`). **Corrección:** `MAX_MONEY` en el schema compartido.

---

## 4. Resumen ejecutivo

- **Formularios detectados:** 17. **Auditados:** 17 (100%). Sin sampling.
- **Formularios con problemas:** 14.
- **Mismatches FE↔BE corregidos:** 20+ (moneda de movimiento, `notes: null`, límites `>0` vs `≥0`, longitudes máximas, formato de color, UUIDs, sentinela `"none"`, máx de contraseña/pregunta, cliente SSE/audio muerto).
- **Validaciones faltantes agregadas:** longitudes máximas (activo, deuda, posición), UUIDs de IDs, formato ISO de moneda/fecha, `maxLength` de pregunta, `MAX_MONEY`.
- **Principales riesgos:** (1) corrupción de saldos por moneda incorrecta en movimientos — **resuelto en FE y BE**; (2) 500 por `notes: null` en cuentas — **resuelto**; (3) transferencias cross-currency — **bloqueadas**; (4) `spent` de presupuestos sin conversión de moneda — **pendiente**.
- **Refactors realizados:** primitivos de validación compartidos (`lib/validation/common.ts`), moneda derivada de la cuenta, bloqueo de moneda en edición, eliminación de cliente muerto del asistente, mock alineado con la invariante de moneda.
- **Librería de validación elegida:** **Zod** (ya presente) + React Hook Form + `@hookform/resolvers`. No se agregó ninguna dependencia: Zod ofrece tipado, composición, `refine`, integración nativa con RHF y mensajes en español, y su reutilización mediante primitivos evita duplicar reglas. Se descartó Formik/Yup/Valibot por costo de migración y bundle.
- **Backend como fuente de verdad:** la validación de moneda, tipos nullable y ownership se refuerzan en el servidor; el FE solo mejora UX y evita requests inválidos.

### Verificación ejecutada

| Proyecto | typecheck | lint | format:check | test | build |
|----------|:---------:|:----:|:------------:|:----:|:-----:|
| `client` | ✅ | ✅ | ✅ | N/A (sin runner) | ✅ (export estático) |
| `api` | ✅ | ✅ | ✅ | ✅ (17) | ✅ |

### Recomendaciones pendientes

1. **Configurar Vitest + RTL + MSW** en `client/` y agregar tests de schemas (submit válido, requeridos, rangos, monedas, transferencias) y de payloads por formulario. Hoy `npm run test` no existe.
2. **Resolver `M3`** (presupuestos multi-moneda) integrando conversión vía `fx`/`calculations` y cubrirlo con tests.
3. **Decidir si el backend debe rechazar cambios de moneda** en cuentas/activos/posiciones (hoy solo el FE lo bloquea).
4. **Unificar tipos de request/response** generados desde DTOs/OpenAPI para eliminar el drift manual entre `lib/api/types.ts` y los DTOs.
5. **Desempate determinista** en valuaciones (`date`, `createdAt`) para `currentValue`.
