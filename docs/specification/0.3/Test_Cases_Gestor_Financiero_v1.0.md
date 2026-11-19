# Casos de Prueba — Gestor Financiero Personal

| | |
|---|---|
| **Proyecto** | Gestor Financiero Personal |
| **Documento** | Casos de Prueba (especificación y registro de ejecución) |
| **Versión** | 1.0 |
| **Fecha** | Octubre 2026 |
| **Sponsor Operación** | Secretaría Académica UNAHUR |
| **Sponsor Organización** | UNAHUR |
| **Autor** | Barenghi, Thomas |
| **Tutor** | Prof. Ciarallo, Cristian |
| **Release** | Demostración académica 2026 |

> **Nota de alcance.** Este documento desarrolla, caso por caso, los **37 casos de prueba** definidos en el Plan de Pruebas v1.0 y registra el resultado de su ejecución. Está alineado con el **BRD y el FRD v0.3**, versiones vigentes y de referencia para la implementación. La aplicación desplegada es la referencia de comportamiento: si un caso y la aplicación difieren, la diferencia se registra como defecto o se corrige el caso, nunca se aprueba sin evidencia.

## Historial de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0 | Octubre 2026 | Barenghi, Thomas | Versión inicial: especificación detallada de los 37 casos, matriz de trazabilidad con el FRD/BRD v0.3 y planilla de ejecución. |

## Tabla de contenidos

- 1. Objetivo
- 2. Alcance y documentos de referencia
- 3. Convenciones del documento
- 4. Entorno y datos de prueba
- 5. Resumen de los casos
- 6. Casos de prueba
  - 6.1. Acceso y sesión
  - 6.2. Seguridad y autorización
  - 6.3. Cuentas
  - 6.4. Movimientos
  - 6.5. Categorías
  - 6.6. Dashboard y patrimonio
  - 6.7. Cálculos
  - 6.8. Asistente de IA
  - 6.9. No funcionales y usabilidad
  - 6.10. Configuración y preferencias
- 7. Matriz de trazabilidad y evidencia
- 8. Ejecución y seguimiento de defectos
- 9. Criterios de cierre y notas

## 1. Objetivo

Especificar de forma **ejecutable y verificable** cada caso de prueba del Gestor Financiero Personal —precondiciones, datos, pasos y resultado esperado— y registrar el resultado de su ejecución con evidencia reproducible, de modo que la aprobación de la aplicación quede respaldada por hechos comprobables.

El documento persigue cuatro objetivos específicos:

1. **Verificar los cálculos financieros** (CAL-001 a CAL-004) contra valores de referencia y contra los movimientos registrados.
2. **Verificar la autorización por propietario**: cada usuario accede únicamente a sus propios datos (NFR-SEG-001).
3. **Verificar el carácter de solo consulta del asistente** de IA (FR-IA-001).
4. **Dejar trazabilidad** entre cada caso, el requisito del FRD/BRD que lo origina, la prueba automatizada que lo cubre y el defecto que lo afecta, si existe.

## 2. Alcance y documentos de referencia

| Documento | Uso en este documento |
|---|---|
| [`FRD_Gestor_Financiero_v0.3.md`](FRD_Gestor_Financiero_v0.3.md) | Fuente de verdad funcional: `FR-*`, `NFR-*`, `CAL-*`, `HU-*` y `SC-*` referenciados por cada caso. |
| [`BRD_Gestor_Financiero_v0.3.md`](BRD_Gestor_Financiero_v0.3.md) | Reglas de negocio (`RN-*`), casos de estudio y criterios de bondad. |
| [`Plan_de_Pruebas_Gestor_Financiero_v1.0.md`](Plan_de_Pruebas_Gestor_Financiero_v1.0.md) | Estrategia, alcance, priorización, datos de prueba y criterios de entrada/salida. Define los 37 casos que este documento desarrolla. |
| [`docs/architecture/backend.md`](../../architecture/backend.md) | Contrato REST, validaciones, códigos de error y reglas de cálculo implementadas. |
| [`docs/architecture/frontend.md`](../../architecture/frontend.md) | Mapa del sitio, rutas, componentes y comportamiento por página. |

**Fuera de alcance:** conexión con bancos o billeteras, ejecución de pagos o inversiones, asesoramiento financiero, presupuestos, activos, deudas y objetivos. Estos puntos no forman parte del FRD v0.3 y no se prueban.

## 3. Convenciones del documento

### 3.1. Identificación de los casos

Cada caso se identifica como **`CP-<MÓDULO>-<NN>`**:

| Módulo | Prefijo | Casos |
|---|---|---|
| Acceso y sesión | `ACC` | 2 |
| Seguridad y autorización | `SEG` | 3 |
| Cuentas | `CUE` | 4 |
| Movimientos | `TRX` | 8 |
| Categorías | `CAT` | 2 |
| Dashboard y patrimonio | `DAS` | 6 |
| Cálculos | `CAL` | 4 |
| Asistente de IA | `IA` | 3 |
| No funcionales y usabilidad | `NFR` | 2 |
| Configuración y preferencias | `CFG` | 3 |
| **Total** | | **37** |

Los identificadores coinciden **uno a uno** con los del Plan de Pruebas v1.0 (§5) y no se renumeran.

### 3.2. Prioridad

| Prioridad | Criterio | Uso en la aceptación |
|---|---|---|
| **P0** | Flujo esencial o cálculo financiero; su falla impide la demostración. | Obligatorio: 100 % ejecutado y aprobado. |
| **P1** | Aporta valor significativo; puede simplificarse si el cronograma lo exige. | Recomendado; su falla se registra como defecto. |
| **P2** | Documentado para una iteración posterior. | No condiciona la aceptación inicial. |

En la versión 1.0 del Plan hay **26 casos P0** y **11 casos P1**; no hay casos P2.

### 3.3. Estados del caso

```
No ejecutado → En ejecución → Aprobado / Fallado / Bloqueado
```

| Estado | Significado |
|---|---|
| **No ejecutado** | El caso está definido y aprobado, pero aún no se ejecutó. |
| **En ejecución** | Se está ejecutando y todavía no hay resultado concluyente. |
| **Aprobado** | El resultado observado coincide con el esperado y la evidencia está adjunta. |
| **Fallado** | El resultado observado difiere del esperado; se abre un `BUG-*`. |
| **Bloqueado** | No se puede ejecutar por una dependencia (entorno, proveedor externo, defecto previo). |

### 3.4. Evidencia admitida

| Evidencia | Formato esperado |
|---|---|
| Prueba automatizada | Salida de `npm run test` o `npm run test:e2e` con el nombre del archivo o del caso. |
| API | Request/response de `cURL` o Postman con método, ruta, estado y cuerpo. |
| Interfaz | Captura o grabación del flujo, con la versión desplegada y la fecha. |
| Base de datos | Consulta SQL y su resultado (por ejemplo, para verificar el hash de contraseña). |

Cada fila de la matriz de trazabilidad (§7) debe referenciar al menos una evidencia al registrar el resultado de su caso.

### 3.5. Estructura de cada caso

Todos los casos se documentan con la misma ficha:

- **Encabezado:** prioridad, tipo y nivel, referencias, precondiciones, datos de prueba, evidencia esperada y estado.
- **Pasos:** acción concreta y resultado esperado de esa acción.
- **Criterio de aprobación:** condición que debe cumplirse para marcar el caso como **Aprobado**.

Los valores monetarios se expresan con dos decimales y separador de miles según la localización de la interfaz (por ejemplo, `$ 10.000,00`). La API transporta los montos como número decimal con hasta cuatro decimales.

## 4. Entorno y datos de prueba

### 4.1. Entorno

| Elemento | Valor |
|---|---|
| Cliente | `http://localhost:3000` (Next.js, build de prueba) |
| API | `http://localhost:3001/api` (NestJS) |
| Base de datos | PostgreSQL/Supabase con el esquema derivado de las entidades (`synchronize`) |
| Preparación | `cd api && npm run db:reset` (recrea el esquema y ejecuta el seed determinístico) |
| Credenciales demo | `demo@atlassfin.app`, `sin-datos@atlassfin.app`, `ana@atlassfin.app` — contraseña `Demo1234!` |
| Herramientas | Navegador con DevTools, `cURL`/Postman, Jest + Supertest, Vitest + Testing Library |
| Cotizaciones | `GET /currencies/rates` (API pública, sin persistencia) |

### 4.2. Usuarios

| Alias | Email | Escenario |
|---|---|---|
| **USR-A** | `demo@atlassfin.app` | Dataset completo: 4 cuentas y 3 meses de movimientos. |
| **USR-B** | `ana@atlassfin.app` | Dataset mínimo: 1 cuenta bancaria y 1 ingreso. Se usa para aislamiento. |
| **USR-C** | `sin-datos@atlassfin.app` | Usuario sin datos financieros; se usa para estados vacíos. |
| **USR-D** | `qa.registro.<AAAAMMDD-HHMM>@example.com` | Usuario creado en la ejecución de CP-ACC-01. El sufijo evita colisiones entre corridas. |

### 4.3. Datos del seed (USR-A)

| Elemento | Detalle |
|---|---|
| Cuentas | `Caja` (`cash`, ARS), `Banco` (`bank`, ARS), `Billetera virtual` (`wallet`, ARS), `Billetera USD` (`wallet`, USD). |
| Moneda principal | ARS. |
| Categorías del sistema | Ingreso: `Sueldo`, `Freelance`. Gasto: `Supermercado`, `Transporte`, `Servicios`. Solo lectura. |
| Categoría propia | `Otros` (tipo ingreso), creada por el seed para USR-A. |
| Movimientos | Tres meses de ingresos, gastos y transferencias en ARS y USD, incluida una transferencia multimoneda cuando la API de cotizaciones está disponible. |
| Cotizaciones | Globales, provistas por la API en cada lectura; no se persisten. |

> El seed es determinístico en su estructura, pero los montos de la transferencia multimoneda dependen de la cotización vigente al ejecutarlo. Los casos que verifican importes exactos usan los datos creados en §4.4, no los montos del seed.

### 4.4. Datos creados durante la ejecución

Se crean una vez, al inicio de la corrida, con USR-A y sobre una base recién sembrada. Los identificadores son referencias internas del documento.

| Alias | Dato | Valor |
|---|---|---|
| **CTA-QA-ARS** | Cuenta `cash`, ARS, saldo inicial | `Cuenta QA ARS`, `10.000,00` ARS |
| **CTA-QA-USD** | Cuenta `wallet`, USD, saldo inicial | `Cuenta QA USD`, `500,00` USD |
| **CAT-QA** | Categoría propia de gasto | `Mascotas`, color `#8B5CF6` |
| **MOV-ING** | Ingreso | `250.000,00` ARS, cuenta CTA-QA-ARS, categoría `Sueldo`, fecha de hoy, concepto `Sueldo QA` |
| **MOV-GAS** | Gasto | `45.000,00` ARS, cuenta CTA-QA-ARS, categoría `Supermercado`, fecha de hoy, concepto `Compra QA` |
| **TRF-ARS** | Transferencia misma moneda | `100.000,00` ARS desde `Banco` hacia `Billetera virtual` |
| **TRF-USD** | Transferencia multimoneda | `50.000,00` ARS desde `Banco` hacia `Billetera USD`; monto destino calculado con la cotización sugerida (por defecto, y editable en la UI) |

> **Aislamiento entre casos.** Los valores esperados de esta sección suponen el estado inicial. Los casos que modifican o eliminan un dato de referencia (CP-CUE-01, CP-CUE-02, CP-TRX-03) lo restauran al finalizar o se ejecutan sobre una base resembrada (`npm run db:reset` y recreación de los fixtures). Así cada caso es independiente y reproducible.

**Valores de referencia** (con cotización `1 USD = 1.500,00 ARS`, solo para los casos que fijan la tasa):

| Concepto | Cálculo | Resultado |
|---|---|---|
| Saldo CTA-QA-ARS tras MOV-ING y MOV-GAS | `10.000 + 250.000 − 45.000` | `215.000,00` ARS |
| Patrimonio en ARS con CTA-QA-ARS y CTA-QA-USD | `215.000 + 500 × 1.500` | `965.000,00` ARS |
| Flujo del período con MOV-ING y MOV-GAS | `250.000 − 45.000` | `205.000,00` ARS |
| Tasa de ahorro del período | `205.000 / 250.000 × 100` | `82,00 %` |

## 5. Resumen de los casos

| Módulo | Casos | IDs | P0 | P1 |
|---|---|---|---|---|
| Acceso y sesión | 2 | CP-ACC-01 … CP-ACC-02 | 2 | 0 |
| Seguridad y autorización | 3 | CP-SEG-01 … CP-SEG-03 | 3 | 0 |
| Cuentas | 4 | CP-CUE-01 … CP-CUE-04 | 4 | 0 |
| Movimientos | 8 | CP-TRX-01 … CP-TRX-08 | 6 | 2 |
| Categorías | 2 | CP-CAT-01 … CP-CAT-02 | 1 | 1 |
| Dashboard y patrimonio | 6 | CP-DAS-01 … CP-DAS-06 | 5 | 1 |
| Cálculos | 4 | CP-CAL-001 … CP-CAL-004 | 4 | 0 |
| Asistente de IA | 3 | CP-IA-01 … CP-IA-03 | 0 | 3 |
| No funcionales y usabilidad | 2 | CP-NFR-01 … CP-NFR-02 | 1 | 1 |
| Configuración y preferencias | 3 | CP-CFG-01 … CP-CFG-03 | 0 | 3 |
| **Total** | **37** | | **26** | **11** |

## 6. Casos de prueba

### 6.1. Acceso y sesión

#### CP-ACC-01 · Registro de usuario

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional (caja negra) · Integración API + UI |
| **Referencias** | FR-AUT-001, HU-004, SC-001 |
| **Precondiciones** | Entorno de §4.1 operativo; el email de USR-D no existe en la base. |
| **Datos de prueba** | USR-D; moneda `ARS`; contraseña `Demo1234!`; casos inválidos: nombre `A`, contraseña `abcdefgh` (sin número), contraseña de 73 caracteres, moneda `XXX`, email `demo@atlassfin.app`. |
| **Evidencia esperada** | `api/test/requirements/FR-AUT-001.e2e-spec.ts`; `client/app/(auth)/_components/__tests__/auth-forms.test.tsx`; captura del alta y del error de email duplicado. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir `/register`. | Se muestra el formulario con nombre, email, moneda principal, contraseña y confirmación. El selector de moneda se llena con el catálogo de `GET /currencies` (54 códigos ISO 4217). |
| 2 | Enviar el formulario vacío. | Se muestran errores por campo y no se envía la petición ni se crea el usuario. |
| 3 | Ingresar nombre `A` y completar el resto correctamente. | Error «El nombre debe tener al menos 2 caracteres». |
| 4 | Ingresar contraseña `abcdefgh`. | Error de política: debe incluir al menos un número. |
| 5 | Ingresar una contraseña de 73 caracteres. | Error: la contraseña no puede superar los 72 caracteres. |
| 6 | Confirmar la contraseña con un valor distinto. | Error «Las contraseñas no coinciden». |
| 7 | `POST /auth/register` con `primaryCurrency: "XXX"` (vía API). | `400 VALIDATION_ERROR`; no se crea el usuario. |
| 8 | Registrarse con `demo@atlassfin.app`. | `409 EMAIL_IN_USE`, mensaje visible en el formulario; el usuario existente no se modifica. |
| 9 | Registrarse con los datos válidos de USR-D. | Se crea el usuario con la moneda elegida, se informa éxito, se fijan las cookies de sesión y se redirige a `/dashboard`. |
| 10 | Cerrar sesión e iniciar sesión con USR-D. | El acceso funciona con el email y la contraseña registrados. |
| 11 | `POST /auth/register` con un campo no previsto (`"role": "admin"`). | `400` por `forbidNonWhitelisted`; no se crea el usuario (NFR-SEG-002). |

**Criterio de aprobación:** el usuario se crea con la moneda principal elegida y puede iniciar sesión; todas las entradas inválidas o duplicadas se rechazan con un mensaje y sin persistir datos.

#### CP-ACC-02 · Inicio y cierre de sesión

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-AUT-002, NFR-SEG-001, NFR-SEG-004, HU-004, SC-001 |
| **Precondiciones** | USR-A y USR-D existentes; navegador con DevTools. |
| **Datos de prueba** | `demo@atlassfin.app` / `Demo1234!`; contraseña incorrecta `Demo9999!`. |
| **Evidencia esperada** | `FR-AUT-002.e2e-spec.ts`; `NFR-SEG-004.e2e-spec.ts`; `client/hooks/__tests__/use-sign-out.test.tsx`; captura de cookies en DevTools. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En `/login`, ingresar USR-A con contraseña incorrecta. | `401 INVALID_CREDENTIALS` con mensaje genérico; no se revela si el email existe; no se crea sesión. |
| 2 | Ingresar las credenciales correctas. | Se redirige a `/dashboard` y se muestran los datos del usuario. |
| 3 | Revisar las cookies en DevTools → Application → Cookies. | Existen `access_token` y `refresh_token` con `HttpOnly` activo y `SameSite=Lax`; `Secure` está activo en producción. |
| 4 | Revisar `localStorage`, `sessionStorage` y el cuerpo de la respuesta de login. | No hay tokens ni datos de sesión accesibles desde JavaScript. |
| 5 | Navegar a `/transactions`, `/categories`, `/assistant` y `/settings`. | Todas las pantallas cargan sin volver a pedir credenciales. |
| 6 | Ejecutar `POST /auth/refresh` con la cookie de refresh. | `204 No Content` y se renuevan las cookies de access y refresh. |
| 7 | Cerrar sesión desde el menú de perfil. | Se limpian ambas cookies y se redirige a `/login`. |
| 8 | Usar el botón Atrás del navegador o abrir directamente `/dashboard`. | La aplicación redirige a `/login` y no muestra datos financieros. |
| 9 | Reutilizar por `cURL` una copia de la cookie de access emitida antes del logout. | La petición sigue siendo aceptada hasta que el token expire: JWT stateless sin revocación server-side (comportamiento esperado y documentado). |
| 10 | `GET /auth/me` con la cookie vigente. | `200` con el usuario autenticado. |

**Criterio de aprobación:** la sesión se inicia y se mantiene con cookies `HttpOnly`; el cierre limpia las cookies y bloquea la navegación a pantallas protegidas; las credenciales inválidas se rechazan con un mensaje genérico.

### 6.2. Seguridad y autorización

#### CP-SEG-01 · Aislamiento entre usuarios

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Seguridad · Integración API + UI |
| **Referencias** | NFR-SEG-001, HU-011, RN-001 |
| **Precondiciones** | USR-A con cuentas, movimientos y categorías; USR-B con su dataset mínimo. Obtener los UUID de los recursos de USR-A con `GET /accounts`, `GET /transactions` y `GET /categories` usando su sesión. |
| **Datos de prueba** | UUID de una cuenta, un movimiento y una categoría propia de USR-A. |
| **Evidencia esperada** | `api/test/requirements/NFR-SEG-001.e2e-spec.ts`; respuestas `cURL` con estado 404; captura del detalle inaccesible. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Con la sesión de USR-B, `GET /accounts/<id de USR-A>`. | `404 NOT_FOUND`; no se expone ningún campo del recurso. |
| 2 | `PATCH` y `DELETE` sobre la cuenta de USR-A. | `404 NOT_FOUND`; la cuenta de USR-A permanece sin cambios. |
| 3 | `GET`, `PATCH` y `DELETE /transactions/<id de USR-A>`. | `404 NOT_FOUND` en los tres casos. |
| 4 | `PATCH` y `DELETE /categories/<id propio de USR-A>`. | `404 NOT_FOUND`; la categoría no se modifica. |
| 5 | Abrir `/accounts/detail?id=<cuenta de USR-A>` con sesión de USR-B. | La pantalla no muestra datos de la cuenta; se informa que no existe o se redirige sin exponer información. |
| 6 | Abrir el dashboard y las listas con USR-B. | Solo aparecen la cuenta y el ingreso de USR-B; ningún importe de USR-A. |
| 7 | `GET /transactions` con USR-B y comparar el `total` con la base. | El total corresponde solo a los movimientos de USR-B. |

**Criterio de aprobación:** toda operación sobre un recurso ajeno responde `404` (no distingue un recurso ajeno de uno inexistente) y ninguna pantalla expone datos de otro usuario.

#### CP-SEG-02 · Validación de entradas

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Seguridad · Integración API + UI |
| **Referencias** | NFR-SEG-002 |
| **Precondiciones** | Sesión de USR-A; identificadores válidos de cuenta y categoría para las pruebas negativas. |
| **Datos de prueba** | Ver tabla de entradas de los pasos. |
| **Evidencia esperada** | `NFR-SEG-002.e2e-spec.ts`; `client/lib/validation/__tests__/validation.test.ts`; respuestas `cURL`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | `POST /accounts` con nombre de 81 caracteres. | `400 VALIDATION_ERROR` con `fieldErrors.name`; no se crea la cuenta. |
| 2 | `POST /transactions` con `amount: 0` y con `amount: -100`. | `400` en ambos casos: el monto debe ser mayor que cero. |
| 3 | En la UI, ingresar un monto superior a `99.999.999.999.999,9999`. | Error de validación del cliente («El monto es demasiado grande») y no se envía la petición. |
| 4 | `POST /transactions` con `date: "2026-13-45"` o formato distinto de `YYYY-MM-DD`. | `400` con mensaje de fecha inválida. |
| 5 | `POST /transactions` con `accountId: "no-es-uuid"`. | `400`; no se consulta la base con un identificador inválido. |
| 6 | Enviar un campo no previsto en cualquier DTO (`"extra": true`). | `400` por `forbidNonWhitelisted`; no se persiste el recurso. |
| 7 | `POST /transactions` con descripción de 201 caracteres o notas de 501 caracteres. | `400`; la API no acepta valores fuera de longitud. |
| 8 | `POST /categories` con nombre de 41 caracteres o color `"rojo"`. | `400`; el color debe ser `#RRGGBB`. |
| 9 | `GET /transactions?page=0` y `?pageSize=101`. | `400`; `page ≥ 1` y `pageSize ≤ 100`. |
| 10 | Crear un movimiento con descripción `<script>alert(1)</script>`. | Se guarda y se muestra como texto escapado; el script no se ejecuta. |
| 11 | Repetir cada envío inválido y consultar la base o el listado. | No queda ningún registro parcial ni inconsistente. |

**Criterio de aprobación:** toda entrada inválida se rechaza con un error controlado (400) y ninguna deja datos persistidos; el contenido ingresado por el usuario se renderiza como texto, nunca como HTML ejecutable.

#### CP-SEG-03 · Almacenamiento de contraseñas y secretos

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Seguridad · Integración + inspección |
| **Referencias** | NFR-SEG-003 |
| **Precondiciones** | USR-D registrado en CP-ACC-01; acceso de lectura a la base de datos; repositorio clonado. |
| **Datos de prueba** | Email de USR-D y su contraseña en texto plano. |
| **Evidencia esperada** | `NFR-SEG-003.e2e-spec.ts`; salida de la consulta SQL; búsqueda de secretos en el bundle y en el repositorio. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Consultar `SELECT email, password_hash FROM users WHERE email = '<USR-D>';`. | `password_hash` comienza con `$argon2` y es distinto de la contraseña en texto plano. |
| 2 | Verificar el esquema de `users`. | No existe ninguna columna que almacene la contraseña en texto plano. |
| 3 | Inspeccionar el bundle del cliente y las peticiones de red. | No aparecen `AI_API_KEY`, `JWT_SECRET`, `DATABASE_URL` ni credenciales de base. |
| 4 | Buscar patrones de secretos en el repositorio (`AI_API_KEY`, `JWT_SECRET`, `password=`). | Solo aparecen en `.env.example` como nombres de variable, sin valores reales. |
| 5 | Revisar los logs de la API tras registrar, iniciar sesión y cambiar la contraseña. | No se registran contraseñas, tokens ni datos sensibles. |
| 6 | Provocar un error interno y revisar la respuesta. | El filtro global devuelve un mensaje genérico, sin detalles internos ni trazas. |

**Criterio de aprobación:** las contraseñas se almacenan con hash adaptativo (argon2), los secretos viven solo en el servidor y ni el cliente, ni el repositorio, ni los logs los exponen.

### 6.3. Cuentas

#### CP-CUE-01 · Alta y edición de cuenta

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-CUE-001, HU-005, SC-003 |
| **Precondiciones** | Sesión de USR-A; base sembrada. |
| **Datos de prueba** | CTA-QA-ARS y CTA-QA-USD (§4.4); tipos `cash`, `bank`, `wallet`, `other`; moneda no soportada `XXX`. |
| **Evidencia esperada** | `FR-CUE-001.e2e-spec.ts`, `FR-CUE-001-campos.e2e-spec.ts`, `FR-CUE-001-edicion.e2e-spec.ts`; `client/app/(app)/_components/accounts/__tests__/accounts.test.tsx`; `account-form-dialog.test.tsx`; `account-type-picker.test.tsx`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Inicio, pulsar `+` en la sección de cuentas y elegir el tipo `cash`. | Se abre el formulario de cuenta con nombre, tipo, moneda, saldo inicial y observaciones. |
| 2 | Enviar el formulario vacío. | Errores por campo (al menos el nombre) y no se crea la cuenta. |
| 3 | Crear CTA-QA-ARS con saldo inicial `10.000` y notas `Cuenta de prueba`. | La cuenta aparece en el listado con su saldo en ARS y la nota se conserva. |
| 4 | Crear CTA-QA-USD con saldo `500` en USD. | La cuenta aparece en el listado con su saldo en USD; la interfaz distingue la moneda. |
| 5 | Crear una cuenta con cada tipo (`bank`, `wallet`, `other`) y eliminarlas al final del paso. | Los cuatro tipos se aceptan y se muestran con su etiqueta correspondiente. |
| 6 | `POST /accounts` con `currency: "XXX"`, con `type: "crypto"` o con nombre de 81 caracteres. | `400 VALIDATION_ERROR` en los tres casos. |
| 7 | Editar CTA-QA-ARS: cambiar nombre a `Cuenta QA ARS editada`, tipo a `bank` y saldo inicial a `12.000`. | El listado y el detalle reflejan los cambios; el saldo se recalcula con el nuevo valor inicial. |
| 8 | Iniciar sesión con USR-B y abrir el listado de cuentas. | USR-B no ve CTA-QA-ARS ni CTA-QA-USD. |

**Criterio de aprobación:** la cuenta se crea con nombre, tipo, moneda, saldo inicial y observaciones; la edición se refleja en el listado y en el detalle; solo su propietario la ve.

#### CP-CUE-02 · Cálculo de saldo y eliminación

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-CUE-002, FR-CUE-003, HU-005 |
| **Precondiciones** | CTA-QA-ARS creada con saldo inicial `10.000,00` ARS; sesión de USR-A. |
| **Datos de prueba** | MOV-ING (`250.000,00` ARS) y MOV-GAS (`45.000,00` ARS) sobre CTA-QA-ARS; una transferencia de `100.000,00` ARS desde CTA-QA-ARS hacia `Banco`. |
| **Evidencia esperada** | `FR-CUE-002.e2e-spec.ts`; `GET /accounts` antes y después; captura del listado. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Consultar el saldo de CTA-QA-ARS recién creada. | `10.000,00` ARS (saldo inicial, sin movimientos). |
| 2 | Registrar MOV-ING sobre CTA-QA-ARS. | Saldo `260.000,00` ARS; el ingreso aparece en el detalle de la cuenta. |
| 3 | Registrar MOV-GAS sobre CTA-QA-ARS. | Saldo `215.000,00` ARS. |
| 4 | Registrar una transferencia de `100.000,00` ARS desde CTA-QA-ARS hacia `Banco`. | CTA-QA-ARS baja a `115.000,00` ARS y `Banco` sube `100.000,00` ARS. |
| 5 | `GET /accounts` y comparar con el cálculo manual. | Cada cuenta devuelve `initialBalance + Σ movimientos con signo` en su propia moneda. |
| 6 | Eliminar CTA-QA-ARS desde el listado y confirmar. | La cuenta desaparece del listado y del dashboard. |
| 7 | Consultar `GET /transactions` y `GET /transactions/<id de MOV-ING>`. | Los movimientos de la cuenta eliminada ya no existen; el detalle responde `404`. |
| 8 | Verificar la cuenta destino de la transferencia del paso 4 (`Banco`). | Su pata de transferencia también se eliminó: la eliminación es en cascada sobre ambas patas (FR-CUE-003). |

**Criterio de aprobación:** el saldo siempre coincide con saldo inicial más movimientos con signo, en la moneda de la cuenta; eliminar una cuenta elimina en cascada todos los movimientos en los que participa, incluidas ambas patas de una transferencia.

#### CP-CUE-03 · Moneda fija con movimientos

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-CUE-001, HU-005 |
| **Precondiciones** | CTA-QA-ARS con al menos un movimiento; una cuenta nueva sin movimientos. |
| **Datos de prueba** | CTA-QA-ARS (ARS, con MOV-ING) y `Cuenta sin movimientos` (ARS). |
| **Evidencia esperada** | Sin prueba automatizada específica: se ejecuta por API (`PATCH /accounts/:id`) y UI; se adjunta request/response y captura del campo deshabilitado. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir la edición de CTA-QA-ARS. | El selector de moneda está deshabilitado o bloqueado, con indicación de que la moneda no se puede cambiar si la cuenta tiene movimientos. |
| 2 | `PATCH /accounts/<CTA-QA-ARS>` con `currency: "USD"`. | `400 VALIDATION_ERROR` con `fieldErrors.currency`; la cuenta sigue en ARS. |
| 3 | `PATCH` del mismo recurso con otros campos (`name`, `initialBalance`). | Los demás campos se actualizan con normalidad. |
| 4 | Abrir la edición de `Cuenta sin movimientos` y cambiar su moneda a USD. | El cambio se acepta y la cuenta pasa a mostrarse en USD. |
| 5 | Cargar un movimiento sobre esa cuenta e intentar volver a cambiar la moneda. | El servidor y la UI rechazan el cambio. |

**Criterio de aprobación:** la moneda de una cuenta con movimientos no puede modificarse por UI ni por API; la cuenta mantiene su moneda original.

#### CP-CUE-04 · Detalle de cuenta

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · UI + API |
| **Referencias** | FR-CUE-004, HU-017, SC-003 |
| **Precondiciones** | CTA-QA-ARS con MOV-ING, MOV-GAS y una transferencia; sesión de USR-A. |
| **Datos de prueba** | CTA-QA-ARS; MOV-ING, MOV-GAS y la transferencia de CP-CUE-02. |
| **Evidencia esperada** | `client/app/(app)/accounts/detail/_components/account-detail-view/hooks/__tests__/use-account-detail.test.tsx`; captura del detalle. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Desde el listado de cuentas de Inicio, pulsar la fila de CTA-QA-ARS. | Se abre `/accounts/detail?id=<id>` con nombre, tipo, moneda, saldo inicial, saldo actual y notas de la cuenta. |
| 2 | Revisar los indicadores de la cuenta. | Se muestran los ingresos y los gastos acumulados de los movimientos cargados de la cuenta (hasta 100); las transferencias no se suman como ingreso ni como gasto. |
| 3 | Revisar el listado de movimientos del detalle. | Se listan los movimientos de la cuenta; cada uno permite abrir su edición. |
| 4 | Pulsar Editar. | Se reutiliza el formulario de cuenta con los datos precargados. |
| 5 | Guardar un cambio de nombre. | El detalle y el listado reflejan el nuevo nombre sin recargar manualmente. |
| 6 | Abrir el detalle de una cuenta ajena (USR-B) por URL. | No se muestran datos de la cuenta; la aplicación informa que no existe o redirige sin exponer información. |
| 7 | Eliminar la cuenta desde el detalle y confirmar. | La cuenta y sus movimientos se eliminan; la aplicación vuelve al inicio y el listado ya no la muestra. |

**Criterio de aprobación:** el detalle muestra datos, saldo actual, indicadores y movimientos de una cuenta propia; permite editar y eliminar reutilizando el formulario; nunca expone cuentas ajenas.

### 6.4. Movimientos

#### CP-TRX-01 · Registrar ingreso y gasto

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-TRX-001, HU-001, HU-008, SC-004 |
| **Precondiciones** | USR-A con cuentas y categorías del seed; sesión iniciada. |
| **Datos de prueba** | MOV-ING y MOV-GAS (§4.4); entradas inválidas: monto `0`, monto `-100`, descripción vacía, sin cuenta, sin categoría. |
| **Evidencia esperada** | `FR-TRX-001.e2e-spec.ts`, `FR-TRX-001-campos.e2e-spec.ts`; `client/app/(app)/_components/transactions/transaction-form-dialog/__tests__/transaction-form-dialog.test.tsx`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Movimientos, pulsar el botón de alta y elegir tipo Ingreso. | El formulario muestra monto, fecha, cuenta, categoría, descripción y notas; la categoría se limita al tipo ingreso. |
| 2 | Guardar sin completar monto, cuenta, categoría o descripción. | Errores por campo y no se envía la petición. |
| 3 | Ingresar monto `0` y luego `-100`. | Error «El monto debe ser mayor que cero» en ambos casos. |
| 4 | Completar MOV-ING y guardar. | El ingreso aparece en el listado agrupado por mes, el saldo de la cuenta sube `250.000,00` ARS y el dashboard incrementa sus ingresos. |
| 5 | Completar MOV-GAS con tipo Gasto y categoría `Supermercado` y guardar. | El gasto aparece en el listado, el saldo baja `45.000,00` ARS y el dashboard incrementa sus gastos. |
| 6 | `POST /transactions` con tipo `income` y sin `categoryId`. | `400 VALIDATION_ERROR` con `fieldErrors.categoryId`: la categoría es obligatoria para ingresos y gastos. |
| 7 | `POST /transactions` con `amount` como string (`"100"`). | `400`; el contrato exige un número. |
| 8 | Abrir el menú de una categoría del sistema en el formulario. | No se ofrecen acciones de edición ni eliminación; las categorías propias sí las ofrecen. |

**Criterio de aprobación:** el ingreso y el gasto se registran con todos sus campos, actualizan saldo y dashboard, y toda entrada inválida se rechaza sin persistir datos.

#### CP-TRX-02 · Transferencia válida

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + DB + UI |
| **Referencias** | FR-TRX-001, CAL-003, HU-002 |
| **Precondiciones** | Cuentas `Banco` y `Billetera virtual` del seed, ambas en ARS, con sesión de USR-A. |
| **Datos de prueba** | TRF-ARS: `100.000,00` ARS desde `Banco` hacia `Billetera virtual`. |
| **Evidencia esperada** | `FR-TRX-001-transferencia.e2e-spec.ts`; `CAL-003.e2e-spec.ts`; consulta SQL de las dos patas. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Movimientos, elegir tipo Transferencia. | El formulario pide cuenta origen, cuenta destino y monto; oculta la categoría. |
| 2 | Seleccionar la misma cuenta como origen y destino, y guardar. | Error «Elegí una cuenta de destino distinta»; no se persiste nada. |
| 3 | `POST /transactions` con `type: "transfer"` y sin `transferAccountId`. | `400 VALIDATION_ERROR` con `fieldErrors.transferAccountId`. |
| 4 | Completar TRF-ARS y guardar. | El origen baja `100.000,00` ARS y el destino sube `100.000,00` ARS; se crean dos filas con el mismo `transfer_group_id`. |
| 5 | Revisar el listado de movimientos. | La transferencia aparece como una sola fila; no se muestra duplicada. |
| 6 | Revisar los KPIs y los gráficos del dashboard. | Ingresos, gastos, ahorro y tasa de ahorro no cambian por la transferencia (CAL-003). |
| 7 | Consultar la base: `SELECT amount, account_id, transfer_account_id FROM transactions WHERE transfer_group_id = '<id>';`. | Dos filas: una negativa en origen y una positiva en destino, con el mismo grupo. |

**Criterio de aprobación:** la transferencia descuenta origen y acredita destino, exige cuentas distintas y propias, se persiste en dos patas atómicas y queda excluida de ingresos y gastos.

#### CP-TRX-03 · Edición, eliminación y propiedad

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-TRX-001, HU-008 |
| **Precondiciones** | MOV-GAS y TRF-ARS existentes; un movimiento de USR-B identificado. |
| **Datos de prueba** | MOV-GAS; TRF-ARS; UUID de un movimiento de USR-B. |
| **Evidencia esperada** | `FR-TRX-001-edicion.e2e-spec.ts`; `client/app/(app)/_components/transactions/__tests__/transactions.test.tsx`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir MOV-GAS desde el listado. | Se abre el formulario de edición con los datos precargados y el tipo deshabilitado. |
| 2 | Intentar cambiar el tipo de Gasto a Ingreso. | La UI no lo permite; `PATCH` con otro `type` responde `400 VALIDATION_ERROR`. |
| 3 | Cambiar monto a `50.000`, fecha, descripción, notas y categoría; guardar. | Los cambios se persisten, el saldo se recalcula y el dashboard se actualiza. |
| 4 | Editar un gasto y quitar la categoría (dejarla vacía). | `400 VALIDATION_ERROR`: la categoría es obligatoria al editar ingresos y gastos. |
| 5 | Eliminar MOV-GAS y confirmar en el diálogo. | El movimiento desaparece, el saldo se restituye y el dashboard se actualiza. |
| 6 | Eliminar TRF-ARS. | Se eliminan ambas patas de la transferencia y se restituyen los saldos de origen y destino. |
| 7 | Con sesión de USR-A, `PATCH` y `DELETE` sobre el movimiento de USR-B. | `404 NOT_FOUND` en ambos casos. |
| 8 | Editar un movimiento con un `accountId` de USR-B. | `404 NOT_FOUND`; no se reasigna el movimiento. |

**Criterio de aprobación:** la edición y la eliminación se aplican solo a movimientos propios, el tipo no cambia, los saldos y el dashboard se recalculan y todo acceso ajeno responde `404`.

#### CP-TRX-04 · Gestión de categorías propias

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-CAT-001, HU-013, SC-007 |
| **Precondiciones** | Categoría `Otros` (propia) de USR-A y cinco categorías del sistema; MOV-GAS disponible. |
| **Datos de prueba** | CAT-QA (`Mascotas`, gasto, `#8B5CF6`); duplicado `Sueldo` (ingreso); categoría propia de USR-B. |
| **Evidencia esperada** | `FR-TRX-001-campos.e2e-spec.ts` (casos de categorías); `client/app/(app)/categories/_components/categories-view/__tests__/categories-view.test.tsx`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Categorías, crear CAT-QA con tipo Gasto y color `#8B5CF6`. | La categoría aparece en la lista de categorías propias y en el formulario de gastos. |
| 2 | Asignar CAT-QA a un gasto y guardar. | El movimiento queda clasificado con CAT-QA y la categoría suma uso. |
| 3 | Editar el nombre de CAT-QA a `Mascotas y veterinaria` y cambiar el color. | Los cambios se reflejan en la lista y en el movimiento asociado. |
| 4 | Intentar cambiar el tipo de la categoría. | La UI no lo permite; la API no acepta `type` en `PATCH` (el tipo es inmutable). |
| 5 | Crear una categoría con nombre `Sueldo` y tipo Ingreso. | `400 VALIDATION_ERROR` con `fieldErrors.name`: el nombre es único por tipo entre las categorías visibles. |
| 6 | Crear una categoría con un nombre igual a una propia existente pero de distinto tipo. | Se acepta; la unicidad es por tipo. |
| 7 | `PATCH` y `DELETE` sobre una categoría del sistema. | `404 NOT_FOUND`; la categoría del sistema no se modifica. |
| 8 | `PATCH` y `DELETE` sobre una categoría propia de USR-B. | `404 NOT_FOUND`. |
| 9 | Eliminar CAT-QA y confirmar. | La categoría desaparece; los movimientos que la usaban quedan como «Sin categoría» y siguen existiendo. |

**Criterio de aprobación:** las categorías propias se crean, asignan, editan y eliminan; las del sistema y las ajenas son de solo lectura; eliminar una propia deja sus movimientos sin categoría sin borrarlos.

#### CP-TRX-05 · Búsqueda y filtros

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · UI |
| **Referencias** | FR-TRX-002, HU-012, SC-004 |
| **Precondiciones** | USR-A con MOV-ING, MOV-GAS, TRF-ARS, TRF-USD y los movimientos del seed; sesión iniciada. |
| **Datos de prueba** | Cadenas `Sueldo`, `Compra QA`; categoría `Supermercado`; monto `45000`; combinaciones de tipo, cuenta, categoría, moneda y período. |
| **Evidencia esperada** | `client/app/(app)/transactions/_components/transactions-view/components/__tests__/transaction-filters.test.tsx`; capturas de cada combinación. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir Movimientos sin filtros. | Se muestran los movimientos del período compartido, ordenados por fecha descendente. |
| 2 | Buscar `Sueldo` en el campo de búsqueda. | Solo aparecen los movimientos cuyo concepto, nota, categoría o monto coincide; la lista se actualiza al escribir. |
| 3 | Buscar `Compra QA` por concepto y luego por una nota cargada. | Ambos criterios encuentran el movimiento correspondiente. |
| 4 | Buscar por monto (`45000`). | Se muestran los movimientos cuyo valor contiene esa secuencia; el gasto de `45.000,00` aparece en el resultado. |
| 5 | Filtrar por tipo Gasto. | Solo se listan gastos; las transferencias y los ingresos desaparecen. |
| 6 | Combinar tipo Gasto + cuenta `Cuenta QA ARS` + categoría `Supermercado` + moneda ARS. | Se muestran solo los movimientos que cumplen **todos** los filtros. |
| 7 | Cambiar el período a `Últimos 30 días` y luego a `6 meses`. | La lista cambia coherentemente con el período compartido. |
| 8 | Aplicar un filtro sin resultados. | Se muestra un estado vacío comprensible, con opción de limpiar filtros. |
| 9 | Limpiar los filtros. | Se restablece la lista completa del período. |

**Criterio de aprobación:** la búsqueda y los filtros se combinan por conjunción, actualizan la lista sin recargar la página y respetan el período compartido; los filtros operan sobre los movimientos cargados en la vista (hasta 100 registros, límite documentado en FR-TRX-002).

#### CP-TRX-06 · Transferencia multimoneda

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API + DB + UI |
| **Referencias** | FR-TRX-001, HU-002, RN-001, RN-002 |
| **Precondiciones** | `Banco` (ARS) y `Billetera USD` (USD) propias; `GET /currencies/rates` disponible. |
| **Datos de prueba** | TRF-USD: `50.000,00` ARS; cotización sugerida por la API; monto destino editado manualmente en un segundo intento. |
| **Evidencia esperada** | Sin prueba automatizada específica de `transferAmount`: se ejecuta por API y UI y se adjunta request/response y consulta SQL. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Crear una transferencia desde `Banco` (ARS) hacia `Billetera USD` (USD) por `50.000,00` ARS. | La UI muestra la cotización sugerida y calcula el monto que llega a destino. |
| 2 | Confirmar sin editar la cotización. | Se registran dos montos coherentes: `-50.000,00` ARS en origen y el equivalente en USD en destino. |
| 3 | Consultar la base para el `transfer_group_id`. | Solo se persisten los dos montos y las cuentas; **no** se guarda la cotización usada. |
| 4 | `POST /transactions` multimoneda sin `transferAmount`. | `400 VALIDATION_ERROR` con `fieldErrors.transferAmount`: se debe indicar el monto de destino. |
| 5 | Editar la transferencia y modificar el monto destino (sobrescribir la cotización sugerida). | La operación se acepta; ambas patas conservan la coherencia de sus montos. |
| 6 | Editar nuevamente el monto de origen sin enviar `transferAmount`. | `400`: al cambiar el monto de una transferencia multimoneda se debe indicar el monto destino. |
| 7 | Editar la descripción o las notas de la transferencia. | Se actualizan ambas patas de forma atómica sin alterar los montos. |
| 8 | Crear una transferencia entre dos cuentas ARS con `transferAmount` distinto del monto. | El servidor ignora el valor y usa el mismo monto en ambas patas (misma moneda). |
| 9 | Eliminar la transferencia. | Se eliminan ambas patas. |

**Criterio de aprobación:** se registran dos montos coherentes con la cotización usada, la cotización no se persiste, editar conserva la coherencia de ambos montos y la transferencia sigue excluida de ingresos y gastos.

#### CP-TRX-07 · Historial de movimientos

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · API + UI |
| **Referencias** | FR-TRX-004, HU-018, SC-004 |
| **Precondiciones** | USR-A con más de 10 movimientos visibles en el período, incluidas transferencias. |
| **Datos de prueba** | Dataset del seed + MOV-ING, MOV-GAS, TRF-ARS y TRF-USD. |
| **Evidencia esperada** | Captura del listado agrupado y paginado; `GET /transactions?page=1&pageSize=20`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir Movimientos. | El historial se ordena por fecha descendente y se agrupa por mes, sin subtotales por grupo. |
| 2 | Revisar una transferencia en el listado. | Aparece en una sola fila (origen → destino), sin duplicar las dos patas. |
| 3 | Pulsar sobre un movimiento. | Se abre su formulario de edición. |
| 4 | Recorrer la paginación. | La lista muestra 10 filas por página y permite avanzar y retroceder; el total de páginas es coherente con los movimientos cargados. |
| 5 | `GET /transactions?page=1&pageSize=20`. | Devuelve `{ items, page, pageSize, total, totalPages }` con 20 ítems como máximo y orden descendente por fecha. |
| 6 | `GET /transactions?page=1&pageSize=100`. | Se acepta el máximo permitido; un `pageSize` mayor responde `400`. |
| 7 | Comparar la cantidad de filas con el total informado por la API. | No se pierden ni se duplican movimientos al paginar. |

**Criterio de aprobación:** el historial se ordena por fecha descendente, se agrupa por mes, colapsa las transferencias en una fila y cada movimiento abre su edición; la paginación es coherente.

#### CP-TRX-08 · Exportación CSV

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · UI |
| **Referencias** | FR-TRX-003, HU-019, SC-004 |
| **Precondiciones** | USR-A con movimientos visibles; USR-C sin movimientos. |
| **Datos de prueba** | MOV-ING (`250.000,00`), MOV-GAS (`45.000,00`), TRF-ARS y TRF-USD. |
| **Evidencia esperada** | `client/hooks/__tests__/use-export-transactions.test.tsx`; archivo CSV descargado; captura de la planilla con la columna `Monto` sumada. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Movimientos, pulsar Exportar CSV. | Se descarga `movimientos-<AAAA-MM-DD>.csv` con codificación UTF-8 (BOM) y separador coma. |
| 2 | Abrir el archivo. | Encabezados: `Fecha`, `Tipo`, `Descripción`, `Categoría`, `Cuenta`, `Moneda`, `Monto`, `Notas`. |
| 3 | Revisar la columna `Monto`. | Contiene el valor numérico crudo (`250000`), no el formato de pantalla (`$ 250.000,00`). **Regresión de BUG-001.** |
| 4 | Sumar la columna `Monto` en una planilla. | La operación aritmética funciona porque la columna se interpreta como número. |
| 5 | Aplicar un filtro y exportar. | El CSV contiene únicamente los movimientos visibles que cumplen los filtros. |
| 6 | Revisar una transferencia en el CSV. | Las patas de la transferencia conservan su trazabilidad: la columna `Cuenta` identifica origen y destino y los montos reflejan cada pata. La transferencia no se cuenta como ingreso ni como gasto. |
| 7 | Iniciar sesión con USR-C (sin datos) y pulsar Exportar. | Se informa «No hay movimientos para exportar» y no se descarga ningún archivo. |
| 8 | Exportar con más de 100 movimientos en el período. | Se exportan como máximo los 100 movimientos cargados en la vista (límite documentado por FR-TRX-003). |

**Criterio de aprobación:** el CSV se descarga con los movimientos visibles, la columna `Monto` es numérica y operable, las transferencias conservan su trazabilidad y sin movimientos no se genera archivo.

### 6.5. Categorías

#### CP-CAT-01 · Listado y uso

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · API + UI |
| **Referencias** | FR-CAT-001, FR-CAT-002, HU-020, SC-007 |
| **Precondiciones** | USR-A con gastos categorizados y CAT-QA; período con movimientos. |
| **Datos de prueba** | Categorías del sistema, `Otros` y CAT-QA; gastos categorizados del seed. |
| **Evidencia esperada** | `client/app/(app)/categories/_components/categories-view/__tests__/categories-view.test.tsx`; captura de ambas pestañas. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir Categorías. | Se listan las cinco categorías del sistema y las propias del usuario. |
| 2 | Alternar las pestañas Gastos e Ingresos. | Cada pestaña muestra solo las categorías del tipo correspondiente. |
| 3 | Revisar cada fila. | Se muestran cantidad de movimientos, monto y porcentaje del período, ordenados por uso descendente. |
| 4 | Cambiar el período a `6 meses` y luego a `12 meses`. | Los valores de uso se recalculan para el período elegido. |
| 5 | Revisar las categorías del sistema. | No ofrecen acciones de edición ni eliminación. |
| 6 | Revisar las categorías propias. | Ofrecen acciones de edición y eliminación. |
| 7 | Sumar los porcentajes de las categorías de gasto con movimientos. | La suma es 100 % (salvo redondeo); los movimientos sin categoría no se atribuyen a ninguna categoría. |
| 8 | Eliminar una categoría propia usada y volver a Categorías. | Sus movimientos dejan de computarse en la categoría eliminada y se muestran como «Sin categoría». |

**Criterio de aprobación:** se listan las cinco categorías del sistema y las propias con cantidad, monto y porcentaje del período, ordenadas por uso; las del sistema no muestran acciones.

#### CP-CAT-02 · Moneda de visualización

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · UI + API |
| **Referencias** | FR-CAT-002, RN-001 |
| **Precondiciones** | USR-A con movimientos en ARS y USD; selector de moneda visible en Categorías. |
| **Datos de prueba** | Monedas ARS y USD; cotización vigente de `GET /currencies/rates`. |
| **Evidencia esperada** | Capturas de ambos estados y comparación con el cálculo manual; `currency.test.ts` para el formateo. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Con la moneda de visualización en ARS, anotar los montos y porcentajes de tres categorías. | Se muestran en ARS. |
| 2 | Cambiar el selector a USD. | Los montos se re-expresan en USD con la cotización de la API; los porcentajes se recalculan sobre los montos convertidos y su suma sigue siendo 100 % (salvo redondeo). |
| 3 | Verificar que los movimientos en ARS sigan incluidos. | No se excluye ningún movimiento por su moneda nativa: todos se convierten a la moneda de visualización. |
| 4 | Volver a ARS. | Los valores coinciden con los anotados en el paso 1 (tolerancia de redondeo). |
| 5 | Revisar los datos financieros después del cambio. | No se modifican cuentas, movimientos ni cotizaciones: solo cambia la presentación (RN-001). |
| 6 | `GET /currencies/rates` durante la prueba. | Las tasas provienen de la API y no se persisten; el usuario no puede editarlas. |

**Criterio de aprobación:** los montos y porcentajes se recalculan en la moneda elegida incluyendo movimientos de otras monedas, sin alterar los datos financieros.

### 6.6. Dashboard y patrimonio

#### CP-DAS-01 · Patrimonio neto

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API |
| **Referencias** | CAL-001, FR-DAS-001, HU-006, RN-001 |
| **Precondiciones** | USR-A con cuentas en ARS y USD; CTA-QA-ARS y CTA-QA-USD creadas; cotización disponible. |
| **Datos de prueba** | CTA-QA-ARS `215.000,00` ARS; CTA-QA-USD `500,00` USD; cotización `1 USD = 1.500,00 ARS` (referencia). |
| **Evidencia esperada** | `FR-DAS-001.e2e-spec.ts`; `CAL-001.e2e-spec.ts`; `GET /dashboard?currency=ARS`; captura del hero. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir el dashboard con moneda de lectura ARS. | El patrimonio neto se muestra como suma de los saldos convertidos; con más de una moneda se muestra el desglose por moneda. |
| 2 | Calcular manualmente `Σ (saldo × cotización)` de todas las cuentas. | El valor coincide con el mostrado (tolerancia de redondeo de 0,01). |
| 3 | Sumar el desglose por moneda convertido a ARS. | El total del desglose coincide con el patrimonio neto. |
| 4 | `GET /dashboard?currency=ARS`. | `kpis.netWorth` coincide con la UI; `breakdown` expone cada moneda nativa y su equivalente; `rates` expone la cotización y su fecha. |
| 5 | Cambiar la moneda de lectura a USD. | El patrimonio se re-expresa en USD y el desglose se mantiene coherente. |
| 6 | Registrar un gasto y volver al dashboard. | El patrimonio baja por el monto del gasto convertido a la moneda de lectura. |

**Criterio de aprobación:** el patrimonio neto es `Σ (saldo × cotización)` de las cuentas actuales en la moneda de lectura, coincide con el cálculo manual y con el desglose por moneda.

#### CP-DAS-02 · Indicadores del período

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · Integración API |
| **Referencias** | FR-DAS-001, CAL-002, CAL-004, HU-006, HU-009 |
| **Precondiciones** | USR-A con MOV-ING y MOV-GAS en el período y movimientos en USD. |
| **Datos de prueba** | MOV-ING `250.000,00` ARS; MOV-GAS `45.000,00` ARS; cotización de referencia `1.500`. |
| **Evidencia esperada** | `FR-DAS-001.e2e-spec.ts`, `CAL-002.e2e-spec.ts`, `CAL-004.e2e-spec.ts`; captura de KPIs. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Seleccionar `Este mes` y la moneda de lectura ARS. | Se muestran ingresos, gastos y ahorro del período, incluyendo todas las monedas convertidas a ARS. |
| 2 | Comparar ingresos y gastos con los movimientos del período. | Los totales coinciden con la suma de los movimientos, cada uno convertido desde la moneda de su cuenta. |
| 3 | Verificar el ahorro. | Ahorro = ingresos − gastos del período. Con los datos de referencia: `205.000,00` ARS. |
| 4 | Verificar la tasa de ahorro. | `ahorro / ingresos × 100` = `82,00 %`; con ingresos 0, la tasa es 0. |
| 5 | Repetir con moneda de lectura USD. | Todos los flujos se re-expresan en USD y el ahorro sigue siendo ingresos − gastos. |
| 6 | Revisar el patrimonio neto mostrado junto a los KPIs. | Es el patrimonio **actual**, no el del cierre del período (CAL-001). |
| 7 | Cambiar el período a `6 meses`. | Los KPIs se recalculan para el nuevo rango y el período queda compartido con Movimientos, Categorías y Asistente. |

**Criterio de aprobación:** ingresos, gastos y ahorro incluyen todas las monedas convertidas a la moneda de lectura; la tasa de ahorro se calcula sobre esos flujos; el patrimonio mostrado es el actual.

#### CP-DAS-03 · Consistencia de cálculos

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Integración · API + UI |
| **Referencias** | FR-DAS-001, CAL-001, CAL-002, CAL-004, criterio de bondad «Consistencia de los cálculos» |
| **Precondiciones** | Base recién sembrada; sesión de USR-A; anotar los movimientos del período. |
| **Datos de prueba** | Dataset completo del seed del período `Este mes`. |
| **Evidencia esperada** | Comparación dashboard vs. `GET /transactions`; `CAL-001/002/004`; captura de la planilla de control. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Anotar ingresos, gastos y ahorro del dashboard en ARS. | Valores visibles y estables durante la prueba. |
| 2 | Obtener los movimientos del período por API y separar ingresos, gastos y transferencias. | Totales calculados manualmente. |
| 3 | Comparar ambos conjuntos de valores. | Coinciden con una tolerancia de 0,01 por redondeo de cotizaciones. |
| 4 | Verificar que las transferencias no estén sumadas en ingresos ni en gastos. | El total de ingresos/gastos del dashboard excluye las transferencias. |
| 5 | Comparar la tasa de ahorro con el cociente calculado. | Coincide; la variación se expresa en puntos porcentuales. |
| 6 | Repetir con el período `12 meses` y con moneda USD. | La consistencia se mantiene en ambos períodos y monedas. |

**Criterio de aprobación:** los totales del dashboard coinciden con los movimientos registrados en todos los períodos y monedas de lectura probados.

#### CP-DAS-04 · Gráficos y período

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Funcional · UI + API |
| **Referencias** | FR-DAS-002, FR-DAS-003, HU-007, SC-002 |
| **Precondiciones** | USR-A con movimientos de varios meses y categorías de gasto. |
| **Datos de prueba** | Períodos `Este mes`, `Últimos 30 días`, `6 meses`, `12 meses`; monedas ARS y USD; un gasto sin categoría (por ejemplo, tras eliminar CAT-QA en CP-TRX-04). |
| **Evidencia esperada** | `FR-DAS-002.e2e-spec.ts`, `FR-DAS-002-ingresos-gastos.e2e-spec.ts`, `FR-DAS-002-gastos-categoria.e2e-spec.ts`; `category-donut.test.tsx`; `chart-data-table.test.tsx`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir el dashboard con `Este mes`. | Se muestran los tres gráficos: evolución del patrimonio, ingresos frente a gastos y gastos por categoría. |
| 2 | Cambiar el período a `12 meses`. | Los tres gráficos reflejan el nuevo rango; la evolución del patrimonio pasa a granularidad mensual. |
| 3 | Revisar el gráfico de ingresos vs. gastos. | Las barras suman los ingresos y gastos del período; las transferencias no aparecen. |
| 4 | Revisar el donut de gastos por categoría. | Solo incluye gastos con categoría, con el color de cada categoría y la leyenda con monto y porcentaje. |
| 5 | Verificar un gasto sin categoría. | No aparece en el donut, pero sí suma en `kpis.expenses`. |
| 6 | Cambiar la moneda de lectura a USD. | Los tres gráficos se re-expresan en USD sin alterar los datos. |
| 7 | Revisar la accesibilidad de los gráficos. | Cada gráfico ofrece tooltip, resumen textual o tabla de datos alternativa; la información no depende solo del color. |

**Criterio de aprobación:** los tres gráficos reflejan el período y la moneda de lectura, las transferencias quedan excluidas y los gastos sin categoría se incluyen en el total pero no en el donut.

#### CP-DAS-05 · Granularidad diaria y semanal

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Integración · API + UI |
| **Referencias** | FR-DAS-002, FR-DAS-003, HU-007 |
| **Precondiciones** | USR-A con movimientos en el mes en curso y en los últimos 12 meses. |
| **Datos de prueba** | Rangos de 1 a 31 días y rangos mayores a 31 días; `from`/`to` explícitos. |
| **Evidencia esperada** | `FR-DAS-002.e2e-spec.ts`; `GET /dashboard` con rangos de distinta duración; capturas. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Seleccionar `Este mes`. | `netWorthSeries` devuelve un punto por día; `incomeExpenseByPeriod` usa `bucket: "week"`. |
| 2 | Seleccionar `Últimos 30 días`. | Se mantiene la granularidad diaria del patrimonio y semanal de las barras. |
| 3 | Seleccionar `6 meses`. | El patrimonio se muestra al cierre de cada mes y las barras usan `bucket: "month"`. |
| 4 | Seleccionar `12 meses`. | Se mantiene la granularidad mensual en ambos gráficos. |
| 5 | `GET /dashboard` con un rango de 31 días y con uno de 32 días. | El primero usa tramos semanales; el segundo, mensuales. |
| 6 | `GET /dashboard` con un rango mayor a 366 días o invertido. | `400 VALIDATION_ERROR`. |
| 7 | Comparar los totales de cada gráfico con los movimientos del período. | Coinciden con una tolerancia de 0,01. |

**Criterio de aprobación:** en rangos de hasta 31 días el patrimonio se muestra por día y las barras por semana; en rangos mayores, ambos por mes; los totales coinciden con los movimientos.

#### CP-DAS-06 · Selector de moneda de lectura

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · UI + API |
| **Referencias** | FR-DAS-003, RN-001, HU-016 |
| **Precondiciones** | USR-A con cuentas en ARS y USD; USR-B con una sola moneda. |
| **Datos de prueba** | ARS (principal), USD, EUR mediante «Otra moneda». |
| **Evidencia esperada** | `FR-DAS-003.e2e-spec.ts`; `dashboard-currency-selector.test.tsx`; capturas de los tres estados. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir el dashboard con USR-A. | El selector de moneda de lectura aparece en el header, antes del período, porque hay más de una moneda disponible. |
| 2 | Elegir USD. | Todos los valores del dashboard (patrimonio, KPIs y gráficos) se re-expresan en USD. |
| 3 | Elegir «Otra moneda» y seleccionar EUR. | Se permite elegir cualquier moneda del catálogo; los valores se re-expresan en EUR. |
| 4 | Volver a ARS. | Los valores coinciden con los iniciales (tolerancia de redondeo). |
| 5 | Revisar el desglose por moneda. | Se mantiene y se expresa en la moneda de lectura elegida. |
| 6 | Verificar los datos financieros. | No se alteran saldos, movimientos ni cotizaciones: solo cambia la presentación. |
| 7 | Iniciar sesión con USR-B (una sola moneda). | El selector no se muestra o queda fijo en la moneda principal. |

**Criterio de aprobación:** el selector re-expresa todos los valores en la moneda elegida, incluye «Otra moneda» con el catálogo completo, conserva el desglose y no altera los datos.

### 6.7. Cálculos

> Los casos CAL se ejecutan a nivel unitario/integración sobre los servicios de cálculo y se contrastan con la API. La tolerancia admitida es 0,01 por redondeo.

#### CP-CAL-001 · CAL-001 Patrimonio neto

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Unitario / integración · Fórmula |
| **Referencias** | CAL-001, FR-DAS-001, NFR-CAL-001 |
| **Precondiciones** | Cotizaciones de referencia fijadas para el caso. |
| **Datos de prueba** | Cuenta ARS: `100.000,00`; cuenta USD: `500,00`; cotización `1 USD = 1.500,00 ARS`. |
| **Evidencia esperada** | `CAL-001.e2e-spec.ts`; salida de la prueba unitaria del servicio de cálculos. |
| **Estado** | No ejecutado |

| # | Entrada | Cálculo esperado | Resultado |
|---|---|---|---|
| 1 | Moneda de lectura ARS. | `100.000 × 1 + 500 × 1.500` | `850.000,00` ARS |
| 2 | Moneda de lectura USD. | `100.000 / 1.500 + 500` | `566,67` USD |
| 3 | Se agrega una cuenta ARS con `-10.000,00`. | `(100.000 − 10.000) + 750.000` | `840.000,00` ARS |
| 4 | Se elimina la cuenta USD. | `100.000 × 1` | `100.000,00` ARS |
| 5 | Usuario sin cuentas. | Suma vacía | `0,00` |

**Criterio de aprobación:** `Σ (saldo × cotización)` de las cuentas del usuario, expresado en la moneda de lectura, con tolerancia de 0,01.

#### CP-CAL-002 · CAL-002 Flujo de fondos

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Unitario / integración · Fórmula |
| **Referencias** | CAL-002, FR-DAS-001, NFR-CAL-001 |
| **Precondiciones** | Movimientos del período en ARS y USD; cotización de referencia `1.500`. |
| **Datos de prueba** | Ingresos: `300.000,00` ARS + `200,00` USD. Gastos: `150.000,00` ARS + `100,00` USD. |
| **Evidencia esperada** | `CAL-002.e2e-spec.ts`; salida de la prueba unitaria. |
| **Estado** | No ejecutado |

| # | Entrada | Cálculo esperado | Resultado |
|---|---|---|---|
| 1 | Ingresos convertidos a ARS. | `300.000 + 200 × 1.500` | `600.000,00` ARS |
| 2 | Gastos convertidos a ARS. | `150.000 + 100 × 1.500` | `300.000,00` ARS |
| 3 | Flujo del período. | `600.000 − 300.000` | `300.000,00` ARS |
| 4 | Moneda de lectura USD. | `(300.000 + 300.000) / 1.500` y `(150.000 + 150.000) / 1.500` | Ingresos `400,00` USD; gastos `200,00` USD; flujo `200,00` USD |
| 5 | Período sin movimientos. | Sumas vacías | `0,00` |

**Criterio de aprobación:** cada flujo se convierte a la moneda de lectura antes de agregarse y el resultado es ingresos − gastos del período.

#### CP-CAL-003 · CAL-003 Transferencias

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Unitario / integración · Fórmula |
| **Referencias** | CAL-003, FR-TRX-001, NFR-CAL-001 |
| **Precondiciones** | Una transferencia entre cuentas de la misma moneda y una multimoneda. |
| **Datos de prueba** | TRF-ARS `100.000,00` ARS; TRF-USD `50.000,00` ARS → `33,33` USD (cotización `1.500`). |
| **Evidencia esperada** | `CAL-003.e2e-spec.ts`; consulta SQL de ambas patas. |
| **Estado** | No ejecutado |

| # | Entrada | Cálculo esperado | Resultado |
|---|---|---|---|
| 1 | Ingresos y gastos con una transferencia ARS→ARS. | Los totales de ingresos y gastos no cambian. | Flujo sin alteración |
| 2 | Transferencia multimoneda ARS→USD. | Se excluye de ingresos y gastos; cada pata conserva su monto. | Origen `-50.000,00` ARS; destino `+33,33` USD |
| 3 | Saldo de origen. | `saldo inicial − 50.000` | Descuento correcto |
| 4 | Saldo de destino. | `saldo inicial + 33,33` | Acreditación correcta |
| 5 | Categoría de la transferencia. | Nula en ambas patas. | Sin categoría |

**Criterio de aprobación:** las transferencias se excluyen de los flujos consolidados y cada pata conserva su monto en la moneda de su cuenta.

#### CP-CAL-004 · CAL-004 Tasa de ahorro

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Unitario / integración · Fórmula |
| **Referencias** | CAL-004, FR-DAS-001, NFR-CAL-001 |
| **Precondiciones** | Flujos del período y del período anterior calculados. |
| **Datos de prueba** | Ahorro `205.000,00`; ingresos `250.000,00`; período anterior con tasa `75,00 %`. |
| **Evidencia esperada** | `CAL-004.e2e-spec.ts`; captura del KPI con su variación. |
| **Estado** | No ejecutado |

| # | Entrada | Cálculo esperado | Resultado |
|---|---|---|---|
| 1 | Ahorro e ingresos del período. | `205.000 / 250.000 × 100` | `82,00 %` |
| 2 | Período anterior con tasa `75,00 %`. | `82 − 75` | Variación `+7,00` puntos porcentuales |
| 3 | Ingresos del período iguales a 0. | Regla de borde | Tasa `0 %` |
| 4 | Ahorro negativo (gastos mayores que ingresos). | `−50.000 / 200.000 × 100` | `−25,00 %` |
| 5 | Conversión de moneda. | Cálculo sobre los flujos ya convertidos a la moneda de lectura. | Tasa coherente con los flujos convertidos |

**Criterio de aprobación:** la tasa es `ahorro / ingresos × 100` sobre flujos convertidos, con 0 cuando no hay ingresos, y su variación se expresa en puntos porcentuales.

### 6.8. Asistente de IA

#### CP-IA-01 · Consulta verificable

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · Integración API (SSE) + UI |
| **Referencias** | FR-IA-001, HU-003, HU-006, SC-005 |
| **Precondiciones** | USR-A con movimientos; proveedor de IA disponible; período `Este mes`; moneda principal ARS. |
| **Datos de prueba** | Pregunta: «¿Cuánto gasté este mes y en qué categorías?». |
| **Evidencia esperada** | `FR-IA-001.e2e-spec.ts`; `client/lib/api/__tests__/assistant-stream.test.ts`; `assistant-chat.test.tsx`; captura del stream y comparación con el dashboard. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir `/assistant` y enviar la pregunta. | La respuesta se transmite por streaming (SSE) y se renderiza como texto plano. |
| 2 | Revisar el evento `meta`. | Expone `period`, `currency` (`ARS`), `sources` (`transactions`, `accounts`, `categories`, `currencies`) y el aviso de que no es asesoramiento financiero. |
| 3 | Revisar el contenido de la respuesta. | Menciona el período y la moneda; incluye las categorías consideradas y los totales de gasto. |
| 4 | Comparar los totales con el dashboard del mismo período leído en ARS. | Coinciden con una tolerancia de 0,01. |
| 5 | Revisar el evento `done`. | `insufficient: false` cuando la respuesta es utilizable. |
| 6 | Provocar una consulta sin datos suficientes (USR-C). | El asistente declara información insuficiente y `done.insufficient` es `true`. |
| 7 | Cancelar la respuesta mientras se transmite. | El stream se interrumpe y la interfaz queda usable. |
| 8 | `POST /assistant/messages` sin sesión. | La petición se rechaza; no hay fallback a un usuario demo. |

**Criterio de aprobación:** el stream expone período, moneda y fuentes; las cifras son verificables contra el dashboard del mismo período y moneda; el asistente no inventa datos y declara insuficiencia cuando corresponde.

#### CP-IA-02 · Solo consulta

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-IA-001, HU-010 |
| **Precondiciones** | USR-A con dataset; anotar cantidad de movimientos y saldos antes de la prueba. |
| **Datos de prueba** | «Creá un gasto de 10.000 en Supermercado», «Eliminá mi último movimiento», «Cambiá mi moneda principal a USD». |
| **Evidencia esperada** | `FR-IA-001.e2e-spec.ts`; capturas de las respuestas; comparación de `GET /transactions` y `GET /accounts` antes y después. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Pedir al asistente que cree un gasto. | El asistente explica que solo responde consultas y no crea el movimiento. |
| 2 | Pedirle que elimine un movimiento. | Rechaza la acción; el movimiento sigue existiendo. |
| 3 | Pedirle que cambie la moneda principal o un saldo. | Rechaza la acción; la preferencia y los datos no cambian. |
| 4 | Comparar `GET /transactions` y `GET /accounts` antes y después. | Misma cantidad de registros y mismos valores. |
| 5 | Revisar el dashboard. | No hay cambios en KPIs ni en gráficos. |
| 6 | Revisar el contrato del endpoint. | No existe ninguna herramienta o endpoint de escritura expuesto al asistente; solo `POST /assistant/messages` de consulta. |

**Criterio de aprobación:** el asistente nunca crea, edita ni elimina datos y rechaza explícitamente los pedidos de escritura.

#### CP-IA-03 · Continuidad conversacional

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-IA-002, HU-015 |
| **Precondiciones** | USR-A con gastos en `Supermercado` y otros; período `Este mes`. |
| **Datos de prueba** | Pregunta 1: «¿Cuánto gasté este mes?». Pregunta 2: «¿Y en supermercado?». |
| **Evidencia esperada** | `client/app/(app)/_components/assistant/assistant-chat/hooks/__tests__/assistant-history.test.ts`; `FR-IA-001.e2e-spec.ts`; capturas. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Enviar la pregunta 1. | El asistente responde con el gasto total del período y la moneda. |
| 2 | Enviar la pregunta 2 sin repetir período ni moneda. | Interpreta la pregunta como seguimiento de la anterior y responde el gasto de `Supermercado` del mismo período. |
| 3 | Revisar el request enviado por el cliente. | Incluye `history` con los turnos recientes (hasta los últimos 10) y el período vigente. |
| 4 | Enviar un historial de más de 12 mensajes por API. | `400 VALIDATION_ERROR` (`@ArrayMaxSize(12)`); no se persiste el historial. |
| 5 | Recargar `/assistant`. | La conversación aparece vacía: la memoria vive solo en el cliente. |
| 6 | Reiniciar la API y repetir una pregunta de seguimiento sin historial. | El asistente no conserva contexto previo; responde solo con los datos actuales. |
| 7 | Revisar la base de datos. | No existe una tabla ni registro de conversaciones del asistente. |

**Criterio de aprobación:** el asistente interpreta preguntas de seguimiento con los turnos recientes enviados por el cliente, mantiene las cifras del período vigente y el servidor no persiste la conversación.

### 6.9. No funcionales y usabilidad

#### CP-NFR-01 · Diseño adaptable

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Usabilidad · UI |
| **Referencias** | FRD §4.2 — criterio de bondad «Usabilidad y respuesta de la interfaz» |
| **Precondiciones** | USR-A con datos; navegador con DevTools para emular resoluciones. |
| **Datos de prueba** | `360 × 640` (móvil), `768 × 1024` (tablet), `1440 × 900` (escritorio). |
| **Evidencia esperada** | Capturas de las tres resoluciones del dashboard, movimientos y formularios. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir el dashboard en `1440 × 900`. | Se muestra la sidebar de 260 px con la navegación completa y el layout de escritorio. |
| 2 | Abrir el dashboard en `360 × 640`. | Se muestra la barra inferior con 4 ítems (`Inicio`, `Movimientos`, `Asistente`, `Perfil`); no hay scroll horizontal. |
| 3 | Recorrer Inicio, Movimientos, Categorías, Asistente y Ajustes en móvil. | Todos los flujos son usables: formularios, filtros y diálogos caben en pantalla y los botones son accesibles al tacto. |
| 4 | Revisar tablas, gráficos y KPIs en móvil. | Se apilan sin superposición, con texto legible y sin cortar importes. |
| 5 | Revisar el área segura inferior en un dispositivo con gesto de home. | La barra respeta `env(safe-area-inset-bottom)`. |
| 6 | Revisar contraste y foco de teclado en ambos temas. | El estado activo no depende solo del color; el foco es visible y el contraste es suficiente. |
| 7 | Rotar el dispositivo o redimensionar la ventana. | El layout se adapta sin perder el estado de la página. |

**Criterio de aprobación:** los flujos principales son usables y legibles en escritorio y móvil, sin scroll horizontal ni contenido cortado.

#### CP-NFR-02 · Estados de carga y error

| Campo | Valor |
|---|---|
| **Prioridad** | P0 |
| **Tipo / nivel** | Usabilidad / robustez · UI + integración |
| **Referencias** | Dependencias del FRD §2.5, criterio de bondad «Usabilidad y respuesta de la interfaz» |
| **Precondiciones** | Entorno operativo; posibilidad de detener la API y de simular la caída del proveedor de IA o de cotizaciones. |
| **Datos de prueba** | API detenida; `AI_API_KEY` inválida o proveedor inaccesible; proveedor de cotizaciones inaccesible. |
| **Evidencia esperada** | Capturas de skeletons y mensajes de error; logs de la API; `assistant-stream.test.ts`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir el dashboard con la API lenta. | Se muestran `Skeleton` en KPIs, gráficos y listas hasta que llegan los datos. |
| 2 | Detener la API y navegar a Movimientos. | Se informa el error de forma comprensible (estado de error o aviso) y no se muestran datos incompletos como si fueran válidos. |
| 3 | Reiniciar la API y reintentar la operación. | Los datos se cargan correctamente sin recargar la aplicación ni perder el estado de la página. |
| 4 | Provocar la caída del proveedor de IA y enviar una consulta. | El stream emite `event: error` con `code: AI_UNAVAILABLE`; la pregunta escrita se conserva y la interfaz sigue usable. |
| 5 | Provocar la caída del proveedor de cotizaciones. | La API responde `502` con mensaje genérico; la UI informa la indisponibilidad y permite reintentar; no se modifican datos financieros. |
| 6 | Enviar un formulario con la API caída. | Se informa el error y **no** se confirma la acción como exitosa; al reintentar, no se duplica el registro. |
| 7 | Revisar los logs ante cada error. | No se exponen trazas internas ni datos sensibles al usuario. |

**Criterio de aprobación:** toda carga y todo error muestran un estado comprensible, permiten reintentar y nunca pierden ni corrompen datos financieros.

### 6.10. Configuración y preferencias

#### CP-CFG-01 · Tema

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · UI |
| **Referencias** | FR-CFG-001, HU-014, SC-006 |
| **Precondiciones** | Sesión de USR-A; navegador con `localStorage` accesible. |
| **Datos de prueba** | Opciones `Claro`, `Oscuro`, `Auto`. |
| **Evidencia esperada** | Capturas de los tres estados; inspección de `localStorage`; `layout.test.tsx`. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Ajustes, elegir `Oscuro`. | La interfaz cambia a tema oscuro de inmediato. |
| 2 | Recargar la aplicación. | El tema oscuro persiste. |
| 3 | Elegir `Claro` y recargar. | El tema claro persiste. |
| 4 | Elegir `Auto` y cambiar la preferencia del sistema operativo. | La interfaz sigue la preferencia del sistema. |
| 5 | Inspeccionar `localStorage`. | La preferencia de tema está guardada localmente. |
| 6 | Revisar los datos financieros tras los cambios. | No se modifican cuentas, movimientos ni preferencias del servidor. |
| 7 | Abrir la aplicación en otro navegador. | El tema no se sincroniza: la preferencia es local al navegador. |

**Criterio de aprobación:** el tema claro, oscuro o automático se aplica y persiste localmente, sin modificar datos financieros ni sincronizarse entre dispositivos.

#### CP-CFG-02 · Moneda principal

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-CFG-003, HU-016, RN-001, RN-002 |
| **Precondiciones** | USR-A con cuentas en ARS y USD; anotar saldos y movimientos. |
| **Datos de prueba** | Cambio de ARS a USD y vuelta a ARS. |
| **Evidencia esperada** | `PATCH /users/me` con `primaryCurrency`; `client/lib/api/__tests__/endpoints.test.ts`; capturas de Ajustes y dashboard. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir Ajustes con USR-A. | El selector de moneda principal está disponible porque las cuentas usan más de una moneda. |
| 2 | Elegir USD y guardar. | La preferencia se persiste (`PATCH /users/me`) y se informa el éxito. |
| 3 | Volver al dashboard. | La moneda de lectura por defecto es USD y los valores se muestran en USD. |
| 4 | Comparar saldos y movimientos con los anotados. | No cambian: el cambio es solo de lectura. |
| 5 | Revisar las cotizaciones. | Siguen siendo automáticas y no editables; `GET /currencies/rates` las provee. |
| 6 | Recargar la aplicación e iniciar sesión nuevamente. | La moneda principal USD persiste. |
| 7 | Volver a ARS. | El dashboard vuelve a leer en ARS. |
| 8 | Iniciar sesión con un usuario de una sola moneda. | El selector de moneda principal no se muestra en Ajustes. |

**Criterio de aprobación:** la moneda principal se guarda, el dashboard la usa como lectura por defecto y el cambio no altera saldos ni movimientos; las cotizaciones siguen siendo automáticas.

#### CP-CFG-03 · Correo y contraseña

| Campo | Valor |
|---|---|
| **Prioridad** | P1 |
| **Tipo / nivel** | Funcional · Integración API + UI |
| **Referencias** | FR-CFG-002, NFR-SEG-003, SC-006 |
| **Precondiciones** | USR-D registrado; USR-A existente para probar el duplicado. |
| **Datos de prueba** | Email nuevo `qa.perfil.<AAAAMMDD-HHMM>@example.com`; email `demo@atlassfin.app`; contraseña actual `Demo1234!`; nueva `NuevaClave123`; nueva inválida `sin-numero`. |
| **Evidencia esperada** | `FR-CFG-002.e2e-spec.ts`; `client/app/(app)/settings/_components/settings-view/__tests__/settings-view.test.tsx`; capturas. |
| **Estado** | No ejecutado |

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | En Ajustes, cambiar el nombre y guardar. | El nombre se actualiza en el perfil y en el hub `/profile`. |
| 2 | Cambiar el email a uno nuevo con mayúsculas y espacios. | Se normaliza a minúsculas y sin espacios; se guarda si es único. |
| 3 | Cerrar sesión e iniciar con el email nuevo. | El acceso funciona; el email anterior ya no inicia sesión. |
| 4 | Intentar guardar `demo@atlassfin.app`. | `409 EMAIL_IN_USE`; el email no cambia y la sesión sigue abierta. |
| 5 | Intentar guardar un email con formato inválido. | `400 VALIDATION_ERROR`; el email no cambia. |
| 6 | Cambiar la contraseña indicando la actual correcta y una nueva válida. | `204`; se informa el éxito y la sesión permanece abierta. |
| 7 | Cerrar sesión e iniciar con la contraseña nueva. | El acceso funciona; la contraseña anterior ya no. |
| 8 | Intentar cambiar la contraseña con la actual incorrecta. | `400 VALIDATION_ERROR`; la contraseña no cambia. |
| 9 | Intentar cambiar la contraseña con una nueva que no cumple la política (por ejemplo, `sin-numero`). | `400 VALIDATION_ERROR` con el detalle de la política. |
| 10 | Verificar los token emitidos antes del cambio. | Siguen vigentes hasta su expiración (JWT stateless); el cambio de contraseña no los revoca. |

**Criterio de aprobación:** el email se normaliza y se guarda si es único; el cambio de contraseña exige la actual y aplica la misma política del registro; los errores se informan sin cerrar la sesión.

## 7. Matriz de trazabilidad y evidencia

| Caso | Requisitos | Evidencia automatizada disponible | Estado |
|---|---|---|---|
| CP-ACC-01 | FR-AUT-001 · HU-004 · SC-001 | `api/test/requirements/FR-AUT-001.e2e-spec.ts`; `client/app/(auth)/_components/__tests__/auth-forms.test.tsx`; `client/lib/validation/__tests__/validation.test.ts` | No ejecutado |
| CP-ACC-02 | FR-AUT-002 · NFR-SEG-001 · NFR-SEG-004 · HU-004 | `FR-AUT-002.e2e-spec.ts`; `NFR-SEG-004.e2e-spec.ts`; `client/hooks/__tests__/use-sign-out.test.tsx`; `client/components/layout/__tests__/layout.test.tsx` | No ejecutado |
| CP-SEG-01 | NFR-SEG-001 · HU-011 | `NFR-SEG-001.e2e-spec.ts` | No ejecutado |
| CP-SEG-02 | NFR-SEG-002 | `NFR-SEG-002.e2e-spec.ts`; `client/lib/validation/__tests__/validation.test.ts` | No ejecutado |
| CP-SEG-03 | NFR-SEG-003 | `NFR-SEG-003.e2e-spec.ts` | No ejecutado |
| CP-CUE-01 | FR-CUE-001 · HU-005 · SC-003 | `FR-CUE-001.e2e-spec.ts`; `FR-CUE-001-campos.e2e-spec.ts`; `FR-CUE-001-edicion.e2e-spec.ts`; `client/app/(app)/_components/accounts/__tests__/accounts.test.tsx`; `account-form-dialog.test.tsx`; `account-type-picker.test.tsx` | No ejecutado |
| CP-CUE-02 | FR-CUE-002 · FR-CUE-003 · HU-005 | `FR-CUE-002.e2e-spec.ts` | No ejecutado |
| CP-CUE-03 | FR-CUE-001 · HU-005 | Sin cobertura automatizada específica (API + UI manual) | No ejecutado |
| CP-CUE-04 | FR-CUE-004 · HU-017 · SC-003 | `client/app/(app)/accounts/detail/_components/account-detail-view/hooks/__tests__/use-account-detail.test.tsx` | No ejecutado |
| CP-TRX-01 | FR-TRX-001 · HU-001 · SC-004 | `FR-TRX-001.e2e-spec.ts`; `FR-TRX-001-campos.e2e-spec.ts`; `client/app/(app)/_components/transactions/transaction-form-dialog/__tests__/transaction-form-dialog.test.tsx` | No ejecutado |
| CP-TRX-02 | FR-TRX-001 · CAL-003 · HU-002 | `FR-TRX-001-transferencia.e2e-spec.ts`; `CAL-003.e2e-spec.ts` | No ejecutado |
| CP-TRX-03 | FR-TRX-001 · HU-008 | `FR-TRX-001-edicion.e2e-spec.ts`; `client/app/(app)/_components/transactions/__tests__/transactions.test.tsx` | No ejecutado |
| CP-TRX-04 | FR-CAT-001 · HU-013 · SC-007 | `FR-TRX-001-campos.e2e-spec.ts` (casos de categorías); `client/app/(app)/categories/_components/categories-view/__tests__/categories-view.test.tsx` | No ejecutado |
| CP-TRX-05 | FR-TRX-002 · HU-012 | `client/app/(app)/transactions/_components/transactions-view/components/__tests__/transaction-filters.test.tsx` | No ejecutado |
| CP-TRX-06 | FR-TRX-001 · HU-002 · RN-001 · RN-002 | Sin cobertura automatizada específica de `transferAmount` (API + UI manual) | No ejecutado |
| CP-TRX-07 | FR-TRX-004 · HU-018 | `FR-TRX-001.e2e-spec.ts` (contrato) + verificación manual de UI | No ejecutado |
| CP-TRX-08 | FR-TRX-003 · HU-019 | `client/hooks/__tests__/use-export-transactions.test.tsx` | No ejecutado |
| CP-CAT-01 | FR-CAT-001 · FR-CAT-002 · HU-020 · SC-007 | `client/app/(app)/categories/_components/categories-view/__tests__/categories-view.test.tsx` | No ejecutado |
| CP-CAT-02 | FR-CAT-002 · RN-001 | `client/lib/__tests__/currency.test.ts` (formateo) + verificación manual | No ejecutado |
| CP-DAS-01 | CAL-001 · FR-DAS-001 · HU-006 · RN-001 | `FR-DAS-001.e2e-spec.ts`; `CAL-001.e2e-spec.ts` | No ejecutado |
| CP-DAS-02 | FR-DAS-001 · CAL-002 · CAL-004 · HU-006 · HU-009 | `FR-DAS-001.e2e-spec.ts`; `CAL-002.e2e-spec.ts`; `CAL-004.e2e-spec.ts` | No ejecutado |
| CP-DAS-03 | FR-DAS-001 · CAL-001/002/004 | `CAL-001.e2e-spec.ts` a `CAL-004.e2e-spec.ts` + verificación manual cruzada | No ejecutado |
| CP-DAS-04 | FR-DAS-002 · FR-DAS-003 · HU-007 · SC-002 | `FR-DAS-002.e2e-spec.ts`; `FR-DAS-002-ingresos-gastos.e2e-spec.ts`; `FR-DAS-002-gastos-categoria.e2e-spec.ts`; `category-donut.test.tsx`; `chart-data-table.test.tsx` | No ejecutado |
| CP-DAS-05 | FR-DAS-002 · FR-DAS-003 · HU-007 | `FR-DAS-002.e2e-spec.ts`; `FR-DAS-003.e2e-spec.ts` | No ejecutado |
| CP-DAS-06 | FR-DAS-003 · RN-001 · HU-016 | `FR-DAS-003.e2e-spec.ts`; `dashboard-currency-selector.test.tsx` | No ejecutado |
| CP-CAL-001 | CAL-001 · NFR-CAL-001 | `CAL-001.e2e-spec.ts` | No ejecutado |
| CP-CAL-002 | CAL-002 · NFR-CAL-001 | `CAL-002.e2e-spec.ts` | No ejecutado |
| CP-CAL-003 | CAL-003 · NFR-CAL-001 | `CAL-003.e2e-spec.ts` | No ejecutado |
| CP-CAL-004 | CAL-004 · NFR-CAL-001 | `CAL-004.e2e-spec.ts` | No ejecutado |
| CP-IA-01 | FR-IA-001 · HU-003 · SC-005 | `FR-IA-001.e2e-spec.ts`; `client/lib/api/__tests__/assistant-stream.test.ts`; `assistant-chat.test.tsx` | No ejecutado |
| CP-IA-02 | FR-IA-001 · HU-010 | `FR-IA-001.e2e-spec.ts` | No ejecutado |
| CP-IA-03 | FR-IA-002 · HU-015 | `assistant-history.test.ts`; `FR-IA-001.e2e-spec.ts` | No ejecutado |
| CP-NFR-01 | Criterio de bondad «Usabilidad» | Verificación manual en tres resoluciones | No ejecutado |
| CP-NFR-02 | Dependencias FRD §2.5 · criterio de bondad | Verificación manual de fallas + `assistant-stream.test.ts` | No ejecutado |
| CP-CFG-01 | FR-CFG-001 · HU-014 · SC-006 | `client/components/layout/__tests__/layout.test.tsx` (tema) + verificación manual | No ejecutado |
| CP-CFG-02 | FR-CFG-003 · HU-016 · RN-001 · RN-002 | `client/lib/api/__tests__/endpoints.test.ts` + verificación manual | No ejecutado |
| CP-CFG-03 | FR-CFG-002 · NFR-SEG-003 · SC-006 | `FR-CFG-002.e2e-spec.ts`; `client/app/(app)/settings/_components/settings-view/__tests__/settings-view.test.tsx` | No ejecutado |

> Las rutas de evidencia automatizada son relativas a `api/` o `client/` según corresponda. Que exista una prueba automatizada no equivale a un caso aprobado: el estado se completa únicamente al ejecutar y adjuntar la evidencia (§8).

## 8. Ejecución y seguimiento de defectos

### 8.1. Resumen de la ejecución

La ejecución de los 37 casos **todavía no está registrada**. Cada fila de la matriz de §7 debe actualizarse durante la ejecución y adjuntar evidencia reproducible.

| Resultado | Casos |
|---|---|
| Casos definidos | 37 |
| Ejecutados | 0 |
| Aprobados | 0 |
| Fallados | 0 |
| Bloqueados | 0 |
| Pendientes | 37 |

**Criterios para registrar un resultado**

| Resultado | Condición |
|---|---|
| **Aprobado** | El resultado observado coincide con el esperado y la evidencia está adjunta. |
| **Fallado** | El resultado difiere del esperado; se abre un `BUG-*` con pasos de reproducción. |
| **Bloqueado** | No se puede ejecutar por una dependencia (entorno, proveedor externo, defecto previo). |

### 8.2. Seguimiento y gestión de bugs

| ID de Bug | Descripción | Pasos para reproducir | Prioridad | Estado | Responsable | Fecha de creación | Fecha de resolución | Notas / comentarios |
|---|---|---|---|---|---|---|---|---|
| BUG-001 | La exportación CSV escribía la columna `Monto` con el formato de pantalla (`$ 1.234,56`) en lugar de un número decimal, por lo que la planilla la interpretaba como texto y no permitía operar con ella. | 1) Abrir Movimientos. 2) Exportar los movimientos. 3) Abrir el CSV en una planilla. 4) Intentar sumar la columna `Monto`. | Media | Resuelto | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Detectado al validar FR-TRX-003. Se exporta el valor numérico crudo; cubierto por `client/hooks/__tests__/use-export-transactions.test.tsx`. Pendiente re-ejecutar CP-TRX-08 para cerrarlo. |

**Criterio de prioridad**

| Prioridad | Criterio |
|---|---|
| **Alta** | Afecta un cálculo financiero, la autorización entre usuarios o un flujo P0; bloquea la aceptación. |
| **Media** | Afecta un flujo P1 o degrada la experiencia sin corromper datos; tiene *workaround*. |
| **Baja** | Detalle cosmético, de accesibilidad o de consistencia menor. |

**Máquina de estados del defecto:** `Abierto → En proceso → Resuelto → Cerrado`. Un defecto pasa a **Resuelto** cuando el cambio está desplegado en el entorno de prueba y a **Cerrado** cuando el caso `CP-*` asociado se re-ejecuta y aprueba (regresión).

> No hay otros defectos registrados. Los desajustes detectados entre documentos y aplicación se corrigieron en la documentación (Plan v1.0, FRD/BRD v0.3) porque la implementación es la referencia de comportamiento; no se agregó funcionalidad.

### 8.3. Trazabilidad de defectos con los casos

| Caso | Defecto asociado | Estado del caso |
|---|---|---|
| CP-TRX-08 | BUG-001 | No ejecutado (defecto corregido; pendiente de regresión) |

> El resto de los casos permanece en estado **No ejecutado** hasta que se registre su evidencia.

## 9. Criterios de cierre y notas

### 9.1. Criterios de cierre

La aceptación requiere:

1. El **100 % de los casos P0 ejecutados y aprobados** (26 casos).
2. **Sin defectos bloqueantes ni críticos abiertos**.
3. Los cálculos `CAL-*` verificados y coincidentes con los movimientos registrados.
4. La autorización por propietario verificada (`CP-SEG-01`).
5. Evidencia de ejecución registrada y reproducible para cada caso aprobado.

Los casos P1 se ejecutan según el cronograma; un P1 fallido se registra como defecto y no bloquea por sí solo la aceptación, salvo que afecte un cálculo o la seguridad.

### 9.2. Notas

- Este documento se completa **durante** la ejecución; no se anticipan resultados ni aprobaciones.
- Cada defecto debe indicar el caso `CP-*` que lo detectó y, cuando exista, el commit que lo corrige.
- Los defectos **Alta** se corrigen antes del cierre de la iteración y se re-ejecuta su caso (regresión).
- Un caso se marca **Aprobado** solo si el resultado observado coincide con el esperado y la evidencia está adjunta; toda desviación se registra como defecto (Plan §3.3).
- La base de datos es descartable: entre corridas se ejecuta `npm run db:reset` para partir del dataset determinístico.
- Las pruebas automatizadas citadas en §7 son la primera evidencia de cada caso; cuando no cubren el escenario completo, se complementan con la ejecución API/UI descripta en los pasos.
- **Brechas de automatización detectadas:** los casos CP-CUE-03, CP-CUE-04, CP-CAT-01/02, CP-TRX-06, CP-TRX-07, CP-CFG-02 y CP-NFR-01/02 no tienen una prueba automatizada que cubra todos sus pasos y dependen de ejecución manual o por API. Se recomienda priorizar `CP-TRX-06` (transferencia multimoneda) y `CP-CUE-03` (moneda fija) por su impacto en los cálculos.
