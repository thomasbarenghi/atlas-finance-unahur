# Atlass Fin — Documento Técnico del Backend

> **Audiencia:** agentes de IA que implementarán el backend.
> **Stack:** NestJS (monolítico) · TypeScript · PostgreSQL (Supabase como proveedor) · TypeORM · JWT (cookie HttpOnly + Bearer) · REST.
> **Frontend:** consume esta API. Ver `frontend.md`.
> **Referencia funcional:** `../specification/FRD_Gestor_Financiero_v0.2.md`. Todo requisito citado (FR-*, HU-*, CAL-*, NFR-*) corresponde a ese documento.

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
| ORM | TypeORM | Entidades como fuente de verdad del esquema (`synchronize`). |
| Esquema | **Sin migraciones** (decisión de la etapa) | El schema se deriva de las entidades; ante un cambio se recrea la base y se corre el seed (§11.1). |
| Auth | `@nestjs/jwt` + `passport` | JWT por cookie `HttpOnly` (web) o `Authorization: Bearer` (nativo). |
| Validación | `class-validator` + `class-transformer` + `ValidationPipe` global | — |
| Hash | `argon2` | Algoritmo adaptativo (NFR-SEG-003). |
| Programación | `@nestjs/schedule` | Actualización de cotizaciones (actor "Proceso programado"). |
| Correo | Proveedor SMTP (configurable) | Recuperación de contraseña. |
| IA | Proveedor de LLM (configurable, p. ej. OpenAI/Anthropic) | Solo contexto mínimo calculado. |
| Rate limiting | `@nestjs/throttler` | Login, recuperación, cotizaciones, IA (NFR-SEG-010). |
| Docs de API | `@nestjs/swagger` (OpenAPI) + `@scalar/nestjs-api-reference` (UI) | Contrato consumible por el front; referencia interactiva en `/api/reference`. |
| Config | `@nestjs/config` + validación de env | — |

---

## 2. Decisiones técnicas

| Decisión | Elección | Justificación |
| :--- | :--- | :--- |
| Estilo | Monolito modular | Suficiente para el alcance; evita complejidad de microservicios. |
| Estructura | Convencional NestJS (module/controller/service) + DTOs y entidades | Es la estructura por defecto; clara para el agente. |
| Casos de uso | Services de dominio con un método por caso de uso | Separación de responsabilidades; testeo unitario directo. |
| ORM | TypeORM | Integración nativa con NestJS (`@nestjs/typeorm`); el esquema se sincroniza desde las entidades. |
| Auth | JWT (access token) + sesión persistida | Permite invalidar sesión al cerrar (FR-AUT-002). Transporte por cookie o Bearer para soportar web y nativo. |
| Transporte de token | Cookie `HttpOnly; Secure; SameSite` (web) + `Authorization: Bearer` (nativo) | Mitiga XSS y soporta clientes nativos; consistente con NFR-SEG-004. |
| IDs | `uuid` (gen_random_uuid) | Identificadores no predecibles (NFR-SEG-005). |
| Moneda base | Almacenada en `users.base_currency` | Consolida cálculos y es la moneda de visualización de dashboard y reportes (FR-AUT-005, FR-DAS-007, CAL-001). |
| Conversión | Tabla `exchange_rates` con trazabilidad | Trazabilidad cambiaria: CAL-008/009 en la v0.1, fuera del alcance publicado de la v0.2 (ver §5.14 y §8). |
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
- **Swagger/OpenAPI** publicado en `/api/docs` (UI) y `/api/docs-json` (spec), más la referencia interactiva de **Scalar** en `/api/reference`; es el contrato del que el front puede generar tipos.

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
│   │   ├── data-source.ts           # DataSource de los scripts (`seed`, `db:*`)
│   │   ├── database-maintenance.service.ts  # vaciar/recrear/sembrar (dev/test)
│   │   ├── dev-database.controller.ts       # endpoints dev de mantenimiento
│   │   └── seeds/                   # seed determinístico + runners
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
│   ├── goals/                       # metas (FR-OBJ-001..005)
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
│   ├── calculations/                # reglas CAL-001..007 y CAL-010
│   │   ├── calculations.module.ts
│   │   └── calculations.service.ts
│   ├── account-balances/            # read model compartido: saldo de cuenta (accounts + transactions)
│   │   ├── account-balances.module.ts
│   │   └── account-balances.service.ts
│   ├── asset-debt-links/            # read model compartido: vínculo activo↔deuda
│   │   ├── asset-debt-links.module.ts
│   │   └── asset-debt-links.service.ts
│   ├── currency/                    # regla de monedas soportadas (SUPPORTED_CURRENCIES)
│   │   ├── currency.module.ts
│   │   └── currency.service.ts
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
├── <feature>.module.ts         # importa TypeOrmModule.forFeature([entidades propias]) + deps
├── <feature>.controller.ts     # rutas REST, decoradores de auth/ownership
├── <feature>.service.ts        # casos de uso de un solo dominio (un método por caso de uso)
├── <feature>.orchestrator.ts   # casos de uso compuestos (coordinan otros dominios); sin queries
├── dto/                        # create-*.dto.ts, update-*.dto.ts, query-*.dto.ts
└── entities/                   # entidades TypeORM del dominio
```

**Regla de módulos (ver `api/.agents/skills/orchestrator-domain-architecture`):**

- Un **servicio primario** accede **solo a su propio repositorio/entidad** y reutiliza los proveedores compartidos (`calculations`, `fx`, `market`, `ai`, `mail`). Nunca llama a otro servicio primario.
- Los casos de uso que **cruzan dominios** se implementan en un `<feature>.orchestrator.ts` que coordina los servicios implicados y devuelve DTOs de respuesta; el orquestador **no** ejecuta queries.
- Dos valores derivados cruzados se centralizan en proveedores de `shared/` para evitar ciclos de módulos: `account-balances` (saldo = `accounts` + `transactions`) y `asset-debt-links` (vínculo `debt.asset_id`).
- Orquestadores actuales: `transactions`, `budgets`, `positions`, `debts`, `dashboard`, `reports` y `goals`. Los módulos `accounts`, `assets`, `categories`, `quotes` y `users` son CRUD de un solo dominio (controller → servicio). El armado de contexto del asistente (`assistant-context.service.ts`) también inyecta servicios, no repositorios.
- **Excepción acotada:** `auth` comparte el agregado de identidad `users` (registro, credenciales y recuperación) con `users`; es la autoridad de credenciales y accede al `User` directamente. El resto de los dominios consume usuarios vía `UsersService`.

---

## 5. Modelo de datos (PostgreSQL)

Tablas derivadas de las entidades principales del FRD (§3.2) más las necesarias para trazabilidad y sesiones. Todos los `id` son `uuid` v4. Toda tabla con datos de usuario lleva `user_id` (o desciende de una entidad que lo tiene) y un índice.

> **Convención de columnas:** `snake_case` en la DB; los enums se almacenan como `text` con validación en la capa de aplicación (valores en §7.14); los `numeric` se serializan como `number` en la API (ver §7.13).

### 5.1 `users`
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | default gen_random_uuid() |
| name | text | |
| email | text UNIQUE | lowercase |
| password_hash | text | argon2 |
| base_currency | char(3) | default 'ARS' (FR-AUT-005; configurable con `DEFAULT_CURRENCY`) |
| theme | text | 'light' | 'dark' | 'system' (FR-AUT-006) |
| ai_enabled | boolean | default false (FR-IA-001) |
| assistant_destructive_enabled | boolean | default false; habilita las acciones destructivas del asistente, de forma independiente de `ai_enabled` (FR-IA-006) |
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

### 5.3 `accounts` (FR-CUE-001..006)
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

> Saldo actual = `initial_balance` + Σ(movimientos) en moneda de la cuenta (calculado, FR-CUE-004). Las **metas ya no son cuentas**: tienen su propia tabla y módulo `goals` (§5.12). El archivo conserva el historial y no admite nuevos movimientos (FR-CUE-005); `POST /accounts/:id/restore` vuelve a habilitarla sin perder ese historial (FR-CUE-006).

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

### 5.12 `goals` — Objetivos (FR-OBJ-001..005)

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
| source_account_id | uuid FK NULL → accounts | cuenta origen donde vive el dinero (FR-OBJ-005) |
| archived | boolean | default false |
| created_at / updated_at | timestamptz | |

> **Reglas:** (1) la meta no admite movimientos propios; el acumulado se edita con `savedAmount` (FR-OBJ-003); (2) se excluye de `kpis.accounts` y del patrimonio neto (FR-OBJ-005); (3) `progressPct` y `status` los calcula el **servidor** en `calculations.service` (CAL-007), no el cliente.

### 5.13 `ai_conversations` (FR-IA-009/014)
| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| id | uuid PK | |
| user_id | uuid FK | |
| question | text | |
| answer | text | |
| context_meta | jsonb | período, moneda, fuentes consideradas (FR-IA-005) |
| messages | jsonb | transcript del hilo (`[{ role, content }]`) para dar **memoria conversacional**; se recortan los últimos turnos |
| created_at | timestamptz | |

> `question`/`answer` guardan el **último turno**; `messages` conserva el historial completo del hilo y se reinyecta al modelo en cada pregunta. La tabla se crea/actualiza con `synchronize: true`. El historial base vive en el **cliente** y solo se persiste en el servidor cuando el asistente está en **modo en vivo**; el usuario puede eliminar una conversación o todo el historial (§7.11), sin afectar otros datos (FR-IA-014).

### 5.14 `exchange_rates` (conversión y trazabilidad cambiaria)
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

> Cada conversión registra el par, la tasa, el proveedor y la fecha utilizados. Las tasas pueden ser fijas (seed) o provistas por el proveedor de mercado si está disponible. La v0.2 publicada **no** incluye CAL-008/CAL-009 (IDs fuera de alcance): se conserva el diseño de la v0.1 (ver §8).

### 5.15 `assistant_actions` (FR-IA-006/012, auditoría y confirmación)

Cada acción de escritura que propone el asistente se guarda como una **acción pendiente** sujeta a **confirmación explícita** del usuario (FR-IA-012); también sirve de auditoría. Las **tools de lectura** ejecutadas se registran en la misma tabla (fila ya `executed`, `plan_id` y `token_hash` nulos) para trazabilidad, sin bloquear la respuesta si la auditoría falla.

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

> La confirmación bloquea la fila (`pessimistic_write`) y valida **estado, TTL y token**, además del **orden del plan** (no se puede ejecutar un paso mientras uno anterior del mismo `planId` no esté `executed`/`cancelled`); así se evita la doble ejecución y las dependencias fuera de orden. El **token es de un solo uso**: una vez que la acción queda `executed`, un nuevo intento responde `ACTION_ALREADY_EXECUTED`. Al vencer el TTL la acción pasa a `expired`. Las tablas/columnas se crean/actualizan con **`synchronize: true`**, como todo el esquema (el proyecto no usa migraciones; ver §11.1).

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
| POST | `/accounts/:id/restore` | FR-CUE-006 (devuelve `archived: false`; conserva el historial y habilita nuevos movimientos) |

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
| POST | `/positions/:id/archive` | FR-ACT-007 (una posición archivada no suma al patrimonio) |
| POST | `/positions/:id/restore` | FR-ACT-007 |

> El `symbol` de una posición debe pertenecer al catálogo de mercado (`MARKET_SYMBOLS`, FR-MER-001); un símbolo fuera del catálogo se rechaza con `VALIDATION_ERROR` (`fieldErrors.symbol`).

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
- `sourceAccountId` (FR-OBJ-005), si viene, debe pertenecer al usuario autenticado; la verificación la coordina el orquestador del módulo (`goals.orchestrator.ts`) reutilizando `AccountsService`.

### 7.9 Dashboard
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/dashboard?from&to&currency=` | agrega en una sola llamada: KPIs (patrimonio, ingresos, gastos, ahorro, activos, cuentas, deudas e inversiones con sus variaciones), series de patrimonio, evolución del valor de activos, ingresos vs gastos por mes, gastos por categoría, cambios por categoría vs. período anterior, composición de activos (base bruta con cuentas netas, sin deudas), inversiones financieras y alertas de presupuesto (FR-DAS-001..007). `kpis.netWorth = activos + inversiones + cuentas netas − deudas`; la suma de `netWorthComposition` es el activo bruto y restando `kpis.debts` reconstruye el patrimonio neto |

- **Período y moneda (FR-DAS-007):** `from`/`to` son seleccionables (default: últimos 180 días). La **moneda de visualización es la moneda base** del usuario (`users.base_currency`, editable en Configuración con `PATCH /users/me`): **no hay selector de moneda por vista**. `DashboardQueryDto` acepta un `currency` opcional que sobrescribe la base; el cliente toma la moneda base del usuario (`useDisplayCurrency`) y la envía en el query, y si el query se omite el servidor usa `users.base_currency`.
- **Patrimonio neto (CAL-001, §8):** activos + posiciones + saldos netos de cuentas − deudas, todo en moneda base. Los **objetivos no se suman** (el agregado de dashboard no los consulta; ver §5.12).
- **Tasa de ahorro (CAL-010, §8):** `kpis.savingsRateDeltaPp` expresa en **puntos porcentuales** la variación de la tasa de ahorro contra el período anterior.

### 7.10 Reports
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/reports/summary?from&to` | FR-REP-001 |
| GET | `/reports/by-category?from&to` | FR-REP-002 |
| GET | `/reports/net-worth?from&to` | FR-REP-003 |
| GET | `/reports/budgets?period=` | FR-REP-004 |
| GET | `/reports/investments` | FR-REP-005 (P1) |
| GET | `/reports/export?from&to&type=transactions|summary&format=csv` | FR-REP-006 |

> Los reportes comparten `DashboardQueryDto` con el dashboard: el **período** es seleccionable y la **moneda** es la base del usuario (FR-DAS-007); el `currency` opcional aplica a `summary`, `by-category`, `net-worth`, `investments` y `export`.

### 7.11 Assistant
| Método | Ruta | FR |
| :--- | :--- | :--- |
| GET | `/assistant/conversations` | FR-IA-009/014 (paginado) |
| GET | `/assistant/conversations/:id` | FR-IA-009/014 |
| DELETE | `/assistant/conversations/:id` | FR-IA-009/014 |
| DELETE | `/assistant/conversations` | borrar historial (FR-IA-009/014) |
| POST | `/assistant/messages` | pregunta; responde con stream (FR-IA-001/002, FR-IA-008..014) |
| POST | `/assistant/actions/:id/confirm` | confirma y ejecuta una acción propuesta (FR-IA-006/012) |
| POST | `/assistant/actions/:id/cancel` | cancela una acción propuesta (FR-IA-012) |

> El estado habilitado/deshabilitado de la IA (FR-IA-001) es una **preferencia del usuario** (`users.ai_enabled`), expuesta en `GET /auth/me` y modificable con `PATCH /users/me`. No existe un endpoint separado de settings del asistente: una sola fuente de verdad.

### 7.12 Users (perfil y preferencias)
| Método | Ruta | FR |
| :--- | :--- | :--- |
| PATCH | `/users/me` | actualiza `name`, `baseCurrency`, `theme`, `aiEnabled`, `assistantDestructiveEnabled` (FR-AUT-005/006, FR-DAS-007, FR-IA-001/006) |

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
- **CORS:** con credenciales habilitadas; permitir `CORS_ORIGIN` y `CORS_ORIGIN_NATIVE` exactos (no `*`). Incluir `https://localhost` en `CORS_ORIGIN_NATIVE` para el webview de Android (Capacitor 8), además de `capacitor://localhost` (iOS) y `http://localhost` (Android previo).
- **App Android (NFR-CAL-006):** el cliente se empaqueta con Capacitor (Android en esta versión; iOS diferido) y consume el mismo contrato REST: usa `Authorization: Bearer` y `POST /auth/refresh` para la **sesión persistente** (el refresh token se guarda en el cliente, `client/lib/api/token-store.ts`). Las **safe-areas** se resuelven en el cliente (`frontend.md`) y no modifican el contrato del backend.

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
  - Toda entidad con dinero (cuentas, activos/valuaciones, deudas, posiciones, presupuestos, metas y movimientos) valida la moneda contra ese catálogo vía `shared/currency`; una moneda no soportada se rechaza con `VALIDATION_ERROR` (`fieldErrors.currency`).
  - La conversión a moneda base **nunca asume una tasa 1:1**: si no existe una tasa (directa, inversa o pivote) para dos monedas distintas, `FxService` responde `VALIDATION_ERROR` en lugar de devolver un total incorrecto.
- **Catálogo de mercado** (configurable por env `MARKET_SYMBOLS`, default): `BTC, ETH, USDT, USDC, SOL, BNB`. Solo cripto (FR-MER-001).
- **Categorías por defecto** (semilla, `user_id = NULL`): income (`salary`, `freelance`, `other_income`), expense (`food`, `transport`, `housing`, `services`, `entertainment`, `other_expense`). Son de solo lectura; el usuario crea las suyas.
- **Umbral de presupuesto** (`BUDGET_WARNING_THRESHOLD`, default `0.8`): `warning` si `spent >= 0.8 * limit`; `exceeded` si `spent > limit`.

### 7.15 Esquemas de request/response por módulo

**Auth**
```jsonc
// POST /auth/register — body
{ "name": "Ana", "email": "ana@example.com", "password": "Secreta123" }
// 201 → { "user": User, "accessToken": "eyJ...", "refreshToken": "opaco..." }  (y fija cookies, igual que login)

// POST /auth/login — body
{ "email": "ana@example.com", "password": "Secreta123" }
// 200 → { "user": User, "accessToken": "eyJ...", "refreshToken": "opaco..." }

// POST /auth/refresh — body opcional (nativo)
{ "refreshToken": "opaco..." }   // en web puede omitirse (usa cookie)
// 200 → { "accessToken": "...", "refreshToken": "..." }  (rotación)

// User
{ "id": "uuid", "name": "Ana", "email": "ana@example.com",
  "baseCurrency": "ARS", "theme": "system", "aiEnabled": false,
  "assistantDestructiveEnabled": false, "createdAt": "ISO" }
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
// POST /positions/:id/add — body (`AddToPositionDto`; aporte a una posición existente)
{ "amount": 1500, "unitPrice": 60000 }   // addedQuantity = amount / unitPrice; avgCost = (quantity × avgCost + amount) / newQuantity
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
- `sourceAccountId` debe pertenecer al usuario (FR-OBJ-005); la meta **no suma** al patrimonio neto ni a `kpis.accounts` (§5.12).

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
      "id": "uuid", "symbol": "BTC", "instrument": "Bitcoin", "quantity": 0.05,
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
event: meta    data: { "conversationId": "uuid", "period": {...}, "currency": "ARS", "sources": ["transactions", "budgets"], "disclaimer": "Respuesta informativa calculada a partir de tus datos; no constituye asesoramiento financiero." }
event: token   data: { "delta": "Este mes " }
event: token   data: { "delta": "gastaste más en..." }
event: action_proposal data: { "actionId": "uuid", "token": "opaco", "name": "createAccount", "title": "Crear cuenta", "classification": "write_safe", "destructive": false, "summary": "Crear la cuenta \"Banco Galicia\" en ARS", "preview": { "title": "Crear cuenta", "summary": "...", "fields": [{ "label": "Nombre", "value": "Banco Galicia" }] }, "expiresAt": "ISO" }
event: action_error data: { "name": "createTransaction", "title": "Crear movimiento", "code": "VALIDATION_ERROR", "message": "No encontré ninguna categoría que coincida..." }
event: done    data: { "conversationId": "uuid", "insufficient": false }
event: error   data: { "code": "AI_UNAVAILABLE", "message": "..." }
```
- **Tool calling:** `POST /assistant/messages` habilita *function calling* del proveedor. Las **tools de lectura** (`listAccounts`, `listTransactions`, `listBudgets`, `listAssets`, `listValuations`, `listDebts`, `listPositions`, `listGoals`, `listCategories`, `getProfile`, `getDashboard`, `getReportSummary`, `getReportByCategory`, `listQuotes`) se ejecutan al instante y devuelven datos al modelo (las lecturas de un mismo paso se ejecutan en paralelo). Las **tools de escritura** (una por primitiva: `create*`, `update*`, `archive*`, `restore*`, `transferBetweenAccounts`, `createValuation`, `contributeToGoal`, `copyPreviousBudgets`, `addToPosition`) **no se ejecutan en el stream**: crean una acción pendiente y emiten `event: action_proposal` con la vista previa. `addToPosition` suma una compra a una posición existente (monto + precio unitario) y el backend recalcula cantidad y costo promedio ponderado; `contributeToGoal` **suma** al acumulado de la meta (no lo sobrescribe). Las propuestas idénticas (misma tool y argumentos) dentro de un mismo plan **no se duplican**. **No hay tools compuestas**: una operación compleja se propone como **varias acciones** (una tarjeta por tool).
- **Plan y dependencias:** todas las acciones propuestas en una misma respuesta comparten `planId` y llevan `step` (orden). Las referencias se resuelven en la preparación; si un nombre todavía no existe **pero fue propuesto para crearse en el mismo plan** (p. ej. una deuda vinculada a un activo que se está creando), la acción queda marcada `pending` con los argumentos crudos y se emite igual su tarjeta. Si el nombre no corresponde a ninguna creación del plan, se emite `action_error` (`NOT_FOUND`) en lugar de una tarjeta imposible de resolver. Al confirmar, el backend **verifica el orden del plan** y **reintenta la resolución**: si el paso previo no está `executed`/`cancelled`, responde `ACTION_DEPENDENCY_PENDING`; si el paso previo ya se ejecutó, ejecuta. El cliente ordena las tarjetas, bloquea las posteriores hasta que la previa se resuelva y permite **Reintentar/Cancelar** las que fallan.
- **Confirmación (FR-IA-012):** toda escritura propuesta queda **pendiente** hasta que el usuario la confirme. El cliente confirma con `POST /assistant/actions/:id/confirm` (body `{ token }`, `ConfirmActionDto`) y recibe un `ActionResultDto` (`status: executed|failed`, `summary`, `entity`, `code?`, `fieldErrors?`). El **token es de un solo uso y con vencimiento** (`expiresAt`, `AI_ACTION_TTL_MS`, default 120 s): reconfirmar una acción ya `executed` responde `ACTION_ALREADY_EXECUTED`, fuera del TTL responde `ACTION_EXPIRED` y un token inválido `ACTION_NOT_ALLOWED`; una acción `failed` puede reintentarse con el mismo token. La confirmación también valida el **orden del plan** (`ACTION_DEPENDENCY_PENDING`, §5.15). Cancelar requiere el mismo body `{ token }` en `POST /assistant/actions/:id/cancel`. La ejecución **queda registrada** en `assistant_actions` (§5.15) y reutiliza los **mismos servicios primarios/orquestadores** que el REST (no hay lógica de dominio en el asistente). Confirmar o cancelar exige que la IA siga habilitada (`403 AI_DISABLED`).
- **Propuestas y errores:** el modelo debe proponer los cambios **llamando a la tool** (la tarjeta solo existe si hubo tool call). Si la preparación falla (dato faltante, referencia ambigua, destructiva deshabilitada), se emite `event: action_error` con el motivo y no se crea ninguna acción.
- **Resolución de referencias:** las tools aceptan id (uuid) o nombre, siempre resueltos **por el usuario autenticado**; si hay ambigüedad o no existe, el servidor no adivina y pide precisión. Un id aportado por el modelo nunca otorga autorización.
- **Destructivas (opt-in):** `deleteTransaction`, `deleteBudget` y `deletePosition` (clase `destructive`) solo se envían al modelo si el usuario activó `assistantDestructiveEnabled`; si no, ni siquiera están disponibles.
- Cada ejecución queda auditada en `assistant_actions` (§5.15) y se evita la doble ejecución con estado + token de un solo uso + TTL (FR-IA-012).
- **Token en el cliente:** el cliente persiste el hilo en `localStorage` (`atlassfin.assistant.threads.v2`) pero **vacía el token** antes de guardar; al rehidratar, las acciones que seguían propuestas quedan `failed` y deben volver a pedirse (`client/providers/assistant-chat-provider.tsx`). Refuerza el carácter de un solo uso y vida corta del token.
- **Entrada por voz (FR-IA-013, P2):** la transcripción a texto ocurre en el **cliente** (Web Speech API, `client/hooks/use-speech-recognition.ts`); en plataformas sin soporte —incluida la app Android— el dictado no está disponible y el usuario escribe. El backend recibe siempre texto.
- Si la IA está deshabilitada → `403 AI_DISABLED` (JSON, no stream).
- Si faltan datos verificables → `event: done` con `insufficient: true` y texto explicativo (FR-IA-011).
- En **modo en vivo** el servidor persiste pregunta, respuesta, `contextMeta` y el transcript (`messages`) en `ai_conversations` al finalizar; en modo mock el historial queda solo en el cliente (FR-IA-014, §5.13). El borrado del historial se hace con los endpoints de §7.11 (FR-IA-009/014).
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
| `CATEGORY_ARCHIVED` | 409 | movimiento/budget sobre categoría archivada |
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

### 7.19 Referencia interactiva de la API (Scalar)

- **Generación:** el documento OpenAPI se construye con `@nestjs/swagger` en `src/main.ts` (mismo `DocumentBuilder`). El plugin de `@nestjs/swagger` declarado en `nest-cli.json` enriquece los DTO de `class-validator` con tipos, enums y validaciones en tiempo de compilación (`classValidatorShim`), de modo que el "try it out" tiene cuerpos de request reales.
- **Exposición:** Swagger UI en `/api/docs`, el documento JSON en `/api/docs-json` y la referencia de **Scalar** en `/api/reference`. El front puede consumir el JSON para generar tipos.
- **Stack:** `@scalar/nestjs-api-reference` (licencia MIT). Scalar sólo **renderiza** el documento; `@nestjs/swagger` sigue siendo la única fuente de verdad del contrato.
- **Dependencia de red:** el middleware carga el bundle `@scalar/api-reference` desde jsDelivr (`cdn.jsdelivr.net`) en el navegador. No requiere cuenta, dependencia ni backend de Scalar Cloud. Para fijar la versión o auto-hospedarlo, pasar la opción `cdn` a `apiReference(...)`.
- **Compatibilidad de Node:** `@scalar/nestjs-api-reference` `1.1.0+` exige **Node >= 22**. El proyecto soporta Node >= 20, por eso la dependencia se fija en `~1.0.31` (última línea compatible con Node 20). Al subir el mínimo de Node a 22, se puede actualizar a la última versión.
- **Overview en Markdown:** la página de inicio de la referencia (y la descripción del spec) se arma leyendo `src/common/openapi/api-overview.md` (`getApiOverview()` en `src/common/openapi/api-overview.ts`) y pasándola a `setDescription(...)`. Scalar y Swagger UI la renderizan como GitHub-flavored Markdown (tablas, alerts, bloques de código). El `.md` es la fuente de verdad del overview; el Nest CLI lo copia a `dist/` vía `assets` en `nest-cli.json`. Si falta el asset, la API arranca igual con una descripción corta de fallback.
- **Cobertura del contrato:** cada operación declara su schema de **request** (plugin de `@nestjs/swagger`), su schema de **response** (los `*ResponseDto` son clases y se referencian con `@ApiOkResponse({ type })`), las **respuestas de error** estándar (`ErrorResponseDto` vía `@ApiErrors(...)`) y el requisito de **auth** (`@ApiBearerAuth()` en las operaciones protegidas). Los tags llevan descripción (`addTag` en `main.ts`). **Salvedad del plugin:** sólo procesa archivos `*.dto.ts` / `*.entity.ts`; un tipo de respuesta que viva en otro archivo (p. ej. `market.types.ts`, un controller) debe decorarse con `@ApiProperty` explícito o moverse a un `*.dto.ts`.
- **Mantenimiento:** no hay artefactos que regenerar: al agregar o cambiar endpoints o DTOs, la referencia se actualiza en el próximo arranque. Verificación: `npm run start:dev` y abrir `/api/reference`. Al actualizar `@scalar/nestjs-api-reference`, revisar la opción `cdn` y los temas.
- **Seguridad:** igual que Swagger, la referencia es pública (revela rutas y esquema de auth). En un despliegue real conviene publicarla sólo en entornos no productivos (por ejemplo, condicionar `SwaggerModule.setup` y `apiReference` a `NODE_ENV !== "production"`).

---

## 8. Reglas de cálculo

Centralizadas en `calculations.service.ts` para garantizar consistencia entre dashboard, reportes e IA. Cubiertas por pruebas unitarias (NFR-CAL-004). Las reglas que combinan varios dominios (patrimonio neto consolidado y tasa de ahorro) se arman en `dashboard.service.ts` reutilizando ese service.

| Regla | Implementación |
| :--- | :--- |
| CAL-001 Patrimonio neto | Σ activos + Σ posiciones + Σ saldos netos de cuentas − Σ deudas, todo en moneda base. Los **objetivos no se suman** (FR-OBJ-005). Implementado en `calculations.service.calculateNetWorth({ assets, positions, cash, debts })` y en el agregado de `dashboard.service` (`assetsValue + positionsValue + accountsValue − debtsValue`, §7.9); `GET /reports/summary` y `GET /reports/net-worth` lo consumen del dashboard. |
| CAL-002 Flujo de fondos | Σ ingresos − Σ gastos del período (excluye transferencias). |
| CAL-003 Transferencias | `type='transfer'` se excluye de ingresos/gastos consolidados. |
| CAL-004 Consumo presupuesto | Σ gastos de la categoría y período / límite × 100; si límite = 0, no dividir (devolver 0 o estado "sin límite"). |
| CAL-005 Valor de posición | cantidad × último precio válido en la moneda del instrumento. |
| CAL-006 Ganancia nominal | valor actual − (cantidad × avg_cost). |
| CAL-007 Progreso de objetivo | acumulado / meta × 100, con mínimo 0% (sin techo). Implementado en `calculations.service.calculateGoalProgress`; lo expone `GET /goals` como `progressPct` + `status`. |
| CAL-008 Conversión *(v0.1; fuera del alcance publicado de la v0.2)* | importe × última tasa válida a la fecha de cálculo (vía `fx.service`). |
| CAL-009 Trazabilidad *(v0.1; fuera del alcance publicado de la v0.2)* | cada conversión registra par, tasa, proveedor y fecha (`exchange_rates`, §5.14). |
| CAL-010 Tasa de ahorro | ahorro del período / ingresos del período × 100; si los ingresos del período son 0, la tasa es 0. Su **variación** se expresa en **puntos porcentuales**: `kpis.savingsRateDeltaPp = (tasa actual − tasa del período anterior) × 100`. Implementado en `dashboard.service` (§7.9). |

**Estados de presupuesto (FR-PRE-003):** `available` (< umbral de advertencia), `warning` (≥ umbral y ≤ 100%), `exceeded` (> 100%). Umbral configurable (p. ej. 80%).

**Estados de objetivo (FR-OBJ-004):** `pending` (sin acumulado), `in_progress` (0 < progreso < 100% y no vencido), `achieved` (≥ 100%), `overdue` (fecha pasada sin alcanzar).

---

## 9. Integraciones externas

Todas desde el backend, con timeout, validación de host, HTTPS y redirecciones deshabilitadas (NFR-SEG-009).

### 9.1 Proveedor de mercado (actor "Proveedor de mercado")
- **Cripto — Binance** (`MARKET_API_URL`, sin API key ni atribución): `GET /ticker/24hr?symbols=[...]` devuelve precio y variación 24h en una sola llamada (FR-MER-001; símbolos soportados en `crypto-symbols.ts`). Cotiza contra `USDT` y se etiqueta con `MARKET_VS_CURRENCY` (default `USD`).
- **Monedas — currency-api de Fawaz Ahmed** (`FX_API_URL`, sin API key ni atribución): base `ARS`, deriva `X:ARS` y actualiza `exchange_rates` (trazabilidad cambiaria, §5.14). Es la fuente del pivote que usa `fx.service`.
- `MarketSchedulerService` (`@nestjs/schedule`) refresca al arrancar y luego cada `MARKET_REFRESH_INTERVAL_MS` (default 5 min); `POST /market/refresh` permite forzarlo. Todo es configurable con `MARKET_ENABLED`, `MARKET_SYMBOLS`, `MARKET_VS_CURRENCY`, `MARKET_TIMEOUT_MS`.
- Ante falla, mantiene el último valor válido en base y NO inventa uno nuevo (FR-MER-004); expone `fetched_at` para marcar antigüedad (FR-MER-005). Se conserva un único proveedor por par símbolo/moneda.
- Guarda `symbol, price, currency, provider, fetched_at` (FR-MER-002) y `change_24h` si lo informa (FR-MER-006). Alcance actual: cripto y monedas; acciones/ETFs fuera de alcance.

### 9.2 Proveedor de IA (actor "Proveedor de IA")
`assistant.service.ts` + `ai.service.ts`:

1. Verifica que la IA esté habilitada (FR-IA-001) y que la sesión sea válida.
2. Calcula **localmente** totales y métricas del período (FR-IA-004) reutilizando el read model del dashboard (`DashboardOrchestrator`, que a su vez usa `calculations.service`), para no duplicar fórmulas.
3. Construye el **contexto mínimo** (solo datos del usuario autenticado, FR-IA-002/003/007) y envía la pregunta al LLM.
4. El prompt de sistema es fijo y **separado** de los datos del usuario, que viajan como datos no confiables (FR-IA-010). Se valida la salida antes de presentarla (NFR-SEG-012).
5. Adjunta metadatos: período, moneda y fuentes consideradas (FR-IA-005).
6. Declara "información insuficiente" cuando los datos no permiten conclusión verificable (FR-IA-011).
7. **No** expone operaciones arbitrarias (FR-IA-006). **Implementado:** un catálogo de tools tipadas y clasificadas (`read`/`write_safe`/`sensitive`/`destructive`) sobre todos los dominios, que reutilizan los mismos servicios primarios/orquestadores que el REST. Toda tool resuelve la propiedad desde el usuario autenticado y nunca acepta `userId` del modelo. Las mutaciones requieren **confirmación explícita** (acción pendiente + token de un solo uso + TTL + orden del plan, FR-IA-012) y las destructivas exigen `assistantDestructiveEnabled`. Respuesta marcada como informativa (FR-IA-008).

**Implementación actual (DeepSeek):**

- `shared/ai/ai.service.ts` (`AiModule`): cliente del proveedor (DeepSeek/OpenAI-compatible) con `axios` `responseType: "stream"`, timeout de `AI_TIMEOUT_MS` y aborto; expone `streamChat(messages)` como `AsyncGenerator<string>`. Mapea fallas a `AI_UNAVAILABLE` (NFR-SEG-009).
- `shared/calculations/calculations.service.ts` (`CalculationsModule`): fuente única de las reglas CAL-001..004 (flujo del período, gastos del mes, consumo/estado de presupuesto, saldo actual por movimientos, última valuación por activo y patrimonio neto). El asistente la reutiliza en lugar de repetir fórmulas. Cubierta por pruebas unitarias.
- `assistant/assistant-context.service.ts`: arma el **contexto mínimo** del usuario reutilizando el read model del dashboard (`DashboardOrchestrator.getDashboard`) para ingresos, gastos, ahorro, gastos por categoría, patrimonio neto (CAL-001) y gastos del mes —ya convertidos a moneda base— y `BudgetsOrchestrator` para los presupuestos del mes, y produce un resumen textual. No re-deriva fórmulas ni consulta repositorios directamente: cada dato proviene del servicio/orquestador dueño (ver `orchestrator-domain-architecture`).
- `assistant/assistant.service.ts`: `assertAiEnabled`, persistencia en `ai_conversations` y `answer()` como generador de eventos (`meta`/`token`/`action_proposal`/`done`). Coordina lecturas y propone mutaciones vía `ToolRegistry` + `PendingActionsService`; `POST /assistant/actions/:id/{confirm,cancel}` ejecuta o cancela. El **prompt de sistema es fijo** y declara explícitamente el alcance: solo un resumen agregado del período indicado, sin detalle de movimientos ni historial de otros períodos; ante preguntas fuera de ese alcance debe aclararlo (FR-IA-010/011). Además, `action-claim-guard.ts` detecta **propuestas fantasma** (el modelo narra una acción pendiente sin haber llamado a su herramienta) comparando la respuesta con las tools propuestas del turno y las pendientes vigentes de la conversación (`PendingActionsService.listActiveToolNames`), y fuerza una iteración de recuperación acotada para que el modelo proponga la acción faltante o reescriba sin afirmarla.
- `assistant/assistant.controller.ts`: `POST /assistant/messages` (SSE), `GET /assistant/conversations` (paginado), `GET/DELETE /assistant/conversations/:id`, `DELETE /assistant/conversations`. Si `aiEnabled === false` responde `403 AI_DISABLED` en JSON (no abre el stream).
- **Acceso dev del stream**: `POST /assistant/messages` está marcado `@Public()` pero resuelve el usuario así: si hay sesión válida la usa; si no, y `NODE_ENV !== "production"`, cae al usuario demo `AI_DEV_USER_EMAIL`; en producción sin sesión responde `401 UNAUTHENTICATED`. Permite probar el asistente con el cliente en modo mock sin implementar todo el auth. Los endpoints de historial siguen requiriendo JWT.
- El cliente consume el stream en `client/lib/api/assistant-stream.ts` (mock con `NEXT_PUBLIC_USE_MOCKS`).

> Estado: los dominios de finanzas (auth, users, accounts, categories, transactions, budgets, assets/valuations, debts, positions, quotes, dashboard y reports) ya exponen sus servicios y endpoints, por lo que el asistente es ejecutable end-to-end con sesión válida. La key `AI_API_KEY` va en `api/.env`. El armado de contexto consume los servicios de cada dominio (no repositorios) respetando la arquitectura de orquestadores.

### 9.3 Servicio de correo (actor "Servicio de correo")
- Envío de enlace de recuperación con token temporal. Ante falla, informa que no pudo enviarse y permite reintento (dependencia §2.5 del FRD).

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

## 11. Base de datos y datos de demostración

### 11.1 Estrategia: sin migraciones (decisión consciente)

En esta etapa del proyecto **no usamos migraciones**. La decisión es deliberada, no una omisión:

> Si cambia el esquema, **no migramos** los datos existentes: vaciamos/recreamos la base y volvemos a ejecutar el seed.

- La **fuente de verdad del esquema son las entidades TypeORM** (`api/src/**/entities/*`).
- `synchronize: true` crea/actualiza el esquema al iniciar la app y al correr los scripts (`database.module.ts` y `database/data-source.ts`).
- No hay carpeta `migrations/`, ni comandos `migration:*`, ni tabla `migrations`.
- No hay mecanismos de preservación de datos entre cambios de esquema. El dataset es descartable y reproducible.
- Cuando el proyecto necesite entornos productivos con datos que deban conservarse, se reintroducirán migraciones explícitas y `synchronize: false`. Está fuera del alcance actual.

### 11.2 Flujo de trabajo

| Objetivo | Comando |
| :--- | :--- |
| Vaciar todas las tablas (conserva el esquema) | `npm run db:clear` |
| Recrear el esquema desde las entidades + seed completo | `npm run db:reset` |
| Sembrar sin tocar el esquema (idempotente) | `npm run seed` |

El ciclo recomendado es:

```bash
npm run db:reset   # cambió el modelo / querés un estado limpio
npm run start:dev  # app lista con datos de demo
```

`db:reset` está pensado para el caso "cambió el schema": fuerza `synchronize(true)` (drop + recreate de las tablas de las entidades), elimina tablas obsoletas y ejecuta el seed. `seed` por sí solo no pisa datos si el usuario demo ya existe.

### 11.3 Endpoints de mantenimiento (solo desarrollo/test)

El módulo `database` expone rutas destructivas para desarrollo y tests. **No existen en producción**: `DevOnlyGuard` es *fail-closed* y responde `404` salvo que `NODE_ENV` sea **explícito** `development` o `test` (un `NODE_ENV` ausente no habilita nada, aunque el `nodeEnv` por defecto de la app sea `development`). Además exige el header `x-dev-database-token` si se configura `DEV_DATABASE_TOKEN`. Los endpoints se excluyen de OpenAPI (`@ApiExcludeController`).

| Método | Ruta | Efecto |
| :--- | :--- | :--- |
| POST | `/api/dev/database/clear` | Vacía todas las tablas de la aplicación (respeta FKs). |
| POST | `/api/dev/database/seed` | Ejecuta el seed (idempotente). |
| POST | `/api/dev/database/reset` | Recrea el esquema + ejecuta el seed. |

Respuesta: `{ "action": "clear" | "seed" | "reset", "tables": <n>, "seeded": <bool> }`. La limpieza usa `TRUNCATE ... RESTART IDENTITY CASCADE` sobre todas las tablas de las entidades, y elimina la tabla legado `migrations` si existiera.

### 11.4 Usuarios de demo (determinísticos)

Todos comparten la contraseña **`Demo1234!`**:

| Email | Escenario |
| :--- | :--- |
| `demo@atlassfin.app` | Dataset completo (ver §11.5). Moneda base ARS, IA habilitada. |
| `sin-datos@atlassfin.app` | Usuario vacío, para estados vacíos y onboarding (FR-DAS-008). |
| `ana@atlassfin.app` | Segundo usuario en USD (tema oscuro, acciones destructivas del asistente habilitadas) para aislamiento/permisos. |

### 11.5 Qué genera el seed

Datos **reproducibles** (sin información financiera real, NFR-CAL-005 / FRD §2.6). Para `demo@atlassfin.app`:

- **9 categorías de sistema** (`user_id = NULL`) + 12 categorías propias (incluye una archivada).
- **6 cuentas**: cash, bank, wallet USD, card, other y una archivada con historial.
- **4 meses de movimientos**: sueldos, freelance, gastos por categoría, transferencias atómicas (dos patas con `transfer_group_id`), un gasto en USD, un movimiento sin categoría y un gasto histórico en la cuenta archivada.
- **Presupuestos** que cubren los tres estados: **excedido** (Supermercado, FRD Caso 1), **advertencia** (Alquiler) y **disponible** (Transporte), más una plantilla `recurring` proyectada (FR-PRE-007).
- **Activos** (propiedad, vehículo, inversión, efectivo, otro, archivado) con **historial de valuaciones** mensual.
- **Deudas**: hipoteca vinculada a la propiedad, préstamo, tarjeta, una en USD y una archivada.
- **Posiciones** BTC/ETH/SOL + una archivada, con **cotizaciones** del catálogo (BTC, ETH, SOL, BNB, USDT, USDC).
- **Objetivos** en los cuatro estados (pendiente, en curso, alcanzado, vencido), uno sin fecha y uno archivado, con cuenta origen.
- **Conversaciones de IA** con transcript (`messages`) y **acciones auditadas** en todos los estados (`executed`, `proposed`, `cancelled`, `expired`, `failed`).
- **Tipos de cambio** de referencia (USD/EUR/BRL/UYU → ARS).

Para `ana@atlassfin.app` genera un dataset reducido en USD (cuentas, movimientos, presupuesto recurrente, activo, deuda, posición y meta), útil para probar aislamiento y la moneda base.

### 11.6 Idempotencia y reproducibilidad

- El seed verifica la existencia de `demo@atlassfin.app` antes de insertar; si ya existe, no pisa datos.
- `db:reset` siempre parte de cero y deja el mismo estado conocido: **repetir el ciclo produce resultados consistentes**.
- Las fechas son relativas al mes en curso, por lo que el dashboard y los reportes siempre tienen datos "actuales".

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
CORS_ORIGIN_NATIVE=capacitor://localhost,http://localhost,https://localhost   # orígenes nativos de Capacitor

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
DEFAULT_CURRENCY=ARS
MARKET_SYMBOLS=BTC,ETH,USDT,USDC,SOL,BNB

# Cotización
QUOTE_STALE_MS=3600000

# Solo desarrollo/test: token opcional para los endpoints destructivos de
# /api/dev/database/*. Si está vacío, el guard solo exige NODE_ENV=development|test.
DEV_DATABASE_TOKEN=
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

Cada tanda deja la API compilando (`npm run lint && npm run build`) y con entidades + tests asociados. Alineado con el plan del front (`frontend.md`). El cliente puede consumir la API real con `NEXT_PUBLIC_USE_MOCKS=false`; los dominios de finanzas ya están implementados. Estado por tanda abajo.

### Tanda 0 — Setup del proyecto — ✅ Hecho
- Scaffold NestJS, config global (`@nestjs/config`), `ValidationPipe`, `Logger`, Swagger, prefijo `/api`, CORS, cookies.
- TypeORM + DataSource + entidades del modelo (usuarios, sesiones, cuentas, categorías, movimientos, cotizaciones, exchange_rates).
- `common/` (guards, decorators, filters, interceptors).
- **Aceptación**: API levanta, sincroniza el esquema desde las entidades y responde `/api/health`.

### Tanda 1 — Autenticación — ✅ Hecho
- `auth` + `users`: register, login, refresh, logout, me; `PATCH /users/me`; `GET /currencies`; argon2; JWT strategy; cookies + `Authorization: Bearer`; throttler en login.
- `forgot-password`/`reset-password` + `mail` service (FR-AUT-003).
- **Aceptación**: FR-AUT-001..006, NFR-SEG-003/004/010.

### Tanda 2 — Cuentas, categorías y movimientos — ✅ Hecho
- CRUD `accounts`, `categories`, `transactions` con filtros y búsqueda.
- Transferencias atómicas (FR-TRX-004/005) y exclusión de consolidados (CAL-003).
- **Aceptación**: HU-001, HU-002, FR-CUE-*, FR-TRX-001..008.

### Tanda 3 — Cálculos, dashboard y reportes — ✅ Hecho
- `calculations` + `fx` (CAL-001..007 y CAL-010), `dashboard`, `reports` (summary, by-category, net-worth, budgets, export CSV).
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
- **Aceptación**: FR-OBJ-001..005, FRD §2.6.

### Tanda 7 — Asistente IA — ◐ Parcial
- `assistant` + `ai`: conversaciones, mensajes con stream SSE (contrato §7.16), contexto mínimo, metadatos, insuficiencia.
- **Aceptación**: HU-006, FR-IA-001/002, FR-IA-008..014, NFR-SEG-011/012.

### Tanda 8 — Endurecimiento — ⬜ Pendiente
- Tests e2e P0, rate limiting completo, timeout en salidas externas, logging seguro, validación de host.
- **Aceptación**: NFR-SEG-005..010, NFR-PR-003/004, NFR-CAL-004.

> **Nota**: funcionalidades P2 (import CSV FR-TRX-009, recurrentes FR-TRX-010, PDF FR-REP-007) quedan fuera de la entrega inicial.
