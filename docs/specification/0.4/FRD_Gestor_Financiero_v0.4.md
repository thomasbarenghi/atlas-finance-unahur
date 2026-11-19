# Documentación de Requerimientos Funcionales — Gestor Financiero Personal

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
| 0.2 | 02/10/2026 | Barenghi, Thomas | Se agregan 5 requerimientos funcionales, 1 no funcional y 1 regla de cálculo; se modifican requerimientos de dashboard, asistente y cálculo, y se actualiza la regla de negocio de patrimonio neto. |
| 0.3 | 30/10/2026 | Barenghi, Thomas | Se consolida el alcance en los flujos de acceso, cuentas, movimientos, panel y asistente, y se alinean los requerimientos, reglas, entidades, pantallas y datos de demostración con la versión vigente. |
| 0.4 | 31/10/2026 | Barenghi, Thomas | Se adapta la redacción de los 20 requerimientos funcionales al formato estándar [Actor/Sistema] + debe + [acción] + [condición]. No se modifican los identificadores ni el alcance funcional. |

## 2. Alcance

### 2.1 Descripción del Proyecto/Objetivos

Desarrollar una aplicación web para organizar las finanzas personales. Permitirá registrar cuentas y movimientos, clasificarlos con categorías y ver la evolución del patrimonio y del flujo de fondos en un solo lugar. Los cálculos serán trazables y el asistente de IA será de solo consulta, disponible con sesión iniciada.

Los objetivos específicos son consolidar las cuentas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías; mostrar gráficos de patrimonio y flujo de fondos; ofrecer un asistente de IA explicativo, de solo consulta y disponible con sesión iniciada; y proteger la privacidad con autenticación, autorización por propietario y minimización de datos.

### 2.2 Justificación

Muchas personas administran su economía con planillas, aplicaciones aisladas o registros parciales, y les cuesta ver su patrimonio total o controlar sus gastos. Centralizar esa información en una solución académica permite mostrar una foto financiera clara, mantener la trazabilidad de los cálculos y hacer consultas en lenguaje natural, sin superar los permisos del usuario y sin modificar sus datos.

### 2.3 Hipótesis

Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos y favorecerá una mejor organización de las finanzas del usuario.

### 2.4 Restricciones

La solución será una aplicación web con React, componentes shadcn/ui y una API NestJS sobre PostgreSQL. Está pensada como un proyecto universitario demostrable y extensible. El proveedor de IA es DeepSeek (compatible con OpenAI) y se documenta en `docs/architecture/backend.md` §9. No se guardarán credenciales bancarias ni claves privadas de billeteras. La precisión del asistente depende de los datos que cargue el usuario.

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

La aplicación opera con **multimoneda** (cada cuenta declara su moneda y el dashboard permite leer los valores en la moneda principal o en cualquier moneda del catálogo, con cotizaciones provistas por la API), cinco categorías fijas del sistema y categorías propias que cada usuario puede crear, editar y eliminar.

La versión incorpora búsqueda y filtros de movimientos; gestión de categorías propias; preferencia local de tema; granularidad diaria o mensual del patrimonio y semanal o mensual de los flujos según la duración del rango; y continuidad de la conversación del asistente en memoria del cliente.

El período de análisis (Este mes, Últimos 30 días, 6 meses y 12 meses) es compartido por el panel, los movimientos, las categorías y el asistente.

La búsqueda y los filtros operan sobre los movimientos cargados en la vista (hasta 100 registros). El uso de categorías se calcula sobre esos movimientos. El dashboard y los cálculos se resuelven en el servidor con el conjunto completo de movimientos del período.

Quedan fuera de alcance la conexión con bancos o billeteras, la ejecución de pagos reales y el asesoramiento financiero, legal o impositivo: la aplicación se limita a organizar y explicar la información que carga el usuario.

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
| Usuario | Tres usuarios ficticios sin datos personales reales: uno con dataset completo, uno sin movimientos y uno mínimo para probar el aislamiento. |
| Cuentas | Cuatro cuentas: tres en ARS y una en USD. |
| Monedas | ARS como moneda principal y USD; cotizaciones globales provistas por la API. |
| Movimientos | Tres meses de ingresos, gastos y transferencias, incluida una transferencia multimoneda cuando la API de cotizaciones está disponible. |
| Categorías | Cinco categorías fijas del sistema; el seed de demo crea además la categoría propia “Otros” (tipo ingreso) para ejercitar categorías propias. |
| Consultas de IA | Sugerencias de consulta en la UI de Asistente para comparar gastos y evolución patrimonial (no se persisten). |

## 3. Información de Requerimientos de Negocio

### 3.1 Reglas de Negocio

| Regla | Descripción |
|---|---|
| RN-001 | Hay una moneda principal y una moneda de lectura; los valores se convierten con las cotizaciones globales de la API. Cambiar la moneda de lectura no altera los registros. |
| RN-002 | Las cotizaciones son globales y las provee la API; no se persisten y el usuario no las crea ni las edita. |

> Las reglas de propiedad, transferencias, cuentas, categorías y asistente se detallan en los `FR-*` y `HU-*` correspondientes para evitar duplicación.

**Entidades principales**

| Entidad | Atributos mínimos | Relaciones clave |
|---|---|---|
| Usuario | id, nombre, email | Propietario de todas las entidades financieras. |
| Cuenta | id, tipo, nombre, moneda, saldo inicial | Tiene movimientos; la moneda es fija si ya tiene movimientos. |
| Movimiento | id, tipo, monto, fecha, descripción | Pertenece a una cuenta y a una categoría (obligatoria en ingresos y gastos; nula en transferencias y en movimientos que quedaron sin categoría al eliminar una propia); transferencia vincula dos cuentas y guarda el monto de cada pata. |
| Cotización (externa) | moneda, tasa, fecha, fuente | Global, provista por la API; no se persiste ni la edita el usuario. |
| Categoría | id, nombre, tipo, color/icono, `user_id` opcional | Catálogo global (`user_id` nulo) o propia del usuario; clasifica movimientos. |

> La preferencia de tema se guarda en el navegador y no es una entidad del dominio financiero.

## 4. Requerimientos Funcionales

### 4.1 Historias de Usuario

| Historia | Descripción | Criterios de aceptación |
|---|---|---|
| HU-001 — Registrar un movimiento | Como usuario registrado, quiero cargar un ingreso o gasto para mantener actualizados mis saldos. | • Se validan los campos obligatorios y el monto debe ser mayor que cero.<br>• La API verifica la cuenta y la categoría.<br>• El movimiento actualiza el listado y el dashboard. |
| HU-002 — Transferir entre cuentas | Como usuario registrado, quiero mover dinero entre dos cuentas propias, incluso de monedas distintas, sin alterar mis ingresos o gastos. | • Origen y destino son distintos y propios.<br>• Se registran ambos montos; la cotización no se persiste.<br>• La transferencia no altera ingresos ni gastos. |
| HU-003 — Consultar al asistente | Como usuario registrado, quiero preguntar por mis gastos para entender mi comportamiento financiero. | • Requiere sesión válida.<br>• Usa solo datos propios y el contexto mínimo.<br>• Es de solo consulta.<br>• Puede recibir turnos recientes de la conversación. |
| HU-004 — Registrarme e iniciar sesión | Como visitante, quiero registrarme e iniciar sesión para acceder a mi información financiera. | • El registro valida los campos y el email único.<br>• El perfil permite actualizar identidad y contraseña.<br>• Al cerrar sesión se limpian las cookies y las pantallas financieras redirigen al acceso. |
| HU-005 — Gestionar mis cuentas | Como usuario registrado, quiero crear, editar y eliminar mis cuentas para reflejar dónde está mi dinero. | • Se registran nombre, tipo, moneda y saldo inicial.<br>• El saldo actual se calcula desde los movimientos.<br>• La moneda no se cambia si hay movimientos.<br>• Eliminar la cuenta elimina sus movimientos. |
| HU-006 — Ver el resumen del panel | Como usuario registrado, quiero ver mi patrimonio, ingresos, gastos y ahorro del período para entender mi situación de un vistazo. | • Muestra el patrimonio actual y los flujos del período.<br>• Incluye todas las monedas en la moneda de lectura. |
| HU-007 — Ver los gráficos del panel | Como usuario registrado, quiero ver la evolución del patrimonio, la comparación entre ingresos y gastos y la distribución de gastos por categoría. | • Muestra los tres gráficos del período.<br>• La granularidad se adapta a la duración del rango. |
| HU-008 — Corregir un movimiento | Como usuario registrado, quiero editar o eliminar un movimiento propio para arreglar errores de carga. | • Solo se editan o eliminan movimientos del usuario autenticado.<br>• El tipo no se modifica al editar.<br>• Los saldos, el panel y los cálculos se actualizan en consecuencia. |
| HU-009 — Elegir el período | Como usuario registrado, quiero elegir el período de análisis. | • El período (Este mes, Últimos 30 días, 6 meses, 12 meses) es compartido por panel, movimientos, categorías y asistente.<br>• El período seleccionado afecta a los indicadores y gráficos. |
| HU-010 — Límites del asistente | Como usuario registrado, quiero que el asistente solo consulte información. | • El asistente no crea, edita ni elimina información. |
| HU-011 — Proteger mis datos | Como usuario registrado, quiero que mi información quede separada de la de otros usuarios. | • El servidor verifica la pertenencia de cada recurso al usuario autenticado antes de leerlo o modificarlo. |
| HU-012 — Buscar y filtrar movimientos | Como usuario registrado, quiero encontrar mis movimientos sin recorrer toda la lista. | • Búsqueda por concepto, nota, categoría y monto.<br>• Filtros por tipo, cuenta, categoría, moneda y período. |
| HU-013 — Gestionar categorías propias | Como usuario registrado, quiero clasificar mis movimientos con mis propias categorías. | • Se pueden crear, editar y eliminar categorías propias.<br>• Las del sistema y las de otros usuarios son de solo lectura.<br>• Al eliminar una propia, sus movimientos quedan sin categoría. |
| HU-014 — Preferencias de la interfaz | Como usuario registrado, quiero elegir el tema de la interfaz. | • El tema puede ser claro, oscuro o automático.<br>• La preferencia se guarda localmente y no modifica datos financieros. |
| HU-015 — Conversación continua con el asistente | Como usuario registrado, quiero hacer preguntas de seguimiento sin repetir el contexto. | • El cliente envía los turnos recientes como historial.<br>• El servidor no los persiste.<br>• Las cifras corresponden al período vigente.<br>• El asistente es de solo consulta. |
| HU-016 — Cambiar mi moneda principal | Como usuario registrado, quiero elegir mi moneda principal para expresar mi patrimonio en la moneda que uso habitualmente. | • Se cambia en Ajustes y se persiste.<br>• El dashboard la usa como lectura por defecto.<br>• No modifica saldos ni movimientos. |
| HU-017 — Consultar el detalle de una cuenta | Como usuario registrado, quiero ver el detalle de una cuenta para entender su saldo y sus movimientos. | • Muestra datos, saldos, indicadores y movimientos de la cuenta.<br>• Permite editar y eliminar.<br>• Solo cuentas propias. |
| HU-018 — Consultar el historial de movimientos | Como usuario registrado, quiero consultar el historial de mis movimientos para revisar mi actividad. | • Historial paginado y agrupado por mes.<br>• Transferencias colapsadas en una fila.<br>• Cada movimiento abre su edición. |
| HU-019 — Exportar movimientos a CSV | Como usuario registrado, quiero exportar mis movimientos a CSV para analizarlos fuera de la aplicación. | • Se puede descargar un CSV con los movimientos cargados en la vista (hasta 100 registros).<br>• Si no hay movimientos, no se descarga. |
| HU-020 — Consultar el uso de las categorías | Como usuario registrado, quiero ver cuánto peso tiene cada categoría en el período para entender en qué se va mi dinero. | • Muestra cantidad de movimientos, monto y porcentaje por categoría, ordenado por uso.<br>• Los montos se convierten a la moneda de lectura elegida.<br>• El uso se calcula sobre los movimientos cargados en la vista (hasta 100 registros). |

**Requerimientos funcionales por módulo**

**Formato.** Cada FR se redacta en la columna `Requerimiento` con la plantilla `[Actor/Sistema] + debe + [acción/comportamiento] + [condición/resultado esperado]`. Los identificadores y el alcance de cada FR se conservan respecto de la versión 0.3.

**Autenticación y perfil**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-AUT-001 | P0 | El visitante debe registrarse con nombre, correo electrónico, contraseña y moneda principal; la contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número. |
| FR-AUT-002 | P0 | El usuario registrado debe iniciar y cerrar sesión; al cerrar se limpian las cookies y el cliente descarta el estado de sesión. |

**Dashboard**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-DAS-001 | P0 | El sistema debe mostrar el patrimonio actual, ingresos, gastos y ahorro del período, en la moneda de lectura. |
| FR-DAS-002 | P0 | El sistema debe mostrar los gráficos del panel: evolución del patrimonio, ingresos frente a gastos y gastos por categoría, con granularidad adaptada al rango. |
| FR-DAS-003 | P0 | El usuario registrado debe cambiar el período de análisis (Este mes, Últimos 30 días, 6 meses y 12 meses) y la moneda de lectura del dashboard; el período es compartido por dashboard, movimientos, categorías y asistente. |

**Cuentas**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CUE-001 | P0 | El usuario registrado debe gestionar cuentas propias: crear, editar y eliminar con nombre, tipo, moneda, saldo inicial y observaciones; la moneda no se cambia si hay movimientos. |
| FR-CUE-002 | P0 | El sistema debe calcular el saldo actual a partir del saldo inicial y los movimientos asociados. |
| FR-CUE-003 | P0 | El sistema debe eliminar en cascada los movimientos en los que participa una cuenta eliminada, incluidas ambas patas de una transferencia. |
| FR-CUE-004 | P0 | El usuario registrado debe consultar el detalle de una cuenta propia: saldos, indicadores y movimientos; editar y eliminar. |

**Movimientos**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-TRX-001 | P0 | El usuario registrado debe gestionar movimientos de ingreso, gasto y transferencia: crear, editar y eliminar con monto, fecha, cuenta, categoría, descripción y notas; en transferencias, cuentas distintas y montos por pata; el tipo no se modifica al editar. |
| FR-TRX-002 | P1 | El usuario registrado debe buscar y filtrar movimientos por concepto, nota, categoría, monto, tipo, cuenta, moneda y período; los filtros se aplican en cliente sobre los movimientos cargados en la vista (hasta 100 registros). |
| FR-TRX-003 | P1 | El usuario registrado debe exportar a CSV los movimientos cargados en la vista (hasta 100 registros) para analizarlos fuera de la aplicación. |
| FR-TRX-004 | P0 | El sistema debe mostrar el historial de movimientos paginado y ordenado por fecha descendente, agrupado por mes sin subtotales; las transferencias se colapsan en una sola fila y cada movimiento permite abrir su edición. |

**Categorías**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CAT-001 | P0 | El usuario registrado debe gestionar categorías: cinco del sistema de solo lectura y propias editables y eliminables; al eliminar una propia, sus movimientos quedan sin categoría. |
| FR-CAT-002 | P1 | El sistema debe mostrar el uso de cada categoría en el período: cantidad de movimientos, monto y porcentaje, ordenado por uso; los montos se convierten a la moneda de lectura elegida. |

**Configuración y preferencias**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CFG-001 | P1 | El usuario registrado debe elegir el tema de la interfaz (claro, oscuro o automático) y persistirlo localmente. |
| FR-CFG-002 | P1 | El usuario registrado debe editar nombre, email y contraseña; el email es único y el cambio de contraseña requiere la actual y la misma política del registro; además, debe ver la identidad y los contadores del total del usuario. |
| FR-CFG-003 | P1 | El usuario registrado debe cambiar la moneda principal desde Ajustes cuando las cuentas usan más de una moneda; el cambio se persiste y el dashboard la usa como lectura por defecto sin modificar los datos financieros. |

**Asistente de inteligencia artificial**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-IA-001 | P1 | El asistente debe responder preguntas en lenguaje natural sobre datos financieros propios, en modo de solo consulta. |
| FR-IA-002 | P1 | El cliente debe mantener la conversación en memoria y enviar los turnos recientes; el servidor no los persiste. |

### 4.2 Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —acceso, cuentas, movimientos e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio y flujo de fondos coinciden con los movimientos registrados. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra el dashboard del mismo período y el asistente no modifica los datos. |
| Continuidad del asistente | El asistente interpreta preguntas de seguimiento con el historial reciente, sin persistirlo y manteniendo las cifras del período consultado. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados de carga y de error comprensibles. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |
| Formato y trazabilidad | Cada FR se redacta con la plantilla actor + debe + acción + condición y conserva su identificador y su trazabilidad en el BRD y el Plan de Pruebas. |

Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:

| ID | Regla | Resultado esperado |
|---|---|---|
| CAL-001 | Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, en la moneda de lectura. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período, convirtiendo cada flujo a la moneda de lectura. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
| CAL-004 | Tasa de ahorro | Ahorro del período / ingresos del período × 100, sobre los flujos convertidos a la moneda de lectura. Su variación se expresa en puntos porcentuales. |

El patrimonio neto (CAL-001) usa los saldos **actuales** de las cuentas. La tarjeta muestra la variación contra el inicio del período; el contrato también expone las variaciones de flujos contra el período anterior.

El asistente expresa sus cifras en la **moneda principal** del usuario, que es la moneda de lectura por defecto; si el cliente envía la moneda de lectura activa, el contexto se expresa en esa moneda. La verificación de la respuesta contra el dashboard se realiza leyendo el dashboard en la misma moneda que informa el asistente.

**Requerimientos no funcionales**

**Seguridad y privacidad**

| ID | Requerimiento |
|---|---|
| NFR-SEG-001 | Autenticar al usuario y verificar en servidor la propiedad de cada recurso; un ID aportado por el cliente no otorga autorización. |
| NFR-SEG-002 | Validar las entradas y renderizar las salidas de forma segura, sin HTML ejecutable; en el asistente, separar instrucciones y datos y validar la salida del modelo. |
| NFR-SEG-003 | Proteger credenciales, secretos y registros: hash adaptativo de contraseñas, claves solo en el servidor y logs sin datos sensibles. |
| NFR-SEG-004 | Mantener la sesión en cookies `HttpOnly` con expiración y renovación, y usar HTTPS con timeout y sin seguir redirecciones en las llamadas externas. |

**Compatibilidad, localización y calidad**

| ID | Requerimiento |
|---|---|
| NFR-CAL-001 | Cubrir las fórmulas financieras con pruebas unitarias y los flujos P0 con pruebas de integración. |
| NFR-CAL-002 | La demostración utilizará datos ficticios y reproducibles, sin información financiera real. |

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

> **Configuración en dos rutas:** `SC-006` se materializa en un hub de perfil (`/profile`: identidad, contadores y accesos) y en la pantalla de ajustes (`/settings`: nombre y correo, contraseña, tema, moneda principal y exportación CSV). Los requisitos `FR-CFG-001/002/003` se cubren entre ambas.

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
| Patrimonio neto | Σ (saldo × cotización) de las cuentas del usuario, expresado en la moneda de lectura; usa los saldos actuales. |
| Flujo de fondos | Resultado de ingresos menos gastos dentro de un período. |
| Moneda principal | Moneda elegida por el usuario; se usa por defecto para leer el patrimonio y los flujos. |
| Moneda de lectura | Moneda en la que se muestran los importes; por defecto, la principal. También se llama moneda de visualización. |
| Preferencias locales | Configuración de la interfaz (tema) guardada en el navegador del usuario. |
| Historial de conversación | Turnos recientes que el cliente reenvía al asistente para interpretar preguntas de seguimiento; no se almacenan en el servidor. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

## 7. Minutas de reunión

**Sin minutas registradas**

No se registraron minutas de reunión para la versión 0.4 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.
