# Atlass Fin — Documento Técnico del Backend

> **Audiencia:** agentes de IA que implementarán el backend.
> **Stack:** NestJS (monolítico) · TypeScript · PostgreSQL (Supabase como proveedor) · TypeORM · JWT (cookie HttpOnly + Bearer) · REST.
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

Backend monolítico que sirve una API REST para Atlass Fin. Organiza y explica la información cargada por el usuario; **no** se conecta a bancos, no ejecuta pagos ni inversiones y no brinda asesoramiento financiero. La única integración externa es el proveedor de IA, y se realiza exclusivamente desde el backend.

La aplicación opera con **una única moneda del sistema** (`DEFAULT_CURRENCY`, por defecto `ARS`): no hay multimoneda, ni conversión de divisas, ni cotizaciones de mercado. El catálogo de categorías es **fijo** (definido por el sistema, de solo lectura).

| Área | Tecnología | Notas |
| :--- | :--- | :--- |
| Framework | NestJS | Monolítico, módulos por dominio. |
| Lenguaje | TypeScript (strict) | — |
| Base de datos | PostgreSQL | Proveedor: **Supabase** (Postgres gestionado). |
| ORM | TypeORM | Entidades como fuente de verdad del esquema (`synchronize`). |
| Esquema | **Sin migraciones** (decisión de la etapa) | El schema se deriva de las entidades; ante un cambio se recrea la base y se corre el seed (§11.1). |
| Auth | `@nestjs/jwt` + `passport` | JWT por cookie `HttpOnly`; opcionalmente `Authorization: Bearer` para clientes que no usan cookies. |
| Validación | `class-validator` + `class-transformer` + `ValidationPipe` global | — |
| Hash | `argon2` | Algoritmo adaptativo (NFR-SEG-003). |
| IA | Proveedor de LLM (configurable, p. ej. DeepSeek/OpenAI) | Solo contexto mínimo calculado; asistente de solo consulta. |
| Config | `@nestjs/config` + validación de env | — |

---

## 2. Decisiones técnicas

| Decisión | Elección | Justificación |
| :--- | :--- | :--- |
| Estilo | Monolito modular | Suficiente para el alcance; evita complejidad de microservicios. |
| Estructura | Convencional NestJS (module/controller/service) + DTOs y entidades | Es la estructura por defecto; clara para el agente. |
| Casos de uso | Services de dominio con un método por caso de uso | Separación de responsabilidades; testeo unitario directo. |
| ORM | TypeORM | Integración nativa con NestJS (`@nestjs/typeorm`); el esquema se sincroniza desde las entidades. |
| Auth | JWT (access token) + sesión persistida | Permite invalidar sesión al cerrar (FR-AUT-002). Transporte por cookie o Bearer según el cliente. |
| Transporte de token | Cookie `HttpOnly; Secure; SameSite` (web) + `Authorization: Bearer` (clientes que no usan cookies) | Mitiga XSS y admite clientes que no persisten cookies; consistente con NFR-SEG-004. |
| IDs | `uuid` (gen_random_uuid) | Identificadores no predecibles (NFR-SEG-005). |
| Moneda | Única moneda del sistema (`DEFAULT_CURRENCY`, default `ARS`) | Sin multimoneda ni conversión; se expone como dato **informativo** en las respuestas con dinero. |
| Streaming IA | SSE | UI reactiva y cancelable (NFR-PR-004). |

---

## 3. Arquitectura general

```
                        ┌──────────────────────────────┐
Frontend (Next.js) ───▶ │  NestJS (monolito)           │
                        │                              │
                        │  Global: Pipes, Guards,      │
                        │  Filters, Interceptors       │
                        │                              │
                        │  Módulos de dominio:         │
                        │   auth, users,               │
                        │   accounts, transactions,    │
                        │   categories, dashboard,     │
                        │   assistant, health          │
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
- **`JwtAuthGuard` global** por defecto (`APP_GUARD`), con decorador `@Public()` para rutas de auth (register/login/refresh), assistant y health.
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
│   │   ├── configuration.ts         # carga y valida env
│   │   └── env.validation.ts
│   ├── database/
│   │   ├── data-source.ts           # DataSource de los scripts (`seed`, `db:*`)
│   │   ├── database-maintenance.service.ts  # vaciar/recrear/sembrar (dev/test)
│   │   ├── database.module.ts
│   │   ├── dev-database.controller.ts       # endpoints dev de mantenimiento
│   │   ├── dev-only.guard.ts
│   │   └── seeds/                   # seed determinístico + runners
│   ├── common/
│   │   ├── decorators/{ public, current-user }.decorator.ts
│   │   ├── dto/{ pagination, period }.dto.ts
│   │   ├── errors/{ api.exception.ts, error-codes.ts }
│   │   ├── filters/http-exception.filter.ts
│   │   ├── guards/{ jwt-auth.guard.ts, optional-jwt-auth.guard.ts }
│   │   ├── interceptors/logging.interceptor.ts
│   │   ├── pipes/validation-exception.factory.ts
│   │   ├── transformers/numeric.transformer.ts
│   │   └── types/{ auth-user.ts, financial-enums.ts }
│   ├── auth/
│   │   ├── auth.module.ts / auth.controller.ts / auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── dto/{ register, login, refresh-token, auth-response }.dto.ts
│   │   └── entities/session.entity.ts
│   ├── users/
│   │   ├── users.module.ts / users.controller.ts / users.service.ts
│   │   ├── dto/{ update-user.dto.ts, user-response.dto.ts }
│   │   └── entities/user.entity.ts
│   ├── accounts/                    # CRUD de un solo dominio
│   │   ├── accounts.module.ts / accounts.controller.ts / accounts.service.ts
│   │   ├── dto/{ create-account, update-account, account-response }.dto.ts
│   │   └── entities/account.entity.ts
│   ├── categories/                  # catálogo fijo, solo lectura
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
│   ├── health/
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
- **Excepción acotada:** `auth` comparte el agregado de identidad `users` (registro, credenciales y sesión) con `users`; es la autoridad de credenciales y accede al `User` directamente. El resto de los dominios consume usuarios vía `UsersService`.

---

## 5. Modelo de datos (PostgreSQL)

Tablas derivadas de las entidades principales del FRD v0.3 (§3.2) más las necesarias para la sesión. Todos los `id` son `uuid` v4. Toda tabla con datos de usuario lleva `user_id` (o desciende de una entidad que lo tiene) y un índice.

> **Convención de columnas:** `snake_case` en la DB; los enums se almacenan como `text` con validación en la capa de aplicación (valores en §7.10); los `numeric` se serializan como `number` en la API (ver §7.9).

### 5.1 `users`
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | default gen_random_uuid() |
| name | text | |
| email | text UNIQUE | lowercase |
| password_hash | text | argon2 |
| created_at / updated_at | timestamptz | |

> No hay preferencias de moneda, tema ni IA en el usuario: la moneda es una constante del sistema y el asistente es de solo consulta (siempre disponible con sesión válida).

### 5.2 `sessions`
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK → users | on delete cascade |
| refresh_token_hash | text | hash del refresh token |
| expires_at | timestamptz | |
| revoked_at | timestamptz NULL | se marca al logout (FR-AUT-002) |
| created_at | timestamptz | |

### 5.3 `accounts` (FR-CUE-001..005)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| name | text | |
| type | text | 'cash' \| 'bank' \| 'wallet' \| 'other' |
| initial_balance | numeric(18,4) | |
| notes | text NULL | |
| created_at / updated_at | timestamptz | |

> Saldo actual = `initial_balance` + Σ(movimientos) (calculado, FR-CUE-004). La **eliminación** de una cuenta elimina en cascada sus movimientos asociados (FR-CUE-005); no hay archivado ni restauración. Sin campo `currency` (moneda única del sistema) ni tipo `card`.

### 5.4 `categories` — catálogo fijo (FR-TRX-002)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| name | text | |
| type | text | 'income' \| 'expense' |
| color | text | hex |
| icon | text NULL | |

> Catálogo **definido por el sistema y de solo lectura**: no tiene `user_id`, `archived` ni `isSystem`. El seed crea cinco categorías fijas (§11.5). El usuario no puede crearlas, editarlas ni eliminarlas.

### 5.5 `transactions` (FR-TRX-001..005)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| type | text | 'income' \| 'expense' \| 'transfer' |
| amount | numeric(18,4) | en `income`/`expense` se guarda positivo; en transferencias cada pata lleva el signo (negativo en origen, positivo en destino) |
| date | date | |
| description | text | |
| notes | text NULL | |
| account_id | uuid FK → accounts | |
| transfer_account_id | uuid FK NULL → accounts | solo transferencias; distinto de account_id (FR-TRX-004) |
| category_id | uuid FK NULL → categories | obligatoria en `income`/`expense`; nula en transferencias |
| transfer_group_id | uuid NULL | agrupa las dos patas de una transferencia (FR-TRX-005) |
| created_at / updated_at | timestamptz | |

> Las transferencias se persisten como **dos filas** (`type='transfer'`, montos con signo opuesto en cuentas distintas) en una transacción de base de datos con el mismo `transfer_group_id` (atomicidad, FR-TRX-005). Se excluyen de ingresos/gastos consolidados (CAL-003). Sin campo `currency` ni filtros/búsqueda.

---

## 6. Autenticación y autorización (JWT)

### 6.1 Registro (`POST /auth/register`)
1. Valida nombre (2–80), email (formato, único, lowercase), contraseña. **Política de contraseña:** 8–72 caracteres, al menos una letra y un número. Rechaza campos inesperados (NFR-SEG-002).
2. Hashea con argon2 y crea el usuario. Crea la sesión y responde con cookies/tokens (login automático).

### 6.2 Login (`POST /auth/login`)
1. Verifica credenciales; respuestas genéricas ante falla (sin revelar si el email existe).
2. Emite **access token** (JWT, vida corta ~15 min) y **refresh token** (opaco, hash almacenado en `sessions`).
3. Responde `{ user, accessToken, refreshToken }` en el body (para clientes que no usan cookies) y, en web, además fija cookies: `access_token` y `refresh_token` (`HttpOnly; Secure; SameSite=Lax` en producción; NFR-SEG-004). **El cliente web ignora los tokens del body y se apoya solo en la cookie**; un cliente que no use cookies usa el body.
4. **Doble transporte soportado**: cookie `HttpOnly` (web) o `Authorization: Bearer` (clientes que no usan cookies). Ambos son válidos e intercambiables.

### 6.3 Renovación
- `POST /auth/refresh` rota el refresh token (rotación, NFR-SEG-004). Acepta el refresh token por cookie o por body (clientes que no usan cookies). El refresh token viejo se invalida.

### 6.4 Logout (`POST /auth/logout`)
- Marca la sesión como revocada (`revoked_at`) → invalida la sesión activa (FR-AUT-002) y limpia cookies/tokens.

### 6.5 Autorización por request (NFR-SEG-001)
- `JwtAuthGuard` global valida el access token en **cada** operación, aceptándolo por cookie `HttpOnly` **o** header `Authorization: Bearer <token>`.
- Los controllers obtienen el usuario vía `@CurrentUser()` y filtran/validan **siempre** por `user_id` del recurso.
- Regla de oro: **ningún `id` aportado por el cliente otorga autorización**; el servidor resuelve la propiedad.

---

## 7. API REST por módulo

Prefijo global `/api`. Respuestas paginadas: `{ items, page, pageSize, total, totalPages }`. Errores: `{ statusCode, code, message, fieldErrors? }`. Todos los endpoints de datos (salvo `@Public()`) requieren sesión.

### 7.1 Auth
| Método | Ruta | FR |
| :--- | :--- | :--- |
| POST | `/auth/register` | FR-AUT-001 |
| POST | `/auth/login` | FR-AUT-002 |
| POST | `/auth/logout` | FR-AUT-002 |
| POST | `/auth/refresh` | NFR-SEG-004 |
| GET | `/auth/me` | — |

> **Eliminados:** recuperación de contraseña (`/auth/forgot-password`, `/auth/reset-password`).

### 7.2 Users
| Método | Ruta | FR |
| :--- | :--- | :--- |
| PATCH | `/users/me` | actualiza el perfil (`name`); sin preferencias de moneda/tema/IA |

```jsonc
// PATCH /users/me — body
{ "name": "Ana" }
// 200 → User
```

### 7.3 Accounts
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/accounts` | listado con saldo actual (FR-CUE-004) |
| POST | `/accounts` | FR-CUE-001/002 |
| GET | `/accounts/:id` | — |
| PATCH | `/accounts/:id` | FR-CUE-003 |
| DELETE | `/accounts/:id` | FR-CUE-003; elimina en cascada sus movimientos (FR-CUE-005) |

> **Eliminados:** `POST /accounts/:id/archive` y `/restore`, el campo `currency` y el tipo `card`.

### 7.4 Categories
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/categories` | catálogo fijo de solo lectura (FR-TRX-002) |

> **Eliminados:** `POST /categories`, `PATCH /categories/:id`, `POST /categories/:id/archive`.

### 7.5 Transactions
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/transactions?page&pageSize` | listado paginado (FR-TRX-003) |
| POST | `/transactions` | FR-TRX-001/002 (transferencia atómica FR-TRX-004/005) |
| GET | `/transactions/:id` | — |
| PATCH | `/transactions/:id` | FR-TRX-003 |
| DELETE | `/transactions/:id` | FR-TRX-003 |

> **Eliminados:** filtros/búsqueda (`from`, `to`, `type`, `accountId`, `categoryId`, `search`) y el campo `currency`.

### 7.6 Dashboard
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/dashboard?from&to` | agrega en una sola llamada: KPIs y series del período (FR-DAS-001..004) |

```ts
// 200 → DashboardData
{
  period: { from: string; to: string };
  currency: string;                       // moneda única del sistema (informativa)
  kpis: {
    netWorth: number; netWorthDeltaPct: number | null;
    income: number; incomeDeltaPct: number | null;
    expenses: number; expensesDeltaPct: number | null;
    savings: number; savingsDeltaPct: number | null;
    savingsRateDeltaPp: number | null;
  };
  netWorthSeries: { date: string; value: number }[];
  incomeExpenseByMonth: { month: string; income: number; expenses: number }[];
  expensesByCategory: { categoryId: string; name: string; color: string; value: number }[];
}
```

- **Período (FR-DAS-007):** `from`/`to` son seleccionables (default: últimos 180 días). No hay selector de moneda: se usa la moneda única del sistema.
- **Patrimonio neto (CAL-001, §8):** Σ saldos de las cuentas del usuario. La serie histórica evalúa esa suma al cierre de cada mes.
- **Tasa de ahorro (CAL-010, §8):** `kpis.savingsRateDeltaPp` expresa en **puntos porcentuales** la variación de la tasa de ahorro contra el período anterior.
- **Eliminados:** query `currency`, `kpis.assets/debts/accounts/investmentsDeltaPct`, `assetsValueByMonth`, `categoryChanges`, `assetsComposition`, `netWorthComposition`, `cashflow`, `investments`, `budgetAlerts`.

### 7.7 Assistant — solo consulta (FR-IA-002/011/015)
| Método | Ruta | FR |
| :--- | :--- | :--- |
| POST | `/assistant/messages` | pregunta; responde con stream SSE (FR-IA-002) |

- **Solo consulta:** no crea, edita ni elimina datos (FR-IA-015). Si el usuario pide una acción de escritura, el asistente explica que solo responde consultas.
- **Sin estado:** no hay conversaciones persistidas ni acciones/propuestas. No existe historial en el servidor.
- El estado del asistente no es una preferencia del usuario: con sesión válida siempre está disponible.
- **Eliminados:** `GET/DELETE /assistant/conversations*`, `POST /assistant/actions/:id/confirm|cancel`, los eventos `action_proposal`/`action_error`, las preferencias `aiEnabled`/`assistantDestructiveEnabled` y la confirmación de escrituras.

### 7.9 Convenciones de contrato

- **Casing:** la base de datos usa `snake_case`; la **API JSON usa `camelCase`**. Las entidades TypeORM no se exponen: se serializan con DTOs/mappers (`initial_balance` → `initialBalance`).
- **IDs:** `uuid` v4.
- **Fechas:** los campos `date` viajan como `"YYYY-MM-DD"`; los `timestamptz` como ISO 8601 UTC (`"2026-09-11T14:30:00.000Z"`).
- **Decimales:** `numeric` se serializa como **number** (no string). Máx. 4 decimales para montos. Implementar un `transformer` de TypeORM (`parseFloat` al leer) o mappers de salida.
- **Paginación:** query `page` (default 1) y `pageSize` (default 20, máx. 100). Respuesta: `{ items, page, pageSize, total, totalPages }`. Solo `/transactions` es paginado; `/accounts` y `/categories` devuelven un **array** completo.
- **Errores:** `{ statusCode, code, message, fieldErrors? }`; `fieldErrors` es `{ [campo]: string[] }` para validación (para mapeo a formularios). El filtro global nunca expone detalles internos.
- **Auth:** cookie `HttpOnly` o `Authorization: Bearer`. Los endpoints `@Public()` son: `/auth/register`, `/auth/login`, `/auth/refresh`, `/assistant/messages` (§7.12) y `/health`.
- **CORS:** con credenciales habilitadas; permitir `CORS_ORIGIN` exacto (no `*`); admite varios orígenes separados por coma.

### 7.10 Enums y catálogos

| Concepto | Valores |
| :--- | :--- |
| `AccountType` | `cash` \| `bank` \| `wallet` \| `other` |
| `TransactionType` | `income` \| `expense` \| `transfer` |
| `CategoryType` | `income` \| `expense` |
| `UserApprovalStatus` | `pending` \| `approved` \| `rejected` |

- **Moneda:** única, definida por env `DEFAULT_CURRENCY` (default `ARS`). Se expone como dato informativo en las respuestas con dinero; no existe `GET /currencies` ni validación de moneda por entidad.
- **Categorías fijas** (semilla): income (`Sueldo`, `Freelance`), expense (`Supermercado`, `Transporte`, `Servicios`). Son de solo lectura; el usuario no crea las suyas.
- **Eliminados:** `AssetType`, `DebtType`, `BudgetStatus`, `GoalStatus`, `Theme`, `ValuationSource`, el catálogo de mercado y el catálogo de monedas soportadas.

### 7.11 Esquemas de request/response por módulo

**Auth**
```jsonc
// POST /auth/register — body
{ "name": "Ana", "email": "ana@example.com", "password": "Secreta123" }
// 201 → { "user": User, "accessToken": "eyJ...", "refreshToken": "opaco..." }  (y fija cookies, igual que login)

// POST /auth/login — body
{ "email": "ana@example.com", "password": "Secreta123" }
// 200 → { "user": User, "accessToken": "eyJ...", "refreshToken": "opaco..." }

// POST /auth/refresh — body opcional (cliente que no usa cookies)
{ "refreshToken": "opaco..." }   // en web puede omitirse (usa cookie)
// 200 → { "accessToken": "...", "refreshToken": "..." }  (rotación)

// User
{ "id": "uuid", "name": "Ana", "email": "ana@example.com", "createdAt": "ISO" }
```

**Accounts**
```jsonc
// POST /accounts — body
{ "name": "Caja", "type": "cash", "initialBalance": 50000, "notes": null }
// Account
{ "id": "uuid", "name": "Caja", "type": "cash",
  "initialBalance": 50000, "currentBalance": 73500, "notes": null,
  "createdAt": "ISO", "updatedAt": "ISO" }
```

**Categories**
```jsonc
// GET /categories → Category[]
{ "id": "uuid", "name": "Supermercado", "type": "expense", "color": "#ef4444", "icon": "shopping-cart" }
```

**Transactions**
```jsonc
// POST /transactions — income | expense
{ "type": "expense", "amount": 12000, "date": "2026-09-10",
  "description": "Supermercado", "notes": null, "accountId": "uuid", "categoryId": "uuid" }

// POST /transactions — transfer (un solo request, dos filas atómicas)
{ "type": "transfer", "amount": 30000, "date": "2026-09-10",
  "description": "Ahorro", "accountId": "uuid-origen", "transferAccountId": "uuid-destino" }

// Transaction
{ "id": "uuid", "type": "expense", "amount": 12000, "date": "2026-09-10",
  "description": "Supermercado", "notes": null, "accountId": "uuid",
  "transferAccountId": null, "categoryId": "uuid",
  "transferGroupId": null, "createdAt": "ISO", "updatedAt": "ISO" }
```
- `amount` es positivo en `income`/`expense` (el signo lo determina `type`, CAL-002/003). En transferencias, cada pata se persiste con signo opuesto: negativa en la cuenta origen y positiva en la destino.
- `transferGroupId` no nulo agrupa las dos patas de una transferencia.
- `DELETE /transactions/:id` de una transferencia elimina **ambas patas** del grupo.
- `PATCH /transactions/:id` de una transferencia edita **ambas patas** atómicamente (si cambian `accountId`/`transferAccountId`, se reasignan).
- Validación: `accountId !== transferAccountId` en transferencias; cuenta y categoría válidas (cuenta del usuario, categoría del catálogo) (FR-TRX-004).

### 7.12 Contrato de streaming del asistente

`POST /assistant/messages` responde `text/event-stream` (SSE). **El cliente debe usar `fetch` + `ReadableStream`, no `EventSource`**, porque `EventSource` no permite el header `Authorization` (necesario para clientes que no usan cookies) ni el cuerpo de request.

**Proveedor implementado: DeepSeek** (OpenAI-compatible). El backend llama a `POST {AI_BASE_URL}/chat/completions` con `Authorization: Bearer {AI_API_KEY}`, `stream: true` y `model: {AI_MODEL}` (default `deepseek-chat`), y reemite el texto como eventos SSE. La API key **nunca** sale del servidor (NFR-SEG-007).

```jsonc
// Request body
{ "question": "¿En qué gasté más este mes?", "period": { "from": "2026-09-01", "to": "2026-09-30" } }

// Eventos SSE (cada uno: `event: <nombre>\ndata: <json>\n\n`)
event: meta    data: { "period": {...}, "currency": "ARS", "sources": ["transactions", "accounts", "categories"], "disclaimer": "Respuesta informativa calculada a partir de tus datos; no constituye asesoramiento financiero." }
event: token   data: { "delta": "Este mes " }
event: token   data: { "delta": "gastaste más en..." }
event: done    data: { "insufficient": false }
event: error   data: { "code": "AI_UNAVAILABLE", "message": "..." }
```
- **Contexto mínimo (FR-IA-002, RN-013):** el `assistant-context.service` reutiliza el read model del dashboard (ingresos, gastos, ahorro, patrimonio neto, gastos por categoría, evolución mensual y saldos de cuentas) y arma un resumen textual. No re-deriva fórmulas ni consulta repositorios directamente.
- **Sin estado y sin tools:** no hay historial, memoria conversacional ni *function calling*. El prompt de sistema es fijo, separa instrucciones de datos y declara el alcance de **solo consulta** (FR-IA-015, NFR-SEG-012).
- **Insuficiencia (FR-IA-011):** si el modelo no devuelve texto utilizable, se emite un mensaje explicativo y `done: { insufficient: true }`.
- **Acceso dev del stream:** `POST /assistant/messages` está marcado `@Public()` pero resuelve el usuario así: si hay sesión válida la usa; si no, y `NODE_ENV !== "production"`, cae al usuario demo `AI_DEV_USER_EMAIL`; en producción sin sesión responde `401 UNAUTHENTICATED`. Permite probar el asistente con el cliente en modo mock sin implementar todo el auth.
- La respuesta del modelo se sirve como texto plano; nunca como HTML (NFR-SEG-006/012).

### 7.13 Catálogo de códigos de error

| `code` | HTTP | Cuándo |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | DTO inválido (incluye `fieldErrors`) |
| `INVALID_CREDENTIALS` | 401 | login fallido |
| `UNAUTHENTICATED` | 401 | sin sesión o token inválido/expirado |
| `SESSION_REVOKED` | 401 | refresh token revocado |
| `FORBIDDEN` | 403 | recurso de otro usuario |
| `NOT_FOUND` | 404 | recurso inexistente o ajeno |
| `EMAIL_IN_USE` | 409 | registro con email existente |
| `AI_UNAVAILABLE` | 502 | falla del proveedor de IA |
| `INTERNAL_ERROR` | 500 | error inesperado (mensaje genérico) |

> **Eliminados:** `AI_DISABLED`, `DESTRUCTIVE_DISABLED`, `ACTION_NOT_ALLOWED`, `ACTION_ALREADY_EXECUTED`, `ACTION_EXPIRED`, `ACTION_DEPENDENCY_PENDING`, `ACCOUNT_ARCHIVED`, `CATEGORY_ARCHIVED`, `DUPLICATE_BUDGET`, `MARKET_UNAVAILABLE`.

### 7.14 Health
| Método | Ruta | Respuesta |
| :--- | :--- | :--- |
| GET | `/health` | `{ "status": "ok", "db": "up" }` — `@Public()` |

> **Eliminado:** `GET /currencies`.

### 7.15 Referencia de la API

El contrato REST de este documento (`backend.md` §7) es la fuente de verdad. La API **no** publica Swagger/OpenAPI ni una referencia interactiva (Scalar): se removieron para reducir la superficie.

---

## 8. Reglas de cálculo

Centralizadas en `calculations.service.ts` para garantizar consistencia entre dashboard y asistente. Cubiertas por pruebas unitarias (NFR-CAL-004). El patrimonio neto, la serie histórica y la tasa de ahorro se arman en `dashboard.orchestrator.ts` reutilizando ese service.

| Regla | Implementación |
| :--- | :--- |
| CAL-001 Patrimonio neto | Σ saldos netos de las cuentas del usuario (RN-002). Implementado en `calculations.service.calculateNetWorth(accounts, transactions)` y reutilizado por `dashboard.orchestrator` para los KPIs y las series; `assistant-context.service` lo consume vía el dashboard. |
| CAL-002 Flujo de fondos | Σ ingresos − Σ gastos del período (excluye transferencias). Implementado en `calculations.service.calculatePeriodFlows`. |
| CAL-003 Transferencias | `type='transfer'` se excluye de ingresos/gastos consolidados (RN-003). |
| CAL-010 Tasa de ahorro | ahorro del período / ingresos del período × 100; si los ingresos del período son 0, la tasa es 0. Su **variación** se expresa en **puntos porcentuales**: `kpis.savingsRateDeltaPp = (tasa actual − tasa del período anterior) × 100`. Implementado en `dashboard.orchestrator`. |

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
6. Declara "información insuficiente" cuando los datos no permiten conclusión verificable (FR-IA-011).
7. **No** modifica datos: el asistente es de **solo consulta** (FR-IA-015). No hay herramientas de escritura ni confirmación de acciones.

**Implementación actual (DeepSeek):**

- `shared/ai/ai.service.ts` (`AiModule`): cliente del proveedor (DeepSeek/OpenAI-compatible) con `axios` `responseType: "stream"`, timeout de `AI_TIMEOUT_MS` y aborto; expone `streamChat(messages)` como `AsyncGenerator<string>`. Mapea fallas a `AI_UNAVAILABLE` (NFR-SEG-009).
- `assistant/assistant-context.service.ts`: arma el contexto mínimo reutilizando `DashboardOrchestrator.getDashboard` (ingresos, gastos, ahorro, gastos por categoría, patrimonio neto, evolución mensual) y `AccountsService` (saldos de cuentas), y produce un resumen textual.
- `assistant/assistant.service.ts`: resuelve el usuario, construye el prompt y el contexto, y devuelve un generador de eventos (`meta`/`token`/`done`). El prompt de sistema declara explícitamente el alcance de **solo consulta** y que no debe inventar cifras.
- `assistant/assistant.controller.ts`: `POST /assistant/messages` (SSE); ante falla emite `event: error`.
- El cliente consume el stream en `client/lib/api/assistant-stream.ts` (mock con `NEXT_PUBLIC_USE_MOCKS`).

> **Eliminados:** proveedor de mercado (Binance/currency-api), servicio de correo (SMTP) y `@nestjs/schedule` para cotizaciones.

---

## 10. Seguridad

| NFR | Implementación |
| :--- | :--- |
| NFR-SEG-001 | `JwtAuthGuard` global + resolución de propiedad por `user_id` en cada consulta. |
| NFR-SEG-002 | `ValidationPipe` global con whitelist y forbidNonWhitelisted; límites/longitud/formato en DTOs. |
| NFR-SEG-003 | `argon2` para hashing; nunca texto plano. |
| NFR-SEG-004 | Cookies HttpOnly/Secure/SameSite, expiración, rotación de refresh token. |
| NFR-SEG-005 | `uuid` no predecibles; consultas parametrizadas (TypeORM); el ID cliente no otorga autorización. |
| NFR-SEG-006 | El backend devuelve JSON/texto; el front escapa todo HTML. |
| NFR-SEG-007 | Secretos solo en servidor vía env, fuera del repositorio (`.env` ignorado). |
| NFR-SEG-008 | Logging sin contraseñas, tokens, prompts completos ni datos sensibles. |
| NFR-SEG-009 | Llamadas salientes con HTTPS, timeout y sin seguir redirecciones (cliente `axios` de IA). |
| NFR-SEG-012 | Separación instrucciones/datos; validación de salida del modelo. |

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

| Objetivo | Comando |
| :--- | :--- |
| Vaciar todas las tablas (conserva el esquema) | `npm run db:clear` |
| Recrear el esquema desde las entidades + seed completo | `npm run db:reset` |
| Sembrar sin tocar el esquema (idempotente) | `npm run seed` |

```bash
npm run db:reset   # cambió el modelo / querés un estado limpio
npm run start:dev  # app lista con datos de demo
```

### 11.3 Endpoints de mantenimiento (solo desarrollo/test)

El módulo `database` expone rutas destructivas para desarrollo y tests. **No existen en producción**: `DevOnlyGuard` es *fail-closed* y responde `404` salvo que `NODE_ENV` sea **explícito** `development` o `test`. Además exige el header `x-dev-database-token` si se configura `DEV_DATABASE_TOKEN`.

| Método | Ruta | Efecto |
| :--- | :--- | :--- |
| POST | `/api/dev/database/clear` | Vacía todas las tablas de la aplicación (respeta FKs). |
| POST | `/api/dev/database/seed` | Ejecuta el seed (idempotente). |
| POST | `/api/dev/database/reset` | Recrea el esquema + ejecuta el seed. |

### 11.4 Usuarios de demo (determinísticos)

Todos comparten la contraseña **`Demo1234!`**:

| Email | Escenario |
| :--- | :--- |
| `demo@atlassfin.app` | Dataset completo (ver §11.5). |
| `sin-datos@atlassfin.app` | Usuario vacío, para estados vacíos y onboarding (FR-DAS-008). |
| `ana@atlassfin.app` | Segundo usuario con un dataset mínimo, para aislamiento/permisos. |

### 11.5 Qué genera el seed

Datos **reproducibles** (sin información financiera real, NFR-CAL-005 / FRD §2.6). Para `demo@atlassfin.app`:

- **5 categorías fijas del sistema**: income (`Sueldo`, `Freelance`), expense (`Supermercado`, `Transporte`, `Servicios`).
- **3 cuentas**: `cash` (Caja), `bank` (Banco) y `wallet` (Billetera virtual).
- **3 meses de movimientos**: sueldos, gastos por categoría, transferencias atómicas (dos patas con `transfer_group_id`), un ingreso sin categoría y un ingreso freelance.

Para `ana@atlassfin.app` genera un dataset reducido (una cuenta bancaria y un ingreso) para probar aislamiento y propiedades.

### 11.6 Idempotencia y reproducibilidad

- El seed verifica la existencia de `demo@atlassfin.app` antes de insertar; si ya existe, no pisa datos.
- `db:reset` siempre parte de cero y deja el mismo estado conocido: **repetir el ciclo produce resultados consistentes**.
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
AI_PROVIDER=deepseek           # deepseek | openai
AI_API_KEY=...                 # sk-... (solo en .env del backend)
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat         # deepseek-chat | deepseek-reasoner (u otro)
AI_TIMEOUT_MS=30000
AI_DEV_USER_EMAIL=demo@atlassfin.app   # solo dev: usuario del stream sin JWT

# Moneda única del sistema
DEFAULT_CURRENCY=ARS

# Tests de integración (e2e)
TEST_DATABASE_URL=postgresql://localhost:5432/atlas_finance_test

# Solo desarrollo/test: token opcional para los endpoints destructivos de
# /api/dev/database/*. Si está vacío, el guard solo exige NODE_ENV=development|test.
DEV_DATABASE_TOKEN=
```

> **Eliminadas:** `MARKET_*`, `FX_API_URL`, `QUOTE_STALE_MS`, `SMTP_*`, `MAIL_FROM`, `RESET_TOKEN_TTL`, `BUDGET_WARNING_THRESHOLD`, `SUPPORTED_CURRENCIES` y `AI_ACTION_TTL_MS`.

### 12.1 Pool de conexiones (Supabase)

- El driver `pg` configura el pool con `DB_POOL_MAX` (default 5) y `DB_CONNECTION_TIMEOUT_MS` (default 15000).
- **Producción con Supabase:** usar la cadena del **transaction pooler** (puerto `6543`) para el `DATABASE_URL` del API y mantener `DB_POOL_MAX` chico (2–3) para no agotar el pooler. El dashboard es el más sensible porque ejecuta varias consultas en paralelo.

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
- TypeORM + DataSource + entidades del modelo v0.3 (usuarios, sesiones, cuentas, categorías, movimientos).
- `common/` (guards, decorators, filters, interceptors, errors).
- **Aceptación**: API levanta, sincroniza el esquema desde las entidades y responde `/api/health`.

### Tanda 1 — Autenticación — ✅ Hecho
- `auth` + `users`: register, login, refresh, logout, me; `PATCH /users/me`; argon2; JWT strategy; cookies + `Authorization: Bearer`.
- **Aceptación**: FR-AUT-001/002, NFR-SEG-003/004/010.

### Tanda 2 — Cuentas, categorías y movimientos — ✅ Hecho
- CRUD `accounts`, catálogo fijo `categories` (solo lectura), `transactions` con paginación (sin filtros).
- Transferencias atómicas (FR-TRX-004/005) y exclusión de consolidados (CAL-003).
- **Aceptación**: HU-001, HU-002, FR-CUE-001..005, FR-TRX-001..005.

### Tanda 3 — Cálculos y dashboard — ✅ Hecho
- `calculations` (CAL-001/002/003/010) + `dashboard` (`GET /dashboard?from&to` con KPIs y series v0.3).
- **Aceptación**: FR-DAS-001..004, CAL-001.

### Tanda 4 — Asistente IA (solo consulta) — ✅ Hecho
- `assistant` + `shared/ai`: `POST /assistant/messages` con stream SSE (`meta`/`token`/`done`/`error`), contexto mínimo e insuficiencia. Sin escrituras ni historial.
- **Aceptación**: HU-006, FR-IA-002/011/015, NFR-SEG-012.

### Tanda 5 — Endurecimiento — ◐ Parcial
- Tests e2e P0, rate limiting completo, timeout en salidas externas, logging seguro, validación de host.
- **Aceptación**: NFR-SEG-001..010, NFR-CAL-004/005.
