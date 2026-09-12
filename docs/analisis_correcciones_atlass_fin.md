# Auditoría UX/UI y plan de correcciones — Atlass Fin

## Objetivo

Revisar y corregir las pantallas **Inicio**, **Reportes** e **Inversiones/Patrimonio** para que:

- la información sea consistente entre pantallas;
- cada pantalla responda una pregunta concreta del usuario;
- se eliminen duplicaciones;
- los gráficos aporten contexto real;
- el uso del espacio sea más eficiente;
- los conceptos financieros estén correctamente separados;
- las monedas y conversiones sean claras;
- los componentes reutilizables se compartan entre pantallas;
- la experiencia siga siendo limpia, simple y visualmente consistente con el diseño actual.

> **Importante:** no rediseñar la aplicación desde cero. Conservar el lenguaje visual actual: cards blancas, bordes suaves, verde como color principal, tipografía, sidebar, header y estilo general.

---

# 1. Problemas críticos detectados

## P0 — Inconsistencia en el cálculo de patrimonio / neto

Actualmente aparecen valores distintos para conceptos que visualmente parecen representar lo mismo:

- **Inicio / Reportes**
  - Patrimonio neto: **$64.942.000**
- **Inversiones**
  - Activos: **$102.000.000**
  - Inversiones: **$5.680.000**
  - Deudas: **$45.000.000**
  - Neto: **$62.680.000**

El cálculo de la pantalla de inversiones parece ser:

```text
102.000.000 + 5.680.000 - 45.000.000 = 62.680.000
```

Mientras que el patrimonio de Inicio parece incluir además saldos de cuentas.

### Corrección requerida

Definir **una sola fórmula de patrimonio neto** para toda la aplicación.

Recomendación:

```text
Patrimonio neto =
cuentas
+ activos
+ inversiones financieras
- deudas
```

Todos los lugares donde se muestre “Patrimonio neto” deben utilizar exactamente la misma definición.

Si la pantalla de Inversiones quiere mostrar un subtotal sin cuentas, no llamarlo simplemente **“Neto”**. Utilizar una etiqueta explícita, por ejemplo:

- “Neto de activos e inversiones”
- “Patrimonio invertido”
- o, preferentemente, incluir todas las cuentas y convertirlo realmente en Patrimonio neto.

### Criterio de aceptación

El mismo período y moneda deben producir exactamente el mismo valor de patrimonio neto en todas las pantallas.

---

## P0 — Inconsistencia de monedas en inversiones

En Inicio aparecen posiciones como:

```text
Bitcoin   US$ 3.200,00
Ethereum  US$ 2.480,00
```

Mientras que en la pantalla de Inversiones aparecen:

```text
Bitcoin   $ 3.200.000,00
Ethereum  $ 2.480.000,00
```

y el selector global está configurado en **ARS**.

Esto genera ambigüedad sobre:

- moneda original del activo;
- moneda de valuación;
- tipo de cambio;
- valor usado para calcular el patrimonio.

### Corrección requerida

Separar siempre:

1. **Tenencia original**
2. **Valor convertido a moneda base**

Ejemplo:

```text
Bitcoin
0,05 BTC

US$ 3.200
≈ ARS $3.200.000
+16,4%
```

El selector superior `ARS / USD` debe representar claramente la **moneda base del dashboard**, no cambiar de forma silenciosa la moneda nominal del activo.

### Criterio de aceptación

Nunca debe ser posible interpretar el mismo número como USD en una pantalla y ARS en otra.

---

# 2. Arquitectura de información

Actualmente se mezclan algunos conceptos:

- cuentas;
- metas;
- activos físicos;
- inversiones financieras;
- deudas;
- patrimonio;
- reportes.

La aplicación necesita una separación conceptual más clara.

## Pregunta que debería responder cada sección

| Sección | Pregunta principal |
|---|---|
| Inicio | ¿Cómo estoy financieramente? |
| Movimientos | ¿Qué pasó con mi dinero? |
| Presupuestos | ¿Estoy gastando según lo planeado? |
| Reportes | ¿Cómo evolucionan mis ingresos, gastos y ahorro? |
| Patrimonio | ¿Cuánto tengo realmente y de qué está compuesto? |
| Inversiones | ¿Cómo están rindiendo mis inversiones financieras? |

---

# 3. Inicio / Dashboard

## Estado actual

La pantalla tiene:

- Patrimonio neto
- variación
- ingresos
- gastos
- ahorro
- tasa de ahorro
- gráfico
- accesos rápidos
- cuentas
- una sección llamada “Inversiones” que contiene:
  - activos;
  - mercado;
  - deudas.

La base es buena, pero hay redundancia y mezcla de conceptos.

---

## 3.1 Mejorar la card principal

La card principal está bien jerarquizada, pero debe aprovechar mejor su espacio.

### Mantener

- Patrimonio neto como dato principal.
- Variación respecto del período anterior.
- Ingresos.
- Gastos.
- Ahorro.
- Tasa de ahorro.

### Mejorar

El gráfico actual se ve prácticamente plano.

Corregir la escala del gráfico para representar mejor la evolución del patrimonio.

No usar una escala que haga que variaciones pequeñas desaparezcan visualmente.

Para un sparkline se puede:

- calcular `min/max` a partir de los datos;
- agregar padding;
- evitar forzar el eje Y a cero cuando no sea necesario.

Debe seguir siendo honesto visualmente y no exagerar artificialmente los cambios.

### Interacción

Agregar tooltip al hover:

```text
Ago 2026
Patrimonio: $64.100.000
Variación: +1,2%
```

---

## 3.2 Accesos rápidos

Actualmente:

- Movimientos
- Presupuestos
- Reportes

En desktop estos accesos duplican exactamente la navegación lateral.

### Corrección recomendada

En desktop reemplazarlos por **acciones**, no navegación:

- Registrar movimiento
- Crear presupuesto
- Agregar inversión

O bien ocultarlos en desktop y conservarlos sólo donde la navegación lateral no esté disponible.

---

## 3.3 Separar “Cuentas” de “Metas”

Actualmente `Vacaciones` aparece dentro del mismo bloque que:

- Caja ARS
- Banco ARS
- Ahorro USD

Pero “Vacaciones” parece ser una meta de ahorro, no una cuenta.

### Corrección requerida

Separar visualmente:

```text
Cuentas
- Caja ARS
- Banco ARS
- Ahorro USD

Metas
- Vacaciones
  $120.000 de $500.000
  24%
```

Una meta puede indicar también:

```text
Faltan $380.000
```

---

## 3.4 Renombrar la sección inferior

La sección `Inversiones` contiene:

- activos físicos;
- inversiones de mercado;
- deudas.

Por lo tanto el nombre **Inversiones** no describe correctamente el contenido.

### Cambiar por

**Patrimonio**

y dividir:

```text
Patrimonio

Activos
- Departamento
- Auto

Inversiones financieras
- Bitcoin
- Ethereum

Deudas
- Hipoteca
```

---

# 4. Reportes

## 4.1 Eliminar duplicación de KPIs

Actualmente arriba aparecen:

- Ingresos
- Gastos
- Ahorro
- Tasa de ahorro

Y dentro de la card grande de Patrimonio neto vuelven a aparecer exactamente los mismos cuatro indicadores.

Esto agrega ruido y ocupa espacio sin aportar información nueva.

### Corrección requerida

Dejar los cuatro KPIs solamente una vez.

### Estructura recomendada

```text
Reportes

[Ingresos] [Gastos] [Ahorro] [Tasa de ahorro]

[Patrimonio neto]
$64.942.000
+8,7%

[gráfico de evolución de patrimonio]
```

La card de patrimonio debe concentrarse exclusivamente en:

- valor;
- variación;
- evolución temporal.

---

## 4.2 Mejorar el gráfico de patrimonio

El gráfico actual es visualmente casi plano.

### Agregar

- tooltip;
- puntos interactivos;
- escala adaptativa;
- comparación con período anterior cuando exista;
- fecha;
- valor.

Opcionalmente:

```text
Máximo del período: $65,2 M
Mínimo del período: $61,8 M
```

No es necesario mostrar siempre ejes completos si el diseño busca ser liviano.

---

## 4.3 Clarificar el período

Actualmente aparece:

```text
6 meses
Período 2026-04-01 a 2026-09-12 · 6m
```

Mejorar el texto para lenguaje de usuario:

```text
1 abr – 12 sep 2026
Últimos 6 meses
```

El selector debería soportar como mínimo:

- Este mes
- Mes anterior
- 3 meses
- 6 meses
- 1 año
- Personalizado

---

## 4.4 Presupuesto mensual vs filtro global

Existe un problema semántico cuando el filtro global está en `6 meses`, pero el widget dice:

> Presupuesto mensual — Uso actual del mes

Eso puede hacer pensar que el widget responde al período de seis meses.

### Corrección requerida

Hacer explícito que ese widget no depende del período global.

Ejemplo:

```text
Presupuesto de septiembre
Uso actual del mes
```

o incluir un pequeño badge:

```text
Mes actual
```

---

## 4.5 Agregar insights útiles

Reportes actualmente muestra datos pero explica poco.

Agregar un bloque compacto de **Cambios destacados**.

Ejemplo:

```text
Cambios destacados

↓ Gastaste $82.000 menos en Comida.
↑ Transporte aumentó $24.500.
↑ Tu tasa de ahorro subió 4,1 pp.
```

No hace falta IA. Estos insights pueden calcularse comparando el período actual con el anterior.

### Objetivo

Pasar de:

> “Gastaste $4.811.400”

a:

> “Gastaste 18% menos porque bajaron principalmente Comida y Servicios.”

---

## 4.6 Gastos por categoría

El donut debe acompañarse siempre de información textual.

Agregar leyenda ordenada por gasto:

```text
Comida        $1.200.000   25%
Vivienda      $950.000     20%
Transporte    $480.000     10%
...
```

No depender solamente del color para interpretar el gráfico.

---

# 5. Inversiones / Patrimonio

Esta pantalla es la que más necesita una corrección conceptual.

Actualmente el encabezado dice:

> Inversiones  
> Evolución y composición de tu patrimonio.

Pero después muestra:

- activos físicos;
- inversiones;
- deudas;
- composición de activos.

Esto no es solamente “Inversiones”.

---

## 5.1 Renombrar la pantalla

Recomendación principal:

```text
Patrimonio
Evolución y composición de tu patrimonio.
```

Ruta ideal:

```text
/reports/net-worth
```

No es obligatorio cambiar inmediatamente la URL si genera costo técnico, pero sí debe corregirse el concepto visible.

---

## 5.2 KPIs superiores

Actualmente:

- Activos
- Inversiones
- Deudas
- Neto

Si esta pantalla representa Patrimonio, deberían ser:

```text
Activos
Inversiones financieras
Deudas
Patrimonio neto
```

Además, cada dato debería tener variación cuando exista:

```text
Activos
$102.000.000
+1,8%

Inversiones
$5.680.000
+19,6%

Deudas
$45.000.000
-2,1%

Patrimonio neto
$64.942.000
+8,7%
```

---

## 5.3 Evolución

Actualmente se grafica solamente:

> Evolución de activos

Para una pantalla de Patrimonio es más útil mostrar:

> Evolución del patrimonio neto

Idealmente agregar un selector:

```text
Patrimonio | Activos | Deudas
```

### Tooltip

```text
Ago 2026

Patrimonio neto
$64.100.000

Activos
$103.500.000

Deudas
$45.200.000
```

---

## 5.4 Composición

Actualmente solamente aparecen:

- Propiedad
- Vehículo

Esto deja afuera:

- inversiones financieras;
- cuentas;
- efectivo;
- posiblemente otros activos.

### Opción recomendada

Mostrar la composición completa:

```text
Propiedades     74%
Vehículos       10%
Inversiones      8%
Efectivo         4%
Cuentas          4%
```

Si se desea mantener sólo los activos físicos, cambiar el título a:

> Composición de activos físicos

para no generar ambigüedad.

---

# 6. Inversiones financieras

La sección inferior con BTC y ETH es útil, pero necesita más contexto.

## Mostrar por posición

Ejemplo:

```text
Bitcoin
0,05 BTC

US$ 3.200
≈ ARS $3.200.000

+US$ 450
+16,4%
```

Y:

```text
Ethereum
0,8 ETH

US$ 2.480
≈ ARS $2.480.000

+US$ 480
+24,0%
```

---

## 6.1 Total de inversiones

Actualmente:

```text
Inversiones
$5.680.000
+$930.000 · +19,6%
```

Está bien como resumen.

Agregar, si los datos existen:

- capital invertido;
- ganancia / pérdida;
- rendimiento;
- última actualización.

Ejemplo:

```text
Valor actual
$5.680.000

Capital invertido
$4.750.000

Resultado
+$930.000
+19,6%
```

---

## 6.2 Cotizaciones desactualizadas

Actualmente aparece:

> 1 cotización desactualizada

Es un buen warning, pero falta identificar cuál.

### Corrección

Mostrar el warning directamente en la posición afectada:

```text
Ethereum ⚠
Cotización actualizada hace 14 h
```

Además mantener el resumen inferior:

```text
1 cotización desactualizada
```

El warning debe tener tooltip o detalle.

---

# 7. Gráficos

Aplicar un comportamiento consistente a todos los charts.

## Reglas

Todos los gráficos temporales deben:

- responder al período global;
- tener tooltip;
- mostrar fecha;
- mostrar valor;
- utilizar la misma lógica de formato monetario;
- manejar correctamente series con pocos datos;
- evitar líneas visualmente planas por escalas incorrectas;
- mostrar empty state cuando no haya información suficiente.

---

## Empty state

Ejemplo:

```text
Todavía no hay suficiente historial

Necesitamos al menos dos puntos de valuación
para mostrar la evolución.
```

No dibujar un gráfico vacío sin explicación.

---

# 8. Uso del espacio

El diseño actual es limpio, pero algunas cards usan mucho espacio para poco contenido.

## Regla de diseño

Una card grande debería contener al menos uno de estos elementos:

- gráfico;
- comparación;
- distribución;
- acción importante;
- información secundaria relevante.

Si sólo contiene números, debe ser más compacta.

### Aplicar especialmente a

- resumen de Inicio;
- patrimonio en Reportes;
- evolución en Patrimonio/Inversiones.

---

# 9. Consistencia de terminología

Usar siempre los mismos nombres.

## Propuesta

| Concepto | Nombre |
|---|---|
| Total final | Patrimonio neto |
| Propiedad / Auto | Activos |
| BTC / ETH / acciones | Inversiones financieras |
| Hipoteca / préstamos | Deudas |
| Banco / billetera / efectivo | Cuentas |
| Vacaciones / objetivo de ahorro | Metas |

Evitar llamar “Inversiones” a una sección que incluye activos físicos y deudas.

---

# 10. Navegación

Actualmente `Inversiones` se abre desde Reportes y el sidebar mantiene `Reportes` seleccionado.

Esto es correcto si la pantalla es una subsección, pero falta indicar claramente dónde está el usuario.

## Agregar navegación secundaria

Ejemplo:

```text
Reportes
General | Patrimonio
```

o:

```text
Reportes / Patrimonio
```

Si en el futuro existe una pantalla real de inversiones:

```text
General | Patrimonio | Inversiones
```

---

# 11. Botón “Inversiones” en Reportes

Actualmente aparece junto a:

- Widgets
- Editar

Pero `Widgets` y `Editar` son acciones, mientras que `Inversiones` es navegación.

No deben tener la misma jerarquía semántica.

### Corregir

Mover `Patrimonio` a navegación secundaria.

Mantener a la derecha solamente acciones:

```text
Widgets
Editar
```

---

# 12. Moneda base

El selector superior debe tener un comportamiento coherente en toda la aplicación.

## Regla

Si el usuario selecciona `ARS`:

- KPIs globales → ARS;
- patrimonio → ARS;
- gráficos → ARS;
- equivalentes de inversiones → ARS.

Pero las posiciones pueden conservar la cantidad y moneda original:

```text
0,05 BTC
US$ 3.200
≈ ARS $3.200.000
```

Esto evita perder información financiera importante.

---

# 13. Formato monetario

Centralizar el formato.

Ejemplos:

```text
ARS
$ 5.870.000,00

USD
US$ 3.200,00
```

No mezclar:

```text
$ 3.200.000
```

con

```text
US$ 3.200
```

sin indicar que se trata de una conversión.

Crear/utilizar una única utilidad o componente para moneda:

```tsx
<Money
  amount={value}
  currency="ARS"
/>
```

---

# 14. Responsive

Verificar al menos:

- 1440 px
- 1280 px
- tablet
- mobile

En desktop:

- evitar accesos rápidos que duplican el sidebar;
- asegurar que charts y cards aprovechen el ancho;
- evitar cards excesivamente altas.

En mobile:

- permitir scroll horizontal controlado sólo cuando sea estrictamente necesario;
- convertir grids de cuatro KPIs a 2×2 o 1 columna;
- mantener el dato principal siempre visible.

---

# 15. Componentización requerida

No resolver cada pantalla con componentes específicos duplicados.

Buscar y reutilizar abstracciones.

## Componentes sugeridos

```text
PageHeader
PeriodSelector
CurrencySelector

MetricCard
MetricGrid

NetWorthSummary
TrendBadge
Money

ChartCard
TimeSeriesChart

SectionCard
SectionHeader

AccountList
AssetList
DebtList
InvestmentList

AllocationBar
AllocationList

EmptyState
WarningBadge
```

---

## Ejemplo

En vez de repetir:

```tsx
<div>
  <span>Ingresos</span>
  <strong>$...</strong>
</div>
```

usar:

```tsx
<MetricCard
  label="Ingresos"
  value={income}
  tone="positive"
/>
```

La misma estructura debe servir en Inicio, Reportes y Patrimonio.

---

# 16. Layout compartido

Evitar que cada página vuelva a definir:

- ancho máximo;
- padding;
- gaps;
- header;
- sidebar;
- selectors superiores.

Crear o reutilizar un layout común.

Ejemplo conceptual:

```tsx
<AppLayout>
  <PageHeader />
  <PageContent>
    ...
  </PageContent>
</AppLayout>
```

---

# 17. Prioridades de implementación

## P0 — Corregir antes que cualquier mejora visual

1. Unificar cálculo de patrimonio neto.
2. Resolver inconsistencia ARS/USD.
3. Unificar formatos monetarios.
4. Corregir la semántica `Inversiones / Patrimonio`.

---

## P1 — UX principal

5. Eliminar KPIs duplicados de Reportes.
6. Mejorar escalas y tooltips de gráficos.
7. Separar Cuentas y Metas.
8. Renombrar la sección inferior de Inicio.
9. Clarificar el widget mensual cuando el período global es mayor a un mes.
10. Mejorar navegación Reportes → Patrimonio.

---

## P2 — Valor agregado

11. Agregar insights de cambios destacados.
12. Mejorar detalle de inversiones financieras.
13. Mejorar warnings de cotizaciones.
14. Mostrar composición completa del patrimonio.
15. Revisar accesos rápidos del dashboard.

---

# 18. Criterios de aceptación globales

La tarea se considera terminada cuando:

- [ ] El patrimonio neto utiliza una única definición.
- [ ] Inicio, Reportes y Patrimonio muestran el mismo patrimonio para el mismo contexto.
- [ ] Las conversiones de moneda son explícitas.
- [ ] No existe ningún valor que pueda interpretarse simultáneamente como ARS y USD.
- [ ] Reportes no repite los mismos KPIs dos veces.
- [ ] La pantalla de patrimonio no se llama “Inversiones” si incluye activos y deudas.
- [ ] Las metas no están mezcladas con cuentas.
- [ ] Los gráficos temporales tienen tooltip.
- [ ] Los gráficos tienen una escala útil.
- [ ] El período global funciona consistentemente.
- [ ] Los widgets que ignoran el período global lo indican explícitamente.
- [ ] Los estados vacíos están diseñados.
- [ ] Los warnings de cotización identifican el activo afectado.
- [ ] Los componentes repetidos fueron abstraídos.
- [ ] No se duplicaron layouts entre páginas.
- [ ] Desktop y mobile mantienen una jerarquía clara.

---

# 19. Resultado esperado

La aplicación debe dejar de sentirse como un conjunto de dashboards aislados y pasar a contar una historia financiera coherente:

```text
Inicio
→ cómo estoy.

Reportes
→ cómo estoy gastando y ahorrando.

Patrimonio
→ cuánto tengo realmente y cómo está compuesto.

Inversiones
→ cuánto invertí y cuánto estoy ganando o perdiendo.
```

El objetivo no es agregar más información indiscriminadamente.

El objetivo es que **cada número tenga contexto, cada pantalla tenga una función clara y toda la aplicación utilice la misma verdad financiera**.
