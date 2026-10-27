# Documentación de Requerimientos Funcionales — Gestor Financiero Personal

| | |
|---|---|
| Versión | 0.3.1 |
| Estado | En desarrollo — versión preliminar, no finalizada |
| Fecha | 26/10/2026 |
| Sponsor Operación | Secretaría Académica UNAHUR |
| Sponsor Organización | UNAHUR |
| Autor | Barenghi, Thomas |
| Release | Demostración académica 2026 |

## Tabla de contenidos

- 1. Historial de cambios
- 2. Alcance
- 3. Información de Requerimientos de Negocio
- 4. Requerimientos Funcionales
- 5. Pantallas de Usuario
- 6. Glosario
- 7. Minutas de reunión

## 1. Historial de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 0.1 | 04/09/2026 | Barenghi, Thomas | Versión inicial. Especificación funcional del Gestor Financiero Personal. |
| 0.2 | 02/10/2026 | Barenghi, Thomas | Se agregan 5 requerimientos funcionales, 1 no funcional y 1 regla de cálculo; se modifican FR-DAS-007, FR-IA-009 y CAL-001, y se actualiza la regla de negocio RN-002 (patrimonio neto). |
| 0.3 | 16/10/2026 | Barenghi, Thomas | Se ajusta el alcance de la versión y se consolida la documentación en torno a los flujos principales: acceso, cuentas, movimientos, panel y asistente de consulta. Se actualizan los requerimientos, las reglas de negocio y de cálculo, las entidades, las pantallas y los datos de demostración, y se amplían las User Stories para cubrir todos los módulos vigentes. El asistente queda definido como de solo consulta. |
| 0.3.1 | 26/10/2026 | Barenghi, Thomas | Se alinea el documento con la implementación vigente: búsqueda y filtros de movimientos; gestión de categorías propias; preferencia local de tema; granularidad diaria y semanal del panel; continuidad de la conversación del asistente en memoria del cliente; multimoneda (moneda por cuenta, moneda principal, cotizaciones automáticas de la API consultadas en cada lectura y sin persistencia, transferencias multimoneda y selector de moneda de lectura); autenticación JWT stateless sin tabla de sesiones y con transporte exclusivo por cookie HttpOnly; consolidación de reglas y criterios para eliminar duplicidades; y retiro de requisitos de estados vacíos, atomicidad de transferencias, exportación CSV e insuficiencia del asistente. |

## 2. Alcance

### 2.1 Descripción del Proyecto/Objetivos

Desarrollar una aplicación web de gestión financiera personal que permita registrar cuentas y movimientos, organizarlos con categorías, y consultar la evolución del patrimonio y del flujo de fondos desde una vista consolidada, con cálculos trazables y un asistente de inteligencia artificial de solo consulta, siempre disponible con sesión válida.

Los objetivos específicos son consolidar las cuentas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías; mostrar gráficos de patrimonio y flujo de fondos; incorporar un asistente de inteligencia artificial explicativo, de solo consulta y siempre disponible con sesión válida; y proteger la privacidad mediante autenticación, autorización por propietario y minimización de datos.

### 2.2 Justificación

Muchas personas administran su economía mediante hojas de cálculo, aplicaciones aisladas o registros parciales, lo que dificulta comprender el patrimonio total y controlar los gastos. Centralizar esa información en una solución académica permite mostrar una fotografía financiera comprensible, mantener trazabilidad de los cálculos y permitir consultas en lenguaje natural del asistente, sin exceder los permisos del usuario y sin que la interacción modifique sus datos.

### 2.3 Hipótesis

Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos y favorecerá una mejor organización de las finanzas del usuario.

### 2.4 Restricciones

La solución será una aplicación web con frontend React y componentes shadcn/ui, dimensionada para un proyecto universitario demostrable y extensible. No se almacenarán credenciales bancarias ni claves privadas de billeteras. El proveedor y modelo de inteligencia artificial, el backend y la infraestructura definitiva se definirán durante el diseño técnico, y la precisión del asistente dependerá de la calidad y actualidad de los datos cargados por el usuario.

Límite funcional: la aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero.

La preferencia de tema (claro, oscuro o automático) es local al navegador y no se sincroniza entre dispositivos.

### 2.5 Dependencias

| Servicio | Datos intercambiados | Comportamiento ante falla |
|---|---|---|
| Proveedor de IA | Pregunta y contexto financiero mínimo ya calculado. | Informar indisponibilidad; no perder ni modificar datos financieros. |
| Proveedor de cotizaciones (currency-api) | Tasas de cambio globales para las monedas del catálogo. | Informar indisponibilidad y permitir reintentar; no modificar datos financieros. |
| Base de datos relacional | Cuentas, movimientos y categorías del usuario. | Reintentar la operación e informar el error; no confirmar la acción como exitosa. |
| Plataforma de despliegue | Aplicación, configuración y secretos del entorno. | Conservar la versión anterior disponible si el despliegue falla. |

### 2.6 Alcance

El alcance de la versión inicial incluye registro, inicio y cierre de sesión con perfil; alta, edición y eliminación de cuentas manuales; ingresos, gastos y transferencias con categorías; dashboard con indicadores y gráficos; y un asistente de inteligencia artificial de solo consulta, siempre disponible con sesión válida.

La aplicación opera con **multimoneda** (cada cuenta declara su moneda y el dashboard permite leer los valores en la moneda principal o en otra moneda en uso, con cotizaciones provistas por la API), cinco categorías fijas del sistema y categorías propias que cada usuario puede crear, editar y eliminar.

La versión incorpora búsqueda y filtros de movimientos; gestión de categorías propias; preferencia local de tema; granularidad diaria o semanal del panel según la duración del rango; y continuidad de la conversación del asistente en memoria del cliente.

El período de análisis (Este mes, Últimos 30 días, 6 meses y 12 meses) es compartido por el panel, los movimientos y el asistente.

La búsqueda y los filtros operan sobre los movimientos cargados en la vista (hasta 100 registros). El uso de categorías se calcula sobre esos movimientos. El dashboard y los cálculos se resuelven en el servidor con el conjunto completo de movimientos del período.

Quedan fuera de alcance la sincronización automática con bancos o billeteras, la ejecución de pagos u operaciones reales, la compraventa de activos y la conexión de billeteras digitales, el asesoramiento financiero, legal, impositivo o contable, la liquidación de impuestos y la conciliación bancaria avanzada, las cuentas familiares o multiusuario con permisos compartidos, las aplicaciones móviles nativas, las notificaciones push y las automatizaciones complejas, y una aplicación para iOS. Las capacidades de gestión patrimonial avanzada y de integración con proveedores de mercado quedan para una iteración posterior.

**Actores**

| Actor | Descripción | Acciones principales |
|---|---|---|
| Visitante | Persona sin sesión iniciada. | Registrarse e iniciar sesión. |
| Usuario registrado | Propietario de sus datos financieros. | Gestionar cuentas y movimientos y consultar al asistente. |
| Proveedor de IA | Servicio externo de lenguaje natural. | Generar una respuesta sobre contexto mínimo autorizado. |
| Proveedor de cotizaciones | API pública de tipos de cambio. | Proveer las cotizaciones globales usadas por el dashboard. |

**Prioridades**

| Nivel | Criterio |
|---|---|
| P0 — esencial | Necesario para una demostración completa y para cumplir el objetivo principal. |
| P1 — importante | Aporta valor significativo, pero puede simplificarse si el cronograma lo exige. |
| P2 — futuro | Queda documentado para una iteración posterior; no condiciona la aceptación inicial. |

**Datos de demostración**

| Elemento | Detalle |
|---|---|
| Usuario | Un usuario ficticio sin datos personales reales. |
| Cuentas | Cuatro cuentas: tres en ARS y una en USD. |
| Monedas | ARS como moneda principal y USD; cotizaciones globales provistas por la API. |
| Movimientos | Tres meses de ingresos, gastos y transferencias. |
| Categorías | Cinco categorías fijas del sistema; el seed de demo crea además la categoría propia “Otros” para ejercitar categorías propias. |
| Consultas de IA | Consultas preparadas para comparar gastos y evolución patrimonial. |

## 3. Información de Requerimientos de Negocio

### 3.1 Reglas de Negocio

| Regla | Descripción |
|---|---|
| RN-014 | Hay una moneda principal. El patrimonio y los flujos se informan en la moneda de lectura (default: principal), convirtiendo cada valor con la cotización de la API. La moneda de lectura es una vista: cambiarla no altera registros. Los indicadores incluyen todas las monedas y el total convertido se muestra con desglose por moneda cuando hay más de una en uso. |
| RN-016 | Las cotizaciones son globales y las provee la API; no se persisten y el usuario no las crea ni las edita. |

> Las reglas de propiedad, transferencias, cuentas, categorías y asistente se detallan en los `FR-*` y `HU-*` correspondientes para evitar duplicación.

**Entidades principales**

| Entidad | Atributos mínimos | Relaciones clave |
|---|---|---|
| Usuario | id, nombre, email | Propietario de todas las entidades financieras. |
| Cuenta | id, tipo, nombre, moneda, saldo inicial | Tiene movimientos; la moneda es fija si ya tiene movimientos. |
| Movimiento | id, tipo, monto, fecha, descripción | Pertenece a cuenta y categoría; transferencia vincula dos cuentas y guarda el monto de cada pata. |
| Cotización | moneda, tasa, fecha, fuente | Global, provista por la API; no se persiste ni la edita el usuario. |
| Categoría | id, nombre, tipo, color/icono, `user_id` opcional | Catálogo global (`user_id` nulo) o propia del usuario; clasifica movimientos. |

> La preferencia de tema se guarda en el navegador y no es una entidad del dominio financiero.

## 4. Requerimientos Funcionales

### 4.1 User Stories

| Historia | Descripción | Criterios de aceptación |
|---|---|---|
| HU-001 — Registrar un movimiento | Como usuario registrado, quiero cargar un ingreso o gasto para mantener actualizados mis saldos. | • Los campos obligatorios se validan antes de guardar.<br>• El monto debe ser mayor que cero.<br>• El movimiento aparece en el listado y actualiza saldo y dashboard.<br>• La API verifica que cuenta y categoría pertenezcan al usuario autenticado. |
| HU-002 — Transferir entre cuentas | Como usuario registrado, quiero mover dinero entre dos cuentas propias, incluso de monedas distintas, sin alterar mis ingresos o gastos. | • Origen y destino son diferentes y pertenecen al usuario.<br>• Se registran efectos opuestos; en multimoneda se guardan el monto origen y el monto destino.<br>• La cotización usada se puede sobrescribir y no se persiste.<br>• La transferencia se excluye del flujo de fondos consolidado. |
| HU-006 — Consultar al asistente | Como usuario registrado, quiero preguntar por mis gastos para entender mi comportamiento financiero. | • El asistente requiere sesión válida.<br>• Solo utiliza datos propios y el mínimo contexto necesario.<br>• La respuesta identifica período y categorías considerados.<br>• Los totales coinciden con el dashboard del mismo período.<br>• El asistente es de solo consulta: no crea, edita ni elimina datos.<br>• Puede recibir turnos recientes de la conversación como contexto, sin persistirlos en el servidor. |
| HU-007 — Registrarme e iniciar sesión | Como visitante, quiero registrarme e iniciar sesión para acceder a mi información financiera. | • El registro valida los campos obligatorios, incluida la moneda principal, y rechaza el correo duplicado.<br>• Al cerrar sesión se limpian las cookies y las pantallas financieras redirigen al acceso; el token emitido expira según su vigencia. |
| HU-008 — Gestionar mis cuentas | Como usuario registrado, quiero crear, editar y eliminar mis cuentas para reflejar dónde está mi dinero. | • Se registran nombre, tipo, moneda y saldo inicial.<br>• El saldo actual se calcula desde el saldo inicial y los movimientos, en la moneda de la cuenta.<br>• La moneda no se cambia si la cuenta tiene movimientos.<br>• La eliminación elimina en cascada los movimientos asociados y solo alcanza cuentas propias. |
| HU-009 — Ver el resumen del panel | Como usuario registrado, quiero ver mi patrimonio, ingresos, gastos y ahorro del período para entender mi situación de un vistazo. | • El panel muestra los cuatro indicadores del período seleccionado.<br>• Incluye todas las monedas convertidas a la moneda de lectura.<br>• Los totales coinciden con los movimientos registrados. |
| HU-010 — Ver los gráficos del panel | Como usuario registrado, quiero ver la evolución del patrimonio, la comparación entre ingresos y gastos y la distribución de gastos por categoría. | • El panel muestra los tres gráficos.<br>• Los gráficos coinciden con los datos del período seleccionado.<br>• La evolución del patrimonio es diaria y las barras son semanales para rangos de hasta 31 días; en rangos mayores son mensuales. |
| HU-011 — Corregir un movimiento | Como usuario registrado, quiero editar o eliminar un movimiento propio para arreglar errores de carga. | • Solo se editan o eliminan movimientos del usuario autenticado.<br>• Los saldos, el panel y los cálculos se actualizan en consecuencia. |
| HU-012 — Elegir el período | Como usuario registrado, quiero elegir el período de análisis. | • El período (Este mes, Últimos 30 días, 6 meses, 12 meses) es compartido por panel, movimientos y asistente.<br>• El período seleccionado afecta a los indicadores y gráficos. |
| HU-013 — Límites del asistente | Como usuario registrado, quiero que el asistente solo consulte información. | • El asistente no crea, edita ni elimina información. |
| HU-014 — Proteger mis datos | Como usuario registrado, quiero que mi información quede separada de la de otros usuarios. | • El servidor verifica la pertenencia de cada recurso al usuario autenticado antes de leerlo o modificarlo. |
| HU-015 — Buscar y filtrar movimientos | Como usuario registrado, quiero encontrar mis movimientos sin recorrer toda la lista. | • La búsqueda cubre concepto, nota, categoría y monto.<br>• Los filtros permiten tipo, cuenta, categoría y período. |
| HU-016 — Gestionar categorías propias | Como usuario registrado, quiero clasificar mis movimientos con mis propias categorías. | • Puedo crear, editar y eliminar categorías propias.<br>• Las cinco categorías del sistema y las de otros usuarios no se pueden modificar.<br>• Al eliminar una categoría propia, sus movimientos quedan “Sin categoría”. |
| HU-017 — Preferencias de la interfaz | Como usuario registrado, quiero elegir el tema de la interfaz. | • El tema puede ser claro, oscuro o automático.<br>• La preferencia se guarda localmente y no modifica datos financieros. |
| HU-018 — Conversación continua con el asistente | Como usuario registrado, quiero hacer preguntas de seguimiento sin repetir el contexto. | • El cliente envía hasta los últimos 10 mensajes como historial.<br>• El servidor acepta como máximo 12 mensajes y no los persiste.<br>• Las cifras siempre provienen del período vigente y el asistente sigue siendo de solo consulta. |

**Requerimientos funcionales por módulo**

Los identificadores de requerimiento son estables entre versiones y no se renumeran: por eso la numeración puede presentar huecos. Los números ausentes corresponden a requerimientos que quedaron fuera del alcance de esta versión.

**Autenticación y perfil**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-AUT-001 | P0 | El visitante podrá registrarse con nombre, correo electrónico, contraseña y moneda principal. |
| FR-AUT-002 | P0 | El usuario podrá iniciar y cerrar sesión. Al cerrar se limpian las cookies y el cliente descarta el estado de sesión; al ser JWT stateless, el token emitido sigue vigente hasta expirar. |

**Dashboard**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-DAS-001 | P0 | Mostrar patrimonio neto, ingresos, gastos y ahorro del período seleccionado, incluyendo todas las monedas convertidas a la moneda de lectura. |
| FR-DAS-002 | P0 | Mostrar la evolución temporal del patrimonio neto: diaria para rangos de hasta 31 días y al cierre de cada mes para rangos mayores. |
| FR-DAS-003 | P0 | Comparar ingresos y gastos por tramo: semanal para rangos de hasta 31 días y mensual para rangos mayores. |
| FR-DAS-004 | P0 | Distribuir los gastos por categoría. |
| FR-DAS-007 | P1 | Permitir cambiar el período de análisis (Este mes, Últimos 30 días, 6 meses y 12 meses) y la moneda de lectura del dashboard; el período es compartido por dashboard, movimientos y asistente. |

**Cuentas**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CUE-001 | P0 | Crear cuentas de efectivo, bancaria manual, billetera u otra. |
| FR-CUE-002 | P0 | Registrar nombre, tipo, moneda, saldo inicial y observaciones opcionales. La moneda no se puede cambiar si la cuenta ya tiene movimientos. |
| FR-CUE-003 | P0 | Editar y eliminar cuentas propias. |
| FR-CUE-004 | P0 | Calcular el saldo actual a partir del saldo inicial y los movimientos asociados. |
| FR-CUE-005 | P0 | La eliminación de una cuenta elimina en cascada sus movimientos asociados. |

**Movimientos**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-TRX-001 | P0 | Crear movimientos de tipo ingreso, gasto o transferencia. |
| FR-TRX-002 | P0 | Registrar monto positivo, fecha, cuenta, categoría, descripción y notas opcionales. En transferencias entre monedas distintas se registran el monto origen y el monto destino; la cotización puede sobrescribirse y no se persiste. Las categorías del sistema son fijas; el usuario puede asignar sus propias categorías (FR-CAT-*). |
| FR-TRX-003 | P0 | Editar o eliminar únicamente movimientos pertenecientes al usuario autenticado. |
| FR-TRX-004 | P0 | En una transferencia, las cuentas de origen y destino deberán ser diferentes. La operación puede iniciarse desde el detalle de una cuenta con el origen precargado. |
| FR-TRX-007 | P1 | Buscar y filtrar movimientos por concepto, nota, categoría, monto, tipo, cuenta y período. Los filtros se aplican en cliente sobre los movimientos cargados en la vista (hasta 100 registros). |

**Categorías**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CAT-001 | P0 | Disponer de cinco categorías básicas del sistema. |
| FR-CAT-002 | P0 | Crear y editar categorías propias (nombre, tipo y color). El tipo es inmutable al editar y el nombre es único por tipo entre las categorías visibles para el usuario. |
| FR-CAT-003 | P0 | Eliminar categorías propias únicamente; las del sistema y las de otros usuarios se rechazan. Al eliminar una propia, sus movimientos quedan sin categoría. |
| FR-CAT-004 | P1 | Mostrar el uso de cada categoría en el período: cantidad de movimientos, monto y porcentaje, ordenado por uso. |

**Configuración y preferencias**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CFG-001 | P1 | Permitir elegir el tema de la interfaz (claro, oscuro o automático) y persistirlo localmente. |
| FR-CFG-003 | P1 | Permitir editar el nombre del perfil y mostrar la identidad del usuario con contadores de cuentas, movimientos y categorías. |

**Asistente de inteligencia artificial**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-IA-002 | P1 | Aceptar preguntas en lenguaje natural sobre datos financieros propios. |
| FR-IA-015 | P0 | El asistente será de solo consulta: podrá leer los datos del usuario, pero no creará, editará ni eliminará información financiera. |
| FR-IA-016 | P1 | Mantener la conversación en memoria del cliente y enviar hasta los últimos 10 mensajes como contexto. El servidor acepta como máximo 12 mensajes de hasta 4000 caracteres, no los persiste y recalcula las cifras para el período vigente. |

### 4.2 Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —acceso, cuentas, movimientos e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio y flujo de fondos coinciden con los movimientos registrados. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra el dashboard del mismo período y el asistente no modifica los datos. |
| Continuidad del asistente | El asistente interpreta preguntas de seguimiento con el historial reciente, sin persistirlo y manteniendo las cifras del período consultado. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados de carga y de error comprensibles. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |

Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:

| ID | Regla | Resultado esperado |
|---|---|---|
| CAL-001 | Patrimonio neto | Σ (saldo × cotización) de las cuentas, en la moneda de lectura. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período, convirtiendo cada flujo a la moneda de lectura. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
| CAL-010 | Tasa de ahorro | Ahorro del período / ingresos del período × 100, sobre los flujos convertidos a la moneda de lectura. Su variación se expresa en puntos porcentuales. |

**Requerimientos no funcionales**

**Seguridad y privacidad**

| ID | Requerimiento |
|---|---|
| NFR-SEG-001 | Autenticar al usuario y verificar en servidor la propiedad de cada recurso antes de leerlo o modificarlo. |
| NFR-SEG-002 | Validar entradas en límites, tipos, longitud y formato; rechazar campos inesperados. |
| NFR-SEG-003 | Almacenar contraseñas mediante un algoritmo de hash adaptativo y parámetros vigentes; nunca en texto plano. |
| NFR-SEG-007 | Mantener secretos y claves de proveedores solo en el servidor y fuera del repositorio. |

**Compatibilidad, localización y calidad**

| ID | Requerimiento |
|---|---|
| NFR-CAL-004 | Cubrir las fórmulas financieras con pruebas unitarias y los flujos P0 con pruebas de integración. |
| NFR-CAL-005 | La demostración utilizará datos ficticios y reproducibles, sin información financiera real. |

## 5. Pantallas de Usuario

| ID | Pantalla | Contenido y componentes previstos |
|---|---|---|
| SC-001 | Acceso | Registro e inicio de sesión; Card, Form, Input, Button y Alert. |
| SC-002 | Dashboard | Indicadores, gráficos, selector de moneda de lectura en el header, período compartido y accesos rápidos; Card, Chart y Skeleton. |
| SC-003 | Cuentas | Listado, saldo, transferencia desde el detalle y formularios; Data Table, Badge, Dialog y Dropdown Menu. |
| SC-004 | Movimientos | Listado agrupado por mes, búsqueda, filtros y alta o edición; Data Table, Date Picker, Select, Form y Alert Dialog. |
| SC-009 | Asistente IA | Conversación con historial en memoria, período y alcance del asistente; Scroll Area, Textarea, Button y Alert. |
| SC-010 | Configuración | Perfil, preferencia de tema, moneda principal (cuando hay más de una moneda) y sesión; Form, Segmented Control y Alert Dialog. |
| SC-011 | Categorías | Listado con uso del período, alta y edición; Tabs, Badge, Progress, Dialog y Alert Dialog. |

## 6. Glosario

### 6.1 Glosario de Términos

| Término | Descripción |
|---|---|
| Cuenta | Contenedor de fondos del usuario con un saldo determinado. |
| Movimiento | Ingreso, gasto o transferencia registrado sobre una o más cuentas del usuario. |
| Categoría | Clasificación de los movimientos; puede ser del sistema (global y de solo lectura) o propia del usuario. |
| Categoría del sistema | Categoría global definida por la aplicación y compartida por todos los usuarios; no se edita ni se elimina. |
| Categoría propia | Categoría creada por un usuario, editable y eliminable solo por su propietario. |
| Transferencia | Movimiento que descuenta una cuenta de origen y acredita una de destino sin alterar ingresos ni gastos. |
| Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, expresado en la moneda de lectura. |
| Flujo de fondos | Resultado de ingresos menos gastos dentro de un período. |
| Preferencias locales | Configuración de la interfaz (tema) guardada en el navegador del usuario. |
| Historial de conversación | Turnos recientes que el cliente reenvía al asistente para interpretar preguntas de seguimiento; no se almacenan en el servidor. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

## 7. Minutas de reunión

**Sin minutas registradas**

No se registraron minutas de reunión para la versión 0.3 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.
