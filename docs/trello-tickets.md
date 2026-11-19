# Tickets de Trello — Atlass Fin

**Repositorio:** https://github.com/thomasbarenghi/atlas-finance-unahur
**Tablero:** [Grupo 13 - ACA: Proyecto integrador Programación](https://trello.com/b/ywGiZ6Qw/grupo-13-aca-proyecto-integrador-programaci%C3%B3n)

Los tickets del tablero se organizan **por historia de usuario**, con trazabilidad a los requerimientos del FRD y las historias de negocio del BRD.

- **Fuente funcional:** `specification/0.4/FRD_Gestor_Financiero_v0.4.md` (v0.4).
- **Fuente de negocio:** `specification/0.4/BRD_Gestor_Financiero_v0.4.md` (v0.4).
- **Estado:** las 20 historias están implementadas y ubicadas en la lista **Done**. La aprobación de pruebas es independiente: los defectos y los resultados de la ejecución del 30/10/2026 se registran en `specification/0.4/Test_Cases_Gestor_Financiero_v1.1.md`; el detalle de cada caso (precondiciones, pasos y resultado esperado) se conserva en `specification/0.3/Test_Cases_Gestor_Financiero_v1.0.md`.
- **Ticket de QA:** [`[QA] Prueba integral de la app`](https://trello.com/c/wf3tmb5F) en **Done**, con el checklist de los 37 casos y el resultado de la ejecución del 30/10/2026.
- Cada tarjeta incluye descripción, requerimientos, criterios de aceptación, trazabilidad y estado.

| Ticket | Historia | Requerimientos | Historia de negocio |
|---|---|---|---|
| HU-001 | Registrar un movimiento | FR-TRX-001 | US-003 |
| HU-002 | Transferir entre cuentas | FR-TRX-001 · CAL-003 | US-009 |
| HU-003 | Consultar al asistente | FR-IA-001 | US-005 |
| HU-004 | Registrarme e iniciar sesión | FR-AUT-001/002 · FR-CFG-002 | US-007 |
| HU-005 | Gestionar mis cuentas | FR-CUE-001/002/003 | US-008 |
| HU-006 | Ver el resumen del panel | FR-DAS-001 | US-001 |
| HU-007 | Ver los gráficos del panel | FR-DAS-002 | US-011 |
| HU-008 | Corregir un movimiento | FR-TRX-001 | US-010 |
| HU-009 | Elegir el período | FR-DAS-003 | US-012 |
| HU-010 | Límites del asistente | FR-IA-001 | US-013 |
| HU-011 | Proteger mis datos | NFR-SEG-001/002/003 | US-006 |
| HU-012 | Buscar y filtrar movimientos | FR-TRX-002 | US-014 |
| HU-013 | Gestionar categorías propias | FR-CAT-001 | US-015 |
| HU-014 | Preferencias de la interfaz | FR-CFG-001 | US-016 |
| HU-015 | Conversación continua con el asistente | FR-IA-001/002 | US-017 |
| HU-016 | Cambiar mi moneda principal | FR-CFG-003 | US-018 |
| HU-017 | Consultar el detalle de una cuenta | FR-CUE-004 | US-019 |
| HU-018 | Consultar el historial de movimientos | FR-TRX-004 | US-020 |
| HU-019 | Exportar movimientos a CSV | FR-TRX-003 | US-021 |
| HU-020 | Consultar el uso de las categorías | FR-CAT-002 | US-022 |
