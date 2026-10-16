# Documentación de Requerimientos de Negocio — Gestor Financiero Personal

| | |
|---|---|
| Versión | 0.3 |
| Fecha | 16/10/2026 |
| Sponsor Operación | Secretaría Académica UNAHUR |
| Sponsor Organización | UNAHUR |
| Autor | Barenghi, Thomas |
| Release | Demostración académica 2026 |

## Tabla de contenidos

- Historial de Cambios
- Alcance 2.1. Descripción del Proyecto / Objetivos 2.2. Justificación 2.3. Hipótesis 2.4. Restricciones 2.5. Dependencias 2.6. Alcance del Proyecto
- Requerimientos de Negocio 3.1. Reglas de Negocio 3.2. Casos de Estudio
- Requerimientos Funcionales 4.1. Historias de Usuario 4.2. Criterios de Bondad
- Pantallas de Usuario
- Glosario
- Minutas de Reunión

## 1. Historial de Cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 0.1 | 04/09/2026 | Barenghi, Thomas | Versión inicial del documento. |
| 0.2 | 02/10/2026 | Barenghi, Thomas | Se actualiza el cálculo de patrimonio neto (RN-002 y glosario) conforme a la nueva definición de CAL-001. No se modifican los requerimientos de negocio. |
| 0.3 | 16/10/2026 | Barenghi, Thomas | Se reduce el alcance del proyecto: se eliminan Presupuestos, Activos, Inversiones, Deudas, Objetivos financieros y Cotizaciones de mercado. Se redefine el patrimonio neto (RN-002) como la suma de los saldos netos de las cuentas y se ajustan las reglas, las historias de usuario, los casos de estudio, las pantallas y el glosario en consecuencia. Se restringe el asistente de inteligencia artificial a solo consulta: no puede crear, editar ni eliminar datos. Se quita la multimoneda (moneda única), el tema claro/oscuro, la entrada por voz y el archivado de cuentas (eliminación directa, sin restaurar); las categorías pasan a ser fijas y se elimina el tipo de cuenta tarjeta. Se eliminan además RN-007, RN-014, FR-AUT-003, FR-AUT-004, FR-TRX-006, el módulo Reportes y los requerimientos de IA FR-IA-001, FR-IA-008, FR-IA-009, FR-IA-010 y FR-IA-014, junto con el servicio de correo y la entidad Conversación IA. |

## 2. Alcance

### 2.1. Descripción del Proyecto / Objetivos

**Desarrollar una aplicación web de gestión financiera personal que permita registrar cuentas y movimientos, organizarlos con categorías, y consultar la evolución del patrimonio y del flujo de fondos desde una vista consolidada, con cálculos trazables y un asistente de inteligencia artificial opcional de solo consulta.**

**Los objetivos específicos son consolidar las cuentas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías; mostrar gráficos de patrimonio y flujo de fondos; incorporar un asistente de inteligencia artificial opcional y explicativo, de solo consulta; y proteger la privacidad mediante autenticación, autorización por propietario y minimización de datos.**

### 2.2. Justificación

**Muchas personas administran su economía mediante hojas de cálculo, aplicaciones aisladas o registros parciales, lo que dificulta comprender el patrimonio total y controlar los gastos. Centralizar esa información en una solución académica permite mostrar una fotografía financiera comprensible, mantener trazabilidad de los cálculos y permitir consultas en lenguaje natural del asistente, sin exceder los permisos del usuario y sin que la interacción modifique sus datos.**

### 2.3. Hipótesis

**Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos y favorecerá una mejor organización de las finanzas del usuario.**

### 2.4. Restricciones

**La solución será una aplicación web con frontend React y componentes shadcn/ui, dimensionada para un proyecto universitario demostrable y extensible. No se almacenarán credenciales bancarias ni claves privadas de billeteras. El proveedor y modelo de inteligencia artificial, el backend y la infraestructura definitiva se definirán durante el diseño técnico, y la precisión del asistente dependerá de la calidad y actualidad de los datos cargados por el usuario.**

**Límite funcional: la aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero.**

**Atributos de calidad exigidos: cada recurso queda restringido a su propietario mediante autorización verificada en el servidor; las contraseñas se almacenan con hash adaptativo y los secretos de los proveedores nunca salen del servidor; las fórmulas financieras están cubiertas por pruebas unitarias y los flujos P0 por pruebas de integración; y la demostración usa datos ficticios y reproducibles. El detalle normativo de cada atributo está en el FRD (NFR-SEG y NFR-CAL).**

### 2.5. Dependencias

**El producto depende de un proveedor de inteligencia artificial para las respuestas en lenguaje natural, de una base de datos relacional para la persistencia y de una plataforma de despliegue segura y reproducible para la demostración. Todas las integraciones externas se realizan exclusivamente desde el backend.**

### 2.6. Alcance del Proyecto

**El alcance de la versión inicial incluye registro, inicio y cierre de sesión con perfil; alta, edición y eliminación de cuentas manuales; ingresos, gastos y transferencias con categorías; dashboard con indicadores y gráficos; y un asistente de inteligencia artificial opcional de solo consulta.**

**La aplicación opera con una única moneda y un catálogo fijo de categorías definido por el sistema.**

**Quedan fuera de alcance la sincronización automática con bancos o billeteras, la ejecución de pagos u operaciones reales, la compraventa de activos y la conexión de billeteras digitales, el asesoramiento financiero, legal, impositivo o contable, la liquidación de impuestos y la conciliación bancaria avanzada, las cuentas familiares o multiusuario con permisos compartidos, las aplicaciones móviles nativas, las notificaciones push y las automatizaciones complejas, y una aplicación para iOS. También quedan fuera de alcance de esta versión la gestión de presupuestos, la valuación de activos e inversiones, la administración de deudas, los objetivos financieros y las cotizaciones de mercado.**

## 3. Requerimientos de Negocio

### 3.1. Reglas de Negocio

**Los identificadores de requerimiento son estables entre versiones y no se renumeran: por eso la numeración puede presentar huecos. Los números ausentes corresponden a requerimientos que quedaron fuera del alcance de esta versión.**

| Regla | Descripción |
|---|---|
| RN-001 | Todo registro financiero tendrá un propietario único y solo será accesible dentro de su sesión autorizada. |
| RN-002 | Patrimonio neto = suma de los saldos netos de las cuentas del usuario. |
| RN-003 | Una transferencia no se contabiliza como ingreso ni como gasto. |
| RN-004 | Toda transferencia válida descuenta en la cuenta de origen y acredita en la cuenta de destino dentro de una única operación. |
| RN-012 | La inteligencia artificial será de solo consulta: podrá leer la información del propio usuario con los permisos de su sesión, pero nunca crearla, editarla ni eliminarla. |
| RN-013 | Los totales entregados al asistente serán calculados previamente por el sistema; la respuesta incluirá período y aclaración informativa. |

### 3.2. Casos de Estudio

| Caso | Condición | Resultado esperado |
|---|---|---|
| Caso 1: Consulta al asistente con datos insuficientes | El usuario habilita el asistente y pregunta por la evolución de sus gastos en un período sin movimientos cargados. | El asistente responde que no hay información suficiente e indica el período consultado. |

## 4. Requerimientos Funcionales

### 4.1. Historias de Usuario

| ID | Historia | Criterio de aceptación | Trazabilidad |
|---|---|---|---|
| US-001 | Como usuario registrado, quiero visualizar mi situación financiera consolidada, para comprender mi patrimonio de un vistazo. | El dashboard muestra patrimonio neto, ingresos, gastos y ahorro del período. | Dashboard (FR-DAS-*) |
| US-002 | Como usuario registrado, quiero registrar mis cuentas y movimientos, para reunir toda mi información en un solo lugar. | Cuentas y movimientos se listan y consolidan en la vista patrimonial de su propietario. | Cuentas (FR-CUE-*) · Movimientos (FR-TRX-*) · HU-001, HU-002 |
| US-003 | Como usuario registrado, quiero organizar mis ingresos, gastos y transferencias mediante categorías, fechas y descripciones, para analizar mi comportamiento financiero. | Cada movimiento admite tipo, monto, fecha, cuenta, categoría y descripción. | Movimientos (FR-TRX-*) · HU-001, HU-002 |
| US-005 | Como usuario registrado, quiero ver la evolución de mi patrimonio y de mi flujo de fondos con cálculos trazables, para confiar en los resultados. | Los totales del dashboard coinciden con los movimientos registrados y provienen de fórmulas centralizadas. | Dashboard (FR-DAS-*) · CAL-001, CAL-002 |
| US-010 | Como usuario registrado, quiero consultar un asistente de inteligencia artificial únicamente con información autorizada, para entender mejor mis finanzas. | El asistente requiere sesión válida, indica período y datos considerados y es de solo consulta: no crea, edita ni elimina información. | Asistente de inteligencia artificial (FR-IA-*) · HU-006 |
| US-011 | Como usuario registrado, quiero que mi información permanezca privada y separada de la de otros usuarios, para proteger mis datos. | El servidor verifica la pertenencia de cada recurso al usuario autenticado antes de leerlo o modificarlo. | NFR-SEG-001 a NFR-SEG-003 |

### 4.2. Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —acceso, cuentas, movimientos e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio y flujo de fondos coinciden con los movimientos registrados. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra el dashboard del mismo período y el asistente no modifica los datos. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados vacíos, de carga y de error comprensibles. |
| Evidencia de aceptación | Los requerimientos P0 cuentan con pruebas automatizadas o evidencia reproducible de aceptación. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |

**Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:**

| ID | Regla | Resultado esperado |
|---|---|---|
| CAL-001 | Patrimonio neto | Σ saldos netos de las cuentas. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
| CAL-010 | Tasa de ahorro | Ahorro del período / ingresos del período × 100. Su variación se expresa en puntos porcentuales. |

## 5. Pantallas de Usuario

| ID | Pantalla | Contenido y componentes previstos |
|---|---|---|
| SC-001 | Acceso | Registro e inicio de sesión; Card, Form, Input, Button y Alert. |
| SC-002 | Dashboard | Indicadores, gráficos, alertas y accesos rápidos; Card, Tabs, Chart, Progress y Skeleton. |
| SC-003 | Cuentas | Listado, saldo y formularios; Data Table, Badge, Dialog y Dropdown Menu. |
| SC-004 | Movimientos | Tabla y alta o edición; Data Table, Date Picker, Select, Form y Alert Dialog. |
| SC-009 | Asistente IA | Conversación y alcance del asistente; Scroll Area, Textarea, Button y Alert. |
| SC-010 | Configuración | Perfil y privacidad; Form, Switch y Alert Dialog. |

## 6. Glosario

| Término | Descripción |
|---|---|
| Cuenta | Contenedor de fondos del usuario con un saldo determinado. |
| Movimiento | Ingreso, gasto o transferencia registrado sobre una o más cuentas del usuario. |
| Categoría | Clasificación fija y predefinida por el sistema para los movimientos. |
| Transferencia | Movimiento que descuenta una cuenta de origen y acredita una de destino sin alterar ingresos ni gastos. |
| Patrimonio neto | Suma de los saldos netos de las cuentas del usuario. |
| Flujo de fondos | Resultado de ingresos menos gastos dentro de un período. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

## 7. Minutas de Reunión

- **Sin minutas registradas:** **No se registraron minutas de reunión para la versión 0.3 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.**
