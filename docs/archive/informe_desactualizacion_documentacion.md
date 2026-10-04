# Informe de desactualización de la documentación — Atlass Fin

> **Fecha:** 2026-10-02
> **Alcance:** `docs/backend.md`, `docs/frontend.md`, `docs/FRD_Gestor_Financiero_v0.1.docx.md` contrastados con el código real de `api/src` y `client/`.
> **Método:** auditoría de solo lectura cruzando el texto de cada documento con controllers, services, entities, migraciones, DTOs, tools del asistente, rutas y componentes reales. No se ejecutó la aplicación; el estado se infirió de código y tests.
> **Objetivo:** servir de checklist para actualizar la documentación. Cada hallazgo dice *"el doc dice X → el código hace Y"* con evidencia `archivo:línea`.

---

## 1. Resumen ejecutivo

Los tres documentos **siguen describiendo bien el alcance funcional**, pero arrastran desfases en cinco frentes:

1. **Estructura de archivos desactualizada** (backend §4 y frontend §5): carpetas que ya no existen, carpetas nuevas sin documentar y una capa `shared/` que `backend.md` ignora por completo.
2. **Contrato y modelo de datos con detalles viejos** (backend §5, §7.13–§7.16): columnas reales que no figuran, `synchronize: true` global sin declarar, campos de respuesta ausentes en los ejemplos.
3. **Estado de implementación sobreestimado o desactualizado** (backend §1, §9.3, §14): el correo no envía mails, el rate limiting no es por endpoint, la Tanda 3 figura como pendiente cuando ya está hecha.
4. **Frontend con "componentes fantasma" y rutas/tipos faltantes** (frontend §3, §5, §7): `currency-selector`, `period-currency-filters`, `DataTable`, tipos `ReportSummary`/`ReportByCategory`/`NetWorthPoint`/`BudgetReportRow` y secciones inexistentes (`§4.2.1`), más páginas reales fuera del árbol.
5. **El FRD cita IDs que no define** y hay brechas P1/P2 acotadas: los docs referencian `FR-PRE-007` y `FR-PRE-008`, que **no existen** en el FRD (solo llega hasta `FR-PRE-006`); y varias funciones están implementadas solo a medias (CSV export, copiar presupuestos, filtros de movimientos, historial IA servidor, selector de moneda).

Además existe **funcionalidad implementada por encima del alcance del FRD** que ningún documento lista (renovación de presupuestos, aportes a posiciones/metas, restauración de entidades, acciones IA con confirmación por token y TTL, audio, Capacitor, modo mock, widgets personalizables, FX con pivote ARS, etc.).

> **Clave para interpretar este informe:** el proyecto sigue **WIP**. La sección [§6](#6-clasificación-wip-vs-decisión-consciente) separa qué diferencias son **trabajo en curso** (el doc describe el objetivo y hay que marcarlo como pendiente) de qué son **decisiones de diseño conscientes** (el código es la verdad y hay que reescribir la doc), más los **desfases puros** y las **zonas a confirmar**.

---

## 2. `docs/backend.md`

### 2.1 Estructura de archivos (§4)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| Existe `common/decorators/ownership.decorator.ts` y `common/guards/ownership.guard.ts` | **No existen**. No hay decorador ni guard de ownership; la propiedad se resuelve con `userId` dentro de cada service | `api/src/common/` (no hay archivos ownership) |
| `common/types/` está vacío | Contiene `auth-user.ts` y `financial-enums.ts` | `api/src/common/types/` |
| No menciona `common/errors/` | Existe con `api.exception.ts` y `error-codes.ts` | `api/src/common/errors/` |
| No menciona `common/pipes/` | Existe `validation-exception.factory.ts` | `api/src/common/pipes/` |
| No menciona `common/transformers/` | Existe `numeric.transformer.ts` | `api/src/common/transformers/` |
| No menciona `optional-jwt-auth.guard.ts` | Existe y se usa en el stream del asistente | `api/src/common/guards/optional-jwt-auth.guard.ts` |
| Capa compartida en `src/`: `calculations/`, `market/`, `ai/`, `mail/` | Viven en **`src/shared/`**: `shared/calculations/`, `shared/market/`, `shared/ai/`, `shared/mail/`. `fx/` sí está en la raíz | `api/src/shared/**`, `api/src/fx/` |
| No menciona el módulo `reference/` | Existe `reference/reference.module.ts` + `reference.controller.ts` (`GET /currencies`) | `api/src/reference/` |
| No menciona `health/` en el árbol | Existe `health/health.module.ts` + `health.controller.ts` | `api/src/health/` |
| No menciona `database/database.module.ts` ni `database/seeds/` | Existen `database.module.ts`, `seeds/seed.ts`, `seeds/run-seed.ts` | `api/src/database/` |
| El árbol lista solo algunos DTOs de auth | Existen además `refresh-token.dto.ts` y `auth-response.dto.ts` | `api/src/auth/dto/` |
| No menciona `goals.orchestrator.ts` en el árbol (sí en §7.8) | Existe | `api/src/goals/goals.orchestrator.ts` |
| Clase `MarketSchedulerService` | Se llama `MarketScheduler` | `api/src/shared/market/market-scheduler.service.ts:15` |

### 2.2 Modelo de datos y migraciones (§5)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| `synchronize: true` solo para `ai_conversations` y `assistant_actions` | Está activo **globalmente** en la conexión TypeORM | `api/src/database/database.module.ts:22`, `api/src/database/data-source.ts:16` |
| Tanda 0: migración inicial con "usuarios, sesiones, cuentas, categorías, movimientos, cotizaciones, exchange_rates" | `InitialSchema` crea además `budgets`, `assets`, `valuations`, `debts`, `positions`, `goals`, `ai_conversations` | `api/src/database/migrations/1757600000000-InitialSchema.ts:118-287` |
| `users.assistant_destructive_enabled` documentado en §5.1 | Existe en la entidad, pero **no** en `InitialSchema` (solo lo crea `synchronize`) | `api/src/users/entities/user.entity.ts:33-38` |
| `goals.source_account_id` / `goals.archived` documentados | Existen en la entidad, pero **no** en la migración | `api/src/goals/entities/goal.entity.ts:48-53` |
| `ai_conversations.messages` documentado | Existe en la entidad, pero **no** en la migración | `api/src/assistant/entities/ai-conversation.entity.ts:32-33` |
| Tabla `assistant_actions` documentada | Existe la entidad, pero **no hay migración** que la cree | `api/src/assistant/entities/assistant-action.entity.ts:14` |
| `assistant_actions.preview` jsonb (implícito NOT NULL) | Es `nullable: true` | `api/src/assistant/entities/assistant-action.entity.ts:43` |
| `quotes.change_24h numeric NULL` | `numeric(18,8)`, nullable | `api/src/quotes/entities/quote.entity.ts:27-35` |
| `users.base_currency` default `'USD'` | La columna tiene default `'USD'`, pero **el registro hardcodea `"ARS"`**; el seed también usa ARS y `configuration.defaultCurrency` es `ARS` | `api/src/auth/auth.service.ts:60`, `api/src/database/seeds/seed.ts:119`, `api/src/config/configuration.ts:166` |
| `sessions.refresh_token_hash` = "hash del refresh token" | Es hash **argon2 de un secreto aleatorio**, no del token completo; el token público es `${sessionId}.${secret}` | `api/src/auth/auth.service.ts:114,138,214,238-244` |
| §6.1: registro "crea categorías por defecto si aplica" | **No se implementa**: `register` solo guarda el usuario; las categorías de sistema las crea el seed | `api/src/auth/auth.service.ts:43-67`, `api/src/database/seeds/seed.ts:32-70` |

### 2.3 Endpoints (§7)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| §7.6 no lista `GET /assets/:id` | **Existe** y no figura en la tabla | `api/src/assets/assets.controller.ts:43-51` |
| §7.15: ejemplo de `DashboardData` sin `cashflow` | La respuesta real incluye `cashflow` | `api/src/dashboard/dto/dashboard-response.dto.ts:72-76`, `api/src/dashboard/dashboard.service.ts:436-444` |
| §7.15: `netWorthComposition` con kinds `property\|vehicle\|investment\|account` | Incluye además el kind `"asset"` ("Otros activos") y filtra valores 0 | `api/src/dashboard/dto/dashboard-response.dto.ts:3-4`, `api/src/dashboard/dashboard.service.ts:358-376` |
| §7.15: `User` sin `assistantDestructiveEnabled` | El DTO real **sí** lo incluye | `api/src/users/dto/user-response.dto.ts:11,22` |
| §7.16: ejemplo de `action_proposal` sin `planId`/`step`/`pending` | La propuesta real los incluye | `api/src/assistant/tools/tool.types.ts:79-81`, `api/src/assistant/actions/pending-actions.service.ts:87-89` |
| §7.17: catálogo de errores | Falta `REFERENCE_PENDING` (existe y puede llegar como `action_error`) | `api/src/common/errors/error-codes.ts:12`, `api/src/assistant/tools/reference-resolver.service.ts:145` |
| Catálogo de tools §7.16 (nomenclatura por primitivas) | Correcto, pero **`updatePreferences`** (`sensitive`) no se nombra; y las sensibilidades reales agrupan `archive*`/`restore*`/transferencias/prefs como `sensitive`, no `write_safe` | `api/src/assistant/tools/domains/profile.tools.ts:38-73`, `api/src/assistant/tools/tool-registry.service.ts` |
| No documenta límite de iteraciones de tool-calling | Existe `MAX_TOOL_STEPS = 5` | `api/src/assistant/assistant.service.ts:79` |

> El resto de endpoints por controller **coincide** con las tablas del doc (auth, users, accounts, categories, transactions, budgets, debts, positions, quotes, goals, dashboard, reports, assistant, currencies, health, market).

### 2.4 Cálculos (§8)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| Encabezado §8: CAL-001..009 "centralizadas en `calculations.service.ts`" | CAL-008/CAL-009 viven en `fx.service.ts`, no en `calculations.service.ts` (el propio §9.2 reconoce que calculations cubre CAL-001..004) | `api/src/fx/fx.service.ts:57-115` |
| No documenta helpers internos | Existen `calculateCashBalance`, `pctDelta`, `monthRange`, `previousRange`, `monthEnd` | `api/src/shared/calculations/calculations.service.ts:135-231` |

Las fórmulas CAL-001..007 coinciden con lo descripto y están cubiertas por `calculations.service.spec.ts`.

### 2.5 Integraciones externas (§9)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| Binance `GET /ticker/24hr?symbols=[...]` (una llamada) | **Una request por símbolo** en `Promise.all` | `api/src/shared/market/providers/crypto-quote.provider.ts:33-42,61-67` |
| — | `USDT` se devuelve hardcodeado a precio 1 sin llamar a Binance | `api/src/shared/market/providers/crypto-quote.provider.ts:51-59` |
| — | El proveedor FX se etiqueta `"fawaz"` y usa pivote ARS con `rate = 1/perPivot` | `api/src/shared/market/providers/fx-rate.provider.ts:21-24,40-50` |
| §9/§10: connections con "validación de host y redirecciones deshabilitadas" | Los providers de mercado solo aplican `timeout`; **no** hay allowlist de hosts ni `maxRedirects: 0`. El único con `maxRedirects: 0` es AI | `api/src/shared/ai/ai.service.ts:105` |
| §9.2: `ai.service.ts` expone `streamChat(messages)` como `AsyncGenerator<string>` | Firma `streamChat(messages, options)` que devuelve `AsyncGenerator<AiStreamChunk>` (`{type:"token"}` / `{type:"tool_calls"}`) y soporta `tools`/`tool_choice:"auto"`; envía `temperature: 0.3` | `api/src/shared/ai/ai.service.ts:37-39,67-70,87-92` |
| §9.2 estado: "los dominios ya exponen sus servicios" pero el contexto "sigue leyendo repositorios" | Sigue igual: `AssistantContextService` inyecta repositorios directamente | `api/src/assistant/assistant-context.service.ts:31-51` |
| §9.3 / §1: correo "Proveedor SMTP" que envía el enlace | `MailService` **no envía nada**: loguea el link en dev y resuelve; no hay `nodemailer` ni uso real de `SMTP_*`/`MAIL_FROM` | `api/src/shared/mail/mail.service.ts:11-20` |

### 2.6 Seguridad y rate limiting (§10)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| §3: existe `OwnershipGuard` | No existe; solo `JwtAuthGuard` global y `OptionalJwtAuthGuard` puntual | `api/src/app.module.ts:60`, `api/src/assistant/assistant.controller.ts:34` |
| §10/NFR-SEG-010: throttler "en login, recuperación, cotizaciones e IA" | Hay un `ThrottlerGuard` **global** con `ttl 60s / limit 100`; **no** hay `@Throttle`/`@SkipThrottle` por ruta | `api/src/app.module.ts:37,61` |

### 2.7 Variables de entorno (§12)

- **Falta documentar `DEFAULT_CURRENCY`** (default `"ARS"`), que alimenta `GET /currencies.default` → `api/src/config/configuration.ts:166`, `api/src/reference/reference.controller.ts:20-23`.
- El doc repite `QUOTE_STALE_MS=3600000` dos veces (líneas 1018 y 1048); en `.env.example` está una sola vez.
- `validateEnv` exige obligatoriamente `DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`; no está indicado en §12 → `api/src/config/env.validation.ts:5-9,31-37`.
- `AI_API_KEY` no se valida; su ausencia produce `AI_UNAVAILABLE` en runtime.
- El resto del bloque coincide con `api/.env.example`.

### 2.8 Seed (§11) y plan de tandas (§14)

- §11 dice "Cinco categorías": el seed crea **5 categorías de usuario + 9 de sistema** → `api/src/database/seeds/seed.ts:32-42,153-191`. El resto del seed coincide (3 cuentas/2 monedas, 3 meses, 4 presupuestos, propiedad+vehículo+deuda+valuaciones, 2 posiciones, 2 metas, conversaciones IA, idempotente).
- No documenta que el seed deja al demo con `aiEnabled: true` → `seed.ts:121`.
- No documenta que `FxService` siembra tasas por defecto al iniciar con `provider: "default"` → `api/src/fx/fx.service.ts:25-54`.
- §14 Tanda 3: "la API debe implementarlos" (campos del dashboard) → **ya están implementados**; la frase quedó desactualizada → `api/src/dashboard/dto/dashboard-response.dto.ts`.

---

## 3. `docs/frontend.md`

### 3.1 Mapa del sitio (§3) y árbol de archivos (§5)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| Árbol del sitio sin `/profile` | Existe `/profile` (sí se menciona en la prosa) | `client/app/(app)/profile/page.tsx` |
| Ítem móvil `Asistente` "abre el chat, no navega" | Es un `<Link href="/assistant">` que **navega** | `client/components/layout/app-nav.ts:22-24`, `client/components/layout/mobile-tab-bar/index.tsx:19-27` |
| Sidebar desktop con "secciones y accesos de perfil/configuración" | El sidebar lista solo `dashboard, transactions, budgets, reports, settings`; Perfil/Ajustes están en el `UserMenu` | `client/components/layout/app-nav.ts:18-20`, `client/components/layout/header/user-menu.tsx:40-49` |
| §12 NFR-UA-001: barra inferior "con pestaña de **Ajustes**" | La pestaña es **`Perfil`** | `client/lib/sections.ts:23-24` |
| Árbol §5 sin `goals/detail` ni las 3 páginas de `patrimony/*/detail` | Existen | `client/app/(app)/goals/detail/page.tsx`, `client/app/(app)/patrimony/{assets,investments,debts}/detail/page.tsx` |
| Árbol §5 sin `layout/section-icons.ts` | Existe | `client/components/layout/section-icons.ts:14` |
| `components/common/` lista `currency-selector` y `period-currency-filters` | **No existen** | `client/components/common/` |
| `lib/` sin `budget.ts`, `categories.ts`, `chart-scale.ts`, `colors.ts`, `patrimony.ts` | Existen y no se documentan | `client/lib/` |
| Tanda 1 nombra `lib/api/reference.ts` | **No existe**: los endpoints de reference viven en `lib/api/endpoints.ts` y el hook en `lib/query/reference.ts` | `client/lib/api/endpoints.ts:85-90`, `client/lib/query/reference.ts:5` |
| `.env.example` "(no versionar)" | **Está versionado** | `git ls-files client` incluye `client/.env.example` |
| `header.tsx` "(moneda, tema, usuario)" | Solo tema + usuario | `client/components/layout/header/index.tsx:8-11` |
| `components.json` preset "radix-maia, green, radius large" | Real: `style: "radix-maia"`, `baseColor: "neutral"`, sin radius | `client/components.json:3,9` |

### 3.2 Funcionalidades por página (§4)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| §4.1 login hace `router.push("/dashboard")` + `router.refresh()` | Usa `router.replace("/dashboard")`, sin `refresh()` | `client/components/features/auth/login-form/index.tsx:34` |
| §4.3 `AccountTypePicker` incluye "**Objetivo**" y `AccountFormDialog` tiene campos de objetivo | Solo 5 tipos; el formulario **no** tiene campos de meta | `client/components/features/accounts/account-type-picker/index.tsx:29`, `account-form-dialog/index.tsx:183-213` |
| §4.3.1 el detalle de cuenta muestra una rama "Cuenta objetivo" | No existe esa rama; las metas viven en `/goals/detail` | `client/components/features/accounts/account-detail-view/index.tsx:86-187` |
| §4.4 botón "+ Nuevo movimiento" con texto en desktop | Es un botón **solo icono** | `client/components/features/transactions/transactions-view/index.tsx:73-81` |
| §4.5 botón "Copiar del mes anterior" | `useCopyPreviousBudgets` existe pero **ningún componente lo usa**: no hay botón | `client/lib/query/budgets.ts:48` (sin usos) |
| §4.2: "Los formularios **y el `ValuationSheet`** viven" en el inicio | `ValuationSheet` solo se usa en el detalle de activo | `client/components/features/patrimony/asset-detail-view/index.tsx:156` |
| §4.2: cada fila de patrimonio tiene menú `...` | Las listas solo tienen chevron/`href`; las acciones `...` están en los detalles (el doc se autocontradice en §4.6) | `assets-list/index.tsx:28-45`, `positions-list/index.tsx:30-64`, `debts-list/index.tsx:33-48` |
| §4.6 `PositionFormDialog` "sigue la anatomía de `AccountFormDialog`" con hero, observaciones y switch archivar | No usa `FormHero`, ni observaciones, ni switch archivar | `client/components/features/assets/position-form-dialog/index.tsx:84-171` |
| §4.8 "Selector de período/**moneda** en el header" | Solo `PeriodSelector` en contenido; sin moneda | `client/components/features/reports/reports-view/index.tsx:193` |
| §4.8.1 referencia "§4.2.1" | **La sección no existe**; los widgets están en §4.8.1 | — |
| §4 index: detalle de inversión con `?id=` | El reporte de patrimonio enlaza posiciones con `?symbol=&currency=` (el hook soporta ambos) | `client/components/features/dashboard/investments-summary/index.tsx:114`, `use-position-detail.ts:11-13` |

### 3.3 Componentes reutilizables (§5 / §6.3)

- **Mencionados que ya no existen:** `currency-selector`, `period-currency-filters`, `DataTable` (reemplazado por `DataList`), `BudgetStatusBadge` (reemplazado por `StatusBadge`).
- **Reales no documentados (o solo en §6.3, no en §5):** `allocation-list`, `budget-progress`, `confirm-action-dialog`, `detail-metric`, `detail-page` (`DetailPage`/`DetailPageNotFound`/`DetailPageSkeleton`), `form-hero`, `form-money-field`, `money`, `money-input`, `option-sheet`, `section-card`, `section-header`, `signed-money`, `time-series-chart`, `trend-badge`, `warning-badge`, `list-row`.
- §6.3 dice que `lib/sections.ts` es un registro `href + label + **icon**`; en realidad `AppSection` solo tiene `href` y `label`; los íconos viven en `client/components/layout/section-icons.ts` → `client/lib/sections.ts:11-14`.

### 3.4 Capa de datos y tipos (§7)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| `Transaction` sin `transferAccountId` | Lo incluye | `client/lib/api/types.ts:101` |
| `Asset` sin vínculo a deuda | Incluye `debtId: string \| null` | `types.ts:131` |
| `DashboardData` acotado (`netWorthSeries: {date,value}`, sin más) | Agrega `savingsRateDeltaPp`, `assetsDeltaPct`, `debtsDeltaPct`, `accounts`, `accountsDeltaPct`, `investmentsDeltaPct`; `netWorthSeries` ahora `{date,value,assets,debts}`; y añade `categoryChanges`, `netWorthComposition`, `cashflow`, `investments`, `assetsComposition` | `types.ts:203-274` |
| §7.3 lista `ReportSummary`, `ReportByCategory`, `NetWorthPoint`, `BudgetReportRow` | **No existen** en `types.ts` | `grep -c` = 0 |
| `AssistantStreamMeta` está en `types.ts` | Vive en `client/lib/api/assistant-stream.ts:13` | — |
| Faltan por documentar | `PeriodRange`, `NetWorthCompositionKind`, `DashboardInvestmentPosition`, `ActionClass`, `ActionPreview`, `ActionPreviewField`, `AssistantAction*`, `AssistantMessageInput`, `AssistantReply`, y los `*Input`/`*Filters` | `types.ts:27,186-201,296-505` |
| §7.4: "al crear un movimiento se invalidan … `reports`" | No existe query de `reports`; invalida `transactionsBase`, `accounts`, `budgetsBase`, `dashboardBase` | `client/lib/query/transactions.ts:24-27`, `lib/query/keys.ts:9-30` |
| §7.4: los filtros viven "en la URL con `useSearchParams`" | Viven en estado local; `useQueryParam` solo para ids de detalle | `transactions-view/index.tsx:28-45` |
| §7.5 `QueryClient` con `staleTime: 30_000, retry: 1` | Agrega `refetchOnWindowFocus: false` | `client/providers/query-provider.tsx:11-17` |
| §7.1/§8: `session.ts` persiste los tokens | `session.ts` solo guarda `atlassfin.session.userId` para mocks; los tokens los maneja `token-store.ts` | `client/lib/api/session.ts:1-18`, `lib/api/token-store.ts:5-46` |
| §8 punto 6: un interceptor lanza evento global y `AuthProvider` redirige | No hay evento global: `apiFetch` lanza `UnauthorizedError` y redirige el `AuthGuard` | `client/lib/api/client.ts:149-151`, `client/components/layout/auth-guard/index.tsx` |
| §7.3 nota "generar tipos desde OpenAPI" | Los tipos son manuales; `lib/api/endpoints.ts` no tiene `reportEndpoints` (el reporte de patrimonio usa `dashboardEndpoints`) | `client/lib/query/dashboard.ts:5` |

### 3.5 Asistente (§10)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| Documenta `postAssistantStream(...)` como generador async y `AssistantEvent` con `{ type: "action" }` | Exporta `streamAssistantMessage(input, handlers)` basado en **callbacks** (`onMeta`/`onToken`/`onProposal`/`onActionError`/`onDone`/`onError`), sin generador ni `AssistantEvent` | `client/lib/api/assistant-stream.ts:13-27,39-43` |
| Lista eventos `meta`, `token`, `action_proposal`, `done`, `error` | Además maneja `action_error` | `assistant-stream.ts:118-131` |
| Persistencia de hilos `atlassfin.assistant.threads.v2` | Correcto | `client/providers/assistant-chat-provider.tsx:12` |
| Audio solo web, Android `canUseAudio === false` | Correcto (`canUseAudio: !speech.isNative`) | `use-assistant-conversation.ts:325`, `use-speech-recognition.ts:56-65` |
| Tarjetas por acción, `planId`/`step`, "Paso N", bloqueo de dependientes | Correcto | `assistant-action-card/index.tsx:49-171` |
| Panel en `AssistantPanelProvider`, hilos en `AssistantChatProvider` | Correcto | `client/providers/assistant-panel-provider.tsx:7` |

### 3.6 Capacitor y modo mock (§14 / §16)

| El doc dice | La realidad es | Evidencia |
| :--- | :--- | :--- |
| `capacitor.config.ts` define `server` (live-reload) | **No** tiene `server`; solo `appId`, `appName`, `webDir` | `client/capacitor.config.ts:3-7` |
| Export CSV usa `@capacitor/filesystem` + `@capacitor/share` | **No están** en `package.json` | `client/package.json:18-42` |
| `ResponsiveDialogContent` es bottom sheet `< md` | Usa el breakpoint `max-lg` (< 1024px) | `client/components/common/responsive-dialog/index.tsx:8` |
| `formatCurrency` sin `maximumFractionDigits` | Agrega `maximumFractionDigits: 2` | `client/lib/format.ts:11` |
| "Moneda base … cacheada en `UserPreferencesProvider`" | El provider es `DisplayCurrencyProvider` | `client/providers/display-currency-provider.tsx:8` |
| Resto (§16): switch de mocks, layout `v7`, `netWorth` 3/3, masonry con `ResizeObserver`, `lib/mocks/*` | Correcto | `client/lib/api/endpoints.ts:47`, `lib/dashboard-widgets.ts`, `lib/mocks/*` |

---

## 4. `docs/FRD_Gestor_Financiero_v0.1.docx.md`

### 4.1 Brechas de implementación

| ID | Requerimiento | Estado real | Evidencia |
| :--- | :--- | :--- | :--- |
| FR-TRX-006 | Filtrar por fecha, tipo, cuenta y categoría | Backend completo; **UI solo búsqueda** | `api/src/transactions/dto/query-transactions.dto.ts`; `client/components/features/transactions/transaction-filters/index.tsx` |
| FR-TRX-009 | Importar CSV con vista previa | **No implementado (P2)** | sin `FileInterceptor`/parseo CSV |
| FR-TRX-010 | Movimientos recurrentes | **No implementado (P2)** | sin campo `recurring` en `transaction.entity.ts` |
| FR-PRE-005 | Copiar presupuestos del mes anterior | Backend + API cliente listos; **sin UI** | `api/src/budgets/budgets.service.ts:124-161`; `client/lib/query/budgets.ts:48` |
| FR-DAS-007 | Cambiar período **y moneda** de visualización | Período sí; **no hay selector de moneda** (siempre `baseCurrency`) | `client/providers/display-currency-provider.tsx:13-16` |
| FR-REP-006 | Exportar movimientos/resumen en CSV | Backend completo; **cliente no lo invoca** (sin endpoint ni botón) | `api/src/reports/reports.controller.ts:71-91`; sin uso en `client/components/features/reports` |
| FR-REP-007 | Versión imprimible/PDF | **No implementado (P2)** | sin `window.print`/`@media print`/PDF |
| FR-IA-009 | Consultar y eliminar historial propio | Backend completo; **el cliente muestra historial local** (localStorage) y solo borra el global del servidor | `api/src/assistant/assistant.controller.ts:80-107`; `client/providers/assistant-chat-provider.tsx:12` |

### 4.2 IDs citados por los docs que **no existen** en el FRD

- `FR-PRE-007` (renovación automática de presupuestos) — citado en `backend.md` §5.6/§7.15 y `frontend.md` §4.5/§4.8. **El FRD solo define FR-PRE-001..006.** La funcionalidad **sí existe** en código (`recurring`, migración `AddBudgetRecurring`), así que el FRD es el que está incompleto.
- `FR-PRE-008` (detalle de presupuesto) — citado en `frontend.md` §4.5; no existe en el FRD.

### 4.3 Requerimientos parciales o sin evidencia (NFR)

| ID | Estado real |
| :--- | :--- |
| NFR-PR-001 (vistas < 3 s) | Sin benchmarks; el dashboard carga todas las transacciones sin paginar |
| NFR-PR-002 (paginación) | Solo paginan `/transactions` y `/assistant/conversations`; el resto devuelve todo |
| NFR-PR-003 (cotizaciones) | Caché/timeout/último valor sí; **sin reintentos explícitos** |
| NFR-PR-004 (IA cancel/timeout) | Carga y timeout server sí; **no hay botón de cancelar** ni `AbortController` en el stream |
| NFR-SEG-009 (host/redirects) | Timeout sí; **sin allowlist de hosts ni `maxRedirects:0`** en mercado |
| NFR-CAL-001 (navegadores) | Sin `browserslist`/matriz de soporte |
| NFR-CAL-004 (tests) | 8 specs unitarios en `api/src`; **sin e2e** (`api/test` solo `jest-e2e.json`) y **sin tests de cliente** |
| CAL-009 (trazabilidad cambiaria) | Guarda pares/tasas en `exchange_rates`, pero **no persiste qué tasa usó cada transacción/reporte** |

### 4.4 Funcionalidad implementada y **no listada** en el FRD

1. **Renovación automática de presupuestos** (`recurring` + proyección) — `budget.entity.ts:39-40`, `budgets.service.ts:230-254`.
2. **Edición atómica y borrado en cascada de ambos lados** de una transferencia (más allá de FR-TRX-005).
3. **Aportar a una posición** (`POST /positions/:id/add`, recalcula cantidad y costo promedio) — `positions.controller.ts:41-53`.
4. **Vínculo objetivo ↔ cuenta de origen** (`sourceAccountId`) y orquestador de validación.
5. **Aporte a metas** (`contributeToGoal`) usado por IA, sin endpoint REST propio.
6. **Restauración** de cuentas y metas (no pedida en el FRD).
7. **Acciones IA con confirmación**: token de un solo uso hasheado, TTL, orden de plan por pasos, deduplicación y auditoría de lecturas — `pending-actions.service.ts:54-263`.
8. **Flag `assistantDestructiveEnabled`** separado del `aiEnabled`.
9. **Audio del asistente** (Web Speech API + `MediaRecorder`, solo web).
10. **Widget flotante y panel del asistente**.
11. **Modo mock del cliente** por defecto (`NEXT_PUBLIC_USE_MOCKS`).
12. **Capacitor/Android + barras nativas** (iOS pendiente).
13. **Widgets personalizables** de reportes (drag, ocultar, span, localStorage).
14. **FX con pivote ARS**, tasas por defecto y refresh externo (habilita CAL-008).
15. **Scheduler de mercado** configurable.
16. **Swagger/OpenAPI** y módulo **Health**.
17. **Fallback de usuario demo** para el stream IA en no-producción.
18. **Render de Markdown seguro** de respuestas IA sin HTML crudo.

---

## 5. Otros documentos con drift (fuera de los 3 principales)

- `client/AGENTS.md` → "Navigation behavior": describe la barra móvil como `Home, Transactions, +, Reports, Settings`; la real es `Home, Asistente, +, Reportes, Perfil` (`client/components/layout/app-nav.ts:22-24`). También dice preset "green, radius large" cuando `components.json` usa `neutral` sin radius.
- `api/AGENTS.md` → "Layout" ubicа `fx` dentro de `shared/`, pero `fx/` está en la raíz de `src/`. Lo mismo aplica a `backend.md` §4.

---

## 6. Clasificación: WIP vs. decisión consciente

El proyecto está **en desarrollo activo**, así que no toda diferencia entre doc y código es un error. Hay que separar tres cosas y una zona gris:

- **B. WIP / en desarrollo** → el doc (o el FRD) describe el objetivo; el código todavía no lo alcanza. **No** se reescribe la doc para "reflejar" la falta: se marca explícitamente como pendiente/proyectado (o se confirma que quedó fuera de alcance).
- **A. Decisión consciente** → el diseño cambió a propósito y **el código es la verdad**. La doc se **reescribe** para reflejar la decisión; no hay que "volver a implementar" lo viejo.
- **C. Desfase de doc puro** → error factual, nombre viejo o referencia rota, sin decisión de diseño detrás. Se corrige y listo.
- **D. Zona gris** → no se puede inferir del código si es intencional; requiere confirmación.

### A. Decisiones conscientes (la doc debe actualizarse, no el código)

| Ítem | Qué se decidió | Evidencia |
| :--- | :--- | :--- |
| Módulo `goals` separado de `accounts` | Las metas son entidad y ruta propias, no un tipo de cuenta; no suman al patrimonio | `api/src/goals/**`, `client/app/(app)/goals/detail/page.tsx` |
| Sin tipo "Objetivo" en `AccountTypePicker` | Consecuencia de lo anterior: cuentas solo `cash/bank/wallet/card/other` | `client/components/features/accounts/account-type-picker/index.tsx:29` |
| Moneda de visualización = moneda base, **sin selector** | Se quita el selector de moneda de la UI; se edita en Ajustes vía `PATCH /users/me` | `client/providers/display-currency-provider.tsx:13-16` |
| Barra móvil `Inicio · Asistente · + · Reportes · Perfil` | `Asistente` navega a `/assistant` y `Perfil` es el hub (no `Settings`) | `client/components/layout/app-nav.ts:22-24`, `client/lib/sections.ts` |
| Asistente local-first | Historial en `localStorage`; el panel/PDF de mensajes; widget en desktop y página en mobile | `client/providers/assistant-chat-provider.tsx:12` |
| Stream del asistente por callbacks | `streamAssistantMessage(input, handlers)` en lugar del generador `postAssistantStream` del doc | `client/lib/api/assistant-stream.ts:13-43` |
| Reportes/widgets movidos del inicio a `/reports` | El dashboard prioriza el resumen; la analítica vive en Reportes | `client/components/features/home/home-view/index.tsx`, `reports-view/index.tsx` |
| `DataList` reemplaza `DataTable`; `StatusBadge` reemplaza `BudgetStatusBadge` | Se eliminaron tablas y el badge específico | `client/components/common/data-list/`, `status-badge/` |
| `components.json` `neutral` (no green/radius) | Rebrading visual; AGENTS y doc quedaron con el preset viejo | `client/components.json:3,9` |
| Capa `shared/` en el API | `calculations`, `market`, `ai`, `mail` se agrupan como infra transversal (`fx` queda en la raíz) | `api/src/shared/**` |
| CAL-008/009 en `fx.service` | La conversión y su trazabilidad son dueñas del módulo FX, no de `calculations` | `api/src/fx/fx.service.ts:57-115` |
| Default efectivo `ARS` | Público objetivo AR; la columna conserva el default `USD` pero registro/seed usan `ARS` | `api/src/auth/auth.service.ts:60`, `seed.ts:119` |
| USDT con precio fijo 1 | Stablecoin: se evita la llamada externa | `api/src/shared/market/providers/crypto-quote.provider.ts:51-59` |
| Panel confirmación IA con token/TTL/orden de plan | Va más allá del FRD (FR-IA-006) y reemplaza cualquier idea previa de ejecución directa | `api/src/assistant/actions/pending-actions.service.ts:54-263` |
| `assistantDestructiveEnabled` separado de `aiEnabled` | Las destructivas tienen permiso propio | `api/src/users/entities/user.entity.ts:33-38` |
| `refetchOnWindowFocus: false` | Decisión de caché del `QueryClient` | `client/providers/query-provider.tsx:11-17` |
| Capacitor Android como target real | Android empaquetado, iOS fuera por ahora | `client/android/`, `client/capacitor.config.ts` |
| Modo mock por defecto | Permite desarrollar sin API; `NEXT_PUBLIC_USE_MOCKS` | `client/lib/api/endpoints.ts:47` |

> Las decisiones **ya documentadas** (metas separadas, moneda base, asistente local-first, widgets en Reportes, `DataList`) no son "desfases": son cambios que la doc refleja en su mayoría. Los desfases reales son los **puntos que aún contradicen esa decisión** (p. ej. §4.8 "selector de moneda en el header", FR-DAS-007, o el árbol §5 que sigue sin `/profile`).

### B. WIP / en desarrollo (marcar como pendiente, no reescribir como si estuviera)

| Ítem | Qué falta | Evidencia |
| :--- | :--- | :--- |
| Correo real (FR-AUT-003) | `MailService` es un stub que solo loguea el link; falta `nodemailer`/SMTP real | `api/src/shared/mail/mail.service.ts:11-20` |
| Contexto del asistente | Sigue leyendo repositorios directos; falta migrar a un orquestador | `api/src/assistant/assistant-context.service.ts:31-51` |
| Migraciones | `assistant_actions` y varias columnas nuevas dependen de `synchronize: true`; faltan migraciones | `api/src/database/database.module.ts:22` |
| Export CSV (FR-REP-006) | Backend listo; falta endpoint en `lib/api/endpoints.ts` y botón en Reportes | `api/src/reports/reports.controller.ts:71-91` |
| Copiar presupuestos (FR-PRE-005) | Backend + hook listos; falta botón en la UI | `client/lib/query/budgets.ts:48` (sin usos) |
| Filtros de movimientos (FR-TRX-006) | Backend completo; la UI solo expone búsqueda | `client/components/features/transactions/transaction-filters/index.tsx` |
| Import CSV / recurrentes (FR-TRX-009/010) | P2 no implementado | sin `FileInterceptor`/`recurring` |
| PDF / imprimible (FR-REP-007) | P2 no implementado | sin `window.print`/`@media print` |
| Historial IA en servidor (FR-IA-009) | Backend listo; el cliente solo borra el global, no consume el historial persistido por ID | `api/src/assistant/assistant.controller.ts:80-107` |
| Selector de moneda por vista (FR-DAS-007) | Solo existe el período; la moneda es fija a la base (la base es decisión; el selector por vista no) | `display-currency-provider.tsx:13-16` |
| Tests (NFR-CAL-004) | Sin e2e (`api/test` vacío) y sin tests de cliente | `api/test/jest-e2e.json` |
| Rate limiting por endpoint (NFR-SEG-010) | Hoy es un throttler global; falta afinarlo por ruta | `api/src/app.module.ts:37,61` |
| Robustez de mercado (NFR-SEG-009) | Falta allowlist de hosts, `maxRedirects: 0` y reintentos | `crypto-quote.provider.ts`, `fx-rate.provider.ts` |
| Cancelar IA (NFR-PR-004) | Sin botón cancelar ni `AbortController` en el stream | `client/lib/api/assistant-stream.ts` |
| Paginación general (NFR-PR-002) | Solo paginan movimientos y conversaciones | `common/dto/pagination.dto.ts` |
| Keychain en nativo | Access token en memoria; keychain pendiente | `client/lib/api/token-store.ts` |
| iOS + CSV nativo (`Filesystem`/`Share`) | Plugins no instalados; iOS no generado | `client/package.json:18-42` |
| `server` en `capacitor.config.ts` | Live-reload no configurado | `client/capacitor.config.ts:3-7` |

### C. Desfases de doc puros (corregir, sin decisión de diseño)

- Nombres/referencias: `MarketSchedulerService` → `MarketScheduler`; `§4.2.1` inexistente; `lib/api/reference.ts` inexistente; `AssistantStreamMeta` mal ubicado.
- Contrato incompleto en ejemplos: `GET /assets/:id`, `cashflow`, kind `asset`, `assistantDestructiveEnabled`, `planId`/`step`/`pending`, `updatePreferences`, `REFERENCE_PENDING`, `MAX_TOOL_STEPS`.
- Env: falta `DEFAULT_CURRENCY`; `QUOTE_STALE_MS` duplicado; validación obligatoria de secretos no indicada.
- Datos/seed: "5 categorías" (son 5+9); `aiEnabled: true` del demo; `provider: "default"` de FX.
- Frontend stale: `ValuationSheet` en el inicio, menú `...` en listas de patrimonio, `+ Nuevo movimiento` con texto, anatomía de `PositionFormDialog`, `AccountTypePicker` con "Objetivo", `lib/sections.ts` con `icon`, `header.tsx` con moneda, `formatCurrency` con `maximumFractionDigits: 2`, `max-lg` vs `< md`, `.env.example` "no versionar", componentes `currency-selector`/`period-currency-filters`/`DataTable`/`BudgetStatusBadge`, tipos `ReportSummary`/`ReportByCategory`/`NetWorthPoint`/`BudgetReportRow`.
- FRD: `FR-PRE-007`/`FR-PRE-008` citados por los otros docs pero no definidos en el FRD.
- `api/AGENTS.md`: ubica `fx` en `shared/` (está en la raíz).

### D. Zonas grises (confirmar antes de tocar)

| Ítem | Pregunta |
| :--- | :--- |
| `OwnershipGuard` inexistente | ¿Decisión de resolver ownership dentro de cada service (y actualizar §3) o feature pendiente? |
| `synchronize: true` global | ¿Atajo de desarrollo (WIP) o decisión de no mantener migraciones? |
| Throttler global | ¿Simplificación consciente o tuning pendiente por endpoint? |
| Binance una-request-por-símbolo | ¿Simplificación actual o queda pendiente el batch `?symbols=[...]`? |
| Correo | ¿Stub WIP a implementar o fuera de alcance del TP? |
| Historial IA local | ¿Local-first definitivo o transitorio hasta consumir `/assistant/conversations`? |

---

## 7. Plan de actualización sugerido (checklist)

> Criterio al aplicar el plan: los ítems de **§6.B (WIP)** se marcan como pendientes/proyectados, no se reescriben como si existieran; los de **§6.A (decidido)** se reescriben para que el código sea la verdad; los de **§6.C** se corrigen; los de **§6.D** se resuelven primero con el equipo.

### `docs/backend.md`
- [ ] §4: reescribir el árbol real (capa `shared/`, `common/errors|pipes|transformers`, `health/`, `reference/`, `database/seeds`, DTOs faltantes); eliminar `ownership.*`; corregir `MarketScheduler`.
- [ ] §3: quitar `OwnershipGuard`; describir la resolución de propiedad por `userId` en services.
- [ ] §5/§14: declarar `synchronize: true` **global** y aclarar qué tablas/columnas dependen de él; completar la migración inicial real.
- [ ] §5.2/§6.1: corregir el default real (`ARS` en registro/seed) y quitar "crea categorías por defecto" del registro.
- [ ] §7.6: agregar `GET /assets/:id`.
- [ ] §7.13/§7.15: agregar `cashflow`, kind `asset` en `netWorthComposition`, `assistantDestructiveEnabled` en `User`, `planId`/`step`/`pending` en `action_proposal`.
- [ ] §7.16: nombrar `updatePreferences`, documentar `MAX_TOOL_STEPS`, y precisar las clasificaciones reales (`sensitive` vs `write_safe`).
- [ ] §7.17: agregar `REFERENCE_PENDING`.
- [ ] §8: mover CAL-008/CAL-009 a `fx.service`; documentar helpers internos.
- [ ] §9.1/§9.2/§9.3: corregir Binance (una request por símbolo), USDT hardcodeado, provider `"fawaz"`, firma real de `streamChat`, estado del contexto del asistente, y **aclarar que el correo no envía** (log-only) o marcarlo como pendiente.
- [ ] §10: quitar rate limiting "por endpoint"; documentar el throttler global.
- [ ] §12: agregar `DEFAULT_CURRENCY`; mencionar validación obligatoria de secretos; unificar `QUOTE_STALE_MS`.
- [ ] §11: "5 categorías de usuario + 9 de sistema"; `aiEnabled: true` del demo; tasas `provider: "default"`.
- [ ] §14: actualizar el estado de las tandas y quitar la nota obsoleta de Tanda 3.

### `docs/frontend.md`
- [ ] §3/§5: agregar `/profile`, `goals/detail`, `patrimony/*/detail`; quitar `currency-selector`/`period-currency-filters`; corregir navegación (sidebar y tab bar), `section-icons.ts`, `lib/` faltantes, `.env.example` versionado, `header.tsx`, preset de `components.json`.
- [ ] §4: quitar campos "Objetivo" de cuentas; corregir botón `+ Nuevo movimiento`; marcar copiar presupuestos como backend-only; mover `ValuationSheet` al detalle; quitar menú `...` de listas de patrimonio; corregir `PositionFormDialog`; corregir "período/moneda en header"; arreglar referencia `§4.2.1`; documentar `?symbol=&currency=`.
- [ ] §5/§6.3: eliminar `DataTable`/`BudgetStatusBadge`; agregar los componentes reales; corregir `sections.ts` (sin `icon`).
- [ ] §7: actualizar interfaces (`Transaction.transferAccountId`, `Asset.debtId`, `DashboardData` completo); eliminar tipos inexistentes; mover `AssistantStreamMeta`; documentar `token-store` vs `session`; corregir invalidaciones y `QueryClient`; aclarar filtros locales.
- [ ] §8: describir el manejo real de `401` (`UnauthorizedError` + `AuthGuard`, sin interceptor global).
- [ ] §10: reescribir el contrato real del stream (`streamAssistantMessage` + callbacks, `action_error`).
- [ ] §14: quitar `server` de `capacitor.config.ts` y CSV/Capacitor no instalados; corregir breakpoint `max-lg`.
- [ ] §16: corregir `DisplayCurrencyProvider` y `maximumFractionDigits`.

### `docs/FRD_Gestor_Financiero_v0.1.docx.md`
- [ ] Agregar `FR-PRE-007` (renovación automática) y, si se desea, `FR-PRE-008` (detalle), para alinear con los otros docs.
- [ ] Actualizar FR-DAS-007 (moneda de visualización es la base) o marcarlo como postergado.
- [ ] Marcar explícitamente FR-TRX-009/010 y FR-REP-007 como P2 no entregados, y FR-REP-006/FR-PRE-005/FR-IA-009 con su estado parcial.
- [ ] Añadir una sección de "Funcionalidad adicional implementada" (§4.4 de este informe).

---

## Anexo — Archivos/estructuras clave usados como evidencia

- API: `api/src/app.module.ts`, `api/src/main.ts`, `api/src/database/{database.module.ts,data-source.ts,migrations/*,seeds/*}`, `api/src/{auth,users,accounts,transactions,categories,budgets,assets,debts,positions,quotes,goals,dashboard,reports,assistant,reference,health}/**`, `api/src/shared/{ai,mail,market,calculations}/**`, `api/.env.example`.
- Cliente: `client/app/**/page.tsx`, `client/components/{layout,common,features}/**`, `client/lib/**`, `client/hooks/**`, `client/providers/**`, `client/{capacitor.config.ts,next.config.ts,components.json,.env.example}`.
