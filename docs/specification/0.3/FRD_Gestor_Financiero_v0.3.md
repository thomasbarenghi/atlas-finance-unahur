# Documentación de Requerimientos Funcionales — Gestor Financiero Personal

| | |
|---|---|
| Versión | 0.3 |
| Fecha | 16/10/2026 |
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
| 0.3 | 16/10/2026 | Barenghi, Thomas | Se reduce el alcance del proyecto: se eliminan los módulos Presupuestos (FR-PRE), Activos, inversiones y deudas (FR-ACT), Cotizaciones de mercado (FR-MER) y Objetivos financieros (FR-OBJ). Se redefinen RN-002 y CAL-001 (patrimonio neto como suma de saldos de cuentas), se ajustan Dashboard, Reportes, entidades, pantallas y datos de demostración, y se conservan HU-001, HU-002 y HU-006. Se restringe el asistente de inteligencia artificial a solo consulta. Se quita la multimoneda (moneda única), el tema claro/oscuro, la entrada por voz y el archivado de cuentas (eliminación directa, sin restaurar); las categorías pasan a ser fijas y se elimina el tipo de cuenta tarjeta. Se eliminan además RN-007, RN-014, FR-AUT-003, FR-AUT-004, FR-TRX-006, el módulo Reportes y los requerimientos de IA FR-IA-001, FR-IA-008, FR-IA-009, FR-IA-010 y FR-IA-014, junto con el servicio de correo y la entidad Conversación IA. |

## 2. Alcance

### 2.1 Descripción del Proyecto/Objetivos

Desarrollar una aplicación web de gestión financiera personal que permita registrar cuentas y movimientos, organizarlos con categorías, y consultar la evolución del patrimonio y del flujo de fondos desde una vista consolidada, con cálculos trazables y un asistente de inteligencia artificial opcional de solo consulta.

Los objetivos específicos son consolidar las cuentas en una vista patrimonial; registrar ingresos, gastos y transferencias con categorías; mostrar gráficos de patrimonio y flujo de fondos; incorporar un asistente de inteligencia artificial opcional y explicativo, de solo consulta; y proteger la privacidad mediante autenticación, autorización por propietario y minimización de datos.

### 2.2 Justificación

Muchas personas administran su economía mediante hojas de cálculo, aplicaciones aisladas o registros parciales, lo que dificulta comprender el patrimonio total y controlar los gastos. Centralizar esa información en una solución académica permite mostrar una fotografía financiera comprensible, mantener trazabilidad de los cálculos y permitir consultas en lenguaje natural del asistente, sin exceder los permisos del usuario y sin que la interacción modifique sus datos.

### 2.3 Hipótesis

Centralizar la información financiera en una única aplicación con cálculos trazables mejorará la comprensión del patrimonio y del flujo de fondos y favorecerá una mejor organización de las finanzas del usuario.

### 2.4 Restricciones

La solución será una aplicación web con frontend React y componentes shadcn/ui, dimensionada para un proyecto universitario demostrable y extensible. No se almacenarán credenciales bancarias ni claves privadas de billeteras. El proveedor y modelo de inteligencia artificial, el backend y la infraestructura definitiva se definirán durante el diseño técnico, y la precisión del asistente dependerá de la calidad y actualidad de los datos cargados por el usuario.

Límite funcional: la aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero.

### 2.5 Dependencias

| Servicio | Datos intercambiados | Comportamiento ante falla |
|---|---|---|
| Proveedor de IA | Pregunta y contexto financiero mínimo ya calculado. | Informar indisponibilidad; no perder ni modificar datos financieros. |
| Base de datos relacional | Cuentas, movimientos y categorías del usuario. | Reintentar la operación e informar el error; no confirmar la acción como exitosa. |
| Plataforma de despliegue | Aplicación, configuración y secretos del entorno. | Conservar la versión anterior disponible si el despliegue falla. |

### 2.6 Alcance

El alcance de la versión inicial incluye registro, inicio y cierre de sesión con perfil; alta, edición y eliminación de cuentas manuales; ingresos, gastos y transferencias con categorías; dashboard con indicadores y gráficos; y un asistente de inteligencia artificial opcional de solo consulta.

La aplicación opera con una única moneda y un catálogo fijo de categorías definido por el sistema.

Quedan fuera de alcance la sincronización automática con bancos o billeteras, la ejecución de pagos u operaciones reales, la compraventa de activos y la conexión de billeteras digitales, el asesoramiento financiero, legal, impositivo o contable, la liquidación de impuestos y la conciliación bancaria avanzada, las cuentas familiares o multiusuario con permisos compartidos, las aplicaciones móviles nativas, las notificaciones push y las automatizaciones complejas, y una aplicación para iOS. También quedan fuera de alcance de esta versión la gestión de presupuestos, la valuación de activos e inversiones, la administración de deudas, los objetivos financieros y las cotizaciones de mercado.

**Actores**

| Actor | Descripción | Acciones principales |
|---|---|---|
| Visitante | Persona sin sesión iniciada. | Registrarse e iniciar sesión. |
| Usuario registrado | Propietario de sus datos financieros. | Gestionar cuentas y movimientos y usar el asistente si lo desea. |
| Proceso programado | Tarea interna del sistema. | Ejecutar mantenimientos controlados. |
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
| Cuentas | Tres cuentas. |
| Movimientos | Tres meses de ingresos, gastos y transferencias. |
| Categorías | Cinco categorías fijas definidas por el sistema. |
| Consultas de IA | Consultas preparadas para comparar gastos y evolución patrimonial. |

## 3. Información de Requerimientos de Negocio

### 3.1 Reglas de Negocio

| Regla | Descripción |
|---|---|
| RN-001 | Todo registro financiero tendrá un propietario único y solo será accesible dentro de su sesión autorizada. |
| RN-002 | Patrimonio neto = suma de los saldos netos de las cuentas del usuario. |
| RN-003 | Una transferencia no se contabiliza como ingreso ni como gasto. |
| RN-004 | Toda transferencia válida descuenta en la cuenta de origen y acredita en la cuenta de destino dentro de una única operación. |
| RN-012 | La inteligencia artificial será de solo consulta: podrá leer la información del propio usuario con los permisos de su sesión, pero nunca crearla, editarla ni eliminarla. |
| RN-013 | Los totales entregados al asistente serán calculados previamente por el sistema; la respuesta incluirá período y aclaración informativa. |

### 3.2 Casos de estudio

| Caso | Condición | Resultado esperado |
|---|---|---|
| Caso 1: Consulta al asistente con datos insuficientes | El usuario habilita el asistente y pregunta por la evolución de sus gastos en un período sin movimientos cargados. | El asistente responde que no hay información suficiente e indica el período consultado. |

**Entidades principales**

| Entidad | Atributos mínimos | Relaciones clave |
|---|---|---|
| Usuario | id, nombre, email | Propietario de todas las entidades financieras. |
| Cuenta | id, tipo, nombre, saldo inicial | Tiene movimientos. |
| Movimiento | id, tipo, monto, fecha, descripción | Pertenece a cuenta y categoría; transferencia vincula dos cuentas. |
| Categoría | id, nombre, tipo, color/icono | Catálogo fijo del sistema que clasifica movimientos. |

## 4. Requerimientos Funcionales

### 4.1 User Stories

| Historia | Descripción | Criterios de aceptación |
|---|---|---|
| HU-001 — Registrar un movimiento | Como usuario registrado, quiero cargar un ingreso o gasto para mantener actualizados mis saldos. | • Los campos obligatorios se validan antes de guardar.<br>• El monto debe ser mayor que cero.<br>• El movimiento aparece en el listado y actualiza saldo y dashboard.<br>• La API verifica que cuenta y categoría pertenezcan al usuario autenticado. |
| HU-002 — Transferir entre cuentas | Como usuario registrado, quiero mover dinero entre dos cuentas propias sin alterar mis ingresos o gastos. | • Origen y destino son diferentes y pertenecen al usuario.<br>• Se registran efectos opuestos por el mismo monto.<br>• La operación es atómica y no queda incompleta ante una falla.<br>• La transferencia se excluye del flujo de fondos consolidado. |
| HU-006 — Consultar al asistente | Como usuario registrado, quiero preguntar por mis gastos para entender mi comportamiento financiero. | • El asistente requiere sesión válida.<br>• Solo utiliza datos propios y el mínimo contexto necesario.<br>• La respuesta identifica período y categorías considerados.<br>• Los totales coinciden con el dashboard del mismo período.<br>• El asistente es de solo consulta: no crea, edita ni elimina datos, y declara insuficiencia si faltan datos. |

**Requerimientos funcionales por módulo**

Los identificadores de requerimiento son estables entre versiones y no se renumeran: por eso la numeración puede presentar huecos. Los números ausentes corresponden a requerimientos que quedaron fuera del alcance de esta versión.

**Autenticación y perfil**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-AUT-001 | P0 | El visitante podrá registrarse con nombre, correo electrónico y contraseña. |
| FR-AUT-002 | P0 | El usuario podrá iniciar y cerrar sesión; al cerrar se invalidará la sesión activa. |

**Dashboard**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-DAS-001 | P0 | Mostrar patrimonio neto, ingresos, gastos y ahorro del período seleccionado. |
| FR-DAS-002 | P0 | Mostrar la evolución temporal del patrimonio neto. |
| FR-DAS-003 | P0 | Comparar ingresos y gastos por mes. |
| FR-DAS-004 | P0 | Distribuir los gastos por categoría. |
| FR-DAS-007 | P1 | Permitir cambiar el período de visualización del dashboard. |
| FR-DAS-008 | P0 | Mostrar estados vacíos con una acción sugerida cuando falten datos. |

**Cuentas**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-CUE-001 | P0 | Crear cuentas de efectivo, bancaria manual, billetera u otra. |
| FR-CUE-002 | P0 | Registrar nombre, tipo, saldo inicial y observaciones opcionales. |
| FR-CUE-003 | P0 | Editar y eliminar cuentas propias. |
| FR-CUE-004 | P0 | Calcular el saldo actual a partir del saldo inicial y los movimientos asociados. |
| FR-CUE-005 | P0 | La eliminación de una cuenta elimina en cascada sus movimientos asociados. |

**Movimientos**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-TRX-001 | P0 | Crear movimientos de tipo ingreso, gasto o transferencia. |
| FR-TRX-002 | P0 | Registrar monto positivo, fecha, cuenta, categoría, descripción y notas opcionales. Las categorías provienen de un catálogo fijo del sistema y no pueden crearse, editarse ni eliminarse. |
| FR-TRX-003 | P0 | Editar o eliminar únicamente movimientos pertenecientes al usuario autenticado. |
| FR-TRX-004 | P0 | En una transferencia, las cuentas de origen y destino deberán ser diferentes. |
| FR-TRX-005 | P0 | Aplicar ambos lados de una transferencia de manera atómica; si uno falla, no se guarda ninguno. |

**Asistente de inteligencia artificial**

| ID | Prioridad | Requerimiento |
|---|---|---|
| FR-IA-002 | P1 | Aceptar preguntas en lenguaje natural sobre datos financieros propios. |
| FR-IA-011 | P1 | Responder que no hay información suficiente cuando los datos no permitan una conclusión verificable. |
| FR-IA-015 | P0 | El asistente será de solo consulta: podrá leer los datos del usuario, pero no creará, editará ni eliminará información financiera. |

### 4.2 Criterios de Bondad

| Criterio | Descripción |
|---|---|
| Demostración de extremo a extremo | Los flujos principales —acceso, cuentas, movimientos e inteligencia artificial— pueden demostrarse de extremo a extremo. |
| Consistencia de los cálculos | Los cálculos de saldo, patrimonio y flujo de fondos coinciden con los movimientos registrados. |
| Verificabilidad del asistente | Las respuestas del asistente pueden verificarse contra el dashboard del mismo período y el asistente no modifica los datos. |
| Usabilidad y respuesta de la interfaz | La interfaz funciona en escritorio y móvil y ofrece estados vacíos, de carga y de error comprensibles. |
| Evidencia de aceptación | Los requerimientos P0 cuentan con pruebas automatizadas o evidencia reproducible de aceptación. |
| Seguridad | No quedan vulnerabilidades críticas conocidas en autenticación, autorización, manejo de secretos o exposición de datos. |

Para cada período seleccionado, el sistema aplica las siguientes reglas de cálculo:

| ID | Regla | Resultado esperado |
|---|---|---|
| CAL-001 | Patrimonio neto | Σ saldos netos de las cuentas. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
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
| NFR-CAL-004 | Cubrir las fórmulas financieras con pruebas unitarias y los flujos P0 con pruebas de integración. |
| NFR-CAL-005 | La demostración utilizará datos ficticios y reproducibles, sin información financiera real. |
| NFR-CAL-006 | Empaquetar la aplicación como app Android con Capacitor, con sesión persistente y respeto de las safe-areas. |

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

### 6.1 Glosario de Términos

| Término | Descripción |
|---|---|
| Cuenta | Contenedor de fondos del usuario con un saldo determinado. |
| Movimiento | Ingreso, gasto o transferencia registrado sobre una o más cuentas del usuario. |
| Categoría | Clasificación fija y predefinida por el sistema para los movimientos. |
| Transferencia | Movimiento que descuenta una cuenta de origen y acredita una de destino sin alterar ingresos ni gastos. |
| Patrimonio neto | Suma de los saldos netos de las cuentas del usuario. |
| Flujo de fondos | Resultado de ingresos menos gastos dentro de un período. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

## 7. Minutas de reunión

**Sin minutas registradas**

No se registraron minutas de reunión para la versión 0.3 de este documento. Las decisiones de alcance y de reglas de negocio se documentan en el historial de cambios.
