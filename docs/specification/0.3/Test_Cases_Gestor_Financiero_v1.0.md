# Documento de Seguimiento de Testing

| | |
|---|---|
| Proyecto | Gestor Financiero Personal |
| Versión | 1.0 |
| Fecha | 30/10/2026 |
| Sponsor Operación | Secretaría Académica UNAHUR |
| Sponsor Organización | UNAHUR |
| Autor | Barenghi, Thomas |
| Tutor | Prof. Ciarallo, Cristian |
| Release | Demostración académica 2026 |

## Tabla de contenidos

- Objetivo
- Formato del Documento
- Seguimiento y Gestión de Bugs

## Objetivo:

Registrar y hacer seguimiento de los defectos encontrados durante la ejecución del Plan de Pruebas del Gestor Financiero Personal, de modo que cada hallazgo quede identificado, priorizado y trazable hasta su resolución.

## Formato del Documento:

El documento se organiza en forma de tabla, con las siguientes columnas:

| Columna | Descripción |
|---|---|
| ID de Bug | Identificador único de cada defecto. |
| Descripción | Descripción breve del problema encontrado. |
| Pasos para Reproducir | Pasos detallados para reproducir el defecto. |
| Prioridad | Prioridad asignada al bug (alta, media, baja). |
| Estado | Estado actual del bug (abierto, en proceso, resuelto, cerrado). |
| Responsable | Persona a cargo de la corrección. |
| Fecha de Creación | Fecha en que se identificó el defecto. |
| Fecha de Resolución | Fecha en que se resolvió, si corresponde. |
| Comentarios | Información adicional sobre el defecto o su resolución. |

## Seguimiento y Gestión de Bugs:

| ID de Bug | Descripción | Pasos para Reproducir | Prioridad | Estado | Responsable | Fecha de Creación | Fecha de Resolución | Comentarios |
|---|---|---|---|---|---|---|---|---|
| BUG-001 | La exportación CSV escribía la columna Monto con el formato de pantalla en lugar de un número decimal, por lo que la planilla la interpretaba como texto. | 1) Abrir Movimientos. 2) Exportar los movimientos. 3) Abrir el CSV en una planilla. 4) Intentar sumar la columna Monto. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Se exporta el valor numérico crudo; cubierto por una prueba automatizada y verificado en la regresión. |
| BUG-002 | El detalle de cuenta ignora el período compartido en sus indicadores: calcula sobre todo el historial, por lo que ingresos y gastos no coinciden con el panel para el mismo período. | 1) Iniciar sesión con el usuario demo. 2) Abrir el panel y elegir “Este mes”; anotar ingresos y gastos. 3) Abrir el detalle de una cuenta. 4) Comparar los indicadores del detalle con los del panel. | Alta | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar CP-CUE-04. El detalle debe respetar el período compartido y recalcular sus indicadores. |
| BUG-003 | La leyenda “vs. período anterior” del patrimonio compara contra un rango fijo de 30 días en lugar del período seleccionado, por lo que el porcentaje mostrado no coincide con el cálculo real. | 1) Abrir el panel. 2) Elegir “6 meses”. 3) Comparar la variación mostrada con el patrimonio calculado para los 6 meses previos. | Alta | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar CP-DAS-02. El cálculo de referencia coincide; la leyenda de comparación no. |
| BUG-004 | El contador de movimientos del perfil se calcula sobre los primeros 100 registros cargados en la vista, en lugar del total del usuario. | 1) Cargar más de 100 movimientos para un usuario. 2) Abrir el perfil. 3) Comparar el contador con el total real del usuario. | Media | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar CP-CFG-02. El contador debe resolverse en el servidor sobre el total. |
| BUG-005 | Los errores controlados del proveedor (502) se devuelven como 500 genérico y sin código de error, por lo que el cliente no puede distinguir una falla externa de un error interno. | 1) Simular la caída del proveedor de cotizaciones. 2) Consultar el panel. 3) Revisar el código y el cuerpo de la respuesta. | Media | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar CP-NFR-02. Se espera 502 con code=PROVIDER_UNAVAILABLE. |
| BUG-006 | PATCH /transactions/:id permite convertir un ingreso o gasto en transferencia sin crear el grupo de dos patas, dejando la operación inconsistente. | 1) Crear un gasto. 2) Enviar PATCH con type=transfer. 3) Consultar el movimiento y el flujo de fondos. | Alta | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar CP-TRX-03. El cambio de tipo debe rechazarse si no se crea el grupo completo. |
| BUG-007 | El stream del asistente descarta el campo opcional currency, por lo que la respuesta siempre se expresa en la moneda principal aunque el usuario haya elegido otra. | 1) Abrir el asistente. 2) Elegir la moneda de lectura USD. 3) Enviar una consulta. 4) Revisar la moneda de los montos de la respuesta. | Media | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar CP-IA-01. El campo debe propagarse al stream. |
| BUG-008 | El cliente del proveedor de cotizaciones sigue redirecciones automáticamente, lo que permite que la API sea redirigida a un dominio no previsto. | 1) Configurar un proveedor de prueba que responda 302 hacia otro host. 2) Solicitar una cotización. 3) Revisar el host final de la petición. | Media | Abierto | Barenghi, Thomas | 30/10/2026 |  | Detectado al validar NFR-SEG-007. Se debe deshabilitar el seguimiento de redirecciones. |
| | | | | | | | | |
