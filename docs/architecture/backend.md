# Atlass Fin — Documento Técnico del Backend

> **Audiencia:** agentes de IA que implementarán el backend.
> **Stack:** NestJS (monolítico) · TypeScript · PostgreSQL (Supabase como proveedor) · TypeORM · JWT (cookie HttpOnly) · REST.
> **Frontend:** consume esta API. Ver `frontend.md`.
> **Referencia funcional:** `../specification/0.3/FRD_Gestor_Financiero_v0.3.md`. Todo requisito citado (FR-*, HU-*, CAL-*, NFR-*) corresponde a ese documento.

---

## Tabla de contenidos

1. [Visión general y stack](#1-visión-general-y-stack)
2. [Decisiones técnicas](#2-decisiones-técnicas)
3. [Arquitectura general](#3-arquitectura-general)
4. [Estructura de archivos](#4-estructura-de-archivos)
5. [Modelo de datos (PostgreSQL)](#5-modelo-de-datos-postgresql)
6. [Autenticación y autorización (JWT)](#6-autenticación-y-autorización-jwt)
7. [API REST por módulo](#7-api-rest-por-módulo)
8. [Reglas de cálculo](#8-reglas-de-cálculo)
9. [Integraciones externas](#9-integraciones-externas)
10. [Seguridad](#10-seguridad)
11. [Datos de demostración (seed)](#11-datos-de-demostración-seed)
12. [Configuración y variables de entorno](#12-configuración-y-variables-de-entorno)
13. [Convenciones de código](#13-convenciones-de-código)
14. [Plan de trabajo por tandas](#14-plan-de-trabajo-por-tandas)

---

## 1. Visión general y stack

Backend monolítico que sirve una API REST para Atlass Fin. Organiza y explica la información cargada por el usuario; **no** se conecta a bancos, no ejecuta pagos ni inversiones y no brinda asesoramiento financiero. Las integraciones externas son el proveedor de IA y la API pública de cotizaciones, y se realizan exclusivamente desde el backend.

La aplicación opera con **multimoneda**: cada cuenta declara su moneda, el usuario elige una **moneda principal** para el patrimonio y las cotizaciones son globales y las provee la API (no las crea ni edita el usuario). El dashboard tiene un **selector de moneda de lectura** en el header (antes del período) que re-expresa todos los valores; por defecto usa la moneda principal. Cada flujo se convierte a la moneda de lectura con la cotización de la API antes de agregarse; el patrimonio se informa en la misma moneda con desglose por moneda. La cotización de una transferencia multimoneda se puede sobrescribir en la operación, pero **no se persiste**. Existen cinco categorías globales definidas por el sistema (solo lectura) y cada usuario puede crear, editar y eliminar las suyas.

| Área          | Tecnología                                                        | Notas                                                                                               |
| :------------ | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| Framework     | NestJS                                                            | Monolítico, módulos por dominio.                                                                    |
| Lenguaje      | TypeScript (strict)                                               | —                                                                                                   |
| Base de datos | PostgreSQL                                                        | Proveedor: **Supabase** (Postgres gestionado).                                                      |
| ORM           | TypeORM                                                           | Entidades como fuente de verdad del esquema (`synchronize`).                                        |
| Esquema       | **Sin migraciones** (decisión de la etapa)                        | El schema se deriva de las entidades; ante un cambio se recrea la base y se corre el seed (§11.1).  |
| Auth          | `@nestjs/jwt` + `passport`                                        | JWT por cookie `HttpOnly`; el cliente web no maneja tokens en JS.                                  |
| Validación    | `class-validator` + `class-transformer` + `ValidationPipe` global | —                                                                                                   |
| Hash          | `argon2`                                                          | Algoritmo adaptativo (NFR-SEG-003).                                                                 |
| IA            | Proveedor de LLM (configurable, p. ej. DeepSeek/OpenAI)           | Solo contexto mínimo calculado; asistente de solo consulta.                                         |
| Config        | `@nestjs/config`                                                   | —                                                                                                   |

---

## 2. Decisiones técnicas

| Decisión            | Elección                                                                                           | Justificación                                                                                     |
| :------------------ | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| Estilo              | Monolito modular                                                                                   | Suficiente para el alcance; evita complejidad de microservicios.                                  |
| Estructura          | Convencional NestJS (module/controller/service) + DTOs y entidades                                 | Es la estructura por defecto; clara para el agente.                                               |
| Casos de uso        | Services de dominio con un método por caso de uso                                                  | Separación de responsabilidades; testeo unitario directo.                                         |
| ORM                 | TypeORM                                                                                            | Integración nativa con NestJS (`@nestjs/typeorm`); el esquema se sincroniza desde las entidades.  |
| Auth                | JWT stateless (access + refresh)                                                                   | Sin tabla de sesiones ni revocación server-side. Transporte exclusivo por cookie `HttpOnly`.       |
| Transporte de token | Cookie `HttpOnly; Secure; SameSite`                                                               | Mitiga XSS; el cliente web no lee ni persiste tokens; consistente con NFR-SEG-004.                |
| IDs                 | `uuid` (gen_random_uuid)                                                                           | Identificadores no predecibles (NFR-SEG-005).                                                     |
| Moneda              | Multimoneda: moneda por cuenta + moneda principal del usuario + cotizaciones globales de la API | El dashboard re-expresa todos los valores en la moneda de lectura (default: principal); CAL-001/002. |
| Streaming IA        | SSE                                                                                                | UI reactiva y cancelable (NFR-PR-004).                                                            |

---

## 3. Arquitectura general

```
                        ┌──────────────────────────────┐
Frontend (Next.js) ───▶ │  NestJS (monolito)           │
                        │                              │
                        │  Global: Pipes, Guards,      │
                        │  Filters                     │
                        │                              │
                        │  Módulos de dominio:         │
                        │   auth, users,               │
                        │   accounts, transactions,    │
                        │   categories, dashboard,     │
                        │   assistant                  │
                        │                              │
                        │  Capa compartida:            │
                        │   calculations (reglas CAL), │
                        │   account-balances,          │
                        │   ai, database, config       │
                        └──────────────┬───────────────┘
                                       │
                          ┌────────────┴────────────┐
                          ▼                         ▼
                   Supabase/Postgres         Proveedor IA
```

- **`ValidationPipe` global** con `whitelist: true, forbidNonWhitelisted: true, transform: true` (NFR-SEG-002).
- **`JwtAuthGuard` global** por defecto (`APP_GUARD`), con decorador `@Public()` para rutas de auth (register/login/refresh/logout).
- **Resolución de propiedad**: los services filtran/validan **siempre** por `user_id` del recurso antes de leerlo o modificarlo (NFR-SEG-001).
- **`GlobalExceptionFilter`** que normaliza errores y devuelve mensajes genéricos ante fallas sensibles (sin filtrar detalles internos).

---

## 4. Estructura de archivos

```
api/
├── src/
│   ├── main.ts                      # bootstrap: pipes, cookies, CORS, prefijo /api
│   ├── app.module.ts                # módulo raíz (importa todos los módulos + config)
│   ├── app.setup.ts                 # configuración de la app (pipes, cookies, CORS, prefijo)
│   ├── config/
│   │   └── configuration.ts         # carga y normaliza env
│   ├── database/
│   │   ├── data-source.ts           # DataSource de los scripts (`seed`, `db:*`)
│   │   ├── database-maintenance.service.ts  # vaciar/recrear/sembrar (scripts `db:*`)
│   │   ├── database.module.ts
│   │   └── seeds/                   # seed determinístico + runners
│   ├── common/
│   │   ├── decorators/{ public, current-user }.decorator.ts
│   │   ├── dto/{ pagination, period }.dto.ts
│   │   ├── errors/{ api.exception.ts, error-codes.ts }
│   │   ├── filters/http-exception.filter.ts
│   │   ├── guards/{ jwt-auth.guard.ts }
│   │   ├── transformers/numeric.transformer.ts
│   │   └── types/{ auth-user.ts, financial-enums.ts }
│   ├── auth/
│   │   ├── auth.module.ts / auth.controller.ts / auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/{ register, login, auth-response }.dto.ts
│   ├── users/
│   │   ├── users.module.ts / users.controller.ts / users.service.ts
│   │   ├── dto/{ update-user.dto.ts, user-response.dto.ts }
│   │   └── entities/user.entity.ts
│   ├── accounts/                    # CRUD de un solo dominio
│   │   ├── accounts.module.ts / accounts.controller.ts / accounts.service.ts
│   │   ├── dto/{ create-account, update-account, account-response }.dto.ts
│   │   └── entities/account.entity.ts
│   ├── categories/                  # categorías del sistema + propias (CRUD)
│   ├── currencies/                  # catálogo global + cotizaciones de la API
│   │   ├── currencies.module.ts / currencies.controller.ts / currencies.service.ts
│   │   ├── currency-catalog.ts
│   │   ├── exchange-rates.provider.ts
│   │   └── dto/currency-response.dto.ts
│   ├── transactions/               # orquestador por transferencias
│   │   ├── transactions.module.ts / transactions.controller.ts
│   │   ├── transactions.service.ts / transactions.orchestrator.ts
│   │   ├── dto/{ create-transaction, update-transaction, transaction-response }.dto.ts
│   │   └── entities/transaction.entity.ts
│   ├── dashboard/                   # orquestador de KPIs y series
│   │   ├── dashboard.module.ts / dashboard.controller.ts / dashboard.orchestrator.ts
│   │   └── dto/{ dashboard-query.dto.ts, dashboard-response.dto.ts }
│   ├── assistant/                   # IA de solo consulta
│   │   ├── assistant.module.ts / assistant.controller.ts / assistant.service.ts
│   │   ├── assistant-context.service.ts
│   │   └── dto/assistant-message.dto.ts
│   └── shared/
│       ├── account-balances/        # read model: saldo de cuenta (accounts + transactions)
│       ├── ai/                      # cliente del proveedor de LLM
│       └── calculations/            # reglas CAL-001/002/003/010
├── test/                            # e2e (supertest) e integración
├── .env.example                     # plantilla de variables (no versionar .env)
├── package.json
└── tsconfig.json
```

**Nota sobre la estructura por módulo** (se repite en `accounts`, `transactions`, `categories`, `users`): cada uno contiene `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` y, cuando corresponde, `entities/`. El patrón es:

```
<feature>/
├── <feature>.module.ts         # importa TypeOrmModule.forFeature([entidades propias]) + deps
├── <feature>.controller.ts     # rutas REST, decoradores de auth
├── <feature>.service.ts        # casos de uso de un solo dominio (un método por caso de uso)
├── <feature>.orchestrator.ts   # casos de uso compuestos (coordinan otros dominios); sin queries
├── dto/                        # create-*.dto.ts, update-*.dto.ts, query-*.dto.ts
└── entities/                   # entidades TypeORM del dominio
```

**Regla de módulos (ver `api/.agents/skills/orchestrator-domain-architecture`):**

- Un **servicio primario** accede **solo a su propio repositorio/entidad** y reutiliza los proveedores compartidos (`calculations`, `account-balances`, `ai`). Nunca llama a otro servicio primario.
- Los casos de uso que **cruzan dominios** se implementan en un `<feature>.orchestrator.ts` que coordina los servicios implicados y devuelve DTOs de respuesta; el orquestador **no** ejecuta queries.
- El saldo de cuenta (dos valores derivados del cruce `accounts` + `transactions`) se centraliza en el proveedor de `shared/account-balances` para evitar ciclos de módulos.
- Orquestadores actuales: `transactions` (validación de cuentas/categorías) y `dashboard` (read model de KPIs y series). Los módulos `accounts`, `categories` y `users` son CRUD de un solo dominio (controller → servicio). El armado de contexto del asistente (`assistant-context.service.ts`) inyecta servicios, no repositorios.
- **Excepción acotada:** `auth` comparte el agregado de identidad `users` (registro y credenciales) con `users`; es la autoridad de credenciales y accede al `User` directamente. El resto de los dominios consume usuarios vía `UsersService`.

---

## 5. Modelo de datos (PostgreSQL)

Tablas derivadas de las entidades principales del FRD v0.3 (§3.2). Todos los `id` son `uuid` v4. Toda tabla con datos de usuario lleva `user_id` (o desciende de una entidad que lo tiene) y un índice.

> **Convención de columnas:** `snake_case` en la DB; los enums se almacenan como `text` con validación en la capa de aplicación (valores en §7.10); los `numeric` se serializan como `number` en la API (ver §7.9).

### 5.1 `users`

| Columna                 | Tipo        | Notas                     |
| :---------------------- | :---------- | :------------------------ |
| id                      | uuid PK     | default gen_random_uuid() |
| name                    | text        |                           |
| email                   | text UNIQUE | lowercase                 |
| password_hash           | text        | argon2                    |
| primary_currency        | text        | moneda principal, default `ARS` |
| created_at / updated_at | timestamptz |                           |

> El usuario elige su **moneda principal** (`primary_currency`). Las cotizaciones son globales y las provee la API; el usuario no las crea ni las edita. El asistente es de solo consulta (siempre disponible con sesión válida).

### 5.2 Sesiones (sin tabla)

> No existe una tabla de sesiones. La autenticación es **JWT stateless**: el access token y el refresh token son autocontenidos y firmados; no hay estado de sesión en la base ni revocación server-side. El logout solo limpia las cookies del cliente.

### 5.3 `accounts` (FR-CUE-001..005)

| Columna                 | Tipo          | Notas                                   |
| :---------------------- | :------------ | :-------------------------------------- |
| id                      | uuid PK       |                                         |
| user_id                 | uuid FK       |                                         |
| name                    | text          |                                         |
| type                    | text          | 'cash' \| 'bank' \| 'wallet' \| 'other' |
| currency                | text          | ISO 4217 de la cuenta (FR-CUE-002)      |
| initial_balance         | numeric(18,4) |                                         |
| notes                   | text NULL     |                                         |
| created_at / updated_at | timestamptz   |                                         |

> Saldo actual = `initial_balance` + Σ(movimientos) (calculado, FR-CUE-004), siempre en la moneda de la cuenta. La **eliminación** de una cuenta elimina en cascada sus movimientos asociados (FR-CUE-005); no hay archivado ni restauración. La moneda **no se puede cambiar** si la cuenta ya tiene movimientos (FR-CUE-002). No hay tipo `card`.

### 5.4 `categories` — del sistema y propias (FR-CAT-001..003)

| Columna | Tipo                 | Notas                                                                         |
| :------ | :------------------- | :---------------------------------------------------------------------------- |
| id      | uuid PK              |                                                                               |
| user_id | uuid FK NULL → users | `NULL` = categoría del sistema (global); valor = categoría propia del usuario |
| name    | text                 | único por usuario + tipo (case-insensitive)                                   |
| type    | text                 | 'income' \| 'expense' (inmutable al editar)                                   |
| color   | text                 | hex                                                                           |
| icon    | text NULL            |                                                                               |

> Las cinco categorías del sistema (`user_id NULL`) son **globales y de solo lectura**. Cada usuario puede crear, renombrar/recolorear y eliminar las suyas; el `type` no se modifica una vez creada. Al eliminar una categoría propia, sus movimientos quedan con `category_id NULL` y se muestran como “Sin categoría”. El seed crea solo las cinco del sistema (§11.4).

### 5.5 `transactions` (FR-TRX-001..005)

| Columna                 | Tipo                      | Notas                                                                                                                          |
| :---------------------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| id                      | uuid PK                   |                                                                                                                                |
| user_id                 | uuid FK                   |                                                                                                                                |
| type                    | text                      | 'income' \| 'expense' \| 'transfer'                                                                                            |
| amount                  | numeric(18,4)             | en `income`/`expense` se guarda positivo; en transferencias cada pata lleva el signo (negativo en origen, positivo en destino) |
| date                    | date                      |                                                                                                                                |
| description             | text                      |                                                                                                                                |
| notes                   | text NULL                 |                                                                                                                                |
| account_id              | uuid FK → accounts        |                                                                                                                                |
| transfer_account_id     | uuid FK NULL → accounts   | solo transferencias; distinto de account_id (FR-TRX-004)                                                                       |
| category_id             | uuid FK NULL → categories | obligatoria en `income`/`expense`; nula en transferencias                                                                      |
| transfer_group_id       | uuid NULL                 | agrupa las dos patas de una transferencia                                                                                      |
| created_at / updated_at | timestamptz               |                                                                                                                                |

> Las transferencias se persisten como **dos filas** (`type='transfer'`) en una transacción de base de datos con el mismo `transfer_group_id`. En una transferencia multimoneda cada pata lleva el monto en la moneda de su cuenta (monto origen y monto destino); la cotización usada en la UI **no se persiste** (FR-TRX-002). Se excluyen de ingresos/gastos consolidados (CAL-003). Sin campo `currency` en el movimiento: el monto vive en la moneda de la cuenta. Las transferencias se pueden filtrar en la UI; la API mantiene paginación.

### 5.6 Cotizaciones (sin tabla)

> No existe una tabla de cotizaciones. Las cotizaciones son globales, las provee la API pública y el backend las consulta **en cada lectura**; no se persisten (RN-016). La UI las usa para re-expresar el dashboard en la moneda de lectura y para el desglose por moneda. Si el proveedor falla, el endpoint responde `502 EXCHANGE_RATES_UNAVAILABLE`.

---

## 6. Autenticación y autorización (JWT)

### 6.1 Registro (`POST /auth/register`)

1. Valida nombre (2–80), email (formato, único, lowercase), contraseña y moneda principal (código ISO 4217 del catálogo). **Política de contraseña:** 8–72 caracteres, al menos una letra y un número. Rechaza campos inesperados (NFR-SEG-002).
2. Hashea con argon2 y crea el usuario. Fija las cookies de access y refresh y responde `{ user }` (login automático).

### 6.2 Login (`POST /auth/login`)

1. Verifica credenciales; respuestas genéricas ante falla (sin revelar si el email existe).
2. Emite **access token** (JWT, vida corta ~15 min) y **refresh token** (JWT, vida ~30 días). Ambos llevan un claim `type` para impedir usarlos indistintamente.
3. Responde `{ user }` y fija las cookies `access_token` y `refresh_token` (`HttpOnly; Secure; SameSite=Lax` en producción; NFR-SEG-004). Los tokens **no** se exponen en el body.
4. **Transporte exclusivo por cookie**: el cliente web no lee ni persiste tokens en JavaScript.

### 6.3 Renovación

- `POST /auth/refresh` verifica el refresh token JWT de la cookie `refresh_token`, emite tokens nuevos y responde `204 No Content`. No acepta tokens por body.
- No hay rotación con invalidación: el refresh token anterior sigue siendo válido hasta su expiración. Tampoco hay detección de reutilización.

### 6.4 Logout (`POST /auth/logout`)

- Solo limpia las cookies `access_token` y `refresh_token`. Al ser JWT stateless, el token ya emitido sigue siendo válido hasta su expiración; no existe revocación server-side.

### 6.5 Autorización por request (NFR-SEG-001)

- `JwtAuthGuard` global valida firma y expiración del access token en **cada** operación, leyéndolo exclusivamente de la cookie `HttpOnly`. También exige `type: "access"`.
- Los controllers obtienen el usuario vía `@CurrentUser()` y filtran/validan **siempre** por `user_id` del recurso.
- Regla de oro: **ningún `id` aportado por el cliente otorga autorización**; el servidor resuelve la propiedad.
- No hay consulta a la base ni cache de validación de sesión.

---

## 7. API REST por módulo

Prefijo global `/api`. Respuestas paginadas: `{ items, page, pageSize, total, totalPages }`. Errores: `{ statusCode, code, message, fieldErrors? }`. Todos los endpoints de datos (salvo `@Public()`) requieren sesión.

### 7.1 Auth

| Método | Ruta             | FR          |
| :----- | :--------------- | :---------- |
| POST   | `/auth/register` | FR-AUT-001  |
| POST   | `/auth/login`    | FR-AUT-002  |
| POST   | `/auth/logout`   | FR-AUT-002  |
| POST   | `/auth/refresh`  | NFR-SEG-004 |
| GET    | `/auth/me`       | —           |

> **Web-only:** register/login responden `{ user }` y fijan cookies `HttpOnly`; `/auth/refresh` lee solo la cookie `refresh_token` y responde `204`; no se aceptan tokens por body ni `Authorization: Bearer`.
>
> **Eliminados:** recuperación de contraseña (`/auth/forgot-password`, `/auth/reset-password`).

### 7.2 Users

| Método | Ruta                 | FR          |
| :----- | :------------------- | :---------- |
| PATCH  | `/users/me`          | FR-CFG-003  |
| PATCH  | `/users/me/password` | FR-CFG-003  |

```jsonc
// PATCH /users/me — body (todos los campos son opcionales)
{ "name": "Ana", "email": "ana@example.com", "primaryCurrency": "ARS" }
// 200 → User (incluye primaryCurrency)
// 409 EMAIL_IN_USE si otro usuario ya usa ese email

// PATCH /users/me/password — body
{ "currentPassword": "Secreta123", "newPassword": "Nueva123" }
// 204 → sin body
// 400 VALIDATION_ERROR si la contraseña actual no coincide o la nueva no cumple la política

// Política de contraseña: 8–72 caracteres, al menos una letra y un número.
```

- El email se normaliza a lowercase y debe ser único entre usuarios.
- El cambio de contraseña exige la contraseña actual y la hashea con argon2.
- No existe recuperación de contraseña por email.
- Al ser JWT stateless, cambiar la contraseña no revoca los tokens ya emitidos; siguen vigentes hasta expirar.

### 7.3 Accounts

| Método | Ruta            | FR                                                          |
| :----- | :-------------- | :---------------------------------------------------------- |
| GET    | `/accounts`     | listado con saldo actual (FR-CUE-004)                       |
| POST   | `/accounts`     | FR-CUE-001/002                                              |
| GET    | `/accounts/:id` | —                                                           |
| PATCH  | `/accounts/:id` | FR-CUE-003                                                  |
| DELETE | `/accounts/:id` | FR-CUE-003; elimina en cascada sus movimientos (FR-CUE-005) |

> **Eliminados:** `POST /accounts/:id/archive` y `/restore` y el tipo `card`. La cuenta expone `currency` (FR-CUE-002) y no permite cambiarla si ya tiene movimientos.

### 7.4 Categories

| Método | Ruta              | FR                                                                 |
| :----- | :---------------- | :----------------------------------------------------------------- |
| GET    | `/categories`     | categorías del sistema + propias (FR-CAT-001)                      |
| POST   | `/categories`     | crear una categoría propia (FR-CAT-002)                            |
| PATCH  | `/categories/:id` | editar una propia (`name`, `color`; `type` inmutable) (FR-CAT-002) |
| DELETE | `/categories/:id` | eliminar una propia (FR-CAT-003)                                   |

> Las categorías del sistema (`isSystem: true`) no se pueden editar ni eliminar: responden `404`. Las categorías de otro usuario tampoco se exponen (`404`). Nombre duplicado (mismo usuario/tipo) → `400 VALIDATION_ERROR` con `fieldErrors.name`.

### 7.5 Transactions

| Método | Ruta                          | FR                                                    |
| :----- | :---------------------------- | :---------------------------------------------------- |
| GET    | `/transactions?page&pageSize` | listado paginado (FR-TRX-003)                         |
| POST   | `/transactions`               | FR-TRX-001/002 (transferencia atómica FR-TRX-004/005) |
| GET    | `/transactions/:id`           | —                                                     |
| PATCH  | `/transactions/:id`           | FR-TRX-003                                            |
| DELETE | `/transactions/:id`           | FR-TRX-003                                            |

> **Filtros de la UI:** la búsqueda, el tipo, la cuenta, la categoría, la moneda y el período se aplican en el cliente sobre la página cargada. La API mantiene paginación (`page`, `pageSize`). En transferencias multimoneda el request incluye `transferAmount` (monto que llega a destino); la cotización no se envía ni se persiste.

### 7.6 Dashboard

| Método | Ruta                 | FR                                                                      |
| :----- | :------------------- | :---------------------------------------------------------------------- |
| GET    | `/dashboard?from&to&currency` | agrega KPIs y series del período; `currency` es la moneda de visualización (default: principal) |

```ts
// 200 → DashboardData
{
  period: {
    from: string;
    to: string;
  }
  currency: string; // moneda de visualización (default: principal)
  primaryCurrency: string; // moneda principal elegida por el usuario
  rateDate: string | null;
  availableCurrencies: string[];
  breakdown: { currency: string; balance: number; accounts: number; converted: number }[];
  rates: { currency: string; rate: number; rateDate: string }[];
  kpis: {
    netWorth: number;
    netWorthDeltaPct: number | null;
    income: number;
    incomeDeltaPct: number | null;
    expenses: number;
    expensesDeltaPct: number | null;
    savings: number;
    savingsDeltaPct: number | null;
    savingsRateDeltaPp: number | null;
  }
  netWorthSeries: {
    date: string;
    value: number;
  }
  [];
  incomeExpenseByPeriod: {
    bucket: "week" | "month";
    start: string;
    end: string;
    income: number;
    expenses: number;
  }
  [];
  incomeExpenseByMonth: {
    month: string;
    income: number;
    expenses: number;
  }
  [];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }
  [];
}
```

- **Período (FR-DAS-007):** `from`/`to` son seleccionables (default: últimos 180 días). El header de Inicio tiene el **selector de moneda de lectura** antes del período (CH-77), con las monedas en uso y **“Otra moneda”** para el catálogo completo; por defecto usa la moneda principal y `currency` permite re-expresar todo el dashboard en otra unidad.
- **Patrimonio neto (CAL-001, §8):** Σ (saldo × cotización) de las cuentas, en la moneda de lectura. La serie histórica evalúa esa suma por día si el rango tiene ≤ 31 días (mes en curso o últimos 30 días) y al cierre de cada mes en el resto de los rangos. `breakdown` expone cada moneda nativa y su equivalente en la moneda de lectura; `rates` expone la cotización usada y su fecha.
- **Flujos (CAL-002):** cada ingreso/gasto se convierte desde la moneda de su cuenta a la moneda de lectura con la cotización de la API y luego se suma. Las transferencias se excluyen (CAL-003). El header de Inicio tiene el selector de moneda de lectura antes del período (CH-77); Categorías tiene el mismo selector de visualización.
- **Moneda de lectura:** la UI de Inicio usa la moneda principal por defecto y el selector del header permite ver todos los valores en otra unidad sin alterar datos (RN-014). El desglose por moneda del hero solo aparece cuando hay cuentas en más de una moneda.
- **Granularidad (FR-DAS-003/007):** para rangos de ≤ 31 días, `incomeExpenseByPeriod` devuelve tramos semanales (`bucket: "week"`); para rangos mayores, tramos mensuales (`bucket: "month"`). `incomeExpenseByMonth` se conserva para el contexto del asistente.
- **Tasa de ahorro (CAL-010, §8):** `kpis.savingsRateDeltaPp` expresa en **puntos porcentuales** la variación de la tasa de ahorro contra el período anterior, calculada sobre los flujos convertidos.
- **Eliminados:** `kpis.assets/debts/accounts/investmentsDeltaPct`, `assetsValueByMonth`, `categoryChanges`, `assetsComposition`, `netWorthComposition`, `cashflow`, `investments`, `budgetAlerts`.

### 7.7 Assistant — solo consulta (FR-IA-002/015)

| Método | Ruta                  | FR                                            |
| :----- | :-------------------- | :-------------------------------------------- |
| POST   | `/assistant/messages` | requiere sesión; responde con stream SSE (FR-IA-002) |

- **Solo consulta:** no crea, edita ni elimina datos (FR-IA-015). Si el usuario pide una acción de escritura, el asistente explica que solo responde consultas.
- **Sin estado:** no hay conversaciones persistidas ni acciones/propuestas. No existe historial en el servidor; el cliente puede enviar los turnos recientes en `history` para dar continuidad a la conversación (memoria en memoria del cliente, acotada).
- El estado del asistente no es una preferencia del usuario: con sesión válida siempre está disponible.
- **Eliminados:** `GET/DELETE /assistant/conversations*`, `POST /assistant/actions/:id/confirm|cancel`, los eventos `action_proposal`/`action_error`, las preferencias `aiEnabled`/`assistantDestructiveEnabled` y la confirmación de escrituras.

### 7.8 Currencies — catálogo y cotizaciones

| Método | Ruta               | FR/RN                                              |
| :----- | :----------------- | :------------------------------------------------- |
| GET    | `/currencies`      | catálogo global de 54 monedas ISO 4217             |
| GET    | `/currencies/rates` | moneda principal + cotizaciones de las monedas usadas por las cuentas |

```jsonc
// GET /currencies → [{ code, name, symbol, decimals }]
// GET /currencies/rates
{
  "primaryCurrency": "ARS",
  "rates": [
    { "currency": "USD", "name": "Dólar estadounidense", "symbol": "US$",
      "rate": 1521.625293, "rateDate": "2026-10-26", "source": "api" }
  ],
  "updatedAt": "2026-10-26T13:06:19.000Z"
}
```

> Endpoints de **solo lectura**. El usuario no crea monedas ni edita cotizaciones (RN-016); el backend consulta la API global en cada request y no persiste las cotizaciones. `rate` está expresada en la moneda principal.

### 7.9 Convenciones de contrato

- **Casing:** la base de datos usa `snake_case`; la **API JSON usa `camelCase`**. Las entidades TypeORM no se exponen: se serializan con DTOs/mappers (`initial_balance` → `initialBalance`).
- **IDs:** `uuid` v4.
- **Fechas:** los campos `date` viajan como `"YYYY-MM-DD"`; los `timestamptz` como ISO 8601 UTC (`"2026-09-11T14:30:00.000Z"`).
- **Decimales:** `numeric` se serializa como **number** (no string). Máx. 4 decimales para montos y 6 para cotizaciones. Implementar un `transformer` de TypeORM (`parseFloat` al leer) o mappers de salida.
- **Paginación:** query `page` (default 1) y `pageSize` (default 20, máx. 100). Respuesta: `{ items, page, pageSize, total, totalPages }`. Solo `/transactions` es paginado; `/accounts` y `/categories` devuelven un **array** completo.
- **Errores:** `{ statusCode, code, message, fieldErrors? }`; `fieldErrors` es `{ [campo]: string[] }` para validación (para mapeo a formularios). El filtro global nunca expone detalles internos.
- **Auth:** exclusivamente cookie `HttpOnly`. Los endpoints `@Public()` son: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` y `GET /currencies`.
- **CORS:** con credenciales habilitadas; permitir `CORS_ORIGIN` exacto (no `*`); admite varios orígenes separados por coma.

### 7.10 Enums y catálogos

| Concepto             | Valores                                 |
| :------------------- | :-------------------------------------- |
| `AccountType`        | `cash` \| `bank` \| `wallet` \| `other` |
| `TransactionType`    | `income` \| `expense` \| `transfer`     |
| `CategoryType`       | `income` \| `expense`                   |
| `UserApprovalStatus` | `pending` \| `approved` \| `rejected`   |

- **Moneda:** catálogo global de 54 códigos ISO 4217 (`GET /currencies`). Cada cuenta declara su moneda; el usuario elige `primaryCurrency`. Las cotizaciones son globales (`GET /currencies/rates`) y las refresca el backend desde la API; el cliente no las crea ni edita.
- **Categorías** (semilla): income (`Sueldo`, `Freelance`), expense (`Supermercado`, `Transporte`, `Servicios`). Son globales y de solo lectura; cada usuario puede crear las suyas (ver §7.4).
- **Eliminados:** `AssetType`, `DebtType`, `BudgetStatus`, `GoalStatus`, `Theme`, `ValuationSource` y el catálogo de mercado.

### 7.11 Esquemas de request/response por módulo

**Auth**

```jsonc
// POST /auth/register — body
{ "name": "Ana", "email": "ana@example.com", "password": "Secreta123", "primaryCurrency": "ARS" }
// 201 → { "user": User }  (además fija las cookies de access y refresh)

// POST /auth/login — body
{ "email": "ana@example.com", "password": "Secreta123" }
// 200 → { "user": User }  (y fija cookies)

// POST /auth/refresh — sin body; usa la cookie refresh_token
// 204 → sin body; rota las cookies de access y refresh

// User
{ "id": "uuid", "name": "Ana", "email": "ana@example.com", "primaryCurrency": "ARS", "createdAt": "ISO" }
```

**Accounts**

```jsonc
// POST /accounts — body
{ "name": "Caja", "type": "cash", "currency": "ARS", "initialBalance": 50000, "notes": null }
// Account
{ "id": "uuid", "name": "Caja", "type": "cash", "currency": "ARS",
  "initialBalance": 50000, "currentBalance": 73500, "notes": null,
  "createdAt": "ISO", "updatedAt": "ISO" }
```

**Categories**

```jsonc
// GET /categories → Category[]
{ "id": "uuid", "name": "Supermercado", "type": "expense",
  "color": "#ef4444", "icon": "shopping-cart", "isSystem": true }

// POST /categories — body
{ "name": "Mascotas", "type": "expense", "color": "#f97316" }

// PATCH /categories/:id — body (todos opcionales)
{ "name": "Mascotas y pets", "color": "#ef4444" }
```

**Transactions**

```jsonc
// POST /transactions — income | expense
{ "type": "expense", "amount": 12000, "date": "2026-09-10",
  "description": "Supermercado", "notes": null, "accountId": "uuid", "categoryId": "uuid" }

// POST /transactions — transfer (un solo request, dos filas atómicas)
{ "type": "transfer", "amount": 100000, "transferAmount": 65.72,
  "date": "2026-10-15", "description": "Compra de dólares",
  "accountId": "uuid-origen-ARS", "transferAccountId": "uuid-destino-USD" }

// Transaction
{ "id": "uuid", "type": "expense", "amount": 12000, "date": "2026-09-10",
  "description": "Supermercado", "notes": null, "accountId": "uuid",
  "transferAccountId": null, "categoryId": "uuid",
  "transferGroupId": null, "createdAt": "ISO", "updatedAt": "ISO" }
```

- `amount` es positivo en `income`/`expense` (el signo lo determina `type`, CAL-002/003). En transferencias, cada pata se persiste con signo opuesto: negativa en la cuenta origen y positiva en la destino; en multimoneda `transferAmount` es el monto que llega a destino y la cotización no se persiste.
- `transferGroupId` no nulo agrupa las dos patas de una transferencia.
- `DELETE /transactions/:id` de una transferencia elimina **ambas patas** del grupo.
- `PATCH /transactions/:id` de una transferencia edita **ambas patas** atómicamente (si cambian `accountId`/`transferAccountId`, se reasignan).
- Validación: `accountId !== transferAccountId` en transferencias; cuenta y categoría válidas (cuenta del usuario, categoría del sistema o propia del usuario, con tipo coincidente) (FR-TRX-004).

### 7.12 Contrato de streaming del asistente

`POST /assistant/messages` responde `text/event-stream` (SSE). **El cliente debe usar `fetch` + `ReadableStream`, no `EventSource`**, porque `EventSource` no permite enviar un cuerpo POST.

**Proveedor implementado: DeepSeek** (OpenAI-compatible). El backend llama a `POST {AI_BASE_URL}/chat/completions` con `Authorization: Bearer {AI_API_KEY}`, `stream: true` y `model: {AI_MODEL}` (default `deepseek-chat`), y reemite el texto como eventos SSE. La API key **nunca** sale del servidor (NFR-SEG-007).

```jsonc
// Request body
{ "question": "¿Y lo del auto?", "period": { "from": "2026-09-01", "to": "2026-09-30" }, "history": [{ "role": "user", "content": "¿Es inteligente comprar un auto por 2.750.000?" }, { "role": "assistant", "content": "Equivale a casi todo tu patrimonio." }] }

// Eventos SSE (cada uno: `event: <nombre>\ndata: <json>\n\n`)
event: meta    data: { "period": {...}, "currency": "ARS", "sources": ["transactions", "accounts", "categories", "currencies"], "disclaimer": "Respuesta informativa calculada a partir de tus datos; no constituye asesoramiento financiero." }
event: token   data: { "delta": "Este mes " }
event: token   data: { "delta": "gastaste más en..." }
event: done    data: { "insufficient": false }
event: error   data: { "code": "AI_UNAVAILABLE", "message": "..." }
```

- **Contexto mínimo (FR-IA-002):** el `assistant-context.service` reutiliza el read model del dashboard (ingresos, gastos, ahorro, patrimonio neto, gastos por categoría, evolución mensual y saldos de cuentas) y arma un resumen textual. No re-deriva fórmulas ni consulta repositorios directamente.
- **Sin estado y sin tools:** no hay historial persistido ni _function calling_. El historial conversacional es opcional (`history`, máx. 12 mensajes), lo envía el cliente desde su memoria y se usa solo como contexto del período actual (FR-IA-016). El prompt de sistema es fijo, separa instrucciones de datos y declara el alcance de **solo consulta** (FR-IA-015, NFR-SEG-012).
- **Insuficiencia:** si el modelo no devuelve texto utilizable, se emite un mensaje explicativo y `done: { insufficient: true }`.
- **Acceso:** `POST /assistant/messages` requiere sesión; el usuario se obtiene de `@CurrentUser()` y no hay fallback a un usuario demo.
- La respuesta del modelo se sirve como texto plano; nunca como HTML (NFR-SEG-006/012).

### 7.13 Catálogo de códigos de error

| `code`                | HTTP | Cuándo                               |
| :-------------------- | :--- | :----------------------------------- |
| `VALIDATION_ERROR`    | 400  | DTO inválido (incluye `fieldErrors`) |
| `INVALID_CREDENTIALS` | 401  | login fallido                        |
| `UNAUTHENTICATED`     | 401  | sin sesión o token inválido/expirado |
| `SESSION_REVOKED`     | 401  | refresh token ausente o inválido     |
| `FORBIDDEN`           | 403  | recurso de otro usuario              |
| `NOT_FOUND`           | 404  | recurso inexistente o ajeno          |
| `EMAIL_IN_USE`        | 409  | registro con email existente         |
| `AI_UNAVAILABLE`      | 502  | falla del proveedor de IA            |
| `EXCHANGE_RATES_UNAVAILABLE` | 502 | falla del proveedor de cotizaciones |
| `INTERNAL_ERROR`      | 500  | error inesperado (mensaje genérico)  |

> **Eliminados:** `AI_DISABLED`, `DESTRUCTIVE_DISABLED`, `ACTION_NOT_ALLOWED`, `ACTION_ALREADY_EXECUTED`, `ACTION_EXPIRED`, `ACTION_DEPENDENCY_PENDING`, `ACCOUNT_ARCHIVED`, `CATEGORY_ARCHIVED`, `DUPLICATE_BUDGET`, `MARKET_UNAVAILABLE`.

> `GET /currencies` y `GET /currencies/rates` son de solo lectura: catálogo global y cotizaciones de las monedas usadas por las cuentas. No existen endpoints para crear monedas ni para editar cotizaciones.

### 7.14 Referencia de la API

El contrato REST de este documento (`backend.md` §7) es la fuente de verdad. La API **no** publica Swagger/OpenAPI ni una referencia interactiva (Scalar): se removieron para reducir la superficie.

---

## 8. Reglas de cálculo

Centralizadas en `calculations.service.ts` para garantizar consistencia entre dashboard y asistente. Cubiertas por pruebas unitarias (NFR-CAL-004). El patrimonio neto, la serie histórica y la tasa de ahorro se arman en `dashboard.orchestrator.ts` reutilizando ese service.

| Regla                   | Implementación                                                                                                                                                                                                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAL-001 Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, en la moneda de lectura. Implementado en `calculations.service.netWorthInCurrency` y reutilizado por `dashboard.orchestrator` para los KPIs y las series; `assistant-context.service` lo consume vía el dashboard. |
| CAL-002 Flujo de fondos | Σ ingresos − Σ gastos del período (excluye transferencias); cada flujo se convierte a la moneda de lectura con la cotización global. Implementado en `calculations.service.calculatePeriodFlows`. |
| CAL-003 Transferencias  | `type='transfer'` se excluye de ingresos/gastos consolidados; en multimoneda cada pata guarda su monto y la cotización usada no se persiste. |
| CAL-010 Tasa de ahorro  | ahorro del período / ingresos del período × 100, calculado sobre los flujos convertidos a la moneda de lectura; si los ingresos del período son 0, la tasa es 0. Su **variación** se expresa en **puntos porcentuales**: `kpis.savingsRateDeltaPp = (tasa actual − tasa del período anterior) × 100`. Implementado en `dashboard.orchestrator`. |

> **Eliminadas:** CAL-004 (consumo de presupuesto), CAL-005 (valor de posición), CAL-006 (ganancia nominal), CAL-007 (progreso de objetivo), CAL-008/CAL-009 (conversión y trazabilidad cambiaria).

---

## 9. Integraciones externas

Todas desde el backend, con timeout, validación de host, HTTPS y redirecciones deshabilitadas (NFR-SEG-009).

### 9.1 Proveedor de IA (actor "Proveedor de IA")

`assistant.service.ts` + `shared/ai/ai.service.ts`:

1. Resuelve el usuario de la sesión (o el usuario dev cuando corresponde, §7.12).
2. Calcula **localmente** totales y métricas del período (FR-IA-002) reutilizando el read model del dashboard (`DashboardOrchestrator`, que a su vez usa `calculations.service`), para no duplicar fórmulas.
3. Construye el **contexto mínimo** (solo datos del usuario autenticado) y envía la pregunta al LLM.
4. El prompt de sistema es fijo y **separado** de los datos del usuario, que viajan como datos no confiables (NFR-SEG-012). Se valida la salida antes de presentarla.
5. Adjunta metadatos: período, moneda y fuentes consideradas.
6. Declara "información insuficiente" cuando los datos no permiten conclusión verificable.
7. **No** modifica datos: el asistente es de **solo consulta** (FR-IA-015). No hay herramientas de escritura ni confirmación de acciones.

**Implementación actual (DeepSeek):**

- `shared/ai/ai.service.ts` (`AiModule`): cliente del proveedor (DeepSeek/OpenAI-compatible) con `axios` `responseType: "stream"`, timeout de `AI_TIMEOUT_MS` y aborto; expone `streamChat(messages)` como `AsyncGenerator<string>`. Mapea fallas a `AI_UNAVAILABLE` (NFR-SEG-009).
- `assistant/assistant-context.service.ts`: arma el contexto mínimo reutilizando `DashboardOrchestrator.getDashboard` (ingresos, gastos, ahorro, gastos por categoría, patrimonio neto, evolución mensual) y `AccountsService` (saldos de cuentas), y produce un resumen textual.
- `assistant/assistant.service.ts`: recibe el usuario autenticado, construye el prompt y el contexto, y devuelve un generador de eventos (`meta`/`token`/`done`). El prompt de sistema declara explícitamente el alcance de **solo consulta** y que no debe inventar cifras.
- `assistant/assistant.controller.ts`: `POST /assistant/messages` (SSE); ante falla emite `event: error`.
- El cliente consume el stream real en `client/lib/api/assistant-stream.ts`.

> **Eliminados:** Binance, servicio de correo (SMTP), `@nestjs/schedule` y la tabla `currency_rates`. La **currency-api de Fawaz Ahmed** (pública, sin API key) se usa en `ExchangeRatesProvider` para obtener las cotizaciones globales en cada lectura; no hay caché persistente ni en memoria. Si el proveedor falla, el endpoint responde `502 EXCHANGE_RATES_UNAVAILABLE`.

---

## 10. Seguridad

| NFR         | Implementación                                                                                   |
| :---------- | :----------------------------------------------------------------------------------------------- |
| NFR-SEG-001 | `JwtAuthGuard` global + resolución de propiedad por `user_id` en cada consulta.                  |
| NFR-SEG-002 | `ValidationPipe` global con whitelist y forbidNonWhitelisted; límites/longitud/formato en DTOs.  |
| NFR-SEG-003 | `argon2` para hashing; nunca texto plano.                                                        |
| NFR-SEG-004 | Cookies HttpOnly/Secure/SameSite, expiración y renovación del access token con refresh JWT.      |
| NFR-SEG-005 | `uuid` no predecibles; consultas parametrizadas (TypeORM); el ID cliente no otorga autorización. |
| NFR-SEG-006 | El backend devuelve JSON/texto; el front escapa todo HTML.                                       |
| NFR-SEG-007 | Secretos solo en servidor vía env, fuera del repositorio (`.env` ignorado).                      |
| NFR-SEG-008 | Logging sin contraseñas, tokens, prompts completos ni datos sensibles.                           |
| NFR-SEG-009 | Llamadas salientes con HTTPS, timeout y sin seguir redirecciones (cliente `axios` de IA).        |
| NFR-SEG-012 | Separación instrucciones/datos; validación de salida del modelo.                                 |


---

## 11. Base de datos y datos de demostración

### 11.1 Estrategia: sin migraciones (decisión consciente)

En esta etapa del proyecto **no usamos migraciones**. La decisión es deliberada, no una omisión:

> Si cambia el esquema, **no migramos** los datos existentes: vaciamos/recreamos la base y volvemos a ejecutar el seed.

- La **fuente de verdad del esquema son las entidades TypeORM** (`api/src/**/entities/*`).
- `synchronize: true` crea/actualiza el esquema al iniciar la app y al correr los scripts (`database.module.ts` y `database/data-source.ts`).
- No hay carpeta `migrations/`, ni comandos `migration:*`, ni tabla `migrations`.
- No hay mecanismos de preservación de datos entre cambios de esquema. El dataset es descartable y reproducible.

### 11.2 Flujo de trabajo

| Objetivo                                               | Comando            |
| :----------------------------------------------------- | :----------------- |
| Vaciar todas las tablas (conserva el esquema)          | `npm run db:clear` |
| Recrear el esquema desde las entidades + seed completo | `npm run db:reset` |
| Sembrar sin tocar el esquema (idempotente)             | `npm run seed`     |

```bash
npm run db:reset   # cambió el modelo / querés un estado limpio
npm run start:dev  # app lista con datos de demo
```

### 11.3 Usuarios de demo (determinísticos)

Todos comparten la contraseña **`Demo1234!`**:

| Email                     | Escenario                                                         |
| :------------------------ | :---------------------------------------------------------------- |
| `demo@atlassfin.app`      | Dataset completo (ver §11.4).                                     |
| `sin-datos@atlassfin.app` | Usuario vacío, para estados vacíos y onboarding.                  |
| `ana@atlassfin.app`       | Segundo usuario con un dataset mínimo, para aislamiento/permisos. |

### 11.4 Qué genera el seed

Datos **estructuralmente reproducibles** (sin información financiera real, NFR-CAL-005 / FRD §2.6). Para `demo@atlassfin.app`:

- **5 categorías fijas del sistema**: income (`Sueldo`, `Freelance`), expense (`Supermercado`, `Transporte`, `Servicios`). Además crea la categoría propia `Otros` para el usuario demo.
- **4 cuentas**: `cash` (Caja, ARS), `bank` (Banco, ARS), `wallet` (Billetera virtual, ARS) y `wallet` (Billetera USD, USD).
- **3 meses de movimientos** en ARS y USD: sueldos, gastos por categoría, transferencias atómicas (dos patas con `transfer_group_id`), un ingreso sin categoría, un ingreso freelance y una transferencia multimoneda con los dos montos.
- **Cotizaciones globales**: el seed consulta la API pública solo para calcular el monto destino de la transferencia multimoneda; no guarda cotizaciones. Ese monto puede variar según la cotización vigente al correr el seed. El dashboard obtiene las cotizaciones de la API en cada lectura.

Para `ana@atlassfin.app` genera un dataset reducido (una cuenta bancaria y un ingreso) para probar aislamiento y propiedades.

### 11.5 Idempotencia y reproducibilidad

- El seed verifica la existencia de `demo@atlassfin.app` antes de insertar; si ya existe, no pisa datos.
- `db:reset` siempre parte de cero y deja la misma estructura, usuarios, cuentas y movimientos: **repetir el ciclo produce un estado equivalente**. El monto USD de la transferencia multimoneda puede variar con la cotización de la API.
- Las fechas son relativas al mes en curso, por lo que el dashboard siempre tiene datos "actuales".

---

## 12. Configuración y variables de entorno

`.env.example` (nunca versionar `.env`):

```env
NODE_ENV=development
PORT=3001

# Base de datos (Supabase / Postgres)
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_SSL=true
DB_POOL_MAX=5                  # conexiones por instancia (chico en serverless)
DB_CONNECTION_TIMEOUT_MS=15000 # espera máx. por una conexión libre
DB_IDLE_TIMEOUT_MS=300000      # mantener conexiones ociosas (evita handshake TLS)

# JWT
JWT_ACCESS_SECRET=change-me
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL_DAYS=30

# Cookies
COOKIE_SECURE=false            # true en producción
COOKIE_SAME_SITE=lax

# Frontend (CORS)
CORS_ORIGIN=http://localhost:3000   # admite varios orígenes separados por coma

# IA (DeepSeek por defecto; OpenAI-compatible)
# La API key SIEMPRE vive en el servidor: nunca exponerla con NEXT_PUBLIC_* en el cliente.
AI_API_KEY=...                 # sk-... (solo en .env del backend)
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat         # deepseek-chat | deepseek-reasoner (u otro)
AI_TIMEOUT_MS=30000

# Tests de integración (e2e)
TEST_DATABASE_URL=postgresql://localhost:5432/atlas_finance_test
```

> **Eliminadas:** `MARKET_*`, `FX_API_URL`, `QUOTE_STALE_MS`, `SMTP_*`, `MAIL_FROM`, `RESET_TOKEN_TTL`, `BUDGET_WARNING_THRESHOLD`, `SUPPORTED_CURRENCIES` y `AI_ACTION_TTL_MS`.

### 12.1 Pool de conexiones (Supabase)

- El driver `pg` configura el pool con `DB_POOL_MAX` (default 5), `DB_CONNECTION_TIMEOUT_MS` (default 15000) y `DB_IDLE_TIMEOUT_MS` (default 300000). El pool abre conexiones on demand; `min = DB_POOL_MAX` y `keepAlive: true` evitan que las conexiones ya abiertas se cierren por inactividad. En serverless, bajá `DB_POOL_MAX` (2–3) para no retener conexiones de más.
- **Producción con Supabase:** usar la cadena del **transaction pooler** (puerto `6543`) para el `DATABASE_URL` del API y mantener `DB_POOL_MAX` chico (2–3) para no agotar el pooler. El dashboard es el más sensible porque ejecuta varias consultas en paralelo; sus lecturas usan proyecciones acotadas y las consultas independientes se ejecutan en paralelo.

---

## 13. Convenciones de código

- **Inglés en código** (nombres de clases, archivos, carpetas, endpoints); **español** solo en textos de UI/errores dirigidos al usuario.
- **Un caso de uso = un método** en el service; nombres en imperativo (`createAccount`, `transferBetweenAccounts`).
- **DTOs por operación** con `class-validator`; nunca exponer la entidad directamente.
- **Repositorios de TypeORM** inyectados en el service; no acceder a la DB desde controllers.
- **Manejo de errores**: excepciones `HttpException` con código de negocio estable; filtro global normaliza.
- **Transacciones** con `dataSource.transaction()` para operaciones multi-registro (transferencias).
- **`@CurrentUser()`** para obtener el usuario; prohibido leer `req.user` a mano en services.
- **Logging** vía `Logger` de Nest, sin datos sensibles (NFR-SEG-008).
- **Tests**: unitarios para `calculations.service` y services de dominio; e2e (`supertest`) para flujos P0 (NFR-CAL-004).
- **Sin comentarios innecesarios**.

---

## 14. Plan de trabajo por tandas

Cada tanda deja la API compilando (`npm run lint && npm run build`) y con entidades + tests asociados. Alineado con el plan del front (`frontend.md`).

### Tanda 0 — Setup del proyecto — ✅ Hecho

- Scaffold NestJS, config global (`@nestjs/config`), `ValidationPipe`, `Logger`, prefijo `/api`, CORS, cookies.
- TypeORM + DataSource + entidades del modelo v0.3 (usuarios, cuentas, categorías, movimientos).
- `common/` (guards, decorators, filters, errors).
- **Aceptación**: API levanta y sincroniza el esquema desde las entidades.

### Tanda 1 — Autenticación — ✅ Hecho

- `auth` + `users`: register, login, refresh, logout, me; `PATCH /users/me` y `PATCH /users/me/password`; argon2 para contraseñas; JWT stateless para access y refresh; transporte exclusivo por cookie `HttpOnly`.
- **Aceptación**: FR-AUT-001/002, NFR-SEG-003/004/010.

### Tanda 2 — Cuentas, categorías y movimientos — ✅ Hecho

- CRUD `accounts`, `categories` (sistema + propias), `transactions` con paginación (sin filtros).
- Transferencias atómicas (FR-TRX-004/005) y exclusión de consolidados (CAL-003).
- **Aceptación**: HU-001, HU-002, FR-CUE-001..005, FR-TRX-001..005.

### Tanda 3 — Cálculos y dashboard — ✅ Hecho

- `calculations` (CAL-001/002/003/010) + `dashboard` (`GET /dashboard?from&to` con KPIs y series v0.3).
- **Aceptación**: FR-DAS-001..004, CAL-001.

### Tanda 4 — Asistente IA (solo consulta) — ✅ Hecho

- `assistant` + `shared/ai`: `POST /assistant/messages` con stream SSE (`meta`/`token`/`done`/`error`), contexto mínimo e insuficiencia. Sin escrituras ni historial persistido; el cliente puede enviar turnos recientes como contexto (FR-IA-016).
- **Aceptación**: HU-006, FR-IA-002/015, NFR-SEG-012.

### Tanda 5 — Endurecimiento — ◐ Parcial

- Tests e2e P0, rate limiting completo, timeout en salidas externas, logging seguro, validación de host.
- **Aceptación**: NFR-SEG-001..010, NFR-CAL-004/005.
