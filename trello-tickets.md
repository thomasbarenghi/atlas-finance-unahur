# Tickets de Trello — Atlass Fin (derivados de Pull Requests)

**Repositorio:** https://github.com/thomasbarenghi/atlas-finance-unahur
**Tablero destino:** https://trello.com/b/ywGiZ6Qw/grupo-13-aca-proyecto-integrador-programaci%C3%B3n
**Rango analizado:** PRs #1 a #10 (abiertos, cerrados y mergeados).

Todos los tickets se derivan exclusivamente de información visible en los PRs (título, descripción, commits y archivos cambiados). No se inventó alcance fuera de lo descrito.

---

## Resumen del análisis

| PR | Estado | Título | Rama base | Ticket(s) |
|----|--------|--------|-----------|-----------|
| #1 | Mergeado | docs: bootstrap documentation, agent skills, and repo tooling | develop | T1 |
| #2 | Mergeado | feat(client): initialize Next.js client with shadcn, theming and Android | develop | T2 |
| #3 | Mergeado | Initialize API project with essential configuration, database structure... | develop | T3 |
| #4 | Mergeado | feat(client,api): frontend slice + AI assistant account actions | develop | T4, T5 |
| #5 | Mergeado | feat(api,client): goals as a first-class module | develop | T6 |
| #6 | Mergeado | feat(api,client): finance domain, market quotes and real API integration | develop | T7, T8 |
| #7 | Mergeado | feat(api,client): AI assistant tool calling with confirmed multi-action plans | develop | T9 |
| #8 | **Cerrado (sin merge)** | Feature/0.0.1 | main | — (superseded por #9) |
| #9 | Mergeado | Release/0.0.1 | main | T10 |
| #10 | Mergeado | Release/0.0.1 (#9) | develop | T10 |

**Organización lógica:** T1–T3 = fundaciones del monorepo; T4–T5 = cliente y asistente (acción sobre cuentas); T6 = dominio de objetivos; T7–T8 = backend de finanzas + mercado; T9 = asistente orquestador; T10 = release.

---

## Fundaciones del proyecto

### T1 — Documentación base, skills de agentes y tooling del repositorio

**Descripción:**
Bootstrap del monorepo con la documentación técnica derivada del FRD y las herramientas de trabajo para agentes. Se crean los documentos de arquitectura de frontend y backend, el README raíz y el `AGENTS.md` de entrada que rutea a cada app; se agregan las guías `client/AGENTS.md` y `api/AGENTS.md` más cuatro skills reutilizables (`quality-rules` y `test-quality` por app). Se configura el tooling de repo: husky `pre-commit` (lint + typecheck) y `pre-push` (format:check + lint + typecheck + test + build), plantilla de PR, scripts raíz y `agent-local/` ignorado.

**Criterios de aceptación:**
- Existen `docs/frontend.md` y `docs/backend.md` coherentes con el FRD, incluyendo site map, modelo de datos y contrato REST.
- Existe un `AGENTS.md` raíz que referencia las guías de `client/` y `api/`, y ambas guías existen.
- Las skills `quality-rules` y `test-quality` existen para ambas apps.
- `npm install` raíz instala husky y setea `core.hooksPath`.
- El hook `pre-commit` corre lint + typecheck y saltea con seguridad proyectos no scaffoldeados.
- Plantilla de PR, scripts raíz y `.gitignore` presentes; `agent-local/` ignorado (solo `.gitkeep` trackeado).
- Documentación en español; código, tooling y skills en inglés.

**PR(s) de origen:** #1 (`feature/init-docs`).

---

### T2 — Cliente Next.js: base, componentes UI, theming y empaquetado Android

**Descripción:**
Inicialización de la app `client/` (Tanda 0) con Next.js 16 (App Router, TS estricto, Tailwind 4) en modo static export, lista para Capacitor. Se instala shadcn/ui (27 componentes) incluyendo `form.tsx` manual y `calendar` + `popover`; se configuran fuentes Outfit (títulos) y Nunito (cuerpo); theming light/dark/system con `next-themes` y `ThemeToggle`, tokens semánticos `--success`/`--warning` y una home demo en `/`. Se configura el tooling de formato/lint y el empaquetado Android con Capacitor 8 (`com.atlassfin.app`, `webDir: out`, proyecto `android/` y `scripts/android.sh`).

**Criterios de aceptación:**
- La app Next.js 16 compila con `output: "export"` e `images.unoptimized`.
- shadcn/ui integrado con los componentes base y el formulario RHF funcionando.
- Fuentes y tokens de tema aplicados; tema claro/oscuro/sistema operativo con `ThemeToggle`.
- Prettier + ESLint configurados; `format:check` corre en `pre-push`.
- `npm run android:build` genera un APK debug con paquete `com.atlassfin.app`.
- `npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build` pasa en verde.

**PR(s) de origen:** #2 (`feature/initialize-client`).

---

### T3 — API NestJS: base, modelo de datos, seed de demo y endpoint de health

**Descripción:**
Bootstrap del proyecto `api/` (Tanda 0) con NestJS: scaffold y tooling, manejo global de requests, configuración validada, datasource TypeORM y migración inicial del modelo completo (13 tablas), todas las entidades, un endpoint público de health y un seed de demo idempotente. Se agrega la skill `orchestrator-domain-architecture` (Controller → Orchestrator → servicios primarios → repositorios). No se implementan endpoints de dominio ni lógica de negocio (eso empieza en la Tanda 1).

**Criterios de aceptación:**
- `src/main.ts` con prefijo `/api`, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `fieldErrors`), Swagger en `/api/docs`, cookie parser y CORS con credenciales.
- Guard global `JwtAuthGuard` con `@Public()`/`@CurrentUser()`, filtro global de excepciones con catálogo estable de códigos y logging interceptor.
- Migración inicial crea las 13 tablas del modelo (FKs, índices, únicas, `numeric(18,4)`/`numeric(18,8)`).
- `GET /api/health` responde `200 {"status":"ok","db":"up"}`.
- `npm run seed` crea datos demo (usuario `demo@atlassfin.app` / `Demo1234!`) y es idempotente en una segunda corrida.
- Gate completo (format:check, lint, typecheck, test, build) en verde.

**PR(s) de origen:** #3 (`feature/initialize-api`).

---

## Cliente y asistente

### T4 — Cliente: slice funcional completo (auth, shell, páginas y capa de datos)

**Descripción:**
Implementación del slice principal del frontend sobre Next.js 16 (exportable y empaquetado para Android con Capacitor). Incluye flujo de autenticación (`/login`, `/register`, `/forgot-password`, `/reset-password`) y shell protegido `(app)` con sidebar responsivo / tab bar móvil; páginas de dashboard, cuentas (+ detalle), transacciones, categorías, presupuestos (+ detalle), objetivos (+ detalle), patrimonio (activos / deudas / inversiones + detalles), reportes (incl. inversiones), perfil, ajustes y asistente. Agrega capa de datos tipada en `lib/api`, hooks TanStack Query con query keys e invalidación en cascada, validación Zod y mocks reproducibles para desarrollo sin API. Capacitor 8 con safe areas y navegación estilo app.

**Criterios de aceptación:**
- Rutas de auth y layout `(app)` protegido con navegación responsiva (sidebar desktop / tab bar móvil).
- Todas las páginas listadas renderizan con su detalle correspondiente.
- Capa de datos tipada + hooks TanStack Query con invalidaciones; validación Zod; mocks funcionales sin API.
- Empaquetado Android con safe areas y navegación estilo app.
- Gate completo en verde; 23 rutas estáticas exportadas.

**PR(s) de origen:** #4 (`feature/frontend-slice-and-assistant`).

---

### T5 — Asistente IA: acciones de escritura sobre cuentas (function calling)

**Descripción:**
Primera capacidad de **escritura** del asistente: puede crear y editar cuentas del usuario mediante tools tipadas de function-calling que reutilizan el servicio de dominio del backend. Se agregan `AccountsModule`/`AccountsService` (`listAccounts`, `createAccount`, `updateAccount`) con DTOs y mapeo, el registro `AssistantToolsService`, y soporte de `tools`/`tool_calls` en streaming sobre OpenAI-compatible. `AssistantService` ejecuta un loop acotado de tools (máx. 4 pasos) y emite un nuevo evento SSE `action` en mutaciones. En el cliente, streaming por SSE con `fetch` + `ReadableStream`, historial local, dictado por voz **solo en web** (Web Speech API) y tarjetas de acción (`assistant-action-card`).

**Criterios de aceptación:**
- El asistente puede listar, crear y editar cuentas vía tool calling reutilizando el servicio de dominio.
- Streaming de tools/tool_calls con loop acotado (máx. 4 pasos) y evento SSE `action` en mutaciones.
- El cliente renderiza tarjetas de acción y permite dictado por voz en web; en nativo el micrófono queda oculto y se remueven plugin/permiso `RECORD_AUDIO`.
- FRD actualizada: FR-IA-006 pasa de "no escribir" a escrituras acotadas bajo permisos del usuario, con destructivas detrás de opt-in.
- `docs/backend.md` §7.16/§9.2 y `docs/frontend.md` §10 sincronizados; se agrega `docs/exploracion_acciones_asistente_ia.md`.
- Gate completo en verde (api tests 13/13).

**Limitaciones conocidas (del PR):** escrituras limitadas a cuentas; sin confirmación, tabla de auditoría ni idempotencia en esta iteración; sin controller REST de `accounts` aún (cliente en mocks para dominios no expuestos).

**PR(s) de origen:** #4 (`feature/frontend-slice-and-assistant`).

---

## Dominios de backend

### T6 — Módulo de Objetivos (goals) como dominio propio

**Descripción:**
Conversión de los objetivos de "cuenta ficticia" (`Account.type = "goal"`) a un **módulo de dominio propio** en API y cliente. Se crea `GoalsModule` + `GoalsController` + `GoalsService` + `GoalsOrchestrator` con endpoints `GET/POST /goals`, `GET/PATCH /goals/:id`, `POST /goals/:id/archive` y `POST /goals/:id/restore`. La entidad `Goal` tiene `targetAmount`, `savedAmount`, `currency`, `targetDate`, `sourceAccountId` (FK nullable a `accounts`) y `archived`. `calculateGoalProgress` (CAL-007 + FR-OBJ-004) calcula `progressPct` y `status` en el servidor. Se elimina el tipo de cuenta `goal` y su lógica de metas del cliente.

**Criterios de aceptación:**
- Endpoints de goals listados funcionando con DTOs y contrato documentado en `backend.md` §7.
- Entidad `Goal` con los campos indicados y `archived`; cuenta origen validada como perteneciente al usuario reutilizando `AccountsService.getAccount`.
- `progressPct` y `status` calculados server-side (CAL-007), cubiertos con tests unitarios (progreso normal, sin división por cero, `pending`, `achieved`, `overdue`).
- `accounts` ya no incluye `goal` en `AccountType` ni campos de meta.
- Cliente migrado a la API de metas: `lib/query/goals.ts`, validación, mocks, `GoalsList`/`GoalFormDialog`, detalle `/goals/detail`, y `AccountsSection` separa Cuentas y Metas.
- Seed de demo actualizado con cuenta origen en la meta.
- Gate completo en verde (api tests 17/17; 23 rutas estáticas en cliente).

**PR(s) de origen:** #5 (`feature/goals-module`).

---

### T7 — Backend de finanzas completo (tandas 0–6) + conexión del cliente a la API real

**Descripción:**
Completa el backend NestJS de finanzas y conecta el cliente Next.js a la API real. Todos los dominios exponen servicio + controller + DTOs; el dashboard y los reportes se calculan en el servidor y el cliente consume la API real con `NEXT_PUBLIC_USE_MOCKS=false`. Incluye: **Auth** (`register`, `login`, `refresh` con rotación de refresh token, `logout`, `me`, `forgot-password`, `reset-password`; argon2, sesión con `sid`, cookies HttpOnly + Bearer, throttler global, mail con log en dev); **Users** (`PATCH /users/me`); **Reference** (`GET /currencies`); **Accounts** CRUD + archive/restore con `currentBalance` calculado; **Categories** sistema + propias; **Transactions** con filtros, paginación y transferencias atómicas (`transferGroupId`); **Budgets** CRUD, `copy-previous`, proyección de recurrentes y métricas server-side; **Assets/valuations**, **Debts**, **Positions**, **Quotes**; **Dashboard** (KPIs, series, composición, cashflow, inversiones, alertas); **Reports** (`summary`, `by-category`, `net-worth`, `budgets`, `investments`, `export` CSV); **Fx** con pivote ARS. En el cliente: `apiFetch` con refresh-on-401 single-flight, `MoneyInput`/`FormMoneyField`, fix uncontrolled→controlled, picker de categorías autosuficiente, orden consistente de categorías y ajustes de contrato.

**Criterios de aceptación:**
- Todos los dominios listados exponen endpoints con DTOs y quedan sincronizados con `docs/backend.md` §7.
- Auth completo con rotación de refresh token, cookies HttpOnly, Bearer, throttler global y flujo de recuperación de contraseña.
- Transferencias atómicas (dos filas con signo opuesto y `transferGroupId`) con edición/borrado de ambos lados.
- Dashboard y reportes calculados server-side; el cliente consume la API real (`NEXT_PUBLIC_USE_MOCKS=false`).
- `apiFetch` maneja refresh-on-401 single-flight y reintento único; el streaming del asistente aplica el mismo manejo.
- Formularios de dinero con prefijo `$` y separador de miles es-AR; orden de categorías sistema→propias alfabético en español.
- Gate completo en verde (api tests 17/17; 23 rutas estáticas exportadas).

**Limitaciones conocidas (del PR):** sin tests nuevos de cliente; `synchronize: true` activo; refresh de sesión por request (multi-pestaña puede requerir re-login); algunos servicios de lectura leen repositorios de otros dominios (deuda técnica de orquestación).

**PR(s) de origen:** #6 (`feature/finance-backend-api`).

---

### T8 — Cotizaciones de mercado (Binance + FX) y scheduler de refresco

**Descripción:**
Integración de proveedores de cotizaciones públicos y gratuitos (sin API key): **Binance** para cripto (precio + variación 24h, cotiza contra `USDT`, `USDT` se resuelve a `$1`, cada símbolo se pide aislado) y la **currency-api de Fawaz Ahmed** para monedas (base ARS, deriva `X:ARS` y actualiza `exchange_rates`). `MarketSchedulerService` (con `@nestjs/schedule`) refresca al arrancar y cada `MARKET_REFRESH_INTERVAL_MS` (default 5 min), con `POST /market/refresh` para forzar. Mantiene el último valor válido ante falla (FR-MER-004) y un único proveedor por par símbolo/moneda.

**Criterios de aceptación:**
- Cripto y monedas se cotizan mediante los proveedores indicados, etiquetando `provider` y `change24h` cuando corresponde.
- `MARKET_ENABLED`, `MARKET_API_URL`, `MARKET_VS_CURRENCY`, `FX_API_URL`, `MARKET_TIMEOUT_MS` y `MARKET_REFRESH_INTERVAL_MS` configurables y documentados.
- El scheduler refresca al arrancar y periódicamente; `POST /market/refresh` fuerza el refresco.
- Ante falla se conserva el último valor válido (FR-MER-004).
- `quotes.isStale` respeta `QUOTE_STALE_MS`.
- Docs `backend.md` §7.7/§7.18, §9.1 y §14 sincronizados; gate completo en verde.

**Limitaciones conocidas (del PR):** solo cripto + monedas (acciones/ETFs fuera de alcance).

**PR(s) de origen:** #6 (`feature/finance-backend-api`).

---

## Asistente orquestador

### T9 — Asistente IA: tool calling con planes multi-acción y confirmación humana

**Descripción:**
Convierte al asistente en un **orquestador de operaciones** sobre toda la lógica de negocio: catálogo de **46 tools agrupadas por dominio** (14 `read`, 20 `write_safe`, 9 `sensitive`, 3 `destructive`) que reutilizan los mismos servicios/DTOs que el REST. Cada escritura se propone como **acción pendiente con confirmación humana en dos fases** (token de un solo uso hasheado + TTL + lock pesimista), agrupada en un **plan** (`planId`/`step`) con dependencias entre operaciones. Incluye `ReferenceResolver` acotado al `userId`, forward references para entidades aún en creación, enforcement de orden server-side, idempotencia por dedupe, auditoría en `assistant_actions` (escrituras y lecturas), memoria conversacional y salidas de tools marcadas como no confiables. Las tools destructivas se excluyen del catálogo si el usuario no habilitó `assistantDestructiveEnabled`. Fixes de dominio asociados: `createAsset` atómico, presupuestos solo sobre categorías de gasto, `POST /positions/:id/add`, `contributeToGoal`, y `updateTransaction` con `type`/`account`/`currency`. En el cliente: tarjetas de acción con Confirmar/Cancelar, Reintentar/Cancelar en fallidas, desbloqueo de pasos dependientes e invalidación de queries.

**Criterios de aceptación:**
- Catálogo de 46 tools por dominio con clasificación `read`/`write_safe`/`sensitive`/`destructive`; las `read` se ejecutan al instante y el resto requiere confirmación.
- Confirmación/cancelación con token de un solo uso (sha256 + `timingSafeEqual`), TTL (`AI_ACTION_TTL_MS`, default 120 s) y `pessimistic_write`; al vencer queda `expired`.
- Planes con orden enforced server-side (`assertPlanOrder`) y dedupe de propuestas idénticas.
- Referencias resueltas siempre acotadas al `userId`, con forward references y `action_error NOT_FOUND` cuando no corresponde a una creación del plan.
- Tools destructivas excluidas del catálogo si `assistantDestructiveEnabled` está deshabilitado; `ProfileTools` no puede habilitarlas ni cambiar `baseCurrency`.
- Auditoría en `assistant_actions` (escrituras + lecturas ejecutadas, best-effort).
- El token de confirmación no se persiste en `localStorage`; al rehidratar, pendientes quedan como fallidas.
- Fixes de dominio listados aplicados y cubiertos.
- Gate completo en verde; **API: 8 suites / 54 tests** incluyendo specs de `PendingActionsService`, `AccountTools`, `AssistantService`, `ReferenceResolver` y `ToolRegistry`.

**Limitaciones conocidas (del PR):** fallback dev del stream (`POST /assistant/messages` es `@Public()` y usa el usuario demo fuera de producción) sin endurecer; `synchronize: true`; sin tests de cliente; mitigación de prompt injection no determinista.

**PR(s) de origen:** #7 (`feature/ai-tool-calling`).

---

## Release

### T10 — Release 0.0.1: integración a `main` y backport a `develop`

**Descripción:**
Publicación de la versión 0.0.1 del monorepo: integración de todo el trabajo de `develop` a `main` (PR #9, squash/merge de los PRs #1–#7) y backport de la release de vuelta a `develop` (PR #10). El PR #8 (`feature/0.0.1`) quedó **cerrado sin merge** al ser superseded por #9, por lo que no representa trabajo propio y no genera ticket. Este ticket es de ingeniería de release, no de funcionalidad nueva.

**Criterios de aceptación:**
- `main` contiene la versión 0.0.1 con los PRs #1–#7 integrados.
- `develop` recibe el backport de la release (#10) y queda alineado con `main`.
- El PR #8 queda documentado como cerrado/superseded (sin merge).
- El gate de calidad (`format:check`, `lint`, `typecheck`, `test`, `build`) pasa en el commit liberado.

**PR(s) de origen:** #8 (cerrado, sin merge), #9 y #10 (mergeados).

---

## Notas y ambigüedades (a resolver antes de cargar en Trello)

1. **Lista destino:** todos los tickets corresponden a trabajo **ya mergeado**. No está claro si deben cargarse en una lista de tipo "Done"/"Completado", en un "Backlog" histórico, o en una lista de documentación del proyecto. **Requiere confirmación.**
2. **PR #8** está cerrado sin merge (superseded por #9): se excluye como ticket propio y solo se menciona en T10.
3. **T7 y T8 comparten el mismo PR (#6)** pero son entregables separables (dominios de finanzas vs. proveedores de mercado). Si se prefiere un único ticket por PR, T7 y T8 se pueden fusionar.
4. **T4 y T5 comparten el mismo PR (#4)** (frontend slice vs. acciones del asistente sobre cuentas). Igual criterio: se pueden fusionar si se prefiere un ticket por PR.
5. No se derivaron etiquetas/miembros responsables porque los PRs no declaran labels ni assignees distintos del autor.
6. No se inventó alcance, fechas de vencimiento ni checklists fuera de lo descrito en los PRs.
