# Documentación de Requerimientos de Negocio — Gestor Financiero Personal

| | |
|---|---|
| Versión | 0.2 |
| Fecha | 02/10/2026 |
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

## 2. Alcance

### 2.1. Descripción del Proyecto / Objetivos

**Desarrollar una aplicación web de gestión financiera personal que permita registrar cuentas y movimientos, administrar presupuestos, valuar activos y deudas, seguir inversiones y criptomonedas, definir objetivos y consultar reportes desde una vista consolidada, con cálculos trazables y un asistente de inteligencia artificial opcional cuyas acciones de escritura requieren confirmación explícita del usuario.**

**Los objetivos específicos son consolidar cuentas, activos, inversiones y deudas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías y filtros; comparar gastos reales con presupuestos mensuales y generar alertas; mostrar gráficos de patrimonio y flujo de fondos; consultar cotizaciones de un catálogo acotado de criptomonedas; registrar objetivos financieros y su porcentaje de avance; generar reportes consistentes con los datos de la aplicación; incorporar un asistente de inteligencia artificial opcional y explicativo, con acciones de escritura acotadas sujetas a confirmación explícita; y proteger la privacidad mediante autenticación, autorización por propietario y minimización de datos.**

### 2.2. Justificación

**Muchas personas administran su economía mediante hojas de cálculo, aplicaciones aisladas o registros parciales, lo que dificulta comprender el patrimonio total, controlar gastos, comparar el presupuesto con lo realmente consumido y evaluar el progreso hacia sus metas. Centralizar esa información en una solución académica permite mostrar una fotografía financiera comprensible, mantener trazabilidad de los cálculos y permitir consultas en lenguaje natural y acciones de escritura acotadas del asistente, siempre con confirmación explícita y sin exceder los permisos del usuario.**

### 2.3. Hipótesis

**Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos, permitirá ajustar el gasto a los presupuestos definidos y favorecerá el cumplimiento de los objetivos financieros del usuario.**

### 2.4. Restricciones

**La solución será una aplicación web con frontend React y componentes shadcn/ui, dimensionada para un proyecto universitario demostrable y extensible. No se almacenarán credenciales bancarias ni claves privadas de billeteras. El proveedor y modelo de inteligencia artificial, el backend y la infraestructura definitiva se definirán durante el diseño técnico, y la precisión del asistente dependerá de la calidad y actualidad de los datos cargados por el usuario.**

**Límite funcional: la aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero.**

**Atributos de calidad exigidos: cada recurso queda restringido a su propietario mediante autorización verificada en el servidor; las contraseñas se almacenan con hash adaptativo y los secretos de los proveedores nunca salen del servidor; la interfaz ofrece tema claro y oscuro sin perder contraste; las fórmulas financieras están cubiertas por pruebas unitarias y los flujos P0 por pruebas de integración; y la demostración usa datos ficticios y reproducibles. El detalle normativo de cada atributo está en el FRD (NFR-SEG y NFR-CAL).**

### 2.5. Dependencias

**El producto depende de un proveedor de cotizaciones de mercado para precios y metadatos, de un proveedor de inteligencia artificial para las respuestas en lenguaje natural, de una base de datos relacional para la persistencia, de un servicio de correo para la recuperación de contraseña y de una plataforma de despliegue segura y reproducible para la demostración. Todas las integraciones externas se realizan exclusivamente desde el backend.**

### 2.6. Alcance del Proyecto

**El alcance de la versión inicial incluye registro, inicio y cierre de sesión con perfil y moneda base; alta, edición y archivo de cuentas manuales; ingresos, gastos y transferencias con categorías y filtros; dashboard con indicadores y gráficos; presupuestos mensuales por categoría; activos físicos, inversiones y deudas con historial de valuaciones; cotizaciones de un catálogo limitado de criptomonedas; objetivos financieros; reportes; y un asistente de inteligencia artificial opcional, con acciones de escritura acotadas sujetas a confirmación explícita.**

**Quedan fuera de alcance la sincronización automática con bancos o billeteras, la ejecución de pagos u operaciones reales, la compraventa de activos y la conexión de billeteras digitales, el asesoramiento financiero, legal, impositivo o contable, la liquidación de impuestos y la conciliación bancaria avanzada, las cuentas familiares o multiusuario con permisos compartidos, las aplicaciones móviles nativas, notificaciones push y automatizaciones complejas, y una aplicación para iOS.**

## 3. Requerimientos de Negocio

### 3.1. Reglas de Negocio

**Los identificadores de requerimiento son estables entre versiones y no se renumeran: por eso la numeración puede presentar huecos. Los números ausentes corresponden a requerimientos que quedaron fuera del alcance de esta versión.**

| Regla | Descripción |
|---|---|
| RN-001 | Todo registro financiero tendrá un propietario único y solo será accesible dentro de su sesión autorizada. |
| RN-002 | Patrimonio neto = total de activos + total de posiciones + saldos netos de cuentas − total de deudas, expresado en la moneda base. Los objetivos no se suman al patrimonio neto. |
| RN-003 | Una transferencia no se contabiliza como ingreso ni como gasto. |
| RN-004 | Toda transferencia válida descuenta en la cuenta de origen y acredita en la cuenta de destino dentro de una única operación. |
| RN-005 | Solo los movimientos de tipo gasto participan del consumo de presupuestos. |
| RN-006 | El estado del presupuesto será disponible, advertencia o excedido según los umbrales configurados por el producto. |
| RN-007 | Los importes se almacenan con precisión decimal y conservan su moneda original. |
| RN-008 | Para un activo manual se utilizará su valuación más reciente vigente al cierre del período. |
| RN-009 | Para un criptoactivo se utilizará la última cotización válida disponible del proveedor configurado. |
| RN-010 | Una cotización desactualizada debe mostrarse con una advertencia y su fecha real; nunca se presentará como actual. |
| RN-012 | La inteligencia artificial podrá crear y editar información del propio usuario con acciones acotadas y confirmación explícita, sin exceder sus permisos. Las acciones destructivas requerirán habilitación explícita del usuario. |
| RN-013 | Los totales entregados al asistente serán calculados previamente por el sistema; la respuesta incluirá período y aclaración informativa. |
| RN-014 | La eliminación de información requerirá confirmación y respetará las reglas de conservación definidas. |

### 3.2. Casos de Estudio

| Caso | Condición | Resultado esperado |
|---|---|---|
| Caso 1: Presupuesto excedido | El usuario registró tres meses de movimientos, definió cuatro presupuestos mensuales y superó el límite de la categoría Supermercado. | El presupuesto se muestra en estado excedido, el dashboard destaca la alerta y el reporte del período refleja el mismo consumo. |
| Caso 2: Consulta de cotizaciones de criptomonedas | El usuario consulta el catálogo de criptomonedas definido por el sistema y el proveedor de mercado responde con normalidad. | Cada cotización muestra símbolo, precio, moneda, proveedor y fecha de actualización. |
| Caso 3: Consulta al asistente con datos insuficientes | El usuario habilita el asistente y pregunta por la evolución de sus gastos en un período sin movimientos cargados. | El asistente responde que no hay información suficiente e indica el período consultado. |

## 4. Requerimientos Funcionales

### 4.1. Historias de Usuario

| ID | Historia | Criterio de aceptación | Trazabilidad |
|---|---|---|---|
| US-001 | Como usuario registrado, quiero visualizar mi situación financiera consolidada en una moneda base, para comprender mi patrimonio de un vistazo. | El dashboard muestra patrimonio neto, ingresos, gastos y ahorro del período en la moneda base elegida. | Dashboard (FR-DAS-*) |
| US-002 | Como usuario registrado, quiero que el sistema represente mis cuentas, activos, inversiones y deudas, para reunir toda mi información en un solo lugar. | Cuentas, activos, posiciones y deudas se listan y consolidan en la vista patrimonial de su propietario. | Cuentas (FR-CUE-*) · Activos, inversiones y deudas (FR-ACT-*) · HU-004 |
| US-003 | Como usuario registrado, quiero organizar mis ingresos, gastos y transferencias mediante categorías, fechas y descripciones, para analizar mi comportamiento financiero. | Cada movimiento admite tipo, monto, moneda, fecha, cuenta, categoría y descripción, y puede filtrarse por fecha, tipo, cuenta y categoría. | Movimientos (FR-TRX-*) · HU-001, HU-002 |
| US-004 | Como usuario registrado, quiero establecer límites mensuales y conocer cuánto consumí de cada presupuesto, para controlar mis gastos. | Se muestran límite, gasto acumulado, disponible y porcentaje consumido, con estados disponible, advertencia y excedido. | Presupuestos (FR-PRE-*) · HU-003 |
| US-005 | Como usuario registrado, quiero ver la evolución de mi patrimonio y de mi flujo de fondos con cálculos trazables, para confiar en los resultados. | Los totales del dashboard y de los reportes coinciden para el mismo período y provienen de fórmulas centralizadas. | Dashboard (FR-DAS-*) · Reportes (FR-REP-*) · CAL-001, CAL-002 |
| US-006 | Como usuario registrado, quiero consultar las cotizaciones de mis criptomonedas en un catálogo definido por el sistema, para conocer su precio vigente. | Cada cotización muestra símbolo, precio, moneda, proveedor y fecha de actualización. | Cotizaciones de mercado (FR-MER-*) · HU-005 |
| US-007 | Como usuario registrado, quiero valuar manualmente mis activos no cotizados con historial, para reflejar cambios en su valor. | Una nueva valuación agrega un registro histórico y no elimina la valuación anterior. | Activos, inversiones y deudas (FR-ACT-*) · HU-004 |
| US-008 | Como usuario registrado, quiero definir objetivos financieros y visualizar su progreso, para planificar mis metas. | Se muestra el porcentaje de avance y el estado pendiente, en curso, alcanzado o vencido. | Objetivos financieros (FR-OBJ-*) |
| US-009 | Como usuario registrado, quiero generar reportes de mi situación financiera, para analizarla por período y por categoría. | El resumen del período se desglosa por categoría y por tipo de movimiento. | Reportes (FR-REP-*) |
| US-010 | Como usuario registrado, quiero consultar un asistente de inteligencia artificial únicamente con información autorizada, para entender mejor mis finanzas. | El asistente requiere sesión válida y activación previa, indica período y datos considerados, y toda escritura que proponga requiere confirmación explícita del usuario. | Asistente de inteligencia artificial (FR-IA-*) · HU-006 |
| US-011 | Como usuario registrado, quiero que mi información permanezca privada y separada de la de otros usuarios, para proteger mis datos. | El servidor verifica la pertenencia de cada recurso al usuario autenticado antes de leerlo o modificarlo. | NFR-SEG-001 a NFR-SEG-003 |
| US-012 | Como usuario registrado, quiero que toda cotización externa indique proveedor, moneda y fecha de actualización, para conocer la vigencia del precio. | Cada cotización muestra proveedor, moneda y fecha de actualización, y su vigencia es verificable. | Cotizaciones de mercado (FR-MER-*) · HU-005 |

### 4.2. Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —cuentas, movimientos, presupuestos, activos, reportes e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio, flujo de fondos y presupuestos son consistentes entre dashboard y reportes. |
| Trazabilidad de las cotizaciones | Cada cotización muestra proveedor, moneda y fecha de actualización, de modo que su vigencia pueda verificarse. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra un reporte del mismo período; toda escritura que proponga requiere confirmación explícita y queda registrada. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados vacíos, de carga y de error comprensibles. |
| Evidencia de aceptación | Los requerimientos P0 cuentan con pruebas automatizadas o evidencia reproducible de aceptación. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |

**Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:**

| ID | Regla | Resultado esperado |
|---|---|---|
| CAL-001 | Patrimonio neto | Σ activos + Σ posiciones + Σ saldos netos de cuentas − Σ deudas, todo en moneda base. Los objetivos no se suman. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
| CAL-004 | Consumo de presupuesto | Gasto del período / límite × 100; si el límite es cero, no se divide. |
| CAL-005 | Valor de posición | Cantidad × último precio válido en la moneda del instrumento. |
| CAL-006 | Ganancia o pérdida nominal | Valor actual − costo acumulado. |
| CAL-007 | Progreso de objetivo | Monto acumulado / monto meta × 100, limitado visualmente a un mínimo de 0 %. |
| CAL-010 | Tasa de ahorro | Ahorro del período / ingresos del período × 100. Su variación se expresa en puntos porcentuales. |

## 5. Pantallas de Usuario

| ID | Pantalla | Contenido y componentes previstos |
|---|---|---|
| SC-001 | Acceso | Registro, inicio de sesión y recuperación; Card, Form, Input, Button y Alert. |
| SC-002 | Dashboard | Indicadores, gráficos, alertas y accesos rápidos; Card, Tabs, Chart, Progress y Skeleton. |
| SC-003 | Cuentas | Listado, saldo y formularios; Data Table, Badge, Dialog y Dropdown Menu. |
| SC-004 | Movimientos | Tabla filtrable y alta o edición; Data Table, Date Picker, Select, Form y Alert Dialog. |
| SC-005 | Presupuestos | Progreso por categoría y período; Card, Progress, Badge y Dialog. |
| SC-006 | Activos e inversiones | Activos, deudas, posiciones y valuaciones; Tabs, Data Table, Sheet y Chart. |
| SC-007 | Objetivos | Metas y avance; Card, Progress, Form y Badge. |
| SC-008 | Reportes | Filtros, gráficos y comparación por período; Tabs, Chart y Button. |
| SC-009 | Asistente IA | Conversación y alcance del asistente; Scroll Area, Textarea, Button y Alert. |
| SC-010 | Configuración | Perfil, moneda, tema, privacidad e IA; Form, Switch, Select y Alert Dialog. |

## 6. Glosario

| Término | Descripción |
|---|---|
| Activo | Recurso con valor económico perteneciente al usuario. |
| Deuda | Obligación financiera pendiente que reduce el patrimonio neto. |
| Patrimonio neto | Total de activos más total de posiciones y saldos netos de cuentas, menos total de deudas. Los objetivos no se suman. |
| Presupuesto | Límite planificado de gasto para una categoría y período. |
| Valuación | Estimación del valor de un activo en una fecha determinada. |
| Posición | Cantidad de un instrumento financiero mantenida por el usuario. |
| Cotización | Precio informado por un proveedor para un activo y momento determinados. |
| Flujo de fondos | Resultado de ingresos menos gastos dentro de un período. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

## 7. Minutas de Reunión

- **Sin minutas registradas:** **No se registraron minutas de reunión para la versión 0.1 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.**
