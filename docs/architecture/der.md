# DER — Modelo de datos (Atlass Fin, v0.3)

Diagrama entidad-relación del alcance vigente. Fuente de verdad: las entidades
TypeORM en `api/src/**/entities/*.entity.ts` (el esquema se deriva de ellas con
`synchronize`; no hay migraciones). Ver también `docs/architecture/backend.md` §5.

## Diagrama

```mermaid
erDiagram
  users ||--o{ sessions : "abre"
  users ||--o{ accounts : "posee"
  users ||--o{ transactions : "registra"
  accounts ||--o{ transactions : "cuenta de origen"
  accounts |o--o{ transactions : "cuenta destino (transfer)"
  categories |o--o{ transactions : "clasifica"

  users {
    uuid id PK
    text name
    text email UK
    text password_hash
    timestamptz created_at
    timestamptz updated_at
  }

  sessions {
    uuid id PK
    uuid user_id FK
    text refresh_token_hash
    timestamptz expires_at
    timestamptz revoked_at
    timestamptz created_at
  }

  accounts {
    uuid id PK
    uuid user_id FK
    text name
    text type
    numeric initial_balance
    text notes
    timestamptz created_at
    timestamptz updated_at
  }

  categories {
    uuid id PK
    text name
    text type
    text color
    text icon
  }

  transactions {
    uuid id PK
    uuid user_id FK
    text type
    numeric amount
    date date
    text description
    text notes
    uuid account_id FK
    uuid transfer_account_id FK
    uuid category_id FK
    uuid transfer_group_id
    timestamptz created_at
    timestamptz updated_at
  }
```

> La relación de la transferencia consigo misma no es una FK: los dos lados de
> una transferencia se agrupan por `transfer_group_id` (mismo valor en ambas
> filas), dentro de una única transacción de base de datos (FR-TRX-005).

## Tablas

### `users` — Usuario (FR-AUT-001/002)

| Columna | Tipo | Nulo | Notas |
| :--- | :--- | :--- | :--- |
| `id` | uuid | no | PK (`gen_random_uuid()`) |
| `name` | text | no | 2–80 |
| `email` | text | no | UNIQUE, `lowercase` |
| `password_hash` | text | no | argon2 (NFR-SEG-003) |
| `created_at` | timestamptz | no | |
| `updated_at` | timestamptz | no | |

### `sessions` — Sesión / refresh token

| Columna | Tipo | Nulo | Notas |
| :--- | :--- | :--- | :--- |
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK → `users.id` `ON DELETE CASCADE` (indexado) |
| `refresh_token_hash` | text | no | hash del refresh token opaco |
| `expires_at` | timestamptz | no | |
| `revoked_at` | timestamptz | sí | se marca al logout (FR-AUT-002) |
| `created_at` | timestamptz | no | |

### `accounts` — Cuenta (FR-CUE-001..005)

| Columna | Tipo | Nulo | Notas |
| :--- | :--- | :--- | :--- |
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK → `users.id` `ON DELETE CASCADE` (indexado) |
| `name` | text | no | |
| `type` | text | no | `cash` \| `bank` \| `wallet` \| `other` |
| `initial_balance` | numeric(18,4) | no | |
| `notes` | text | sí | |
| `created_at` | timestamptz | no | |
| `updated_at` | timestamptz | no | |

> Saldo actual = `initial_balance` + Σ movimientos de la cuenta (calculado, FR-CUE-004).
> Eliminar la cuenta elimina en cascada sus movimientos (FR-CUE-005).

### `categories` — Categoría (catálogo fijo, solo lectura)

| Columna | Tipo | Nulo | Notas |
| :--- | :--- | :--- | :--- |
| `id` | uuid | no | PK |
| `name` | text | no | |
| `type` | text | no | `income` \| `expense` |
| `color` | text | no | hex |
| `icon` | text | sí | |

> Catálogo del sistema definido por el seed y **no editable** (FR-TRX-002). No
> tiene `user_id`: es global.

### `transactions` — Movimiento (FR-TRX-001..005)

| Columna | Tipo | Nulo | Notas |
| :--- | :--- | :--- | :--- |
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK → `users.id` `ON DELETE CASCADE` (indexado) |
| `type` | text | no | `income` \| `expense` \| `transfer` |
| `amount` | numeric(18,4) | no | positivo en income/expense; con signo en transfer |
| `date` | date | no | `YYYY-MM-DD` |
| `description` | text | no | |
| `notes` | text | sí | |
| `account_id` | uuid | no | FK → `accounts.id` `ON DELETE CASCADE` (indexado) |
| `transfer_account_id` | uuid | sí | FK → `accounts.id` `ON DELETE SET NULL`; solo transferencias |
| `category_id` | uuid | sí | FK → `categories.id` `ON DELETE SET NULL` |
| `transfer_group_id` | uuid | sí | agrupa ambos lados de una transferencia (indexado) |
| `created_at` | timestamptz | no | |
| `updated_at` | timestamptz | no | |

## Reglas de integridad y cálculo

- **Propiedad (RN-001 / NFR-SEG-001):** `accounts`, `sessions` y `transactions`
  cuelgan de `users.id`; toda lectura/escritura filtra por el `user_id`
  autenticado. `categories` es global.
- **Transferencias (FR-TRX-004/005, RN-003/004):** origen ≠ destino; se
  persisten **dos filas** (`type='transfer'`, montos de signo opuesto en cuentas
  distintas) con el mismo `transfer_group_id`, de forma atómica. Se excluyen de
  ingresos/gastos consolidados (CAL-003).
- **CAL-001 Patrimonio neto:** Σ saldos netos de las cuentas del usuario.
- **CAL-002 Flujo de fondos:** Σ ingresos − Σ gastos del período.
- **Moneda:** única del sistema; no hay columna de moneda ni multimoneda.

## Fuera de alcance (v0.3)

No existen tablas para: presupuestos, activos/valuaciones, deudas, posiciones,
cotizaciones, objetivos, tipos de cambio, conversaciones de IA ni acciones del
asistente. Ver `docs/specification/0.3/FRD_Gestor_Financiero_v0.3.md` §1.
