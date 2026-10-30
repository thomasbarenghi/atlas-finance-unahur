# Test Cases — Gestor Financiero Personal

| | |
|---|---|
| **Proyecto** | Gestor Financiero Personal |
| **Documento** | Test Cases (seguimiento de testing) |
| **Versión** | 1.0 |
| **Fecha** | Octubre 2026 |
| **Sponsor Operación** | Secretaría Académica UNAHUR |
| **Sponsor Organización** | UNAHUR |
| **Autor** | Barenghi, Thomas |
| **Tutor** | Prof. Ciarallo, Cristian |
| **Release** | Demostración académica 2026 |

## Historial de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0 | Octubre 2026 | Barenghi, Thomas | Versión inicial de la planilla de seguimiento, alineada con el Plan de Pruebas v1.0 y la implementación. |

## Tabla de contenidos

- 1. Objetivo
- 2. Formato del documento
- 3. Estado de la ejecución
- 4. Seguimiento y gestión de bugs
- 5. Trazabilidad con los casos de prueba
- 6. Notas

## 1. Objetivo

El **Documento de Seguimiento de Testing** registra y hace seguimiento de los defectos encontrados durante la ejecución del **Plan de Pruebas v1.0** del Gestor Financiero Personal, de modo que cada hallazgo quede identificado, priorizado y trazable hasta su resolución.

Esta planilla **no reemplaza** al plan: los casos, sus pasos y sus resultados esperados viven en el Plan de Pruebas. Acá se registra únicamente el resultado de la ejecución y los defectos asociados. La implementación desplegada es la referencia de comportamiento; si un caso y la aplicación difieren, la diferencia se registra como defecto o se corrige el caso, nunca se aprueba sin evidencia.

## 2. Formato del documento

El documento se organiza en forma de tabla, con las siguientes columnas:

| Columna | Descripción |
|---|---|
| **ID de Bug** | Identificador único de cada defecto (por ejemplo, BUG-001). |
| **Descripción** | Descripción breve y concreta del problema encontrado. |
| **Pasos para reproducir** | Pasos detallados para reproducir el defecto. |
| **Prioridad** | Alta, media o baja. |
| **Estado** | Abierto, en proceso, resuelto o cerrado. |
| **Responsable** | Persona responsable de la corrección. |
| **Fecha de creación** | Fecha en que se identificó el defecto. |
| **Fecha de resolución** | Fecha en que se resolvió, si corresponde. |
| **Notas / comentarios** | Caso que lo detectó, commit o prueba que lo cubre e información adicional. |

**Criterio de prioridad**

| Prioridad | Criterio |
|---|---|
| **Alta** | Afecta un cálculo financiero, la autorización entre usuarios o un flujo P0; bloquea la aceptación. |
| **Media** | Afecta un flujo P1 o degrada la experiencia sin corromper datos; tiene *workaround*. |
| **Baja** | Detalle cosmético, de accesibilidad o de consistencia menor. |

**Máquina de estados del defecto:** `Abierto → En proceso → Resuelto → Cerrado`. Un defecto pasa a **Resuelto** cuando el cambio está desplegado en el entorno de prueba y a **Cerrado** cuando el caso `CP-*` asociado se re-ejecuta y aprueba (regresión).

**Máquina de estados del caso:** `No ejecutado → En ejecución → Aprobado / Fallado / Bloqueado` (Plan §7).

## 3. Estado de la ejecución

La ejecución de los 37 casos del Plan de Pruebas v1.0 **todavía no está registrada** en esta planilla. Cada fila de resultado debe completarse durante la ejecución y adjuntar evidencia reproducible:

| Evidencia admitida | Ejemplo |
|---|---|
| Prueba automatizada | Salida de `npm run test` o `npm run test:e2e` con el nombre del caso o del archivo. |
| API | Request/response de `cURL` o Postman con estado y cuerpo. |
| Interfaz | Captura o grabación del flujo, con la versión desplegada y la fecha. |

**Resumen**

| Resultado | Casos |
|---|---|
| Casos definidos | 37 |
| Ejecutados | 0 |
| Aprobados | 0 |
| Fallados | 0 |
| Bloqueados | 0 |

> No se registran resultados, fechas de ejecución ni aprobaciones sin evidencia adjunta.

## 4. Seguimiento y gestión de bugs

| ID de Bug | Descripción | Pasos para reproducir | Prioridad | Estado | Responsable | Fecha de creación | Fecha de resolución | Notas / comentarios |
|---|---|---|---|---|---|---|---|---|
| BUG-001 | La exportación CSV escribía la columna `Monto` con el formato de pantalla (`$ 1.234,56`) en lugar de un número decimal, por lo que la planilla la interpretaba como texto y no permitía operar con ella. | 1) Abrir Movimientos. 2) Exportar los movimientos. 3) Abrir el CSV en una planilla. 4) Intentar sumar la columna `Monto`. | Media | Resuelto | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Detectado al validar FR-TRX-003. Se exporta el valor numérico crudo; cubierto por `client/hooks/__tests__/use-export-transactions.test.tsx`. Pendiente re-ejecutar CP-TRX-08 para cerrarlo. |

> No hay otros defectos registrados. Los desajustes detectados entre documentos y aplicación se corrigieron en la documentación (Plan v1.0, FRD/BRD v0.3) porque la implementación es la referencia de comportamiento; no se agregó funcionalidad.

## 5. Trazabilidad con los casos de prueba

| Caso | Defecto asociado | Estado del caso |
|---|---|---|
| CP-TRX-08 | BUG-001 | No ejecutado (defecto corregido; pendiente de regresión) |

> El resto de los casos (`ACC`, `SEG`, `CUE`, `TRX`, `CAT`, `DAS`, `CAL`, `IA`, `NFR`, `CFG`) permanece en estado **No ejecutado** hasta que se registre su evidencia. Los 37 casos y su trazabilidad al FRD/BRD están definidos en el Plan de Pruebas v1.0.

## 6. Notas

- La planilla se completa **durante** la ejecución; no se anticipan resultados.
- Cada defecto debe indicar el caso `CP-*` que lo detectó y, cuando exista, el commit que lo corrige.
- Los defectos **Alta** se corrigen antes del cierre de la iteración y se re-ejecuta su caso (regresión).
- Un caso se marca **Aprobado** solo si el resultado observado coincide con el esperado; toda desviación se registra como defecto (Plan §3.3).
- La aceptación requiere el **100 % de los casos P0 ejecutados y aprobados** y sin defectos bloqueantes ni críticos abiertos (Plan §8.2).
