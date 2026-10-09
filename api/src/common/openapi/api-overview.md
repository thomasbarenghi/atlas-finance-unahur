# Algoritmos de cálculo

Atlass Fin centraliza todas las fórmulas de negocio en `calculations.service` para que el dashboard, los reportes, los presupuestos y el asistente de IA usen **exactamente las mismas reglas** (CAL-001..010, NFR-CAL-004). Todos los importes se expresan en la **moneda base** del usuario (`users.base_currency`).

> [!note]
> Los **objetivos de ahorro no se suman** al patrimonio neto (FR-OBJ-005).

## Resumen

| Regla | Fórmula |
| :--- | :--- |
| **CAL-001 · Patrimonio neto** | Σ activos + Σ posiciones + Σ saldos netos de cuentas − Σ deudas |
| **CAL-002 · Flujo de fondos** | Σ ingresos − Σ gastos del período (excluye transferencias) |
| **CAL-003 · Transferencias** | Las transferencias no impactan ingresos ni gastos consolidados |
| **CAL-004 · Consumo de presupuesto** | Σ gastos de la categoría y período ÷ límite × 100 (si el límite es 0, no se divide) |
| **CAL-005 · Valor de posición** | cantidad × último precio válido |
| **CAL-006 · Ganancia nominal** | valor actual − (cantidad × costo promedio) |
| **CAL-007 · Progreso de objetivo** | acumulado ÷ meta × 100 (mínimo 0 %, sin techo) |
| **CAL-008 · Conversión**¹ | importe × última tasa válida a la fecha de cálculo |
| **CAL-009 · Trazabilidad**¹ | cada conversión registra par, tasa, proveedor y fecha (`exchange_rates`) |
| **CAL-010 · Tasa de ahorro** | ahorro del período ÷ ingresos del período × 100 (0 si no hay ingresos) |

¹ Fuera del alcance publicado de la v0.2.

## Notas

- **CAL-002 / CAL-003:** las transferencias crean dos movimientos atómicos con el mismo `transfer_group_id`; se excluyen de la consolidación de ingresos y gastos para no inflar el flujo.
- **CAL-004:** el estado del presupuesto se deriva del porcentaje consumido (`available`; `warning` al superar el umbral configurable; `exceeded` por encima del 100 %).
- **CAL-007:** el progreso nunca es negativo y puede superar el 100 %.
- **CAL-010:** la variación se expresa en **puntos porcentuales** (`savingsRateDeltaPp`).

## Ejemplo — patrimonio neto

```text
netWorth = assetsValue + positionsValue + accountsValue - debtsValue
```

donde `accountsValue` es la suma de los saldos actuales (saldo inicial + movimientos) de las cuentas no archivadas.
