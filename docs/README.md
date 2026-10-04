# Documentación — Atlass Fin

Índice de la documentación del proyecto. El contenido está en español; los nombres de carpeta, en inglés.

## `specification/` — qué debe hacer el producto

| Documento | Contenido |
| :--- | :--- |
| [`BRD_Gestor_Financiero_v0.2.md`](specification/BRD_Gestor_Financiero_v0.2.md) | Requerimientos de negocio: reglas de negocio (`RN-*`), casos de estudio, criterios de bondad, glosario. |
| [`FRD_Gestor_Financiero_v0.2.md`](specification/FRD_Gestor_Financiero_v0.2.md) | **Fuente de verdad funcional.** Requerimientos funcionales (`FR-*`), no funcionales (`NFR-*`), reglas de cálculo (`CAL-*`), historias de usuario (`HU-*`) y pantallas (`SC-*`). |
| [`FRD_v0.2_requerimientos_cambiados.md`](specification/FRD_v0.2_requerimientos_cambiados.md) | Delta de la v0.2: requerimientos agregados y modificados respecto de la v0.1. |
| [`FRD_Gestor_Financiero_v0.2_cambios_propuestos.md`](specification/FRD_Gestor_Financiero_v0.2_cambios_propuestos.md) | Justificación del delta y cambios de secciones que no son requerimientos (stack, pantallas, entidades). |

> **Identificadores estables.** Los IDs no se renumeran entre versiones: la numeración puede presentar huecos y los números ausentes corresponden a requerimientos fuera del alcance de la versión. La v0.1 quedó reemplazada por la v0.2.

## `architecture/` — cómo está construido

| Documento | Contenido |
| :--- | :--- |
| [`frontend.md`](architecture/frontend.md) | Mapa del sitio, comportamiento por página, estructura de archivos, autenticación, gráficos, asistente de IA, Capacitor y plan de trabajo. |
| [`backend.md`](architecture/backend.md) | Arquitectura, modelo de datos, contrato REST (DTOs, enums, errores), reglas de cálculo, integraciones, seguridad, seed y variables de entorno. |

Estos dos documentos citan requerimientos (`FR-*`, `HU-*`, `CAL-*`, `NFR-*`) del FRD v0.2. Si el código y la documentación no coinciden, se alinean en el mismo cambio.

## `archive/` — análisis y auditorías

Material histórico. Se conserva como registro del proceso; **puede estar desactualizado** y no es fuente de verdad.

| Documento | Contenido |
| :--- | :--- |
| [`informe_desactualizacion_documentacion.md`](archive/informe_desactualizacion_documentacion.md) | Auditoría docs ↔ código que dio origen al delta de la v0.2. |
| [`analisis_correcciones_atlass_fin.md`](archive/analisis_correcciones_atlass_fin.md) | Auditoría UX/UI y plan de correcciones. |
| [`auditoria_atlass_fin_v2_sin_filtros.md`](archive/auditoria_atlass_fin_v2_sin_filtros.md) | Auditoría UX/UI v2. |
| [`frontend-backend-forms-audit.md`](archive/frontend-backend-forms-audit.md) | Auditoría de formularios frontend ↔ backend. |
| [`exploracion_acciones_asistente_ia.md`](archive/exploracion_acciones_asistente_ia.md) | Exploración técnica del asistente de IA como ejecutor de acciones. |
| [`prompt_mejora_patrimonio_atlass_fin.md`](archive/prompt_mejora_patrimonio_atlass_fin.md) | Prompt de evolución de la experiencia de patrimonio. |
