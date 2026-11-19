# Documentación de Requerimientos de Negocio — Gestor Financiero Personal

| | |
|---|---|
| Versión | 0.4 |
| Estado | Vigente — versión de referencia para la implementación |
| Fecha | 31/10/2026 |
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
| 0.2 | 02/10/2026 | Barenghi, Thomas | Se actualiza el cálculo de patrimonio neto y el glosario conforme a la nueva definición de CAL-001. No se modifican los requerimientos de negocio. |
| 0.3 | 30/10/2026 | Barenghi, Thomas | Se consolida el alcance en los flujos de acceso, cuentas, movimientos, panel y asistente, y se alinean las reglas, historias, criterios, pantallas y glosario con la versión vigente. |
| 0.4 | 31/10/2026 | Barenghi, Thomas | Se alinea el BRD con el FRD v0.4: los 20 FR conservan sus identificadores y su alcance, y solo se adapta su redacción al formato estándar. No cambia el alcance de negocio. |

## 2. Alcance

### 2.1. Descripción del Proyecto / Objetivos

**Desarrollar una aplicación web para organizar las finanzas personales. Permitirá registrar cuentas y movimientos, clasificarlos con categorías y ver la evolución del patrimonio y del flujo de fondos en un solo lugar. Los cálculos serán trazables y el asistente de IA será de solo consulta, disponible con sesión iniciada.**

**Los objetivos específicos son consolidar las cuentas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías; mostrar gráficos de patrimonio y flujo de fondos; ofrecer un asistente de IA explicativo, de solo consulta y disponible con sesión iniciada; y proteger la privacidad con autenticación, autorización por propietario y minimización de datos.**

### 2.2. Justificación

**Muchas personas administran su economía con planillas, aplicaciones aisladas o registros parciales, y les cuesta ver su patrimonio total o controlar sus gastos. Centralizar esa información en una solución académica permite mostrar una foto financiera clara, mantener la trazabilidad de los cálculos y hacer consultas en lenguaje natural, sin superar los permisos del usuario y sin modificar sus datos.**

### 2.3. Hipótesis

**Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos y favorecerá una mejor organización de las finanzas del usuario.**

### 2.4. Restricciones

**La solución será una aplicación web con React, componentes shadcn/ui y una API NestJS sobre PostgreSQL, pensada como un proyecto universitario demostrable y extensible. El proveedor de IA es DeepSeek (compatible con OpenAI). No se guardarán credenciales bancarias ni claves privadas de billeteras. La precisión del asistente depende de los datos que cargue el usuario.**

**Límite funcional: la aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero.**

**Atributos de calidad exigidos: cada usuario solo accede a sus propios recursos, con autorización verificada en el servidor; las contraseñas se guardan protegidas con un hash seguro y las claves de los proveedores nunca salen del servidor; las fórmulas financieras están cubiertas por pruebas unitarias y los flujos P0 por pruebas de integración; y la demostración usa datos ficticios y reproducibles. El detalle de cada atributo está en el FRD (NFR-SEG y NFR-CAL).**

**La preferencia de tema (claro, oscuro o automático) es local al navegador y no se sincroniza entre dispositivos.**

### 2.5. Dependencias

**El producto depende de un proveedor de IA para las respuestas en lenguaje natural, de una API pública de cotizaciones, de una base de datos relacional y de una plataforma de despliegue segura y repetible. Las conexiones con servicios externos se hacen desde el servidor, nunca desde el navegador.**

### 2.6. Alcance del Proyecto

**El alcance de la versión inicial incluye registro, inicio y cierre de sesión con perfil; alta, edición y eliminación de cuentas manuales; ingresos, gastos y transferencias con categorías; dashboard con indicadores y gráficos; y un asistente de inteligencia artificial de solo consulta, siempre disponible con sesión válida.**

**La aplicación opera con multimoneda** (cada cuenta declara su moneda y el dashboard permite leer los valores en la moneda principal o en cualquier moneda del catálogo, con cotizaciones provistas por la API), cinco categorías fijas del sistema y categorías propias que cada usuario puede crear, editar y eliminar.

**La versión incorpora búsqueda y filtros de movimientos; gestión de categorías propias; preferencia local de tema; granularidad diaria o mensual del patrimonio y semanal o mensual de los flujos según la duración del rango; y continuidad de la conversación del asistente en memoria del cliente, sin persistencia en el servidor.**

**El período de análisis (Este mes, Últimos 30 días, 6 meses y 12 meses) es compartido por el panel, los movimientos, las categorías y el asistente.**

**La búsqueda y los filtros operan sobre los movimientos cargados en la vista (hasta 100 registros) y el uso de categorías se calcula sobre esos movimientos; el panel y los cálculos se resuelven en el servidor con el conjunto completo de movimientos del período.**

**Quedan fuera de alcance la conexión con bancos o billeteras, la ejecución de pagos reales y el asesoramiento financiero, legal o impositivo: la aplicación se limita a organizar y explicar la información que carga el usuario.**

## 3. Requerimientos de Negocio

### 3.1. Reglas de Negocio

**Los identificadores de requerimiento se numeran de forma consecutiva dentro de cada familia.**

| Regla | Descripción |
|---|---|
| RN-001 | Hay una moneda principal y una moneda de lectura; los valores se convierten con las cotizaciones globales de la API. Cambiar la moneda de lectura no altera los registros. |
| RN-002 | Las cotizaciones son globales y las provee la API; no se persisten y el usuario no las crea ni las edita. |

> Las reglas de propiedad, transferencias, cuentas, categorías y asistente se detallan en los `FR-*` y `HU-*` correspondientes para evitar duplicación.

### 3.2. Casos de Estudio

| ID | Caso de estudio | Descripción | Actor |
|---|---|---|---|
| CE-01 | Registrar movimientos | Cargar ingresos y gastos con categoría, fecha y descripción para mantener los saldos al día. | Usuario registrado |
| CE-02 | Transferir entre cuentas | Mover fondos entre cuentas propias, incluso de distinta moneda, sin alterar ingresos ni gastos. | Usuario registrado |
| CE-03 | Consultar el panel | Revisar patrimonio, ingresos, gastos, ahorro y gráficos del período elegido. | Usuario registrado |
| CE-04 | Clasificar con categorías | Usar las categorías del sistema y crear categorías propias para organizar los movimientos. | Usuario registrado |
| CE-05 | Consultar al asistente | Preguntar en lenguaje natural por la evolución o la composición de los gastos. | Usuario registrado |

## 4. Requerimientos Funcionales

### 4.1. Historias de Usuario

Las historias de negocio describen el valor esperado para el usuario. El detalle funcional y los criterios verificables viven en el FRD. El FRD v0.4 conserva los identificadores y el alcance de los 20 FR y adapta su redacción al formato `[Actor/Sistema] + debe + [acción] + [condición]`; la columna Trazabilidad mantiene los mismos identificadores.

| ID | Historia | Resultado esperado | Trazabilidad |
|---|---|---|---|
| US-001 | Como usuario registrado, quiero comprender mi situación financiera consolidada de un vistazo. | Vista consolidada del patrimonio y los flujos. | FR-DAS-001 · HU-006 |
| US-002 | Como usuario registrado, quiero reunir mis cuentas y movimientos en un solo lugar. | Información financiera centralizada por usuario. | FR-CUE-* · FR-TRX-* · HU-001, HU-002, HU-005 |
| US-003 | Como usuario registrado, quiero registrar mis ingresos y gastos para analizar mi comportamiento. | Movimientos registrados y disponibles para análisis. | FR-TRX-001 · HU-001 |
| US-004 | Como usuario registrado, quiero confiar en los cálculos de mi panel. | Cálculos trazables y consistentes con los datos. | FR-DAS-* · CAL-001, CAL-002, CAL-004 |
| US-005 | Como usuario registrado, quiero consultar un asistente con información autorizada. | Asistente disponible y limitado a los datos del usuario. | FR-IA-001 · HU-003, HU-010 |
| US-006 | Como usuario registrado, quiero que mi información esté separada de la de otros usuarios. | Acceso restringido al propietario. | NFR-SEG-001 a NFR-SEG-003 · HU-011 |
| US-007 | Como visitante, quiero registrarme e iniciar sesión para acceder a mi información. | Cuenta creada y sesión iniciada de forma segura. | FR-AUT-001/002, FR-CFG-002 · HU-004 |
| US-008 | Como usuario registrado, quiero administrar mis cuentas y su saldo. | Cuentas propias creadas, editadas y eliminadas. | FR-CUE-001/002/003/004 · HU-005 |
| US-009 | Como usuario registrado, quiero mover fondos entre cuentas propias. | Transferencias sin alterar ingresos ni gastos. | FR-TRX-001 · CAL-003 · HU-002 |
| US-010 | Como usuario registrado, quiero corregir mis movimientos. | Datos y totales actualizados. | FR-TRX-001 · HU-008 |
| US-011 | Como usuario registrado, quiero interpretar mi evolución financiera con gráficos. | Gráficos del período disponibles. | FR-DAS-002 · HU-007 |
| US-012 | Como usuario registrado, quiero analizar mi información en el período que elijo. | Período compartido por las vistas. | FR-DAS-003 · HU-009 |
| US-013 | Como usuario registrado, quiero que el asistente no modifique mis datos. | Asistente de solo consulta. | FR-IA-001 · HU-010 |
| US-014 | Como usuario registrado, quiero encontrar mis movimientos sin recorrer toda la lista. | Búsqueda y filtros disponibles. | FR-TRX-002 · HU-012 |
| US-015 | Como usuario registrado, quiero clasificar mis movimientos con categorías propias. | Categorías propias administrables y su uso visible. | FR-CAT-001/002 · HU-013, HU-020 |
| US-016 | Como usuario registrado, quiero adaptar la apariencia de la interfaz. | Preferencia de tema aplicada. | FR-CFG-001 · HU-014 |
| US-017 | Como usuario registrado, quiero hacer preguntas de seguimiento al asistente. | Conversación continua dentro del período. | FR-IA-002 · HU-015 |
| US-018 | Como usuario registrado, quiero expresar mi patrimonio en mi moneda principal. | Moneda principal aplicada al panel. | FR-CFG-003 · HU-016 |
| US-019 | Como usuario registrado, quiero entender el saldo y los movimientos de una cuenta. | Detalle de cuenta disponible. | FR-CUE-004 · HU-017 |
| US-020 | Como usuario registrado, quiero revisar mi actividad histórica. | Historial de movimientos disponible. | FR-TRX-004 · HU-018 |
| US-021 | Como usuario registrado, quiero analizar mis movimientos fuera de la aplicación. | Movimientos exportables. | FR-TRX-003 · HU-019 |
| US-022 | Como usuario registrado, quiero ver el peso de cada categoría en el período. | Uso por categoría disponible. | FR-CAT-002 · HU-020 |

### 4.2. Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —acceso, cuentas, movimientos e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio y flujo de fondos coinciden con los movimientos registrados. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra el dashboard del mismo período y el asistente no modifica los datos. |
| Continuidad del asistente | El asistente interpreta preguntas de seguimiento con el historial reciente, sin persistirlo y manteniendo las cifras del período consultado. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados de carga y de error comprensibles. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |
| Formato y trazabilidad | Cada FR se redacta con la plantilla actor + debe + acción + condición y conserva su identificador y su trazabilidad en el BRD y el Plan de Pruebas. |

**Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:**

| ID | Regla | Resultado esperado |
|---|---|---|
| CAL-001 | Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, en la moneda de lectura. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período, convirtiendo cada flujo a la moneda de lectura. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
| CAL-004 | Tasa de ahorro | Ahorro del período / ingresos del período × 100, sobre los flujos convertidos a la moneda de lectura. Su variación se expresa en puntos porcentuales. |

## 5. Pantallas de Usuario

| ID | Pantalla | Contenido y componentes previstos |
|---|---|---|
| SC-001 | Acceso | Registro e inicio de sesión; Card, Form, Input, Button y Alert. |
| SC-002 | Dashboard | Indicadores, gráficos, selector de moneda de lectura en el header cuando hay más de una disponible, período compartido y accesos rápidos; Card, Chart y Skeleton. |
| SC-003 | Cuentas | Listado en el inicio, saldo, detalle con movimientos y formularios; Lista, Badge, Dialog y Dropdown Menu. |
| SC-004 | Movimientos | Listado agrupado por mes, búsqueda, filtros, exportación CSV y alta o edición; Lista, Date Picker, Select, Form y Alert Dialog. |
| SC-005 | Asistente IA | Conversación con historial en memoria, período y alcance del asistente; Scroll Area, Textarea, Button y Alert. |
| SC-006 | Configuración | Perfil y credenciales, preferencia de tema, moneda principal (cuando las cuentas usan más de una moneda), exportación CSV y sesión; Form, Segmented Control y Alert Dialog. |
| SC-007 | Categorías | Listado con uso del período y selector de moneda de lectura, alta y edición; Tabs, Badge, Progress, Dialog y Alert Dialog. |

> **Configuración en dos rutas:** `SC-006` se materializa en un hub de perfil (`/profile`: identidad, contadores y accesos) y en la pantalla de ajustes (`/settings`: nombre y correo, contraseña, tema, moneda principal y exportación CSV).

## 6. Glosario

| Término | Descripción |
|---|---|
| Cuenta | Contenedor de fondos del usuario con un saldo determinado. |
| Movimiento | Ingreso, gasto o transferencia registrado sobre una o más cuentas del usuario. |
| Categoría | Clasificación de los movimientos; puede ser del sistema (global y de solo lectura) o propia del usuario. |
| Categoría del sistema | Categoría global definida por la aplicación y compartida por todos los usuarios; no se edita ni se elimina. |
| Categoría propia | Categoría creada por un usuario, editable y eliminable solo por su propietario. |
| Transferencia | Movimiento que descuenta una cuenta de origen y acredita una de destino sin alterar ingresos ni gastos. |
| Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, expresado en la moneda de lectura; usa los saldos actuales. |
| Flujo de fondos | Resultado de ingresos menos gastos dentro de un período. |
| Moneda principal | Moneda elegida por el usuario; se usa por defecto para leer el patrimonio y los flujos. |
| Moneda de lectura | Moneda en la que se muestran los importes; por defecto, la principal. También se llama moneda de visualización. |
| Preferencias locales | Configuración de la interfaz (tema) guardada en el navegador del usuario. |
| Historial de conversación | Turnos recientes que el cliente reenvía al asistente para interpretar preguntas de seguimiento; no se almacenan en el servidor. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

## 7. Minutas de Reunión

- **Sin minutas registradas:** **No se registraron minutas de reunión para la versión 0.4 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.**
