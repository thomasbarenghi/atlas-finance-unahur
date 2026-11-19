# Atlass Fin — Documento Técnico del Backend

> **Audiencia:** agentes de IA que implementarán el backend.
> **Stack:** NestJS (monolítico) · TypeScript · PostgreSQL (Supabase como proveedor) · TypeORM · JWT (cookie HttpOnly) · REST.
> **Frontend:** consume esta API. Ver `frontend.md`.
> **Referencia funcional:** `../specification/0.4/FRD_Gestor_Financiero_v0.4.md`. Todo requisito citado (FR-*, HU-*, CAL-*, NFR-*) corresponde a ese documento.

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
11. [Base de datos y datos de demostración](#11-base-de-datos-y-datos-de-demostración)
12. [Configuración y variables de entorno](#12-configuración-y-variables-de-entorno)

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
| IDs                 | `uuid` (gen_random_uuid)                                                                           | Identificadores no predecibles (NFR-SEG-001).                                                     |
| Moneda              | Multimoneda: moneda por cuenta + moneda principal del usuario + cotizaciones globales de la API | El dashboard re-expresa todos los valores en la moneda de lectura (default: principal); CAL-001/002. |
| Streaming IA        | SSE                                                                                                | UI reactiva y cancelable.                                                            |

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
                        │   auth, users, currencies,   │
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
│   │   ├── validation/password.ts
│   │   └── types/{ auth-user.ts, financial-enums.ts }
│   ├── auth/
│   │   ├── auth.module.ts / auth.controller.ts / auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/{ register, login, auth-response }.dto.ts
│   ├── users/
│   │   ├── users.module.ts / users.controller.ts / users.service.ts
│   │   ├── dto/{ update-user.dto.ts, change-password.dto.ts, user-response.dto.ts }
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
│       └── calculations/            # reglas CAL-001/002/003/004
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

Tablas derivadas de las entidades principales del FRD v0.4 (§3.1). Todos los `id` son `uuid` v4. Toda tabla con datos de usuario lleva `user_id` (o desciende de una entidad que lo tiene) y un índice.

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

### 5.2 `accounts` (FR-CUE-001/002/003/004)

| Columna                 | Tipo          | Notas                                   |
| :---------------------- | :------------ | :-------------------------------------- |
| id                      | uuid PK       |                                         |
| user_id                 | uuid FK       |                                         |
| name                    | text          |                                         |
| type                    | text          | 'cash' \| 'bank' \| 'wallet' \| 'other' |
| currency                | text          | ISO 4217 de la cuenta (FR-CUE-001)      |
| initial_balance         | numeric(18,4) |                                         |
| notes                   | text NULL     |                                         |
| created_at / updated_at | timestamptz   |                                         |

> Saldo actual = `initial_balance` + Σ(movimientos con signo) (calculado, FR-CUE-002), siempre en la moneda de la cuenta: los ingresos suman, los gastos restan y cada pata de transferencia aporta su signo (§5.4). La **eliminación** de una cuenta elimina en cascada los movimientos en los que participa, incluidas ambas patas de una transferencia (FR-CUE-003). La moneda **no se puede cambiar** si la cuenta ya tiene movimientos (FR-CUE-001).

### 5.3 `categories` — del sistema y propias (FR-CAT-001)

| Columna | Tipo                 | Notas                                                                         |
| :------ | :------------------- | :---------------------------------------------------------------------------- |
| id      | uuid PK              |                                                                               |
| user_id | uuid NULL            | `NULL` = categoría del sistema (global); valor = categoría propia del usuario |
| name    | text                 | nombre único por tipo, sin distinguir mayúsculas, entre las categorías visibles para el usuario (sistema + propias) |
| type    | text                 | 'income' \| 'expense' (inmutable al editar)                                   |
| color   | text                 | hex                                                                           |
| icon    | text NULL            |                                                                               |

> Las cinco categorías del sistema (`user_id NULL`) son **globales y de solo lectura**. Cada usuario puede crear, renombrar/recolorear y eliminar las suyas; el `type` no se modifica una vez creada. Al eliminar una categoría propia, sus movimientos quedan con `category_id NULL` y se muestran como “Sin categoría”. El seed crea las cinco del sistema y, además, la categoría propia `Otros` (tipo ingreso) para el usuario demo (§11.4).

### 5.4 `transactions` (FR-TRX-001, FR-TRX-004)

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
| transfer_account_id     | uuid FK NULL → accounts   | solo transferencias; distinto de account_id (FR-TRX-001); `ON DELETE CASCADE`                                                   |
| category_id             | uuid FK NULL → categories | obligatoria al crear o editar `income`/`expense`; nula en transferencias y en movimientos que quedaron sin categoría al eliminar una propia |
| transfer_group_id       | uuid NULL                 | agrupa las dos patas de una transferencia                                                                                      |
| created_at / updated_at | timestamptz               |                                                                                                                                |

> Las transferencias se persisten como **dos filas** (`type='transfer'`) en una transacción de base de datos con el mismo `transfer_group_id`. En una transferencia multimoneda cada pata lleva el monto en la moneda de su cuenta (monto origen y monto destino); la cotización usada en la UI **no se persiste** (FR-TRX-001). Se excluyen de ingresos/gastos consolidados (CAL-003). Las transferencias se pueden filtrar en la UI; la API mantiene paginación.

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

- `POST /auth/refresh` verifica el refresh token JWT de la cookie `refresh_token`, emite tokens nuevos y responde `204 No Content`. El refresh token anterior sigue siendo válido hasta su expiración.

### 6.4 Logout (`POST /auth/logout`)

- Solo limpia las cookies `access_token` y `refresh_token`. Al ser JWT stateless, el token ya emitido sigue siendo válido hasta su expiración.

### 6.5 Autorización por request (NFR-SEG-001)

- `JwtAuthGuard` global valida firma y expiración del access token en **cada** operación, leyéndolo exclusivamente de la cookie `HttpOnly`. También exige `type: "access"`. Las rutas marcadas con `@Public()` (register, login, refresh, logout y `GET /currencies`) quedan fuera del guard.
- Los controllers obtienen el usuario vía `@CurrentUser()` y filtran/validan **siempre** por `user_id` del recurso.
- Regla de oro: **ningún `id` aportado por el cliente otorga autorización**; el servidor resuelve la propiedad.

---

## 7. API REST por módulo

Prefijo global `/api`. Respuestas paginadas: `{ items, page, pageSize, total, totalPages }`. Los errores de negocio usan `{ statusCode, code, message, fieldErrors? }`. Todos los endpoints de datos (salvo `@Public()`) requieren sesión.

### 7.1 Auth

| Método | Ruta             | FR          |
| :----- | :--------------- | :---------- |
| POST   | `/auth/register` | FR-AUT-001  |
| POST   | `/auth/login`    | FR-AUT-002  |
| POST   | `/auth/logout`   | FR-AUT-002  |
| POST   | `/auth/refresh`  | NFR-SEG-004 |
| GET    | `/auth/me`       | —           |

### 7.2 Users

| Método | Ruta                 | FR          |
| :----- | :------------------- | :---------- |
| PATCH  | `/users/me`          | FR-CFG-002/003 |
| PATCH  | `/users/me/password` | FR-CFG-002     |

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
- Al ser JWT stateless, cambiar la contraseña no revoca los tokens ya emitidos; siguen vigentes hasta expirar.

### 7.3 Accounts

| Método | Ruta            | FR                                                          |
| :----- | :-------------- | :---------------------------------------------------------- |
| GET    | `/accounts`     | listado con saldo actual (FR-CUE-002)                       |
| POST   | `/accounts`     | FR-CUE-001                                                  |
| GET    | `/accounts/:id` | detalle de cuenta propia (FR-CUE-004)                       |
| PATCH  | `/accounts/:id` | FR-CUE-001                                                  |
| DELETE | `/accounts/:id` | FR-CUE-001; elimina en cascada sus movimientos (FR-CUE-003) |

> La cuenta expone `currency` (FR-CUE-001) y no permite cambiarla si ya tiene movimientos.

### 7.4 Categories

| Método | Ruta              | FR                                                                 |
| :----- | :---------------- | :----------------------------------------------------------------- |
| GET    | `/categories`     | categorías del sistema + propias (FR-CAT-001)                      |
| POST   | `/categories`     | crear una categoría propia (FR-CAT-001)                            |
| PATCH  | `/categories/:id` | editar una propia (`name`, `color`, `icon`; `type` inmutable) (FR-CAT-001) |
| DELETE | `/categories/:id` | eliminar una propia (FR-CAT-001)                                   |

> Las categorías del sistema (`isSystem: true`) no se pueden editar ni eliminar: responden `404`. Las categorías de otro usuario tampoco se exponen (`404`). El nombre es único por tipo, sin distinguir mayúsculas, entre las categorías visibles para el usuario (las cinco del sistema y las propias): un duplicado responde `400 VALIDATION_ERROR` con `fieldErrors.name`.

### 7.5 Transactions

| Método | Ruta                          | FR                                                    |
| :----- | :---------------------------- | :---------------------------------------------------- |
| GET    | `/transactions?page&pageSize` | historial paginado (FR-TRX-004)                       |
| POST   | `/transactions`               | FR-TRX-001 (transferencia: dos filas atómicas, FR-TRX-001) |
| GET    | `/transactions/:id`           | —                                                     |
| PATCH  | `/transactions/:id`           | FR-TRX-001                                            |
| DELETE | `/transactions/:id`           | FR-TRX-001                                            |

> **Filtros y exportación de la UI:** la búsqueda, el tipo, la cuenta, la categoría, la moneda y el período se aplican en el cliente sobre la página cargada. La API mantiene paginación (`page`, `pageSize`). La exportación CSV es client-side sobre los movimientos cargados en la vista (hasta 100 registros; FR-TRX-003). En transferencias multimoneda el request incluye `transferAmount` (monto que llega a destino); la cotización no se envía ni se persiste.
>
> **Categoría:** los ingresos y gastos exigen categoría al crear y al editar; puede quedar `null` solo si se elimina la categoría propia que usaban (la FK es `ON DELETE SET NULL`).
>
> **Tipo:** `type` no se modifica al editar. El request puede incluirlo solo con el mismo valor (la UI lo envía deshabilitado); un cambio responde `400 VALIDATION_ERROR`.
>
> **Transferencias:** `GET /transactions/:id` devuelve el movimiento; si es una transferencia, devuelve ambas patas del `transfer_group_id`. `PATCH` actualiza ambas patas de forma atómica (monto origen y `transferAmount`) y `DELETE` elimina ambas patas.

### 7.6 Dashboard

| Método | Ruta                 | FR                        | Detalle                                                                 |
| :----- | :------------------- | :------------------------ | :---------------------------------------------------------------------- |
| GET    | `/dashboard?from&to&currency` | FR-DAS-001/002/003 | Agrega KPIs y series del período; `currency` es la moneda de visualización (default: principal) |

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
  }[];
  incomeExpenseByPeriod: {
    bucket: "week" | "month";
    start: string;
    end: string;
    income: number;
    expenses: number;
  }[];
  incomeExpenseByMonth: {
    month: string;
    income: number;
    expenses: number;
  }[];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }[];
}
```

- **Período (FR-DAS-003):** `from`/`to` son seleccionables. Sin período, el backend usa los últimos 180 días; el rango debe tener entre 1 y 366 días. El cliente envía siempre el período compartido; este default aplica solo a consumidores directos de la API. El header de Inicio tiene el **selector de moneda de lectura** antes del período, con las monedas disponibles (las de las cuentas, la principal y la moneda de lectura activa) y **“Otra moneda”** para el catálogo completo; por defecto usa la moneda principal y `currency` permite re-expresar todo el dashboard en otra unidad del catálogo. El selector (con “Otra moneda”) se muestra cuando hay más de una moneda disponible; si solo hay una, la lectura queda fija en la moneda principal.
- **Patrimonio neto (CAL-001, §8):** Σ (saldo × cotización) de las **cuentas actuales**, en la moneda de lectura. No es una valoración histórica al cierre del período. La serie histórica evalúa esa suma por día si el rango tiene ≤ 31 días (mes en curso o últimos 30 días) y al cierre de cada mes en el resto de los rangos. `breakdown` expone cada moneda nativa y su equivalente en la moneda de lectura; `rates` expone la cotización usada y su fecha. `netWorthDeltaPct` compara el patrimonio actual contra el primer punto de la serie del período (no contra el período anterior).
- **Flujos (CAL-002):** cada ingreso/gasto se convierte desde la moneda de su cuenta a la moneda de lectura con la cotización de la API y luego se suma. Las transferencias se excluyen (CAL-003). Categorías tiene el mismo selector de visualización antes del período (solo con las monedas de las cuentas y la principal).
- **Gastos por categoría (FR-DAS-002):** el desglose solo agrupa gastos con categoría. Los gastos sin categoría (por ejemplo, tras eliminar una categoría propia) se incluyen en `kpis.expenses` pero no en `expensesByCategory`.
- **Moneda de lectura:** la UI de Inicio usa la moneda principal por defecto y el selector del header permite ver todos los valores en otra unidad sin alterar datos (RN-001). El desglose por moneda del hero aparece cuando hay más de una moneda en el desglose (cuentas en varias monedas o una moneda de lectura distinta de la nativa).
- **Granularidad (FR-DAS-002/003):** para rangos de ≤ 31 días, `incomeExpenseByPeriod` devuelve tramos semanales (`bucket: "week"`); para rangos mayores, tramos mensuales (`bucket: "month"`). `incomeExpenseByMonth` se conserva para el contexto del asistente.
- **Tasa de ahorro (CAL-004, §8):** `kpis.savingsRateDeltaPp` expresa en **puntos porcentuales** la variación de la tasa de ahorro contra el período anterior, calculada sobre los flujos convertidos.

### 7.7 Assistant — solo consulta (FR-IA-001)

| Método | Ruta                  | FR                                            |
| :----- | :-------------------- | :-------------------------------------------- |
| POST   | `/assistant/messages` | requiere sesión; responde con stream SSE (FR-IA-001) |

- **Solo consulta:** no crea, edita ni elimina datos (FR-IA-001). Si el usuario pide una acción de escritura, el asistente explica que solo responde consultas.
- **Sin estado:** el cliente puede enviar los mensajes recientes en `history` para dar continuidad a la conversación (memoria acotada del cliente; el servidor acepta hasta 12 mensajes y el cliente envía los últimos 10); el servidor no los persiste.
- El estado del asistente no es una preferencia del usuario: con sesión válida siempre está disponible.

### 7.8 Currencies — catálogo y cotizaciones

| Método | Ruta               | RN          | Detalle                                                                 |
| :----- | :----------------- | :---------- | :---------------------------------------------------------------------- |
| GET    | `/currencies`      | RN-002      | Catálogo global de 54 monedas ISO 4217.                                 |
| GET    | `/currencies/rates` | RN-001/002 | `primaryCurrency` + cotizaciones de las monedas usadas por las cuentas distintas de la principal |

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

> Endpoints de **solo lectura**. El usuario no crea monedas ni edita cotizaciones (RN-002); el backend consulta la API global en cada request y no persiste las cotizaciones. `rate` está expresada en la moneda principal y `updatedAt` es el instante de la consulta. El array `rates` no incluye la moneda principal (su tasa es 1 implícita).

### 7.9 Convenciones de contrato

- **Casing:** la base de datos usa `snake_case`; la **API JSON usa `camelCase`**. Las entidades TypeORM no se exponen: se serializan con DTOs/mappers (`initial_balance` → `initialBalance`).
- **IDs:** `uuid` v4.
- **Fechas:** los campos `date` viajan como `"YYYY-MM-DD"`; los `timestamptz` como ISO 8601 UTC (`"2026-09-11T14:30:00.000Z"`).
- **Decimales:** `numeric` se serializa como **number** (no string). Máx. 4 decimales para montos y 6 para cotizaciones. Implementar un `transformer` de TypeORM (`parseFloat` al leer) o mappers de salida.
- **Paginación:** query `page` (default 1) y `pageSize` (default 20, máx. 100). Respuesta: `{ items, page, pageSize, total, totalPages }`. Solo `/transactions` es paginado; `/accounts` y `/categories` devuelven un **array** completo.
- **Errores:** los errores de negocio usan `{ statusCode, code, message, fieldErrors? }`; `fieldErrors` es `{ [campo]: string[] }` para validación (para mapeo a formularios). Los 5xx y los errores de pipes/guards sin código usan el formato estándar de Nest (`{ statusCode, message, error? }`) y el filtro global nunca expone detalles internos.
- **Auth:** exclusivamente cookie `HttpOnly`. Los endpoints `@Public()` son: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` y `GET /currencies`.
- **CORS:** con credenciales habilitadas; permitir `CORS_ORIGIN` exacto (no `*`); admite varios orígenes separados por coma.

### 7.10 Enums y catálogos

| Concepto             | Valores                                 |
| :------------------- | :-------------------------------------- |
| `AccountType`        | `cash` \| `bank` \| `wallet` \| `other` |
| `TransactionType`    | `income` \| `expense` \| `transfer`     |
| `CategoryType`       | `income` \| `expense`                   |

- **Moneda:** catálogo global de 54 códigos ISO 4217 (`GET /currencies`). Cada cuenta declara su moneda; el usuario elige `primaryCurrency`. Las cotizaciones son globales (`GET /currencies/rates`) y las refresca el backend desde la API; el cliente no las crea ni edita.
- **Categorías** (semilla): income (`Sueldo`, `Freelance`), expense (`Supermercado`, `Transporte`, `Servicios`). Son globales y de solo lectura; cada usuario puede crear las suyas (ver §7.4).
### 7.11 Contrato de streaming del asistente

`POST /assistant/messages` responde `text/event-stream` (SSE). **El cliente debe usar `fetch` + `ReadableStream`, no `EventSource`**, porque `EventSource` no permite enviar un cuerpo POST.

**Proveedor implementado: DeepSeek** (OpenAI-compatible). El backend llama a `POST {AI_BASE_URL}/chat/completions` con `Authorization: Bearer {AI_API_KEY}`, `stream: true` y `model: {AI_MODEL}` (default `deepseek-chat`), y reemite el texto como eventos SSE. La API key **nunca** sale del servidor (NFR-SEG-003).

```jsonc
// Request body
{ "question": "¿Y lo del auto?", "period": { "from": "2026-09-01", "to": "2026-09-30" }, "currency": "ARS", "history": [{ "role": "user", "content": "¿Es inteligente comprar un auto por 2.750.000?" }, { "role": "assistant", "content": "Equivale a casi todo tu patrimonio." }] }

// Eventos SSE (cada uno: `event: <nombre>\ndata: <json>\n\n`)
event: meta    data: { "period": {...}, "currency": "ARS", "sources": ["transactions", "accounts", "categories", "currencies"], "disclaimer": "Respuesta informativa calculada a partir de tus datos; no constituye asesoramiento financiero." }
event: token   data: { "delta": "Este mes " }
event: token   data: { "delta": "gastaste más en..." }
event: done    data: { "insufficient": false }
event: error   data: { "code": "AI_UNAVAILABLE", "message": "..." }
```

- **Contexto mínimo (FR-IA-001):** el `assistant-context.service` reutiliza el read model del dashboard (ingresos, gastos, ahorro, patrimonio neto, gastos por categoría, evolución mensual y saldos de cuentas) y arma un resumen textual. No re-deriva fórmulas ni consulta repositorios directamente. Si no se envía `period`, usa los últimos 30 días; al igual que en el dashboard, ese default aplica solo a consumidores directos de la API y la UI envía siempre el período compartido.
- **Moneda del contexto:** el campo opcional `currency` del body permite expresar el contexto en la moneda de lectura activa; si se omite, se usa la moneda principal del usuario. El evento `meta` informa la moneda efectivamente usada en `currency`, de modo que la respuesta sea verificable contra el dashboard leído en esa misma moneda.
- **Sin estado y sin tools:** no hay historial persistido ni _function calling_. El historial conversacional es opcional (`history`), lo envía el cliente desde su memoria y se usa solo como contexto del período actual (FR-IA-002). El prompt de sistema es fijo, separa instrucciones de datos y declara el alcance de **solo consulta** (FR-IA-001, NFR-SEG-002).
- **Insuficiencia:** si el modelo no devuelve texto utilizable, se emite un mensaje explicativo y `done: { insufficient: true }`.
- **Acceso:** `POST /assistant/messages` requiere sesión; el usuario se obtiene de `@CurrentUser()` y no hay fallback a un usuario demo.
- La respuesta del modelo se sirve como texto plano; nunca como HTML (NFR-SEG-002).

### 7.12 Catálogo de códigos de error

| `code`                | HTTP | Cuándo                               |
| :-------------------- | :--- | :----------------------------------- |
| `VALIDATION_ERROR`    | 400  | DTO o regla de negocio inválida (incluye `fieldErrors` cuando corresponde) |
| `INVALID_CREDENTIALS` | 401  | login fallido                        |
| `SESSION_REVOKED`     | 401  | refresh token ausente o inválido     |
| `NOT_FOUND`           | 404  | recurso inexistente o ajeno; también categoría del sistema al editar/eliminar |
| `EMAIL_IN_USE`        | 409  | registro o cambio de email con un email existente |
| `AI_UNAVAILABLE`      | —    | evento `error` del stream del asistente |
| `EXCHANGE_RATES_UNAVAILABLE` | 502 | falla del proveedor de cotizaciones; el estado 502 se conserva, pero el cuerpo es genérico y no incluye `code` |

> `UNAUTHENTICATED`, `FORBIDDEN`, `INTERNAL_ERROR` y `EXCHANGE_RATES_UNAVAILABLE` están definidos en el catálogo interno pero hoy no se serializan en el cuerpo: el guard responde el 401 estándar de Nest y los 5xx se enmascaran con un mensaje genérico (ver §7.9).

> `GET /currencies` y `GET /currencies/rates` son de solo lectura: catálogo global y cotizaciones de las monedas usadas por las cuentas.

### 7.13 Referencia de la API

El contrato REST de este documento (`backend.md` §7) es la fuente de verdad. La API **no** publica Swagger/OpenAPI ni una referencia interactiva (Scalar): se removieron para reducir la superficie.

---

## 8. Reglas de cálculo

Centralizadas en `calculations.service.ts` para garantizar consistencia entre dashboard y asistente. Cubiertas por pruebas unitarias (NFR-CAL-001). El patrimonio neto, la serie histórica y la tasa de ahorro se arman en `dashboard.orchestrator.ts` reutilizando ese service.

| Regla                   | Implementación                                                                                                                                                                                                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAL-001 Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, en la moneda de lectura. Implementado en `calculations.service.netWorthFromBalances` (y `netWorthInCurrency` como variante que calcula los saldos) y reutilizado por `dashboard.orchestrator` para los KPIs y `netWorthSeries` para las series; `assistant-context.service` lo consume vía el dashboard. |
| CAL-002 Flujo de fondos | Σ ingresos − Σ gastos del período (excluye transferencias); cada flujo se convierte a la moneda de lectura con la cotización global. Implementado en `calculations.service.calculateDailyFlows` + `sumFlows`; `calculatePeriodFlows` expone el mismo cálculo sobre una lista de movimientos. |
| CAL-003 Transferencias  | `type='transfer'` se excluye de ingresos/gastos consolidados; en multimoneda cada pata guarda su monto y la cotización usada no se persiste. |
| CAL-004 Tasa de ahorro  | ahorro del período / ingresos del período × 100, calculado sobre los flujos convertidos a la moneda de lectura; si los ingresos del período son 0, la tasa es 0. Su **variación** se expresa en **puntos porcentuales**: `kpis.savingsRateDeltaPp = (ahorro/ingresos − ahorro/ingresos del período anterior) × 100`. Implementado en `dashboard.orchestrator`. |

---

## 9. Integraciones externas

### 9.1 Proveedor de IA (actor "Proveedor de IA")

`assistant.service.ts` + `shared/ai/ai.service.ts`:

1. Resuelve el usuario de la sesión autenticada (§7.11).
2. Calcula **localmente** totales y métricas del período (FR-IA-001) reutilizando el read model del dashboard (`DashboardOrchestrator`, que a su vez usa `calculations.service`), para no duplicar fórmulas.
3. Construye el **contexto mínimo** (solo datos del usuario autenticado) y envía la pregunta al LLM.
4. El prompt de sistema es fijo y **separado** de los datos del usuario, que viajan como datos no confiables (NFR-SEG-002). Se verifica que la salida no esté vacía antes de presentarla; el contenido se sirve como texto y se renderiza de forma segura.
5. Adjunta metadatos: período, moneda y fuentes consideradas.
6. Declara "información insuficiente" cuando los datos no permiten conclusión verificable.
7. **No** modifica datos: el asistente es de **solo consulta** (FR-IA-001). No hay herramientas de escritura ni confirmación de acciones.

**Implementación actual (DeepSeek):**

- `shared/ai/ai.service.ts` (`AiModule`): cliente del proveedor (DeepSeek/OpenAI-compatible) con `axios` `responseType: "stream"`, timeout de `AI_TIMEOUT_MS` y aborto; expone `streamChat(messages)` como `AsyncGenerator<{ type: "token"; delta: string }>`. Mapea fallas a `AI_UNAVAILABLE` (NFR-SEG-004).
- `assistant/assistant-context.service.ts`: arma el contexto mínimo reutilizando `DashboardOrchestrator.getDashboard` (ingresos, gastos, ahorro, gastos por categoría, patrimonio neto, evolución mensual) y `AccountsService` (saldos de cuentas), y produce un resumen textual.
- `assistant/assistant.service.ts`: recibe el usuario autenticado, construye el prompt y el contexto, y devuelve un generador de eventos (`meta`/`token`/`done`). El prompt de sistema declara explícitamente el alcance de **solo consulta** y que no debe inventar cifras.
- `assistant/assistant.controller.ts`: `POST /assistant/messages` (SSE); ante falla emite `event: error`.
- El cliente consume el stream real en `client/lib/api/assistant-stream.ts`.

> La **currency-api de Fawaz Ahmed** (pública, sin API key) se usa en `ExchangeRatesProvider` para obtener las cotizaciones globales en cada lectura; no hay caché persistente ni en memoria y la petición no sigue redirecciones (`maxRedirects: 0`). Si el proveedor falla, el endpoint responde `502` con un mensaje genérico.

---

## 10. Seguridad

| NFR         | Implementación                                                                                   |
| :---------- | :----------------------------------------------------------------------------------------------- |
| NFR-SEG-001 | `JwtAuthGuard` global, `uuid` no predecibles y resolución de propiedad por `user_id` en cada consulta. |
| NFR-SEG-002 | `ValidationPipe` global con whitelist/forbidNonWhitelisted; salidas JSON/texto y render seguro en el cliente; prompts separados de los datos. |
| NFR-SEG-003 | `argon2` para contraseñas, secretos solo en env del servidor y logging sin datos sensibles. |
| NFR-SEG-004 | Cookies HttpOnly/Secure/SameSite con expiración y refresh JWT; llamadas externas por HTTPS con timeout y sin seguir redirecciones. |


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

Datos **estructuralmente reproducibles** (sin información financiera real, NFR-CAL-002 / FRD §2.6). Para `demo@atlassfin.app`:

- **5 categorías fijas del sistema**: income (`Sueldo`, `Freelance`), expense (`Supermercado`, `Transporte`, `Servicios`). Además crea la categoría propia `Otros` (tipo ingreso) para el usuario demo.
- **4 cuentas**: `cash` (Caja, ARS), `bank` (Banco, ARS), `wallet` (Billetera virtual, ARS) y `wallet` (Billetera USD, USD).
- **3 meses de movimientos** en ARS y USD: sueldos, gastos por categoría, transferencias atómicas (dos patas con `transfer_group_id`), un ingreso sin categoría, un ingreso freelance y una transferencia multimoneda con los dos montos.
- **Cotizaciones globales**: el seed consulta la API pública solo para calcular el monto destino de la transferencia multimoneda; no guarda cotizaciones. Ese monto puede variar según la cotización vigente al correr el seed. Si la API falla, el seed omite esa transferencia multimoneda. El dashboard obtiene las cotizaciones de la API en cada lectura.

Para `ana@atlassfin.app` genera un dataset reducido (una cuenta bancaria y un ingreso) para probar aislamiento y propiedades.

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
