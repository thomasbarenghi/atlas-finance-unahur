# Test Cases — Gestor Financiero Personal

| | |
|---|---|
| **Proyecto** | Gestor Financiero Personal |
| **Documento** | Casos de prueba y registro de ejecución |
| **Versión** | 1.0 |
| **Fecha** | Octubre 2026 |
| **Sponsor Operación** | Secretaría Académica UNAHUR |
| **Sponsor Organización** | UNAHUR |
| **Autor** | Barenghi, Thomas |
| **Tutor** | Prof. Ciarallo, Cristian |
| **Release** | Demostración académica 2026 |

## Historial de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0 | Octubre 2026 | Barenghi, Thomas | Versión inicial: definición operativa de los 37 casos del Plan de Pruebas v1.0 (precondiciones, datos, pasos, resultado esperado y evidencia) y registro de la primera ejecución automatizada. |

## Tabla de contenidos

- 1. Objetivo
- 2. Convenciones del documento
- 3. Resumen de la ejecución
- 4. Casos de prueba
  - 4.1 Acceso y sesión
  - 4.2 Seguridad y autorización
  - 4.3 Cuentas
  - 4.4 Movimientos
  - 4.5 Categorías
  - 4.6 Dashboard y patrimonio
  - 4.7 Cálculos
  - 4.8 Asistente de IA
  - 4.9 No funcionales y usabilidad
  - 4.10 Configuración y preferencias
- 5. Seguimiento y gestión de bugs
- 6. Trazabilidad consolidada
- 7. Cobertura pendiente y notas

## 1. Objetivo

Este documento **operacionaliza** los 37 casos definidos en el Plan de Pruebas v1.0: para cada `CP-*` fija las precondiciones, los datos, los pasos, el resultado esperado, la evidencia y el estado de ejecución. El Plan conserva la estrategia, el alcance, los criterios de entrada/salida y los riesgos; acá se registra la ejecución y se gestionan los defectos.

La implementación desplegada es la referencia de comportamiento. Si un caso y la aplicación difieren, la diferencia se registra como defecto o se corrige el caso, nunca se aprueba sin evidencia.

## 2. Convenciones del documento

**Prioridad**

| Prioridad | Criterio |
|---|---|
| **P0** | Flujo esencial o cálculo financiero; bloquea la aceptación. |
| **P1** | Aporte significativo; puede simplificarse si el cronograma lo exige. |
| **P2** | Documentado para una iteración posterior. |

**Estado del caso:** `No ejecutado → En ejecución → Aprobado / Fallado / Bloqueado` (Plan §7).

| Estado | Significado |
|---|---|
| **Aprobado** | El resultado observado coincide con el esperado y la evidencia está registrada. |
| **Parcial** | Se verificó una parte del resultado esperado; queda un criterio sin evidencia. |
| **Fallado** | El resultado observado difiere del esperado (genera un `BUG-*`). |
| **Bloqueado** | Una dependencia externa impide ejecutar el caso. |
| **No ejecutado** | El caso todavía no se ejecutó. |

**Niveles de evidencia**

| Nivel | Qué acredita |
|---|---|
| **API** | Suite de integración HTTP (`api/test/requirements/*.e2e-spec.ts`, Jest + Supertest) contra PostgreSQL de test. |
| **Unitario** | Fórmulas y servicios aislados (`api/src/**/*.spec.ts`, `client/**/*.test.ts`). |
| **Componente** | Comportamiento de la interfaz con React Testing Library y MSW (`client/**/*.test.tsx`). |
| **Inspección** | Verificación estática del código, del contrato REST o del modelo de datos cuando no hay prueba ejecutable. |

**Formato de ejecución.** Cada caso indica la fecha, el nivel de evidencia y el resultado. Una aprobación solo se registra cuando la evidencia se puede reproducir con el comando indicado.

## 3. Resumen de la ejecución

**Entorno**

| Dato | Valor |
|---|---|
| Fecha de ejecución | 30/10/2026 |
| Build | Repositorio local, rama de trabajo sobre `d552d5c` |
| Base de datos | `atlas_finance_test` (PostgreSQL local) para integración; `atlas_finance_dev` con *seed* para verificación manual |
| Proveedores externos | Cotizaciones e IA simulados en el borde en las suites de integración (sin llamadas reales) |
| Datos | *Seed* reproducible: `demo@atlassfin.app`, `sin-datos@atlassfin.app` y `ana@atlassfin.app` |

**Comandos ejecutados**

| Suite | Comando | Resultado |
|---|---|---|
| API — unitarias | `cd api && npm run test` | 22 suites · 127 pruebas aprobadas |
| API — integración | `cd api && npm run test:e2e` | 25 suites · 87 pruebas aprobadas |
| Cliente — unitarias y componentes | `cd client && npm run test` | 47 archivos · 215 pruebas aprobadas |
| **Total automatizado** | — | **429 pruebas aprobadas, 0 falladas** |

**Resumen por estado**

| Resultado | Casos |
|---|---|
| Casos definidos | 37 |
| Ejecutados | 35 |
| Aprobados | 32 |
| Parciales | 3 |
| Fallados | 0 |
| Bloqueados | 0 |
| No ejecutados | 2 |

> **Criterio de salida (Plan §8.2):** todavía **no se alcanza**, porque quedan casos P0 con cobertura parcial (`CP-CUE-02`, `CP-TRX-06`) y un caso P0 sin ejecutar (`CP-CUE-03`). No hay defectos abiertos que bloqueen la demostración.

## 4. Casos de prueba

### 4.1 Acceso y sesión

#### CP-ACC-01 · Registro de usuario

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-AUT-001 · HU-004 |
| **Precondiciones** | Aplicación accesible; base de datos sin el correo a registrar. |
| **Datos** | Nombre `Ana Pérez`, correo `ana.perez@atlassfin.app`, moneda `ARS`, contraseña `Demo1234!`; variantes inválidas: correo mal formado, contraseña `corta1`, moneda `GBP`, correo ya registrado `demo@atlassfin.app`. |
| **Pasos** | 1. Abrir `/register` y completar el formulario con los datos válidos.<br>2. Confirmar el registro.<br>3. Repetir con correo mal formado, contraseña sin número o demasiado corta, moneda no soportada y correo duplicado.<br>4. Enviar un campo inesperado por API (`POST /api/auth/register`). |
| **Resultado esperado** | Se crea el usuario con la moneda elegida, se inicia sesión y se redirige al dashboard. Las variantes inválidas se rechazan con `400` y `fieldErrors`; el duplicado con `409 EMAIL_IN_USE`; el campo inesperado con `400` (*forbidNonWhitelisted*). La contraseña se persiste con hash. |
| **Evidencia automatizada** | API: `FR-AUT-001.e2e-spec.ts` (8 pruebas: alta, hash, duplicado, email inválido, política, moneda, campos faltantes, campos inesperados). Cliente: `app/(auth)/_components/__tests__/auth-forms.test.tsx` (registro, política y confirmación, contraseñas distintas). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-ACC-02 · Inicio y cierre de sesión

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-AUT-002 · NFR-SEG-001 · NFR-SEG-004 · HU-004 |
| **Precondiciones** | Usuario `demo@atlassfin.app` con contraseña `Demo1234!`. |
| **Datos** | Credenciales del seed; contraseña incorrecta `Demo9999!`; cookie de *refresh* eliminada. |
| **Pasos** | 1. Iniciar sesión desde `/login`.<br>2. Verificar la navegación y las cookies emitidas.<br>3. Cerrar sesión.<br>4. Intentar volver a `/dashboard`.<br>5. Renovar el *access token* con la cookie de *refresh*.<br>6. Reutilizar el *access token* como si fuera de *refresh*. |
| **Resultado esperado** | La sesión inicia y redirige al dashboard; las cookies son `HttpOnly`, con `SameSite`, `Path=/` y expiración. El cierre limpia las cookies y las rutas financieras redirigen al acceso. El *refresh* emite un token nuevo y rechaza un *access token* en su lugar. El token ya emitido sigue vigente hasta expirar (JWT stateless). |
| **Evidencia automatizada** | API: `FR-AUT-002.e2e-spec.ts` (7) y `NFR-SEG-004.e2e-spec.ts` (4). Cliente: `auth-forms.test.tsx` (login y credenciales inválidas), `components/layout/__tests__/layout.test.tsx` (cierre de sesión) y `providers/__tests__/providers.test.tsx` (guarda de sesión). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

### 4.2 Seguridad y autorización

#### CP-SEG-01 · Aislamiento entre usuarios

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · NFR-SEG-001 · HU-011 |
| **Precondiciones** | Dos usuarios con datos: `demo@atlassfin.app` y `ana@atlassfin.app`; identificadores de cuentas y movimientos de ambos. |
| **Datos** | `id` de una cuenta y de un movimiento de Ana; `userId` de Ana enviado en el cuerpo de una creación. |
| **Pasos** | 1. Autenticarse como demo.<br>2. Solicitar por API la cuenta y el movimiento de Ana.<br>3. Intentar editar y eliminar esos recursos.<br>4. Crear una cuenta enviando el `userId` de Ana en el cuerpo. |
| **Resultado esperado** | El servidor responde `404` sin distinguir un recurso ajeno de uno inexistente, no expone datos y no autoriza por un identificador aportado por el cliente. |
| **Evidencia automatizada** | API: `NFR-SEG-001.e2e-spec.ts` (2: ocultamiento de cuentas y movimientos; `userId` ajeno rechazado). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API). |
| **Defectos** | — |

#### CP-SEG-02 · Validación de entradas

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · NFR-SEG-002 |
| **Precondiciones** | API disponible; sesión válida. |
| **Datos** | Campos inesperados, tipos incorrectos, `id` no UUID, cuerpo vacío, query params fuera de rango (`page=0`, `limit=500`, períodos invertidos). |
| **Pasos** | 1. Enviar cada entrada inválida a los endpoints de cuentas, movimientos y dashboard.<br>2. Revisar el código de estado y el cuerpo del error.<br>3. Verificar que no se hayan persistido registros inconsistentes. |
| **Resultado esperado** | Toda entrada inválida se rechaza con `400`, `code` estable y `fieldErrors`; no se persiste nada; el HTML se renderiza escapado (sin HTML ejecutable). |
| **Evidencia automatizada** | API: `NFR-SEG-002.e2e-spec.ts` (5). Cliente: `validation.test.ts` (23) y esquemas Zod por formulario. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + unitario). |
| **Defectos** | — |

#### CP-SEG-03 · Almacenamiento de contraseñas y secretos

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · NFR-SEG-003 |
| **Precondiciones** | Usuario recién registrado. |
| **Datos** | Contraseña `Demo1234!`; consulta directa a `users.password_hash`. |
| **Pasos** | 1. Registrar un usuario.<br>2. Consultar el hash almacenado.<br>3. Revisar el bundle del cliente y el repositorio en busca de claves. |
| **Resultado esperado** | La contraseña se guarda con argon2id y nunca en texto plano; las claves viven solo en variables de entorno del servidor y no aparecen en el frontend ni en el repositorio. |
| **Evidencia automatizada** | API: `NFR-SEG-003.e2e-spec.ts` (1) y `FR-AUT-001.e2e-spec.ts` (prueba de hash). Inspección: `.env.example` sin secretos y variables `NEXT_PUBLIC_*` sin claves. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + inspección). |
| **Defectos** | — |

### 4.3 Cuentas

#### CP-CUE-01 · Alta y edición de cuenta

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-CUE-001 · HU-005 |
| **Precondiciones** | Sesión iniciada; catálogo de monedas disponible. |
| **Datos** | Cuenta `Ahorro`, tipo `bank`, moneda `USD`, saldo inicial `1000`, notas `Reserva`. |
| **Pasos** | 1. Abrir el inicio y elegir el tipo de cuenta.<br>2. Completar nombre, moneda, saldo inicial y observaciones.<br>3. Guardar y verificar el listado y el saldo en la moneda de la cuenta.<br>4. Editar nombre, saldo inicial y notas.<br>5. Reintentar con nombre vacío y saldo no numérico. |
| **Resultado esperado** | La cuenta aparece en el listado con su saldo en su moneda y refleja la edición; solo su propietario la ve. El nombre vacío y el saldo inválido se rechazan. |
| **Evidencia automatizada** | API: `FR-CUE-001.e2e-spec.ts` (2), `FR-CUE-001-campos.e2e-spec.ts` (4), `FR-CUE-001-edicion.e2e-spec.ts` (4). Cliente: `account-form-dialog.test.tsx`, `accounts.test.tsx`, `account-type-picker.test.tsx`. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-CUE-02 · Cálculo de saldo y eliminación

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-CUE-002/003 · HU-005 |
| **Precondiciones** | Cuenta propia con saldo inicial y al menos un ingreso, un gasto y una transferencia. |
| **Datos** | Saldo inicial `100000`; ingreso `50000`; gasto `20000`; transferencia de `30000` a otra cuenta. |
| **Pasos** | 1. Registrar los movimientos.<br>2. Consultar el saldo de la cuenta.<br>3. Eliminar la cuenta desde el detalle.<br>4. Verificar los movimientos asociados y la cuenta de destino de la transferencia. |
| **Resultado esperado** | Saldo actual = saldo inicial + ingresos − gastos, con el efecto opuesto de la transferencia en cada cuenta. La eliminación borra en cascada los movimientos en los que participa, incluidas ambas patas de una transferencia. |
| **Evidencia automatizada** | API: `FR-CUE-002.e2e-spec.ts` (2: saldo y efecto de la transferencia). La eliminación en cascada está implementada (`onDelete: CASCADE`) pero **no tiene prueba ejecutada**. |
| **Ejecución** | 30/10/2026 · **Parcial**: saldo aprobado; cascada sin evidencia. |
| **Defectos** | — |

#### CP-CUE-03 · Moneda fija con movimientos

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-CUE-001 · HU-005 |
| **Precondiciones** | Cuenta en `ARS` con al menos un movimiento. |
| **Datos** | Cuenta `Caja` (ARS); intento de cambio a `USD`. |
| **Pasos** | 1. Crear la cuenta y cargarle un movimiento.<br>2. Editar la cuenta e intentar cambiar la moneda.<br>3. Repetir por API (`PATCH /api/accounts/:id`). |
| **Resultado esperado** | El servidor rechaza el cambio con error de dominio y la interfaz deshabilita el selector de moneda; el resto de los campos sí se edita. |
| **Evidencia automatizada** | Inspección: `accounts.service.ts` valida el cambio de moneda contra los movimientos existentes y responde con `ACCOUNT_HAS_TRANSACTIONS`. No hay prueba automatizada de este criterio. |
| **Ejecución** | **No ejecutado** (validación identificada por inspección; falta la prueba). |
| **Defectos** | — |

#### CP-CUE-04 · Detalle de cuenta

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-CUE-004 · HU-017 |
| **Precondiciones** | Cuenta propia con movimientos de ingreso y gasto. |
| **Datos** | `id` de la cuenta `Banco`; movimientos del período. |
| **Pasos** | 1. Abrir `/accounts/detail?id=<id>`.<br>2. Revisar saldo, saldo inicial, ingresos y gastos.<br>3. Verificar la lista de movimientos y el acceso a editar cada uno.<br>4. Editar la cuenta desde el detalle.<br>5. Abrir un `id` inexistente y uno ajeno. |
| **Resultado esperado** | El detalle muestra los datos de la cuenta, los indicadores sobre los movimientos cargados y sus movimientos; la edición reutiliza el formulario de cuenta. Un `id` desconocido muestra el estado *no encontrado* y uno ajeno no expone datos. |
| **Evidencia automatizada** | Cliente: `use-account-detail.test.tsx` (resolución por `?id`, resumen de movimientos, `id` ausente) y `app/(app)/_components/accounts/__tests__/accounts.test.tsx` (render de cuenta, métricas y movimientos; estado no encontrado). |
| **Ejecución** | 30/10/2026 · **Aprobado** (componente). |
| **Defectos** | — |

### 4.4 Movimientos

#### CP-TRX-01 · Registrar ingreso y gasto

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-TRX-001 · HU-001 |
| **Precondiciones** | Al menos una cuenta propia y las cinco categorías del sistema. |
| **Datos** | Ingreso `Sueldo` ARS `900000` categoría `Sueldo`; gasto `Supermercado` ARS `120000` categoría `Supermercado`; variantes: monto `0`, monto negativo, descripción vacía, categoría inexistente, fecha `2026-13-01`. |
| **Pasos** | 1. Abrir Movimientos y crear un ingreso con monto, fecha, cuenta, categoría y descripción.<br>2. Repetir con un gasto.<br>3. Verificar el listado, el saldo de la cuenta y el dashboard.<br>4. Reintentar con cada variante inválida.<br>5. Intentar editar una categoría del sistema y una propia. |
| **Resultado esperado** | Ambos movimientos se registran y actualizan saldo, listado y dashboard. Las variantes inválidas se rechazan (`400`); la categoría es obligatoria en ingreso y gasto. Las categorías del sistema no se editan y las propias sí. |
| **Evidencia automatizada** | API: `FR-TRX-001.e2e-spec.ts` (3), `FR-TRX-001-campos.e2e-spec.ts` (10), `FR-TRX-001-edicion.e2e-spec.ts` (4). Cliente: `transaction-form-dialog.test.tsx` (8). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-TRX-02 · Transferencia válida

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-TRX-001 · CAL-003 · HU-002 |
| **Precondiciones** | Dos cuentas propias en la misma moneda con saldo suficiente. |
| **Datos** | Origen `Banco` (ARS) → destino `Caja` (ARS), monto `50000`, fecha `2026-10-15`. |
| **Pasos** | 1. Crear una transferencia entre las dos cuentas.<br>2. Verificar el descuento en origen y la acreditación en destino.<br>3. Revisar los totales de ingresos y gastos del período.<br>4. Reintentar con origen igual a destino. |
| **Resultado esperado** | Se registran dos patas atómicas con el mismo `transferGroupId`; los saldos cambian en sentido opuesto y la transferencia queda excluida de ingresos, gastos y ahorro. Origen igual a destino se rechaza. |
| **Evidencia automatizada** | API: `FR-TRX-001-transferencia.e2e-spec.ts` (2), `FR-TRX-001.e2e-spec.ts` (transferencia entre cuentas propias) y `CAL-003.e2e-spec.ts` (1). Cliente: `transaction-form-dialog.test.tsx` (payload y destino distinto). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-TRX-03 · Edición, eliminación y propiedad

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-TRX-001 · NFR-SEG-001 · HU-008 |
| **Precondiciones** | Movimiento propio y movimiento de otro usuario. |
| **Datos** | Gasto propio `Supermercado`; `id` de un movimiento de Ana. |
| **Pasos** | 1. Editar monto, fecha y descripción de un movimiento propio.<br>2. Eliminarlo y verificar saldo y dashboard.<br>3. Intentar editar y eliminar el movimiento de Ana.<br>4. Repetir con un `id` inexistente y con un `id` no UUID. |
| **Resultado esperado** | La edición y la eliminación propias se aplican y recalculan saldos y dashboard. Sobre un recurso ajeno se responde `404`; un `id` inexistente también; un `id` no UUID se rechaza con `400`. |
| **Evidencia automatizada** | API: `FR-TRX-001-edicion.e2e-spec.ts` (4) y `NFR-SEG-001.e2e-spec.ts` (2). Cliente: eliminación por diálogo de confirmación y edición desde la fila. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-TRX-04 · Gestión de categorías propias

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-CAT-001 · HU-013 |
| **Precondiciones** | Sesión iniciada; cinco categorías del sistema. |
| **Datos** | Categoría propia `Mascotas` (gasto, color `#f97316`). |
| **Pasos** | 1. Crear la categoría.<br>2. Asignarla a un movimiento.<br>3. Editarla y luego eliminarla.<br>4. Intentar editar/eliminar una categoría del sistema y una de otro usuario.<br>5. Crear una categoría duplicada y una con el tipo equivocado. |
| **Resultado esperado** | La categoría propia se crea, asigna, edita y elimina; al eliminarla, sus movimientos quedan sin categoría. Las categorías del sistema y las ajenas se rechazan; el duplicado y el tipo inválido también. |
| **Evidencia automatizada** | API: `FR-TRX-001-campos.e2e-spec.ts` (creación/asignación, duplicados y tipo, edición/eliminación, aislamiento y sistema). Cliente: `app/(app)/categories/_components/__tests__/categories-view.test.tsx` (listado, alta, edición y eliminación). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-TRX-05 · Búsqueda y filtros

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-TRX-002 · HU-012 |
| **Precondiciones** | Movimientos en más de una cuenta, categoría y moneda. |
| **Datos** | Búsqueda `super`, `12000`, nombre de categoría; filtros tipo `expense`, cuenta `Caja`, moneda `USD`, rango `2026-10-01`–`2026-10-31`. |
| **Pasos** | 1. Buscar por concepto, nota, categoría y monto.<br>2. Combinar los filtros de tipo, cuenta, categoría, moneda y período.<br>3. Verificar los resultados y usar `Limpiar`.<br>4. Quitar los filtros y comparar con el listado completo. |
| **Resultado esperado** | La lista muestra solo los movimientos que cumplen todos los filtros; la búsqueda cubre concepto, nota, categoría y monto; los filtros de moneda se aplican a ambas patas de una transferencia y `Limpiar` restablece el estado. |
| **Evidencia automatizada** | Cliente: `filters.test.ts` (3), `transactions.test.tsx` (búsqueda, chips y limpieza) y filtro por moneda de cualquiera de las dos patas. |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + componente). |
| **Defectos** | — |

#### CP-TRX-06 · Transferencia multimoneda

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-TRX-001 · HU-002 |
| **Precondiciones** | Cuenta en `ARS` y cuenta en `USD`; cotización disponible. |
| **Datos** | Origen `Banco` (ARS) `100000` → destino `Billetera USD` a cotización sugerida. |
| **Pasos** | 1. Crear una transferencia entre cuentas de distinta moneda.<br>2. Editar la cotización sugerida y confirmar.<br>3. Verificar el monto acreditado en destino.<br>4. Editar la transferencia y revisar la coherencia de ambos montos.<br>5. Revisar la persistencia de la cotización. |
| **Resultado esperado** | Se registran los dos montos coherentes con la cotización; la cotización no se persiste; al editar, ambos montos conservan la coherencia. |
| **Evidencia automatizada** | Cliente: `transaction-form-dialog.test.tsx` (cálculo del monto de destino). Inspección: el modelo `transaction` guarda `amount` por pata y no tiene columna de cotización. No hay prueba de integración específica de la edición. |
| **Ejecución** | 30/10/2026 · **Parcial**: cálculo y modelo verificados; edición sin evidencia. |
| **Defectos** | — |

#### CP-TRX-07 · Historial de movimientos

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-TRX-004 · HU-018 |
| **Precondiciones** | Más de 10 movimientos en varios meses, incluida una transferencia. |
| **Datos** | Movimientos del seed (27) en agosto, septiembre y octubre de 2026. |
| **Pasos** | 1. Abrir Movimientos.<br>2. Recorrer el listado paginado de 10 en 10.<br>3. Revisar el agrupado mensual.<br>4. Buscar la transferencia `Ahorro mensual` y verificar que aparezca una sola vez. |
| **Resultado esperado** | El historial se ordena por fecha descendente, se agrupa por mes sin subtotales y pagina de a 10 sobre hasta 100 movimientos. Las transferencias se colapsan en una sola fila (pata origen) con monto neutro, sin afectar los flujos, y cada fila abre su edición. |
| **Evidencia automatizada** | Cliente: `group-transactions.test.ts` (agrupado por mes), `transactions.test.tsx` (filas, paginación, acciones por fila) y colapso de transferencias conservando la pata saliente. |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + componente). |
| **Defectos** | — |

#### CP-TRX-08 · Exportación CSV

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-TRX-003 · HU-019 |
| **Precondiciones** | Movimientos visibles en la vista. |
| **Datos** | Gasto `Compra` por `12000`; vista sin movimientos filtrados. |
| **Pasos** | 1. Abrir Movimientos.<br>2. Exportar y abrir el archivo en una planilla.<br>3. Operar sobre la columna `Monto`.<br>4. Repetir sin movimientos visibles. |
| **Resultado esperado** | Se descarga `movimientos-AAAA-MM-DD.csv` con fecha, tipo, descripción, categoría, cuenta, moneda, monto y notas. La columna `Monto` es un número decimal operable (sin símbolo ni separador de miles). Sin movimientos, el botón está deshabilitado y no se descarga. |
| **Evidencia automatizada** | Cliente: `use-export-transactions.test.tsx` (verifica `"12000"` y ausencia de `$`). Inspección: el botón `Exportar` se deshabilita con `filtered.length === 0`. |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + inspección). Regresión de `BUG-001`. |
| **Defectos** | `BUG-001` (corregido y cerrado). |

### 4.5 Categorías

#### CP-CAT-01 · Listado y uso

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-CAT-001/002 · HU-020 |
| **Precondiciones** | Movimientos en el período; categorías del sistema y al menos una propia. |
| **Datos** | Período `Este mes`; moneda de visualización `ARS`. |
| **Pasos** | 1. Abrir Categorías.<br>2. Alternar las tabs Gastos/Ingresos.<br>3. Cambiar el período.<br>4. Revisar cantidad, monto, porcentaje y orden.<br>5. Verificar las acciones disponibles por fila. |
| **Resultado esperado** | Se listan las cinco categorías del sistema y las propias, con cantidad, monto y porcentaje del período, ordenadas por uso. Las categorías del sistema muestran el badge `Del sistema` sin acciones de edición ni eliminación. |
| **Evidencia automatizada** | Cliente: `categories-view.test.tsx` (listado, tabs, alta, sin acciones para el sistema, eliminación) y `category-usage.test.ts` (sumas, conteo, porcentajes y orden por uso). |
| **Ejecución** | 30/10/2026 · **Aprobado** (componente). |
| **Defectos** | — |

#### CP-CAT-02 · Moneda de visualización

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · RN-001 · FR-CAT-002 |
| **Precondiciones** | Movimientos en ARS y USD; más de una moneda en uso. |
| **Datos** | Selector `ARS` → `USD`. |
| **Pasos** | 1. Abrir Categorías en `ARS`.<br>2. Cambiar el selector a `USD`.<br>3. Comparar montos y porcentajes de cada categoría. |
| **Resultado esperado** | Los montos y porcentajes se re-expresan en la moneda elegida sin excluir movimientos de otras monedas; el porcentaje se conserva y los datos no cambian. |
| **Evidencia automatizada** | Cliente: `category-usage.test.ts` (`includes every currency and converts the amounts to the display currency`) y `categories-view.test.tsx` (selector de moneda). |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + componente). |
| **Defectos** | — |

### 4.6 Dashboard y patrimonio

#### CP-DAS-01 · Patrimonio neto

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · CAL-001 · FR-DAS-001 · HU-006 |
| **Precondiciones** | Cuentas en ARS y USD con movimientos; cotizaciones disponibles. |
| **Datos** | Tres cuentas ARS y una USD del seed; moneda de lectura `ARS` y luego `USD`. |
| **Pasos** | 1. Abrir el dashboard.<br>2. Comparar el patrimonio con la suma de saldos por cotización.<br>3. Cambiar la moneda de lectura y repetir.<br>4. Verificar el desglose por moneda con más de una moneda. |
| **Resultado esperado** | Patrimonio neto = Σ (saldo × cotización) de las cuentas actuales, en la moneda de lectura, con desglose por moneda cuando hay más de una. |
| **Evidencia automatizada** | API: `FR-DAS-001.e2e-spec.ts` (4) y `CAL-001.e2e-spec.ts` (2). Cliente: `net-worth-hero` (valor, variación y gráfico accesible). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-DAS-02 · Indicadores del período

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-DAS-001 · CAL-002 · CAL-004 · HU-006 |
| **Precondiciones** | Período con ingresos y gastos en ARS y USD. |
| **Datos** | Período `Este mes`; conversión a la moneda de lectura. |
| **Pasos** | 1. Seleccionar el período.<br>2. Leer ingresos, gastos, ahorro y tasa de ahorro.<br>3. Recalcular ahorro = ingresos − gastos y tasa = ahorro / ingresos × 100.<br>4. Comparar el patrimonio mostrado con el actual. |
| **Resultado esperado** | Los indicadores incluyen todas las monedas convertidas a la moneda de lectura; el ahorro es ingresos − gastos y la tasa = ahorro / ingresos × 100 (0 % sin ingresos). El patrimonio mostrado es el actual. |
| **Evidencia automatizada** | API: `FR-DAS-001.e2e-spec.ts` (KPIs, transferencias excluidas, período, sesión), `CAL-002.e2e-spec.ts` (1) y `CAL-004.e2e-spec.ts` (1). Cliente: `period-summary.test.ts` y `period-stats.test.ts`. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + unitario). |
| **Defectos** | — |

#### CP-DAS-03 · Consistencia de cálculos

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · Criterio de bondad |
| **Precondiciones** | Dataset del seed con tres meses de movimientos. |
| **Datos** | Movimientos de agosto a octubre de 2026. |
| **Pasos** | 1. Registrar los totales del dashboard.<br>2. Sumar los movimientos del período desde la vista de Movimientos.<br>3. Comparar ingresos, gastos, ahorro y patrimonio. |
| **Resultado esperado** | Los totales del dashboard coinciden con los movimientos registrados; las transferencias no alteran ingresos, gastos ni ahorro. |
| **Evidencia automatizada** | API: `CAL-001`–`CAL-004` y `FR-DAS-001` calculados sobre el mismo conjunto de movimientos; el escenario base (`test/utils/scenario.ts`) fija los valores esperados. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API). |
| **Defectos** | — |

#### CP-DAS-04 · Gráficos y período

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-DAS-002/003 · HU-007 |
| **Precondiciones** | Movimientos en el período; dashboard cargado. |
| **Datos** | Períodos `Este mes` y `12 meses`; moneda de lectura `ARS`. |
| **Pasos** | 1. Abrir el panel.<br>2. Revisar los tres gráficos (patrimonio, ingresos vs. gastos, gastos por categoría).<br>3. Cambiar el período.<br>4. Verificar que las series y los totales correspondan al rango y a la moneda de lectura. |
| **Resultado esperado** | Los tres gráficos reflejan el período seleccionado y la moneda de lectura; el donut solo incluye gastos con categoría y expone una tabla accesible equivalente. |
| **Evidencia automatizada** | API: `FR-DAS-002.e2e-spec.ts` (2), `FR-DAS-002-ingresos-gastos` (1), `FR-DAS-002-gastos-categoria` (1) y `FR-DAS-003.e2e-spec.ts` (4). Cliente: `category-donut.test.tsx` (gráfico, leyenda y tabla accesible) y `NetWorthHero`. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

#### CP-DAS-05 · Granularidad diaria y semanal

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · FR-DAS-002/003 · HU-007 |
| **Precondiciones** | Rangos de 31 días o menos y de 6/12 meses. |
| **Datos** | `Este mes` (octubre de 2026), `Últimos 30 días`, `6 meses`, `12 meses`. |
| **Pasos** | 1. Comparar `Este mes` y `Últimos 30 días`.<br>2. Comparar con `6 meses` y `12 meses`.<br>3. Revisar la serie de patrimonio y las barras de ingresos/gastos.<br>4. Comparar los totales con los movimientos del período. |
| **Resultado esperado** | En rangos de hasta 31 días el patrimonio se muestra por día y las barras por semana; en rangos mayores, por mes. Los totales coinciden con los movimientos del período. |
| **Evidencia automatizada** | API: `FR-DAS-002.e2e-spec.ts` (evolución diaria y tramos semanales para el mes en curso) y `FR-DAS-003` (rangos). Cliente: `chart-ticks.test.ts` (ticks por día/semana/mes). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + unitario). |
| **Defectos** | — |

#### CP-DAS-06 · Selector de moneda de lectura

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-DAS-003 · RN-001 · HU-016 |
| **Precondiciones** | Cuentas en más de una moneda; cotizaciones disponibles. |
| **Datos** | `ARS` → `USD` → `Otra moneda` (`EUR`) → `ARS`. |
| **Pasos** | 1. Abrir el selector del header.<br>2. Elegir `USD` y revisar todos los valores.<br>3. Abrir `Otra moneda` y elegir `EUR`.<br>4. Volver a `ARS` y comparar con el estado inicial. |
| **Resultado esperado** | Todos los valores del dashboard se re-expresan en la moneda elegida sin alterar datos; el desglose por moneda se mantiene y el catálogo completo está disponible. El selector se oculta si solo hay una moneda. |
| **Evidencia automatizada** | Cliente: `dashboard-currency-selector.test.tsx` (cambio de moneda, catálogo completo, visibilidad según monedas en uso) y `currency.test.ts` (conversión y agrupación). |
| **Ejecución** | 30/10/2026 · **Aprobado** (componente + unitario). |
| **Defectos** | — |

### 4.7 Cálculos

#### CP-CAL-001 · Patrimonio neto

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · CAL-001 · NFR-CAL-001 |
| **Entrada** | Saldos de cuentas en ARS y USD y cotizaciones de la API. |
| **Resultado esperado** | Σ (saldo × cotización) de las cuentas, en la moneda de lectura; cero sin cuentas. |
| **Evidencia** | Unitario: `calculations.service.spec.ts`. API: `CAL-001.e2e-spec.ts` (2). |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + API). |
| **Defectos** | — |

#### CP-CAL-002 · Flujo de fondos

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · CAL-002 · NFR-CAL-001 |
| **Entrada** | Ingresos y gastos del período en distintas monedas. |
| **Resultado esperado** | Cada flujo se convierte a la moneda de lectura y se calcula ingresos − gastos. |
| **Evidencia** | Unitario: `calculations.service.spec.ts`. API: `CAL-002.e2e-spec.ts` (1). |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + API). |
| **Defectos** | — |

#### CP-CAL-003 · Transferencias

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · CAL-003 · NFR-CAL-001 |
| **Entrada** | Transferencia entre cuentas, incluso de monedas distintas. |
| **Resultado esperado** | Se excluye de ingresos y gastos consolidados; cada pata conserva su monto. |
| **Evidencia** | Unitario: `calculations.service.spec.ts`. API: `CAL-003.e2e-spec.ts` (1) y `FR-DAS-001` (exclusión). |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + API). |
| **Defectos** | — |

#### CP-CAL-004 · Tasa de ahorro

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · CAL-004 · NFR-CAL-001 |
| **Entrada** | Ahorro e ingresos del período convertidos. |
| **Resultado esperado** | Ahorro / ingresos × 100; sin ingresos, 0 %; la variación se expresa en puntos porcentuales contra el período anterior. |
| **Evidencia** | Unitario: `calculations.service.spec.ts`. API: `CAL-004.e2e-spec.ts` (1). |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + API). |
| **Defectos** | — |

### 4.8 Asistente de IA

#### CP-IA-01 · Consulta verificable

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-IA-001 · HU-003 |
| **Precondiciones** | Sesión iniciada; datos del seed; proveedor de IA configurado (simulado en pruebas). |
| **Datos** | Pregunta: “¿Cuánto gasté este mes y en qué categorías?”; período `Este mes`. |
| **Pasos** | 1. Abrir `/assistant`.<br>2. Enviar la pregunta.<br>3. Revisar el evento `meta` (período, moneda, fuentes).<br>4. Comparar los totales con el dashboard del mismo período. |
| **Resultado esperado** | El stream expone `meta`, `token` y `done`; el contexto incluye solo datos propios y las categorías consideradas; los totales coinciden con el dashboard en la moneda informada. Sin sesión se rechaza. |
| **Evidencia** | API: `FR-IA-001.e2e-spec.ts` (2) y `assistant.service.spec.ts` (meta/tokens/done); unitario `assistant-context.service.spec.ts` (contexto mínimo y fuentes). |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + unitario). |
| **Defectos** | — |

#### CP-IA-02 · Solo consulta

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-IA-001 · HU-010 |
| **Precondiciones** | Sesión iniciada. |
| **Datos** | “Creá un gasto de 5000 en Supermercado”, “Eliminá mi último movimiento”, “Cambiá el saldo de mi cuenta”. |
| **Pasos** | 1. Enviar cada instrucción de escritura.<br>2. Verificar la respuesta y el estado de los datos.<br>3. Revisar el contrato del asistente. |
| **Resultado esperado** | El asistente no crea, edita ni elimina datos; responde explicando su alcance de solo consulta y los movimientos y saldos permanecen iguales. |
| **Evidencia** | Inspección: el controlador del asistente solo expone el *stream* de consulta y el servicio compone contexto de lectura; no hay operaciones de escritura en el módulo. |
| **Ejecución** | 30/10/2026 · **Aprobado** (inspección). |
| **Defectos** | — |

#### CP-IA-03 · Continuidad conversacional

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-IA-002 · HU-015 |
| **Precondiciones** | Conversación con al menos un turno previo. |
| **Datos** | Pregunta inicial por gastos del mes; seguimiento “¿y el mes pasado?”; recarga de la página. |
| **Pasos** | 1. Enviar la pregunta inicial.<br>2. Enviar el seguimiento.<br>3. Verificar que el cliente envíe los turnos recientes.<br>4. Recargar y comprobar que no hay historial persistido.<br>5. Usar `Nuevo chat` con una respuesta en curso. |
| **Resultado esperado** | El asistente interpreta el seguimiento con los turnos recientes enviados por el cliente, mantiene las cifras del período vigente y no conserva la conversación en el servidor; `Nuevo chat` descarta la conversación y cancela la respuesta en curso. |
| **Evidencia** | Cliente: `assistant-history.test.ts` (3) y `assistant-chat.test.tsx` (envío de historial, límite de turnos, `Nuevo chat`). API: `assistant.service.spec.ts` (reenvío del historial). Inspección: no existe tabla de conversaciones. |
| **Ejecución** | 30/10/2026 · **Aprobado** (unitario + componente + inspección). |
| **Defectos** | — |

### 4.9 No funcionales y usabilidad

#### CP-NFR-01 · Diseño adaptable

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · Criterio de bondad |
| **Precondiciones** | Aplicación accesible en escritorio y móvil. |
| **Datos** | Viewports 1440×900 y 390×844. |
| **Pasos** | 1. Recorrer dashboard, movimientos, categorías, asistente, perfil y ajustes en escritorio.<br>2. Repetir en móvil con la barra inferior.<br>3. Revisar legibilidad, navegación y safe areas. |
| **Resultado esperado** | Los flujos principales son usables y legibles en ambas resoluciones; en móvil la barra inferior muestra Inicio, Movimientos, Asistente y Perfil con el ítem activo indicado sin depender solo del color. |
| **Evidencia** | Cliente: `mobile-tab-bar` (ítems iguales y activo), `app-nav` (rutas y sección activa). No se ejecutó la verificación visual en ambos viewports. |
| **Ejecución** | **No ejecutado** (falta la verificación visual). |
| **Defectos** | — |

#### CP-NFR-02 · Estados de carga y error

| | |
|---|---|
| **Prioridad / Trazabilidad** | P0 · Dependencias FRD |
| **Precondiciones** | Sesión iniciada; proveedor de IA o de cotizaciones no disponible. |
| **Datos** | Error `500` de la API; error del *stream* del asistente; respuesta `401`. |
| **Pasos** | 1. Provocar una carga y observar el `Skeleton`.<br>2. Provocar un error de API y del asistente.<br>3. Verificar los mensajes y que no se pierdan datos.<br>4. Forzar un `401` y comprobar el refresco y la redirección. |
| **Resultado esperado** | Se muestran estados de carga y error comprensibles, con reintento cuando corresponde; ante `401` se refresca una sola vez y, si falla, se redirige al acceso sin perder datos. |
| **Evidencia** | Cliente: `shows a loader and redirects unauthenticated users`, `reports a failed stream`, `surfaces a non-OK response message`, refresco único ante `401` y redirección al login. |
| **Ejecución** | 30/10/2026 · **Aprobado** (componente). |
| **Defectos** | — |

### 4.10 Configuración y preferencias

#### CP-CFG-01 · Tema

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-CFG-001 · HU-014 |
| **Precondiciones** | Sesión iniciada. |
| **Datos** | Tema `Oscuro` → recarga → `Claro`. |
| **Pasos** | 1. Abrir Ajustes.<br>2. Cambiar el tema.<br>3. Recargar la aplicación.<br>4. Verificar la persistencia y que los datos financieros no cambien. |
| **Resultado esperado** | El tema persiste en el navegador (`localStorage`), se aplica antes del primer render y no modifica datos financieros; la preferencia no se sincroniza entre dispositivos. |
| **Evidencia** | Cliente: `applies the theme preference` en `settings-view.test.tsx`. Inspección: `next-themes` con almacenamiento local; el tema no integra el modelo de datos. |
| **Ejecución** | 30/10/2026 · **Aprobado** (componente + inspección). |
| **Defectos** | — |

#### CP-CFG-02 · Moneda principal

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-CFG-003 · RN-001 · RN-002 · HU-016 |
| **Precondiciones** | Cuentas en más de una moneda. |
| **Datos** | Moneda principal `ARS` → `USD`. |
| **Pasos** | 1. Abrir Ajustes y cambiar la moneda principal.<br>2. Guardar.<br>3. Volver al dashboard.<br>4. Revisar la moneda de lectura por defecto y las cotizaciones. |
| **Resultado esperado** | La preferencia se guarda y el dashboard usa la nueva moneda principal como lectura por defecto; las cotizaciones siguen siendo automáticas y no editables; saldos y movimientos no cambian. |
| **Evidencia** | Cliente: `only shows the primary currency selector when a foreign account exists` y `updates the profile and mirrors it into the auth cache`. Inspección: `PATCH /users/me` persiste `primaryCurrency` y el dashboard lo usa como lectura por defecto. No hay prueba ejecutada del cambio completo seguido de lectura del dashboard. |
| **Ejecución** | 30/10/2026 · **Parcial**: selector y persistencia verificados; lectura por defecto sin evidencia. |
| **Defectos** | — |

#### CP-CFG-03 · Correo y contraseña

| | |
|---|---|
| **Prioridad / Trazabilidad** | P1 · FR-CFG-002 · NFR-SEG-003 · HU-004 |
| **Precondiciones** | Sesión iniciada; contraseña actual conocida. |
| **Datos** | Correo `demo+prueba@atlassfin.app`; contraseña nueva `Nueva1234!`; variantes: correo duplicado, contraseña actual incorrecta, contraseña nueva inválida. |
| **Pasos** | 1. Cambiar el correo y guardar.<br>2. Verificar la normalización y la unicidad.<br>3. Cambiar la contraseña ingresando la actual.<br>4. Probar correo duplicado, contraseña actual incorrecta y contraseña nueva inválida.<br>5. Iniciar sesión con la contraseña nueva. |
| **Resultado esperado** | El correo se normaliza y se guarda si es único; el cambio de contraseña exige la actual y la misma política del registro; los errores se informan sin cerrar la sesión y la contraseña nueva permite iniciar sesión. |
| **Evidencia** | API: `FR-CFG-002.e2e-spec.ts` (6: nombre y normalización, duplicado, formato, cambio y login, contraseña actual incorrecta, política). Cliente: `settings-view.test.tsx` (nombre, correo, contraseña) y `validation.test.ts`. |
| **Ejecución** | 30/10/2026 · **Aprobado** (API + componente). |
| **Defectos** | — |

## 5. Seguimiento y gestión de bugs

**Columnas del registro**

| Columna | Descripción |
|---|---|
| **ID de Bug** | Identificador único (BUG-001, BUG-002, …). |
| **Descripción** | Problema observado, en una frase concreta. |
| **Pasos para reproducir** | Secuencia mínima y determinista. |
| **Prioridad** | Alta (cálculo, autorización o P0), media (P1 o experiencia con *workaround*) o baja (cosmético, accesibilidad o consistencia menor). |
| **Estado** | Abierto, en proceso, resuelto o cerrado. |
| **Responsable** | Persona a cargo de la corrección. |
| **Fechas** | Creación y resolución. |
| **Notas** | Caso que lo detectó, prueba que lo cubre y commit. |

**Máquina de estados:** `Abierto → En proceso → Resuelto → Cerrado`. Pasa a **Resuelto** cuando el cambio está desplegado en el entorno de prueba y a **Cerrado** cuando el caso `CP-*` asociado se re-ejecuta y aprueba.

| ID de Bug | Descripción | Pasos para reproducir | Prioridad | Estado | Responsable | Fecha de creación | Fecha de resolución | Notas / comentarios |
|---|---|---|---|---|---|---|---|---|
| BUG-001 | La exportación CSV escribía la columna `Monto` con el formato de pantalla (`$ 1.234,56`) en lugar de un número decimal, por lo que la planilla la interpretaba como texto y no permitía operar con ella. | 1) Abrir Movimientos. 2) Exportar los movimientos. 3) Abrir el CSV en una planilla. 4) Intentar sumar la columna `Monto`. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Detectado al validar FR-TRX-003. Se exporta el valor numérico crudo; cubierto por `client/hooks/__tests__/use-export-transactions.test.tsx`. Regresión ejecutada el 30/10/2026: la prueba pasa y `CP-TRX-08` queda aprobado. |

> No se registran otros defectos. Los desajustes detectados entre documentos y aplicación se corrigieron en la documentación (Plan v1.0, FRD/BRD v0.3) porque la implementación es la referencia de comportamiento; no se agregó funcionalidad.

## 6. Trazabilidad consolidada

| Caso | Requerimiento | Nivel de evidencia | Estado |
|---|---|---|---|
| CP-ACC-01 | FR-AUT-001 | API + componente | Aprobado |
| CP-ACC-02 | FR-AUT-002 · NFR-SEG-001/004 | API + componente | Aprobado |
| CP-SEG-01 | NFR-SEG-001 | API | Aprobado |
| CP-SEG-02 | NFR-SEG-002 | API + unitario | Aprobado |
| CP-SEG-03 | NFR-SEG-003 | API + inspección | Aprobado |
| CP-CUE-01 | FR-CUE-001 | API + componente | Aprobado |
| CP-CUE-02 | FR-CUE-002/003 | API | Parcial |
| CP-CUE-03 | FR-CUE-001 | Inspección | No ejecutado |
| CP-CUE-04 | FR-CUE-004 · HU-017 | Componente | Aprobado |
| CP-TRX-01 | FR-TRX-001 | API + componente | Aprobado |
| CP-TRX-02 | FR-TRX-001 · CAL-003 | API + componente | Aprobado |
| CP-TRX-03 | FR-TRX-001 · NFR-SEG-001 | API + componente | Aprobado |
| CP-TRX-04 | FR-CAT-001 | API + componente | Aprobado |
| CP-TRX-05 | FR-TRX-002 · HU-012 | Unitario + componente | Aprobado |
| CP-TRX-06 | FR-TRX-001 | Componente + inspección | Parcial |
| CP-TRX-07 | FR-TRX-004 · HU-018 | Unitario + componente | Aprobado |
| CP-TRX-08 | FR-TRX-003 · HU-019 | Unitario + inspección | Aprobado |
| CP-CAT-01 | FR-CAT-001/002 | Componente | Aprobado |
| CP-CAT-02 | FR-CAT-002 · RN-001 | Unitario + componente | Aprobado |
| CP-DAS-01 | CAL-001 · FR-DAS-001 | API + componente | Aprobado |
| CP-DAS-02 | FR-DAS-001 · CAL-002/004 | API + unitario | Aprobado |
| CP-DAS-03 | Criterio de bondad | API | Aprobado |
| CP-DAS-04 | FR-DAS-002/003 | API + componente | Aprobado |
| CP-DAS-05 | FR-DAS-002/003 · HU-007 | API + unitario | Aprobado |
| CP-DAS-06 | FR-DAS-003 · RN-001 | Componente + unitario | Aprobado |
| CP-CAL-001 | CAL-001 | Unitario + API | Aprobado |
| CP-CAL-002 | CAL-002 | Unitario + API | Aprobado |
| CP-CAL-003 | CAL-003 | Unitario + API | Aprobado |
| CP-CAL-004 | CAL-004 | Unitario + API | Aprobado |
| CP-IA-01 | FR-IA-001 · HU-003 | API + unitario | Aprobado |
| CP-IA-02 | FR-IA-001 · HU-010 | Inspección | Aprobado |
| CP-IA-03 | FR-IA-002 · HU-015 | Unitario + componente + inspección | Aprobado |
| CP-NFR-01 | Criterio de bondad | — | No ejecutado |
| CP-NFR-02 | Dependencias FRD | Componente | Aprobado |
| CP-CFG-01 | FR-CFG-001 · HU-014 | Componente + inspección | Aprobado |
| CP-CFG-02 | FR-CFG-003 · RN-001/002 | Componente + inspección | Parcial |
| CP-CFG-03 | FR-CFG-002 · NFR-SEG-003 | API + componente | Aprobado |

## 7. Cobertura pendiente y notas

**Casos a completar antes de la aceptación**

| Caso | Qué falta | Cómo cerrarlo |
|---|---|---|
| CP-CUE-02 | Evidencia de la eliminación en cascada, incluidas ambas patas de una transferencia. | Prueba de integración sobre `DELETE /api/accounts/:id` que verifique movimientos y `transferGroupId`. |
| CP-CUE-03 | Ejecución del rechazo de cambio de moneda con movimientos. | Prueba de integración sobre `PATCH /api/accounts/:id`. |
| CP-TRX-06 | Edición de una transferencia multimoneda y verificación de ambos montos. | Prueba de integración o componente del flujo de edición con cotización. |
| CP-CFG-02 | Cambio de moneda principal seguido de lectura del dashboard. | Prueba de integración `PATCH /users/me` + lectura del dashboard en la nueva moneda. |
| CP-NFR-01 | Verificación visual en escritorio y móvil. | Ejecución manual con capturas en 1440×900 y 390×844. |

**Notas**

- La ejecución registrada en este documento es **automatizada** (API, unitarias y componentes); no reemplaza la verificación visual de los flujos de interfaz.
- Toda aprobación se apoya en una prueba reproducible con los comandos de §3; las verificaciones por inspección se identifican explícitamente.
- Las pruebas de integración simulan los proveedores externos (IA y cotizaciones) en el borde; el comportamiento ante falla del proveedor se valida en `CP-NFR-02`.
- Un caso se marca **Aprobado** solo si el resultado observado coincide con el esperado; toda desviación se registra como defecto (Plan §3.3).
- La aceptación requiere el **100 % de los casos P0 ejecutados y aprobados** y sin defectos bloqueantes ni críticos abiertos (Plan §8.2).
