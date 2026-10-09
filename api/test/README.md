# API — Tests

Dos niveles, siguiendo `.agents/skills/test-quality/SKILL.md`:

- **Unitarios** (`src/**/*.spec.ts`, `npm run test`): lógica pura y servicios con
  repositorios mockeados (`calculations`, `positions`, asistente).
- **Integración HTTP** (`test/requirements/*.e2e-spec.ts`, `npm run test:e2e`):
  levantan la app NestJS completa (mismos módulos y configuración global que
  `main.ts`, vía `src/app.setup.ts`) y pegan a los endpoints reales con
  supertest, contra una base PostgreSQL de test.

## Requisito previo: base de datos de test

La suite e2e usa una base **separada** de la de desarrollo/producción (nunca
toca Supabase). El valor por defecto es:

```
postgresql://localhost:5432/atlas_finance_test
```

Se puede sobreescribir con `TEST_DATABASE_URL`. Crear la base una vez:

```bash
createdb atlas_finance_test
```

`NODE_ENV=test` y el resto de variables se setean en `test/setup-env.ts`
(cargado por jest `setupFiles`). El esquema se crea con `synchronize: true`.

## Organización

Cada archivo corresponde a un requerimiento del FRD y nombra el ID en el
`describe`:

```
test/
├── setup-env.ts                 # env de test + reflect-metadata
├── jest-e2e.json                # runner (maxWorkers 1, timeout 30s)
├── utils/                       # harness reutilizable
│   ├── test-app.ts              # boot de la app para tests
│   ├── db.ts                    # truncate + datos de referencia + MISSING_UUID
│   ├── auth.ts                  # registro/login + Bearer
│   ├── factories.ts             # creación de datos vía API
│   ├── scenario.ts              # escenario base de finanzas
│   └── assistant.ts             # stub de AiService + parser SSE
└── requirements/
    ├── FR-AUT-001.e2e-spec.ts   # un archivo por requerimiento
    ├── CAL-010.e2e-spec.ts
    └── NFR-SEG-010.e2e-spec.ts
```

## Notas

- Los archivos se ejecutan en serie (`--runInBand` en `test:e2e`) porque
  comparten la base; cada test limpia las tablas en `beforeEach` (se preservan
  `exchange_rates`).
- Las integraciones externas se mockean en el borde: `AiService` (LLM) con un
  stub, `MailService` (SMTP) capturando el token de recuperación. La red de
  mercado se desactiva con `MARKET_ENABLED=false`.
- Para correr solo un requerimiento:
  `npm run test:e2e -- FR-AUT-001`.

## Cobertura unitaria

`npm run test:cov` mide la cobertura de los tests **unitarios**
(`src/**/*.spec.ts`) con umbral global ≥90% (statements, branches, functions,
lines), configurado en `coverageThreshold` de `package.json`.

El cálculo **excluye código sin comportamiento** para no inflar el número con
archivos triviales: `*.module.ts`, `*.entity.ts`, `*.controller.ts`, `dto/**`,
`database/seeds/**`, `database/data-source.ts`,
`main.ts`, `app.module.ts`, `app.setup.ts` y `common/types/**`. Los endpoints y
el contrato se cubren a nivel integración (e2e), no con tests unitarios de
scaffolding.

Hallazgos de comportamiento sospechoso detectados durante el testing se
registran en [`TESTING_BUGS.md`](../TESTING_BUGS.md).
