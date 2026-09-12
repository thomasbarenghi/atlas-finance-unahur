# Atlass Fin — Documento Técnico del Frontend

> **Audiencia:** agentes de IA que implementarán el frontend.
> **Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · Outfit (títulos) + Nunito (cuerpo) · Recharts · TanStack Query · React Hook Form + Zod · lucide-react · Capacitor 8 (Android; iOS pendiente).
> **Backend:** consume una API REST NestJS (ver `backend.md`). La URL base se inyecta por variable de entorno.
> **Referencia funcional:** `FRD_Gestor_Financiero_v0.1.docx.md`. Todo requisito citado (FR-*, HU-*, CAL-*, NFR-*) corresponde a ese documento.

---

## Tabla de contenidos

1. [Visión general y stack](#1-visión-general-y-stack)
2. [Decisiones técnicas](#2-decisiones-técnicas)
3. [Mapa del sitio](#3-mapa-del-sitio)
4. [Funcionalidades por página](#4-funcionalidades-por-página)
5. [Estructura de archivos](#5-estructura-de-archivos)
6. [Integración de shadcn/ui](#6-integración-de-shadcnui)
7. [Capa de datos y API client](#7-capa-de-datos-y-api-client)
8. [Autenticación](#8-autenticación)
9. [Gráficos y analítica (distintivo)](#9-gráficos-y-analítica-distintivo)
10. [Asistente de IA (distintivo)](#10-asistente-de-ia-distintivo)
11. [Formato de monedas, fechas y localización](#11-formato-de-monedas-fechas-y-localización)
12. [Requerimientos no funcionales del front](#12-requerimientos-no-funcionales-del-front)
13. [Convenciones de código](#13-convenciones-de-código)
14. [Empaquetado móvil con Capacitor](#14-empaquetado-móvil-con-capacitor)
15. [Plan de trabajo por tandas](#15-plan-de-trabajo-por-tandas)

---

## 1. Visión general y stack

**Atlass Fin** es una aplicación de gestión financiera personal inspirada en [sure.am](https://sure.am/) (cuentas, movimientos, presupuestos, patrimonio neto, objetivos, reportes), con **dos distintivos propios**: analítica/gráficos ricos y un **agente de IA conversacional** integrado que responde sobre los datos financieros del usuario.

| Área | Tecnología | Versión objetivo |
| :--- | :--- | :--- |
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript | 5.x, `strict: true` |
| UI | shadcn/ui + Tailwind CSS | Tailwind 4.x |
| Tipografía | Outfit (títulos) + Nunito (cuerpo) | `next/font/google` |
| Estilos | CSS variables + `cn()` | — |
| Gráficos | Recharts (base del componente `Chart` de shadcn) | 3.x |
| Estado servidor | TanStack Query | 5.x |
| Formularios | React Hook Form + Zod | RHF 7.x, Zod 3.x |
| Validación | Zod (compartida conceptualmente con el back) | 3.x |
| Auth | JWT: cookie `HttpOnly` (web) o `Authorization: Bearer` (nativo) | — |
| HTTP | `fetch` nativo dentro de un cliente tipado | — |
| Móvil | Capacitor (Android; iOS pendiente) | 8.x |
| Iconos | lucide-react (los genera shadcn) | — |
| Fechas | `date-fns` (compatible con DatePicker de shadcn) | 4.x |
| Temas | `next-themes` (claro / oscuro / sistema) | 0.4.x |

**Principios rectores:**

1. **Cliente primero y exportable a estático**: el front es un cliente puro que consume la API REST; no depende de Server Components, Server Actions, Route Handlers ni `middleware.ts` para funcionar. Esto garantiza que el mismo build funcione en web y dentro de Capacitor (`output: "export"`).
2. **Una sola fuente de verdad de tipos**: contratos de la API modelados en `lib/api/types.ts`.
3. **Lógica portable**: `lib/` (api, query, format, validation) no importa nada de `next/*`, para reusarlo tal cual en el build nativo.
4. **Accesibilidad primero**: shadcn + Radix ya aportan foco y teclado; se completa con resúmenes textuales de gráficos y estados no dependientes del color (NFR-UA-002/004/005).
5. **Estados vacíos accionables**: toda vista sin datos muestra una acción sugerida (FR-DAS-008).

---

## 2. Decisiones técnicas

| Decisión | Elección | Justificación |
| :--- | :--- | :--- |
| Router | App Router (`app/`) | Layouts anidados; con `output: "export"` se genera un sitio estático apto para Capacitor. |
| Render | Componentes cliente en `(app)` | Evita dependencias de RSC; el build estático hidrata en cliente. |
| Móvil | Capacitor | Envuelve el mismo código web en shells iOS/Android; 100% de reuso. |
| Route groups | `(auth)` y `(app)` | Separa pantallas públicas y protegidas sin alterar URLs. |
| Fetching | TanStack Query en el cliente | Caché, invalidación, retry, cancelación (clave para IA con timeout). |
| Formularios | RHF + Zod | Validación declarativa, consistente con validación de servidor. |
| Estado global | Mínimo; contextos puntuales (auth, preferencias de usuario) | Evita sobre-ingeniería; TanStack Query cubre el resto. |
| Gráficos | Recharts vía `Chart` de shadcn | Accesible, con tooltip personalizable y datos tabulados alternativos. |
| IA | Streaming SSE al backend | UI reactiva, cancelable, con timeout (NFR-PR-004). |
| Sesión | Cookie `HttpOnly` (web) / Bearer token en almacenamiento seguro (nativo) | El cliente abstrae la fuente del token; el backend valida igual. |
| Tema | `next-themes` con atributo `class` | Permite light/dark/system (FR-AUT-006). |
| Moneda/fecha | `Intl.NumberFormat` / `Intl.DateTimeFormat` + `date-fns` | Localización real (NFR-CAL-003). |

---

## 3. Mapa del sitio

```
/ (redirect → /dashboard si hay sesión, si no → /login)
│
├── (auth)                    # sin sesión
│   ├── /login                # iniciar sesión (FR-AUT-002)
│   ├── /register             # registro (FR-AUT-001)
│   ├── /forgot-password      # solicitar recuperación (FR-AUT-003)
│   └── /reset-password       # setear nueva contraseña (FR-AUT-003)
│
└── (app)                     # requiere sesión (FR-AUT-004); layout con sidebar
    ├── /dashboard            # inicio: indicadores, cuentas, inversiones (SC-002/003/006)
    ├── /accounts/detail      # detalle de una cuenta (SC-003); el listado vive en /dashboard
    ├── /goals/detail         # detalle de una meta (SC-007); concepto distinto de cuenta
    ├── /patrimony/assets/detail       # detalle de un activo (SC-006)
    ├── /patrimony/investments/detail  # detalle de una inversión financiera (SC-006)
    ├── /patrimony/debts/detail        # detalle de una deuda (SC-006)
    ├── /transactions         # listado + alta/edición (SC-004)
    ├── /budgets              # control por categoría/período (SC-005)
    ├── /budgets/detail       # detalle del presupuesto: ritmo del mes + movimientos (SC-005)
    ├── /reports              # resumen, export, print (SC-008)
    ├── /reports/investments  # reporte de patrimonio (SC-006/008)
    ├── /categories           # categorías de ingresos y gastos (SC-004)
    ├── /assistant            # chat con la IA (SC-009)
    └── /settings             # preferencias: moneda, privacidad, IA (SC-010)
```

**Reglas de enrutamiento:**

- La protección de rutas vive en un **`AuthGuard` en cliente** (componente que envuelve el layout de `(app)`): si no hay sesión, redirige a `/login`. El backend valida la autorización en cada request, así que el guard es solo UX (FR-AUT-004).
- `(app)` comparte un `layout.tsx` con la navegación (sidebar en desktop / barra inferior en móvil), `Header` (tema y usuario) y el provider de TanStack Query.
- Toda página de `(app)` se renderiza tras una verificación de sesión; los datos se cargan en cliente vía Query.
- **Sin `middleware.ts`** (o solo como optimización opcional en web): en el build estático/Capacitor no existe, por lo que la barrera real es el guard en cliente + el backend.

**Navegación responsive (web + app):**

- **Desktop (≥ `md`)**: `Sidebar` lateral fija con las secciones y accesos de perfil/configuración. El `Header` (**tema** y menú de usuario) es **solo desktop** (`hidden md:flex`). El **período** vive en el contenido como filtro de página. **No hay selector de moneda**: la moneda de visualización es la **base** del usuario (se cambia en Ajustes).
- **Móvil (< `md`)**: la navegación se convierte en una **barra inferior estilo app móvil** (flotante, separada del borde, con bordes redondeados), como en las apps nativas. Se detecta por viewport (`matchMedia` / CSS), no por plataforma. El estilo visual es propio; se toma como referencia (no como requisito) la estética "Liquid Glass" de iOS 26.
- La barra inferior tiene **4 ítems**: `Inicio`, **`Asistente`** (abre el chat, no navega), `Reportes` y `Perfil`; más un **botón central prominente** `+` que lleva a **Movimientos**.
- **`Perfil`** (ruta `/profile`) es el hub de la barra inferior: muestra la tarjeta de perfil, las secciones que no están en la barra (Presupuestos, Categorías), el **selector de Tema** (claro/oscuro/automático), un acceso a **Ajustes** (`/settings`) y **Cerrar sesión**. Se comporta como una pestaña más, no como un `Sheet` superpuesto.
- **El asistente no está en la sidebar**: en **desktop** es un **widget flotante** (botón abajo a la derecha) disponible en `(app)`, salvo en `/assistant`; en **mobile** es una **página propia** (`/assistant`) a la que se entra desde el ítem `Asistente` de la barra inferior. Ver §10.
- Estado activo con ícono + label, respetando NFR-UA-005 (no solo color); safe-areas (`env(safe-area-inset-bottom)`) para el notch/gesto de home.
- **Mobile**: no hay header global (se veía "raro" y poco nativo). Cada página muestra su propio título (`PageHeader`); el **tema** se cambia desde `Perfil` y el resto de preferencias/IA desde `Ajustes`. En `/dashboard`, `/reports` y `/reports/investments` el **período** se muestra dentro del contenido (`PeriodSelector`), no en una barra fija.
- `PeriodSelector` vive en `components/common/` y es un **filtro por página**. La **moneda de visualización** es la moneda base del usuario (`DisplayCurrencyProvider`), sin selector; se edita en Ajustes (`PATCH /users/me`).
- El mismo comportamiento aplica en el navegador móvil y dentro de Capacitor (misma base de código).

---

## 4. Funcionalidades por página

Cada página lista: FRs cubiertos, componentes shadcn, y comportamiento esperado. El detalle de endpoints está en `backend.md`.

### 4.1 `/login`, `/register`, `/forgot-password`, `/reset-password` — SC-001 (FR-AUT-001..003)

- **Login:** email + contraseña. El backend devuelve `{ user, accessToken, refreshToken }`; en web además fija cookie `HttpOnly`, y en nativo el token se guarda en almacenamiento seguro (Keychain/Keystore vía Capacitor). On success → `router.push("/dashboard")` + `router.refresh()`.
- **Registro:** nombre, email, contraseña (con confirmación). **Política:** 8–72 caracteres, al menos una letra y un número (debe coincidir con el backend). Tras registrarse, se loguea automáticamente.
- **Recuperar:** input de email → envía enlace; pantalla de "revisá tu correo" con reintento controlado. El enlace apunta a `/reset-password?token=...` y permite setear nueva contraseña.
- **Componentes:** `Card`, `Form`, `Input`, `Button`, `Alert`, `Label`.
- **Errores:** mensajes genéricos del servidor (NFR-SEG-010), nunca detalles sensibles. Rate-limit visual tras fallos repetidos.
- **Demo:** en la pantalla de login se pueden precargar las credenciales del seed (`demo@atlassfin.app` / `Demo1234!`).

### 4.2 `/dashboard` — SC-002 (FR-DAS-001..008)

Vista de aterrizaje **"Tu resumen"**, un resumen real (no un tablero de análisis), con `Skeleton` mientras carga.

- **Patrimonio neto** (FR-DAS-001/002): `NetWorthHero` a **ancho completo** con valor, variación vs. período anterior (`TrendBadge`), mini-stats (Ingresos/Gastos/Ahorro/Tasa) y sparkline con **escala adaptativa** (min/max + padding) y **tooltip**. El patrimonio usa la **misma fórmula que Reportes y Patrimonio** (cuentas + activos + inversiones financieras − deudas).
- Sin acciones rápidas: el inicio prioriza el resumen (patrimonio neto → cuentas → metas → patrimonio). Las altas se hacen desde cada sección o el `+` de la barra inferior.
- **Cuentas y Metas** (`AccountsSection`): son **entidades separadas** (`accounts` y `goals`). Se **separan en dos bloques** con `SectionHeader` y `+` propios: **Cuentas** (`AccountsList` sobre `useAccounts`, ruta `/accounts/detail`) y **Metas** (`GoalsList` sobre `useGoals`, ruta propia `/goals/detail`, §4.7). Las metas **no suman al patrimonio neto** (el dinero ya está en su cuenta origen). Las metas muestran acumulado/objetivo, cuenta origen, `Progress`, `%`, **faltante** ("Faltan $X"), **fecha objetivo** ("Objetivo: ene 2027") y **ahorro mensual necesario** cuando hay fecha; `progressPct`/`status` los devuelve el backend (CAL-007). Las cuentas con saldo negativo muestran "Saldo negativo". Botones `+` (`AccountTypePicker` → `AccountFormDialog` para cuentas; `GoalFormDialog` para metas) y las filas navegan al detalle correspondiente (§4.3.1 / §4.7).
- **Patrimonio** (`InvestmentsSection`, debajo de Metas): renombrada desde "Inversiones" porque agrupa **Activos**, **Inversiones financieras** (posiciones tipo BTC) y **Deudas**. Cada grupo es una lista de items (`AssetsList` / `PositionsList` / `DebtsList`); el `+` abre `InvestmentTypePicker` (Activo / Inversión / Deuda) y **cada fila navega a su página de detalle** (`/patrimony/.../detail`), con menú `...` para acciones rápidas (editar/valuaciones/archivar/eliminar). El `SectionHeader` incluye el CTA **"Ver reportes"** → `/reports/investments` (evolución, composición y KPIs del patrimonio). Los formularios y el `ValuationSheet` viven acá; ya no hay página `/assets`.
- **Filtro de período** (FR-DAS-007): `PeriodSelector` dentro del contenido de la página. La **moneda de visualización** es la base del usuario (sin selector en la UI).
- **Estados vacíos** (FR-DAS-008): `EmptyState` reutilizable.

> El tablero de widgets y gráficos de análisis (FR-DAS-003..006, FR-REP-*) ahora vive en **`/reports`** (§4.8).

> Ver **§4.8.1** para los widgets y su personalización (movidos a `/reports`).

### 4.3 Cuentas — SC-003 (FR-CUE-001..005)

El **listado de cuentas vive en el inicio** (`/dashboard`, §4.2); se eliminó la página `/accounts` con buscador y filtros. Las cuentas se muestran como **lista de items** (`DataList` + `DataListItem`, genéricos reutilizables). La **creación** arranca con un **selector de tipo en grilla** (`AccountTypePicker`: Efectivo, Bancaria, Billetera, Tarjeta, Otra y **Objetivo**); al elegir un tipo se abre el `AccountFormDialog` con ese tipo precargado (nombre, tipo, moneda, saldo inicial, observaciones, FR-CUE-001/002).

El **formulario** (`AccountFormDialog`) es un editor visual: hero con ícono del tipo y **nombre editables**, chips de **tipo** (scroll horizontal) y **campos que varían según el tipo** (cuenta común: saldo + moneda + observaciones; objetivo: monto asignado, monto objetivo, moneda, fecha límite y cuenta origen; tarjeta: saldo como deuda). Al **editar** suma un toggle **"Cuenta archivada"**.

El formulario de cuentas ya **no incluye metas**: los tipos son `cash`, `bank`, `wallet`, `card` y `other`. Las metas se crean/editan con su propio `GoalFormDialog` (§4.7). **Saldo actual** lo devuelve el backend; el front solo lo muestra (FR-CUE-004).

#### 4.3.1 `/accounts/detail?id=<id>` — Detalle de cuenta

- **Encabezado** (`PageHeader`): botón atrás (móvil), nombre de la cuenta y acciones: editar (`Pencil`) y menú con archivar/restaurar.
- **Hero**: ícono por tipo, saldo actual grande y `StatusBadge` (activa/archivada; en objetivos, el estado de la meta).
- **Stats**: saldo inicial, ingresos y gastos del período global (`usePeriod`).
- **Movimientos**: `TransactionList` (lista de items reutilizable) con los movimientos de la cuenta en el período; al tocar uno se abre el `Dialog` de edición.
- **Cuenta objetivo**: en lugar de stats/movimientos muestra acumulado, objetivo, faltante, `Progress` de avance, y la **cuenta origen** ("Vive en …") con acceso a su detalle.
- **Editar** reutiliza `AccountFormDialog` (con los campos de objetivo cuando corresponde); **archivar/restaurar** usa `AlertDialog` de confirmación (FR-CUE-003/005).
- La ruta usa `?id=` en vez de `/accounts/:id` para ser compatible con el **static export** de Next/Capacitor; el id se lee con `useQueryParam`.

### 4.4 `/transactions` — SC-004 (FR-TRX-001..010)

- **Lista de items** (`TransactionList`) con paginación (NFR-PR-002) y menú por fila (editar/eliminar): ícono por tipo, descripción, `fecha · categoría · cuenta` y monto (color por signo). Cada fila abre la edición. **Las transferencias se colapsan en una sola fila** (`collapseTransfers` por `transferGroupId`, conservando la pata origen): subtítulo `fecha · Transferencia · Cuenta origen → destino` y monto **neutro** (sin verde/rojo); no afectan ingresos, gastos, ahorro ni patrimonio.
- **Búsqueda** (FR-TRX-006/007): único control de filtrado, `Input` tipo pill con debounce sobre descripción/notas. Se quitaron los filtros de tipo/fecha/cuenta/categoría.
- **CTA de alta**: botón `+ Nuevo movimiento` en desktop (ícono en mobile, donde la barra inferior ya aporta el `+` central).
- **Alta/edición** como editor moderno estilo app (`Dialog` + `Form`, FR-TRX-001/002/003): **segmented de tipo** (Gasto/Ingreso/Transferencia), filas de cuenta y categoría, **teclado numérico** (`AmountKeypad`) con operaciones `+ − × ÷`, **cálculo en vivo** (el resultado se muestra mientras se escribe, sin botón `=`), monto grande con signo por tipo y saldo disponible, fecha + comentario. El monto se evalúa con `lib/amount-expression.ts` (sin `eval`) y se valida `> 0`. Si es transferencia, selector origen/destino que excluye la otra cuenta elegida (FR-TRX-004).
- **Eliminar** con `AlertDialog` de confirmación.
- **Categorías personalizadas** (FR-TRX-008): gestión en el mismo módulo (ver §4.11).
- **CSV** (FR-TRX-009, P2) y **recurrentes** (FR-TRX-010, P2): marcados como fases futuras.

### 4.5 `/budgets` — SC-005 (FR-PRE-001..007)

- **Resumen mensual** (`BudgetsSummary`): `Presupuesto total`, `Gastado`, `Disponible` y `Categorías excedidas` antes del grid.
- **Listado por período** (selector de mes): cada tarjeta = categoría con `BudgetProgress` y `StatusBadge` de estado, ordenadas por **gravedad** (`Excedido → Advertencia → Disponible`, luego mayor consumo). La tarjeta entera abre el detalle (chevron); muestra "Se renueva" si el presupuesto es recurrente. La edición/eliminación se hacen desde el detalle.
- **Métricas por presupuesto** (FR-PRE-002/004): límite, gasto acumulado, disponible/excedido y % consumido (sin límite visual a 100%: muestra 120%).
- **Estados** (FR-PRE-003): `Disponible` (verde), `Advertencia` (ámbar), `Excedido` (rojo) en la barra **y** badge textual (NFR-UA-005). Un excedido dice **"Excedido por $X"**, nunca "Disponible" negativo. La tarjeta indica "Restan N días" para el mes en curso.
- **Crear** (FR-PRE-001): categoría + mes + límite + moneda, con **Renovación automática** (FR-PRE-007): el presupuesto se repite cada mes con el mismo límite sin recrearlo.
- **Copiar mes anterior** (FR-PRE-005, P1): botón "Copiar del mes anterior".
- **Editar/eliminar** con confirmación (FR-PRE-006).
- **Detalle** (`/budgets/detail?id=&period=`, FR-PRE-008): encabezado con categoría y mes; resumen de consumo; **Ritmo del mes** (promedio diario, proyección de cierre, disponible por día, días restantes y aviso de posible exceso); y los **movimientos de la categoría** que componen el presupuesto. Abre la edición del presupuesto.

### 4.6 Inversiones — SC-006 (FR-ACT-001..008)

La gestión vive en el inicio (§4.2, sección **Patrimonio** / `InvestmentsSection`) y cada elemento tiene ahora **página de detalle navegable**. Se eliminó la página `/assets` y su vista con tabs. El **reporte de patrimonio** vive en `/reports/investments` (§4.6.1).

- **Filas navegables con chevron**: `AssetsList` / `PositionsList` / `DebtsList` enlazan a `/patrimony/.../detail?id=` mostrando el **chevron** (igual que Cuentas y Metas), sin menú `...`. **Todas las acciones** (editar, valuaciones, archivar/eliminar) viven en el detalle, que reutiliza la profundidad de `/accounts/detail` (header + hero + KPIs + secciones + edición).
- **Activos** (FR-ACT-001/003/007): CRUD con tipo (`Propiedad`, `Vehículo`, `Efectivo`, `Inversión`, `Criptoactivo`, `Otro`), nombre, moneda, valor, fecha de valuación, notas. Historial de valuaciones en `ValuationSheet` (FR-ACT-004): nueva valuación agrega, no sobrescribe. `AssetFormDialog` permite editar metadata y, opcionalmente, **cargar una nueva valuación** (que se agrega al historial sin borrar las anteriores).
- **Detalle de activo** (`/patrimony/assets/detail`): hero con última valuación y variación, `ValuationSummary` (valor actual/anterior, variación $ y %, fecha), `ValuationHistory` (gráfico temporal + listado), `EquitySummary` cuando hay deuda vinculada y bloque de información.
- **Posiciones / Mercado** (FR-ACT-005/006): instrumento/símbolo, cantidad, costo promedio, moneda. El detalle (`/patrimony/investments/detail`) muestra cantidad, costo promedio, capital invertido, precio actual, valor actual, resultado absoluto y rentabilidad, con equivalencia en moneda base; la cotización desactualizada muestra la hora real. La edición distingue campos editables de los **derivados de mercado** (precio/valor/resultado).
- **Deudas** (FR-ACT-002/007): tipo (`Préstamo`, `Hipoteca`, `Tarjeta`, `Otra`), saldo, moneda, fecha. El detalle (`/patrimony/debts/detail`) muestra el **activo vinculado** y el **equity** (`valor del activo − deuda`), con navegación bidireccional activo ↔ deuda (FR-ACT-008).
- **Alta/edición coherente con Cuentas**: `AssetFormDialog`, `PositionFormDialog` y `DebtFormDialog` (y el `ValuationSheet`) siguen la anatomía de `AccountFormDialog`: hero degradado con ícono + nombre inline, selector de tipo en *pills*, campos agrupados en grillas de 2, observaciones y switch de **archivar** en edición. Los campos derivados de mercado (precio/valor/resultado) se muestran como no editables.
- **Cotización desactualizada**: `WarningBadge` con antigüedad y fecha/hora real (FR-MER-005).
- **Pendiente (contrato)**: campos de deuda ampliados (monto original, tasa, cuota, fechas) e historial de saldo; evolución de precio por posición.

#### 4.6.1 `/reports/investments` — Reporte de Patrimonio

Página de análisis del patrimonio ("Patrimonio", "Evolución y composición de tu patrimonio"), accesible desde la **navegación secundaria** de Reportes (`ReportsTabs`: General | Patrimonio), no desde un botón de acción. Usa el `useDashboard` del período/moneda elegidos.

- **Resumen**: tiles de **Activos, Inversiones financieras, Cuentas, Deudas y Patrimonio neto**, cada uno con variación cuando existe (`StatTiles`). Los cinco componentes **reconstruyen exactamente** el patrimonio neto (`activos + inversiones + cuentas netas − deudas`).
- **Evolución** (`TimeSeriesChart`): selector **Patrimonio | Activos | Deudas** sobre `netWorthSeries` (`{ date, value, assets, debts }`), con tooltip y **máximo/mínimo** del período. Estado vacío con menos de dos puntos.
- **Composición de activos** (`AllocationList` sobre `netWorthComposition`): Propiedades, Vehículos, Otros activos, Inversiones y **Cuentas netas** (incluye saldos negativos). Debajo, el cierre contable: `Activos brutos`, `Deudas` y `Patrimonio neto`. Los porcentajes se calculan sobre el activo bruto, sin deudas.
- **Inversiones financieras** (`InvestmentsSummary`): valor actual, capital invertido y resultado; por posición muestra **cantidad y moneda original** (`0,05 BTC · US$ 3.200`) y la **conversión** a la moneda base (`≈ ARS $3.200.000`); la cotización desactualizada se identifica por posición (`WarningBadge` con **antigüedad visible** "hace 2 h" y detalle "Última cotización: …") además del resumen inferior.
- **Pendiente (contrato)**: evolución del precio de cada posición y de la reducción de deuda (requieren historial en el backend; hoy solo hay valuaciones de activos). `debtsDeltaPct` se calcula con la serie de deuda del mock.

### 4.7 Objetivos — SC-007 (FR-OBJ-001..004)

Los objetivos son un **módulo propio** (`goals`, `lib/query/goals.ts`), no un tipo de cuenta. Viven en el bloque **Metas** del inicio (§4.2), separado de **Cuentas**. Tienen su **propia página de detalle** en `/goals/detail?id=` (no bajo `/accounts/detail`): `GoalDetailView` reutiliza `PatrimonyHero` y `DetailMetric`; el progreso (`goalProgress` en `lib/goal.ts`) parte de `progressPct`/`status` que devuelve el backend (CAL-007) y calcula solo el faltante y el ahorro mensual necesario.

- **Fila de meta** (`GoalsList`, bloque Metas): nombre, acumulado vs. monto objetivo, cuenta origen ("vive en …" abreviado), `Progress` de avance (CAL-007), `%`, faltante, **fecha objetivo** y **ahorro mensual necesario** (`lib/goal.ts`) y `StatusBadge`; navega al **detalle de la meta** (`/goals/detail`). El botón "Ver cuenta" enlaza a la cuenta origen real (`/accounts/detail`).
- **Estados** (FR-OBJ-004): `Pendiente`, `En curso`, `Alcanzado`, `Vencido` con `Badge` (el `status` lo calcula el backend).
- **Crear/editar** (FR-OBJ-001/003) con `GoalFormDialog` desde el `+` de Metas: nombre, monto asignado, monto objetivo, moneda, fecha límite y cuenta origen. Archivar/restaurar se hace desde el detalle o el formulario (endpoints `/goals/:id/archive` y `/goals/:id/restore`).

### 4.8 `/reports` — SC-008 (FR-REP-001..007)

Tablero **personalizable por widgets** (base que antes vivía en el inicio) + análisis del período. Selector de período/moneda en el header.

- **Resumen del período** (`ReportsSummary`, siempre arriba): tira compacta con **Ingresos, Gastos, Ahorro y Tasa de ahorro**, con variación vs. período anterior en los cuatro (la tasa de ahorro en **puntos porcentuales**, "+3,2 pp"). Lo primero que se ve es "cuánto entró, cuánto salió, cuánto ahorré". Los cuatro KPIs aparecen **una sola vez** (el widget de patrimonio no los repite).
- **Cambios destacados** (`HighlightsCard`): bloque compacto de insights calculados comparando el período actual con el anterior (variación de gastos, ahorro y la categoría de mayor cambio), sin IA. Se ubica **debajo de los gráficos** (después del tablero de widgets).
- **Widgets** (FR-DAS-002..006, FR-REP-002/003/004/005), en orden por defecto: **patrimonio neto**, **ingresos vs. gastos**, **gastos por categoría** y **presupuesto mensual y su uso**. Se movieron **inversiones** y **composición de activos** al reporte de patrimonio (§4.6.1); se eliminaron **comparación de gastos** (redundante con *ingresos vs. gastos*) y **alertas de presupuesto** (redundante con *presupuesto mensual*).
- **Período**: `PeriodSelector` dentro del contenido; el encabezado muestra el rango en lenguaje de usuario (`describePeriod`, p. ej. "Últimos 6 meses · 1 abr – 12 sep 2026"). El **widget de presupuesto** explicita que es del **mes actual** y no depende del período global ("Presupuesto de septiembre · Mes actual · no depende del período global").
- **Navegación secundaria** (`ReportsTabs`): **General | Patrimonio**; reemplaza al botón **Inversiones** del header. El header solo conserva acciones (Widgets, Editar).
- **Pendiente (contrato backend)**: resumen financiero como tabla (FR-REP-001), export CSV (FR-REP-006), PDF/imprimible (FR-REP-007, P2).

#### 4.8.1 Widgets y personalización

- **Registro de widgets** en `lib/dashboard-widgets.ts`: `id`, `label`, `description`, `weight` (para empaquetado) y **`maxSpan`** (máximo de columnas que puede ocupar).
- **Widget de presupuesto**: `budgetUsage` (`BudgetUsage`: presupuestos del mes con el mismo `BudgetProgress` que la página Presupuestos, gasto/límite y estado). Toma el mes del fin del período elegido.
- **Tarjeta compacta** (`WidgetCard`): encabezado chico (título + bajada) y contenido a `px-5`; reemplaza el `Card`/`CardHeader` para que cada widget ocupe menos y muestre más.
- **Orden en mobile**: como el tablero edita solo en desktop, en mobile los widgets se listan en el **orden de prioridad del registro** (`DASHBOARD_WIDGETS`), no en el orden de columnas, para que la lectura sea coherente.
- **Layout persistido en el cliente** (`localStorage`, clave `atlassfin.dashboard.layout.v7`) vía `useDashboardLayout`: `{ columns: id[][], hidden: id[], spans }`. Es una decisión de UI, no se persiste en el backend.
- **Modo edición** (botón "Editar"): **arrastrar y soltar** (soltar sobre otra tarjeta **intercambia**; soltar en un espacio libre inserta en la columna/posición calculada por el puntero), botones subir/bajar, ocultar y **cambiar ancho** (cicla 1..`maxSpan`).
- **Grilla masonry**: `grid` con `grid-auto-rows` de 8px + alturas medidas con `ResizeObserver`; los widgets anchos usan `grid-column: span N`. La lógica de drag/medición vive en el hook privado `use-widget-grid` y el render en `WidgetsBoard`; `ReportsView` queda como composición.
- **Anchos**: `netWorth` hasta 3 (default 3/3); el resto `maxSpan: 1`.
- **Picker "Widgets"**: mostrar/ocultar y "Restablecer diseño".
- En 2 columnas, un span 3 se limita a 2.

### 4.9 `/assistant` — SC-009 (FR-IA-001..011)

Ver §10. En **mobile** es la página `/assistant` (ítem `Asistente` de la barra inferior), integrada como el resto: **`PageHeader` estándar** arriba (sin botón atrás, porque es una pestaña raíz de la barra) con las acciones **nueva conversación (`+`)** e **historial** con el mismo estilo de botón de los demás headers (controlan el chat y su `Sheet`), **contenedor de mensajes con scroll propio** (`ScrollArea`) y **input + enviar pegados a la barra inferior, sin borde superior**. Para eso el shell de `(app)` usa `h-dvh` + scroll interno de `<main>`, así la ventana no scrollea en esta página. En **desktop**, un **widget flotante** (botón abajo a la derecha) presente en `(app)` que oculta el FAB en `/assistant`. Estado vacío diseñado (**hero con ícono, título y tarjetas de preguntas sugeridas**), `Alert` de alcance y disclaimer de no-asesoramiento.

### 4.10 `/profile` — SC-010 (perfil) y `/settings` (ajustes)

- **`/profile`** (`ProfileMenu`): tarjeta de perfil (avatar con iniciales, nombre, email), secciones que no están en la tab bar (**Presupuestos, Categorías**), **Tema** (abre un `OptionSheet`), acceso a **Ajustes** (`/settings`) y **Cerrar sesión**. Es el ítem `Perfil` de la barra inferior.
- **`/settings`** (Ajustes): preferencias restantes. En mobile, un menú de filas (`SettingsMenu`: Moneda base, Asistente IA; Moneda abre un **bottom sheet** de opciones); en desktop, el formulario (`SettingsForm`).
- **Perfil:** `PATCH /users/me` con nombre (email no editable en esta versión).
- **Tema** (FR-AUT-006): selector claro/oscuro/automático en **Perfil** (`ProfileMenu`, vía `OptionSheet`); se persiste con `PATCH /users/me { theme }` (además de `next-themes` local). El `ThemeToggle` del header desktop sigue como atajo.
- **Privacidad:** habilitar/deshabilitar IA con `PATCH /users/me { aiEnabled }` (FR-IA-001) y borrar historial del asistente (`DELETE /assistant/conversations`, FR-IA-009, `AlertDialog`).
- **Sesión:** cerrar sesión (`POST /auth/logout`, FR-AUT-002).

### 4.11 Gestión de categorías (compartida) — FR-TRX-008

Página propia **`/categories`**, accesible desde el hub de **Perfil** (`/profile`). Tiene **tabs arriba** para elegir **Gastos** o **Ingresos** (así los ingresos no quedan debajo de todos los gastos) y un `+` en el header que crea del tipo activo. Cada fila abre `CategoryFormDialog` (nombre, tipo, color con paleta) y las propias se pueden **archivar** desde el menú. Las **categorías del sistema** (`isSystem: true`) se muestran con `Badge` "Sistema" y no se editan ni archivan; el usuario solo gestiona las suyas. El color se usa como `Badge`/punto en toda la app.

---

## 5. Estructura de archivos

```
client/
├── app/
│   ├── layout.tsx                 # root: html/body, AppProviders, theme
│   ├── globals.css                # CSS vars de shadcn + tailwind
│   ├── page.tsx                   # redirect según sesión
│   ├── (auth)/
│   │   ├── layout.tsx             # centrado, branding
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── (app)/
│       ├── layout.tsx             # Sidebar + Header + MobileTabBar + AuthGuard
│       ├── dashboard/page.tsx
│       ├── accounts/detail/page.tsx
│       ├── transactions/page.tsx
│       ├── budgets/page.tsx
│       ├── budgets/detail/page.tsx
│       ├── categories/page.tsx
│       ├── reports/page.tsx
│       ├── reports/investments/page.tsx
│       ├── assistant/page.tsx
│       ├── profile/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                        # generado por shadcn (NO editar a mano salvo variantes)
│   ├── layout/
│   │   ├── app-nav.ts               # registro de navegación (desktop y móvil)
│   │   ├── sidebar.tsx
│   │   ├── mobile-tab-bar.tsx       # barra inferior estilo app móvil
│   │   ├── header.tsx               # header desktop (moneda, tema, usuario)
│   │   ├── header/user-menu.tsx
│   │   ├── auth-guard.tsx           # guard de sesión en cliente (rutas de (app))
│   │   ├── brand.tsx
│   │   └── native-system-bars.tsx   # status/navigation bar en Capacitor
│   ├── common/                      # genéricos domain-agnostic (folder + index.tsx)
│   │   ├── amount/  amount-keypad/  category-badge/  confirm-dialog/
│   │   ├── currency-selector/  period-selector/  period-currency-filters/
│   │   ├── data-list/  data-list-item/  date-picker/  empty-state/
│   │   ├── markdown-text/  page-header/  responsive-dialog/
│   │   ├── stat-tiles/  status-badge/  back-button/  coming-soon/  list-row/
│   │   ├── chart-data-table/  icon-badge/  option-picker-dialog/  page-loader/
│   │   ├── row-actions-menu/  form-shell/  form-dialog/
│   │   ├── form-text-field/  form-select-field/  form-currency-field/  form-date-field/
│   │   └── theme-toggle/
│   ├── charts/                      # wrappers de shadcn Chart (Recharts)
│   └── features/<feature>/          # componentes de dominio (accounts, transactions, …)
├── lib/
│   ├── utils.ts                   # cn()
│   ├── format.ts                  # formatCurrency, formatDate, formatPercent, …
│   ├── period.ts / period-stats.ts / dashboard-widgets.ts / goal.ts / labels.ts
│   ├── sections.ts / forms.ts / storage.ts
│   ├── amount-expression.ts
│   ├── api/                       # client, types, session, endpoints, errors, assistant-stream
│   ├── query/                     # hooks de TanStack Query por dominio (+ keys.ts)
│   ├── validation/                # schemas Zod por formulario
│   ├── native/                    # puente a plugins Capacitor
│   └── mocks/                     # API mockeada para desarrollo
├── hooks/                         # hooks compartidos (auth, período, moneda, confirm, …)
├── providers/                     # app-providers, auth, query, período, tema, asistente…
├── capacitor.config.ts             # config de Capacitor (appId, webDir: out)
├── android/                        # proyecto Android (generado por Capacitor)
├── next.config.ts                  # output: "export", images: unoptimized
├── components.json                # config de shadcn (preset radix-maia)
├── tsconfig.json
├── package.json
└── .env.example                    # NEXT_PUBLIC_API_URL, etc. (no versionar)
```

**Notas:**

- Los componentes de `components/ui/` se instalan con el CLI de shadcn y se extienden con variantes solo si es necesario.
- Cada componente propio vive en su carpeta con `index.tsx`, `*.types.ts`, `*.utils.ts` y/o `hooks/` privados (ver skill `quality-rules`).
- `components/common/` agrupa los genéricos reutilizables (`StatTiles`, `PeriodSelector`, `OptionSheet`, `DataList`, `Amount`, `EmptyState`, …); `components/features/` solo agrega concerns de dominio y **compone** los genéricos.
- Cada dominio de datos tiene su archivo de hooks en `lib/query/`, que encapsula las `queryKey`s y las mutaciones con su invalidación. Las claves están centralizadas en `lib/query/keys.ts`.
- La lógica transversal vive en hooks compartidos: `use-confirm-action` (confirmar + mutar + toast), `use-period`, `use-display-currency`, `use-dashboard-layout`, etc.
- El tablero de widgets de `/reports` separa estado (`use-dashboard-layout`), interacción/grilla (`use-widget-grid`) y render (`WidgetsBoard`).
- Los schemas Zod viven en `lib/validation/` y reflejan los DTOs de `lib/api/types.ts`.
- `next.config.ts` usa `output: "export"` e `images: { unoptimized: true }` para generar el estático que Capacitor sirve (`webDir: out`).
- No existe `middleware.ts`: el guard de sesión es `auth-guard.tsx` en cliente. La seguridad real la impone el backend.

---

## 6. Integración de shadcn/ui

### 6.1 Instalación

```bash
npx create-next-app@latest client --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd client
# Preset propio: radix-maia, green, radius large, Outfit (títulos) + Nunito (cuerpo) (ver components.json)
npx shadcn@latest init --preset b1ZONO4zw --base radix --template next
npx shadcn@latest add button card input label select dialog alert alert-dialog
npx shadcn@latest add dropdown-menu table badge tabs sheet progress skeleton
npx shadcn@latest add scroll-area textarea switch radio-group calendar popover chart sonner tooltip separator
npx shadcn@latest add breadcrumb avatar
```

> **Iconos**: el preset usa `lucide-react`; no mezclar con otra librería. Los SVGs no traen color ni tamaño fijos: controlar con `className` (`size-4`) y `currentColor`, igual que los componentes de shadcn.

> **Notas del registro actual**: el componente `form` (RHF) ya no existe en el registro (`form.json` viene vacío), así que el wrapper clásico se agregó a mano en `components/ui/form.tsx`. No existe `date-picker`: se compone con `calendar` + `popover`. El registro emite `import { cn } from "cn"` (un paquete npm ajeno); `tsconfig.json` aliasa `cn` → `@/lib/utils` (implementado con `clsx` + `tailwind-merge`) para no editar archivos generados.

### 6.2 Theming (FR-AUT-006, NFR-CAL-002)

- Se conservan las CSS variables en `globals.css` (`--background`, `--foreground`, `--primary`, etc.) en `:root` y `.dark`.
- `next-themes` aplica la clase `dark` en `<html>` con `attribute="class"`, `defaultTheme="system"`, `enableSystem` (`providers/theme-provider.tsx`).
- **Regla**: nunca usar colores hardcodeados; siempre `bg-background`, `text-foreground`, `border-border`, `bg-muted`, etc., o tokens `primary/destructive/success/warning`.
- Se agregan tokens semánticos propios: `--success`, `--warning`, `--destructive` para estados financieros (positivo/negativo/advertencia), usados por `Badge` y `Progress`.

### 6.3 Componentes financieros reutilizables

- **`Amount`**: formatea monto con signo y color (`success` positivo ingreso, `destructive` gasto, `muted` transferencia). Respeta NFR-UA-005 (signo + color, no solo color).
- **`StatTiles`**: grilla **2×2 en mobile** que pasa a tira horizontal en desktop (`label` + valor con tono y delta opcional). La usan `ReportsSummary` y el reporte de patrimonio; los textos/formatos de Ingresos/Gastos/Ahorro/Tasa se derivan de `lib/period-stats.ts` (fuente única compartida con `NetWorthHero`).
- **`PeriodSelector`**: filtro de período de página, compartido por `/dashboard`, `/reports` y `/reports/investments`. No hay selector de moneda: se usa la moneda base del usuario.
- **`NetWorthHero`**: hero de patrimonio neto con variación, mini-stats del período (opcionales vía `showPeriodStats`) y sparkline con escala adaptativa y tooltip.
- **`Money`**: formatea un monto en una moneda (`formatCurrency`) con variante aproximada (`≈`) para conversiones.
- **`TrendBadge`**: pill de variación con ícono y color por signo.
- **`SectionCard` / `SectionHeader`**: card y encabezado de sección reutilizables (título, descripción, acciones).
- **`AllocationList`**: lista de composición con barra, valor y porcentaje (no depende solo del color); usada por la composición del patrimonio.
- **`WarningBadge`**: badge de advertencia con detalle en tooltip (p. ej. cotización desactualizada).
- **`DetailMetric`**: métrica compacta `label + valor` para los detalles.
- **`PatrimonyHero` / `ValuationSummary` / `ValuationHistory` / `LinkedEntityCard` / `EquitySummary`**: piezas de los detalles de patrimonio (hero, resumen de valuaciones, historial, vínculo activo↔deuda y equity) compartidas por las tres páginas sin duplicar estructura.
- **`TimeSeriesChart`**: gráfico temporal genérico (áreas, tooltip, escala adaptativa y estado vacío con menos de dos puntos).
- **`BudgetProgress`**: barra + etiqueta de presupuesto reutilizada por Presupuestos y Reportes; color por estado (verde/ámbar/rojo), `Excedido por $X` y porcentaje real (>100%).
- **`EmptyState`**: ícono, título, descripción, acción CTA (FR-DAS-008).
- **`CategoryBadge`**: `Badge` con el color de la categoría.
- **`StatusBadge`**: estado con ícono + texto + color (presupuesto, objetivo, cuenta y cotización); reemplaza a `BudgetStatusBadge`.
- **`DataList` / `DataListItem`**: lista de items genérica (loading, vacío, paginación) con filas `leading/title/subtitle/trailing` y acción opcional. Se usan en todas las secciones; **no hay tablas** (`DataTable` eliminado).
- **`IconBadge`**: tile de ícono reutilizable (tamaño, forma y tono semántico) usado por las listas, pickers y estados.
- **`RowActionsMenu`**: menú de acciones por fila (`Editar`/`Archivar`/`Eliminar`/`Valuaciones`…) con trigger y `aria-label` consistentes; evita repetir el `DropdownMenu` en cada lista.
- **`OptionPickerDialog`**: diálogo de selección con opciones (ícono + título + bajada); unifica `AccountTypePicker` e `InvestmentTypePicker`.
- **`ChartDataTable`**: tabla `sr-only` equivalente a cada gráfico (NFR-UA-004), compartida por todos los charts.
- **`PageLoader`**: estado de carga a pantalla completa usado por el redirect raíz y el `AuthGuard`.
- **Formularios compartidos** (`FormShell`, `FormDialog`, `FormTextField`, `FormSelectField`, `FormCurrencyField`, `FormDateField`): eliminan el scaffold de RHF y los campos repetidos (moneda, fecha, selects de tipo) en todos los formularios.
- **`useConfirmAction`**: hook compartido que encapsula el patrón *confirmar → mutar → toast* (usado por eliminar/archivar cuentas, movimientos, presupuestos, categorías, activos, posiciones y deudas).

**Fuentes únicas de verdad transversales:**
- `lib/sections.ts`: registro de secciones (`href` + `label` + `icon`) consumido por sidebar, tab bar y perfil; agregar una sección es un solo cambio.
- `lib/period-stats.ts`: labels/formatos de Ingresos/Gastos/Ahorro/Tasa.
- `lib/forms.ts`: mapeo de `fieldErrors` del backend a campos de RHF.
- `lib/storage.ts`: lectura/escritura segura de `localStorage` (layout del tablero, hilos del asistente).
- `lib/query/keys.ts`: claves de TanStack Query y bases de invalidación (`transactionsBase`, `budgetsBase`, `dashboardBase`).

### 6.4 Chart (Recharts)

- El componente `chart` de shadcn provee `ChartContainer`, `ChartTooltip`, `ChartLegend` y configuración de colores vía CSS vars.
- **Accesibilidad (NFR-UA-004)**: cada gráfico va acompañado de un `aria-label` y, en la misma página o en una pestaña, una `Table` con los mismos datos.
- Los datos de gráficos se adaptan con `useMemo` a la estructura que Recharts espera.

---

## 7. Capa de datos y API client

### 7.1 Cliente HTTP (`lib/api/client.ts`)

- `fetch` nativo con `credentials: "include"` en web para la cookie de sesión.
- Base URL desde `process.env.NEXT_PUBLIC_API_URL` (p. ej. `http://localhost:3001/api` en dev; URL pública HTTPS en producción/nativo).
- Normaliza errores a `ApiError { statusCode, code, message, fieldErrors? }` (catálogo en `backend.md` §7.17).
- Expone `get<T>`, `post<T>`, `patch<T>`, `del<T>` tipadas y un helper `apiFetch` de bajo nivel (usado por el parser SSE de §10).
- **Estado actual (fase mock).** Mientras el backend no exponga los recursos restantes, `lib/api/endpoints.ts` resuelve todo contra `lib/mocks` salvo que `NEXT_PUBLIC_USE_MOCKS=false`. Por eso hoy el cliente **no inyecta `Authorization: Bearer` ni reintenta refresh**: ante un `401` lanza `UnauthorizedError` y el `AuthGuard`/provider redirigen a `/login`. El refresh automático + Bearer nativo es el objetivo al conectar el backend real (§8).
- `lib/mocks/api.ts` es el **único** consumidor de `sessionStore`; no hay lógica de tokens en el cliente web todavía.

### 7.2 Sesión (`lib/api/session.ts`)

**Estado actual (fase mock).** El archivo implementa solo un `sessionStore` que persiste el `userId` del usuario demo/autenticado en `localStorage` (`atlassfin.session.userId`), y lo usan los mocks para resolver `/auth/me`. No guarda tokens. La interfaz `SessionStore` de abajo es el **objetivo** para el backend real:

```ts
// web: la cookie HttpOnly viaja sola, no guardamos nada en JS.
// nativo (Capacitor): access/refresh token en almacenamiento seguro.
export interface SessionStore {
  getAccessToken(): Promise<string | null>;
  setTokens(t: { accessToken: string; refreshToken: string }): Promise<void>;
  clear(): Promise<void>;
}
```

- Web: `credentials: "include"`; `setTokens`/`clear` no operan (o solo guardan `user` en memoria).
- Nativo: usa `@capacitor/preferences` para el refresh y un plugin de keychain (p. ej. `capacitor-secure-storage-plugin`) para el access token.

### 7.3 Tipos (`lib/api/types.ts`)

Reflejan el contrato del backend (fuente de verdad: `backend.md` §7.13–§7.17). **JSON en `camelCase`**, fechas `"YYYY-MM-DD"` y timestamps ISO 8601 UTC; los decimales llegan como `number`.

```ts
// ── Enums (deben coincidir 1:1 con backend.md §7.14) ──────────────────────
export type AccountType = "cash" | "bank" | "wallet" | "card" | "other";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type AssetType = "property" | "vehicle" | "cash" | "investment" | "crypto" | "other";
export type DebtType = "loan" | "mortgage" | "card" | "other";
export type BudgetStatus = "available" | "warning" | "exceeded";
export type GoalStatus = "pending" | "in_progress" | "achieved" | "overdue";
export type Theme = "light" | "dark" | "system";
export type ValuationSource = "manual" | "market";

// ── Genéricos ─────────────────────────────────────────────────────────────
export interface Paginated<T> { items: T[]; page: number; pageSize: number; total: number; totalPages: number; }
export interface ApiError { statusCode: number; code: string; message: string; fieldErrors?: Record<string, string[]>; }

// ── Auth / usuario ────────────────────────────────────────────────────────
export interface User { id: string; name: string; email: string; baseCurrency: string; theme: Theme; aiEnabled: boolean; createdAt: string; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }
export interface CurrenciesResponse { default: string; supported: string[]; }

// ── Finanzas ──────────────────────────────────────────────────────────────
export interface Account { id: string; name: string; type: AccountType; currency: string; initialBalance: number; currentBalance: number; archived: boolean; notes: string | null; createdAt: string; updatedAt: string; }
export interface Goal { id: string; name: string; targetAmount: number; savedAmount: number; currency: string; targetDate: string | null; sourceAccountId: string | null; archived: boolean; progressPct: number; status: GoalStatus; createdAt: string; updatedAt: string; }
export interface Category { id: string; name: string; type: CategoryType; color: string; icon: string | null; archived: boolean; isSystem: boolean; }
export interface Transaction { id: string; type: TransactionType; amount: number; currency: string; date: string; description: string; notes: string | null; accountId: string; categoryId: string | null; transferGroupId: string | null; createdAt: string; updatedAt: string; }
export interface Budget { id: string; categoryId: string; category: Pick<Category, "id" | "name" | "color">; period: string; limit: number; currency: string; recurring: boolean; spent: number; available: number; consumedPct: number; status: BudgetStatus; }
export interface Asset { id: string; name: string; type: AssetType; currency: string; currentValue: number; valuationDate: string; archived: boolean; notes: string | null; createdAt: string; updatedAt: string; }
export interface Valuation { id: string; assetId: string; value: number; currency: string; date: string; source: ValuationSource; createdAt: string; }
export interface Debt { id: string; name: string; type: DebtType; balance: number; currency: string; date: string; archived: boolean; assetId: string | null; createdAt: string; updatedAt: string; }
export interface Position { id: string; symbol: string; instrument: string; quantity: number; avgCost: number; currency: string; currentPrice: number | null; currentValue: number | null; costBasis: number; profitLoss: number | null; profitLossPct: number | null; quoteDate: string | null; quoteProvider: string | null; isStale: boolean; }
export interface Quote { symbol: string; price: number; currency: string; provider: string; change24h: number | null; fetchedAt: string; isStale: boolean; }

// ── Dashboard / reportes ──────────────────────────────────────────────────
export interface DashboardData {
  period: { from: string; to: string };
  currency: string;
  kpis: { netWorth: number; netWorthDeltaPct: number | null; income: number; incomeDeltaPct: number | null; expenses: number; expensesDeltaPct: number | null; savings: number; savingsDeltaPct: number | null; assets: number; debts: number; };
  netWorthSeries: { date: string; value: number }[];
  assetsValueByMonth: { month: string; value: number }[];
  incomeExpenseByMonth: { month: string; income: number; expenses: number }[];
  expensesByCategory: { categoryId: string; name: string; color: string; value: number }[];
  assetsComposition: { type: AssetType; value: number }[];
  budgetAlerts: { budgetId: string; categoryName: string; consumedPct: number; status: BudgetStatus }[];
}
export interface ReportSummary { from: string; to: string; currency: string; income: number; expenses: number; savings: number; netWorth: number; }
export interface ReportByCategory { categoryId: string; name: string; type: CategoryType; value: number; pct: number; }
export interface NetWorthPoint { date: string; netWorth: number; }
export interface BudgetReportRow { budgetId: string; categoryName: string; limit: number; spent: number; consumedPct: number; status: BudgetStatus; }

// ── Asistente ─────────────────────────────────────────────────────────────
export interface Conversation { id: string; question: string; answer: string; contextMeta: { period?: { from: string; to: string }; currency?: string; sources?: string[] }; createdAt: string; }
export interface AssistantStreamMeta { conversationId: string; period?: { from: string; to: string }; currency?: string; sources: string[]; }
```

> **Paridad:** el backend expone OpenAPI/Swagger (`/api/docs`, `/api/docs-json`). Se recomienda **generar** estos tipos desde el spec en CI (`openapi-typescript`) y usarlos como fuente única; el bloque de arriba documenta el contrato mínimo esperado. Cualquier cambio de endpoint debe reflejarse en ambos documentos.

### 7.4 Hooks de Query (`lib/query/*`)

- Claves consistentes: `["accounts"]`, `["transactions", filters]`, `["dashboard", period]`, etc.
- Mutaciones con invalidación en cascada: al crear un movimiento se invalidan `transactions`, `accounts`, `dashboard`, `budgets`, `reports`.
- `staleTime` corto para datos financieros; `retry` configurado.
- Los filtros viven en el estado de la página (o en la URL con `useSearchParams`) y se pasan como parte de la query key.

### 7.5 Provider raíz

```tsx
// providers/query-provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
export const QueryProvider = ({ children }) => {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```

---

## 8. Autenticación

Flujo basado en **JWT** emitido por el backend (ver `backend.md`). En web viaja en cookie `HttpOnly`; en nativo, en el header `Authorization: Bearer` con el token en almacenamiento seguro. El frontend **no** firma ni interpreta el token, solo lo transporta.

1. **Login/registro**: `POST /auth/login` → backend responde `{ user, accessToken, refreshToken }` y, en web, fija cookie. `session.ts` persiste los tokens (según plataforma) y `AuthProvider` guarda el usuario y redirige.
2. **Guard en cliente (`auth-guard.tsx`)**: envuelve el layout de `(app)`; si no hay usuario (o `GET /auth/me` falla con 401), redirige a `/login`. Es solo UX: el backend valida en cada request.
3. **Verificación inicial**: `GET /auth/me` al montar el provider para hidratar el usuario y confirmar validez. Ante `401`, limpiar estado y redirigir.
4. **Refresh**: `POST /auth/refresh` ante `401` (rotación); en web se hace con la cookie, en nativo con el refresh token guardado.
5. **Logout**: `POST /auth/logout` → backend invalida la sesión; front limpia tokens y redirige.
6. **401 global**: un interceptor del cliente lanza evento; `AuthProvider` redirige a `/login` (FR-AUT-002/004).

---

## 9. Gráficos y analítica (distintivo)

La analítica es el diferenciador. Directrices:

- **Consistencia**: un solo módulo `lib/format.ts` para moneda/porcentaje/fecha en todos los gráficos y KPIs.
- **Tipos de gráfico por dato**:
  - Serie temporal → `Chart` de área/línea (patrimonio, evolución).
  - Comparación por categoría/mes → barras (ingresos vs gastos, desglose).
  - Composición (partes de un todo) → donut (gastos por categoría, activos por tipo).
  - Progreso → `Progress` (presupuestos, objetivos).
- **Datos tabulados**: cada gráfico tiene su tabla equivalente para NFR-UA-004.
- **Período de página**: el `PeriodSelector` vive en el contenido de `dashboard`, `reports` y `reports/investments` (FR-DAS-007). Presupuestos tiene su propio selector de mes y Movimientos su búsqueda; así el alcance de cada filtro es explícito.
- **Moneda**: la moneda de visualización es la **base** del usuario (`DisplayCurrencyProvider`), persistida con `PATCH /users/me` y editada en Ajustes. Los montos llegan calculados por el backend (FR-DAS-007, CAL-008); el front no convierte ni ofrece cambio rápido de moneda.

---

## 10. Asistente de IA (distintivo)

Implementación de la UI conversacional (SC-009, FR-IA-001..011). El backend es quien interactúa con el proveedor de IA (DeepSeek); el front solo presenta la conversación.

- **Ubicación**: en **desktop** es un widget flotante (FAB abajo a la derecha + panel flotante); en **mobile** es una **página propia** (`/assistant`), accesible desde el ítem **`Asistente`** de la barra inferior (sin FAB ni overlay). Componente `components/features/assistant/assistant-widget` (solo desktop) + `assistant-chat`; el estado del panel vive en `AssistantPanelProvider`.
- **Separación**: la orquestación del chat (envío, streaming, grabación/transcripción) vive en el hook privado `assistant-chat/hooks/use-assistant-conversation`; `AssistantChat` queda como presentación. El historial local persiste vía `AssistantChatProvider`.
- **Flujo**:
  1. Si la IA está deshabilitada (`user.aiEnabled === false`, FR-IA-001), mostrar `Alert` con CTA a `/settings`.
  2. `POST /assistant/messages` con `{ question, conversationId, period, currency }`; el backend responde `text/event-stream` con los eventos `meta`, `token`, `action`, `done`, `error` (ver `backend.md` §7.16).
  3. UI muestra estado de carga mientras llega el stream; los `delta` se acumulan en la burbuja del asistente en vivo.
- **Acciones**: cuando el asistente ejecuta una mutación (hoy `createAccount`/`updateAccount`) llega `event: action` y el chat muestra una **tarjeta** (`components/features/assistant/assistant-action-card`) con el resultado; las acciones quedan asociadas al mensaje y se persisten con el hilo local.
- **Transporte**: usar `fetch` + `ReadableStream`, **no `EventSource`** (no permite `Authorization` ni body). Implementado en `lib/api/assistant-stream.ts` (`streamAssistantMessage`) con callbacks `onMeta`/`onToken`/`onAction`/`onDone`/`onError`. El `conversationId` devuelto en `meta` se reutiliza para preguntas siguientes.
- **Render**: la respuesta se acumula desde los `delta` y se renderiza **Markdown de forma segura** con `components/common/markdown-text` (produce elementos React para negrita/cursiva/código/listas; **nunca** usa `dangerouslySetInnerHTML`, NFR-SEG-006). El front marca la respuesta como informativa (FR-IA-008). El `ScrollArea` de la conversación usa `min-h-0` para poder scrollear dentro del panel.
- **Audio**: disponible **solo en web**. El botón de micrófono graba con `MediaRecorder` (`useAudioRecorder`) y transcribe con Web Speech API (`useSpeechRecognition`); si hay transcripción, la pregunta entra al **stream normal** del asistente (LLM + tools); sin transcripción se muestra un aviso local. En Android el dictado está deshabilitado por ahora (`canUseAudio === false`): el WebView no expone Web Speech y el reconocedor nativo de Google corta por silencio y hace un beep por inicio.
- **Historial** (FR-IA-009): la conversación **no se pierde** al cerrar el panel; vive en `AssistantChatProvider` y se persiste en `localStorage` (`atlassfin.assistant.threads.v1`). El header del chat tiene **Nueva conversación** (empieza en blanco) y **Historial** (un `Sheet` con las conversaciones anteriores para retomar o eliminar). En modo live el backend además persiste en `ai_conversations` (`GET/DELETE /assistant/conversations`).
- **Límites**: si llega `done` con `insufficient: true`, mostrar el mensaje sin fallar (FR-IA-011); si llega `error`, mostrar aviso genérico y permitir reintento.
- **Seguridad de prompts**: el front **nunca** concatena datos del usuario con instrucciones de sistema; envía solo la pregunta y el período (FR-IA-010).
- **Modo mock**: con `NEXT_PUBLIC_USE_MOCKS` (default) el asistente responde desde `lib/mocks`, simulando el stream por palabras y sin llamar a DeepSeek; sirve para desarrollo sin API.
- **Modo en vivo (`NEXT_PUBLIC_ASSISTANT_LIVE=true`)**: aunque el resto siga mockeado, el asistente hace el `POST /assistant/messages` real contra `NEXT_PUBLIC_API_URL` y responde con DeepSeek. La ruta del API es pública-condicionada a desarrollo (usa el usuario demo); en producción requiere sesión.

```ts
// lib/api/assistant-stream.ts — parser SSE basado en fetch (soporta cookie y Bearer)
export type AssistantEvent =
  | { type: "meta"; data: AssistantStreamMeta }
  | { type: "token"; data: { delta: string } }
  | { type: "action"; data: AssistantAction }
  | { type: "done"; data: { conversationId: string; insufficient: boolean } }
  | { type: "error"; data: { code: string; message: string } };

export async function* postAssistantStream(
  body: { question: string; conversationId: string | null; period?: { from: string; to: string }; currency?: string },
  signal?: AbortSignal,
): AsyncGenerator<AssistantEvent> {
  const res = await apiFetch("/assistant/messages", { method: "POST", body, signal, stream: true });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) yield parseSseBlock(block);
  }
}
```

---

## 11. Formato de monedas, fechas y localización

```ts
// lib/format.ts
const DEFAULT_LOCALE = "es-AR";

export const formatCurrency = (value: number, currency: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

export const formatDate = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));

export const formatPercent = (v: number, locale: string = DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(v);
```

- `es-AR` como locale por defecto (no `navigator.language`, para que el export estático no dependa del cliente).
- Moneda base del usuario desde `GET /auth/me` y cacheada en `UserPreferencesProvider`.
- `date-fns` para cálculos de rangos del `DatePicker`; formateo siempre con `Intl`.

---

## 12. Requerimientos no funcionales del front

| NFR | Implementación en front |
| :--- | :--- |
| NFR-UA-001 (responsive ≥360px) | Mobile-first; en móvil la navegación es una barra inferior estilo app (con pestaña de Ajustes) y las tablas usan scroll horizontal o `Card` por fila. |
| NFR-UA-002 (teclado) | Radix/shadcn aseguran foco; no remover estilos de focus. |
| NFR-UA-003 (labels/ayudas/errores) | `FormField` de shadcn con `Label`, `FormMessage`, `FormDescription`. |
| NFR-UA-004 (gráficos accesibles) | `aria-label` + tabla alternativa (§6.4). |
| NFR-UA-005 (no solo color) | Estados con icono + texto + color (§6.3). |
| NFR-PR-001 (<3s) | `Skeleton`, prefetch en hover de links, queries en paralelo. |
| NFR-PR-002 (paginación) | `DataList` con paginación server-side. |
| NFR-PR-003 (cotizaciones) | Mostrar `isStale` y la fecha real del último precio sin ocultar datos. |
| NFR-PR-004 (IA cancel/timeout) | `AbortController` en el stream + botón cancelar. |
| NFR-CAL-002 (temas) | Tokens light/dark sin pérdida de contraste. |
| NFR-CAL-003 (localización) | `Intl` + `date-fns` (§11). |
| NFR-CAL-005 (datos demo) | Consumir el seed del backend; ningún dato real. |

---

## 13. Convenciones de código

- **Componentes**: siempre **funciones flecha** (`const Foo = () => {}`), nunca `function`; archivos `kebab-case.tsx`. Un componente por archivo (salvo variantes pequeñas). Excepción: `components/ui/**` generado por shadcn.
- **Client/Server**: las páginas de `(app)` son componentes cliente; no usar Server Components, Server Actions, Route Handlers ni APIs server-only (cookies/headers) para que el build sea estático y portable a Capacitor.
- **Tipado**: `strict`; usar `interface` para DTOs y `type` para uniones; evitar `any`.
- **Imports**: path alias `@/`; orden: externos, internos (`@/lib`, `@/components`), relativos.
- **Estilos**: Tailwind + `cn()`; evitar CSS inline.
- **Formato**: Prettier (`.prettierrc.json`); `npm run format` escribe y `npm run format:check` corre en el hook **pre-push**.
- **Consultas**: nunca llamar a la API directamente desde componentes; siempre a través de hooks en `lib/query/`.
- **Validación**: todo formulario usa un schema Zod; mostrar errores del backend mapeados a campos cuando corresponda.
- **Sin `console.log`** en producción; usar `sonner` (toast) para feedback de usuario.
- **Sin comentarios innecesarios**; el código debe autoexplicarse.

---

## 14. Empaquetado móvil con Capacitor

El mismo código web se empaqueta en apps iOS/Android con Capacitor. No hay fork de UI: se reutiliza 100% de `app/`, `components/`, `lib/`.

### 14.1 Configuración de build estático

```ts
// next.config.ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};
export default nextConfig;
```

```bash
npm i @capacitor/core @capacitor/android && npm i -D @capacitor/cli
# capacitor.config.ts → appId com.atlassfin.app, appName "Atlass Fin", webDir "out"
npx cap add android                 # iOS pendiente: npx cap add ios
npm run build && npx cap sync android
npm run android                     # build web + sync + instala/lanza (scripts/android.sh)
```

> Requisitos Android: **Node 22+** (lo exige Capacitor 8), **JDK 21** (`.sdkmanrc`) y Android SDK. El helper `scripts/android.sh` los configura y ofrece `--list`, build de APK y `--run` (emulador/dispositivo).

- `webDir` apunta a `out/` (salida del `output: "export"`).
- `capacitor.config.ts` define `appId`, `appName`, `webDir` y `server` (URL para live-reload en desarrollo).

### 14.2 URL de la API y CORS

- **Web dev**: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`.
- **Nativo**: la API debe ser alcanzable por el dispositivo (URL HTTPS pública, p. ej. `https://api.example.com/api`); `localhost` no sirve. El valor se fija por build/entorno.
- El backend debe habilitar CORS para el origen nativo (`capacitor://localhost` en iOS, `http://localhost` en Android) o, mejor, no exigir cookies y validar por `Authorization: Bearer`.

### 14.3 Autenticación en nativo

- Las cookies `HttpOnly` no son confiables en el webview; se usa el flujo Bearer (ver §8 y §7.2).
- `session.ts` guarda el access token en keychain (`capacitor-secure-storage-plugin`) y el refresh token en `@capacitor/preferences`.
- El `AuthGuard` y el interceptor de `401`/refresh son idénticos a web; solo cambia la fuente del token.

### 14.4 Plugins de plataforma

| Necesidad | Plugin |
| :--- | :--- |
| Almacenamiento seguro de tokens | `capacitor-secure-storage-plugin` |
| Refresh token persistente | `@capacitor/preferences` |
| Exportar CSV en móvil | `@capacitor/filesystem` + `@capacitor/share` |
| Barra de estado / navigation bar | Plugin nativo propio `NativeBars` (status + navigation) + safe-areas CSS `env(safe-area-inset-*)` |
| Backend local en dev | `server.url` en `capacitor.config.ts` |

### 14.5 Consideraciones

- **SSE del asistente** funciona en el webview; asegurar CORS del endpoint y timeout/cancel en el cliente (NFR-PR-004).
- **Descargas**: en web el CSV se baja como blob; en nativo se escribe con `Filesystem` y se comparte con `Share`.
- **Safe areas / notch**: aplicar `env(safe-area-inset-top/bottom)` en el layout móvil.
- **Barras del sistema**: `components/layout/native-system-bars` (montado en el layout raíz) llama `useNativeSystemBars(resolvedTheme === "dark")`; en nativo invoca el plugin `NativeBars` (`lib/native/system-bars.ts`) que pinta la **status bar** (blanco/negro) y la **navigation bar** (transparente) con íconos claros/oscuros según el tema. Android: `NativeBarsPlugin.java` + registro en `MainActivity.java` + `android:windowOptOutEdgeToEdgeEnforcement` en `styles.xml`. (En web es no-op.)
- **Sin APIs server-only**: no usar `cookies()`, `headers()`, Server Actions ni Route Handlers en el flujo de datos (ya excluidos por convención, §13).

---

## 15. Plan de trabajo por tandas

Progresivo y validable al final de cada tanda. Cada tanda deja la app compilando (`npm run lint && npm run build`) y consumiendo endpoints ya existentes en el backend (ver plan equivalente en `backend.md`).

**Estado**: el cliente está implementado punta a punta sobre el **mock** (§16). Tandas 0–7 **hechas**; Tanda 8 **parcial**; Tanda 9 Android hecho, iOS pendiente.

### Tanda 0 — Setup del proyecto — ✅ Hecho
- Crear Next.js + TS + Tailwind, inicializar shadcn, instalar deps.
- `next.config.ts` con `output: "export"` e `images: { unoptimized: true }`.
- `Providers` (Query, Theme, Auth), `globals.css`, `layout` root y `auth-guard.tsx`.
- **Aceptación**: app corre, tema funciona, build estático (`npm run build`) genera `out/`, estructura de carpetas creada.

### Tanda 1 — Shell de app + Autenticación — ✅ Hecho
- Sidebar (desktop) + `mobile-tab-bar.tsx` (barra inferior flotante móvil), `(auth)` y `(app)` layouts, `auth-guard.tsx`.
- Páginas login/register/forgot-password con RHF+Zod, `AuthProvider`, `use-auth`.
- `lib/api/client.ts`, `session.ts` (cookie + bearer), `types.ts` y `reference.ts` (`GET /currencies`); `users.ts` (`PATCH /users/me`).
- **Aceptación**: registro/login/logout + edición de preferencias funcionales; rutas protegidas; navegación desktop/móvil correcta.

### Tanda 2 — Cuentas y Movimientos — ✅ Hecho
- **Cuentas** viven en `/dashboard` (`AccountsSection` → `AccountsList`), con detalle en `/accounts/detail`. Las **Metas** tienen su propio bloque (`GoalsList`), hook (`useGoals`) y detalle (`/goals/detail`, §4.7): **entidad separada** (`goals`), no una cuenta.
- Movimientos con búsqueda, paginación, transferencia (colapsada a una fila) y CRUD en `/transactions`.
- `Amount`, `CategoryBadge`, `StatusBadge`, `DataList` / `DataListItem`.
- **Aceptación**: HU-001 y HU-002 completas.

### Tanda 3 — Dashboard + gráficos — ✅ Hecho
- Inicio "Tu resumen": `NetWorthHero`, Cuentas, Metas y Patrimonio; tablero de widgets/gráficos en `/reports` con `HighlightsCard`.
- `EmptyState`, `PeriodSelector`, `StatTiles`.
- **Aceptación**: FR-DAS-001..008.

### Tanda 4 — Presupuestos — ✅ Hecho
- Listado por período con `BudgetProgress` (colores por estado, "Excedido por $X"), resumen mensual, orden por gravedad, copiar mes y CRUD.
- Renovación automática (`recurring`) con proyección mensual y página de detalle (ritmo del mes + movimientos de la categoría).
- **Aceptación**: HU-003 (FR-PRE-001..006).

### Tanda 5 — Activos, inversiones y deudas — ✅ Hecho
- Sección **Patrimonio** en `/dashboard` (Activos / Inversiones financieras / Deudas), historial de valuaciones (`ValuationSheet`) y reporte en `/reports/investments`.
- **Páginas de detalle** por elemento: `/patrimony/assets/detail`, `/patrimony/investments/detail` y `/patrimony/debts/detail` (evolución, equity activo↔deuda, campos derivados de mercado).
- **Aceptación**: HU-004, HU-005 (FR-ACT-001..008, FR-MER-005).

### Tanda 6 — Objetivos y Reportes — ✅ Hecho
- **Separación Metas/Cuentas**: los objetivos son un **módulo propio** (`goals`, `backend.md` §5.12/§7.8), con **bloque Metas** aparte de **Cuentas**, ruta propia `/goals/detail`, hooks `lib/query/goals.ts` y `progressPct`/`status` calculados por el backend (CAL-007). No suman al patrimonio neto.
- Reportes con widgets personalizables, `ReportsTabs` (General | Patrimonio) y filtros del período.
- **Aceptación**: FR-OBJ-001..004, FR-REP-001..006 (export CSV/PDF pendientes de contrato).

### Tanda 7 — Asistente IA + Configuración — ✅ Hecho (mock)
- Chat con streaming (`fetch` + `ReadableStream`, eventos SSE), cancelar, historial; configuración (perfil, moneda, tema, IA, privacidad) vía `PATCH /users/me`.
- **Aceptación**: HU-006 (FR-IA-001..011), FR-AUT-005/006.

### Tanda 8 — Pulido y NFRs — ◐ Parcial
- A11y, responsive 360px, estados vacíos, loading skeletons, dark mode completo.
- Refinar la barra inferior móvil: safe-areas, transiciones y estado activo accesible; pestaña de Ajustes completa.
- **Pendiente**: export CSV/PDF (contrato) y auditoría final de NFR-UA/PR/CAL del §12.
- **Aceptación**: cumplimiento de NFR-UA/PR/CAL del §12.

### Tanda 9 — Empaquetado móvil (Capacitor) — ◐ Parcial
- Android (hecho): `@capacitor/core`, `cli`, `android`, `capacitor.config.ts` y `cap add android`; helper `scripts/android.sh` (`npm run android`).
- iOS (pendiente): `@capacitor/ios` + `cap add ios`.
- `session.ts` nativo: keychain + preferences; verificar login/logout con Bearer.
- Plugins de plataforma: export CSV vía `Filesystem` + `Share`, `StatusBar`/safe-areas.
- **Aceptación**: la app corre en Android (y luego iOS) contra la API, con sesión persistente y export funcionando.

> **Nota**: las funcionalidades P2 (CSV import FR-TRX-009, recurrentes FR-TRX-010, PDF FR-REP-007) quedan fuera de la entrega inicial y se planifican aparte.

---

## 16. Modo mock del cliente y estado de implementación

Decisiones vigentes del cliente (para poder desarrollar sin API):

- **Backend mock en memoria**: `lib/mocks/` (`store.ts` + `api.ts`) implementa el contrato REST con datos derivados del seeder del API (6 meses de movimientos, varias categorías, activos, deudas, posiciones, presupuestos y metas). Los hooks de `lib/query/*` no cambian.
- **Switch**: `lib/api/endpoints.ts` decide en runtime. Con `NEXT_PUBLIC_USE_MOCKS !== "false"` (default) usa el mock; con `NEXT_PUBLIC_USE_MOCKS=false` usa `lib/api/client.ts` contra `NEXT_PUBLIC_API_URL`.
- **Sin cálculo en render**: el front no implementa fórmulas financieras (CAL-*); en modo mock las calcula el `mockApi`, igual que lo haría el backend.
- **Persistencia de UI en `localStorage`**: tema (next-themes), sesión mock, y **layout del dashboard** (`atlassfin.dashboard.layout.v7`).
- **Moneda**: la moneda de visualización es la **base** del usuario (`DisplayCurrencyProvider`), editada en `/settings`; ya no hay selector de moneda en el header.
- **Dashboard**: personalizable por widgets (drag & drop, ocultar, ancho por `maxSpan`); `netWorth` default 3/3; masonry medido con `ResizeObserver`. Ver §4.2.1.
- **Asistente**: widget flotante (no sidebar), streaming SSE, audio con `MediaRecorder` + Web Speech opcional. Ver §10.
- **DeepSeek**: el proveedor se conecta **desde el backend** (`api/`, `shared/ai/ai.service.ts`) con `AI_API_KEY` server-side; documentado en `backend.md` §7.16/§9.2/§12. Nunca se expone la key en el cliente.
- **Asistente en vivo con datos mockeados**: `NEXT_PUBLIC_ASSISTANT_LIVE=true` mantiene los mocks para todo el resto (login, cuentas, dashboard) pero manda **solo el asistente** al API real para usar DeepSeek. El API expone `POST /assistant/messages` como público-condicionado: en desarrollo, sin JWT usa el usuario demo (`AI_DEV_USER_EMAIL`, default `demo@atlassfin.app`); en producción exige sesión. Requiere correr migración + seed del API y `AI_API_KEY`.
- **Modales responsivos**: los formularios usan `ResponsiveDialogContent` (`components/common/responsive-dialog`): `Dialog` centrado en desktop y **bottom sheet** en mobile (`< md`: `bottom-0`, ancho completo, esquinas superiores redondeadas, safe-area). Los `AlertDialog` de confirmación (`ConfirmDialog`) quedan centrados.
- **Sin toast de bienvenida**: el login no muestra carteles de bienvenida; redirige directo al dashboard. La navegación móvil tiene un pequeño margen inferior (`bottom-4`).

**Estado**: el API es hoy casi un esqueleto (auth/health/entidades + módulo `assistant`). Para correr el asistente real de punta a punta falta completar en `api/`: DB/migraciones/seed, login y los dominios de finanzas. Mientras tanto, el cliente opera 100% con mocks.
