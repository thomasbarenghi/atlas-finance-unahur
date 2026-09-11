# Atlass Fin — Documento Técnico del Frontend

> **Audiencia:** agentes de IA que implementarán el frontend.
> **Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS · shadcn/ui · Recharts · TanStack Query · React Hook Form + Zod · Capacitor (iOS/Android).
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
| UI | shadcn/ui + Tailwind CSS | Tailwind 3.x / 4.x según init de shadcn |
| Estilos | CSS variables + `cn()` | — |
| Gráficos | Recharts (base del componente `Chart` de shadcn) | 2.x |
| Estado servidor | TanStack Query | 5.x |
| Formularios | React Hook Form + Zod | RHF 7.x, Zod 3.x |
| Validación | Zod (compartida conceptualmente con el back) | 3.x |
| Auth | JWT: cookie `HttpOnly` (web) o `Authorization: Bearer` (nativo) | — |
| HTTP | `fetch` nativo dentro de un cliente tipado | — |
| Móvil | Capacitor (iOS/Android) | 6.x |
| Iconos | @gravity-ui/icons | — |
| Fechas | `date-fns` (compatible con DatePicker de shadcn) | 3.x |
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
    ├── /dashboard            # indicadores, gráficos, alertas (SC-002)
    ├── /accounts             # CRUD de cuentas (SC-003)
    ├── /transactions         # listado + alta/edición (SC-004)
    ├── /budgets              # control por categoría/período (SC-005)
    ├── /assets               # activos, inversiones, deudas (SC-006)
    ├── /goals                # metas financieras (SC-007)
    ├── /reports              # resumen, export, print (SC-008)
    ├── /assistant            # chat con la IA (SC-009)
    └── /settings             # perfil, moneda, tema, privacidad, IA (SC-010)
```

**Reglas de enrutamiento:**

- La protección de rutas vive en un **`AuthGuard` en cliente** (componente que envuelve el layout de `(app)`): si no hay sesión, redirige a `/login`. El backend valida la autorización en cada request, así que el guard es solo UX (FR-AUT-004).
- `(app)` comparte un `layout.tsx` con la navegación (sidebar en desktop / barra inferior en móvil), `Header` (selector de período/moneda global) y el provider de TanStack Query.
- Toda página de `(app)` se renderiza tras una verificación de sesión; los datos se cargan en cliente vía Query.
- **Sin `middleware.ts`** (o solo como optimización opcional en web): en el build estático/Capacitor no existe, por lo que la barrera real es el guard en cliente + el backend.

**Navegación responsive (web + app):**

- **Desktop (≥ `md`)**: `Sidebar` lateral fija con las secciones y accesos de perfil/configuración.
- **Móvil (< `md`)**: la navegación se convierte en una **barra inferior estilo app móvil** (flotante, separada del borde, con bordes redondeados), como en las apps nativas. Se detecta por viewport (`matchMedia` / CSS), no por plataforma. El estilo visual es propio; se toma como referencia (no como requisito) la estética "Liquid Glass" de iOS 26.
- La barra inferior tiene **5 ítems**: `Inicio`, `Movimientos`, un **botón central prominente** de acción rápida (`+` crear movimiento), `Reportes` y **`Ajustes`** (ícono de engranaje).
- **`Ajustes`** es el hub que agrupa el resto: las secciones que no están en la barra (Cuentas, Presupuestos, Activos, Objetivos, Asistente) y las configuraciones (perfil, moneda base, tema, IA/privacidad, sesión). Reemplaza al "Menú de más": se comporta como una pestaña más, no como un `Sheet` superpuesto.
- Estado activo con ícono + label, respetando NFR-UA-005 (no solo color); safe-areas (`env(safe-area-inset-bottom)`) para el notch/gesto de home.
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

Vista de aterrizaje con `Skeleton` mientras cargan los queries en paralelo.

- **KPIs superiores** (FR-DAS-001): 4 tarjetas `Card` — Patrimonio neto, Ingresos, Gastos, Ahorro (flujo de fondos) del período. Cada una con ícono, monto formateado en moneda base y variación vs. período anterior.
- **Evolución de patrimonio** (FR-DAS-002): `Chart` de área/línea.
- **Ingresos vs. gastos por mes** (FR-DAS-003): `Chart` de barras agrupadas.
- **Gastos por categoría** (FR-DAS-004): `Chart` donut con leyenda clicable y `Table` alternativa accesible (NFR-UA-004).
- **Composición de activos** (FR-DAS-005): `Chart` de barras horizontales o donut por tipo de activo.
- **Alertas de presupuesto** (FR-DAS-006): lista de `Badge`/`Alert` para presupuestos en advertencia o excedidos, con `Progress`.
- **Selector de período/moneda** (FR-DAS-007): `Select` en el header (30/90 días, 6/12 meses, rango personalizado con `DatePicker`).
- **Estados vacíos** (FR-DAS-008): componente `EmptyState` reutilizable con CTA ("Cargá tu primera cuenta", "Registrá un movimiento", etc.).

### 4.3 `/accounts` — SC-003 (FR-CUE-001..005)

- **Listado** en `DataTable` (shadcn) con columnas: nombre, tipo (`Badge`), moneda, saldo inicial, saldo actual (calculado), estado.
- **Filtros:** búsqueda por nombre; filtro por tipo/estado (activa/archivada).
- **Crear/editar** vía `Dialog` con `Form`: nombre, tipo (`Select` con `Efectivo`, `Bancaria`, `Billetera`, `Tarjeta`, `Otra`), moneda, saldo inicial, observaciones (FR-CUE-001/002).
- **Archivar/restaurar** con `DropdownMenu` + `AlertDialog` de confirmación. Una archivada conserva historial y no admite movimientos (FR-CUE-005).
- **Saldo actual** lo devuelve el backend; el front solo lo muestra (FR-CUE-004).

### 4.4 `/transactions` — SC-004 (FR-TRX-001..010)

- **Tabla filtrable** (`DataTable`) con paginación (NFR-PR-002): fecha, descripción, categoría (`Badge` con color), cuenta, tipo, monto (color por signo), moneda.
- **Filtros** (FR-TRX-006): rango de fechas (`DatePicker` range), tipo (`Select` ingreso/gasto/transferencia), cuenta, categoría.
- **Búsqueda** (FR-TRX-007): `Input` con debounce sobre descripción/notas.
- **Alta/edición** en `Dialog` + `Form` (FR-TRX-001/002/003): tipo, monto positivo (validado `> 0`), moneda, fecha, cuenta, categoría, descripción, notas. Si es transferencia, selector origen/destino que excluye la otra cuenta elegida (FR-TRX-004).
- **Eliminar** con `AlertDialog` de confirmación.
- **Categorías personalizadas** (FR-TRX-008): gestión en el mismo módulo (ver §4.11).
- **CSV** (FR-TRX-009, P2) y **recurrentes** (FR-TRX-010, P2): marcados como fases futuras.

### 4.5 `/budgets` — SC-005 (FR-PRE-001..006)

- **Listado por período** (`Tabs` o selector de mes): cada fila = categoría con `Progress` y `Badge` de estado.
- **Métricas por presupuesto** (FR-PRE-002/004): límite, gasto acumulado, disponible, % consumido.
- **Estados** (FR-PRE-003): `Disponible`, `Advertencia` (≥ umbral), `Excedido` (> 100%). Color + texto + icono (NFR-UA-005).
- **Crear** (FR-PRE-001): categoría + mes + límite + moneda.
- **Copiar mes anterior** (FR-PRE-005, P1): botón "Copiar del mes anterior".
- **Editar/eliminar** con confirmación (FR-PRE-006).

### 4.6 `/assets` — SC-006 (FR-ACT-001..008)

Página con `Tabs` internos: **Activos**, **Inversiones/Posiciones**, **Deudas**.

- **Activos** (FR-ACT-001/003/007): CRUD con tipo (`Propiedad`, `Vehículo`, `Efectivo`, `Inversión`, `Criptoactivo`, `Otro`), nombre, moneda, valor, fecha de valuación, notas. Historial de valuaciones en `Sheet` (FR-ACT-004): nueva valuación agrega, no sobrescribe.
- **Posiciones** (FR-ACT-005/006): instrumento/símbolo, cantidad, costo promedio, moneda. Se muestra valor actual y ganancia/pérdida nominal (`Chart` de sparkline opcional) cuando hay cotización (FR-ACT-006, CAL-005/006).
- **Deudas** (FR-ACT-002/007): tipo (`Préstamo`, `Hipoteca`, `Tarjeta`, `Otra`), saldo, moneda, fecha. Vinculación a activo (FR-ACT-008, P1).
- **Cotización desactualizada**: `Badge` de advertencia con fecha real (FR-MER-005).

### 4.7 `/goals` — SC-007 (FR-OBJ-001..004)

- **Tarjetas** `Card` por objetivo: nombre, monto meta, acumulado, moneda, fecha opcional, `Progress` de avance (CAL-007, mínimo visual 0%).
- **Estados** (FR-OBJ-004): `Pendiente`, `En curso`, `Alcanzado`, `Vencido` con `Badge`.
- **Actualizar acumulado** (FR-OBJ-003) y crear (FR-OBJ-001) vía `Dialog`.

### 4.8 `/reports` — SC-008 (FR-REP-001..007)

- **Filtros**: período (rango), moneda de visualización.
- **Resumen financiero** (FR-REP-001): KPIs + tabla.
- **Desglose por categoría** (FR-REP-002): tabla + `Chart` de barras.
- **Evolución de patrimonio** (FR-REP-003): `Chart` de línea.
- **Cumplimiento de presupuesto** (FR-REP-004): `Progress` por categoría.
- **Rendimiento de inversiones** (FR-REP-005, P1).
- **Exportar CSV** (FR-REP-006): botón que descarga con filtros aplicados (endpoint de export).
- **PDF/imprimible** (FR-REP-007, P2).

### 4.9 `/assistant` — SC-009 (FR-IA-001..011)

Ver §10. Conversación en `ScrollArea`, `Textarea` + `Button` de enviar, `Alert` de alcance y disclaimer de no-asesoramiento.

### 4.10 `/settings` — SC-010

- **Perfil:** `PATCH /users/me` con nombre (email no editable en esta versión).
- **Moneda base** (FR-AUT-005): `Select` poblado con `GET /currencies`; al guardar con `PATCH /users/me { baseCurrency }` se invalidan globalmente los queries.
- **Tema** (FR-AUT-006): `RadioGroup`/`Select` claro/oscuro/automático; se persiste con `PATCH /users/me { theme }` (además de `next-themes` local).
- **Privacidad:** habilitar/deshabilitar IA con `PATCH /users/me { aiEnabled }` (FR-IA-001) y borrar historial del asistente (`DELETE /assistant/conversations`, FR-IA-009, `AlertDialog`).
- **Sesión:** cerrar sesión (`POST /auth/logout`, FR-AUT-002).

### 4.11 Gestión de categorías (compartida) — FR-TRX-008

Módulo accesible desde `/transactions` y `/budgets` (o sección propia en configuración): CRUD con nombre, tipo (ingreso/gasto), color/icono, estado. El color se usa como `Badge` en toda la app. Las **categorías del sistema** (`isSystem: true`) se muestran pero no se editan ni eliminan; el usuario solo gestiona las suyas.

---

## 5. Estructura de archivos

```
client/
├── app/
│   ├── layout.tsx                 # root: html/body, Providers, theme
│   ├── globals.css                # CSS vars de shadcn + tailwind
│   ├── page.tsx                   # redirect según sesión
│   ├── (auth)/
│   │   ├── layout.tsx             # centrado, branding
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── (app)/
│       ├── layout.tsx             # Sidebar + Header + Providers
│       ├── dashboard/page.tsx
│       ├── accounts/page.tsx
│       ├── transactions/page.tsx
│       ├── budgets/page.tsx
│       ├── assets/page.tsx
│       ├── goals/page.tsx
│       ├── reports/page.tsx
│       ├── assistant/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                        # generado por shadcn (NO editar a mano salvo variantes)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── mobile-tab-bar.tsx       # barra inferior estilo app móvil (incluye Ajustes)
│   │   ├── header.tsx
│   │   ├── period-selector.tsx
│   │   ├── currency-selector.tsx
│   │   └── auth-guard.tsx           # guard de sesión en cliente (rutas de (app))
│   ├── charts/                    # wrappers de shadcn Chart
│   │   ├── net-worth-chart.tsx
│   │   ├── income-expense-chart.tsx
│   │   ├── category-donut.tsx
│   │   └── asset-composition-chart.tsx
│   ├── kpi-card.tsx
│   ├── empty-state.tsx
│   ├── data-table/                # wrapper reutilizable de DataTable
│   └── forms/                     # componentes de formulario por dominio
├── lib/
│   ├── utils.ts                   # cn()
│   ├── api/
│   │   ├── client.ts              # fetch tipado; inyecta token (cookie o bearer)
│   │   ├── types.ts               # DTOs / contratos del backend
│   │   ├── session.ts             # abstracción: get/set/clear token según plataforma
│   │   └── endpoints.ts           # funciones por recurso
│   ├── query/                     # hooks de TanStack Query por dominio
│   │   ├── auth.ts
│   │   ├── users.ts               # perfil y preferencias (PATCH /users/me)
│   │   ├── reference.ts           # GET /currencies, catálogo de mercado
│   │   ├── accounts.ts
│   │   ├── categories.ts
│   │   ├── transactions.ts
│   │   ├── budgets.ts
│   │   ├── assets.ts              # activos + valuaciones
│   │   ├── debts.ts
│   │   ├── positions.ts
│   │   ├── quotes.ts
│   │   ├── dashboard.ts
│   │   ├── goals.ts
│   │   ├── reports.ts
│   │   └── assistant.ts
│   ├── format.ts                  # formatCurrency, formatDate, formatPercent
│   └── validation/                # schemas Zod por formulario
├── hooks/
│   ├── use-auth.ts
│   └── use-user-preferences.ts
├── providers/
│   ├── query-provider.tsx
│   ├── theme-provider.tsx
│   └── auth-provider.tsx
├── capacitor.config.ts             # config de Capacitor (appId, webDir: out)
├── android/                        # proyecto Android (generado por Capacitor)
├── ios/                            # proyecto iOS (generado por Capacitor)
├── next.config.ts                  # output: "export", images: unoptimized
├── tailwind.config.ts
├── components.json                # config de shadcn
├── tsconfig.json
├── package.json
└── .env.local                     # NEXT_PUBLIC_API_URL, etc. (no versionar)
```

**Notas:**

- Los componentes de `components/ui/` se instalan con el CLI de shadcn y se extienden con variantes solo si es necesario.
- Cada dominio de datos tiene su archivo de hooks en `lib/query/`, que encapsula las `queryKey`s y las mutaciones con su invalidación.
- Los schemas Zod viven en `lib/validation/` y reflejan los DTOs de `lib/api/types.ts`.
- `next.config.ts` usa `output: "export"` e `images: { unoptimized: true }` para generar el estático que Capacitor sirve (`webDir: out`).
- No existe `middleware.ts`: el guard de sesión es `auth-guard.tsx` en cliente. La seguridad real la impone el backend.

---

## 6. Integración de shadcn/ui

### 6.1 Instalación

```bash
npx create-next-app@latest client --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd client
npx shadcn@latest init          # elegir: style new-york, base color neutral, CSS variables = yes
npx shadcn@latest add button card input label form select dialog alert alert-dialog
npx shadcn@latest add dropdown-menu table badge tabs sheet progress skeleton
npx shadcn@latest add scroll-area textarea switch radio-group date-picker chart sonner tooltip separator
npx shadcn@latest add breadcrumb avatar
```

> **Iconos**: shadcn genera componentes con `lucide-react` por defecto; se reemplazan por `@gravity-ui/icons`. Instalar con `npm i @gravity-ui/icons` y sustituir los imports `from "lucide-react"` por el ícono equivalente. Importar por nombre (p. ej. `import { ArrowRight } from "@gravity-ui/icons"`), o preferir la ruta por ícono (`import ArrowRight from "@gravity-ui/icons/ArrowRight"`) para mejor tree-shaking. Los SVGs no traen color ni tamaño fijos: controlar con `className` (`h-4 w-4`) y `currentColor`, igual que hacen los componentes de shadcn. No mezclar ambas librerías.

### 6.2 Theming (FR-AUT-006, NFR-CAL-002)

- Se conservan las CSS variables en `globals.css` (`--background`, `--foreground`, `--primary`, etc.) en `.light` y `.dark`.
- `next-themes` aplica la clase `dark` en `<html>` con `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
- **Regla**: nunca usar colores hardcodeados; siempre `bg-background`, `text-foreground`, `border-border`, `bg-muted`, etc., o tokens `primary/destructive/success/warning`.
- Se agregan tokens semánticos propios: `--success`, `--warning`, `--destructive` para estados financieros (positivo/negativo/advertencia), usados por `Badge` y `Progress`.

### 6.3 Componentes financieros reutilizables

- **`Amount`**: formatea monto con signo y color (`success` positivo ingreso, `destructive` gasto, `muted` transferencia). Respeta NFR-UA-005 (signo + color, no solo color).
- **`KpiCard`**: título, valor, ícono, delta opcional.
- **`EmptyState`**: ícono, título, descripción, acción CTA (FR-DAS-008).
- **`CategoryBadge`**: `Badge` con el color de la categoría.
- **`BudgetStatusBadge`**: Disponible/Advertencia/Excedido.
- **`DataTable`**: wrapper de shadcn `Table` con paginación, sorting y toolbar de filtros.

### 6.4 Chart (Recharts)

- El componente `chart` de shadcn provee `ChartContainer`, `ChartTooltip`, `ChartLegend` y configuración de colores vía CSS vars.
- **Accesibilidad (NFR-UA-004)**: cada gráfico va acompañado de un `aria-label` y, en la misma página o en una pestaña, una `Table` con los mismos datos.
- Los datos de gráficos se adaptan con `useMemo` a la estructura que Recharts espera.

---

## 7. Capa de datos y API client

### 7.1 Cliente HTTP (`lib/api/client.ts`)

- `fetch` nativo con `credentials: "include"` en web para la cookie de sesión.
- En nativo, inyecta `Authorization: Bearer <accessToken>` obtenido de `lib/api/session.ts`.
- Base URL desde `process.env.NEXT_PUBLIC_API_URL` (p. ej. `http://localhost:3001/api` en dev; URL pública HTTPS en producción/nativo).
- Normaliza errores a `ApiError { statusCode, code, message, fieldErrors? }` (catálogo en `backend.md` §7.17); maneja `401` lanzando `UnauthorizedError` e intenta **un** refresh antes de redirigir a login.
- Expone `get<T>`, `post<T>`, `patch<T>`, `del<T>` tipadas y un helper `apiFetch` de bajo nivel (usado por el parser SSE de §10).

### 7.2 Sesión (`lib/api/session.ts`)

Abstrae el almacenamiento del token según plataforma, sin que el resto del código sepa cuál se usa:

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
export interface Category { id: string; name: string; type: CategoryType; color: string; icon: string | null; archived: boolean; isSystem: boolean; }
export interface Transaction { id: string; type: TransactionType; amount: number; currency: string; date: string; description: string; notes: string | null; accountId: string; categoryId: string | null; transferGroupId: string | null; createdAt: string; updatedAt: string; }
export interface Budget { id: string; categoryId: string; category: Pick<Category, "id" | "name" | "color">; period: string; limit: number; currency: string; spent: number; available: number; consumedPct: number; status: BudgetStatus; }
export interface Asset { id: string; name: string; type: AssetType; currency: string; currentValue: number; valuationDate: string; archived: boolean; notes: string | null; createdAt: string; updatedAt: string; }
export interface Valuation { id: string; assetId: string; value: number; currency: string; date: string; source: ValuationSource; createdAt: string; }
export interface Debt { id: string; name: string; type: DebtType; balance: number; currency: string; date: string; archived: boolean; assetId: string | null; createdAt: string; updatedAt: string; }
export interface Position { id: string; symbol: string; instrument: string; quantity: number; avgCost: number; currency: string; currentPrice: number | null; currentValue: number | null; costBasis: number; profitLoss: number | null; profitLossPct: number | null; quoteDate: string | null; quoteProvider: string | null; isStale: boolean; }
export interface Quote { symbol: string; price: number; currency: string; provider: string; change24h: number | null; fetchedAt: string; isStale: boolean; }
export interface Goal { id: string; name: string; targetAmount: number; savedAmount: number; currency: string; targetDate: string | null; progressPct: number; status: GoalStatus; createdAt: string; updatedAt: string; }

// ── Dashboard / reportes ──────────────────────────────────────────────────
export interface DashboardData {
  period: { from: string; to: string };
  currency: string;
  kpis: { netWorth: number; netWorthDeltaPct: number | null; income: number; incomeDeltaPct: number | null; expenses: number; expensesDeltaPct: number | null; savings: number; savingsDeltaPct: number | null; };
  netWorthSeries: { date: string; value: number }[];
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
export function QueryProvider({ children }) {
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
- **Período global**: el `PeriodSelector` del header controla el período; se refleja en `dashboard` y `reports` (FR-DAS-007).
- **Cambio de moneda**: el `CurrencySelector` recarga los agregados usando tasas del backend (FR-DAS-007, CAL-008). Los montos siempre llegan calculados; el front no convierte.

---

## 10. Asistente de IA (distintivo)

Implementación de la UI conversacional (SC-009, FR-IA-001..011). El backend es quien interactúa con el proveedor de IA; el front solo presenta la conversación.

- **Flujo**:
  1. Si la IA está deshabilitada (`user.aiEnabled === false`, FR-IA-001), mostrar `Alert` con CTA a `/settings`.
  2. `POST /assistant/messages` con `{ question, conversationId, period, currency }`; el backend responde `text/event-stream` con los eventos `meta`, `token`, `done`, `error` (ver `backend.md` §7.16).
  3. UI muestra estado de carga mientras llega el stream, con botón **cancelar** (NFR-PR-004).
- **Transporte**: usar `fetch` + `ReadableStream`, **no `EventSource`** (no permite `Authorization` ni body). El `conversationId` devuelto en `meta` se reutiliza para preguntas siguientes.
- **Render**: la respuesta se acumula desde los `delta` y se muestra como texto plano (nunca HTML sin sanitizar, NFR-SEG-006). El front marca la respuesta como informativa (FR-IA-008).
- **Historial** (FR-IA-009): listado de conversaciones pasadas (`GET /assistant/conversations`), eliminar individual o todo (con `AlertDialog`).
- **Límites**: si llega `done` con `insufficient: true`, mostrar el mensaje sin fallar (FR-IA-011); si llega `error`, mostrar aviso genérico y permitir reintento.
- **Seguridad de prompts**: el front **nunca** concatena datos del usuario con instrucciones de sistema; envía solo la pregunta y el período (FR-IA-010).

```ts
// lib/api/stream.ts — parser SSE basado en fetch (soporta cookie y Bearer)
export type AssistantEvent =
  | { type: "meta"; data: AssistantStreamMeta }
  | { type: "token"; data: { delta: string } }
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
export const formatCurrency = (value: number, currency: string, locale?: string) =>
  new Intl.NumberFormat(locale ?? navigator.language, { style: "currency", currency }).format(value);

export const formatDate = (iso: string, locale?: string) =>
  new Intl.DateTimeFormat(locale ?? navigator.language, { dateStyle: "medium" }).format(new Date(iso));

export const formatPercent = (v: number, locale?: string) =>
  new Intl.NumberFormat(locale ?? navigator.language, { style: "percent", maximumFractionDigits: 1 }).format(v);
```

- `navigator.language` como locale por defecto (NFR-CAL-003).
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
| NFR-PR-002 (paginación) | `DataTable` con paginación server-side. |
| NFR-PR-003 (cotizaciones) | Mostrar `isStale` y la fecha real del último precio sin ocultar datos. |
| NFR-PR-004 (IA cancel/timeout) | `AbortController` en el stream + botón cancelar. |
| NFR-CAL-002 (temas) | Tokens light/dark sin pérdida de contraste. |
| NFR-CAL-003 (localización) | `Intl` + `date-fns` (§11). |
| NFR-CAL-005 (datos demo) | Consumir el seed del backend; ningún dato real. |

---

## 13. Convenciones de código

- **Componentes**: funciones flecha, `export function`; archivos `kebab-case.tsx`. Un componente por archivo (salvo variantes pequeñas).
- **Client/Server**: las páginas de `(app)` son componentes cliente; no usar Server Components, Server Actions, Route Handlers ni APIs server-only (cookies/headers) para que el build sea estático y portable a Capacitor.
- **Tipado**: `strict`; usar `interface` para DTOs y `type` para uniones; evitar `any`.
- **Imports**: path alias `@/`; orden: externos, internos (`@/lib`, `@/components`), relativos.
- **Estilos**: Tailwind + `cn()`; evitar CSS inline.
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
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Atlass Fin" com.atlassfin.app --web-dir out
npx cap add ios
npx cap add android
npm run build && npx cap sync
npx cap open ios      # o: npx cap open android
```

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
| Barra de estado / safe-areas | `@capacitor/status-bar` + CSS `env(safe-area-inset-*)` |
| Backend local en dev | `server.url` en `capacitor.config.ts` |

### 14.5 Consideraciones

- **SSE del asistente** funciona en el webview; asegurar CORS del endpoint y timeout/cancel en el cliente (NFR-PR-004).
- **Descargas**: en web el CSV se baja como blob; en nativo se escribe con `Filesystem` y se comparte con `Share`.
- **Safe areas / notch**: aplicar `env(safe-area-inset-top/bottom)` en el layout móvil.
- **Sin APIs server-only**: no usar `cookies()`, `headers()`, Server Actions ni Route Handlers en el flujo de datos (ya excluidos por convención, §13).

---

## 15. Plan de trabajo por tandas

Progresivo y validable al final de cada tanda. Cada tanda deja la app compilando (`npm run lint && npm run build`) y consumiendo endpoints ya existentes en el backend (ver plan equivalente en `backend.md`).

### Tanda 0 — Setup del proyecto
- Crear Next.js + TS + Tailwind, inicializar shadcn, instalar deps.
- `next.config.ts` con `output: "export"` e `images: { unoptimized: true }`.
- `Providers` (Query, Theme, Auth), `globals.css`, `layout` root y `auth-guard.tsx`.
- **Aceptación**: app corre, tema funciona, build estático (`npm run build`) genera `out/`, estructura de carpetas creada.

### Tanda 1 — Shell de app + Autenticación
- Sidebar (desktop) + `mobile-tab-bar.tsx` (barra inferior flotante móvil), `(auth)` y `(app)` layouts, `auth-guard.tsx`.
- Páginas login/register/forgot-password con RHF+Zod, `AuthProvider`, `use-auth`.
- `lib/api/client.ts`, `session.ts` (cookie + bearer), `types.ts` y `reference.ts` (`GET /currencies`); `users.ts` (`PATCH /users/me`).
- **Aceptación**: registro/login/logout + edición de preferencias funcionales; rutas protegidas; navegación desktop/móvil correcta.

### Tanda 2 — Cuentas y Movimientos
- CRUD de cuentas (tabla + dialog), CRUD de movimientos (filtros, búsqueda, transferencia).
- `DataTable`, `CategoryBadge`, `Amount`.
- **Aceptación**: HU-001 y HU-002 completas.

### Tanda 3 — Dashboard + gráficos
- KPIs, 5 gráficos, alertas de presupuesto, `EmptyState`, `PeriodSelector`.
- **Aceptación**: FR-DAS-001..008.

### Tanda 4 — Presupuestos
- Listado por período, `Progress`, estados, copiar mes, CRUD.
- **Aceptación**: HU-003 (FR-PRE-001..006).

### Tanda 5 — Activos, inversiones y deudas
- Tabs de activos/posiciones/deudas, historial de valuaciones, badges de cotización.
- **Aceptación**: HU-004, HU-005 (FR-ACT-001..008, FR-MER-005).

### Tanda 6 — Objetivos y Reportes
- Objetivos con `Progress`; reportes con filtros, gráficos y export CSV.
- **Aceptación**: FR-OBJ-001..004, FR-REP-001..006.

### Tanda 7 — Asistente IA + Configuración
- Chat con streaming (`fetch` + `ReadableStream`, eventos SSE), cancelar, historial; configuración (perfil, moneda, tema, IA, privacidad) vía `PATCH /users/me`.
- **Aceptación**: HU-006 (FR-IA-001..011), FR-AUT-005/006.

### Tanda 8 — Pulido y NFRs
- A11y, responsive 360px, estados vacíos, loading skeletons, dark mode completo.
- Refinar la barra inferior móvil: safe-areas, transiciones y estado activo accesible; pestaña de Ajustes completa.
- **Aceptación**: cumplimiento de NFR-UA/PR/CAL del §12.

### Tanda 9 — Empaquetado móvil (Capacitor)
- Instalar Capacitor (`@capacitor/core`, `cli`, `ios`, `android`), `cap init` y `cap add ios/android`.
- `session.ts` nativo: keychain + preferences; verificar login/logout con Bearer.
- Plugins de plataforma: export CSV vía `Filesystem` + `Share`, `StatusBar`/safe-areas.
- `npx cap sync` y build de prueba en simulador/emulador.
- **Aceptación**: la app corre en iOS y Android contra la API, con sesión persistente y export funcionando.

> **Nota**: las funcionalidades P2 (CSV import FR-TRX-009, recurrentes FR-TRX-010, PDF FR-REP-007) quedan fuera de la entrega inicial y se planifican aparte.
