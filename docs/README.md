# Documentación — Atlass Fin

Índice de la documentación del proyecto. El contenido está en español; los nombres de carpeta, en inglés.

## `specification/` — qué debe hacer el producto

| Documento | Contenido |
| :--- | :--- |
| [`BRD_Gestor_Financiero_v0.3.md`](specification/0.3/BRD_Gestor_Financiero_v0.3.md) | Requerimientos de negocio: reglas de negocio (`RN-*`), casos de estudio, criterios de bondad, glosario. |
| [`FRD_Gestor_Financiero_v0.3.md`](specification/0.3/FRD_Gestor_Financiero_v0.3.md) | **Fuente de verdad funcional.** Requerimientos funcionales (`FR-*`), no funcionales (`NFR-*`), reglas de cálculo (`CAL-*`), historias de usuario (`HU-*`) y pantallas (`SC-*`). |
| [`Plan_de_Pruebas_Gestor_Financiero_v1.0.md`](specification/0.3/Plan_de_Pruebas_Gestor_Financiero_v1.0.md) | Estrategia, casos de prueba (`CP-*`), datos de prueba, criterios de entrada/salida y riesgos. |
| [`Test_Cases_Gestor_Financiero_v1.0.md`](specification/0.3/Test_Cases_Gestor_Financiero_v1.0.md) | Operacionalización de los 37 casos (`CP-*`): precondiciones, pasos, resultado esperado, evidencia, estado de ejecución, defectos (`BUG-*`) y trazabilidad. |

> **Identificadores.** Los IDs se numeran de forma consecutiva dentro de cada familia. La **v0.3** (con categorías propias, tema local, asistente de solo consulta, multimoneda con cotizaciones de la API y autenticación web-only stateless) es la vigente; la v0.2 quedó reemplazada y se conserva en `specification/0.2/` como registro histórico.

## `architecture/` — cómo está construido

| Documento | Contenido |
| :--- | :--- |
| [`frontend.md`](architecture/frontend.md) | Mapa del sitio, comportamiento por página, estructura de archivos, autenticación, gráficos y asistente de IA. |
| [`backend.md`](architecture/backend.md) | Arquitectura, modelo de datos, contrato REST (DTOs, enums, errores), reglas de cálculo, integraciones, seguridad, seed y variables de entorno. |
| [`der.md`](architecture/der.md) | Diagrama entidad-relación y detalle de tablas, reglas de integridad y alcance del modelo de datos. |

Estos documentos citan requerimientos (`FR-*`, `HU-*`, `CAL-*`, `NFR-*`) del FRD v0.3. Si el código y la documentación no coinciden, se alinean en el mismo cambio; la implementación desplegada es la referencia de comportamiento y la documentación se corrige para reflejarla.
