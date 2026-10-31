# Plan de Pruebas — Gestor Financiero Personal

| | |
|---|---|
| **Proyecto** | Gestor Financiero Personal |
| **Documento** | Plan de Pruebas |
| **Versión** | 1.0 |
| **Fecha** | 30/10/2026 |
| **Sponsor Operación** | Secretaría Académica UNAHUR |
| **Sponsor Organización** | UNAHUR |
| **Autor** | Barenghi, Thomas |
| **Tutor** | Prof. Ciarallo, Cristian |
| **Release** | Demostración académica 2026 |

## Objetivo del Testing:

Verificar que el **Gestor Financiero Personal** funcione de punta a punta en sus flujos principales: que los **cálculos financieros sean correctos y trazables**, que cada usuario acceda **solo a su propia información** y que el asistente de IA sea de **solo consulta**.

El objetivo es reunir **evidencia suficiente y repetible para aprobar la aplicación**, con un conjunto acotado de pruebas. Se prioriza el nivel **P0**. Un caso se considera **aprobado** solo si el resultado observado coincide con el esperado; cualquier diferencia se registra como defecto.

## Alcance del Testing:

- **Acceso:** registro, inicio y cierre de sesión; perfil (nombre, correo y contraseña).
- **Cuentas:** saldos, moneda por cuenta, moneda principal y detalle de cuenta.
- **Movimientos:** ingresos, gastos y transferencias (también entre monedas), con categorías del sistema y propias; historial paginado y exportación a CSV.
- **Búsqueda y filtros** de movimientos; **categorías propias** (alta, edición, eliminación y uso).
- **Panel** y patrimonio neto, con detalle diario, semanal o mensual y selector de moneda de lectura.
- **Cálculos** de patrimonio, flujos, transferencias y ahorro (CAL-001 a CAL-004) y **cotizaciones automáticas**.
- **Asistente de IA**, de solo consulta y con conversación continua mientras la página está abierta.
- **Preferencias locales** (tema) y **seguridad básica**: cada usuario ve solo sus datos, las contraseñas están protegidas y las entradas se validan.

## Herramientas para el Testing:

| Nivel | Qué se prueba | Cómo |
|---|---|---|
| **Unitario** | Fórmulas y validaciones | Pruebas automáticas de las funciones de cálculo |
| **Integración** | La API con la base de datos real, las reglas de negocio y la autorización | Pruebas automáticas de las funciones y la API |
| **Sistema / punta a punta** | Flujos completos en la interfaz | Pruebas manuales guiadas y automatización de la interfaz |
| **Aceptación** | Casos de estudio y criterios de aceptación | Demostración repetible con datos de prueba |

Las fórmulas se cubren con pruebas unitarias y los flujos P0 con pruebas de integración, como pide **NFR-CAL-001**.

**Pruebas individuales:**

Se ejecutan casos puntuales sobre la aplicación desplegada y se revisan resultados, estados y mensajes de la interfaz. Se recorren flujos completos, se comparan cálculos con valores de referencia y se prueban casos límite.

La ejecución la dirige un **agente de inteligencia artificial** a partir de este plan y de los casos aprobados: ejecuta, genera los datos, reúne la evidencia y reporta los resultados. El equipo revisa y aprueba el plan y los casos antes de ejecutarlos; el agente no define el alcance ni aprueba pruebas por sí solo.

**Pruebas Masivas:**

Scripts que ejecutan las pruebas de fórmulas y de la API, y automatizan la interfaz para los flujos críticos. Incluyen la carga del *seed*, la ejecución repetible y la detección de regresiones.

| Propósito | Herramienta |
|---|---|
| Orquestación y ejecución dirigida por IA | Agente de IA que opera las herramientas de prueba |
| Pruebas de funciones y de la API | Jest + Supertest (TypeScript) |
| Pruebas de la API | Postman / cURL |
| Pruebas de punta a punta de la interfaz (previstas) | Playwright |
| Pruebas de componentes de la interfaz | Vitest / Testing Library |

## Casos de Prueba:

Cada caso indica su **prioridad** (P0/P1/P2) y su **trazabilidad** al FRD/BRD v0.3.

### Resumen por módulo

| Módulo | Casos | Prioridad |
|---|---|---|
| Acceso y sesión | 2 | P0 |
| Seguridad y autorización | 3 | P0 |
| Cuentas | 4 | P0 |
| Movimientos | 7 | P0/P1 |
| Categorías | 3 | P0/P1 |
| Dashboard y patrimonio | 6 | P0/P1 |
| Cálculos | 4 | P0 |
| No funcionales | 2 | P0/P1 |
| Asistente de IA | 3 | P1 |
| Configuración y preferencias | 3 | P1 |

### Acceso y sesión

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-ACC-01 | Registro de usuario | Completar el registro con nombre, email, moneda principal y contraseña; probar con datos inválidos, moneda no soportada o email duplicado | Se crea el usuario con la moneda elegida y se puede iniciar sesión; los datos inválidos o duplicados se rechazan con mensaje. | P0 | FR-AUT-001 |
| CP-ACC-02 | Inicio y cierre de sesión | Iniciar sesión; navegar; cerrar sesión; intentar volver a una pantalla protegida | La sesión inicia; al cerrar se limpian las cookies y las pantallas redirigen al acceso. | P0 | FR-AUT-002, NFR-SEG-001, NFR-SEG-004 |

### Seguridad y autorización

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-SEG-01 | Aislamiento entre usuarios | Con la sesión del Usuario A, intentar leer o modificar un recurso del Usuario B | El servidor rechaza la operación y no expone datos ajenos. | P0 | NFR-SEG-001 |
| CP-SEG-02 | Validación de entradas | Enviar límites, tipos, longitudes y campos inesperados | Las entradas inválidas se rechazan con error controlado y no se persisten datos inconsistentes. | P0 | NFR-SEG-002 |
| CP-SEG-03 | Contraseñas y secretos | Inspeccionar la base tras el registro; revisar la interfaz, el repositorio y las llamadas externas | La contraseña se guarda con un hash seguro; las claves no están en la interfaz ni en el repositorio; las llamadas externas usan HTTPS, tiempo máximo de espera y no siguen redirecciones. | P0 | NFR-SEG-003, NFR-SEG-004 |

### Cuentas

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-CUE-01 | Alta y edición de cuenta | Crear una cuenta (nombre, tipo, moneda, saldo inicial) y editarla | La cuenta aparece en el listado con su saldo en su moneda y refleja la edición. | P0 | FR-CUE-001 |
| CP-CUE-02 | Cálculo de saldo y eliminación | Registrar movimientos, consultar el saldo y eliminar la cuenta | Saldo actual = saldo inicial + ingresos − gastos ± patas de transferencia. La eliminación elimina en cascada los movimientos. | P0 | FR-CUE-002/003 |
| CP-CUE-03 | Moneda fija con movimientos | Crear una cuenta, cargarle un movimiento e intentar cambiar su moneda | El servidor y la UI rechazan el cambio de moneda mientras la cuenta tenga movimientos. | P0 | FR-CUE-001 |
| CP-CUE-04 | Detalle de cuenta | Abrir el detalle de una cuenta propia; revisar saldo, indicadores y movimientos; editar la cuenta | El detalle muestra los datos de la cuenta, sus indicadores y sus movimientos; la edición reutiliza el formulario. | P0 | FR-CUE-004, HU-017 |

### Movimientos

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-TRX-01 | Registrar ingreso y gasto | Cargar un ingreso y un gasto con monto, fecha, cuenta, categoría y descripción; cerrar y reabrir el formulario | Los movimientos actualizan saldo y dashboard; monto ≤ 0 o campos vacíos se rechazan; el formulario se reinicia al reabrirlo. | P0 | FR-TRX-001 |
| CP-TRX-02 | Transferencia válida | Transferir entre dos cuentas propias | Se descuenta origen y se acredita destino; se excluye del flujo de fondos. | P0 | FR-TRX-001, CAL-003 |
| CP-TRX-03 | Edición, eliminación y propiedad | Editar y eliminar un movimiento propio; intentar cambiar su tipo; intentar operar sobre uno ajeno | La operación propia se aplica sin cambiar el tipo; sobre un recurso ajeno se rechaza. | P0 | FR-TRX-001 |
| CP-TRX-05 | Búsqueda y filtros | Buscar por concepto, nota, categoría y monto; combinar filtros | La lista muestra solo los movimientos que cumplen todos los filtros. | P1 | FR-TRX-002, HU-012 |
| CP-TRX-06 | Transferencia multimoneda | Transferir entre cuentas de distinta moneda, editar la cotización y confirmar | Se registran los dos montos coherentes; la cotización no se persiste. | P0 | FR-TRX-001 |
| CP-TRX-07 | Historial de movimientos | Recorrer el listado paginado; revisar el agrupado mensual y una transferencia | Se ordena por fecha descendente, se agrupa por mes sin subtotales y las transferencias ocupan una fila. | P0 | FR-TRX-004, HU-018 |
| CP-TRX-08 | Exportación CSV | Aplicar filtros y exportar; repetir sin movimientos visibles | Se descarga un CSV UTF-8 con los movimientos filtrados cargados en la vista (hasta 100 registros); sin movimientos se informa y no se descarga. | P1 | FR-TRX-003, HU-019 |

### Categorías

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-CAT-01 | Listado y uso | Abrir Categorías; alternar Gastos/Ingresos; cambiar período y moneda | Se listan las categorías con cantidad, monto y porcentaje del período, convertidos a la moneda elegida. | P1 | FR-CAT-001/002 |
| CP-CAT-02 | Moneda de visualización | Cambiar el selector de moneda entre ARS y USD | Los montos y porcentajes se re-expresan en la moneda elegida. | P1 | FR-CAT-002, RN-001 |
| CP-CAT-03 | Gestión de categorías propias | Crear una categoría, asignarla, editarla y eliminarla; intentar operar sobre una del sistema o ajena | La propia se crea, asigna, edita y elimina; las del sistema y las ajenas se rechazan. | P0 | FR-CAT-001 |

### Dashboard y patrimonio

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-DAS-01 | Patrimonio neto | Cargar cuentas en ARS y USD y movimientos; consultar el dashboard | Patrimonio neto = Σ (saldo × cotización) en la moneda de lectura, con desglose por moneda. | P0 | CAL-001, FR-DAS-001 |
| CP-DAS-02 | Indicadores del período | Seleccionar un período con ingresos y gastos en distintas monedas | Se muestran ingresos, gastos y ahorro convertidos; tasa de ahorro = ahorro / ingresos × 100. | P0 | FR-DAS-001, CAL-002, CAL-004 |
| CP-DAS-03 | Consistencia de cálculos | Comparar los totales del dashboard con los movimientos cargados | Los totales coinciden con los movimientos registrados. | P0 | Criterio de bondad |
| CP-DAS-04 | Gráficos y período | Abrir el panel y cambiar el período; revisar los gráficos | Los tres gráficos reflejan el período y la moneda de lectura. | P0 | FR-DAS-002/003 |
| CP-DAS-05 | Granularidad diaria y semanal | Comparar rangos cortos con rangos largos | En rangos de hasta 31 días el patrimonio es diario y las barras semanales; en rangos mayores, mensual. | P1 | FR-DAS-002/003 |
| CP-DAS-06 | Selector de moneda de lectura | Elegir USD y luego otra moneda; volver a ARS | Todos los valores se re-expresan sin alterar datos y el desglose por moneda se mantiene. | P0 | FR-DAS-003, RN-001 |

### Cálculos (pruebas unitarias)

| ID | Prioridad | Regla | Entrada de ejemplo | Resultado esperado |
|---|---|---|---|---|
| CP-CAL-01 | P0 | CAL-001 Patrimonio neto | Saldos en distintas monedas y cotizaciones de la API | Σ (saldo × cotización) en la moneda de lectura. |
| CP-CAL-02 | P0 | CAL-002 Flujo de fondos | Ingresos y gastos de un período | Cada flujo se convierte y se calcula ingresos − gastos. |
| CP-CAL-03 | P0 | CAL-003 Transferencias | Una transferencia, incluso multimoneda | Se excluye de ingresos y gastos; cada pata conserva su monto. |
| CP-CAL-04 | P0 | CAL-004 Tasa de ahorro | Ahorro e ingresos convertidos | Ahorro / ingresos × 100. |

### No funcionales y usabilidad

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-NFR-01 | Diseño adaptable | Usar la aplicación en escritorio y móvil | Los flujos principales son usables y legibles en ambas resoluciones. | P1 | Criterio de bondad |
| CP-NFR-02 | Estados de carga y error | Provocar una carga y un error (por ejemplo, IA caída) | Se muestran estados de carga y error comprensibles, sin perder datos. | P0 | Dependencias FRD |

### Asistente de IA

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-IA-01 | Consulta verificable | Preguntar por gastos de un período con datos | Responde con período y categorías; los totales coinciden con el dashboard del mismo período. | P1 | FR-IA-001 |
| CP-IA-02 | Solo consulta | Pedir al asistente que cree, edite o elimine un dato | El asistente no crea, edita ni elimina datos. | P1 | FR-IA-001 |
| CP-IA-03 | Continuidad conversacional | Hacer una pregunta y luego una de seguimiento; recargar la página | Interpreta el seguimiento con los turnos recientes del cliente y no conserva la conversación en el servidor. | P1 | FR-IA-002 |

### Configuración y preferencias

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-CFG-01 | Tema | Cambiar el tema y recargar | El tema persiste en el navegador y no modifica los datos financieros. | P1 | FR-CFG-001 |
| CP-CFG-02 | Moneda principal | Con cuentas en más de una moneda, cambiar la moneda principal en Ajustes | La preferencia se guarda y el dashboard la usa como lectura por defecto. | P1 | FR-CFG-003, RN-001 |
| CP-CFG-03 | Correo y contraseña | Cambiar el correo y la contraseña ingresando la actual; probar errores | El correo se guarda si es único; el cambio de contraseña exige la actual; los errores se informan sin cerrar la sesión. | P1 | FR-CFG-002, NFR-SEG-003 |

### Datos de prueba

Se utilizan **usuarios de prueba sin datos personales reales** y un conjunto reproducible (**NFR-CAL-002**):

| Elemento | Detalle |
|---|---|
| Usuarios | Tres usuarios: demo@atlassfin.app (con datos), sin-datos@atlassfin.app (sin movimientos) y ana@atlassfin.app (aislamiento entre propietarios). |
| Cuentas | Cuatro cuentas del usuario con datos: tres en ARS y una en USD. |
| Monedas | ARS como moneda principal y USD; cotizaciones globales de la API. |
| Movimientos | Tres meses de ingresos, gastos y transferencias, con movimientos en ARS y USD y una transferencia multimoneda (el seed la omite si la API de cotizaciones no está disponible). |
| Categorías | Cinco categorías fijas del sistema; el seed crea además la propia `Otros` (tipo ingreso) para el usuario demo y las demás propias se crean durante la ejecución. |

## Plan de Ejecución:

1. Configurar el entorno con una base de datos limpia y cargar el *seed* de datos de prueba.
2. Revisar y aprobar los casos y el alcance antes de ejecutar.
3. Ejecutar los casos **P0** y luego los **P1** habilitados.
4. Registrar cada resultado en la planilla de seguimiento (ID, resultado, evidencia, defectos).
5. Revisar la evidencia y aprobar cada caso; reportar defectos con pasos de reproducción.
6. Re-ejecutar los casos P0 afectados tras cada corrección (regresión).

**Máquina de estados del caso:** No ejecutado → En ejecución → Aprobado / Fallado / Bloqueado.

**Criterios de entrada:** build desplegable y accesible; datos de prueba cargados; casos revisados y aprobados.

**Criterios de salida (aceptación):** el **100 % de los casos P0 ejecutados y aprobados**; sin defectos bloqueantes ni críticos abiertos; cálculos (CAL-*) verificados; autorización por propietario verificada; evidencia registrada y reproducible.

## Plan de Pruebas Adicionales (Opcionales):

- **Volumen:** cargar una gran cantidad de movimientos y verificar que el dashboard responda correctamente.
- **Asistente de IA:** batería de consultas preparadas para comparar gastos y evolución patrimonial.
