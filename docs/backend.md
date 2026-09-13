# Atlass Fin — Documento Técnico del Backend

> **Audiencia:** agentes de IA que implementarán el backend.
> **Stack:** NestJS (monolítico) · TypeScript · PostgreSQL (Supabase como proveedor) · TypeORM · JWT (cookie HttpOnly + Bearer) · REST.
> **Frontend:** consume esta API. Ver `frontend.md`.
> **Referencia funcional:** `FRD_Gestor_Financiero_v0.1.docx.md`. Todo requisito citado (FR-*, HU-*, CAL-*, NFR-*) corresponde a ese documento.

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

Backend monolítico que sirve una API REST para Atlass Fin. Organiza y explica la información cargada por el usuario; **no** se conecta a bancos, no ejecuta pagos ni inversiones y no brinda asesoramiento financiero. Las integraciones con mercado e IA se realizan exclusivamente desde el backend.

| Área | Tecnología | Notas |
| :--- | :--- | :--- |
| Framework | NestJS | Monolítico, módulos por dominio. |
| Lenguaje | TypeScript (strict) | — |
| Base de datos | PostgreSQL | Proveedor: **Supabase** (Postgres gestionado). |
| ORM | TypeORM | Entidades + migraciones. |
| Migraciones | TypeORM migrations | Versionadas en `src/database/migrations`. |
| Auth | `@nestjs/jwt` + `passport` | JWT por cookie `HttpOnly` (web) o `Authorization: Bearer` (nativo). |
| Validación | `class-validator` + `class-transformer` + `ValidationPipe` global | — |
| Hash | `argon2` | Algoritmo adaptativo (NFR-SEG-003). |
| Programación | `@nestjs/schedule` | Actualización de cotizaciones (actor "Proceso programado"). |
| Correo | Proveedor SMTP (configurable) | Recuperación de contraseña. |
| IA | Proveedor de LLM (configurable, p. ej. OpenAI/Anthropic) | Solo contexto mínimo calculado. |
| Rate limiting | `@nestjs/throttler` | Login, recuperación, cotizaciones, IA (NFR-SEG-010). |
| Docs de API | `@nestjs/swagger` (OpenAPI) | Contrato consumible por el front. |
| Config | `@nestjs/config` + validación de env | — |

---

## 2. Decisiones técnicas

| Decisión | Elección | Justificación |
| :--- | :--- | :--- |
| Estilo | Monolito modular | Suficiente para el alcance; evita complejidad de microservicios. |
| Estructura | Convencional NestJS (module/controller/service) + DTOs y entidades | Es la estructura por defecto; clara para el agente. |
| Casos de uso | Services de dominio con un método por caso de uso | Separación de responsabilidades; testeo unitario directo. |
| ORM | TypeORM | Integración nativa con NestJS (`@nestjs/typeorm`), migraciones SQL controladas. |
| Auth | JWT (access token) + sesión persistida | Permite invalidar sesión al cerrar (FR-AUT-002). Transporte por cookie o Bearer para soportar web y nativo. |
| Transporte de token | Cookie `HttpOnly; Secure; SameSite` (web) + `Authorization: Bearer` (nativo) | Mitiga XSS y soporta clientes nativos; consistente con NFR-SEG-004. |
| IDs | `uuid` (gen_random_uuid) | Identificadores no predecibles (NFR-SEG-005). |
| Moneda base | Almacenada en `users.base_currency` | Consolida cálculos (FR-AUT-005, CAL-001). |
| Conversión | Tabla `exchange_rates` con trazabilidad | Cumple CAL-008/009. |
| Streaming IA | SSE o JSON+stream | UI reactiva y cancelable (NFR-PR-004). |

---

## 3. Arquitectura general

```
                        ┌──────────────────────────────┐
Frontend (Next.js) ───▶ │  NestJS (monolito)           │
                        │                              │
                        │  Global: Pipes, Guards,      │
                        │  Filters, Interceptors,      │
                        │  Throttler                  │
                        │                              │
                        │  Módulos de dominio:         │
                        │   auth, users, accounts,     │
                        │   transactions, categories,  │
                        │   budgets, assets, debts,    │
                        │   goals, positions, quotes,  │
                        │   reports, dashboard,        │
                        │   assistant                  │
                        │                              │
                        │  Capa compartida:            │
                        │   calculations (reglas CAL), │
                        │   fx (exchange rates),       │
                        │   market, ai, mail,          │
                        │   database (TypeORM),        │
                        │   config                     │
                        └──────────────┬───────────────┘
                                       │
                     ┌─────────────────┼──────────────────┐
                     ▼                 ▼                  ▼
              Supabase/Postgres   Proveedor mercado   Proveedor IA / SMTP
```

- **`ValidationPipe` global** con `whitelist: true, forbidNonWhitelisted: true, transform: true` (NFR-SEG-002).
- **`JwtAuthGuard` global** por defecto (`APP_GUARD`), con decorador `@Public()` para rutas de auth (FR-AUT-004).
- **`OwnershipGuard` / utilidades** para verificar que el recurso pertenece al usuario autenticado antes de leerlo o modificarlo (NFR-SEG-001).
- **`GlobalExceptionFilter`** que normaliza errores y devuelve mensajes genéricos ante fallas sensibles (NFR-SEG-010).
- **Swagger/OpenAPI** publicado en `/api/docs` (UI) y `/api/docs-json` (spec); es el contrato del que el front puede generar tipos.

---

## 4. Estructura de archivos

```
api/
├── src/
│   ├── main.ts                      # bootstrap: pipes, cookies, swagger, CORS, prefijo /api
│   ├── app.module.ts                # módulo raíz (importa todos los módulos + config)
│   ├── config/
│   │   ├── configuration.ts         # carga y valida env
│   │   └── env.validation.ts
│   ├── database/
│   │   ├── data-source.ts           # DataSource para CLI de migraciones
│   │   └── migrations/              # migraciones TypeORM
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── ownership.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── ownership.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── period.dto.ts
│   │   └── types/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   └── entities/
│   │       └── session.entity.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── accounts/
│   ├── transactions/
│   ├── categories/
│   ├── budgets/
│   ├── assets/
│   │   └── entities/{ asset.entity.ts, valuation.entity.ts }
│   ├── debts/
│   ├── goals/                       # metas (FR-OBJ-001..004)
│   ├── positions/
│   ├── quotes/
│   ├── reports/
│   ├── dashboard/
│   ├── assistant/
│   │   ├── assistant.module.ts
│   │   ├── assistant.controller.ts
│   │   ├── assistant.service.ts
│   │   ├── assistant-context.service.ts
│   │   ├── tools/                    # ToolRegistry + ReferenceResolver + tools por dominio
│   │   ├── actions/                  # acciones pendientes (confirmación/auditoría)
│   │   ├── dto/
│   │   └── entities/
│   │       ├── ai-conversation.entity.ts
│   │       └── assistant-action.entity.ts
│   ├── calculations/                # reglas CAL-001..009
│   │   ├── calculations.module.ts
│   │   └── calculations.service.ts
│   ├── fx/                          # tasas de cambio + conversión
│   │   ├── fx.module.ts
│   │   ├── fx.service.ts
│   │   └── entities/
│   │       └── exchange-rate.entity.ts
│   ├── market/                      # integración con proveedor de mercado
│   │   ├── market.module.ts
│   │   ├── market.service.ts
│   │   └── market-scheduler.service.ts
│   ├── ai/                          # cliente del proveedor de LLM
│   │   ├── ai.module.ts
│   │   └── ai.service.ts
│   └── mail/
│       ├── mail.module.ts
│       └── mail.service.ts
├── test/                            # e2e (super) e integración
├── .env.example                     # plantilla de variables (no versionar .env)
├── package.json
└── tsconfig.json
```

**Nota sobre la estructura por módulo** (se repite en `accounts`, `transactions`, `categories`, `budgets`, `debts`, `positions`, `quotes`, `reports`, `dashboard`): cada uno contiene `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` y, cuando corresponde, `entities/`. El patrón es:

```
<feature>/
├── <feature>.module.ts     # importa TypeOrmModule.forFeature([entidades]) + deps
├── <feature>.controller.ts # rutas REST, decoradores de auth/ownership
├── <feature>.service.ts    # casos de uso (un método por caso de uso)
├── dto/                    # create-*.dto.ts, update-*.dto.ts, query-*.dto.ts
└── entities/               # entidades TypeORM
```

---

## 5. Modelo de datos (PostgreSQL)

Tablas derivadas de las entidades del FRD (§10) más las necesarias para trazabilidad y sesiones. Todos los `id` son `uuid` v4. Toda tabla con datos de usuario lleva `user_id` (o desciende de una entidad que lo tiene) y un índice.

> **Convención de columnas:** `snake_case` en la DB; los enums se almacenan como `text` con validación en la capa de aplicación (valores en §7.14); los `numeric` se serializan como `number` en la API (ver §7.13).

### 5.1 `users`
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | default gen_random_uuid() |
| name | text | |
| email | text UNIQUE | lowercase |
| password_hash | text | argon2 |
| base_currency | char(3) | default 'USD' (FR-AUT-005) |
| theme | text | 'light' | 'dark' | 'system' (FR-AUT-006) |
| ai_enabled | boolean | default false (FR-IA-001) |
| assistant_destructive_enabled | boolean | default false; habilita las acciones destructivas del asistente (FR-IA-006) |
| created_at / updated_at | timestamptz | |

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
| type | text | 'cash' | 'bank' | 'wallet' | 'card' | 'other' |
| currency | char(3) | |
| initial_balance | numeric(18,4) | |
| archived | boolean | default false |
| notes | text NULL | |
| created_at / updated_at | timestamptz | |

> Saldo actual = `initial_balance` + Σ(movimientos) en moneda de la cuenta (calculado, FR-CUE-004). Las **metas ya no son cuentas**: tienen su propia tabla y módulo `goals` (§5.12).

### 5.4 `categories` (FR-TRX-008)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | NULL para categorías por defecto del sistema |
| name | text | |
| type | text | 'income' | 'expense' |
| color | text | hex |
| icon | text NULL | |
| archived | boolean | default false |

### 5.5 `transactions` (FR-TRX-001..007)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| type | text | 'income' | 'expense' | 'transfer' |
| amount | numeric(18,4) | siempre positivo; el signo lo da `type` |
| currency | char(3) | |
| date | date | |
| description | text | |
| notes | text NULL | |
| account_id | uuid FK → accounts | |
| transfer_account_id | uuid FK NULL → accounts | solo transferencias; distinto de account_id (FR-TRX-004) |
| category_id | uuid FK NULL → categories | |
| transfer_group_id | uuid NULL | agrupa los dos lados de una transferencia (FR-TRX-005) |
| created_at / updated_at | timestamptz | |

> Las transferencias se persisten como **dos filas** (`type='transfer'`, montos con signo opuesto en cuentas distintas) en una transacción de base de datos con el mismo `transfer_group_id` (atomicidad, FR-TRX-005). Se excluyen de ingresos/gastos consolidados (CAL-003).

### 5.6 `budgets` (FR-PRE-001..006)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| category_id | uuid FK → categories | |
| period | date | primer día del mes |
| limit | numeric(18,4) | |
| currency | char(3) | |
| recurring | boolean | default `false`; renueva el presupuesto cada mes |
| created_at / updated_at | timestamptz | |
| UNIQUE(user_id, category_id, period) | | |

> **Renovación automática (FR-PRE-007):** un presupuesto con `recurring = true` actúa como plantilla desde su `period` en adelante. Al listar un mes, el API proyecta la plantilla vigente de cada categoría (la más reciente con `period <= mes`) salvo que exista un presupuesto explícito para ese `mes` + categoría, que la reemplaza. El `spent`/`status` proyectado se calcula con las transacciones del mes consultado. Desactivar `recurring` detiene la renovación a partir del mes de la plantilla.

### 5.7 `assets` (FR-ACT-001..007)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| name | text | |
| type | text | 'property' | 'vehicle' | 'cash' | 'investment' | 'crypto' | 'other' |
| currency | char(3) | |
| notes | text NULL | |
| archived | boolean | default false |
| created_at / updated_at | timestamptz | |

> La valuación vigente es la de mayor `date` en `valuations`; `currentValue`/`valuationDate` se derivan de ella.

### 5.8 `valuations` (FR-ACT-004, historial)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| asset_id | uuid FK → assets | on delete cascade |
| value | numeric(18,4) | |
| currency | char(3) | |
| date | date | fecha de valuación |
| source | text | 'manual' | 'market' |
| created_at | timestamptz | |

> La valuación vigente es la de mayor `date`; las anteriores se conservan (historial, FR-ACT-004).

### 5.9 `debts` (FR-ACT-002)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| name | text | |
| type | text | 'loan' | 'mortgage' | 'card' | 'other' |
| balance | numeric(18,4) | |
| currency | char(3) | |
| date | date | |
| archived | boolean | default false |
| asset_id | uuid FK NULL → assets | vinculación deuda-activo (FR-ACT-008) |
| created_at / updated_at | timestamptz | |

### 5.10 `positions` (FR-ACT-005/006)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| symbol | text | |
| instrument | text | nombre/descripción |
| quantity | numeric(18,8) | |
| avg_cost | numeric(18,4) | costo promedio |
| currency | char(3) | |
| archived | boolean | default false |

> Valor actual = `quantity` × último precio válido (CAL-005); ganancia = valor actual − `avg_cost` × `quantity` (CAL-006).

### 5.11 `quotes` (FR-MER-001..006)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| symbol | text | |
| price | numeric(18,8) | |
| currency | char(3) | |
| provider | text | |
| change_24h | numeric NULL | variación 24h (FR-MER-006) |
| fetched_at | timestamptz | fecha de actualización (FR-MER-002/005) |
| UNIQUE(symbol, currency, provider) | | |

> Solo se guarda el último precio por símbolo; ante falla externa se conserva el último válido con su fecha real (FR-MER-004).

### 5.12 `goals` — Objetivos (FR-OBJ-001..004)

Los objetivos son un **módulo propio** (`goals`), no un tipo de cuenta. Una meta es un **sobre virtual** referenciado a una cuenta origen donde vive el dinero; **no suma al patrimonio neto** (el dinero ya está contado en `source_account_id`) y el cliente lo presenta en una sección y ruta propias (`/goals/detail`), separadas de las cuentas comunes (`/accounts/detail`).

| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK → users | |
| name | text | |
| target_amount | numeric(18,4) | monto meta (FR-OBJ-001) |
| saved_amount | numeric(18,4) | monto acumulado/asignado, default 0 (FR-OBJ-003) |
| currency | char(3) | |
| target_date | date NULL | fecha objetivo opcional |
| source_account_id | uuid FK NULL → accounts | cuenta origen donde vive el dinero |
| archived | boolean | default false |
| created_at / updated_at | timestamptz | |

> **Reglas:** (1) la meta no admite movimientos propios; el acumulado se edita con `savedAmount` (FR-OBJ-003); (2) se excluye de `kpis.accounts` y del patrimonio neto; (3) `progressPct` y `status` los calcula el **servidor** en `calculations.service` (CAL-007), no el cliente.

### 5.13 `ai_conversations` (FR-IA-009)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| question | text | |
| answer | text | |
| context_meta | jsonb | período, moneda, fuentes consideradas (FR-IA-005) |
| messages | jsonb | transcript del hilo (`[{ role, content }]`) para dar **memoria conversacional**; se recortan los últimos turnos |
| created_at | timestamptz | |

> `question`/`answer` guardan el **último turno**; `messages` conserva el historial completo del hilo y se reinyecta al modelo en cada pregunta. La tabla se crea/actualiza con `synchronize: true`.

### 5.14 `exchange_rates` (CAL-008/009)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| base_currency | char(3) | |
| quote_currency | char(3) | |
| rate | numeric(18,8) | |
| provider | text | |
| date | date | fecha de la tasa |
| created_at | timestamptz | |
| UNIQUE(base_currency, quote_currency, provider, date) | | |

> Cada conversión registra el par, la tasa, el proveedor y la fecha utilizados (CAL-009). Las tasas pueden ser fijas (seed) o provistas por el proveedor de mercado si está disponible.

### 5.15 `assistant_actions` (FR-IA-006, auditoría y confirmación)

Cada acción de escritura que propone el asistente se guarda como una **acción pendiente** sujeta a confirmación del usuario; también sirve de auditoría. Las **tools de lectura** ejecutadas se registran en la misma tabla (fila ya `executed`, `plan_id` y `token_hash` nulos) para trazabilidad, sin bloquear la respuesta si la auditoría falla.

| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK → users | on delete cascade |
| conversation_id | uuid NULL | conversación que la originó |
| plan_id | uuid NULL | agrupa las acciones propuestas en una misma respuesta |
| step | int | orden dentro del plan (0, 1, 2…) |
| resolved | boolean | `false` si las referencias todavía no existen (dependencia pendiente) |
| tool_name | text | nombre estable de la tool (`createAccount`, `deleteBudget`, …) |
| classification | text | `read` \| `write_safe` \| `sensitive` \| `destructive` |
| args | jsonb | argumentos validados (ids del usuario) o crudos si `resolved=false` |
| preview | jsonb | resumen legible + campos mostrados al usuario |
| status | text | `proposed` \| `executed` \| `failed` \| `cancelled` \| `expired` |
| token_hash | text | hash sha-256 del token de confirmación de un solo uso |
| result | jsonb NULL | resultado/entidad al ejecutar |
| error_message | text NULL | motivo del fallo |
| expires_at | timestamptz | TTL (`AI_ACTION_TTL_MS`, default 120 s) |
| created_at / updated_at | timestamptz | |

> La confirmación bloquea la fila (`pessimistic_write`) y valida **estado, TTL y token**, además del **orden del plan** (no se puede ejecutar un paso mientras uno anterior del mismo `planId` no esté `executed`/`cancelled`); así se evita la doble ejecución y las dependencias fuera de orden. Al vencer el TTL la acción pasa a `expired`. Las tablas/columnas se crean/actualizan con **`synchronize: true`** (no hay migración para esta funcionalidad).

---

## 6. Autenticación y autorización (JWT)

### 6.1 Registro (`POST /auth/register`)
1. Valida nombre (2–80), email (formato, único, lowercase), contraseña. **Política de contraseña:** 8–72 caracteres, al menos una letra y un número. Rechaza campos inesperados (NFR-SEG-002).
2. Hashea con argon2 y crea el usuario. Asigna `base_currency` (default `USD`) y crea categorías por defecto si aplica (FR-AUT-001).
3. Crea sesión y responde `{ user }` con cookies/tokens (login automático).

### 6.2 Login (`POST /auth/login`)
1. Verifica credenciales; respuestas genéricas ante falla (NFR-SEG-010).
2. Emite **access token** (JWT, vida corta ~15 min) y **refresh token** (opaco, hash almacenado en `sessions`).
3. Responde `{ user, accessToken, refreshToken }` en el body (para clientes nativos que no usan cookies) y, en web, además fija cookies: `access_token` y `refresh_token` (`HttpOnly; Secure; SameSite=Lax` en producción; NFR-SEG-004). **El cliente web ignora los tokens del body y se apoya solo en la cookie**; el cliente nativo usa el body.
4. **Doble transporte soportado**: cookie `HttpOnly` (web) o `Authorization: Bearer` (nativo). Ambos son válidos e intercambiables.

### 6.3 Renovación
- `POST /auth/refresh` rota el refresh token (rotación, NFR-SEG-004). El refresh token viejo se invalida. Acepta el refresh token por cookie o por body (clientes nativos).

### 6.4 Logout (`POST /auth/logout`)
- Marca la sesión como revocada (`revoked_at`) → invalida la sesión activa (FR-AUT-002) y limpia cookies/tokens.

### 6.5 Autorización por request (FR-AUT-004, NFR-SEG-001)
- `JwtAuthGuard` global valida el access token en **cada** operación, aceptándolo por cookie `HttpOnly` **o** header `Authorization: Bearer <token>`.
- Los controllers obtienen el usuario vía `@CurrentUser()` y filtran/validan **siempre** por `user_id` del recurso.
- Regla de oro: **ningún `id` aportado por el cliente otorga autorización**; el servidor resuelve la propiedad (NFR-SEG-005).

### 6.6 Recuperación (FR-AUT-003)
- `POST /auth/forgot-password`: genera token de uso limitado (corto, un solo uso, con expiración), envía enlace por mail (con reintento controlado).
- `POST /auth/reset-password`: valida token, setea nueva contraseña e invalida sesiones previas.

---

## 7. API REST por módulo

Prefijo global `/api`. Respuestas paginadas: `{ items, page, pageSize, total }`. Errores: `{ statusCode, code, message }`. Todos los endpoints de datos (salvo `@Public()`) requieren sesión.

### 7.1 Auth
| Método | Ruta | FR |
| :--- | :--- | :--- |
| POST | `/auth/register` | FR-AUT-001 |
| POST | `/auth/login` | FR-AUT-002 |
| POST | `/auth/logout` | FR-AUT-002 |
| POST | `/auth/refresh` | NFR-SEG-004 |
| GET | `/auth/me` | — |
| POST | `/auth/forgot-password` | FR-AUT-003 |
| POST | `/auth/reset-password` | FR-AUT-003 |

### 7.2 Accounts
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/accounts` | listado con saldo actual |
| POST | `/accounts` | FR-CUE-001/002 |
| GET | `/accounts/:id` | — |
| PATCH | `/accounts/:id` | FR-CUE-003 |
| POST | `/accounts/:id/archive` | FR-CUE-003/005 |
| POST | `/accounts/:id/restore` | FR-CUE-003 |

### 7.3 Categories
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/categories` | — |
| POST | `/categories` | FR-TRX-008 |
| PATCH | `/categories/:id` | FR-TRX-008 |
| POST | `/categories/:id/archive` | FR-TRX-008 |

### 7.4 Transactions
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/transactions?from&to&type&accountId&categoryId&search&page` | FR-TRX-006/007 |
| POST | `/transactions` | FR-TRX-001/002 (transferencia atómica FR-TRX-004/005) |
| GET | `/transactions/:id` | — |
| PATCH | `/transactions/:id` | FR-TRX-003 |
| DELETE | `/transactions/:id` | FR-TRX-003 |

### 7.5 Budgets
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/budgets?period=` | FR-PRE-002/003/004 |
| POST | `/budgets` | FR-PRE-001 |
| PATCH | `/budgets/:id` | FR-PRE-006 |
| DELETE | `/budgets/:id` | FR-PRE-006 |
| POST | `/budgets/copy-previous` | FR-PRE-005 (P1) |

### 7.6 Assets / Valuations / Debts / Positions
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET / POST | `/assets` | FR-ACT-001/003 |
| PATCH | `/assets/:id` | FR-ACT-007 |
| POST | `/assets/:id/archive` | FR-ACT-007 |
| GET / POST | `/assets/:id/valuations` | FR-ACT-004 |
| GET / POST | `/debts` | FR-ACT-002 |
| PATCH | `/debts/:id` | FR-ACT-007 + vinculación `assetId` (FR-ACT-008, P1) |
| POST | `/debts/:id/archive` | FR-ACT-007 |
| GET / POST | `/positions` | FR-ACT-005 |
| POST | `/positions/:id/add` | FR-ACT-005/006 (suma compra: monto + precio unitario; recalcula cantidad y costo promedio) |
| PATCH / DELETE | `/positions/:id` | FR-ACT-007 |

### 7.7 Quotes
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/quotes` | catálogo con precio, proveedor, fecha y bandera de antigüedad (FR-MER-001..006) |
| POST | `/market/refresh` | dispara un refresco on-demand de cotizaciones y tipos de cambio (auth). Devuelve `MarketRefreshResult` |

### 7.8 Goals

| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/goals` | listado de metas con `progressPct` y `status` (FR-OBJ-002/004) |
| POST | `/goals` | FR-OBJ-001 |
| GET | `/goals/:id` | — |
| PATCH | `/goals/:id` | FR-OBJ-003 (actualiza `savedAmount`/metadata) |
| POST | `/goals/:id/archive` | archiva la meta |
| POST | `/goals/:id/restore` | restaura la meta |

- Las metas **no** entran en `kpis.accounts` ni en `netWorthComposition` (no suman al patrimonio) — ver §5.12.
- `sourceAccountId`, si viene, debe pertenecer al usuario autenticado; la verificación la coordina el orquestador del módulo (`goals.orchestrator.ts`) reutilizando `AccountsService`.

### 7.9 Dashboard
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/dashboard?from&to&currency=` | agrega en una sola llamada: KPIs (patrimonio, ingresos, gastos, ahorro, activos, cuentas, deudas e inversiones con sus variaciones), series de patrimonio, evolución del valor de activos, ingresos vs gastos por mes, gastos por categoría, cambios por categoría vs. período anterior, composición de activos (base bruta con cuentas netas, sin deudas), inversiones financieras y alertas de presupuesto (FR-DAS-001..007). `kpis.netWorth = activos + inversiones + cuentas netas − deudas`; la suma de `netWorthComposition` es el activo bruto y restando `kpis.debts` reconstruye el patrimonio neto |

### 7.10 Reports
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/reports/summary?from&to` | FR-REP-001 |
| GET | `/reports/by-category?from&to` | FR-REP-002 |
| GET | `/reports/net-worth?from&to` | FR-REP-003 |
| GET | `/reports/budgets?period=` | FR-REP-004 |
| GET | `/reports/investments` | FR-REP-005 (P1) |
| GET | `/reports/export?from&to&type=transactions|summary&format=csv` | FR-REP-006 |

### 7.11 Assistant
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/assistant/conversations` | FR-IA-009 (paginado) |
| GET | `/assistant/conversations/:id` | FR-IA-009 |
| DELETE | `/assistant/conversations/:id` | FR-IA-009 |
| DELETE | `/assistant/conversations` | borrar historial (FR-IA-009) |
| POST | `/assistant/messages` | pregunta; responde con stream (FR-IA-002..011) |
| POST | `/assistant/actions/:id/confirm` | confirma y ejecuta una acción propuesta (FR-IA-006) |
| POST | `/assistant/actions/:id/cancel` | cancela una acción propuesta |

> El estado habilitado/deshabilitado de la IA (FR-IA-001) es una **preferencia del usuario** (`users.ai_enabled`), expuesta en `GET /auth/me` y modificable con `PATCH /users/me`. No existe un endpoint separado de settings del asistente: una sola fuente de verdad.

### 7.12 Users (perfil y preferencias)
| Método | Ruta | FR |
| :--- | :--- | :--- |
| PATCH | `/users/me` | actualiza `name`, `baseCurrency`, `theme`, `aiEnabled`, `assistantDestructiveEnabled` (FR-AUT-005/006, FR-IA-001/006) |

```jsonc
// PATCH /users/me — body (todos opcionales, al menos uno)
{ "name": "Ana", "baseCurrency": "ARS", "theme": "dark", "aiEnabled": true, "assistantDestructiveEnabled": true }
// response 200 → User (mismo shape que GET /auth/me)
```

### 7.13 Convenciones de contrato

- **Casing:** la base de datos usa `snake_case`; la **API JSON usa `camelCase`**. Las entidades TypeORM no se exponen: se serializan con DTOs/mappers (`initial_balance` → `initialBalance`).
- **IDs:** `uuid` v4.
- **Fechas:** los campos `date` viajan como `"YYYY-MM-DD"`; los `timestamptz` como ISO 8601 UTC (`"2026-09-11T14:30:00.000Z"`).
- **Decimales:** `numeric` se serializa como **number** (no string). Máx. 4 decimales para montos; 8 para cantidades y cotizaciones. Implementar un `transformer` de TypeORM (`parseFloat` al leer) o mappers de salida.
- **Paginación:** query `page` (default 1) y `pageSize` (default 20, máx. 100). Respuesta: `{ items, page, pageSize, total, totalPages }`. Son paginados: `/transactions` y `/assistant/conversations`. El resto de listados (`/accounts`, `/goals`, `/categories`, `/budgets`, `/assets`, `/assets/:id/valuations`, `/debts`, `/positions`, `/quotes`) devuelven un **array** completo.
- **Filtros de query:** todos opcionales; `from`/`to` en `YYYY-MM-DD` inclusive; `search` busca en `description` y `notes` con `ILIKE`.
- **Errores:** `{ statusCode, code, message, fieldErrors? }`; `fieldErrors` es `{ [campo]: string[] }` para validación (para mapeo a formularios). El filtro global nunca expone detalles internos (NFR-SEG-010).
- **Auth:** cookie `HttpOnly` o `Authorization: Bearer`. Los endpoints `@Public()` son: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/health` y los assets de Swagger.
- **CORS:** con credenciales habilitadas; permitir `CORS_ORIGIN` y `CORS_ORIGIN_NATIVE` exactos (no `*`).

### 7.14 Enums y catálogos

| Concepto | Valores |
| :--- | :--- |
| `AccountType` | `cash` \| `bank` \| `wallet` \| `card` \| `other` |
| `TransactionType` | `income` \| `expense` \| `transfer` |
| `CategoryType` | `income` \| `expense` |
| `AssetType` | `property` \| `vehicle` \| `cash` \| `investment` \| `crypto` \| `other` |
| `DebtType` | `loan` \| `mortgage` \| `card` \| `other` |
| `BudgetStatus` | `available` \| `warning` \| `exceeded` |
| `GoalStatus` | `pending` \| `in_progress` \| `achieved` \| `overdue` |
| `Theme` | `light` \| `dark` \| `system` |
| `ValuationSource` | `manual` \| `market` |

- **Monedas soportadas** (configurable por env `SUPPORTED_CURRENCIES`, default): `ARS, USD, EUR, BRL, UYU`. Se exponen en `GET /currencies`.
- **Catálogo de mercado** (configurable por env `MARKET_SYMBOLS`, default): `BTC, ETH, USDT, USDC, SOL, BNB`. Solo cripto (FR-MER-001).
- **Categorías por defecto** (semilla, `user_id = NULL`): income (`salary`, `freelance`, `other_income`), expense (`food`, `transport`, `housing`, `services`, `entertainment`, `other_expense`). Son de solo lectura; el usuario crea las suyas.
- **Umbral de presupuesto** (`BUDGET_WARNING_THRESHOLD`, default `0.8`): `warning` si `spent >= 0.8 * limit`; `exceeded` si `spent > limit`.

### 7.15 Esquemas de request/response por módulo

**Auth**
```jsonc
// POST /auth/register — body
{ "name": "Ana", "email": "ana@example.com", "password": "Secreta123" }
// 201 → { "user": User }  (y fija cookies / tokens, igual que login)

// POST /auth/login — body
{ "email": "ana@example.com", "password": "Secreta123" }
// 200 → { "user": User, "accessToken": "eyJ...", "refreshToken": "opaco..." }

// POST /auth/refresh — body opcional (nativo)
{ "refreshToken": "opaco..." }   // en web puede omitirse (usa cookie)
// 200 → { "accessToken": "...", "refreshToken": "..." }  (rotación)

// User
{ "id": "uuid", "name": "Ana", "email": "ana@example.com",
  "baseCurrency": "ARS", "theme": "system", "aiEnabled": false, "createdAt": "ISO" }
```

**Accounts**
```jsonc
// POST /accounts — body
{ "name": "Caja", "type": "cash", "currency": "ARS", "initialBalance": 50000, "notes": null }
// Account
{ "id": "uuid", "name": "Caja", "type": "cash", "currency": "ARS",
  "initialBalance": 50000, "currentBalance": 73500, "archived": false, "notes": null,
  "createdAt": "ISO", "updatedAt": "ISO" }
```

**Categories**
```jsonc
// POST /categories — body
{ "name": "Comida", "type": "expense", "color": "#ef4444", "icon": "utensils" }
// Category
{ "id": "uuid", "name": "Comida", "type": "expense", "color": "#ef4444",
  "icon": "utensils", "archived": false, "isSystem": false }
```

**Transactions**
```jsonc
// POST /transactions — income | expense
{ "type": "expense", "amount": 12000, "currency": "ARS", "date": "2026-09-10",
  "description": "Supermercado", "notes": null, "accountId": "uuid", "categoryId": "uuid" }

// POST /transactions — transfer (un solo request, dos filas atómicas)
{ "type": "transfer", "amount": 30000, "currency": "ARS", "date": "2026-09-10",
  "description": "Ahorro", "accountId": "uuid-origen", "transferAccountId": "uuid-destino" }

// Transaction
{ "id": "uuid", "type": "expense", "amount": 12000, "currency": "ARS", "date": "2026-09-10",
  "description": "Supermercado", "notes": null, "accountId": "uuid", "categoryId": "uuid",
  "transferGroupId": null, "createdAt": "ISO", "updatedAt": "ISO" }
```
- `amount` es positivo en `income`/`expense` (el signo lo determina `type`, CAL-002/003). En transferencias, cada lado se persiste con signo opuesto: negativo en la cuenta origen y positivo en la destino.
- `transferGroupId` no nulo agrupa los dos lados de una transferencia.
- `DELETE /transactions/:id` de una transferencia elimina **ambos lados** del grupo.
- `PATCH /transactions/:id` de una transferencia edita **ambos lados** atómicamente (si cambian `accountId`/`transferAccountId`, se reasignan).
- Validación: `accountId !== transferAccountId` en transferencias; cuenta/categoría pertenecen al usuario; cuenta archivada no admite movimientos (FR-TRX-004, FR-CUE-005).

**Budgets**
```jsonc
// POST /budgets — body
{ "categoryId": "uuid", "period": "2026-09-01", "limit": 80000, "currency": "ARS", "recurring": true }
// PATCH /budgets/:id — body (parcial)
{ "limit": 90000, "currency": "ARS", "recurring": false }
// GET /budgets?period=2026-09 → Budget[]
// Incluye los presupuestos explícitos del mes y las proyecciones de los recurrentes vigentes.
{ "id": "uuid", "categoryId": "uuid", "category": { "id": "uuid", "name": "Comida", "color": "#ef4444" },
  "period": "2026-09-01", "limit": 80000, "currency": "ARS", "recurring": true,
  "spent": 65000, "available": 15000, "consumedPct": 81.25, "status": "warning" }
// POST /budgets/copy-previous — body
{ "period": "2026-09-01", "sourcePeriod": "2026-08-01" }   // sourcePeriod opcional (default: mes anterior)
```

**Assets / Valuations**
```jsonc
// POST /assets — body
{ "name": "Depto", "type": "property", "currency": "ARS", "initialValue": 90000000, "date": "2026-09-01", "notes": null }
// Asset
{ "id": "uuid", "name": "Depto", "type": "property", "currency": "ARS",
  "currentValue": 90000000, "valuationDate": "2026-09-01", "archived": false,
  "debtId": null, "notes": null, "createdAt": "ISO", "updatedAt": "ISO" }
// POST /assets/:id/valuations — body
{ "value": 95000000, "currency": "ARS", "date": "2026-09-11", "source": "manual" }
// GET /assets/:id/valuations → Valuation[]
{ "id": "uuid", "assetId": "uuid", "value": 95000000, "currency": "ARS",
  "date": "2026-09-11", "source": "manual", "createdAt": "ISO" }
```

**Debts**
```jsonc
// POST /debts — body
{ "name": "Hipoteca", "type": "mortgage", "balance": 45000000, "currency": "ARS", "date": "2026-09-01" }
// Debt
{ "id": "uuid", "name": "Hipoteca", "type": "mortgage", "balance": 45000000,
  "currency": "ARS", "date": "2026-09-01", "archived": false, "assetId": null }
```
- La vinculación deuda↔activo (FR-ACT-008) se expresa como `assetId` en `Debt`; `PATCH /debts/:id` con `{ "assetId": "uuid" }` o `{ "assetId": null }` para desvincular.

**Positions / Quotes**
```jsonc
// POST /positions — body
{ "symbol": "BTC", "instrument": "Bitcoin", "quantity": 0.05, "avgCost": 55000, "currency": "USD" }
// Position (con valorización)
{ "id": "uuid", "symbol": "BTC", "instrument": "Bitcoin", "quantity": 0.05,
  "avgCost": 55000, "currency": "USD", "currentPrice": 64000,
  "currentValue": 3200, "costBasis": 2750, "profitLoss": 450, "profitLossPct": 16.36,
  "quoteDate": "ISO", "quoteProvider": "binance", "isStale": false }
// GET /quotes → Quote[]
{ "symbol": "BTC", "price": 64000, "currency": "USD", "provider": "binance",
  "change24h": 1.8, "fetchedAt": "ISO", "isStale": false }
```
- Matching posición↔cotización: por `symbol` + `currency`; valor actual = `quantity × price` (CAL-005); ganancia = `currentValue − quantity × avgCost` (CAL-006).
- `isStale` se calcula con `QUOTE_STALE_MS` (true si `now − fetchedAt > umbral`); la cotización se conserva aunque sea vieja (FR-MER-004/005).

**Goals**
```jsonc
// POST /goals — body
{ "name": "Vacaciones", "targetAmount": 500000, "savedAmount": 120000, "currency": "ARS",
  "targetDate": "2026-06-01", "sourceAccountId": "uuid-banco" }
// PATCH /goals/:id — body (parcial; savedAmount actualiza el acumulado, FR-OBJ-003)
{ "savedAmount": 150000 }
// Goal
{ "id": "uuid", "name": "Vacaciones", "targetAmount": 500000, "savedAmount": 120000,
  "currency": "ARS", "targetDate": "2026-06-01", "sourceAccountId": "uuid-banco",
  "archived": false, "progressPct": 24, "status": "in_progress",
  "createdAt": "ISO", "updatedAt": "ISO" }
```

- `progressPct` (CAL-007) y `status` (FR-OBJ-004) los calcula el **servidor** en `calculations.service`; el cliente solo los muestra.
- `sourceAccountId` debe pertenecer al usuario; la meta **no suma** al patrimonio neto ni a `kpis.accounts` (§5.12).

**Dashboard**
```jsonc
// GET /dashboard?from=2026-06-01&to=2026-09-30&currency=ARS
{
  "period": { "from": "2026-06-01", "to": "2026-09-30" },
  "currency": "ARS",
  "kpis": {
    "netWorth": 1200000, "netWorthDeltaPct": 3.4,
    "income": 900000, "incomeDeltaPct": 5.1,
    "expenses": 640000, "expensesDeltaPct": -2.0,
    "savings": 260000, "savingsDeltaPct": 12.0, "savingsRateDeltaPp": 3.2,
    "assets": 102000000, "assetsDeltaPct": 1.8,
    "debts": 42000000, "debtsDeltaPct": -2.1,
    "accounts": 2262000, "accountsDeltaPct": null, "investmentsDeltaPct": 19.6
  },
  "netWorthSeries": [{ "date": "2026-06-30", "value": 1000000, "assets": 103000000, "debts": 42000000 }],
  "assetsValueByMonth": [{ "month": "2026-06", "value": 97000000 }],
  "incomeExpenseByMonth": [{ "month": "2026-06", "income": 300000, "expenses": 210000 }],
  "expensesByCategory": [{ "categoryId": "uuid", "name": "Comida", "color": "#ef4444", "value": 120000 }],
  "categoryChanges": [{ "categoryId": "uuid", "name": "Comida", "current": 120000, "previous": 202000, "deltaPct": -40.6 }],
  "assetsComposition": [{ "type": "property", "value": 90000000 }],
  "netWorthComposition": [
    { "kind": "property", "label": "Propiedades", "value": 90000000 },
    { "kind": "vehicle", "label": "Vehículos", "value": 12000000 },
    { "kind": "investment", "label": "Inversiones", "value": 5680000 },
    { "kind": "account", "label": "Cuentas", "value": 2262000 }
  ],
  "investments": {
    "totalValue": 5680000, "totalCost": 4750000, "profitLoss": 930000, "profitLossPct": 19.6, "staleQuotes": 1,
    "positions": [{
      "symbol": "BTC", "instrument": "Bitcoin", "quantity": 0.05,
      "originalCurrency": "USD", "originalValue": 3200, "originalCost": 2750, "originalProfitLoss": 450,
      "value": 3200000, "profitLossPct": 16.4, "isStale": false, "quoteDate": "2026-09-12T12:00:00.000Z"
    }]
  },
  "budgetAlerts": [{ "budgetId": "uuid", "categoryName": "Comida", "consumedPct": 95, "status": "warning" }]
}
```

**Reports**
```jsonc
// GET /reports/summary?from&to
{ "from": "2026-06-01", "to": "2026-09-30", "currency": "ARS",
  "income": 900000, "expenses": 640000, "savings": 260000, "netWorth": 1200000 }
// GET /reports/by-category?from&to
[{ "categoryId": "uuid", "name": "Comida", "type": "expense", "value": 120000, "pct": 18.75 }]
// GET /reports/net-worth?from&to
[{ "date": "2026-06-30", "netWorth": 1000000 }]
// GET /reports/budgets?period=2026-09
[{ "budgetId": "uuid", "categoryName": "Comida", "limit": 80000, "spent": 65000, "consumedPct": 81.25, "status": "warning" }]
// GET /reports/export?...&format=csv → text/csv (Content-Disposition: attachment; filename="atlass-fin-<from>-<to>.csv")
```

### 7.16 Contrato de streaming del asistente

`POST /assistant/messages` responde `text/event-stream` (SSE). **El cliente debe usar `fetch` + `ReadableStream`, no `EventSource`**, porque `EventSource` no permite el header `Authorization` (necesario en nativo) ni el cuerpo de request.

**Proveedor implementado: DeepSeek** (OpenAI-compatible). El backend llama a `POST {AI_BASE_URL}/chat/completions` con `Authorization: Bearer {AI_API_KEY}`, `stream: true` y `model: {AI_MODEL}` (default `deepseek-chat`), y reemite el texto como eventos SSE. La API key **nunca** sale del servidor (NFR-SEG-007); el cliente no conoce credenciales del proveedor y con el modo mock (`NEXT_PUBLIC_USE_MOCKS`, default) ni siquiera toca el endpoint.

```jsonc
// Request body
{ "question": "¿En qué gasté más este mes?", "conversationId": null,
  "period": { "from": "2026-09-01", "to": "2026-09-30" }, "currency": "ARS" }
// (conversationId = null crea una conversación nueva en el servidor)
// Si enviás un conversationId existente, el backend reinyecta los turnos previos de ese hilo
// (memoria conversacional) además del resumen del período.

// Eventos SSE (cada uno: `event: <nombre>\ndata: <json>\n\n`)
event: meta    data: { "conversationId": "uuid", "period": {...}, "currency": "ARS", "sources": ["transactions", "budgets"] }
event: token   data: { "delta": "Este mes " }
event: token   data: { "delta": "gastaste más en..." }
event: action_proposal data: { "actionId": "uuid", "token": "opaco", "name": "createAccount", "title": "Crear cuenta", "classification": "write_safe", "destructive": false, "summary": "Crear la cuenta \"Banco Galicia\" en ARS", "preview": { "title": "Crear cuenta", "summary": "...", "fields": [{ "label": "Nombre", "value": "Banco Galicia" }] }, "expiresAt": "ISO" }
event: action_error data: { "name": "createTransaction", "title": "Crear movimiento", "code": "VALIDATION_ERROR", "message": "No encontré ninguna categoría que coincida..." }
event: done    data: { "conversationId": "uuid", "insufficient": false }
event: error   data: { "code": "AI_UNAVAILABLE", "message": "..." }
```
- **Tool calling:** `POST /assistant/messages` habilita *function calling* del proveedor. Las **tools de lectura** (`listAccounts`, `listTransactions`, `listBudgets`, `listAssets`, `listValuations`, `listDebts`, `listPositions`, `listGoals`, `listCategories`, `getProfile`, `getDashboard`, `getReportSummary`, `getReportByCategory`, `listQuotes`) se ejecutan al instante y devuelven datos al modelo (las lecturas de un mismo paso se ejecutan en paralelo). Las **tools de escritura** (una por primitiva: `create*`, `update*`, `archive*`, `restore*`, `transferBetweenAccounts`, `createValuation`, `contributeToGoal`, `copyPreviousBudgets`, `addToPosition`) **no se ejecutan en el stream**: crean una acción pendiente y emiten `event: action_proposal` con la vista previa. `addToPosition` suma una compra a una posición existente (monto + precio unitario) y el backend recalcula cantidad y costo promedio ponderado; `contributeToGoal` **suma** al acumulado de la meta (no lo sobrescribe). Las propuestas idénticas (misma tool y argumentos) dentro de un mismo plan **no se duplican**. **No hay tools compuestas**: una operación compleja se propone como **varias acciones** (una tarjeta por tool).
- **Plan y dependencias:** todas las acciones propuestas en una misma respuesta comparten `planId` y llevan `step` (orden). Las referencias se resuelven en la preparación; si un nombre todavía no existe **pero fue propuesto para crearse en el mismo plan** (p. ej. una deuda vinculada a un activo que se está creando), la acción queda marcada `pending` con los argumentos crudos y se emite igual su tarjeta. Si el nombre no corresponde a ninguna creación del plan, se emite `action_error` (`NOT_FOUND`) en lugar de una tarjeta imposible de resolver. Al confirmar, el backend **verifica el orden del plan** y **reintenta la resolución**: si el paso previo no está `executed`/`cancelled`, responde `ACTION_DEPENDENCY_PENDING`; si el paso previo ya se ejecutó, ejecuta. El cliente ordena las tarjetas, bloquea las posteriores hasta que la previa se resuelva y permite **Reintentar/Cancelar** las que fallan.
- **Confirmación:** el cliente confirma con `POST /assistant/actions/:id/confirm` (body `{ token }`) y recibe un `ActionResultDto` (`status: executed|failed`, `summary`, `entity`, `code?`, `fieldErrors?`). También puede cancelar con `POST /assistant/actions/:id/cancel`. La ejecución reutiliza los **mismos servicios primarios/orquestadores** que el REST (no hay lógica de dominio en el asistente).
- **Propuestas y errores:** el modelo debe proponer los cambios **llamando a la tool** (la tarjeta solo existe si hubo tool call). Si la preparación falla (dato faltante, referencia ambigua, destructiva deshabilitada), se emite `event: action_error` con el motivo y no se crea ninguna acción.
- **Resolución de referencias:** las tools aceptan id (uuid) o nombre, siempre resueltos **por el usuario autenticado**; si hay ambigüedad o no existe, el servidor no adivina y pide precisión. Un id aportado por el modelo nunca otorga autorización.
- **Destructivas (opt-in):** `deleteTransaction`, `deleteBudget` y `deletePosition` (clase `destructive`) solo se envían al modelo si el usuario activó `assistantDestructiveEnabled`; si no, ni siquiera están disponibles.
- Cada ejecución queda auditada en `assistant_actions` (§5.15) y se evita la doble ejecución con estado + token de un solo uso + TTL.
- Si la IA está deshabilitada → `403 AI_DISABLED` (JSON, no stream).
- Si faltan datos verificables → `event: done` con `insufficient: true` y texto explicativo (FR-IA-011).
- El servidor persiste pregunta, respuesta y `contextMeta` en `ai_conversations` al finalizar (FR-IA-009).
- La respuesta del modelo se valida y se sirve como texto plano; nunca como HTML (NFR-SEG-006/012).

### 7.17 Catálogo de códigos de error

| `code` | HTTP | Cuándo |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | DTO inválido (incluye `fieldErrors`) |
| `INVALID_CREDENTIALS` | 401 | login fallido |
| `UNAUTHENTICATED` | 401 | sin sesión o token inválido/expirado |
| `SESSION_REVOKED` | 401 | refresh token revocado |
| `FORBIDDEN` | 403 | recurso de otro usuario |
| `AI_DISABLED` | 403 | asistente deshabilitado |
| `DESTRUCTIVE_DISABLED` | 403 | acción destructiva con el flag del usuario apagado |
| `ACTION_NOT_ALLOWED` | 403/400 | acción no disponible o token de confirmación inválido |
| `ACTION_ALREADY_EXECUTED` | 409 | la acción ya fue ejecutada |
| `ACTION_EXPIRED` | 410 | la acción superó su TTL |
| `ACTION_DEPENDENCY_PENDING` | 409 | falta confirmar una acción previa del mismo plan (`planId`) |
| `NOT_FOUND` | 404 | recurso inexistente o ajeno |
| `ACCOUNT_ARCHIVED` | 409 | movimiento sobre cuenta archivada |
| `DUPLICATE_BUDGET` | 409 | presupuesto ya existe para categoría/período |
| `EMAIL_IN_USE` | 409 | registro con email existente |
| `RATE_LIMITED` | 429 | límite de frecuencia |
| `MARKET_UNAVAILABLE` | 502 | falla del proveedor de mercado |
| `AI_UNAVAILABLE` | 502 | falla del proveedor de IA |
| `INTERNAL_ERROR` | 500 | error inesperado (mensaje genérico) |

### 7.18 Reference y salud
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/currencies` | `{ "default": "ARS", "supported": ["ARS","USD","EUR","BRL","UYU"] }` (FR-AUT-005) |
| GET | `/health` | `{ "status": "ok", "db": "up" }` — `@Public()` |

---

## 8. Reglas de cálculo

Centralizadas en `calculations.service.ts` para garantizar consistencia entre dashboard, reportes e IA. Cubiertas por pruebas unitarias (NFR-CAL-004).

| Regla | Implementación |
| :--- | :--- |
| CAL-001 Patrimonio neto | Σ valuaciones vigentes de activos (convertidas) − Σ deudas (convertidas) en moneda base. |
| CAL-002 Flujo de fondos | Σ ingresos − Σ gastos del período (excluye transferencias). |
| CAL-003 Transferencias | `type='transfer'` se excluye de ingresos/gastos consolidados. |
| CAL-004 Consumo presupuesto | Σ gastos de la categoría y período / límite × 100; si límite = 0, no dividir (devolver 0 o estado "sin límite"). |
| CAL-005 Valor de posición | cantidad × último precio válido en la moneda del instrumento. |
| CAL-006 Ganancia nominal | valor actual − (cantidad × avg_cost). |
| CAL-007 Progreso de objetivo | acumulado / meta × 100, con mínimo 0% (sin techo). Implementado en `calculations.service.calculateGoalProgress`; lo expone `GET /goals` como `progressPct` + `status`. |
| CAL-008 Conversión | importe × última tasa válida a la fecha de cálculo (vía `fx.service`). |
| CAL-009 Trazabilidad | cada conversión registra par, tasa, proveedor y fecha (`exchange_rates`). |

**Estados de presupuesto (FR-PRE-003):** `available` (< umbral de advertencia), `warning` (≥ umbral y ≤ 100%), `exceeded` (> 100%). Umbral configurable (p. ej. 80%).

**Estados de objetivo (FR-OBJ-004):** `pending` (sin acumulado), `in_progress` (0 < progreso < 100% y no vencido), `achieved` (≥ 100%), `overdue` (fecha pasada sin alcanzar).

---

## 9. Integraciones externas

Todas desde el backend, con timeout, validación de host, HTTPS y redirecciones deshabilitadas (NFR-SEG-009).

### 9.1 Proveedor de mercado (actor "Proveedor de mercado")
- **Cripto — Binance** (`MARKET_API_URL`, sin API key ni atribución): `GET /ticker/24hr?symbols=[...]` devuelve precio y variación 24h en una sola llamada (FR-MER-001; símbolos soportados en `crypto-symbols.ts`). Cotiza contra `USDT` y se etiqueta con `MARKET_VS_CURRENCY` (default `USD`).
- **Monedas — currency-api de Fawaz Ahmed** (`FX_API_URL`, sin API key ni atribución): base `ARS`, deriva `X:ARS` y actualiza `exchange_rates` (CAL-009). Es la fuente del pivote que usa `fx.service`.
- `MarketSchedulerService` (`@nestjs/schedule`) refresca al arrancar y luego cada `MARKET_REFRESH_INTERVAL_MS` (default 5 min); `POST /market/refresh` permite forzarlo. Todo es configurable con `MARKET_ENABLED`, `MARKET_SYMBOLS`, `MARKET_VS_CURRENCY`, `MARKET_TIMEOUT_MS`.
- Ante falla, mantiene el último valor válido en base y NO inventa uno nuevo (FR-MER-004); expone `fetched_at` para marcar antigüedad (FR-MER-005). Se conserva un único proveedor por par símbolo/moneda.
- Guarda `symbol, price, currency, provider, fetched_at` (FR-MER-002) y `change_24h` si lo informa (FR-MER-006). Alcance actual: cripto y monedas; acciones/ETFs fuera de alcance.

### 9.2 Proveedor de IA (actor "Proveedor de IA")
`assistant.service.ts` + `ai.service.ts`:

1. Verifica que la IA esté habilitada (FR-IA-001) y que la sesión sea válida.
2. Calcula **localmente** totales y métricas del período (FR-IA-004) usando `calculations.service`.
3. Construye el **contexto mínimo** (solo datos del usuario autenticado, FR-IA-002/003/007) y envía la pregunta al LLM.
4. El prompt de sistema es fijo y **separado** de los datos del usuario, que viajan como datos no confiables (FR-IA-010). Se valida la salida antes de presentarla (NFR-SEG-012).
5. Adjunta metadatos: período, moneda y fuentes consideradas (FR-IA-005).
6. Declara "información insuficiente" cuando los datos no permiten conclusión verificable (FR-IA-011).
7. **No** expone operaciones arbitrarias (FR-IA-006). **Implementado:** un catálogo de tools tipadas y clasificadas (`read`/`write_safe`/`sensitive`/`destructive`) sobre todos los dominios, que reutilizan los mismos servicios primarios/orquestadores que el REST. Toda tool resuelve la propiedad desde el usuario autenticado y nunca acepta `userId` del modelo. Las mutaciones requieren **confirmación** (acción pendiente + token de un solo uso) y las destructivas exigen `assistantDestructiveEnabled`. Respuesta marcada como informativa (FR-IA-008).

**Implementación actual (DeepSeek):**

- `shared/ai/ai.service.ts` (`AiModule`): cliente del proveedor (DeepSeek/OpenAI-compatible) con `axios` `responseType: "stream"`, timeout de `AI_TIMEOUT_MS` y aborto; expone `streamChat(messages)` como `AsyncGenerator<string>`. Mapea fallas a `AI_UNAVAILABLE` (NFR-SEG-009).
- `shared/calculations/calculations.service.ts` (`CalculationsModule`): fuente única de las reglas CAL-001..004 (flujo del período, gastos del mes, consumo/estado de presupuesto, saldo actual por movimientos, última valuación por activo y patrimonio neto). El asistente la reutiliza en lugar de repetir fórmulas. Cubierta por pruebas unitarias.
- `assistant/assistant-context.service.ts`: arma el **contexto mínimo** del usuario consultando sus entidades (transacciones del período, top categorías de gasto, presupuestos del mes, patrimonio estimado con valuaciones/deudas/posiciones y saldos actuales `initial_balance + Σ movimientos`) usando `calculations.service`, y produce un resumen textual. *Deviación conocida:* hoy consulta repositorios directamente porque los dominios de finanzas del API todavía son esqueletos (solo entidades); cuando existan los servicios primarios, este armado debe moverse a un orquestador que los coordine (ver `orchestrator-domain-architecture`).
- `assistant/assistant.service.ts`: `assertAiEnabled`, persistencia en `ai_conversations` y `answer()` como generador de eventos (`meta`/`token`/`action_proposal`/`done`). Coordina lecturas y propone mutaciones vía `ToolRegistry` + `PendingActionsService`; `POST /assistant/actions/:id/{confirm,cancel}` ejecuta o cancela. El **prompt de sistema es fijo** y declara explícitamente el alcance: solo un resumen agregado del período indicado, sin detalle de movimientos ni historial de otros períodos; ante preguntas fuera de ese alcance debe aclararlo (FR-IA-010/011).
- `assistant/assistant.controller.ts`: `POST /assistant/messages` (SSE), `GET /assistant/conversations` (paginado), `GET/DELETE /assistant/conversations/:id`, `DELETE /assistant/conversations`. Si `aiEnabled === false` responde `403 AI_DISABLED` en JSON (no abre el stream).
- **Acceso dev del stream**: `POST /assistant/messages` está marcado `@Public()` pero resuelve el usuario así: si hay sesión válida la usa; si no, y `NODE_ENV !== "production"`, cae al usuario demo `AI_DEV_USER_EMAIL`; en producción sin sesión responde `401 UNAUTHENTICATED`. Permite probar el asistente con el cliente en modo mock sin implementar todo el auth. Los endpoints de historial siguen requiriendo JWT.
- El cliente consume el stream en `client/lib/api/assistant-stream.ts` (mock con `NEXT_PUBLIC_USE_MOCKS`).

> Estado: los dominios de finanzas (auth, users, accounts, categories, transactions, budgets, assets/valuations, debts, positions, quotes, dashboard y reports) ya exponen sus servicios y endpoints, por lo que el asistente es ejecutable end-to-end con sesión válida. La key `AI_API_KEY` va en `api/.env`. El armado de contexto sigue leyendo repositorios directamente (ver nota anterior) y debe migrarse a un orquestador cuando se refactorice.

### 9.3 Servicio de correo (actor "Servicio de correo")
- Envío de enlace de recuperación con token temporal. Ante falla, informa que no pudo enviarse y permite reintento (dependencia §11 FRD).

---

## 10. Seguridad

| NFR | Implementación |
| :--- | :--- |
| NFR-SEG-001 | `JwtAuthGuard` global + resolución de propiedad por `user_id` en cada consulta. |
| NFR-SEG-002 | `ValidationPipe` global con whitelist y forbidNonWhitelisted; límites/longitud/formato en DTOs. |
| NFR-SEG-003 | `argon2` para hashing; nunca texto plano. |
| NFR-SEG-004 | Cookies HttpOnly/Secure/SameSite, expiración, rotación de refresh token. |
| NFR-SEG-005 | `uuid` no predecibles; consultas parametrizadas (TypeORM); el ID cliente no otorga autorización. |
| NFR-SEG-006 | El backend devuelve JSON/texto; el front escapa todo HTML (no se renderiza HTML sin sanitizar). |
| NFR-SEG-007 | Secretos solo en servidor vía env, fuera del repositorio (`.env` ignorado). |
| NFR-SEG-008 | Logging sin contraseñas, tokens, prompts completos ni datos sensibles. |
| NFR-SEG-009 | `HttpModule` con HTTPS, timeout, validación de host y sin seguir redirecciones. |
| NFR-SEG-010 | `@nestjs/throttler` en login, recuperación, cotizaciones e IA; errores genéricos. |
| NFR-SEG-011 | Eliminación de historial IA y contexto mínimo transmitido al proveedor. |
| NFR-SEG-012 | Separación instrucciones/datos; validación de salida del modelo. |

---

## 11. Datos de demostración (seed)

`seed` ejecutable (`npm run seed`) que crea un usuario ficticio y datos reproducibles (NFR-CAL-005, FRD §12):

- Un usuario demo sin datos reales.
- Tres cuentas en al menos dos monedas.
- Tres meses de ingresos, gastos y transferencias.
- Cinco categorías y cuatro presupuestos mensuales.
- Una propiedad, un vehículo, una deuda y su historial de valuaciones.
- Dos posiciones de cripto con cotizaciones identificadas.
- Dos objetivos con distinto avance.
- Preguntas de IA preparadas (gastos, presupuesto, evolución patrimonial).

**Credenciales del usuario demo:** `demo@atlassfin.app` / `Demo1234!` (mostradas en el README y usadas por el front en la pantalla de login).

El seed es **idempotente** (verifica existencia antes de insertar) y no pisa datos si ya existen.

---

## 12. Configuración y variables de entorno

`.env.example` (nunca versionar `.env`):

```env
NODE_ENV=development
PORT=3001

# Base de datos (Supabase / Postgres)
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_SSL=true

# JWT
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL_DAYS=30

# Cookies
COOKIE_SECURE=false            # true en producción
COOKIE_SAME_SITE=lax

# Frontend (CORS)
CORS_ORIGIN=http://localhost:3000
CORS_ORIGIN_NATIVE=capacitor://localhost,http://localhost   # orígenes nativos de Capacitor

# Mercado (proveedores gratis, sin API key ni atribución)
MARKET_ENABLED=true
MARKET_API_URL=https://api.binance.com/api/v3
MARKET_VS_CURRENCY=USD
FX_API_URL=https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies
MARKET_TIMEOUT_MS=8000
MARKET_REFRESH_INTERVAL_MS=300000
QUOTE_STALE_MS=3600000

# IA (DeepSeek por defecto; OpenAI-compatible)
# La API key SIEMPRE vive en el servidor: nunca exponerla con NEXT_PUBLIC_* en el cliente.
AI_PROVIDER=deepseek           # deepseek | openai
AI_API_KEY=...                 # sk-... (solo en .env del backend)
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat         # deepseek-chat | deepseek-reasoner (u otro)
AI_TIMEOUT_MS=30000
AI_ACTION_TTL_MS=120000
AI_DEV_USER_EMAIL=demo@atlassfin.app   # solo dev: usuario del stream sin JWT

# Correo
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=no-reply@example.com

# Recuperación
RESET_TOKEN_TTL=3600

# Presupuesto
BUDGET_WARNING_THRESHOLD=0.8

# Monedas y catálogo de mercado
SUPPORTED_CURRENCIES=ARS,USD,EUR,BRL,UYU
MARKET_SYMBOLS=BTC,ETH,USDT,USDC,SOL,BNB

# Cotización
QUOTE_STALE_MS=3600000
```

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

Cada tanda deja la API compilando (`npm run lint && npm run build`) y con migración + tests asociados. Alineado con el plan del front (`frontend.md`). El cliente puede consumir la API real con `NEXT_PUBLIC_USE_MOCKS=false`; los dominios de finanzas ya están implementados. Estado por tanda abajo.

### Tanda 0 — Setup del proyecto — ✅ Hecho
- Scaffold NestJS, config global (`@nestjs/config`), `ValidationPipe`, `Logger`, Swagger, prefijo `/api`, CORS, cookies.
- TypeORM + DataSource + primeras migraciones (usuarios, sesiones, cuentas, categorías, movimientos, cotizaciones, exchange_rates).
- `common/` (guards, decorators, filters, interceptors).
- **Aceptación**: API levanta, migra y responde `/api/health`.

### Tanda 1 — Autenticación — ✅ Hecho
- `auth` + `users`: register, login, refresh, logout, me; `PATCH /users/me`; `GET /currencies`; argon2; JWT strategy; cookies + `Authorization: Bearer`; throttler en login.
- `forgot-password`/`reset-password` + `mail` service (FR-AUT-003).
- **Aceptación**: FR-AUT-001..006, NFR-SEG-003/004/010.

### Tanda 2 — Cuentas, categorías y movimientos — ✅ Hecho
- CRUD `accounts`, `categories`, `transactions` con filtros y búsqueda.
- Transferencias atómicas (FR-TRX-004/005) y exclusión de consolidados (CAL-003).
- **Aceptación**: HU-001, HU-002, FR-CUE-*, FR-TRX-001..008.

### Tanda 3 — Cálculos, dashboard y reportes — ✅ Hecho
- `calculations` + `fx` (CAL-001..009), `dashboard`, `reports` (summary, by-category, net-worth, budgets, export CSV).
- Los campos que el cliente ya consume (`kpis.accounts`, `savingsRateDeltaPp`, `categoryChanges`, `netWorthComposition`, `investments.positions` con moneda original) están en el contrato §7.7 y el mock; la API debe implementarlos.
- **Aceptación**: FR-DAS-*, FR-REP-001..006.

### Tanda 4 — Presupuestos — ✅ Hecho
- CRUD `budgets`, cálculo de consumo y estados (FR-PRE-001..006), copiar mes anterior.
- **Aceptación**: HU-003.

### Tanda 5 — Activos, deudas, posiciones y mercado — ✅ Hecho
- `assets` + `valuations` + `debts` + `positions` + `quotes` implementados con valuación vigente, vínculo deuda↔activo y bandera de antigüedad de cotización.
- `market` (Binance para cripto + currency-api de Fawaz para monedas, sin API key ni atribución) + `market-scheduler` (`@nestjs/schedule`) con refresco al arranque, intervalo configurable y `POST /market/refresh`. Mantiene el último valor válido y `isStale` se calcula con `QUOTE_STALE_MS`.
- **Aceptación**: HU-004, HU-005, FR-ACT-*, FR-MER-*. Alcance: cripto y monedas (acciones/ETFs fuera de alcance).

### Tanda 6 — Objetivos y seed — ✅ Hecho
- **Los objetivos son un módulo `goals`** (no un tipo de cuenta): tabla `goals` (§5.12), endpoints `/goals` (§7.8), cálculo de progreso/estado en `calculations.service` (CAL-007) y validación de la cuenta origen vía orquestador. **No suman al patrimonio neto** (son un "sobre virtual" cuyo dinero ya está en la cuenta origen). En el cliente aparecen como **Metas**, bloque y ruta propios (`/goals/detail`), distintos de **Cuentas** (`/accounts/detail`).
- `seed` de datos de demo (incluye metas con cuenta origen).
- **Aceptación**: FR-OBJ-001..004, FRD §12.

### Tanda 7 — Asistente IA — ◐ Parcial
- `assistant` + `ai`: conversaciones, mensajes con stream SSE (contrato §7.16), contexto mínimo, metadatos, insuficiencia.
- **Aceptación**: HU-006, FR-IA-001..011, NFR-SEG-011/012.

### Tanda 8 — Endurecimiento — ⬜ Pendiente
- Tests e2e P0, rate limiting completo, timeout en salidas externas, logging seguro, validación de host.
- **Aceptación**: NFR-SEG-005..010, NFR-PR-003/004, NFR-CAL-004.

> **Nota**: funcionalidades P2 (import CSV FR-TRX-009, recurrentes FR-TRX-010, PDF FR-REP-007) quedan fuera de la entrega inicial.
