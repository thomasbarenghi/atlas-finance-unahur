# Atlass Fin — Documento Técnico del Frontend

> **Audiencia:** agentes de IA que implementarán el frontend.
> **Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · Outfit (títulos) + Nunito (cuerpo) · Recharts · TanStack Query · React Hook Form + Zod · lucide-react · Capacitor 8 (Android; iOS pendiente).
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
14. [Empaquetado móvil con Capacitor](#14-empaquetado-móvil-con-capacitor)
15. [Plan de trabajo por tandas](#15-plan-de-trabajo-por-tandas)

---

## 1. Visión general y stack

**Atlass Fin** es una aplicación de gestión financiera personal: cuentas, movimientos (ingresos, gastos y transferencias), categorías fijas del sistema y un dashboard con la evolución del patrimonio y del flujo de fondos. Sus dos distintivos propios son **analítica/gráficos ricos** y un **agente de IA conversacional de solo consulta** que responde sobre los datos financieros del usuario.

La aplicación opera con **una única moneda** (definida por el backend) y un **catálogo fijo de categorías**. No hay presupuestos, activos, inversiones, deudas, objetivos, reportes, multimoneda, tema claro/oscuro ni entrada por voz.

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
| Estado global | Mínimo; contextos puntuales (auth) | Evita sobre-ingeniería; TanStack Query cubre el resto. |
| Gráficos | Recharts vía `Chart` de shadcn | Accesible, con tooltip personalizable y datos tabulados alternativos. |
| IA | Streaming SSE al backend | UI reactiva, cancelable, con timeout (NFR-PR-004). |
| Sesión | Cookie `HttpOnly` (web) / Bearer token en almacenamiento seguro (nativo) | El cliente abstrae la fuente del token; el backend valida igual. |
| Moneda/fecha | `Intl.NumberFormat` / `Intl.DateTimeFormat` + `date-fns` | Localización real (NFR-CAL-003). La moneda es una constante del sistema. |

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
    ├── /categories           # catálogo fijo de categorías, solo lectura (SC-004)
    ├── /assistant            # chat con la IA, solo consulta (SC-009)
    ├── /profile              # hub de perfil: tarjeta, secciones y cierre de sesión (SC-010)
    └── /settings             # ajustes: nombre del perfil (SC-010)
```

**Reglas de enrutamiento:**

- La protección de rutas vive en un **`AuthGuard` en cliente** (componente que envuelve el layout de `(app)`): si no hay sesión, redirige a `/login`. El backend valida la autorización en cada request, así que el guard es solo UX (NFR-SEG-001).
- `(app)` comparte un `layout.tsx` con la navegación (sidebar en desktop / barra inferior en móvil), `Header` (usuario) y el provider de TanStack Query.
- Toda página de `(app)` se renderiza tras una verificación de sesión; los datos se cargan en cliente vía Query.
- **Sin `middleware.ts`** (o solo como optimización opcional en web): en el build estático/Capacitor no existe, por lo que la barrera real es el guard en cliente + el backend.

**Navegación responsive (web + app):**

- **Desktop (≥ `md`)**: `Sidebar` lateral fija con las secciones y accesos de perfil/configuración. El `Header` (**usuario**) es **solo desktop** (`hidden md:flex`). El **período** vive en el contenido como filtro de página.
- **Móvil (< `md`)**: la navegación se convierte en una **barra inferior estilo app móvil** (flotante, separada del borde, con bordes redondeados), como en las apps nativas. Se detecta por viewport (`matchMedia` / CSS), no por plataforma. El estilo visual es propio; se toma como referencia (no como requisito) la estética "Liquid Glass" de iOS 26.
- La barra inferior tiene **3 ítems**: `Inicio`, **`Asistente`** (abre el chat, no navega) y `Perfil`; más un **botón central prominente** `+` que lleva a **Movimientos**.
- **`Perfil`** (ruta `/profile`) es el hub de la barra inferior: muestra la tarjeta de perfil, un acceso a **Categorías** y a **Ajustes** (`/settings`), y **Cerrar sesión**. Se comporta como una pestaña más, no como un `Sheet` superpuesto.
- **El asistente no está en la sidebar**: en **desktop** es un **widget flotante** (botón abajo a la derecha) disponible en `(app)`, salvo en `/assistant`; en **mobile** es una **página propia** (`/assistant`) a la que se entra desde el ítem `Asistente` de la barra inferior. Ver §10.
- Estado activo con ícono + label, respetando NFR-UA-005 (no solo color); safe-areas (`env(safe-area-inset-bottom)`) para el notch/gesto de home.
- **Mobile**: no hay header global. Cada página muestra su propio título (`PageHeader`) y, en `/dashboard`, el **período** se muestra dentro del contenido (`PeriodSelector`), no en una barra fija.
- El mismo comportamiento aplica en el navegador móvil y dentro de Capacitor (misma base de código).

> **Sin tema:** no hay provider ni toggle de claro/oscuro; la app usa un único esquema visual.
> **Sin selector de moneda:** la moneda es una constante del sistema que llega en las respuestas del backend.

---

## 4. Funcionalidades por página

Cada página lista: FRs cubiertos, componentes shadcn, y comportamiento esperado. El detalle de endpoints está en `backend.md`.

### 4.1 `/login`, `/register` — SC-001 (FR-AUT-001/002)

- **Login:** email + contraseña. El backend devuelve `{ user, accessToken, refreshToken }`; en web además fija cookie `HttpOnly`, y en nativo el token se guarda en almacenamiento seguro (Keychain/Keystore vía Capacitor). On success → `router.push("/dashboard")` + `router.refresh()`.
- **Registro:** nombre, email, contraseña (con confirmación). **Política:** 8–72 caracteres, al menos una letra y un número (debe coincidir con el backend). Tras registrarse, se loguea automáticamente (o queda pendiente de aprobación si el backend lo indica).
- **Componentes:** `Card`, `Form`, `Input`, `Button`, `Alert`, `Label`.
- **Errores:** mensajes genéricos del servidor, nunca detalles sensibles.
- **Demo:** en la pantalla de login se pueden precargar las credenciales del seed (`demo@atlassfin.app` / `Demo1234!`).

### 4.2 `/dashboard` — SC-002 (FR-DAS-001..004, 007, 008)

Vista de aterrizaje **"Tu resumen"**: un **layout fijo** de indicadores y gráficos + la sección de cuentas, con `Skeleton` mientras carga.

- **Patrimonio neto** (ancho completo): `NetWorthHero` con valor, variación vs. período anterior (`TrendBadge`), mini-stats (Ingresos/Gastos/Ahorro/Tasa) y sparkline con **escala adaptativa** y **tooltip**. El patrimonio es la suma de los saldos de las cuentas (CAL-001) y coincide con lo que informa el asistente.
- **Ingresos vs. gastos** (FR-DAS-003): gráfico de barras por mes.
- **Gastos por categoría** (FR-DAS-004): donut con el color de cada categoría.
- Los tres bloques se muestran en una grilla fija (patrimonio a ancho completo; los dos gráficos en dos columnas en desktop, apilados en mobile). **No hay personalización** de widgets (sin arrastrar y soltar, ocultar ni cambiar ancho) ni layout persistido.
- **Cuentas**: sección con `AccountsList` sobre `useAccounts` (ruta `/accounts/detail`). Las cuentas con saldo negativo muestran "Saldo negativo". Botón `+` (`AccountTypePicker` → `AccountFormDialog`) y las filas navegan al detalle (§4.3).
- **Filtro de período** (FR-DAS-007): `PeriodSelector` dentro del contenido de la página; cambia el período de los indicadores y de las series.
- **Estados vacíos** (FR-DAS-008): `EmptyState` reutilizable con acción sugerida.

### 4.3 Cuentas — SC-003 (FR-CUE-001..005)

El **listado de cuentas vive en el inicio** (`/dashboard`, §4.2). Las cuentas se muestran como **lista de items** (`DataList` + `DataListItem`, genéricos reutilizables). La **creación** arranca con un **selector de tipo en grilla** (`AccountTypePicker`: Efectivo, Bancaria, Billetera y Otra); al elegir un tipo se abre el `AccountFormDialog` con ese tipo precargado (nombre, tipo, saldo inicial, observaciones; FR-CUE-001/002).

El **formulario** (`AccountFormDialog`) es un editor visual: hero con ícono del tipo y **nombre editables**, chips de **tipo** (scroll horizontal) y campos de saldo inicial y observaciones. **No hay moneda** (moneda única del sistema) ni tipo tarjeta.

#### 4.3.1 `/accounts/detail?id=<id>` — Detalle de cuenta

- **Encabezado** (`PageHeader`): botón atrás (móvil), nombre de la cuenta y acciones: editar (`Pencil`) y eliminar.
- **Hero**: ícono por tipo y saldo actual grande.
- **Stats**: saldo inicial, ingresos y gastos del período (`usePeriod`).
- **Movimientos**: `TransactionList` (lista de items reutilizable) con los movimientos de la cuenta; al tocar uno se abre el `Dialog` de edición.
- **Editar** reutiliza `AccountFormDialog`; **eliminar** usa `AlertDialog` de confirmación y advierte que se eliminan también sus movimientos asociados (FR-CUE-003/005).
- La ruta usa `?id=` en vez de `/accounts/:id` para ser compatible con el **static export** de Next/Capacitor; el id se lee con `useQueryParam`.

### 4.4 `/transactions` — SC-004 (FR-TRX-001..005)

- **Lista de items** (`TransactionList`) con paginación (NFR-PR-002) y menú por fila (editar/eliminar): ícono por tipo, descripción, `fecha · categoría · cuenta` y monto (color por signo). Cada fila abre la edición. **Las transferencias se colapsan en una sola fila** (`collapseTransfers` por `transferGroupId`, conservando la pata origen): subtítulo `fecha · Transferencia · Cuenta origen → destino` y monto **neutro** (sin verde/rojo); no afectan ingresos, gastos, ahorro ni patrimonio (CAL-003).
- **Sin filtros ni búsqueda** (fuera de alcance de la v0.3): la lista solo pagina.
- **CTA de alta**: botón `+ Nuevo movimiento` en desktop (ícono en mobile, donde la barra inferior ya aporta el `+` central).
- **Alta/edición** como editor moderno estilo app (`Dialog` + `Form`, FR-TRX-001/002/003): **segmented de tipo** (Gasto/Ingreso/Transferencia), filas de cuenta y categoría (categoría obligatoria en ingreso/gasto, del **catálogo fijo**), **teclado numérico** (`AmountKeypad`) con operaciones `+ − × ÷`, **cálculo en vivo** (el resultado se muestra mientras se escribe, sin botón `=`), monto grande con signo por tipo y saldo disponible, fecha + comentario. El monto se evalúa con `lib/amount-expression.ts` (sin `eval`) y se valida `> 0`. Si es transferencia, selector origen/destino que excluye la otra cuenta elegida (FR-TRX-004).
- **Eliminar** con `AlertDialog` de confirmación; en una transferencia elimina ambas patas.

### 4.5 `/categories` — catálogo fijo, solo lectura (FR-TRX-002)

- Página **`/categories`**, accesible desde el hub de **Perfil** (`/profile`). Tiene **tabs arriba** para elegir **Gastos** o **Ingresos** y lista el catálogo fijo del sistema.
- **Sin alta, edición, archivo ni eliminación**: las categorías las define el sistema (Sueldo, Freelance, Supermercado, Transporte, Servicios). El color se usa como `Badge`/punto en toda la app.
- **Estados vacíos**: `EmptyState` cuando el catálogo aún no cargó (no debería ocurrir con el seed).

### 4.6 `/assistant` — SC-009 (FR-IA-002/011/015)

Ver §10. En **mobile** es la página `/assistant` (ítem `Asistente` de la barra inferior), integrada como el resto: **`PageHeader` estándar** arriba (sin botón atrás, porque es una pestaña raíz de la barra), **contenedor de mensajes con scroll propio** (`ScrollArea`) y **input + enviar pegados a la barra inferior, sin borde superior**. Para eso el shell de `(app)` usa `h-dvh` + scroll interno de `<main>`, así la ventana no scrollea en esta página. En **desktop**, un **widget flotante** (botón abajo a la derecha) presente en `(app)` que oculta el FAB en `/assistant`. Estado vacío diseñado (**hero con ícono, título y tarjetas de preguntas sugeridas**), `Alert` de alcance y disclaimer de no-asesoramiento. **El asistente es de solo consulta**: no propone ni ejecuta escrituras, no tiene historial en el servidor ni entrada por voz.

### 4.7 `/profile` — SC-010 (perfil) y `/settings` (ajustes)

- **`/profile`** (`ProfileMenu`): tarjeta de perfil (avatar con iniciales, nombre, email), acceso a **Categorías** y a **Ajustes** (`/settings`), y **Cerrar sesión**. Es el ítem `Perfil` de la barra inferior.
- **`/settings`** (Ajustes): formulario (`SettingsForm`) para editar el **nombre** del perfil (`PATCH /users/me`, email no editable en esta versión). No hay selector de moneda, de tema ni interruptor de IA.
- **Sesión:** cerrar sesión (`POST /auth/logout`, FR-AUT-002).

---

## 5. Estructura de archivos

```
client/
├── app/
│   ├── layout.tsx                 # root: html/body, AppProviders
│   ├── globals.css                # CSS vars de shadcn + tailwind
│   ├── page.tsx                   # redirect según sesión
│   ├── (auth)/
│   │   ├── layout.tsx             # centrado, branding
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/
│       ├── layout.tsx             # Sidebar + MobileTabBar + AuthGuard
│       ├── dashboard/page.tsx
│       ├── accounts/detail/page.tsx
│       ├── transactions/page.tsx
│       ├── categories/page.tsx
│       ├── assistant/page.tsx
│       ├── profile/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                        # generado por shadcn (NO editar a mano salvo variantes)
│   ├── layout/
│   │   ├── app-nav.ts               # registro de navegación (desktop y móvil)
│   │   ├── sidebar.tsx
│   │   ├── mobile-tab-bar.tsx       # barra inferior estilo app móvil
│   │   ├── header.tsx               # header desktop (usuario)
│   │   ├── header/user-menu.tsx
│   │   ├── auth-guard.tsx           # guard de sesión en cliente (rutas de (app))
│   │   ├── brand.tsx
│   │   └── native-system-bars.tsx   # status/navigation bar en Capacitor
│   ├── common/                      # genéricos domain-agnostic (folder + index.tsx)
│   │   ├── amount/  amount-keypad/  money/  money-input/  category-badge/
│   │   ├── confirm-dialog/  confirm-action-dialog/  period-selector/
│   │   ├── data-list/  data-list-item/  date-picker/  empty-state/  error-state/
│   │   ├── markdown-text/  page-header/  detail-page/  responsive-dialog/
│   │   ├── stat-tiles/  back-button/  list-row/  chart-data-table/  icon-badge/
│   │   ├── option-picker-dialog/  option-sheet/  page-loader/  row-actions-menu/
│   │   ├── section-card/  section-header/  time-series-chart/  trend-badge/
│   │   ├── detail-metric/  form-shell/  form-dialog/  form-hero/
│   │   └── form-text-field/  form-select-field/  form-date-field/  form-money-field/
│   ├── charts/                      # wrappers de shadcn Chart (Recharts)
│   └── features/<feature>/          # componentes de dominio (accounts, transactions, …)
├── lib/
│   ├── utils.ts                   # cn()
│   ├── format.ts                  # formatCurrency, formatDate, formatPercent, …
│   ├── period.ts / period-stats.ts / labels.ts / colors.ts / chart-scale.ts
│   ├── currency.ts / categories.ts
│   ├── sections.ts / forms.ts / storage.ts
│   ├── amount-expression.ts
│   ├── api/                       # client, types, session, token-store, endpoints, errors, assistant-stream
│   ├── query/                     # hooks de TanStack Query por dominio (+ keys.ts)
│   ├── validation/                # schemas Zod por formulario
│   ├── native/                    # puente a plugins Capacitor
│   └── mocks/                     # API mockeada para desarrollo
├── hooks/                         # hooks compartidos (auth, período, confirm, …)
├── providers/                     # app-providers, auth, query, período, asistente…
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
- La lógica transversal vive en hooks compartidos: `use-confirm-action` (confirmar + mutar + toast), `use-period`, etc.
- Los schemas Zod viven en `lib/validation/` y reflejan los DTOs de `lib/api/types.ts`.
- `next.config.ts` usa `output: "export"` e `images: { unoptimized: true }` para generar el estático que Capacitor sirve (`webDir: out`).
- No existe `middleware.ts`: el guard de sesión es `auth-guard.tsx` en cliente. La seguridad real la impone el backend.

> **Eliminados:** `lib/budget.ts`, `lib/goal.ts`, `lib/patrimony.ts`, `lib/query/{budgets,assets,debts,goals,positions,quotes,reference,assistant}.ts`, `lib/validation/{budgets,assets,goals,categories}.ts`, las páginas `budgets`, `goals`, `patrimony/**`, `reports/**`, `forgot-password` y `reset-password`, y los componentes `currency-selector`, `theme-toggle`, `period-currency-filters`, `allocation-list`, `status-badge`, `warning-badge`, `signed-money`, `budget-progress`, `form-currency-field`, `archived-sheet` y `coming-soon`.

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
- **Regla**: nunca usar colores hardcodeados; siempre `bg-background`, `text-foreground`, `border-border`, `bg-muted`, etc., o tokens `primary/destructive/success/warning`.
- Se agregan tokens semánticos propios: `--success`, `--warning`, `--destructive` para estados financieros (positivo/negativo/advertencia), usados por `Badge` y `Progress`.

### 6.3 Componentes financieros reutilizables

- **`Amount`**: formatea monto con signo y color (`success` positivo ingreso, `destructive` gasto, `muted` transferencia). Respeta NFR-UA-005 (signo + color, no solo color).
- **`StatTiles`**: grilla **2×2 en mobile** que pasa a tira horizontal en desktop (`label` + valor con tono y delta opcional). La usa `NetWorthHero`; los textos/formatos de Ingresos/Gastos/Ahorro/Tasa se derivan de `lib/period-stats.ts`.
- **`PeriodSelector`**: filtro de período de página del dashboard. No hay selector de moneda.
- **`NetWorthHero`**: hero de patrimonio neto con variación, mini-stats del período (opcionales vía `showPeriodStats`) y sparkline con escala adaptativa y tooltip.
- **`Money`**: formatea un monto en la moneda del sistema (`formatCurrency`).
- **`TrendBadge`**: pill de variación con ícono y color por signo.
- **`SectionCard` / `SectionHeader`**: card y encabezado de sección reutilizables (título, descripción, acciones).
- **`ErrorState`**: estado de error con reintento.
- **`DetailMetric`**: métrica compacta `label + valor` para los detalles.
- **`TimeSeriesChart`**: gráfico temporal genérico (áreas, tooltip, escala adaptativa y estado vacío con menos de dos puntos).
- **`EmptyState`**: ícono, título, descripción, acción CTA (FR-DAS-008).
- **`CategoryBadge`**: `Badge` con el color de la categoría.
- **`DataList` / `DataListItem`**: lista de items genérica (loading, vacío, paginación) con filas `leading/title/subtitle/trailing` y acción opcional. Se usan en todas las secciones; **no hay tablas** (`DataTable` eliminado).
- **`IconBadge`**: tile de ícono reutilizable (tamaño, forma y tono semántico) usado por las listas, pickers y estados.
- **`RowActionsMenu`**: menú de acciones por fila (`Editar`/`Eliminar`…) con trigger y `aria-label` consistentes.
- **`OptionPickerDialog`**: diálogo de selección con opciones (ícono + título + bajada); unifica `AccountTypePicker`.
- **`ChartDataTable`**: tabla `sr-only` equivalente a cada gráfico (NFR-UA-004), compartida por todos los charts.
- **`PageLoader`**: estado de carga a pantalla completa usado por el redirect raíz y el `AuthGuard`.
- **Formularios compartidos** (`FormShell`, `FormDialog`, `FormTextField`, `FormSelectField`, `FormDateField`): eliminan el scaffold de RHF y los campos repetidos en todos los formularios.
- **`useConfirmAction`**: hook compartido que encapsula el patrón *confirmar → mutar → toast* (usado por eliminar cuentas y movimientos).

**Fuentes únicas de verdad transversales:**
- `lib/sections.ts`: registro de secciones (`href` + `label` + `icon`) consumido por sidebar, tab bar y perfil; agregar una sección es un solo cambio.
- `lib/period-stats.ts`: labels/formatos de Ingresos/Gastos/Ahorro/Tasa.
- `lib/forms.ts`: mapeo de `fieldErrors` del backend a campos de RHF.
- `lib/storage.ts`: lectura/escritura segura de `localStorage`.
- `lib/query/keys.ts`: claves de TanStack Query y bases de invalidación (`transactionsBase`, `accountsBase`, `dashboardBase`).

### 6.4 Chart (Recharts)

- El componente `chart` de shadcn provee `ChartContainer`, `ChartTooltip`, `ChartLegend` y configuración de colores vía CSS vars.
- **Accesibilidad (NFR-UA-004)**: cada gráfico va acompañado de un `aria-label` y, en la misma página o en una pestaña, una `Table` con los mismos datos.
- Los datos de gráficos se adaptan con `useMemo` a la estructura que Recharts espera.

---

## 7. Capa de datos y API client

### 7.1 Cliente HTTP (`lib/api/client.ts`)

- `fetch` nativo con `credentials: "include"` en web para la cookie de sesión.
- Base URL desde `process.env.NEXT_PUBLIC_API_URL` (p. ej. `http://localhost:3001/api` en dev; URL pública HTTPS en producción/nativo).
- Normaliza errores a `ApiError { statusCode, code, message, fieldErrors? }` (catálogo en `backend.md` §7.13).
- Expone `get<T>`, `post<T>`, `patch<T>`, `del<T>` tipadas y un helper `apiFetch` de bajo nivel (usado por el parser SSE de §10).
- **Doble transporte (web/nativo).** En web se sigue usando la cookie `HttpOnly` (`credentials: "include"`, sin tokens en JS). En nativo, `lib/api/token-store.ts` guarda los tokens y `authHeaders()` inyecta `Authorization: Bearer <accessToken>` en cada request; ante un `401` (fuera de `/auth/login` y `/auth/register`) `refreshAuthSession()` hace `POST /auth/refresh` enviando `{ refreshToken }` en el body, guarda el par rotado y reintenta una vez. Si el refresh falla, limpia los tokens (el `AuthGuard` redirige a `/login`).
- `lib/mocks/api.ts` es el **único** consumidor de `sessionStore` (mock); el flujo real de tokens vive en `lib/api/token-store.ts`.

### 7.2 Sesión (`lib/api/session.ts`)

`lib/api/session.ts` mantiene el `sessionStore` que persiste el `userId` en `localStorage` (`atlassfin.session.userId`); lo usan **solo los mocks** para resolver `/auth/me`. La sesión real va por cookie (web) o por tokens (nativo).

**Nativo — `lib/api/token-store.ts`.** El access token vive en memoria y el refresh token se persiste con `@capacitor/preferences`; `ensureTokensLoaded()` hidrata de forma perezosa antes del primer request. En web es no-op total.

```ts
export const ensureTokensLoaded = (): Promise<void>;
export const getAccessToken = (): string | null;
export const getRefreshToken = (): string | null;
export const setTokens = (t: { accessToken: string; refreshToken: string }): void;
export const clearTokens = (): void;
```

### 7.3 Tipos (`lib/api/types.ts`)

Reflejan el contrato del backend (fuente de verdad: `backend.md` §7.9–§7.13). **JSON en `camelCase`**, fechas `"YYYY-MM-DD"` y timestamps ISO 8601 UTC; los decimales llegan como `number`.

```ts
// ── Enums (deben coincidir 1:1 con backend.md §7.10) ──────────────────────
export type AccountType = "cash" | "bank" | "wallet" | "other";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";

// ── Genéricos ─────────────────────────────────────────────────────────────
export interface Paginated<T> { items: T[]; page: number; pageSize: number; total: number; totalPages: number; }
export interface ApiError { statusCode: number; code: string; message: string; fieldErrors?: Record<string, string[]>; }

// ── Auth / usuario ────────────────────────────────────────────────────────
export interface User { id: string; name: string; email: string; createdAt: string; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

// ── Finanzas ──────────────────────────────────────────────────────────────
export interface Account { id: string; name: string; type: AccountType; initialBalance: number; currentBalance: number; notes: string | null; createdAt: string; updatedAt: string; }
export interface Category { id: string; name: string; type: CategoryType; color: string; icon: string | null; }
export interface Transaction { id: string; type: TransactionType; amount: number; date: string; description: string; notes: string | null; accountId: string; transferAccountId: string | null; categoryId: string | null; transferGroupId: string | null; createdAt: string; updatedAt: string; }

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardData {
  period: { from: string; to: string };
  currency: string;
  kpis: { netWorth: number; netWorthDeltaPct: number | null; income: number; incomeDeltaPct: number | null; expenses: number; expensesDeltaPct: number | null; savings: number; savingsDeltaPct: number | null; savingsRateDeltaPp: number | null; };
  netWorthSeries: { date: string; value: number }[];
  incomeExpenseByMonth: { month: string; income: number; expenses: number }[];
  expensesByCategory: { categoryId: string; name: string; color: string; value: number }[];
}

// ── Asistente (solo consulta) ─────────────────────────────────────────────
export interface AssistantStreamMeta { period: { from: string; to: string }; currency: string; sources: string[]; disclaimer: string; }
```

> **Eliminados:** `Budget`, `BudgetStatus`, `Asset`, `AssetType`, `Valuation`, `ValuationSource`, `Debt`, `DebtType`, `Position`, `Quote`, `Goal`, `GoalStatus`, `Theme`, `CurrenciesResponse`, `ReportSummary`, `ReportByCategory`, `NetWorthPoint`, `BudgetReportRow`, `Conversation`, `AssistantActionProposal` y `AssistantActionError`.

> **Contrato:** el contrato REST vive en `backend.md` §7 (camelCase, fechas `YYYY-MM-DD`, decimales `number`). La API no publica Swagger/OpenAPI ni una referencia interactiva; cualquier cambio de endpoint debe reflejarse en estos tipos y en la doc.

### 7.4 Hooks de Query (`lib/query/*`)

- Claves consistentes: `["accounts"]`, `["transactions", page]`, `["dashboard", period]`, `["categories"]`, etc.
- Mutaciones con invalidación en cascada: al crear un movimiento se invalidan `transactions`, `accounts` y `dashboard`.
- `staleTime` corto para datos financieros; `retry` configurado.

---

## 8. Autenticación

Flujo basado en **JWT** emitido por el backend (ver `backend.md`). En web viaja en cookie `HttpOnly`; en nativo, en el header `Authorization: Bearer` con el token en almacenamiento seguro. El frontend **no** firma ni interpreta el token, solo lo transporta.

1. **Login/registro**: `POST /auth/login` → backend responde `{ user, accessToken, refreshToken }` y, en web, fija cookie. `session.ts` persiste los tokens (según plataforma) y `AuthProvider` guarda el usuario y redirige.
2. **Guard en cliente (`auth-guard.tsx`)**: envuelve el layout de `(app)`; si no hay usuario (o `GET /auth/me` falla con 401), redirige a `/login`. Es solo UX: el backend valida en cada request.
3. **Verificación inicial**: `GET /auth/me` al montar el provider para hidratar el usuario y confirmar validez. Ante `401`, limpiar estado y redirigir.
4. **Refresh**: `POST /auth/refresh` ante `401` (rotación); en web se hace con la cookie, en nativo con el refresh token guardado.
5. **Logout**: `POST /auth/logout` → backend invalida la sesión; front limpia tokens y redirige.
6. **401 global**: un interceptor del cliente lanza evento; `AuthProvider` redirige a `/login`.

---

## 9. Gráficos y analítica (distintivo)

La analítica es el diferenciador. Directrices:

- **Consistencia**: un solo módulo `lib/format.ts` para moneda/porcentaje/fecha en todos los gráficos y KPIs.
- **Tipos de gráfico por dato**:
  - Serie temporal → `Chart` de área/línea (patrimonio neto).
  - Comparación por mes → barras (ingresos vs. gastos).
  - Composición (partes de un todo) → donut (gastos por categoría).
- **Datos tabulados**: cada gráfico tiene su tabla equivalente para NFR-UA-004.
- **Período de página**: el `PeriodSelector` vive en el contenido del dashboard (FR-DAS-007); Movimientos solo pagina.
- **Moneda**: la moneda es una constante del sistema; los montos llegan calculados por el backend. El front no convierte ni ofrece cambio de moneda.

---

## 10. Asistente de IA (distintivo)

Implementación de la UI conversacional (SC-009, FR-IA-002/011/015). El backend es quien interactúa con el proveedor de IA (DeepSeek); el front solo presenta la conversación. **El asistente es de solo consulta**: no crea, edita ni elimina datos (FR-IA-015).

- **Ubicación**: en **desktop** es un widget flotante (FAB abajo a la derecha + panel flotante); en **mobile** es una **página propia** (`/assistant`), accesible desde el ítem **`Asistente`** de la barra inferior (sin FAB ni overlay). Componente `components/features/assistant/assistant-widget` (solo desktop) + `assistant-chat`; el estado del panel vive en `AssistantPanelProvider`.
- **Separación**: la orquestación del chat (envío y streaming) vive en el hook privado `assistant-chat/hooks/use-assistant-conversation`; `AssistantChat` queda como presentación.
- **Flujo**:
  1. `POST /assistant/messages` con `{ question, period? }`; el backend responde `text/event-stream` con los eventos `meta`, `token`, `done` y `error` (ver `backend.md` §7.12).
  2. UI muestra estado de carga mientras llega el stream; los `delta` se acumulan en la burbuja del asistente en vivo.
- **Transporte**: usar `fetch` + `ReadableStream`, **no `EventSource`** (no permite `Authorization` ni body). Implementado en `lib/api/assistant-stream.ts` (`streamAssistantMessage`) con callbacks `onMeta`/`onToken`/`onDone`/`onError`.

```ts
// lib/api/assistant-stream.ts — parser SSE basado en fetch (soporta cookie y Bearer)
export interface AssistantStreamHandlers {
  onMeta?: (meta: AssistantStreamMeta) => void;
  onToken?: (delta: string) => void;
  onDone?: (result: { insufficient: boolean }) => void;
  onError?: (message: string) => void;
}

export const streamAssistantMessage = (
  input: { question: string; period?: { from: string; to: string } },
  handlers: AssistantStreamHandlers,
): Promise<void> => {
  // Lee el body con ReadableStream y despacha los frames SSE: meta, token, done y error.
};
```

- **Render**: la respuesta se acumula desde los `delta` y se renderiza **Markdown de forma segura** con `components/common/markdown-text` (produce elementos React para negrita/cursiva/código/listas; **nunca** usa `dangerouslySetInnerHTML`, NFR-SEG-006). El front marca la respuesta como informativa. El `ScrollArea` de la conversación usa `min-h-0` para poder scrollear dentro del panel.
- **Límites**: si llega `done` con `insufficient: true`, mostrar el mensaje sin fallar (FR-IA-011); si llega `error`, mostrar aviso genérico y permitir reintento.
- **Seguridad de prompts**: el front **nunca** concatena datos del usuario con instrucciones de sistema; envía solo la pregunta y el período.
- **Historial**: **no hay historial en el servidor** ni propuestas/acciones. La conversación vive solo mientras el panel está montado; no se persiste conversación ni token.
- **Modo mock**: con `NEXT_PUBLIC_USE_MOCKS` (default) el asistente responde desde `lib/mocks`, simulando el stream por palabras y sin llamar a DeepSeek.
- **Modo en vivo (`NEXT_PUBLIC_ASSISTANT_LIVE=true`)**: aunque el resto siga mockeado, el asistente hace el `POST /assistant/messages` real contra `NEXT_PUBLIC_API_URL` y responde con DeepSeek. La ruta del API es pública-condicionada a desarrollo (usa el usuario demo); en producción requiere sesión.

> **Eliminados:** acciones de escritura y su confirmación (token de un solo uso, orden por plan), historial de conversaciones (local y en el servidor), entrada por voz (`MediaRecorder` / Web Speech) y el interruptor de IA en Ajustes.

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
- La **moneda del sistema** llega en las respuestas con dinero (`currency`) y se usa para formatear; no hay preferencia de usuario ni selector.
- `date-fns` para cálculos de rangos del `DatePicker`; formateo siempre con `Intl`.

---

## 12. Requerimientos no funcionales del front

| NFR | Implementación en front |
| :--- | :--- |
| NFR-UA-001 (responsive ≥360px) | Mobile-first; en móvil la navegación es una barra inferior estilo app; las listas usan `DataList` (sin tablas). |
| NFR-UA-002 (teclado) | Radix/shadcn aseguran foco; no remover estilos de focus. |
| NFR-UA-003 (labels/ayudas/errores) | `FormField` de shadcn con `Label`, `FormMessage`, `FormDescription`. |
| NFR-UA-004 (gráficos accesibles) | `aria-label` + tabla alternativa (§6.4). |
| NFR-UA-005 (no solo color) | Estados con icono + texto + color (§6.3). |
| NFR-PR-001 (<3s) | `Skeleton`, prefetch en hover de links, queries en paralelo. |
| NFR-PR-002 (paginación) | `DataList` con paginación server-side. |
| NFR-PR-004 (IA cancel/timeout) | `AbortController` en el stream + botón cancelar. |
| NFR-CAL-003 (localización) | `Intl` + `date-fns` (§11). |
| NFR-CAL-005 (datos demo) | Consumir el seed del backend; ningún dato real. |
| NFR-CAL-006 (app Android con Capacitor) | El mismo build estático (`output: "export"`) corre embebido en el shell Android (§14); sesión persistente con `lib/api/token-store.ts` + `@capacitor/preferences` (Bearer + refresh por body) y safe-areas (`env(safe-area-inset-bottom)`) en la barra inferior y los bottom sheets, con las barras del sistema pintadas por el plugin `NativeBars`. iOS diferido. |

> **Eliminados:** NFR-PR-003 (cotizaciones) y NFR-CAL-002 (temas).

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

El mismo código web se empaqueta en apps iOS/Android con Capacitor (**NFR-CAL-006**: Android en esta versión; iOS diferido). No hay fork de UI: se reutiliza 100% de `app/`, `components/`, `lib/`.

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

### 14.2 URL de la API y CORS

- **Web dev**: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`.
- **Nativo**: la API debe ser alcanzable por el dispositivo (URL HTTPS pública); `localhost` no sirve. El valor se fija con `client/.env.native` (git-ignored); `scripts/android.sh` lo exporta antes de `npm run build`.
- El backend debe habilitar CORS para el origen nativo (`capacitor://localhost` en iOS; `https://localhost` en Android con Capacitor 8, `http://localhost` en versiones previas). Se configura con `CORS_ORIGIN_NATIVE`; la auth nativa no depende de cookies.

### 14.3 Autenticación en nativo

- Las cookies `HttpOnly` no son confiables en el webview (contexto cross-site); se usa el flujo Bearer (ver §7.1/§7.2 y `backend.md` §6).
- `lib/api/token-store.ts`: access token en memoria, refresh token persistido con `@capacitor/preferences`. `lib/api/client.ts` inyecta `Authorization: Bearer` y, ante `401`, refresca con `{ refreshToken }` en el body para rotar el par.
- El `AuthGuard` y el manejo de `401` son idénticos a web; solo cambia la fuente del token (cookie vs Bearer).

### 14.4 Plugins de plataforma

| Necesidad | Plugin |
| :--- | :--- |
| Refresh token persistente | `@capacitor/preferences` (instalado) |
| Access token en keychain (endurecimiento pendiente) | `capacitor-secure-storage-plugin` |
| Barra de estado / navigation bar | Plugin nativo propio `NativeBars` (status + navigation) + safe-areas CSS `env(safe-area-inset-*)` |
| Backend en dev | `NEXT_PUBLIC_API_URL` desde `.env.native` (lo exporta `scripts/android.sh` antes del build) |

### 14.5 Consideraciones

- **SSE del asistente** funciona en el webview; asegurar CORS del endpoint y timeout/cancel en el cliente (NFR-PR-004).
- **Safe areas / notch** (NFR-CAL-006): la barra inferior (`mobile-tab-bar`) y los bottom sheets (`ResponsiveDialogContent`) aplican `env(safe-area-inset-bottom)`; arriba no hace falta `safe-area-inset-top` porque el proyecto Android desactiva el edge-to-edge (`android:windowOptOutEdgeToEdgeEnforcement`) y la status/navigation bar las pinta `NativeBars`.
- **Sin APIs server-only**: no usar `cookies()`, `headers()`, Server Actions ni Route Handlers en el flujo de datos (ya excluidos por convención, §13).

---

## 15. Plan de trabajo por tandas

Progresivo y validable al final de cada tanda. Cada tanda deja la app compilando (`npm run lint && npm run build`) y consumiendo endpoints ya existentes en el backend (ver plan equivalente en `backend.md`).

### Tanda 0 — Setup del proyecto — ✅ Hecho
- Crear Next.js + TS + Tailwind, inicializar shadcn, instalar deps.
- `next.config.ts` con `output: "export"` e `images: { unoptimized: true }`.
- `Providers` (Query, Auth), `globals.css`, `layout` root y `auth-guard.tsx`.
- **Aceptación**: app corre, build estático (`npm run build`) genera `out/`, estructura de carpetas creada.

### Tanda 1 — Shell de app + Autenticación — ✅ Hecho
- Sidebar (desktop) + `mobile-tab-bar.tsx` (barra inferior flotante móvil), `(auth)` y `(app)` layouts, `auth-guard.tsx`.
- Páginas login/register con RHF+Zod, `AuthProvider`, `use-auth`.
- `lib/api/client.ts`, `session.ts` (cookie + bearer), `types.ts`; `users.ts` (`PATCH /users/me`).
- **Aceptación**: registro/login/logout + edición del perfil funcionales; rutas protegidas; navegación desktop/móvil correcta.

### Tanda 2 — Cuentas y Movimientos — ✅ Hecho
- **Cuentas** viven en `/dashboard`, con detalle en `/accounts/detail`; eliminación directa con confirmación (FR-CUE-003/005).
- Movimientos con paginación, transferencia (colapsada a una fila) y CRUD en `/transactions`.
- `Amount`, `CategoryBadge`, `DataList` / `DataListItem`.
- **Aceptación**: HU-001 y HU-002 completas.

### Tanda 3 — Dashboard — ✅ Hecho
- Inicio "Tu resumen": layout fijo con patrimonio neto (`NetWorthHero`), ingresos vs. gastos, gastos por categoría y sección de Cuentas.
- `EmptyState`, `ErrorState`, `PeriodSelector`, `CategoryDonut`, `IncomeExpenseChart`.
- **Aceptación**: FR-DAS-001..004, 007, 008.

### Tanda 4 — Categorías (solo lectura) + Perfil/Ajustes — ✅ Hecho
- Página `/categories` con tabs Gastos/Ingresos sobre el catálogo fijo (FR-TRX-002).
- `/profile` (hub) y `/settings` (nombre del perfil), cierre de sesión.
- **Aceptación**: FR-TRX-002, FR-AUT-001/002.

### Tanda 5 — Asistente IA (solo consulta) — ✅ Hecho (mock)
- Chat con streaming (`fetch` + `ReadableStream`, eventos SSE), cancelar, render Markdown seguro, insuficiencia.
- Sin historial, sin acciones y sin entrada por voz.
- **Aceptación**: HU-006 (FR-IA-002/011/015).

### Tanda 6 — Pulido y NFRs — ◐ Parcial
- A11y, responsive 360px, estados vacíos, loading skeletons.
- Refinar la barra inferior móvil: safe-areas, transiciones y estado activo accesible.
- **Aceptación**: cumplimiento de NFR-UA/PR/CAL del §12.

### Tanda 7 — Empaquetado móvil (Capacitor) — ◐ Parcial
- Android (hecho, NFR-CAL-006): `@capacitor/core`, `cli`, `android`, `capacitor.config.ts` y `cap add android`; helper `scripts/android.sh` (`npm run android`).
- iOS (pendiente): `@capacitor/ios` + `cap add ios`.
- Sesión nativa (hecho): `lib/api/token-store.ts` + `@capacitor/preferences`, Bearer y refresh por body en `lib/api/client.ts`; keychain del access token como endurecimiento pendiente.
- **Aceptación**: la app corre en Android (y luego iOS) contra la API, con sesión persistente.
