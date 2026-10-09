# Auditoría UX/UI v2 — Atlass Fin

## Alcance

Nueva revisión basada en las capturas actualizadas de:

- Inicio / Dashboard
- Movimientos
- Presupuestos
- Reportes
- Patrimonio

El objetivo de esta auditoría es identificar:

- qué problemas de la revisión anterior ya quedaron resueltos;
- qué inconsistencias siguen existiendo;
- qué problemas nuevos aparecen al ver el producto completo;
- qué correcciones debería ejecutar un agente;
- prioridades y criterios de aceptación.

> No rediseñar el producto desde cero. Conservar el lenguaje visual actual y mejorar consistencia, semántica, legibilidad y utilidad.

---

# 1. Resumen ejecutivo

La nueva versión mejoró mucho respecto de la anterior.

Se corrigieron varios problemas importantes:

- `Inversiones` pasó a tener una representación conceptual mucho más cercana a `Patrimonio`.
- `Metas` ya no está mezclado con `Cuentas`.
- Los accesos rápidos del Inicio ahora son acciones reales:
  - Registrar movimiento
  - Crear presupuesto
  - Agregar inversión
- Reportes eliminó la duplicación de KPIs dentro de la card principal.
- Reportes incorpora navegación `General / Patrimonio`.
- El widget de presupuesto aclara que corresponde a septiembre y que no depende del período global.
- La pantalla de Patrimonio ya muestra:
  - activos;
  - inversiones financieras;
  - deudas;
  - patrimonio neto;
  - evolución;
  - composición;
  - capital invertido;
  - resultado;
  - moneda original de BTC/ETH;
  - equivalencia aproximada en ARS;
  - warning de cotización desactualizada.
- Los gráficos principales ya tienen una curva más informativa y no parecen completamente planos.

La arquitectura está mucho mejor.

Sin embargo, todavía quedan algunos problemas funcionales y semánticos importantes.

El más crítico sigue siendo la **consistencia matemática del patrimonio**.

---

# 2. P0 — El patrimonio neto todavía no cierra matemáticamente

En la pantalla de Patrimonio aparecen:

```text
Activos                  $102.000.000
Inversiones financieras    $5.680.000
Cuentas                    $2.572.000
Deudas                    -$45.000.000
```

Si estos elementos forman el patrimonio mostrado:

```text
102.000.000
+ 5.680.000
+ 2.572.000
- 45.000.000
= 65.252.000
```

Pero el producto muestra:

```text
Patrimonio neto
$64.942.000
```

Existe una diferencia de:

```text
$310.000
```

Esa diferencia coincide exactamente con la cuenta negativa:

```text
Caja ARS
-$310.000
```

Esto sugiere que probablemente:

- la composición de `Cuentas` está sumando sólo saldos positivos;
- mientras el patrimonio neto sí incluye la cuenta negativa.

De ser así, ambos componentes están usando definiciones distintas.

## Corrección requerida

Definir una función única de balance patrimonial.

Ejemplo conceptual:

```text
cuentasNetas =
suma de TODOS los saldos de cuentas convertidos a moneda base

patrimonioNeto =
activos
+ inversionesFinancieras
+ cuentasNetas
- deudas
```

La misma función debe alimentar:

- Inicio
- Reportes
- Patrimonio
- composición
- KPIs
- gráficos

## Importante

No mostrar:

```text
Cuentas $2.572.000
```

si ese número representa sólo cuentas con balance positivo.

Debe representar el neto real de las cuentas:

```text
Banco ARS
+ Ahorro USD convertido
+ Caja ARS negativa
```

o bien cambiar explícitamente el concepto a:

```text
Cuentas con saldo positivo
```

pero esa segunda opción no es recomendable para composición patrimonial.

## Criterio de aceptación

La suma de los componentes visibles debe poder reconstruir exactamente el patrimonio neto mostrado.

---

# 3. P0 — “Composición del patrimonio” no representa realmente el patrimonio neto

Actualmente la composición muestra:

- Propiedades
- Vehículos
- Inversiones
- Cuentas

pero no muestra las deudas.

Los porcentajes se calculan sobre los activos brutos.

Eso significa que el gráfico representa en realidad:

> composición de activos

y no:

> composición del patrimonio neto

## Corrección recomendada

Renombrar:

```text
Composición del patrimonio
```

a:

```text
Composición de activos
```

Subtítulo:

```text
Distribución del valor bruto de tus activos.
```

Mantener las deudas fuera del porcentaje de composición.

Debajo se puede agregar:

```text
Activos brutos      $110.252.000
Deudas              -$45.000.000
Patrimonio neto      $64.942.000
```

una vez corregido el cálculo real.

Esto es conceptualmente más claro que intentar representar activos positivos y deuda negativa dentro de un mismo porcentaje circular o barra.

---

# 4. Arquitectura global del header

Actualmente el header cambia según la pantalla.

## Inicio / Reportes / Patrimonio

Muestran:

```text
[6 meses]                       [ARS] [tema] [usuario]
```

## Movimientos / Presupuestos

Muestran solamente:

```text
                                [tema] [usuario]
```

Esto genera una duda de arquitectura:

> ¿`6 meses` y `ARS` son preferencias globales o filtros específicos de una pantalla?

Actualmente se sienten globales porque están en el chrome superior, pero no están disponibles en todas las páginas.

## Recomendación

Separar claramente:

### Header global

Mantener siempre:

```text
Moneda base | Tema | Usuario
```

si la moneda es realmente una preferencia global.

### Filtros específicos de pantalla

Mover el período al contenido de cada página:

Inicio:

```text
Tu resumen                     [6 meses]
```

Reportes:

```text
Reportes                       [6 meses]
```

Patrimonio:

```text
Patrimonio                     [6 meses]
```

Presupuestos:

```text
Presupuestos                   [sept 2026]
```

Movimientos:

```text
Movimientos                    [Fecha / filtros]
```

Esto hace que el alcance de cada filtro sea obvio.

## Alternativa

Si se desea conservar el período en el header, debe existir una regla consistente para todas las pantallas y explicar por qué algunas lo ignoran.

La primera opción es más clara.

---

# 5. Inicio / Dashboard

## Lo que mejoró

La pantalla ahora tiene una jerarquía mucho más coherente:

```text
Resumen
→ Acciones rápidas
→ Cuentas
→ Metas
→ Patrimonio
```

Esta estructura funciona bien.

---

## 5.1 Card de patrimonio principal

La card ahora aprovecha mucho mejor el espacio.

El sparkline tiene una variación visible y aporta información.

### Mantener

- patrimonio neto;
- variación;
- ingresos;
- gastos;
- ahorro;
- tasa de ahorro;
- evolución.

### Agregar

Tooltip al hover:

```text
Ago 2026

Patrimonio
$62.850.000

Variación
+3,1%
```

No es necesario agregar ejes completos porque funciona correctamente como resumen.

---

## 5.2 Acciones rápidas

El cambio es correcto.

Actualmente:

- Registrar movimiento
- Crear presupuesto
- Agregar inversión

Es mucho mejor que duplicar las opciones del sidebar.

### Mejora menor

Revisar si `Agregar inversión` es suficientemente general.

Como el usuario también puede tener:

- propiedades;
- vehículos;
- deudas;
- cuentas;

podría ser más útil:

```text
Agregar al patrimonio
```

y abrir un selector:

```text
Cuenta
Activo
Inversión
Deuda
```

Si el flujo real de alta de inversiones es importante, mantener `Agregar inversión`.

No es un blocker.

---

# 6. Cuentas

La separación respecto de Metas es correcta.

## Problema

Hay una cuenta negativa:

```text
Caja ARS
-$310.000
```

Esto es válido, pero debería quedar claro si representa:

- descubierto;
- saldo real negativo;
- deuda;
- error de conciliación.

No mover automáticamente una cuenta negativa a `Deudas`, porque puede seguir siendo una cuenta.

Pero el balance negativo debe entrar correctamente en el cálculo patrimonial.

## Mejora opcional

Agregar semántica visual suave:

```text
Caja ARS
Saldo negativo
-$310.000
```

No depender sólo del signo.

---

# 7. Metas

La nueva sección está correctamente separada.

Actualmente:

```text
Vacaciones
$120.000 de $500.000
24%
Faltan $380.000
En curso
```

Es una presentación clara y accionable.

## Mejora recomendada

Agregar fecha objetivo si existe:

```text
Objetivo: enero 2027
```

y opcionalmente:

```text
Necesitás ahorrar $76.000/mes
```

si el usuario definió una fecha.

No agregar este dato si no existe una meta temporal.

---

# 8. Patrimonio dentro de Inicio

La nueva estructura:

```text
Activos
Inversiones financieras
Deudas
```

es conceptualmente correcta.

## Mejora

Agregar un link explícito:

```text
Ver patrimonio completo →
```

Aunque toda la fila pueda ser clickeable, un CTA visible ayuda a descubrir la pantalla detallada.

---

# 9. Movimientos

La pantalla está bien resuelta para el alcance actual.

Tiene:

- búsqueda;
- listado;
- paginación;
- menú por fila;
- crear movimiento.

No agregar filtros adicionales. La combinación actual de búsqueda + paginación es suficiente y mantiene la pantalla simple.

---

## 9.1 Transferencias duplicadas

Actualmente una transferencia `Reserva mensual` aparece como dos movimientos:

```text
-$150.000
Banco ARS → Caja ARS

+$150.000
Caja ARS ← Banco ARS
```

Desde un punto de vista contable interno puede tener sentido almacenar dos legs.

Desde UX produce ruido.

### Recomendación

Representar una transferencia como una sola fila:

```text
Reserva mensual
Banco ARS → Caja ARS
$150.000
Transferencia
```

El importe debería ser neutral, no verde/rojo.

### Regla funcional crítica

Las transferencias entre cuentas propias:

- no deben contar como ingreso;
- no deben contar como gasto;
- no deben afectar ahorro;
- no deben afectar reportes de categoría;
- no deben modificar patrimonio neto.

Sólo cambian la distribución entre cuentas.

---

## 9.2 CTA de alta

El botón circular `+` es reconocible, pero en desktop hay espacio suficiente.

Preferible:

```text
+ Nuevo movimiento
```

en lugar de un ícono aislado.

En mobile sí puede reducirse a FAB.

---

## 9.3 Agrupación temporal

Opcionalmente agrupar por:

```text
Hoy
Ayer
Esta semana
Septiembre 2026
```

Para 98 registros mejora muchísimo la lectura.

No implementar si complica excesivamente el listado o la paginación actual.

---

# 10. Presupuestos

La estructura general es buena y las cards son fáciles de comparar.

Pero hay varios problemas semánticos.

---

## 10.1 Barras de progreso usan verde para todos los estados

Ejemplos:

```text
Vivienda     94,7%    Advertencia
Comida      120%      Excedido
Transporte   88%      Advertencia
```

Sin embargo, las barras continúan verdes.

Esto contradice la semántica de estado.

## Corrección requerida

Usar estados coherentes:

```text
Disponible   → verde / neutral positivo
Advertencia  → ámbar
Excedido     → rojo
```

No depender sólo del color: conservar los badges textuales.

---

## 10.2 Presupuesto excedido

Actualmente:

```text
Disponible
-$30.000
```

Esto es matemáticamente correcto pero poco natural.

Para una categoría excedida utilizar:

```text
Excedido por
$30.000
```

En vez de:

```text
Disponible
-$30.000
```

Esto elimina interpretación mental innecesaria.

---

## 10.3 Barra al superar 100%

Cuando el consumo llega a 120%, una barra tradicional que se limita visualmente al 100% pierde información.

Mostrar:

```text
120%
```

y usar el estado rojo.

Opcionalmente agregar un pequeño indicador de exceso.

No es necesario extender físicamente la barra fuera del container.

---

## 10.4 “Período 2026-09”

La card ya está dentro de:

```text
sept 2026
```

por lo que:

```text
Período
2026-09
```

es redundante y técnico.

Eliminarlo o reemplazarlo por algo útil.

Ejemplos:

```text
Restan 18 días
```

o:

```text
Promedio diario disponible
$1.111
```

---

## 10.5 Falta un resumen global del mes

Antes del grid agregar una síntesis compacta:

```text
Presupuesto total     $780.000
Gastado               $744.000
Disponible             $36.000
Categorías excedidas          1
```

Esto convierte la pantalla en una herramienta de decisión y no sólo en una colección de cards.

---

## 10.6 Orden de categorías

Actualmente las categorías no parecen ordenadas por gravedad.

Considerar:

```text
Excedido
Advertencia
Disponible
```

o permitir:

```text
Ordenar por:
Estado
Mayor consumo
Categoría
```

No es obligatorio si existe un orden personalizado del usuario.

---

# 11. Reportes — General

Esta pantalla mejoró de forma importante.

## Lo que está bien

- Navegación `General / Patrimonio`.
- KPIs ya no se repiten.
- Período explicado en lenguaje humano.
- Presupuesto de septiembre aclara que no depende del período global.
- Donut incluye leyenda y valores.
- Jerarquía mucho más limpia.

---

# 12. KPIs de Reportes

Actualmente:

- Ingresos
- Gastos
- Ahorro
- Tasa de ahorro

Falta contexto comparativo.

## Mejora recomendada

Mostrar variación respecto del período anterior.

Ejemplo:

```text
Ingresos
$5.870.000
-4,2% vs. período anterior
```

```text
Ahorro
$1.058.600
+18,7%
```

Para tasa de ahorro utilizar puntos porcentuales cuando corresponda:

```text
18%
+3,2 pp
```

---

# 13. Card de patrimonio en Reportes

La simplificación fue correcta.

Ahora la card responde una sola pregunta:

> ¿Cómo evolucionó mi patrimonio?

Mantener esta dirección.

## Mejoras menores

Agregar tooltip.

Opcionalmente mostrar:

```text
Inicio del período
$59,9 M

Actual
$64,9 M

Cambio
+$5,0 M
```

No agregar los cuatro KPIs nuevamente.

---

# 14. Presupuesto dentro de Reportes

La aclaración:

```text
Presupuesto de septiembre
Mes actual · no depende del período global.
```

resuelve correctamente la ambigüedad anterior.

## Problema restante

Las barras siguen usando verde incluso para:

- advertencia;
- excedido.

Aplicar el mismo componente semántico que en la página Presupuestos.

No implementar dos versiones distintas.

---

# 15. Ingresos vs. gastos

El gráfico funciona, pero le falta lectura cuantitativa.

## Agregar

Tooltip:

```text
Jul 2026

Ingresos
$1.120.000

Gastos
$980.000

Balance
+$140.000
```

Opcionalmente resaltar meses donde:

```text
gastos > ingresos
```

sin depender únicamente del color.

---

# 16. Gastos por categoría

La nueva leyenda mejora muchísimo la utilidad.

Está correctamente ordenada de mayor a menor.

## Mejoras

- tooltip al hover;
- resaltado coordinado entre segmento y fila;
- considerar agrupar categorías muy pequeñas dentro de `Otros` si el número aumenta mucho.

Por ejemplo:

```text
Otros
$134.000 · 2,8%
```

Evitar donuts con 15 segmentos diminutos.

---

# 17. Falta todavía una capa de insights

Reportes sigue respondiendo muy bien:

> qué pasó

pero podría responder mejor:

> por qué pasó

Agregar un bloque pequeño debajo de los gráficos:

```text
Cambios destacados

↓ Comida bajó $82.000 vs. período anterior.
↑ Vivienda aumentó $140.000.
↑ Tu tasa de ahorro mejoró 3,2 pp.
```

No necesita IA.

Puede generarse mediante reglas.

No convertirlo en una lista larga.

Máximo 3–4 insights relevantes.

---

# 18. Patrimonio

La nueva pantalla es mucho más sólida conceptualmente.

La estructura:

```text
KPIs
→ Evolución
→ Composición
→ Inversiones financieras
```

funciona bien.

---

# 19. Navegación `General / Patrimonio`

Actualmente aparece:

```text
Título: Patrimonio

[General] [Patrimonio]
```

Existe una ligera redundancia porque:

- la página ya se llama Patrimonio;
- la tab seleccionada también dice Patrimonio.

No es grave.

## Alternativas

### Opción A — Mantener

Mantener si se quiere dejar muy clara la pertenencia a Reportes.

### Opción B — Más limpia

Título:

```text
Reportes
```

Tabs:

```text
General | Patrimonio
```

y dentro:

```text
Patrimonio
Evolución y composición...
```

### Opción C

Usar breadcrumb:

```text
Reportes / Patrimonio
```

y eliminar tabs dentro de la página si la navegación está resuelta de otra forma.

No cambiar si genera más complejidad que beneficio.

---

# 20. KPIs de Patrimonio

Muy buena mejora.

Actualmente:

- Activos
- Inversiones financieras
- Deudas
- Patrimonio neto

Esto es entendible.

## Mejora

Agregar variación también a Deudas si existe histórico.

Ejemplo:

```text
Deudas
$45.000.000
-2,1% vs. ant.
```

Tener 3 cards con delta y una sin delta se siente incompleto.

---

# 21. Evolución del patrimonio

La selección:

```text
Patrimonio | Activos | Deudas
```

es una buena decisión.

## Corregir

Asegurar que:

- Patrimonio use la fórmula completa;
- Activos no incluya deudas;
- Deudas tenga su propia serie;
- todas respondan al mismo rango temporal.

## Agregar tooltip

```text
Ago 2026

Patrimonio
$63.800.000
```

Los indicadores:

```text
Máximo
Mínimo
```

son útiles y pueden mantenerse.

---

# 22. Composición

Renombrar:

```text
Composición del patrimonio
```

a:

```text
Composición de activos
```

por las razones matemáticas explicadas antes.

## También corregir Cuentas

La cifra utilizada aquí debe ser el balance neto real si pretende formar parte de la ecuación patrimonial.

---

# 23. Inversiones financieras

Esta sección ahora es una de las partes más completas del producto.

Actualmente informa:

- valor actual;
- capital invertido;
- resultado;
- rendimiento;
- composición;
- cantidad de BTC/ETH;
- valor original en USD;
- equivalente en ARS;
- rendimiento;
- warning de cotización.

Muy buena dirección.

---

# 24. Warning de cotización desactualizada

Actualmente:

```text
ETH Ethereum ⚠ Desactualizada
```

y:

```text
1 cotización desactualizada
```

Está bien.

Falta saber cuánto.

## Agregar

```text
Actualizada hace 14 h
```

o:

```text
Última cotización:
11 sep · 18:32
```

El usuario puede decidir si el dato sigue siendo confiable.

---

# 25. Rentabilidad de inversiones

Asegurar que:

```text
Resultado
+$930.000
+19,6%
```

se calcule en una base consistente.

Definir explícitamente si:

```text
resultado = valor actual - capital invertido
```

y cómo se trata:

- variación de moneda;
- depósitos/retiros;
- comisiones.

Si el producto es simple, no hace falta exponer toda esta lógica al usuario, pero la implementación debe ser consistente.

---

# 26. Estado activo del sidebar

En distintas capturas el item seleccionado parece utilizar estilos ligeramente distintos:

- fondo gris;
- borde;
- combinación de ambos.

Revisar que el estado activo sea exactamente el mismo en:

- Inicio
- Movimientos
- Presupuestos
- Reportes
- Ajustes

Crear un único componente / variante.

---

# 27. Componentización

La nueva versión ya evidencia componentes repetibles.

Asegurarse de no mantener implementaciones paralelas.

## Reutilizar exactamente el mismo componente para:

### BudgetProgress

Usado en:

- Presupuestos
- Reportes

Debe resolver:

- available;
- warning;
- exceeded;
- porcentaje;
- label;
- semántica;
- color.

---

### Money

Usado en toda la aplicación.

Debe resolver:

- ARS;
- USD;
- signo;
- equivalencias;
- decimales;
- símbolo;
- negativos.

---

### Trend

Debe resolver:

```text
+8,3% vs. ant.
-4,2% vs. ant.
+3,2 pp
```

---

### TimeSeriesChart

Debe reutilizarse en:

- Inicio
- Reportes
- Patrimonio

con variantes:

```text
sparkline
full
```

pero con:

- misma lógica de escala;
- mismo tooltip;
- mismo formatter;
- mismos datos base.

---

### FinancialRow

Puede servir para:

- cuentas;
- activos;
- inversiones;
- deudas;
- movimientos;

con variantes bien definidas, evitando cinco estructuras HTML casi iguales.

---

# 28. Prioridades

## P0 — Datos / lógica

1. Corregir la ecuación de patrimonio neto.
2. Corregir el valor de `Cuentas` usado en composición.
3. Renombrar `Composición del patrimonio` a `Composición de activos`.
4. Garantizar que transferencias internas no afecten ingresos, gastos, ahorro ni patrimonio.
5. Centralizar formato y conversión de monedas.

---

## P1 — UX funcional

6. Representar transferencias como una sola operación visual.
7. Corregir semántica de estados en barras de Presupuestos.
8. Mostrar `Excedido por $X` en lugar de `Disponible -$X`.
9. Agregar resumen mensual a Presupuestos.
10. Agregar tooltips consistentes a gráficos.
11. Definir una arquitectura consistente para header global vs. filtros de página.

---

## P2 — Mejora de interpretación

12. Agregar deltas a KPIs de Reportes.
13. Agregar delta a Deudas.
14. Agregar insights de cambios destacados.
15. Agregar timestamp a cotizaciones desactualizadas.
16. Agregar CTA `Ver patrimonio completo`.
17. Revisar estado activo del sidebar.
18. Considerar agrupación temporal en Movimientos.

---

# 29. Criterios de aceptación globales

- [ ] La suma visible de componentes patrimoniales coincide con el patrimonio neto.
- [ ] Una cuenta negativa se incluye correctamente en el patrimonio.
- [ ] `Composición de activos` representa exactamente la base sobre la que calcula sus porcentajes.
- [ ] Transferencias internas no alteran ingresos/gastos.
- [ ] Una transferencia no aparece como dos operaciones visuales salvo que exista una razón explícita.
- [ ] Presupuestos usa estados visuales coherentes para disponible, advertencia y excedido.
- [ ] Un presupuesto excedido dice `Excedido por` y no `Disponible negativo`.
- [ ] Reportes y Presupuestos reutilizan el mismo componente de progreso.
- [ ] Todos los gráficos importantes tienen tooltip.
- [ ] La moneda base se interpreta de forma consistente.
- [ ] BTC/ETH conserva cantidad y moneda original además de equivalencia.
- [ ] Una cotización desactualizada muestra cuándo fue actualizada por última vez.
- [ ] Header y filtros tienen un alcance conceptual claro.
- [ ] El estado activo del sidebar es consistente.
- [ ] No existen componentes visualmente iguales implementados por separado.

---

# 30. Resultado esperado

La nueva versión ya está cerca de una arquitectura consistente.

La siguiente iteración no debería centrarse en agregar más cards.

Debería centrarse en tres cosas:

```text
1. Que todos los números cierren matemáticamente.
2. Que cada estado comunique exactamente qué significa.
3. Que el usuario pueda investigar el dato cuando necesite más detalle.
```

La jerarquía general ya funciona.

Ahora el salto de calidad está en pasar de una interfaz visualmente correcta a una herramienta financiera confiable y explicable.
