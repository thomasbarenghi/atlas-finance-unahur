![Identidad visual de UNAHUR][image1]

# **Documento de Requerimientos Funcionales**

**Gestor Financiero Personal**

| Versión | 0.1 |
| :---- | :---- |
| **Fecha** | 04/09/2026 |
| **Estado** | Borrador inicial |
| **Tipo** | Proyecto universitario |
| **Autores** | Thomas Barenghi |
| **Documento relacionado** | BRD versión 0.1 |

# **Tabla de contenidos**

La estructura siguiente resume el alcance de esta versión inicial. Los títulos usan estilos de encabezado para facilitar la navegación y la actualización futura del índice.

| Sección | Contenido |
| :---- | :---- |
| 1 | Propósito |
| 2 | Descripción general |
| 3 | Actores |
| 4 | Prioridades |
| 5 | Requerimientos funcionales |
| 6 | Reglas de cálculo |
| 7 | Historias de usuario y aceptación |
| 8 | Pantallas |
| 9 | Requerimientos no funcionales |
| 10 | Entidades principales |
| 11 | Dependencias externas |
| 12 | Datos de demostración |
| 13 | Glosario |

# **1\. Propósito**

Este documento define el comportamiento esperado del Gestor Financiero Personal para su versión inicial. Detalla funciones, reglas de cálculo, actores, historias de usuario, pantallas, integraciones y requerimientos no funcionales que permitirán diseñar, implementar y aceptar la solución.

# **2\. Descripción general**

El producto será una aplicación web con frontend React y componentes shadcn/ui. Consumirá una API autenticada y una base de datos relacional. Las integraciones con mercado e inteligencia artificial se realizarán exclusivamente desde el backend. El lenguaje y framework del backend se definirán en el diseño técnico.

| Límite funcional. La aplicación organiza y explica información cargada por el usuario. No se conecta a bancos, no ejecuta pagos ni operaciones de inversión y no brinda asesoramiento financiero. |
| :---- |

# **3\. Actores**

| Actor | Descripción | Acciones principales |
| :---- | :---- | :---- |
| Visitante | Persona sin sesión iniciada. | Registrarse, iniciar sesión y recuperar acceso. |
| Usuario registrado | Propietario de sus datos financieros. | Gestionar información, consultar reportes y usar IA si la habilita. |
| Proceso programado | Tarea interna del sistema. | Actualizar cotizaciones y ejecutar mantenimientos controlados. |
| Proveedor de mercado | Servicio externo de precios. | Entregar cotizaciones y metadatos. |
| Proveedor de IA | Servicio externo de lenguaje natural. | Generar una respuesta sobre contexto mínimo autorizado. |

# **4\. Prioridades**

| Nivel | Criterio |
| :---- | :---- |
| P0 — esencial | Necesario para una demostración completa y para cumplir el objetivo principal. |
| P1 — importante | Aporta valor significativo, pero puede simplificarse si el cronograma lo exige. |
| P2 — futuro | Queda documentado para una iteración posterior; no condiciona la aceptación inicial. |

# **5\. Requerimientos funcionales**

## **5.1. Autenticación y perfil**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-AUT-001 | P0 | El visitante podrá registrarse con nombre, correo electrónico y contraseña. |
| FR-AUT-002 | P0 | El usuario podrá iniciar y cerrar sesión; al cerrar se invalidará la sesión activa. |
| FR-AUT-003 | P1 | El usuario podrá solicitar recuperación de contraseña mediante un enlace de uso limitado. |
| FR-AUT-004 | P0 | Toda pantalla financiera requerirá una sesión válida y el servidor validará la autorización en cada operación. |
| FR-AUT-005 | P0 | El usuario podrá elegir una moneda base para consolidación y reportes. |
| FR-AUT-006 | P1 | El usuario podrá seleccionar tema claro, oscuro o automático. |

## **5.2. Dashboard**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-DAS-001 | P0 | Mostrar patrimonio neto, ingresos, gastos y ahorro del período seleccionado. |
| FR-DAS-002 | P0 | Mostrar la evolución temporal del patrimonio neto. |
| FR-DAS-003 | P0 | Comparar ingresos y gastos por mes. |
| FR-DAS-004 | P0 | Distribuir los gastos por categoría. |
| FR-DAS-005 | P0 | Mostrar la composición de activos por tipo. |
| FR-DAS-006 | P0 | Mostrar presupuestos cercanos al límite o excedidos. |
| FR-DAS-007 | P1 | Permitir cambiar período y moneda de visualización cuando existan tasas disponibles. |
| FR-DAS-008 | P0 | Mostrar estados vacíos con una acción sugerida cuando falten datos. |

## **5.3. Cuentas**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-CUE-001 | P0 | Crear cuentas de efectivo, bancaria manual, billetera, tarjeta u otra. |
| FR-CUE-002 | P0 | Registrar nombre, tipo, moneda, saldo inicial y observaciones opcionales. |
| FR-CUE-003 | P0 | Editar y archivar cuentas propias. |
| FR-CUE-004 | P0 | Calcular el saldo actual a partir del saldo inicial y los movimientos asociados. |
| FR-CUE-005 | P0 | Una cuenta archivada conservará su historial y no admitirá nuevos movimientos. |

## **5.4. Movimientos**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-TRX-001 | P0 | Crear movimientos de tipo ingreso, gasto o transferencia. |
| FR-TRX-002 | P0 | Registrar monto positivo, moneda, fecha, cuenta, categoría, descripción y notas opcionales. |
| FR-TRX-003 | P0 | Editar o eliminar únicamente movimientos pertenecientes al usuario autenticado. |
| FR-TRX-004 | P0 | En una transferencia, las cuentas de origen y destino deberán ser diferentes. |
| FR-TRX-005 | P0 | Aplicar ambos lados de una transferencia de manera atómica; si uno falla, no se guarda ninguno. |
| FR-TRX-006 | P0 | Filtrar por rango de fechas, tipo, cuenta y categoría. |
| FR-TRX-007 | P0 | Buscar por descripción o notas propias. |
| FR-TRX-008 | P1 | Crear, editar y archivar categorías personalizadas. |
| FR-TRX-009 | P2 | Importar movimientos desde un CSV validado con vista previa. |
| FR-TRX-010 | P2 | Definir movimientos recurrentes sujetos a confirmación o ejecución programada. |

## **5.5. Presupuestos**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-PRE-001 | P0 | Crear un presupuesto mensual por categoría y moneda. |
| FR-PRE-002 | P0 | Mostrar límite, gasto acumulado, disponible y porcentaje consumido. |
| FR-PRE-003 | P0 | Mostrar estados disponible, advertencia y excedido. |
| FR-PRE-004 | P0 | Incluir solo gastos de la categoría y del período correspondiente. |
| FR-PRE-005 | P1 | Copiar presupuestos del mes anterior para un nuevo período. |
| FR-PRE-006 | P0 | Editar o eliminar presupuestos propios con confirmación. |

## **5.6. Activos, inversiones y deudas**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-ACT-001 | P0 | Crear activos de tipo propiedad, vehículo, efectivo, inversión, criptoactivo u otro. |
| FR-ACT-002 | P0 | Crear deudas de tipo préstamo, hipoteca, tarjeta u otra. |
| FR-ACT-003 | P0 | Registrar nombre, tipo, moneda, valor, fecha de valuación y notas. |
| FR-ACT-004 | P0 | Mantener historial de valuaciones manuales sin sobrescribir las anteriores. |
| FR-ACT-005 | P0 | Para una posición, registrar instrumento, cantidad, costo promedio y moneda. |
| FR-ACT-006 | P0 | Calcular valor actual y ganancia o pérdida nominal cuando exista precio vigente. |
| FR-ACT-007 | P0 | Editar y archivar activos, posiciones y deudas propias. |
| FR-ACT-008 | P1 | Vincular una deuda con un activo, por ejemplo una hipoteca con una propiedad. |

## **5.7. Cotizaciones de mercado**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-MER-001 | P0 | Consultar precios para un catálogo limitado de criptomonedas definido por el sistema. |
| FR-MER-002 | P0 | Guardar símbolo, precio, moneda, proveedor y fecha de actualización. |
| FR-MER-003 | P0 | Aplicar caché y límites de frecuencia para evitar consultas innecesarias. |
| FR-MER-004 | P0 | Ante una falla externa, conservar el último precio válido sin inventar uno nuevo. |
| FR-MER-005 | P0 | Marcar visualmente una cotización que supere el umbral de antigüedad configurado. |
| FR-MER-006 | P1 | Mostrar variación de 24 horas cuando el proveedor la informe. |

## **5.8. Objetivos financieros**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-OBJ-001 | P1 | Crear un objetivo con nombre, monto meta, moneda y fecha objetivo opcional. |
| FR-OBJ-002 | P1 | Calcular y mostrar el porcentaje de avance. |
| FR-OBJ-003 | P1 | Actualizar el monto acumulado de manera manual. |
| FR-OBJ-004 | P1 | Mostrar estados pendiente, en curso, alcanzado o vencido. |

## **5.9. Reportes y exportación**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-REP-001 | P0 | Generar un resumen financiero para un período seleccionado. |
| FR-REP-002 | P0 | Desglosar ingresos y gastos por categoría. |
| FR-REP-003 | P0 | Mostrar evolución del patrimonio neto. |
| FR-REP-004 | P0 | Mostrar cumplimiento de presupuestos. |
| FR-REP-005 | P1 | Mostrar rendimiento nominal de inversiones con datos suficientes. |
| FR-REP-006 | P0 | Exportar movimientos o resumen en CSV con filtros aplicados. |
| FR-REP-007 | P2 | Ofrecer una versión imprimible o exportable a PDF. |

## **5.10. Asistente de inteligencia artificial**

| ID | Prioridad | Requerimiento funcional |
| :---- | :---- | :---- |
| FR-IA-001 | P1 | Permitir habilitar o deshabilitar el asistente de forma explícita. |
| FR-IA-002 | P1 | Aceptar preguntas en lenguaje natural sobre datos financieros propios. |
| FR-IA-003 | P1 | Enviar al proveedor solo los datos mínimos necesarios para responder la consulta. |
| FR-IA-004 | P1 | Calcular totales y métricas en el sistema antes de construir el contexto para el modelo. |
| FR-IA-005 | P1 | Indicar período, moneda y datos considerados en cada respuesta. |
| FR-IA-006 | P0 | Impedir que el asistente cree, edite o elimine información o ejecute operaciones. |
| FR-IA-007 | P0 | Impedir cualquier acceso a información perteneciente a otro usuario. |
| FR-IA-008 | P1 | Mostrar que la respuesta es informativa y no constituye asesoramiento financiero. |
| FR-IA-009 | P1 | Permitir consultar y eliminar el historial de conversaciones propias. |
| FR-IA-010 | P0 | Tratar descripciones, notas y contenidos del usuario como datos no confiables, nunca como instrucciones para el modelo. |
| FR-IA-011 | P1 | Responder que no hay información suficiente cuando los datos no permitan una conclusión verificable. |

# **6\. Reglas de cálculo**

| ID | Regla | Resultado esperado |
| :---- | :---- | :---- |
| CAL-001 | Patrimonio neto | Σ activos en moneda base − Σ deudas en moneda base. |
| CAL-002 | Flujo de fondos | Σ ingresos − Σ gastos del período. |
| CAL-003 | Transferencias | Se excluyen de ingresos y gastos consolidados. |
| CAL-004 | Consumo de presupuesto | Gasto del período / límite × 100; si el límite es cero, no se divide. |
| CAL-005 | Valor de posición | Cantidad × último precio válido en la moneda del instrumento. |
| CAL-006 | Ganancia o pérdida nominal | Valor actual − costo acumulado. |
| CAL-007 | Progreso de objetivo | Monto acumulado / monto meta × 100, limitado visualmente a un mínimo de 0 %. |
| CAL-008 | Conversión de moneda | Importe × última tasa válida aplicable a la fecha de cálculo. |
| CAL-009 | Trazabilidad cambiaria | Cada conversión conserva tasa, par de monedas, proveedor y fecha utilizados. |

# **7\. Historias de usuario y criterios de aceptación**

## **HU-001 — Registrar un movimiento**

Como usuario registrado, quiero cargar un ingreso o gasto para mantener actualizados mis saldos.

**Criterios de aceptación**

**•** Los campos obligatorios se validan antes de guardar.

**•** El monto debe ser mayor que cero.

**•** El movimiento aparece en el listado y actualiza saldo, dashboard y reportes.

**•** La API verifica que cuenta y categoría pertenezcan al usuario autenticado.

## **HU-002 — Transferir entre cuentas**

Como usuario registrado, quiero mover dinero entre dos cuentas propias sin alterar mis ingresos o gastos.

**Criterios de aceptación**

**•** Origen y destino son diferentes y pertenecen al usuario.

**•** Se registran efectos opuestos por el mismo monto.

**•** La operación es atómica y no queda incompleta ante una falla.

**•** La transferencia se excluye del flujo de fondos consolidado.

## **HU-003 — Controlar un presupuesto**

Como usuario registrado, quiero definir un límite mensual por categoría para controlar mis gastos.

**Criterios de aceptación**

**•** Se muestran límite, gasto, disponible y porcentaje.

**•** Un nuevo gasto válido actualiza automáticamente el consumo.

**•** Al alcanzar el umbral de advertencia cambia el estado visible.

**•** Si el gasto supera el límite, el presupuesto queda excedido.

## **HU-004 — Registrar un activo**

Como usuario registrado, quiero cargar una propiedad o vehículo para incluirlo en mi patrimonio.

**Criterios de aceptación**

**•** Se registran tipo, moneda, valor y fecha de valuación.

**•** La valuación más reciente participa del patrimonio neto.

**•** Una actualización agrega historial y no elimina la valuación anterior.

**•** El activo solo puede ser consultado o modificado por su propietario.

## **HU-005 — Consultar una criptomoneda**

Como usuario registrado, quiero conocer el valor estimado de mi posición usando una cotización identificable.

**Criterios de aceptación**

**•** Se muestran cantidad, precio, total, moneda, proveedor y fecha.

**•** Una cotización antigua se marca como desactualizada.

**•** Ante falla externa se mantiene el último valor válido con su fecha real.

**•** No se ofrece comprar, vender ni conectar una wallet.

## **HU-006 — Consultar al asistente**

Como usuario registrado, quiero preguntar por mis gastos para entender mi comportamiento financiero.

**Criterios de aceptación**

**•** El asistente requiere sesión válida y activación previa.

**•** Solo utiliza datos propios y el mínimo contexto necesario.

**•** La respuesta identifica período y categorías considerados.

**•** Los totales coinciden con el reporte del mismo período.

**•** La interacción no crea ni modifica registros y declara insuficiencia si faltan datos.

# **8\. Pantallas**

| ID | Pantalla | Contenido y componentes previstos |
| :---- | :---- | :---- |
| SC-001 | Acceso | Registro, login y recuperación; Card, Form, Input, Button y Alert. |
| SC-002 | Dashboard | Indicadores, gráficos, alertas y accesos rápidos; Card, Tabs, Chart, Progress y Skeleton. |
| SC-003 | Cuentas | Listado, saldo y formularios; Data Table, Badge, Dialog y Dropdown Menu. |
| SC-004 | Movimientos | Tabla filtrable y alta/edición; Data Table, Date Picker, Select, Form y Alert Dialog. |
| SC-005 | Presupuestos | Progreso por categoría y período; Card, Progress, Badge y Dialog. |
| SC-006 | Activos e inversiones | Activos, deudas, posiciones y valuaciones; Tabs, Data Table, Sheet y Chart. |
| SC-007 | Objetivos | Metas y avance; Card, Progress, Form y Badge. |
| SC-008 | Reportes | Filtros, tablas, gráficos y exportación; Tabs, Chart, Table y Button. |
| SC-009 | Asistente IA | Conversación, alcance y fuentes de datos; Scroll Area, Textarea, Button y Alert. |
| SC-010 | Configuración | Perfil, moneda, tema, privacidad e IA; Form, Switch, Select y Alert Dialog. |

# **9\. Requerimientos no funcionales**

## **9.1. Usabilidad y accesibilidad**

| ID | Requerimiento |
| :---- | :---- |
| NFR-UA-001 | La interfaz será responsive desde 360 px de ancho y mantendrá legibilidad en escritorio. |
| NFR-UA-002 | Las funciones principales serán utilizables con teclado y mostrarán foco visible. |
| NFR-UA-003 | Los campos tendrán etiquetas persistentes, ayudas y errores asociados. |
| NFR-UA-004 | Los gráficos tendrán resumen textual o tabla alternativa con la misma información esencial. |
| NFR-UA-005 | Los estados no dependerán únicamente del color; usarán texto, icono o patrón adicional. |

## **9.2. Rendimiento y resiliencia**

| ID | Requerimiento |
| :---- | :---- |
| NFR-PR-001 | Con el conjunto de demostración, las vistas principales deberán mostrar contenido útil en menos de tres segundos bajo condiciones normales. |
| NFR-PR-002 | Los listados extensos utilizarán paginación o carga incremental. |
| NFR-PR-003 | Las cotizaciones externas utilizarán caché, timeout, reintentos acotados y último valor válido. |
| NFR-PR-004 | Las consultas de IA mostrarán estado de carga, permitirán cancelar y finalizarán con timeout controlado. |

## **9.3. Seguridad y privacidad**

| ID | Requerimiento |
| :---- | :---- |
| NFR-SEG-001 | Autenticar al usuario y verificar en servidor la propiedad de cada recurso antes de leerlo o modificarlo. |
| NFR-SEG-002 | Validar entradas en límites, tipos, longitud y formato; rechazar campos inesperados. |
| NFR-SEG-003 | Almacenar contraseñas mediante un algoritmo de hash adaptativo y parámetros vigentes; nunca en texto plano. |
| NFR-SEG-004 | Usar sesiones seguras, expiración, rotación cuando corresponda y cookies HttpOnly, Secure y SameSite en producción. |
| NFR-SEG-005 | Usar identificadores no predecibles y consultas parametrizadas; ningún ID aportado por el cliente otorga autorización. |
| NFR-SEG-006 | Escapar contenido del usuario y evitar renderizado de HTML sin sanitización explícita. |
| NFR-SEG-007 | Mantener secretos y claves de proveedores solo en el servidor y fuera del repositorio. |
| NFR-SEG-008 | No registrar contraseñas, tokens, prompts completos ni datos financieros sensibles en logs. |
| NFR-SEG-009 | Restringir conexiones salientes a proveedores permitidos, con HTTPS, timeout, validación de host y redirecciones deshabilitadas o controladas. |
| NFR-SEG-010 | Aplicar límites de frecuencia a login, recuperación, cotizaciones e IA y devolver errores genéricos ante fallas sensibles. |
| NFR-SEG-011 | Permitir eliminar el historial del asistente y minimizar los datos transmitidos al proveedor de IA. |
| NFR-SEG-012 | Separar instrucciones del sistema de datos no confiables para reducir inyección de prompt y validar la salida antes de presentarla. |

## **9.4. Compatibilidad, localización y calidad**

| ID | Requerimiento |
| :---- | :---- |
| NFR-CAL-001 | Soportar las versiones vigentes de Chrome, Firefox, Edge y Safari al momento de la entrega. |
| NFR-CAL-002 | Ofrecer temas claro y oscuro sin pérdida de contraste o información. |
| NFR-CAL-003 | Mostrar monedas y fechas conforme a la configuración regional del usuario. |
| NFR-CAL-004 | Cubrir las fórmulas financieras con pruebas unitarias y los flujos P0 con pruebas de integración. |
| NFR-CAL-005 | La demostración utilizará datos ficticios y reproducibles, sin información financiera real. |

# **10\. Entidades principales**

| Entidad | Atributos mínimos | Relaciones clave |
| :---- | :---- | :---- |
| Usuario | id, nombre, email, moneda base, preferencias | Propietario de todas las entidades financieras. |
| Cuenta | id, tipo, nombre, moneda, saldo inicial, estado | Tiene movimientos. |
| Movimiento | id, tipo, monto, moneda, fecha, descripción | Pertenece a cuenta y categoría; transferencia vincula dos cuentas. |
| Categoría | id, nombre, tipo, color/icono, estado | Clasifica movimientos y presupuestos. |
| Presupuesto | id, período, categoría, límite, moneda | Se calcula con movimientos de gasto. |
| Activo | id, tipo, nombre, moneda, estado | Tiene valuaciones; puede vincular deuda. |
| Valuación | id, valor, moneda, fecha, fuente | Pertenece a un activo. |
| Deuda | id, tipo, saldo, moneda, fecha | Puede estar vinculada con un activo. |
| Posición | id, símbolo, cantidad, costo promedio | Usa cotizaciones de mercado. |
| Cotización | símbolo, precio, moneda, proveedor, fecha | Valora posiciones compatibles. |
| Objetivo | id, nombre, meta, acumulado, moneda, fecha | Pertenece al usuario. |
| Conversación IA | id, fecha, pregunta, respuesta, metadatos | Pertenece al usuario y admite eliminación. |

# **11\. Dependencias externas**

| Servicio | Datos intercambiados | Comportamiento ante falla |
| :---- | :---- | :---- |
| Proveedor de mercado | Símbolos, precios, monedas y fechas. | Usar último valor válido y advertir antigüedad; nunca bloquear el resto de la aplicación. |
| Proveedor de IA | Pregunta y contexto financiero mínimo ya calculado. | Informar indisponibilidad; no perder ni modificar datos financieros. |
| Servicio de correo | Email y token temporal de recuperación. | Informar que no pudo enviarse y permitir reintento controlado. |

# **12\. Datos de demostración**

**•** Un usuario ficticio sin datos personales reales.

**•** Tres cuentas en al menos dos monedas.

**•** Tres meses de ingresos, gastos y transferencias.

**•** Cinco categorías y cuatro presupuestos mensuales.

**•** Una propiedad, un vehículo, una deuda y su historial de valuaciones.

**•** Dos posiciones de criptomonedas con cotizaciones identificadas.

**•** Dos objetivos financieros con distinto grado de avance.

**•** Consultas de IA preparadas para comparar gastos, presupuesto y evolución patrimonial.

# **13\. Glosario**

| Término | Definición |
| :---- | :---- |
| Activo | Recurso con valor económico perteneciente al usuario. |
| Deuda | Obligación financiera pendiente. |
| Patrimonio neto | Total de activos menos total de deudas. |
| Presupuesto | Límite de gasto por categoría y período. |
| Valuación | Valor asignado a un activo en una fecha. |
| Posición | Cantidad mantenida de un instrumento financiero. |
| Cotización | Precio de mercado con moneda, fuente y fecha. |
| Flujo de fondos | Ingresos menos gastos del período. |
| P0 / P1 / P2 | Niveles de prioridad esencial, importante y futura. |

[image1]: <data:image/png;base64,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>