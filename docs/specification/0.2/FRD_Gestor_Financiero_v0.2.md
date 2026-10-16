# Documentación de Requerimientos Funcionales — Gestor Financiero Personal

| | |
|---|---|
| Versión | 0.2 |
| Fecha | 02/10/2026 |
| Sponsor Operación | Secretaría Académica UNAHUR |
| Sponsor Organización | UNAHUR |
| Autor | Barenghi, Thomas |
| Release | Demostración académica 2026 |

## Tabla de contenidos

- 1 HISTORIAL DE CAMBIOS — 3
- 2 ALCANCE — 4
- 2. 1 Descripción de Proyecto/Objetivos — 4
- 2. 2 Justificación — 4
- 2. 3 Hipótesis — 4
- 2. 4 Restricciones — 4
- 2. 5 Dependencias — 5
- 2. 6 Alcance — 5
- 3 INFORMACIÓN DE REQUERIMIENTOS DE NEGOCIO — 7
- 3. 1 Reglas de Negocio — 7
- 3. 2 Casos de Estudio — 7
- 4 REQUERIMIENTOS FUNCIONALES — 9
- 4. 1 User Stories — 9
- 4. 2 Criterios de Bondad — 14
- 5 PANTALLAS DE USUARIO — 16
- 6 GLOSARIO — 16
- 6. 1 Glosario de Términos — 16
- 7 MINUTAS DE REUNIÓN — 17
- Sin minutas registradas — 17

## 1. Historial de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 0.1 | 04/09/2026 | Barenghi, Thomas | Versión inicial. Especificación funcional del Gestor Financiero Personal. |
| 0.2 | 02/10/2026 | Barenghi, Thomas | Se agregan 5 requerimientos funcionales, 1 no funcional y 1 regla de cálculo; se modifican FR-DAS-007, FR-IA-009 y CAL-001, y se actualiza la regla de negocio RN-002 (patrimonio neto). |

## 2. Alcance

### 2.1 Descripción del Proyecto/Objetivos

Desarrollar una aplicación web de gestión financiera personal que permita registrar cuentas y movimientos, administrar presupuestos, valuar activos y deudas, seguir inversiones y criptomonedas, definir objetivos y consultar reportes desde una vista consolidada, con cálculos trazables y un asistente de inteligencia artificial opcional cuyas acciones de escritura requieren confirmación explícita del usuario.

Los objetivos específicos son consolidar cuentas, activos, inversiones y deudas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías y filtros; comparar gastos reales con presupuestos mensuales y generar alertas; mostrar gráficos de patrimonio y flujo de fondos; consultar cotizaciones de un catálogo acotado de criptomonedas; registrar objetivos financieros y su porcentaje de avance; generar reportes consistentes con los datos de la aplicación; incorporar un asistente de inteligencia artificial opcional y explicativo, con acciones de escritura acotadas sujetas a confirmación explícita; y proteger la privacidad mediante autenticación, autorización por propietario y minimización de datos.

### 2.2 Justificación

Muchas personas administran su economía mediante hojas de cálculo, aplicaciones aisladas o registros parciales, lo que dificulta comprender el patrimonio total, controlar gastos, comparar el presupuesto con lo realmente consumido y evaluar el progreso hacia sus metas. Centralizar esa información en una solución académica permite mostrar una fotografía financiera comprensible, mantener trazabilidad de los cálculos y permitir consultas en lenguaje natural y acciones de escritura acotadas del asistente, siempre con confirmación explícita y sin exceder los permisos del usuario.

### 2.3 Hipótesis

Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos, permitirá ajustar el gasto a los presupuestos definidos y favorecerá el cumplimiento de los objetivos financieros del usuario.

### 2.4 Restricciones

La solución será una aplicación web con frontend React y componentes shadcn/ui, dimensionada para un proyecto universitario demostrable y extensible. No se almacenarán credenciales bancarias ni claves privadas de billeteras. El proveedor y modelo de inteligencia artificial, el backend y la infraestructura definitiva se definirán durante el diseño técnico, y la precisión del asistente dependerá de la calidad y actualidad de los datos cargados por el usuario.

Límite funcional: la aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero.

### 2.5 Dependencias

| Servicio | Datos intercambiados | Comportamiento ante falla |
|---|---|---|
| Proveedor de mercado | Símbolos, precios, monedas y fechas. | Informar la indisponibilidad sin bloquear el resto de la aplicación. |
| Proveedor de IA | Pregunta y contexto financiero mínimo ya calculado. | Informar indisponibilidad; no perder ni modificar datos financieros. |
| Base de datos relacional | Cuentas, movimientos, presupuestos, activos, posiciones y objetivos del usuario. | Reintentar la operación e informar el error; no confirmar la acción como exitosa. |
| Servicio de correo | Correo electrónico y token temporal de recuperación. | Informar que no pudo enviarse y permitir un reintento controlado. |
| Plataforma de despliegue | Aplicación, configuración y secretos del entorno. | Conservar la versión anterior disponible si el despliegue falla. |

### 2.6 Alcance

El alcance de la versión inicial incluye registro, inicio y cierre de sesión con perfil y moneda base; alta, edición y archivo de cuentas manuales; ingresos, gastos y transferencias con categorías y filtros; dashboard con indicadores y gráficos; presupuestos mensuales por categoría; activos físicos, inversiones y deudas con historial de valuaciones; cotizaciones de un catálogo limitado de criptomonedas; objetivos financieros; reportes; y un asistente de inteligencia artificial opcional, con acciones de escritura acotadas sujetas a confirmación explícita.

Quedan fuera de alcance la sincronización automática con bancos o billeteras, la ejecución de pagos u operaciones reales, la compraventa de activos y la conexión de billeteras digitales, el asesoramiento financiero, legal, impositivo o contable, la liquidación de impuestos y la conciliación bancaria avanzada, las cuentas familiares o multiusuario con permisos compartidos, las aplicaciones móviles nativas, notificaciones push y automatizaciones complejas, y una aplicación para iOS.

**Actores**

| Actor | Descripción | Acciones principales |
|---|---|---|
| Visitante | Persona sin sesión iniciada. | Registrarse, iniciar sesión y recuperar acceso. |
| Usuario registrado | Propietario de sus datos financieros. | Gestionar información, consultar reportes y usar IA si la habilita. |
| Proceso programado | Tarea interna del sistema. | Actualizar cotizaciones y ejecutar mantenimientos controlados. |
| Proveedor de mercado | Servicio externo de precios. | Entregar cotizaciones y metadatos. |
| Proveedor de IA | Servicio externo de lenguaje natural. | Generar una respuesta sobre contexto mínimo autorizado. |

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
| Cuentas | Tres cuentas en al menos dos monedas. |
| Movimientos | Tres meses de ingresos, gastos y transferencias. |
| Categorías y presupuestos | Cinco categorías y cuatro presupuestos mensuales. |
| Activos y deudas | Una propiedad, un vehículo, una deuda y su historial de valuaciones. |
| Criptomonedas | Dos posiciones de criptomonedas con cotizaciones identificadas. |
| Objetivos | Dos objetivos financieros con distinto grado de avance. |
| Consultas de IA | Consultas preparadas para comparar gastos, presupuesto y evolución patrimonial. |

## 3. Información de Requerimientos de Negocio

### 3.1 Reglas de Negocio

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

### 3.2 Casos de estudio

| Caso | Condición | Resultado esperado |
|---|---|---|
| Caso 1: Presupuesto excedido | El usuario registró tres meses de movimientos, definió cuatro presupuestos mensuales y superó el límite de la categoría Supermercado. | El presupuesto se muestra en estado excedido, el dashboard destaca la alerta y el reporte del período refleja el mismo consumo. |
| Caso 2: Consulta de cotizaciones de criptomonedas | El usuario consulta el catálogo de criptomonedas definido por el sistema y el proveedor de mercado responde con normalidad. | Cada cotización muestra símbolo, precio, moneda, proveedor y fecha de actualización. |
| Caso 3: Consulta al asistente con datos insuficientes | El usuario habilita el asistente y pregunta por la evolución de sus gastos en un período sin movimientos cargados. | El asistente responde que no hay información suficiente e indica el período consultado. |

**Entidades principales**

| Entidad | Atributos mínimos | Relaciones clave |
|---|---|---|
| Usuario | id, nombre, email, moneda base, preferencias | Propietario de todas las entidades financieras. |
| Cuenta | id, tipo, nombre, moneda, saldo inicial, estado | Tiene movimientos. |
| Movimiento | id, tipo, monto, moneda, fecha, descripción | Pertenece a cuenta y categoría; transferencia vincula dos cuentas. |
| Categoría | id, nombre, tipo, color/icono, estado | Clasifica movimientos y presupuestos. |
| Presupuesto | id, período, categoría, límite, moneda | Se calcula con movimientos de gasto. |
| Activo | id, tipo, nombre, moneda, estado | Tiene valuaciones; puede vincular deuda. |
| Valuación | id, valor, moneda, fecha, fuente | Pertenece a un activo. |
| Deuda | id, tipo, saldo, moneda, fecha | Puede estar vinculada con un activo. |
| Posición | id, símbolo, cantidad, moneda | Usa cotizaciones de mercado. |
| Cotización | símbolo, precio, moneda, proveedor, fecha | Valora posiciones compatibles. |
| Objetivo | id, nombre, meta, acumulado, moneda, fecha | Pertenece al usuario. |
| Conversación IA | id, fecha, pregunta, respuesta, metadatos | Pertenece al usuario y admite eliminación. |

## 4. Requerimientos Funcionales

### 4.1 User Stories

| Historia | Descripción | Criterios de aceptación |
|---|---|---|
| HU-001 — Registrar un movimiento | Como usuario registrado, quiero cargar un ingreso o gasto para mantener actualizados mis saldos. | • Los campos obligatorios se validan antes de guardar.<br>• El monto debe ser mayor que cero.<br>• El movimiento aparece en el listado y actualiza saldo, dashboard y reportes.<br>• La API verifica que cuenta y categoría pertenezcan al usuario autenticado. |
| HU-002 — Transferir entre cuentas | Como usuario registrado, quiero mover dinero entre dos cuentas propias sin alterar mis ingresos o gastos. | • Origen y destino son diferentes y pertenecen al usuario.<br>• Se registran efectos opuestos por el mismo monto.<br>• La operación es atómica y no queda incompleta ante una falla.<br>• La transferencia se excluye del flujo de fondos consolidado. |
| HU-003 — Controlar un presupuesto | Como usuario registrado, quiero definir un límite mensual por categoría para controlar mis gastos. | • Se muestran límite, gasto, disponible y porcentaje.<br>• Un nuevo gasto válido actualiza automáticamente el consumo.<br>• Al alcanzar el umbral de advertencia cambia el estado visible.<br>• Si el gasto supera el límite, el presupuesto queda excedido. |
| HU-004 — Registrar un activo | Como usuario registrado, quiero cargar una propiedad o vehículo para incluirlo en mi patrimonio. | • Se registran tipo, moneda, valor y fecha de valuación.<br>• La valuación más reciente participa del patrimonio neto.<br>• Una actualización agrega historial y no elimina la valuación anterior.<br>• El activo solo puede ser consultado o modificado por su propietario. |
| HU-005 — Consultar una criptomoneda | Como usuario registrado, quiero conocer el valor estimado de mi posición usando una cotización identificable. | • Se muestran símbolo, precio, moneda, proveedor y fecha de actualización.<br>• La cotización consultada pertenece al catálogo definido por el sistema.<br>• No se ofrece comprar, vender ni conectar una billetera. |
| HU-006 — Consultar al asistente | Como usuario registrado, quiero preguntar por mis gastos para entender mi comportamiento financiero. | • El asistente requiere sesión válida y activación previa.<br>• Solo utiliza datos propios y el mínimo contexto necesario.<br>• La respuesta identifica período y categorías considerados.<br>• Los totales coinciden con el reporte del mismo período.<br>• La interacción puede ejecutar acciones acotadas de creación/edición sobre datos propios con los mismos permisos del usuario, y declara insuficiencia si faltan datos. |

**Requerimientos funcionales por módulo**

Los identificadores de requerimiento son estables entre versiones y no se renumeran: por eso la numeración puede presentar huecos. Los números ausentes corresponden a requerimientos que quedaron fuera del alcance de esta versión.

**Autenticación y perfil**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-AUT-001 | P0 | El visitante podrá registrarse con nombre, correo electrónico y contraseña. |
| FR-AUT-002 | P0 | El usuario podrá iniciar y cerrar sesión; al cerrar se invalidará la sesión activa. |
| FR-AUT-003 | P1 | El usuario podrá solicitar recuperación de contraseña mediante un enlace de uso limitado. |
| FR-AUT-004 | P0 | Toda pantalla financiera requerirá una sesión válida y el servidor validará la autorización en cada operación. |
| FR-AUT-005 | P0 | El usuario podrá elegir una moneda base para consolidación y reportes. |
| FR-AUT-006 | P1 | El usuario podrá seleccionar tema claro, oscuro o automático. |

**Dashboard**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-DAS-001 | P0 | Mostrar patrimonio neto, ingresos, gastos y ahorro del período seleccionado. |
| FR-DAS-002 | P0 | Mostrar la evolución temporal del patrimonio neto. |
| FR-DAS-003 | P0 | Comparar ingresos y gastos por mes. |
| FR-DAS-004 | P0 | Distribuir los gastos por categoría. |
| FR-DAS-005 | P0 | Mostrar la composición de activos por tipo. |
| FR-DAS-006 | P0 | Mostrar presupuestos cercanos al límite o excedidos. |
| FR-DAS-007 | P1 | Permitir cambiar el período de visualización del dashboard y los reportes. La moneda de visualización es la moneda base configurada por el usuario y se modifica en Configuración; no existe un selector de moneda por vista. |
| FR-DAS-008 | P0 | Mostrar estados vacíos con una acción sugerida cuando falten datos. |

**Cuentas**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CUE-001 | P0 | Crear cuentas de efectivo, bancaria manual, billetera, tarjeta u otra. |
| FR-CUE-002 | P0 | Registrar nombre, tipo, moneda, saldo inicial y observaciones opcionales. |
| FR-CUE-003 | P0 | Editar y archivar cuentas propias. |
| FR-CUE-004 | P0 | Calcular el saldo actual a partir del saldo inicial y los movimientos asociados. |
| FR-CUE-005 | P0 | Una cuenta archivada conservará su historial y no admitirá nuevos movimientos. |
| FR-CUE-006 | P1 | Restaurar una cuenta archivada, conservando su historial y su disponibilidad para nuevos movimientos. |

**Movimientos**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-TRX-001 | P0 | Crear movimientos de tipo ingreso, gasto o transferencia. |
| FR-TRX-002 | P0 | Registrar monto positivo, moneda, fecha, cuenta, categoría, descripción y notas opcionales. |
| FR-TRX-003 | P0 | Editar o eliminar únicamente movimientos pertenecientes al usuario autenticado. |
| FR-TRX-004 | P0 | En una transferencia, las cuentas de origen y destino deberán ser diferentes. |
| FR-TRX-005 | P0 | Aplicar ambos lados de una transferencia de manera atómica; si uno falla, no se guarda ninguno. |
| FR-TRX-006 | P0 | Filtrar por rango de fechas, tipo, cuenta y categoría. |
| FR-TRX-008 | P1 | Crear, editar y archivar categorías personalizadas. |

**Presupuestos**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-PRE-001 | P0 | Crear un presupuesto mensual por categoría y moneda. |
| FR-PRE-002 | P0 | Mostrar límite, gasto acumulado, disponible y porcentaje consumido. |
| FR-PRE-003 | P0 | Mostrar estados disponible, advertencia y excedido. |
| FR-PRE-004 | P0 | Incluir solo gastos de la categoría y del período correspondiente. |
| FR-PRE-006 | P0 | Editar o eliminar presupuestos propios con confirmación. |

**Activos, inversiones y deudas**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-ACT-001 | P0 | Crear activos de tipo propiedad, vehículo, efectivo, inversión, criptoactivo u otro. |
| FR-ACT-002 | P0 | Crear deudas de tipo préstamo, hipoteca, tarjeta u otra. |
| FR-ACT-003 | P0 | Registrar nombre, tipo, moneda, valor, fecha de valuación y notas. |
| FR-ACT-004 | P0 | Mantener historial de valuaciones manuales sin sobrescribir las anteriores. |
| FR-ACT-007 | P0 | Editar y archivar activos, posiciones y deudas propias. |
| FR-ACT-008 | P1 | Vincular una deuda con un activo, por ejemplo una hipoteca con una propiedad. |

**Cotizaciones de mercado**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-MER-001 | P0 | Consultar precios para un catálogo limitado de criptomonedas definido por el sistema. |
| FR-MER-002 | P0 | Guardar símbolo, precio, moneda, proveedor y fecha de actualización. |

**Objetivos financieros**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-OBJ-001 | P1 | Crear un objetivo con nombre, monto meta, moneda y fecha objetivo opcional. |
| FR-OBJ-002 | P1 | Calcular y mostrar el porcentaje de avance. |
| FR-OBJ-003 | P1 | Actualizar el monto acumulado de manera manual. |
| FR-OBJ-004 | P1 | Mostrar estados pendiente, en curso, alcanzado o vencido. |
| FR-OBJ-005 | P1 | Vincular un objetivo con una cuenta de origen donde se acumula el dinero. El objetivo no admite movimientos propios ni se suma al patrimonio neto. |

**Reportes**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-REP-001 | P0 | Generar un resumen financiero para un período seleccionado. |
| FR-REP-002 | P0 | Desglosar ingresos y gastos por categoría. |
| FR-REP-003 | P0 | Mostrar evolución del patrimonio neto. |
| FR-REP-004 | P0 | Mostrar cumplimiento de presupuestos. |

**Asistente de inteligencia artificial**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-IA-001 | P1 | Permitir habilitar o deshabilitar el asistente de forma explícita. |
| FR-IA-002 | P1 | Aceptar preguntas en lenguaje natural sobre datos financieros propios. |
| FR-IA-008 | P1 | Mostrar que la respuesta es informativa y no constituye asesoramiento financiero. |
| FR-IA-009 | P1 | Permitir consultar y eliminar el historial de conversaciones propias (ver FR-IA-014). |
| FR-IA-010 | P0 | Tratar descripciones, notas y contenidos del usuario como datos no confiables, nunca como instrucciones para el modelo. |
| FR-IA-011 | P1 | Responder que no hay información suficiente cuando los datos no permitan una conclusión verificable. |
| FR-IA-012 | P0 | Toda acción de escritura propuesta por el asistente requerirá confirmación explícita del usuario. La propuesta se conserva con token de un solo uso y vencimiento, y respeta un orden dentro de un plan; no se podrá confirmar un paso cuyo predecesor no esté resuelto. La ejecución queda registrada. |
| FR-IA-013 | P2 | Permitir la entrada por voz al asistente mediante transcripción a texto en las plataformas compatibles. |
| FR-IA-014 | P1 | Conservar el historial de conversaciones localmente y, cuando el asistente esté en modo en vivo, también en el servidor; el usuario podrá eliminarlo. |

### 4.2 Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —cuentas, movimientos, presupuestos, activos, reportes e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio, flujo de fondos y presupuestos son consistentes entre dashboard y reportes. |
| Trazabilidad de las cotizaciones | Cada cotización muestra proveedor, moneda y fecha de actualización, de modo que su vigencia pueda verificarse. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra un reporte del mismo período; toda escritura que proponga requiere confirmación explícita y queda registrada. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados vacíos, de carga y de error comprensibles. |
| Evidencia de aceptación | Los requerimientos P0 cuentan con pruebas automatizadas o evidencia reproducible de aceptación. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |

Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:

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
| NFR-CAL-002 | Ofrecer temas claro y oscuro sin pérdida de contraste o información. |
| NFR-CAL-004 | Cubrir las fórmulas financieras con pruebas unitarias y los flujos P0 con pruebas de integración. |
| NFR-CAL-005 | La demostración utilizará datos ficticios y reproducibles, sin información financiera real. |
| NFR-CAL-006 | Empaquetar la aplicación como app Android con Capacitor, con sesión persistente y respeto de las safe-areas. |

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

### 6.1 Glosario de Términos

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

## 7. Minutas de reunión

**Sin minutas registradas**

No se registraron minutas de reunión para la versión 0.1 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.
