# Documentación — Atlass Fin

Índice de la documentación del proyecto. El contenido está en español; los nombres de carpeta, en inglés.

## `specification/` — qué debe hacer el producto

| Documento | Contenido |
| :--- | :--- |
| [`BRD_Gestor_Financiero_v0.3.md`](specification/0.3/BRD_Gestor_Financiero_v0.3.md) | Requerimientos de negocio: reglas de negocio (`RN-*`), casos de estudio, criterios de bondad, glosario. |
| [`FRD_Gestor_Financiero_v0.3.md`](specification/0.3/FRD_Gestor_Financiero_v0.3.md) | **Fuente de verdad funcional.** Requerimientos funcionales (`FR-*`), no funcionales (`NFR-*`), reglas de cálculo (`CAL-*`), historias de usuario (`HU-*`) y pantallas (`SC-*`). |
| [`Plan_de_Pruebas_Gestor_Financiero.md`](specification/0.3/Plan_de_Pruebas_Gestor_Financiero.md) | Estrategia, casos de prueba (`CP-*`), datos de prueba, criterios de entrada/salida y riesgos. |

> **Identificadores estables.** Los IDs no se renumeran entre versiones: la numeración puede presentar huecos y los números ausentes corresponden a requerimientos fuera del alcance de la versión. La **v0.3.1** (sin presupuestos, activos, inversiones, deudas, objetivos, reportes ni multimoneda; con categorías propias, tema local y asistente de solo consulta) es la vigente; la v0.2 quedó reemplazada y se conserva en `specification/0.2/` como registro histórico.

## `architecture/` — cómo está construido

| Documento | Contenido |
| :--- | :--- |
| [`frontend.md`](architecture/frontend.md) | Mapa del sitio, comportamiento por página, estructura de archivos, autenticación, gráficos, asistente de IA y plan de trabajo. |
| [`backend.md`](architecture/backend.md) | Arquitectura, modelo de datos, contrato REST (DTOs, enums, errores), reglas de cálculo, integraciones, seguridad, seed y variables de entorno. |

Estos documentos citan requerimientos (`FR-*`, `HU-*`, `CAL-*`, `NFR-*`) del FRD v0.3.1. Si el código y la documentación no coinciden, se alinean en el mismo cambio.
