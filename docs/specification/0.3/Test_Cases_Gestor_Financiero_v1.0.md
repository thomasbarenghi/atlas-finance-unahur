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
- Anexo: Resultados de la Ejecución

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
| BUG-001 | El CSV exportaba el monto como texto y la planilla no podía sumarlo. | 1) Abrir Movimientos. 2) Exportar. 3) Abrir el CSV en una planilla. 4) Sumar la columna Monto. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: el monto se exporta como número. Verificado con una prueba automática. |
| BUG-002 | El detalle de cuenta decía “del período” aunque los indicadores eran de toda la cuenta. | 1) Abrir el detalle de Banco. 2) Ver el texto de Ingresos. 3) Comparar con el total de la cuenta. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: ahora dice “Ingresos/Gastos de la cuenta”. |
| BUG-003 | La leyenda “vs. período anterior” no coincidía con la referencia real del cálculo. | 1) Abrir el panel. 2) Elegir “6 meses”. 3) Comparar la variación con el inicio del período. | Alta | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | No se reprodujo como se describía. El problema real quedó en BUG-009. |
| BUG-004 | El contador de movimientos del perfil mostraba solo los primeros 100, no el total. | 1) Tener más de 100 movimientos. 2) Abrir el perfil. 3) Comparar el contador con el total. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: el contador usa el total del usuario. |
| BUG-005 | El error del proveedor de cotizaciones llegaba sin código, como un error interno. | 1) Cortar el proveedor de cotizaciones. 2) Abrir el panel. 3) Revisar la respuesta. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Cerrado sin cambios: el contrato indica que los errores del servidor se muestran con un mensaje genérico. |
| BUG-006 | Se podía cambiar el tipo de un movimiento por API y dejarlo inconsistente. | 1) Crear un gasto. 2) Intentar cambiarlo a transferencia por API. 3) Revisar el movimiento. | Alta | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: el tipo no se puede cambiar al editar. |
| BUG-007 | El asistente no recibía la moneda de lectura y respondía siempre en la moneda principal. | 1) Elegir USD en el panel. 2) Preguntar al asistente. 3) Revisar la moneda de la respuesta. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: el asistente recibe la moneda elegida. |
| BUG-008 | La consulta de cotizaciones podía seguir una redirección a otro sitio. | 1) Simular una redirección. 2) Pedir cotizaciones. 3) Revisar el destino final. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: la consulta ya no sigue redirecciones. |
| BUG-009 | La leyenda de la variación del patrimonio no describía bien la referencia. | 1) Abrir el panel. 2) Elegir “6 meses”. 3) Comparar con el inicio del período. | Media | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: la leyenda ahora dice “desde el inicio del período”. |
| BUG-010 | El formulario de movimiento conservaba los datos anteriores al reabrirlo. | 1) Crear un movimiento de 5.000. 2) Cerrar el formulario. 3) Reabrirlo y escribir 1.500. | Alta | Cerrado | Barenghi, Thomas | 30/10/2026 | 30/10/2026 | Corregido: el formulario se reinicia al abrirlo. |
| | | | | | | | | |

## Anexo: Resultados de la Ejecución

**Entorno y evidencia**

| Dato | Valor |
|---|---|
| Fecha de ejecución | 30/10/2026 |
| Aplicación | API y cliente locales (`localhost:3001` y `localhost:3000`) sobre PostgreSQL `atlas_finance_dev` |
| Base de integración | `atlas_finance_test` |
| Datos | Seed reproducible: `demo@atlassfin.app`, `sin-datos@atlassfin.app`, `ana@atlassfin.app` |
| Proveedores | Cotizaciones e IA reales en la ejecución de interfaz; en las suites de integración se usan dobles de prueba en el borde, sin llamadas externas |

| Suite | Comando | Resultado |
|---|---|---|
| API — unitarias | `cd api && npm run test` | 23 suites · 131 pruebas aprobadas |
| API — integración | `cd api && npm run test:e2e` | 25 suites · 88 pruebas aprobadas |
| Cliente — unitarias y componentes | `cd client && npm run test` | 48 archivos · 221 pruebas aprobadas |
| Total automatizado | — | 440 pruebas aprobadas, 0 falladas |

**Resultado por caso**

| Caso | Resultado | Evidencia |
|---|---|---|
| CP-ACC-01 | Aprobado | Registro válido, correo duplicado y política de contraseña verificados en `/register`; 8 pruebas de `FR-AUT-001.e2e-spec.ts`. |
| CP-ACC-02 | Aprobado | Inicio, cierre (sin cookies `access_token`/`refresh_token`) y redirección de `/dashboard` a `/login`; `FR-AUT-002` y `NFR-SEG-004`. |
| CP-SEG-01 | Aprobado | Cuenta de Ana solicitada con sesión de demo → 404; `NFR-SEG-001`. |
| CP-SEG-02 | Aprobado | Campos inesperados, tipos, UUID y cuerpos vacíos rechazados; `NFR-SEG-002`. |
| CP-SEG-03 | Aprobado | Hashes `$argon2id$` en `users`; secretos fuera del cliente; `NFR-SEG-003`; el proveedor de cotizaciones no sigue redirecciones (`NFR-SEG-004`, BUG-008 cerrado). |
| CP-CUE-01 | Aprobado | Alta “QA Cuenta UI” ($ 2.500) y edición de nombre desde el detalle. |
| CP-CUE-02 | Aprobado | Saldo 1.300 con inicial 1.000 + ingreso 500 − gasto 200; al eliminar la cuenta destino desaparecieron las dos patas de la transferencia. |
| CP-CUE-03 | Aprobado | Con movimientos, la UI muestra “No se puede cambiar…” y la API responde 400 `VALIDATION_ERROR`. |
| CP-CUE-04 | Aprobado | Detalle con saldo, indicadores, movimientos y edición; los textos de los indicadores quedaron sin alcance de período (BUG-002 cerrado). |
| CP-TRX-01 | Aprobado | Ingreso de 5.000 y gasto de 1.500 creados en la UI; monto 0 y campos vacíos cubiertos por `transaction-form-dialog.test.tsx`; el formulario se reinicia al reabrirse (BUG-010 cerrado). |
| CP-TRX-02 | Aprobado | Transferencia verificada por API (dos patas atómicas y exclusión de ingresos/gastos, `CAL-003`) y en el historial (“Ahorro mensual” en una sola fila). |
| CP-TRX-03 | Aprobado | Edición y eliminación propias verificadas en la UI; recurso ajeno → 404; el cambio de tipo se rechaza (BUG-006 cerrado). |
| CP-TRX-05 | Aprobado | Búsqueda “super” y “12000” y filtro “Gastos” devuelven solo las filas esperadas; `filters.test.ts`. |
| CP-TRX-06 | Aprobado | 20.000 ARS → US$ 13,33 con cotización 1.500; editada a 30.000 ARS → US$ 21,43 con 1.400; la cotización no se persiste. |
| CP-TRX-07 | Aprobado | Historial agrupado por mes, paginado de a 10 y transferencias en una fila con monto neutro; sin subtotales, según FR-TRX-004. |
| CP-TRX-08 | Aprobado | CSV `movimientos-2026-10-30.csv` con BOM UTF-8 y Monto `180000`; sin movimientos el botón está deshabilitado. |
| CP-CAT-01 | Aprobado | Cinco categorías del sistema + “Otros” propia; cantidad, monto, porcentaje y orden por uso; el sistema no muestra acciones. |
| CP-CAT-02 | Aprobado | Cambio ARS → USD: total US$ 1.025,30 y porcentajes 57,4 / 30,9 / 11,7 sin cambios. |
| CP-CAT-03 | Aprobado | Categoría propia creada, asignada, editada y eliminada; sistema → 404; movimientos quedan sin categoría. |
| CP-DAS-01 | Aprobado | Patrimonio $ 3.949.819,93 y desglose ARS/USD; la variación quedó rotulada “desde el inicio del período” (BUG-009 cerrado). |
| CP-DAS-02 | Aprobado | Ingresos 1.572.419,95, gastos 303.849,99, ahorro 1.268.569,96 (= ingresos − gastos, CAL-002) y tasa 80,7 %; medidos sobre el dataset base, antes de las altas de CP-TRX-01. |
| CP-DAS-03 | Aprobado | Totales del panel = movimientos convertidos (ARS + USD × cotización) del período. |
| CP-DAS-04 | Aprobado | Tres gráficos con series del período, leyendas y tablas accesibles equivalentes. |
| CP-DAS-05 | Aprobado | “Este mes” → serie diaria y barras semanales; “6 meses” → serie y barras mensuales. |
| CP-DAS-06 | Aprobado | ARS → USD re-expresa patrimonio, KPIs y desglose; el catálogo completo está disponible. |
| CP-CAL-01 | Aprobado | `calculations.service.spec.ts` y `CAL-001.e2e-spec.ts`. |
| CP-CAL-02 | Aprobado | `calculations.service.spec.ts` y `CAL-002.e2e-spec.ts`. |
| CP-CAL-03 | Aprobado | `calculations.service.spec.ts` y `CAL-003.e2e-spec.ts`. |
| CP-CAL-04 | Aprobado | `calculations.service.spec.ts` y `CAL-004.e2e-spec.ts` (tasa de ahorro y variación en puntos porcentuales). |
| CP-IA-01 | Aprobado | Respuesta: gasto de octubre $ 305.349,99 y categorías Servicios/Supermercado/Transporte; incluye el gasto de 1.500 creado en CP-TRX-01, por eso difiere en 1.500 de CP-DAS-02; el cliente envía la moneda de lectura (BUG-007 cerrado). |
| CP-IA-02 | Aprobado | “Creá un gasto…” → el asistente se declara de solo consulta; total de movimientos 32 antes y después. |
| CP-IA-03 | Aprobado | El seguimiento envía `history`; tras recargar no hay historial persistido. |
| CP-NFR-01 | Aprobado | 390×844 sin desborde horizontal; barra inferior Inicio/Movimientos/Asistente/Perfil. |
| CP-NFR-02 | Aprobado | Errores de API y de credenciales informados sin perder sesión; los 5xx usan el cuerpo genérico definido en `backend.md` (BUG-005 cerrado). |
| CP-CFG-01 | Aprobado | Tema Oscuro aplicado, persiste tras recargar y vuelve a Claro. |
| CP-CFG-02 | Aprobado | Moneda principal USD persistida (`/auth/me`) y usada por el dashboard; restaurada a ARS. |
| CP-CFG-03 | Aprobado | Correo duplicado, contraseña actual incorrecta y contraseña nueva inválida informados sin cerrar sesión. |

**Resumen**

| Resultado | Casos |
|---|---|
| Casos definidos | 37 |
| Ejecutados | 37 |
| Aprobados | 37 |
| Aprobados con defecto abierto | 0 |
| Fallados | 0 |
| Bloqueados | 0 |
| Defectos abiertos | 0 |
| Defectos cerrados | 10 (BUG-001 a BUG-010) |

**Trazabilidad de defectos:** todos los defectos están cerrados. BUG-004 se detectó en una prueba exploratoria; el resto se validó con su caso o su prueba automática.

**Criterio de salida:** se alcanza. Todos los casos P0 están aprobados, no quedan defectos abiertos y los cálculos y la autorización están verificados.
