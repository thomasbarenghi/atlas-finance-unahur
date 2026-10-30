# Atlass Fin — Documento Técnico del Frontend

> **Audiencia:** agentes de IA que implementarán el frontend.
> **Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · Outfit (títulos) + Nunito (cuerpo) · Recharts · TanStack Query · React Hook Form + Zod · lucide-react.
> **Backend:** consume una API REST NestJS (ver `backend.md`). La URL base se inyecta por variable de entorno.
> **Referencia funcional:** `../specification/0.3/FRD_Gestor_Financiero_v0.3.md`. Todo requisito citado (FR-*, HU-*, CAL-*, NFR-*) corresponde a ese documento.

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
14. [Plan de trabajo por tandas](#14-plan-de-trabajo-por-tandas)

---

## 1. Visión general y stack

**Atlass Fin** es una aplicación de gestión financiera personal: cuentas, movimientos (ingresos, gastos y transferencias), categorías del sistema y propias, y un dashboard con la evolución del patrimonio y del flujo de fondos. Sus dos distintivos propios son **analítica/gráficos ricos** y un **agente de IA conversacional de solo consulta** que responde sobre los datos financieros del usuario.

La aplicación opera con **multimoneda**: cada cuenta declara su moneda, el usuario elige una moneda principal y el dashboard permite leer todos los valores en otra moneda de visualización (selector en el header). Las cotizaciones las provee la API. Existen cinco categorías fijas del sistema y categorías propias que cada usuario puede gestionar. No hay presupuestos, activos, inversiones, deudas, objetivos, reportes ni entrada por voz. El tema claro/oscuro es una preferencia local del cliente.

| Área            | Tecnología                                                                  | Versión objetivo    |
| :-------------- | :-------------------------------------------------------------------------- | :------------------ |
| Framework       | Next.js (App Router)                                                        | 16.x                |
| Lenguaje        | TypeScript                                                                  | 5.x, `strict: true` |
| UI              | shadcn/ui + Tailwind CSS                                                    | Tailwind 4.x        |
| Tipografía      | Outfit (títulos) + Nunito (cuerpo)                                          | `next/font/google`  |
| Estilos         | CSS variables + `cn()`                                                      | —                   |
| Gráficos        | Recharts (base del componente `Chart` de shadcn)                            | 3.x                 |
| Estado servidor | TanStack Query                                                              | 5.x                 |
| Formularios     | React Hook Form + Zod                                                       | RHF 7.x, Zod 3.x    |
| Validación      | Zod (compartida conceptualmente con el back)                                | 3.x                 |
| Auth            | JWT: cookie `HttpOnly` (web)                                                | —                   |
| HTTP            | `fetch` nativo dentro de un cliente tipado                                  | —                   |
| Iconos          | lucide-react (los genera shadcn)                                            | —                   |
| Fechas          | `Intl.DateTimeFormat` + `Date` nativo (compatible con DatePicker de shadcn) | —                   |

**Principios rectores:**

1. **Cliente primero y exportable a estático**: el front es un cliente puro que consume la API REST; no depende de Server Components, Server Actions, Route Handlers ni `middleware.ts` para funcionar. Esto garantiza que el mismo build sea estático (`output: "export"`).
2. **Una sola fuente de verdad de tipos**: contratos de la API modelados en `lib/api/types.ts`.
3. **Lógica portable**: `lib/` (api, query, format, validation) no importa nada de `next/*`, para mantenerlo independiente del framework de UI.
4. **Accesibilidad primero**: shadcn + Radix ya aportan foco y teclado; se completa con resúmenes textuales de gráficos y estados no dependientes del color (NFR-UA-002/004/005).
5. **Estados vacíos accionables**: toda vista sin datos muestra una acción sugerida.

---

## 2. Decisiones técnicas

| Decisión      | Elección                                    | Justificación                                                            |
| :------------ | :------------------------------------------ | :----------------------------------------------------------------------- |
| Router        | App Router (`app/`)                         | Layouts anidados; con `output: "export"` se genera un sitio estático.    |
| Render        | Componentes cliente en `(app)`              | Evita dependencias de RSC; el build estático hidrata en cliente.         |
| Route groups  | `(auth)` y `(app)`                          | Separa pantallas públicas y protegidas sin alterar URLs.                 |
| Fetching      | TanStack Query en el cliente                | Caché, invalidación, retry, cancelación (clave para IA con timeout).     |
| Formularios   | RHF + Zod                                   | Validación declarativa, consistente con validación de servidor.          |
| Estado global | Mínimo; contextos puntuales (auth)          | Evita sobre-ingeniería; TanStack Query cubre el resto.                   |
| Gráficos      | Recharts vía `Chart` de shadcn              | Accesible, con tooltip personalizable y datos tabulados alternativos.    |
| IA            | Streaming SSE al backend                    | UI reactiva, cancelable, con timeout (NFR-PR-004).                       |
| Sesión        | Cookie `HttpOnly` (web)                     | El cliente no maneja tokens en JS; el backend valida en cada request.    |
| Moneda/fecha  | `Intl.NumberFormat` / `Intl.DateTimeFormat` | Localización real (NFR-CAL-003). Cada monto usa la moneda de su cuenta o la moneda de lectura elegida. |
| Tema          | `next-themes`                               | Preferencia local `Claro/Oscuro/Auto` con aplicación temprana de la clase `.dark`. |

---

## 3. Mapa del sitio

```
/ (redirect → /dashboard si hay sesión, si no → /login)
│
├── (auth)                    # sin sesión
│   ├── /login                # iniciar sesión (FR-AUT-002)
│   └── /register             # registro (FR-AUT-001)
│
└── (app)                     # requiere sesión; layout con sidebar
    ├── /dashboard            # inicio: indicadores y gráficos del período + cuentas (SC-002)
    ├── /accounts/detail      # detalle de una cuenta (SC-003); el listado vive en /dashboard
    ├── /transactions         # listado + alta/edición (SC-004)
    ├── /categories           # categorías del sistema + propias (SC-011)
    ├── /assistant            # chat con la IA, solo consulta (SC-009)
    ├── /profile              # hub de perfil: tarjeta, secciones y cierre de sesión (SC-010)
    └── /settings             # ajustes: perfil, credenciales, moneda y exportación (SC-010)
```

**Reglas de enrutamiento:**

- La protección de rutas vive en un **`AuthGuard` en cliente** (componente que envuelve el layout de `(app)`): si no hay sesión, redirige a `/login`. El backend valida la autorización en cada request, así que el guard es solo UX (NFR-SEG-001).
- `(app)` comparte un `layout.tsx` con la navegación (sidebar en desktop / barra inferior en móvil). Los providers de TanStack Query, sesión y período viven en el layout raíz (`AppProviders`), junto con `next-themes` para el tema.
- Toda página de `(app)` se renderiza tras una verificación de sesión; los datos se cargan en cliente vía Query.
- **Sin `middleware.ts`** (o solo como optimización opcional en web): en el build estático no existe, por lo que la barrera real es el guard en cliente + el backend.

**Navegación responsive (web + app):**

- **Desktop (≥ `md`)**: `Sidebar` lateral fija de 260 px con marca, navegación (`Inicio`, `Movimientos`, `Categorías`, `Asistente`, `Ajustes`), resumen de cuentas con acceso a crear una cuenta y el bloque de usuario al pie (abre el menú de cuenta: Perfil, Ajustes, Cerrar sesión). No hay header global.
- **Móvil (< `md`)**: barra inferior flotante con **4 ítems iguales**: `Inicio`, `Movimientos`, `Asistente` y `Perfil`, con ícono + label. El ítem activo usa una píldora verde suave; el estado no depende solo del color (NFR-UA-005).
- **`Perfil`** (ruta `/profile`) es el hub móvil: tarjeta de perfil, contadores de cuentas/movimientos/categorías, accesos a **Categorías** y **Ajustes**, y **Cerrar sesión**.
- **El Asistente es una página propia** (`/assistant`) en desktop y mobile, accesible desde la sidebar y desde la barra inferior. No hay FAB ni panel flotante. Ver §10.
- **Mobile**: no hay header global. Cada página muestra su propio `PageHeader`; en `/dashboard` el período y la acción principal viven en el header de la página.
- El ítem `Inicio` queda activo también en `/accounts/detail`.
- Safe-areas (`env(safe-area-inset-bottom)`) para el notch/gesto de home.

> **Tema:** preferencia local `Claro | Oscuro | Auto` en Ajustes (persistida en `localStorage`; aplica la clase `.dark`).
> **Selector de moneda de lectura:** el dashboard lo tiene en el header, antes del período; re-expresa el patrimonio, los KPIs y los gráficos sin alterar datos. Cada cuenta mantiene su moneda nativa.

---

## 4. Funcionalidades por página

Cada página lista: FRs cubiertos, componentes shadcn, y comportamiento esperado. El detalle de endpoints está en `backend.md`.

### 4.1 `/login`, `/register` — SC-001 (FR-AUT-001/002)

- **Login:** email + contraseña. El backend fija las cookies `HttpOnly` de access y refresh y responde con el usuario; el cliente no guarda tokens. On success → `router.push("/dashboard")` + `router.refresh()`.
- **Registro:** nombre, email, moneda principal, contraseña y confirmación. **Política:** 8–72 caracteres, al menos una letra y un número (debe coincidir con el backend). El selector de moneda usa el catálogo público `GET /currencies`. Tras registrarse, se loguea automáticamente (o queda pendiente de aprobación si el backend lo indica).
- **Componentes:** `Card`, `Form`, `Input`, `Button`, `Alert`, `Label`.
- **Errores:** mensajes genéricos del servidor, nunca detalles sensibles.
- **Demo:** en la pantalla de login se pueden precargar las credenciales del seed (`demo@atlassfin.app` / `Demo1234!`).

### 4.2 `/dashboard` — SC-002 (FR-DAS-001..004, 007, 008)

Vista de aterrizaje **"Tu resumen"**: un **layout fijo** de indicadores y gráficos + la sección de cuentas, con `Skeleton` mientras carga. El header incluye el **selector de moneda de lectura** antes del período (CH-77); re-expresa el patrimonio, los KPIs y los gráficos con la cotización de la API. Los indicadores incluyen todas las monedas convertidas a la moneda de lectura; el desglose por moneda del hero aparece solo cuando hay más de una moneda en uso.

- **Patrimonio neto** (ancho completo): `NetWorthHero` compacto (≈290 px) con valor, variación vs. período anterior (`TrendBadge`), mini-stats (Ingresos/Gastos/Ahorro/Tasa) en una fila de 4 (2×2 en mobile) y evolución diaria o mensual según el rango, con eje, escala adaptativa, tooltip y punto final. El patrimonio es Σ (saldo × cotización) de las cuentas (CAL-001), en la moneda de lectura; el desglose por moneda aparece cuando hay más de una moneda en uso. El selector de moneda de lectura del header re-expresa el hero, los KPIs y los gráficos.
- **Ingresos vs. gastos** (FR-DAS-003): barras semanales para `Este mes`/`Últimos 30 días` y mensuales para `6/12 meses`.
- **Gastos por categoría** (FR-DAS-004): donut con el color de cada categoría y leyenda alineada con monto + porcentaje. El título del donut no lleva tooltip; el % se explica desde Categorías.
- Los tres bloques se muestran en una grilla fija (patrimonio a ancho completo; barras 700 px y donut 378 px en desktop, apilados en mobile). **No hay personalización** de widgets (sin arrastrar y soltar, ocultar ni cambiar ancho) ni layout persistido.
- **Cuentas**: sección con `AccountsList` sobre `useAccounts` (ruta `/accounts/detail`). Las cuentas con saldo negativo muestran "Saldo negativo". Botón `+` (`AccountTypePicker` → `AccountFormDialog`) y las filas navegan al detalle (§4.3).
- **Filtro de período** (FR-DAS-007): `PeriodSelector` en el header de la página; el período es compartido con Movimientos y Asistente a través de `PeriodProvider`.
- **Acciones de header:** `PeriodSelector` + CTA `Nuevo movimiento` (desktop); en mobile no hay avatar: el chip de rango sube a la fila del título (a la derecha) y no hay subtítulo de período, porque el chip ya lo indica. La cuenta se gestiona desde la tab **Perfil**. En desktop el subtítulo indica solo el rango (`Octubre 2026 · del 1 al 26`), porque el panel consolida todas las cuentas.
- **Estados vacíos:** `EmptyState` reutilizable con acción sugerida.

### 4.3 Cuentas — SC-003 (FR-CUE-001..005)

El **listado de cuentas vive en el inicio** (`/dashboard`, §4.2). Las cuentas se muestran con `AccountsList`, agrupadas por moneda cuando hay más de una, con `ListSkeleton` y `EmptyState`. La **creación** arranca con un **selector de tipo en grilla** (`AccountTypePicker`: Efectivo, Bancaria, Billetera y Otra); al elegir un tipo se abre el `AccountFormDialog` con ese tipo precargado (nombre, tipo, moneda, saldo inicial, observaciones; FR-CUE-001/002).

El **formulario** (`AccountFormDialog`) es un editor visual: hero con ícono del tipo y **nombre editables**, chips de **tipo** (scroll horizontal), **selector de moneda** (dropdown anclado en desktop, bottom sheet en mobile) y campos de saldo inicial y observaciones. La moneda no se puede cambiar si la cuenta ya tiene movimientos (FR-CUE-002). No hay tipo tarjeta.

#### 4.3.1 `/accounts/detail?id=<id>` — Detalle de cuenta (FR-CUE-007)

- **Encabezado** (`PageHeader` sin breadcrumb en desktop; back nativo en mobile): nombre con H1 compacto. En desktop las acciones son `Editar` y `Eliminar`; en mobile `Editar` + menú `⋯` con `Eliminar cuenta`.
- **Hero**: ícono por tipo, tipo de cuenta (y moneda cuando hay más de una) y saldo actual grande, en una tarjeta compacta con el mismo gradiente del dashboard. Si la cuenta es en moneda extranjera, muestra el equivalente en la moneda principal y la cotización usada.
- **Stats**: saldo inicial, ingresos y gastos del período (`usePeriod`) en tres tarjetas en fila (también en mobile), en la moneda de la cuenta.
- **Movimientos**: tarjeta `TransactionList` con header `Movimientos (n)` + `Ver todos`; las filas permiten editar o eliminar el movimiento. El subtítulo de cada fila omite la cuenta actual (`fecha · categoría`; en transferencias `fecha · a/de cuenta destino`). `Transferir` abre el alta de transferencia con la cuenta de origen precargada.
- **Editar** reutiliza `AccountFormDialog`; **eliminar** usa el `ConfirmActionDialog` (bottom sheet en mobile, modal en desktop) con el detalle de la cuenta, la cantidad de movimientos y la advertencia de saldo antes de borrar (FR-CUE-003/005).
- La ruta usa `?id=` en vez de `/accounts/:id` para ser compatible con el **static export** de Next; el id se lee con `useQueryParam`.

### 4.4 `/transactions` — SC-004 (FR-TRX-001..004, 007, 011, 012)

- **Lista de items** (`TransactionList`) agrupada por mes con subtotal neto y ⓘ que explica su fórmula, paginación client-side (NFR-PR-002) y menú por fila (editar/eliminar) desplegado desde el botón de acciones, también en mobile: ícono por tipo, descripción, `fecha · categoría · cuenta` y monto (color por signo); en mobile los montos de fila se muestran sin centavos. Cada fila abre la edición. **Las transferencias se colapsan en una sola fila** (`collapseTransfers` por `transferGroupId`, conservando la pata origen): subtítulo `fecha · Cuenta origen → destino` y monto **neutro** (sin verde/rojo); no afectan ingresos, gastos, ahorro ni patrimonio (CAL-003). Historial paginado y agrupado por mes (FR-TRX-012).
- **Búsqueda y filtros:** buscador por concepto, nota, categoría o monto, segmentado de tipo (`Todos/Ingresos/Gastos/Transferencias`) y filtros de cuenta, categoría, moneda y período. En mobile el buscador ocupa todo el ancho, no hay botón de filtros y los chips quedan siempre visibles; el chip de fecha muestra el mes activo. Los filtros se aplican en cliente sobre la página cargada (máx. 100 registros) y `Limpiar` los restablece. El filtro de moneda aparece solo cuando hay más de una moneda en uso.
- **Exportar:** botón `Exportar` que descarga un CSV de los movimientos filtrados (fecha, tipo, descripción, categoría, cuenta, moneda, monto y notas; FR-TRX-011).
- **CTA de alta**: `Exportar` + `Nuevo movimiento` en el `PageHeader` (desktop) y botón `+` en mobile; botón `Nuevo movimiento` en el estado vacío.
- **Alta/edición** como editor moderno estilo app (`Dialog` desktop / bottom sheet mobile, FR-TRX-001/002/003): **segmented de tipo** (Gasto/Ingreso/Transferencia), campos con label persistente de cuenta y categoría (categoría obligatoria en ingreso/gasto, del **catálogo del sistema + propias**), **teclado numérico** (`AmountKeypad`) con operaciones `+ − × ÷`, **cálculo en vivo** (sin botón `=`), monto grande con signo por tipo y saldo disponible (oculto en transferencias), fecha + comentario y notas. El monto se evalúa con un evaluador propio (sin `eval`) en `transaction-form-dialog/amount-expression.ts` y se valida `> 0`. Si es transferencia, selector origen/destino que excluye la otra cuenta elegida; cuando las monedas difieren, se muestra la cotización editable (sugerida por la API o la última usada) y el monto que llega a destino. La cotización no se persiste (FR-TRX-002/004).
- **Eliminar** con `DeleteTransactionDialog` sobre `ConfirmActionDialog`; en una transferencia elimina ambas patas y el texto de confirmación lo advierte.

### 4.5 `/categories` — SC-011 (FR-CAT-001..004, FR-TRX-002)

- Página **`/categories`**, accesible desde la sidebar (desktop) y desde **Perfil** (mobile). Tiene un **selector de período visible** (desktop y mobile), un **selector de moneda de visualización** cuando hay más de una moneda y las **tabs** para elegir **Gastos** o **Ingresos**. Lista las cinco categorías del sistema más las propias del usuario.
- Cada fila muestra **ícono con el color de la categoría**, nombre, badge `Del sistema`/`Propia`, cantidad de movimientos, **monto y porcentaje del gasto/ingreso del período** y una barra de proporción. Los montos incluyen movimientos de todas las monedas convertidos a la moneda de visualización. El header de la tarjeta muestra el total del período; la lista se ordena por uso.
- **Alta/edición** (`CategoryFormDialog`): acción `Nueva categoría` en el header para crear y menú por fila para las propias. Campos: nombre, tipo (inmutable al editar) y color de una paleta. Las categorías del sistema (`isSystem`) no muestran acciones.
- **Eliminar** una categoría propia pide confirmación; los movimientos que la usaban quedan como “Sin categoría”.
- **Estados vacíos y error:** `EmptyState` con reintento si fallan las consultas.

### 4.6 `/assistant` — SC-009 (FR-IA-002/015/016)

Ver §10. Página propia en desktop y mobile: **`PageHeader`** con `Nuevo chat`, columna de chat centrada (máx. 780 px), **`ScrollArea`** para los mensajes, selector de período como único contexto, composer fijo al pie con envío/cancelación. Estado vacío con título y sugerencias (2×2 en desktop, 3 en mobile). **El asistente es de solo consulta**: no propone ni ejecuta escrituras, no guarda historial en el servidor (la conversación vive en memoria del cliente) y no tiene entrada por voz.

### 4.7 `/profile` — SC-010 (perfil) y `/settings` (ajustes; FR-CFG-001/003/004)

- **`/profile`** (`ProfileMenu`): tarjeta de perfil (avatar con iniciales, nombre, email), contadores de cuentas/movimientos/categorías, accesos a **Categorías** y **Ajustes**, y **Cerrar sesión**. Es el ítem `Perfil` de la barra inferior.
- **`/settings`** (`SettingsView`): editar el **nombre** y el **correo** del perfil (`PATCH /users/me`), cambiar la **contraseña** (`PATCH /users/me/password`, con contraseña actual), **Tema** (`Claro/Oscuro/Auto`), **Exportar movimientos (CSV)** y la **moneda principal** (`PATCH /users/me`, visible cuando hay cuentas en más de una moneda; FR-CFG-004). `Guardar cambios` vive en el header y se habilita al modificar nombre o correo; el cambio de contraseña tiene su propio botón. En mobile se muestran los mismos formularios dentro de Ajustes. No hay recuperación de contraseña ni interruptor de IA ni edición de cotizaciones.
- **Sesión:** cerrar sesión (`POST /auth/logout`, FR-AUT-002).

---

## 5. Estructura de archivos

```
client/
├── app/
│   ├── layout.tsx                 # root: html/body, AppProviders
│   ├── favicon.ico / icon.png / apple-icon.png  # marca C
│   ├── globals.css                # CSS vars de shadcn + tailwind
│   ├── page.tsx                   # redirect según sesión
│   ├── (auth)/
│   │   ├── layout.tsx             # centrado, branding
│   │   ├── _components/auth-heading/       # compartido por login/register
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── _components/login-form/
│   │   └── register/
│   │       ├── page.tsx
│   │       └── _components/register-form/
│   └── (app)/
│       ├── layout.tsx             # Sidebar + MobileTabBar + AuthGuard
│       ├── _components/           # compartidos entre rutas de (app)
│       │   ├── accounts/          # account-creation, account-form-dialog, account-type-picker, accounts-list, account-icon
│       │   ├── transactions/      # transaction-form-dialog (+ hooks), transaction-list, delete-transaction-dialog, transaction-lookups
│       │   └── assistant/         # assistant-chat (+ components/hooks, markdown-text)
│       ├── dashboard/
│       │   ├── page.tsx
│       │   └── _components/       # dashboard-view (+ dashboard-skeleton/header-actions/period-summary), net-worth-hero, charts/
│       ├── accounts/detail/
│       │   ├── page.tsx
│       │   └── _components/account-detail-view/
│       ├── transactions/
│       │   ├── page.tsx
│       │   └── _components/transactions-view/
│       ├── categories/
│       │   ├── page.tsx
│       │   └── _components/       # categories-view, category-form-dialog
│       ├── assistant/page.tsx
│       ├── profile/
│       │   ├── page.tsx
│       │   └── _components/profile-menu/
│       └── settings/
│           ├── page.tsx
│           └── _components/settings-view/
├── components/
│   ├── ui/                        # generado por shadcn (NO editar a mano salvo variantes)
│   ├── common/                    # genéricos domain-agnostic (folder + index.tsx)
│   │   ├── amount/  chart-data-table/  date-picker/  empty-state/
│   │   ├── list-pagination/  list-skeleton/  menu-row/
│   │   ├── page-header/  page-loader/  metric-info/
│   │   ├── row-actions-menu/  menu-row/  segmented-control/  period-selector/
│   │   ├── responsive-action-button/  confirm-action-dialog/
│   │   ├── dialog-shell/  bottom-sheet-handle/
│   │   ├── form-shell/  form-dialog/  form-text-field/  form-money-field/
│   │   └── ui-classes.ts           # recetas Tailwind compartidas para primitivas shadcn
│   └── layout/                    # shell de (app)
│       ├── app-nav.ts             # registro de navegación (desktop y móvil)
│       ├── sidebar/index.tsx
│       ├── mobile-tab-bar/index.tsx
│       ├── user-menu/index.tsx
│       ├── user-avatar/index.tsx
│       ├── user-identity/index.tsx
│       ├── auth-guard/index.tsx
│       ├── brand/index.tsx
│       └── section-icons.ts
├── lib/
│   ├── utils.ts                   # cn()
│   ├── format.ts                  # CURRENCY (fallback), formatCurrency, fechas, parseo de montos
│   ├── currency.ts                # catálogo, conversión, tasas y agrupación por moneda
│   ├── period.ts / labels.ts / categories.ts
│   ├── sections.ts / forms.ts
│   ├── api/                       # client, types, endpoints, errors, assistant-stream
│   ├── query/                     # hooks de TanStack Query por dominio (+ keys.ts, incluye currencies)
│   ├── validation/                # schemas Zod por formulario
├── hooks/                         # hooks compartidos (auth, período, confirm, …)
├── providers/                     # app-providers, auth, query, período (tema vía next-themes)
├── next.config.ts                  # output: "export", images: unoptimized
├── components.json                # config de shadcn (preset radix-maia)
├── tsconfig.json
├── package.json
└── .env.example                    # NEXT_PUBLIC_API_URL, etc. (no versionar)
```

**Notas:**

- Los componentes de `components/ui/` se instalan con el CLI de shadcn y se extienden con variantes solo si es necesario.
- Cada componente propio vive en su carpeta con `index.tsx`. Los tipos de props pueden declararse en `index.tsx` cuando son de uso único; `*.types.ts` queda para tipos compartidos o no triviales.
- Los componentes de **una sola ruta** viven en `app/<ruta>/_components/`; los compartidos por varias rutas de un grupo, en `app/(grupo)/_components/<dominio>/`. Esas carpetas son privadas de Next (no generan rutas) y sus archivos no se importan desde fuera de la ruta/grupo dueño.
- `components/common/` agrupa solo genéricos con **≥ 2 consumidores** reales (`Amount`, `EmptyState`, `PageHeader`, `ListSkeleton`, `ListPagination`, formularios compartidos…). `components/layout/` es el shell de `(app)` (sidebar, tab bar, user menu, auth guard).
- Las clases repetidas sobre primitivas de `components/ui/` viven en `components/common/ui-classes.ts` (TypeScript, para que `cn`/tailwind-merge resuelvan overrides). Los patrones de markup sin overrides se centralizan en `app/globals.css` (`surface-card`, `surface-list`, `segmented`, `list-row`, …).
- Cada dominio de datos tiene su archivo de hooks en `lib/query/`, que encapsula las `queryKey`s y las mutaciones con su invalidación. Las claves están centralizadas en `lib/query/keys.ts`; `currencies.ts` expone catálogo y cotizaciones.
- La lógica transversal vive en hooks compartidos: `use-confirm-action` (confirmar + mutar + toast), `use-period`, etc.
- Los schemas Zod viven en `lib/validation/` y reflejan los DTOs de `lib/api/types.ts`.
- `next.config.ts` usa `output: "export"` e `images: { unoptimized: true }` para generar el sitio estático.
- No existe `middleware.ts`: el guard de sesión es `auth-guard.tsx` en cliente. La seguridad real la impone el backend.

> **Eliminados:** `lib/budget.ts`, `lib/goal.ts`, `lib/patrimony.ts`, `lib/query/{budgets,assets,debts,goals,positions,quotes,reference,assistant}.ts`, `lib/validation/{budgets,assets,goals,categories}.ts`, las páginas `budgets`, `goals`, `patrimony/**`, `reports/**`, `forgot-password` y `reset-password`, y los componentes `theme-toggle`, `period-currency-filters`, `allocation-list`, `status-badge`, `warning-badge`, `signed-money`, `budget-progress`, `archived-sheet` y `coming-soon`.

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

### 6.2 Estilos

- Se conservan las CSS variables en `globals.css` (`--background`, `--foreground`, `--primary`, etc.).
- **Favicon:** `app/favicon.ico` multiescala (16/32/48/64/128/256), `app/icon.png` maestro 1024 y `app/apple-icon.png` 180. Isotipo de la propuesta C: “a” blanca sobre `#165C36`, esquinas redondeadas.
- **Regla**: nunca usar colores hardcodeados; siempre `bg-background`, `text-foreground`, `border-border`, `bg-muted`, etc., o tokens `primary/destructive/income/expense`.
- Tokens propios: `--income`, `--expense`, `--net`, `--data-1..5`, `--primary-soft` (vía `accent`) y `--primary-solid` (botones sólidos en modo oscuro).

### 6.3 Componentes financieros reutilizables

- **`Amount`**: formatea monto con signo y color (`income` positivo, `expense` gasto, `muted` transferencia). Respeta NFR-UA-005 (signo + color, no solo color). Las transferencias sin signo usan `formatCurrency` directamente.
- **`NetWorthHero`**: hero de patrimonio neto con variación, mini-stats del período (opcionales vía `showPeriodStats`) y evolución diaria con eje de fechas, escala adaptativa, tooltip y punto final. `TrendBadge` es un subcomponente privado suyo.
- **`PeriodSelector`**: control compartido por Dashboard, Movimientos, Categorías y Asistente, con cuatro rangos: `Este mes`, `Últimos 30 días`, `6 meses` y `12 meses`. El Dashboard y Categorías tienen además un selector de moneda de lectura; Movimientos mantiene un filtro por moneda.
- **`MetricInfo`**: icono ⓘ y popover accesible con la fórmula y un ejemplo del período; se usa en las métricas del dashboard, categorías, cuentas y movimientos.
- **`EmptyState`**: ícono, título, descripción, acción CTA; base de los estados vacíos y de error.
- **Listas de dominio** (`AccountsList`, `TransactionList`, `CategoryList`): cada una compone `ListSkeleton`, `EmptyState` y `ListPagination`; **no hay tablas** (`DataTable` eliminado).
- **`ListPagination`**: paginación client-side sobre los movimientos cargados (máx. 100); `ListSkeleton` cubre el estado de carga.
- **`RowActionsMenu`**: menú de acciones por fila (`Editar`/`Eliminar`…) con trigger y `aria-label` consistentes.
- **`ConfirmActionDialog`**: confirmación del patrón _confirmar → mutar → toast_ (`useConfirmAction`), con ícono, título, descripción y acciones; bottom sheet con handle en mobile y modal compacto en desktop. Se usa para eliminar cuentas, movimientos y categorías.
- **`DialogShell` / `BottomSheetHandle`**: primitivas compartidas para diálogos y bottom sheets responsive.
- **`ChartDataTable`**: tabla `sr-only` equivalente a cada gráfico (NFR-UA-004), compartida por todos los charts.
- **`PageLoader`**: estado de carga a pantalla completa usado por el redirect raíz y el `AuthGuard`.
- **`PageHeader`**: título, subtítulo opcional, acciones, breadcrumb opcional (`eyebrow`) y `titleAddon`; `BackButton` privado solo mobile en rutas no raíz.
- **`DatePicker`**: selector de fecha reutilizable en formularios.
- **Formularios compartidos** (`FormShell`, `FormDialog`, `FormTextField`, `FormMoneyField`): eliminan el scaffold de RHF y los campos repetidos en todos los formularios.

Los detalles de una sola pantalla viven como subcomponentes privados dentro de su feature: `DetailPage`/`DetailMetric` en `account-detail-view`, `FormHero` en `account-form-dialog`, `AmountKeypad` en `transaction-form-dialog`, `WidgetCard`/`AccountsSection` en `dashboard-view`.

### 6.4 Chart (Recharts)

- El componente `chart` de shadcn provee `ChartContainer`, `ChartTooltip`, `ChartLegend` y configuración de colores vía CSS vars.
- **Accesibilidad (NFR-UA-004)**: cada gráfico va acompañado de un `aria-label` y, en la misma página o en una pestaña, una `Table` con los mismos datos.
- Los datos de gráficos se adaptan con `useMemo` a la estructura que Recharts espera.

### 6.5 Métricas explicadas

- `MetricInfo` agrega un icono ⓘ junto al **nombre** de cada indicador (nunca sobre el número): 10 px en desktop, 9 px en mobile y gris `#8A94A3`; al abrirse pasa a `primary`.
- El popover muestra **solo la fórmula y un ejemplo con los números del período**. No incluye códigos internos (`CAL-*` / `RN-*`). Superficie del tema con borde y sombra suave.
- Desktop: abre a los 120 ms del hover y se cierra al salir del icono o del popover. Mobile: tap y cualquier toque fuera (u scroll) lo cierra. Solo hay un tooltip abierto a la vez.
- Se posiciona arriba o abajo según el espacio y nunca tapa el valor que explica. Tiene foco por teclado, cierra con Esc y expone el texto completo por `aria-describedby`.
- Cobertura: Patrimonio neto, Ahorro y Tasa de ahorro (Inicio); % por categoría (Categorías desktop); Saldo inicial, Ingresos y Gastos (stats de Cuenta); Neto del mes (Movimientos). Ingresos/Gastos no llevan ⓘ en Inicio; el detalle queda en Cuenta.

### 6.6 Modo oscuro

- Fondo `#08090B`; superficies `#111318`; secundario/skeleton `#1B1E24`; bordes `#24272C`; texto `#F4F5F7`; secundario `#9CA3AF`.
- Marca: texto/acentos `#6DBE8B`; **botones sólidos** `#2E7D50` con texto blanco. El verde claro no se usa como fondo de bloques grandes.
- Sidebar `#0D0F12` (más oscura que el fondo); overlays con scrim negro al 60 %, superficie `#111318` y borde `#24272C`, sin sombras grandes.
- Estados vacíos sobre `#1B1E24`, nunca blanco. Series de gráficos claras; el donut conserva la paleta categórica.

**Fuentes únicas de verdad transversales:**

- `lib/sections.ts`: registro de secciones (`href` + `label`) consumido por sidebar, tab bar y perfil; los íconos viven en `components/layout/section-icons.ts`.
- `lib/period.ts`: presets y resolución de rangos compartidos por Dashboard, Movimientos, Categorías y Asistente.
- `lib/forms.ts`: mapeo de `fieldErrors` del backend a campos de RHF.
- `lib/query/keys.ts`: claves de TanStack Query y bases de invalidación (`transactionsBase`, `accountsBase`, `dashboardBase`).

---

## 7. Capa de datos y API client

### 7.1 Cliente HTTP (`lib/api/client.ts`)

- `fetch` nativo con `credentials: "include"` para la cookie de sesión.
- Base URL desde `process.env.NEXT_PUBLIC_API_URL` (p. ej. `http://localhost:3001/api` en dev; URL pública HTTPS en producción).
- Normaliza errores a `ApiError { statusCode, code, message, fieldErrors? }` (catálogo en `backend.md` §7.13).
- Expone `get<T>`, `post<T>`, `patch<T>`, `del<T>` tipadas y un helper `apiFetch` de bajo nivel (usado por el parser SSE de §10).
- **Sesión por cookie.** El cliente usa la cookie `HttpOnly` (`credentials: "include"`, sin tokens en JS); ante un `401` (fuera de `/auth/login` y `/auth/register`) hace `POST /auth/refresh` (cookie) y reintenta una vez. Si el refresh falla, el `AuthGuard` redirige a `/login`.

### 7.2 Pruebas de red

Los tests de componentes/integración usan **MSW** (`lib/test/server.ts`) como frontera de red y un estado de prueba en `lib/test/api-state.ts`. La aplicación no incluye un backend mockeado: siempre consume el API real configurado en `NEXT_PUBLIC_API_URL`.

### 7.3 Tipos (`lib/api/types.ts`)

Reflejan el contrato del backend (fuente de verdad: `backend.md` §7.9–§7.13). **JSON en `camelCase`**, fechas `"YYYY-MM-DD"` y timestamps ISO 8601 UTC; los decimales llegan como `number`.

```ts
// ── Enums (deben coincidir 1:1 con backend.md §7.10) ──────────────────────
export type AccountType = "cash" | "bank" | "wallet" | "other";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";

// ── Genéricos ─────────────────────────────────────────────────────────────
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ── Auth / usuario ────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  primaryCurrency: string;
  createdAt: string;
}
export interface AuthResponse {
  user: User;
}

// ── Finanzas ──────────────────────────────────────────────────────────────
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
}
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
  transferGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardData {
  period: { from: string; to: string };
  /** Moneda de lectura (default: principal). */
  currency: string;
  primaryCurrency: string;
  rateDate: string | null;
  availableCurrencies: string[];
  breakdown: {
    currency: string;
    balance: number;
    accounts: number;
    converted: number;
  }[];
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
  };
  netWorthSeries: { date: string; value: number }[];
  incomeExpenseByMonth: { month: string; income: number; expenses: number }[];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }[];
}

// ── Asistente (solo consulta) ─────────────────────────────────────────────
export interface AssistantHistoryMessage {
  role: "user" | "assistant";
  content: string;
}
export interface AssistantStreamMeta {
  period: { from: string; to: string };
  currency: string;
  sources: string[];
  disclaimer: string;
}
```

> **Eliminados:** `Budget`, `BudgetStatus`, `Asset`, `AssetType`, `Valuation`, `ValuationSource`, `Debt`, `DebtType`, `Position`, `Quote`, `Goal`, `GoalStatus`, `Theme`, `ReportSummary`, `ReportByCategory`, `NetWorthPoint`, `BudgetReportRow`, `Conversation`, `AssistantActionProposal` y `AssistantActionError`. Los tipos de moneda vigentes son `CurrencyCatalogItem`, `CurrencyRate` y `CurrencySettings`.

> **Contrato:** el contrato REST vive en `backend.md` §7 (camelCase, fechas `YYYY-MM-DD`, decimales `number`). La API no publica Swagger/OpenAPI ni una referencia interactiva; cualquier cambio de endpoint debe reflejarse en estos tipos y en la doc.

### 7.4 Hooks de Query (`lib/query/*`)

- Claves consistentes: `["accounts"]`, `["transactions", page]`, `["dashboard", period]`, `["categories"]`, `["currencies"]`, `["currencies", "rates"]`, etc.
- Mutaciones con invalidación en cascada: al crear un movimiento se invalidan `transactions`, `accounts` y `dashboard`.
- `staleTime` corto para datos financieros; `retry` configurado.

---

## 8. Autenticación

Flujo basado en **JWT** emitido por el backend (ver `backend.md`). Viaja en cookie `HttpOnly`; el frontend **no** firma, interpreta ni persiste el token, solo lo transporta implícitamente vía la cookie.

1. **Login/registro**: `POST /auth/login` → el backend fija la cookie `HttpOnly` y devuelve el usuario; `AuthProvider` guarda el usuario y redirige.
2. **Guard en cliente (`auth-guard.tsx`)**: envuelve el layout de `(app)`; si no hay usuario (o `GET /auth/me` falla con 401), redirige a `/login`. Es solo UX: el backend valida en cada request.
3. **Verificación inicial**: `GET /auth/me` al montar el provider para hidratar el usuario y confirmar validez. Ante `401`, limpiar estado y redirigir.
4. **Refresh**: `POST /auth/refresh` ante `401` (renovación); se hace con la cookie de refresh.
5. **Logout**: `POST /auth/logout` → el backend limpia las cookies; el front limpia el estado de sesión y redirige. Al ser JWT stateless, el token ya emitido sigue siendo válido hasta expirar.
6. **401 global**: un interceptor del cliente lanza evento; `AuthProvider` redirige a `/login`.

---

## 9. Gráficos y analítica (distintivo)

La analítica es el diferenciador. Directrices:

- **Consistencia**: un solo módulo `lib/format.ts` para moneda/porcentaje/fecha en todos los gráficos y KPIs.
- **Tipos de gráfico por dato**:
  - Serie temporal → `Chart` de área/línea (patrimonio neto).
  - Comparación por semana o mes → barras (ingresos vs. gastos), según el rango.
  - Composición (partes de un todo) → donut (gastos por categoría).
- **Datos tabulados**: cada gráfico tiene su tabla equivalente para NFR-UA-004.
- **Período compartido**: el `PeriodSelector` del dashboard actualiza el `PeriodProvider`; Movimientos lo usa para filtrar y el Asistente para el contexto de sus preguntas.
- **Granularidad:** `Este mes` y `Últimos 30 días` usan serie diaria y barras semanales; `6 meses` y `12 meses` usan serie y barras mensuales. La regla vive en el backend (`DashboardOrchestrator`).
- **Moneda**: el dashboard tiene un selector de moneda de lectura en el header, antes del período (CH-77), con las monedas en uso y **“Otra moneda”** para elegir cualquier moneda del catálogo. Re-expresa el patrimonio, los KPIs y los gráficos con la cotización de la API. El patrimonio se informa con desglose por moneda; Categorías tiene su propio selector de visualización. El cliente no crea ni edita cotizaciones.

---

## 10. Asistente de IA (distintivo)

Implementación de la UI conversacional (SC-009, FR-IA-002/015). El backend es quien interactúa con el proveedor de IA (DeepSeek); el front solo presenta la conversación. **El asistente es de solo consulta**: no crea, edita ni elimina datos (FR-IA-015).

- **Ubicación**: página propia `/assistant` en desktop y mobile, accesible desde la sidebar (desktop) y desde el ítem **`Asistente`** de la barra inferior. No hay FAB ni panel flotante. Componente `assistant-chat`; el estado de la única conversación vive en el hook `use-assistant-conversation` y `Nuevo chat` remonta el chat.
- **Separación**: la orquestación del chat (envío y streaming) vive en el hook privado `assistant-chat/hooks/use-assistant-conversation`; `AssistantChat` queda como presentación.
- **Flujo**:
  1. `POST /assistant/messages` con `{ question, period?, history? }`; `history` lleva los turnos previos de la conversación en memoria (máx. 10, acotados) para resolver seguimientos. El backend responde `text/event-stream` con los eventos `meta`, `token`, `done` y `error` (ver `backend.md` §7.12).
  2. UI muestra estado de carga mientras llega el stream; los `delta` se acumulan en la burbuja del asistente en vivo.
- **Transporte**: usar `fetch` + `ReadableStream`, **no `EventSource`** (no permite el cuerpo de request ni controlar los headers). Implementado en `lib/api/assistant-stream.ts` (`streamAssistantMessage`) con callbacks `onMeta`/`onToken`/`onDone`/`onError`.

```ts
// lib/api/assistant-stream.ts — parser SSE basado en fetch (usa la cookie de sesión)
export interface AssistantStreamHandlers {
  onMeta?: (meta: AssistantStreamMeta) => void;
  onToken?: (delta: string) => void;
  onDone?: (result: { insufficient: boolean }) => void;
  onError?: (message: string) => void;
}

export const streamAssistantMessage = (
  input: {
    question: string;
    period?: { from: string; to: string };
    history?: { role: "user" | "assistant"; content: string }[];
  },
  handlers: AssistantStreamHandlers,
): Promise<void> => {
  // Lee el body con ReadableStream y despacha los frames SSE: meta, token, done y error.
};
```

- **Render**: la respuesta se acumula desde los `delta` y se renderiza **Markdown de forma segura** con `assistant-chat/components/markdown-text` (produce elementos React para negrita/cursiva/código/listas; **nunca** usa `dangerouslySetInnerHTML`, NFR-SEG-006). El front marca la respuesta como informativa. El `ScrollArea` de la conversación usa `min-h-0` para poder scrollear dentro de la página; una respuesta interrumpida se muestra como tal.
- **Límites**: si llega `done` con `insufficient: true`, mostrar el mensaje sin fallar; si llega `error`, mostrar aviso genérico y permitir reintento.
- **Seguridad de prompts**: el front **nunca** concatena datos del usuario con instrucciones de sistema; envía la pregunta, el período y los turnos previos como contexto separado.
- **Conversación única:** no hay historial persistido. `use-assistant-conversation` mantiene una sola conversación en memoria y envía sus últimos turnos como `history` para permitir seguimientos; `Nuevo chat` la descarta. No hay propuestas ni acciones.
- **Sin modo mock en la app:** el asistente siempre hace el `POST /assistant/messages` real contra `NEXT_PUBLIC_API_URL` y recibe el stream de DeepSeek. Requiere sesión tanto en desarrollo como en producción; no hay fallback a un usuario demo.

> **Eliminados:** acciones de escritura y su confirmación (token de un solo uso, orden por plan), historial de conversaciones persistido (local y en el servidor), entrada por voz (`MediaRecorder` / Web Speech) y el interruptor de IA en Ajustes.

---

## 11. Formato de monedas, fechas y localización

```ts
// lib/format.ts
const DEFAULT_LOCALE = "es-AR";

export const formatCurrency = (
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

export const formatDate = (iso: string, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );

export const formatPercent = (v: number, locale: string = DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(v);
```

- `es-AR` como locale por defecto (no `navigator.language`, para que el export estático no dependa del cliente).
- Cada monto se formatea con la **moneda de su cuenta**; el dashboard usa la **moneda de lectura** elegida en el header (default: principal) y convierte todos los valores con la cotización de la API. El resumen del sidebar muestra los totales nativos por moneda; las filas de movimientos en mobile y el resumen formatean sin centavos (`showCents: false`). No se editan cotizaciones desde el cliente.
- Rangos y fechas se calculan con `Date`/`Intl`; no se usa `date-fns`.

---

## 12. Requerimientos no funcionales del front

| NFR                                | Implementación en front                                                                                         |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| NFR-UA-001 (responsive ≥360px)     | Mobile-first; en móvil la navegación es una barra inferior estilo app; las listas usan items (sin tablas). |
| NFR-UA-002 (teclado)               | Radix/shadcn aseguran foco; no remover estilos de focus.                                                        |
| NFR-UA-003 (labels/ayudas/errores) | `FormField` de shadcn con `Label`, `FormMessage`, `FormDescription`.                                            |
| NFR-UA-004 (gráficos accesibles)   | `aria-label` + tabla alternativa (§6.4).                                                                        |
| NFR-UA-005 (no solo color)         | Estados con icono + texto + color (§6.3).                                                                       |
| NFR-PR-001 (<3s)                   | `Skeleton`, prefetch en hover de links, queries en paralelo.                                                    |
| NFR-PR-002 (paginación)            | `ListPagination` client-side sobre los movimientos cargados (máx. 100).                                          |
| NFR-PR-004 (IA cancel/timeout)     | `AbortController` en el stream + botón cancelar.                                                                |
| NFR-CAL-003 (localización)         | `Intl` (§11).                                                                                                   |
| NFR-CAL-005 (datos demo)           | Consumir el seed del backend; ningún dato real.                                                                 |

> Las cotizaciones son globales y se refrescan desde la API; no hay edición de cotizaciones desde el cliente. NFR-CAL-002 (temas) se cubre con la preferencia local `Claro/Oscuro/Auto`.

---

## 13. Convenciones de código

- **Componentes**: siempre **funciones flecha** (`const Foo = () => {}`), nunca `function`; archivos `kebab-case.tsx`. Un componente por archivo (salvo variantes pequeñas). Excepción: `components/ui/**` generado por shadcn.
- **Client/Server**: las páginas de `(app)` son componentes cliente; no usar Server Components, Server Actions, Route Handlers ni APIs server-only (cookies/headers) para que el build sea estático.
- **Tipado**: `strict`; usar `interface` para DTOs y `type` para uniones; evitar `any`.
- **Imports**: path alias `@/`; orden: externos, internos (`@/lib`, `@/components`), relativos.
- **Estilos**: Tailwind + `cn()`; evitar CSS inline.
- **Formato**: Prettier (`.prettierrc.json`); `npm run format` escribe y `npm run format:check` corre en el hook **pre-push**.
- **Consultas**: nunca llamar a la API directamente desde componentes; siempre a través de hooks en `lib/query/`.
- **Validación**: todo formulario usa un schema Zod; mostrar errores del backend mapeados a campos cuando corresponda.
- **Sin `console.log`** en producción; usar `sonner` (toast) para feedback de usuario.
- **Sin comentarios innecesarios**; el código debe autoexplicarse.

---

## 14. Plan de trabajo por tandas

Progresivo y validable al final de cada tanda. Cada tanda deja la app compilando (`npm run lint && npm run build`) y consumiendo endpoints ya existentes en el backend (ver plan equivalente en `backend.md`).

### Tanda 0 — Setup del proyecto — ✅ Hecho

- Crear Next.js + TS + Tailwind, inicializar shadcn, instalar deps.
- `next.config.ts` con `output: "export"` e `images: { unoptimized: true }`.
- `Providers` (Query, Auth), `globals.css`, `layout` root y `auth-guard.tsx`.
- **Aceptación**: app corre, build estático (`npm run build`) genera `out/`, estructura de carpetas creada.

### Tanda 1 — Shell de app + Autenticación — ✅ Hecho

- Sidebar (desktop) + `mobile-tab-bar.tsx` (barra inferior flotante móvil), `(auth)` y `(app)` layouts, `auth-guard.tsx`.
- Páginas login/register con RHF+Zod, `AuthProvider`, `use-auth`.
- `lib/api/client.ts`, `types.ts`; `users.ts` (`PATCH /users/me`).
- **Aceptación**: registro/login/logout + edición del perfil funcionales; rutas protegidas; navegación desktop/móvil correcta.

### Tanda 2 — Cuentas y Movimientos — ✅ Hecho

- **Cuentas** viven en `/dashboard`, con detalle en `/accounts/detail`; eliminación directa con confirmación (FR-CUE-003/005).
- Movimientos con paginación, búsqueda, filtros, exportación CSV, transferencia (colapsada a una fila) y CRUD en `/transactions`.
- `Amount`, `ListSkeleton`, `ListPagination`.
- **Aceptación**: HU-001 y HU-002 completas.

### Tanda 3 — Dashboard — ✅ Hecho

- Inicio "Tu resumen": layout fijo con patrimonio neto (`NetWorthHero`), ingresos vs. gastos, gastos por categoría y sección de Cuentas.
- `EmptyState`, `PeriodSelector`, `CategoryDonut`, `IncomeExpenseChart`.
- **Aceptación**: FR-DAS-001..004, 007, 008.

### Tanda 4 — Categorías (sistema + propias) + Perfil/Ajustes — ✅ Hecho

- Página `/categories` con tabs Gastos/Ingresos, uso por período y CRUD de categorías propias (FR-CAT-001..004, FR-TRX-002).
- `/profile` (hub) y `/settings` (nombre, correo, contraseña, tema y exportación), cierre de sesión.
- **Aceptación**: FR-CAT-001..004, FR-CFG-001/003, FR-TRX-002, FR-AUT-001/002.

### Tanda 5 — Asistente IA (solo consulta) — ✅ Hecho

- Chat con streaming (`fetch` + `ReadableStream`, eventos SSE), cancelar, render Markdown seguro, insuficiencia y continuidad conversacional en memoria (FR-IA-016).
- Sin historial persistido, sin acciones y sin entrada por voz.
- **Aceptación**: HU-006 (FR-IA-002/015/016).

### Tanda 6 — Pulido y NFRs — ◐ Parcial

- A11y, responsive 360px, estados vacíos, loading skeletons.
- Refinar la barra inferior móvil: safe-areas, transiciones y estado activo accesible.
- **Aceptación**: cumplimiento de NFR-UA/PR/CAL del §12.
