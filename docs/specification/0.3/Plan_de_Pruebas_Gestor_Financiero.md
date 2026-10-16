# Plan de Pruebas — Gestor Financiero Personal

| | |
|---|---|
| **Proyecto** | Gestor Financiero Personal |
| **Documento** | Plan de Pruebas |
| **Versión** | 1.0 |
| **Fecha** | Octubre 2026 |
| **Sponsor Operación** | Secretaría Académica UNAHUR |
| **Sponsor Organización** | UNAHUR |
| **Autor** | Barenghi, Thomas |
| **Tutor** | Prof. Ciarallo, Cristian |
| **Release** | Demostración académica 2026 |

> **Nota de alcance.** Este plan está alineado con el **BRD y el FRD v0.3**, que **siguen en desarrollo y aún no están finalizados**; sus requerimientos pueden cambiar. Organiza los casos por prioridad, con el núcleo **P0** como evidencia principal de aceptación.

## Historial de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0 | Octubre 2026 | Barenghi, Thomas | Versión inicial del plan de pruebas, alineada con el alcance reducido (BRD/FRD v0.3). |

---

## 1. Objetivo del Testing

Verificar que el **Gestor Financiero Personal** funcione de extremo a extremo en sus flujos esenciales, que los **cálculos financieros sean correctos y trazables**, que cada usuario acceda **únicamente a su propia información** y que el asistente de IA sea de **solo consulta**.

El objetivo operativo es **obtener evidencia suficiente y reproducible para aprobar la aplicación**, con un conjunto acotado de pruebas alineado con el alcance reducido del proyecto.

## 2. Alcance del Testing

- **Acceso:** registro, inicio y cierre de sesión.
- **Cuentas** y saldos.
- **Movimientos:** ingresos, gastos y transferencias, con categorías fijas del sistema.
- **Dashboard** y cálculo de patrimonio neto.
- **Reglas de cálculo** (CAL-001, CAL-002, CAL-003 y CAL-010).
- **Asistente de IA**, de solo consulta.
- **Seguridad básica:** autorización por propietario, hash de contraseñas y validación de entradas.
- **Usabilidad básica:** diseño adaptable, precisión decimal y estados vacíos/carga/error.

## 3. Estrategia de Pruebas

### 3.1. Niveles de prueba

| Nivel | Qué se prueba | Cómo |
|---|---|---|
| **Unitario** | Fórmulas financieras (CAL-*) y validaciones | Pruebas automatizadas sobre las funciones de cálculo |
| **Integración** | API + base de datos, reglas de negocio y autorización | Pruebas automatizadas de endpoints y servicios |
| **Sistema / E2E** | Flujos completos en la interfaz | Pruebas manuales guiadas y automatización de UI |
| **Aceptación** | Casos de estudio del BRD y criterios de bondad | Demostración reproducible con datos ficticios |

### 3.2. Tipos de prueba

- **Funcional** (caja negra), orientada a reglas de negocio y flujos de usuario.
- **Seguridad y autorización** (aislamiento entre usuarios).
- **Regresión**, re-ejecutando los casos P0 al cierre de cada iteración.
- **Usabilidad / responsive.**

### 3.3. Enfoque y priorización

Se prioriza el nivel **P0** (que es la evidencia de aceptación exigida por el FRD). Los casos se parametrizan con datos de prueba reproducibles. Un caso se considera **aprobado** solo si el resultado observado coincide con el esperado; toda desviación se registra como defecto.

## 4. Herramientas para el Testing

### 4.1. Pruebas individuales (funcionales y exploratorias)

**Descripción.** Ejecución de casos puntuales sobre la aplicación desplegada, con verificación de resultados, estados y mensajes de la interfaz. La ejecución la realiza el agente de IA (ver 4.3) y el equipo revisa la evidencia.

**Funcionalidades principales:**
- Recorrido de flujos completos como usuario real.
- Verificación de cálculos contra valores de referencia.
- Exploración de bordes (campos vacíos, valores extremos, doble envío).

### 4.2. Pruebas automatizadas / masivas

**Descripción.** Scripts que ejecutan las pruebas unitarias de fórmulas y las pruebas de integración sobre la API, más la automatización de UI para los flujos críticos.

**Funcionalidades principales:**
- Carga automática de un conjunto de datos de prueba (*seed*).
- Ejecución repetible y comparación de resultados.
- Detección de regresiones en cada cambio.

### 4.3. Pruebas dirigidas por IA (AI-driven)

**Descripción.** La ejecución de las pruebas estará dirigida por un **agente de inteligencia artificial** que, a partir de este plan y de los casos aprobados, **manipula las herramientas de prueba** (Postman/cURL, Playwright, Pytest) para ejecutar los casos, generar los datos, recolectar la evidencia y reportar los resultados. El agente ejecuta lo que el equipo define y aprueba; no decide el alcance.

**Funcionalidades principales:**
- Interpreta los casos de prueba de este plan y los ejecuta con las herramientas disponibles.
- Genera los datos de prueba y las solicitudes necesarias.
- Recolecta evidencia por caso (respuestas, capturas, registros).
- Informa el estado de cada caso (Aprobado / Fallado / Bloqueado) y propone la causa probable.

**Revisión y aprobación humana:**
- El equipo **revisa y aprueba el plan y los casos antes de ejecutarlos**.
- El agente **no modifica el alcance ni aprueba pruebas por sí solo**: la aprobación final es del equipo.
- Las acciones destructivas requieren confirmación explícita.
- Un caso se marca **Aprobado** solo cuando el equipo valida la evidencia.

### 4.4. Herramientas previstas

| Propósito | Herramienta |
|---|---|
| Orquestación y ejecución dirigida por IA | Agente de IA que opera las herramientas de prueba |
| Pruebas unitarias / integración de backend | Pytest (Python) |
| Pruebas de API | Postman / cURL |
| Pruebas E2E de interfaz | Playwright |
| Pruebas de componentes frontend | Vitest / Testing Library |
| Registro de casos y defectos | Planilla de registro (ver §7) |

## 5. Casos de Prueba

Convención: cada caso indica su **prioridad** (P0/P1/P2) y su **trazabilidad** al FRD/BRD v0.3.

### 5.1. Resumen por módulo

| Módulo | Casos | Prioridad |
|---|---|---|
| Acceso y sesión | 2 | P0 |
| Seguridad y autorización | 3 | P0 |
| Cuentas | 2 | P0 |
| Movimientos | 3 | P0 |
| Dashboard y patrimonio | 3 | P0 |
| Cálculos | 4 | P0 |
| No funcionales | 2 | P0/P1 |
| Asistente de IA | 3 | P1 |

### 5.2. Acceso y sesión

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-ACC-01 | Registro de usuario | Completar el registro con datos válidos y enviar; luego probar con datos inválidos o email duplicado | Se crea el usuario, se informa éxito y se puede iniciar sesión. Los datos inválidos o duplicados se rechazan con mensaje. | P0 | FR-AUT-001 |
| CP-ACC-02 | Inicio y cierre de sesión | Iniciar sesión; navegar; cerrar sesión; intentar volver a una pantalla protegida | La sesión inicia correctamente; al cerrar se invalida y las pantallas financieras redirigen al acceso. | P0 | FR-AUT-002, NFR-SEG-001 |

### 5.3. Seguridad y autorización

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-SEG-01 | Aislamiento entre usuarios | Con la sesión del Usuario A, intentar leer o modificar un recurso del Usuario B (por URL o API) | El servidor rechaza la operación (403/404) y no expone datos ajenos. | P0 | NFR-SEG-001, RN-001 |
| CP-SEG-02 | Validación de entradas | Enviar límites, tipos, longitudes y campos inesperados en formularios y API | Las entradas inválidas se rechazan con error controlado y no se persisten datos inconsistentes. | P0 | NFR-SEG-002 |
| CP-SEG-03 | Almacenamiento de contraseñas y secretos | Inspeccionar la base de datos tras el registro; revisar el frontend y el repositorio | La contraseña se guarda con hash adaptativo (nunca en texto plano) y los secretos no están en el frontend ni en el repositorio. | P0 | NFR-SEG-003, NFR-SEG-007 |

### 5.4. Cuentas

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-CUE-01 | Alta y edición de cuenta | Crear una cuenta (nombre, tipo, saldo inicial) y editarla | La cuenta aparece en el listado con su saldo y refleja la edición; solo su propietario la ve. | P0 | FR-CUE-001/002/003 |
| CP-CUE-02 | Cálculo de saldo y eliminación | Registrar movimientos sobre una cuenta, consultar el saldo y eliminar la cuenta | Saldo actual = saldo inicial + movimientos. La eliminación elimina en cascada los movimientos asociados. | P0 | FR-CUE-004/005 |

### 5.5. Movimientos

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-TRX-01 | Registrar ingreso y gasto | Cargar un ingreso y un gasto con monto, fecha, cuenta, categoría y descripción | Los movimientos aparecen en el listado y actualizan saldo y dashboard. Monto ≤ 0 o campos obligatorios vacíos se rechazan, y la categoría se elige de un catálogo fijo del sistema (no editable). | P0 | FR-TRX-001/002 |
| CP-TRX-02 | Transferencia válida y atómica | Transferir entre dos cuentas propias; simular una falla a mitad de la operación | Se descuenta origen y se acredita destino en una única operación (ambos o ninguno); origen distinto de destino; se excluye del flujo de fondos. | P0 | FR-TRX-004/005, RN-003/004, CAL-003 |
| CP-TRX-04 | Edición, eliminación y propiedad | Editar y eliminar un movimiento propio; intentar operar sobre uno ajeno | La operación propia se aplica; sobre un recurso ajeno se rechaza. | P0 | FR-TRX-003 |

### 5.6. Dashboard y patrimonio

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-DAS-01 | Patrimonio neto | Cargar cuentas y movimientos; consultar el dashboard | Patrimonio neto = Σ saldos netos de las cuentas. | P0 | CAL-001, RN-002, FR-DAS-001 |
| CP-DAS-02 | Indicadores del período | Seleccionar un período con ingresos y gastos | Se muestran ingresos, gastos y ahorro; la tasa de ahorro = ahorro / ingresos × 100. | P0 | FR-DAS-001, CAL-002, CAL-010 |
| CP-DAS-03 | Consistencia y estados vacíos | Comparar los totales del dashboard con los movimientos cargados; abrir la aplicación sin datos | Los totales coinciden con los movimientos registrados; sin datos se muestra un estado vacío con acción sugerida. | P0 | FR-DAS-008, criterio de bondad |

### 5.7. Cálculos (pruebas unitarias)

| ID | Regla | Entrada de ejemplo | Resultado esperado |
|---|---|---|---|
| CP-CAL-001 | CAL-001 Patrimonio neto | Saldos de las cuentas del usuario | Σ saldos netos de las cuentas. |
| CP-CAL-002 | CAL-002 Flujo de fondos | Ingresos y gastos de un período | Ingresos − gastos del período. |
| CP-CAL-003 | CAL-003 Transferencias | Una transferencia entre cuentas | Se excluye de ingresos y gastos consolidados. |
| CP-CAL-010 | CAL-010 Tasa de ahorro | Ahorro e ingresos del período | Ahorro / ingresos × 100; la variación se expresa en puntos porcentuales. |

### 5.8. Asistente de IA

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-IA-01 | Consulta verificable | Preguntar por gastos de un período con datos | Responde con período y categorías consideradas; los totales coinciden con el dashboard del mismo período. | P1 | FR-IA-002, RN-013, HU-006 |
| CP-IA-02 | Datos insuficientes | Preguntar por un período sin movimientos | Responde que no hay información suficiente e indica el período consultado. | P1 | FR-IA-011, Caso 1 BRD |
| CP-IA-03 | Solo consulta | Pedir al asistente que cree, edite o elimine un dato | El asistente no crea, edita ni elimina datos. | P1 | FR-IA-015, RN-012 |

### 5.9. No funcionales y usabilidad

| ID | Caso | Pasos (resumen) | Resultado esperado | Prioridad | Ref. |
|---|---|---|---|---|---|
| CP-NFR-01 | Diseño adaptable | Usar la aplicación en resoluciones de escritorio y móvil | Los flujos principales son usables y legibles en ambas resoluciones. | P1 | Criterio de bondad |
| CP-NFR-02 | Estados de carga y error | Provocar una carga y un error (por ejemplo, proveedor de IA caído) | Se muestran estados de carga y error comprensibles, sin perder datos. | P0 | FR-DAS-008, Dependencias FRD |

## 6. Datos de Prueba

Se utiliza un **usuario ficticio sin datos personales reales** y un conjunto de datos reproducible:

| Elemento | Detalle |
|---|---|
| Usuario | Un usuario ficticio de demostración. |
| Cuentas | Tres cuentas. |
| Movimientos | Tres meses de ingresos, gastos y transferencias. |
| Categorías | Cinco categorías fijas del sistema. |

## 7. Plan de Ejecución

1. Configurar el entorno de prueba con una base de datos limpia.
2. Cargar el conjunto de datos de prueba (*seed*) descripto en §6.
3. Revisar y aprobar los casos y el alcance antes de ejecutar.
4. El agente de IA ejecuta los casos **P0** y luego los **P1/P2** habilitados por el alcance (ver 4.3).
5. Registrar cada resultado en la planilla de seguimiento (ID del caso, resultado, evidencia, defectos).
6. Revisar la evidencia y dar cada caso por aprobado.
7. Reportar los defectos con pasos de reproducción y severidad.
8. Re-ejecutar los casos P0 afectados tras cada corrección (regresión).

**Máquina de estados del caso:** No ejecutado → En ejecución → Aprobado / Fallado / Bloqueado.

## 8. Criterios de Entrada y Salida

### 8.1. Criterios de entrada

- Build desplegable y accesible del entorno de prueba.
- Datos de prueba cargados.
- Casos de prueba revisados y aprobados.

### 8.2. Criterios de salida (aceptación)

- El **100 % de los casos P0 ejecutados y aprobados**.
- Sin defectos **bloqueantes ni críticos** abiertos.
- Cálculos (CAL-*) verificados y coincidentes con los movimientos registrados.
- Autorización por propietario verificada.
- Evidencia de ejecución registrada y reproducible.

## 9. Riesgos y Mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Alcance cambiante por la reducción de funcionalidad | Casos desactualizados | Plan modular: quitar secciones sin afectar el resto. |
| Dependencia del proveedor externo de IA | Casos bloqueados | Usar datos simulados y cubrir el comportamiento ante falla. |
| Tiempo limitado | Cobertura incompleta | Priorizar P0 y automatizar las fórmulas. |
| Inestabilidad de las pruebas de UI | Resultados falsos | Esperas explícitas y reintentos controlados. |

## 10. Pruebas Adicionales (Opcionales)

- **Volumen:** cargar una gran cantidad de movimientos y verificar que el dashboard responda correctamente.
- **Asistente de IA:** batería de consultas preparadas para comparar gastos y evolución patrimonial.
