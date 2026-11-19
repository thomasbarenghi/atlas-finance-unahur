# Documentación — Atlass Fin

Índice de la documentación del proyecto. El contenido está en español; los nombres de carpeta, en inglés.

## `specification/` — qué debe hacer el producto

**Vigente — v0.4 (31/10/2026)**

| Documento | Contenido |
| :--- | :--- |
| [`BRD_Gestor_Financiero_v0.4.md`](specification/0.4/BRD_Gestor_Financiero_v0.4.md) | Requerimientos de negocio: reglas de negocio (`RN-*`), casos de estudio, criterios de bondad, glosario. |
| [`FRD_Gestor_Financiero_v0.4.md`](specification/0.4/FRD_Gestor_Financiero_v0.4.md) | **Fuente de verdad funcional.** Requerimientos funcionales (`FR-*`), no funcionales (`NFR-*`), reglas de cálculo (`CAL-*`), historias de usuario (`HU-*`) y pantallas (`SC-*`). |
| [`Plan_de_Pruebas_Gestor_Financiero_v1.1.md`](specification/0.4/Plan_de_Pruebas_Gestor_Financiero_v1.1.md) | Estrategia, casos de prueba (`CP-*`), datos de prueba y criterios de entrada/salida. |
| [`Test_Cases_Gestor_Financiero_v1.1.md`](specification/0.4/Test_Cases_Gestor_Financiero_v1.1.md) | Registro de seguimiento de testing: defectos (`BUG-*`) y resultados de la ejecución de los 37 casos. |

**Anterior — v0.3 (30/10/2026)**

| Documento | Contenido |
| :--- | :--- |
| [`BRD_Gestor_Financiero_v0.3.md`](specification/0.3/BRD_Gestor_Financiero_v0.3.md) | Requerimientos de negocio: reglas de negocio (`RN-*`), casos de estudio, criterios de bondad, glosario. |
| [`FRD_Gestor_Financiero_v0.3.md`](specification/0.3/FRD_Gestor_Financiero_v0.3.md) | **Fuente de verdad funcional.** Requerimientos funcionales (`FR-*`), no funcionales (`NFR-*`), reglas de cálculo (`CAL-*`), historias de usuario (`HU-*`) y pantallas (`SC-*`). |
| [`Plan_de_Pruebas_Gestor_Financiero_v1.0.md`](specification/0.3/Plan_de_Pruebas_Gestor_Financiero_v1.0.md) | Estrategia, casos de prueba (`CP-*`), datos de prueba y criterios de entrada/salida. |
| [`Test_Cases_Gestor_Financiero_v1.0.md`](specification/0.3/Test_Cases_Gestor_Financiero_v1.0.md) | Casos de prueba detallados (`CP-*`): precondiciones, pasos y resultados esperados, matriz de trazabilidad, estado de la ejecución y defectos (`BUG-*`). |

> **Identificadores.** Los IDs se numeran de forma consecutiva dentro de cada familia. La **v0.4** es la vigente; la **v0.3** se conserva como versión anterior y la **v0.2** como registro histórico en `specification/0.2/`.

## `architecture/` — cómo está construido

| Documento | Contenido |
| :--- | :--- |
| [`frontend.md`](architecture/frontend.md) | Mapa del sitio, comportamiento por página, estructura de archivos, autenticación, gráficos y asistente de IA. |
| [`backend.md`](architecture/backend.md) | Arquitectura, modelo de datos, contrato REST (DTOs, enums, errores), reglas de cálculo, integraciones, seguridad, seed y variables de entorno. |
| [`der.md`](architecture/der.md) | Diagrama entidad-relación y detalle de tablas, reglas de integridad y alcance del modelo de datos. |

Estos documentos citan requerimientos (`FR-*`, `HU-*`, `CAL-*`, `NFR-*`) del FRD v0.4 (y de la v0.3, conservada como versión anterior). Si el código y la documentación no coinciden, se alinean en el mismo cambio; la implementación desplegada es la referencia de comportamiento y la documentación se corrige para reflejarla.
