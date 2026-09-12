# Prompt — Evolución de la experiencia de Patrimonio

Quiero que revises y mejores profundamente toda la experiencia de **Patrimonio**.

Hoy Cuentas y Metas tienen páginas de detalle útiles, pero los elementos patrimoniales —activos, inversiones financieras y deudas— están tratados casi como simples registros CRUD: desde el dashboard sólo se pueden editar mediante modales muy básicos.

La idea es que Patrimonio tenga una experiencia propia, coherente con el resto de la aplicación y que realmente aporte información financiera al usuario.

## Objetivo

Cada elemento del patrimonio debe dejar de ser simplemente “nombre + monto + editar” y pasar a responder preguntas útiles:

- ¿Cuánto vale hoy?
- ¿Cuánto valía antes?
- ¿Cuánto gané o perdí?
- ¿Cuánto de ese activo realmente es mío si tiene deuda?
- ¿Cuándo fue actualizado?
- ¿Cómo impacta en mi patrimonio?
- ¿Qué información relevante tengo asociada?

No agregues información decorativa ni campos porque sí. Priorizá datos que tengan valor financiero real.

---

# 1. Crear páginas de detalle propias

Activos, inversiones y deudas deben ser navegables desde el dashboard y desde Reportes > Patrimonio.

Crear una estructura consistente, por ejemplo:

- `/patrimony/assets/:id`
- `/patrimony/investments/:id`
- `/patrimony/debts/:id`

o una arquitectura equivalente que encaje mejor con el proyecto.

La fila completa debe ser clickeable y llevar a su detalle.

Mantener acciones secundarias como `...` sólo para acciones rápidas, no como única forma de acceder al elemento.

---

# 2. Página de detalle de un activo

Ejemplo: Departamento / Auto.

La página debería tener una cabecera similar a las páginas de Cuentas:

```text
Departamento
Propiedad · ARS

$90.000.000
+5,2% desde la valuación anterior
Actualizado 1 sep 2026
```

Luego mostrar información realmente útil.

## Resumen

- Valor actual
- Valor anterior
- Variación absoluta
- Variación porcentual
- Fecha de última valuación

## Evolución

Agregar un gráfico de valuación histórica.

Ejemplo:

```text
Evolución del valor

Mar      $82 M
Jun      $86 M
Sep      $90 M
```

Debe tener tooltip y utilizar el mismo sistema de charts que el resto del producto.

## Patrimonio real del activo

Si existe deuda vinculada:

```text
Valor del activo       $90.000.000
Deuda asociada        -$45.000.000
────────────────────────────────
Valor neto             $45.000.000
```

Este bloque es especialmente importante.

Si una hipoteca está vinculada al Departamento, el usuario debería poder entender inmediatamente cuánto equity tiene realmente sobre ese activo.

La deuda debe ser clickeable y llevar a su detalle.

## Información

Mostrar, cuando exista:

- tipo;
- moneda;
- fecha de valuación;
- notas;
- deuda asociada.

Evitar llenar la pantalla con metadata innecesaria.

---

# 3. Historial de valuaciones

No quiero que editar un activo destruya conceptualmente el valor anterior.

Cuando el usuario cambia:

```text
Departamento
$90.000.000 → $95.000.000
```

eso debería poder convertirse en una nueva valuación histórica.

Pensar una estructura que permita tener:

```text
1 mar 2026   $82.000.000
1 jun 2026   $86.000.000
1 sep 2026   $90.000.000
12 sep 2026  $95.000.000
```

Esto es lo que debería alimentar:

- evolución del activo;
- evolución del patrimonio;
- variaciones porcentuales.

No crear históricos falsos. Utilizar información real almacenada.

Si el modelo actual no soporta valuaciones históricas, analizar primero cuál es la extensión mínima y limpia del dominio necesaria para soportarlo.

---

# 4. Edición de activos

El modal actual de:

```text
Nombre
Tipo
Moneda
Fecha de valuación
Notas
```

es demasiado pobre.

Replantear la edición para que permita trabajar realmente con el activo.

Como mínimo:

- Nombre
- Tipo
- Moneda
- Valor actual / nueva valuación
- Fecha de valuación
- Notas

Según el tipo, permitir información opcional relevante.

Ejemplos:

### Propiedad

- valor;
- deuda asociada;
- notas.

### Vehículo

- valor;
- deuda asociada;
- notas.

No convertir esto en un registro inmobiliario o automotor. Mantenerlo financiero.

---

# 5. Página de detalle de inversiones financieras

BTC y ETH tampoco deberían existir únicamente como filas y un modal.

Crear una página de posición.

Ejemplo:

```text
Bitcoin
BTC · Cripto

0,05 BTC

US$ 3.200
≈ ARS $3.200.000

+US$ 450
+16,4%
```

## Mostrar

- cantidad;
- costo promedio;
- capital invertido;
- precio actual;
- valor actual;
- ganancia/pérdida absoluta;
- rentabilidad %;
- moneda;
- última cotización.

Si la cotización está desactualizada:

```text
⚠ Cotización desactualizada
Última actualización: 11 sep · 18:32
```

No mostrar simplemente “Desactualizada”.

## Evolución

Si existen datos suficientes, mostrar evolución del valor de la posición.

No inventar históricos de mercado que no estén disponibles.

---

# 6. Edición de inversiones

El modal actual:

```text
Símbolo
Instrumento
Cantidad
Costo promedio
Moneda
```

es una buena base pero queda corto.

Revisar el modelo y permitir editar de forma coherente:

- símbolo;
- instrumento;
- cantidad;
- costo promedio;
- moneda.

Además mostrar claramente qué campos son introducidos por el usuario y cuáles vienen de una cotización de mercado.

Por ejemplo:

```text
Cantidad           editable
Costo promedio     editable
Precio actual      automático
Valor actual       calculado
Resultado          calculado
```

No permitir editar manualmente valores que deberían derivarse.

---

# 7. Página de detalle de deuda

La deuda también debe tener su propia página.

Ejemplo:

```text
Hipoteca
Hipoteca · ARS

Saldo pendiente
$45.000.000
```

## Mostrar

- saldo actual;
- activo vinculado;
- moneda;
- fecha de actualización;
- tipo.

Cuando exista activo vinculado:

```text
Activo vinculado

Departamento
Valor actual      $90.000.000

Deuda             $45.000.000
Equity            $45.000.000
```

Permitir navegar hacia el activo.

---

# 8. Mejorar el modelo de deuda sólo donde aporte valor

Analizá el dominio actual antes de agregar campos.

Si el modelo lo permite o tiene sentido extenderlo, evaluar datos como:

- monto original;
- saldo pendiente;
- tasa;
- cuota;
- fecha de inicio;
- fecha estimada de finalización.

Pero no agregues campos simplemente para llenar la pantalla.

La prioridad es que la deuda explique su impacto sobre el patrimonio.

---

# 9. Edición de deuda

El formulario actual:

```text
Nombre
Tipo
Moneda
Saldo
Fecha
Activo vinculado
```

es correcto como base.

Mejorarlo para distinguir claramente:

```text
Saldo actual
```

de cualquier otro dato histórico.

Si existe historial, un cambio de saldo debería poder alimentar la evolución de la deuda y del patrimonio.

---

# 10. Relación Activo ↔ Deuda

Esta relación debe ser bidireccional en UX.

Desde Departamento:

```text
Deuda asociada
Hipoteca · $45.000.000
```

Desde Hipoteca:

```text
Activo vinculado
Departamento · $90.000.000
```

Y mostrar siempre que sea útil:

```text
Equity
$45.000.000
```

No duplicar la deuda ni el activo en el cálculo del patrimonio.

---

# 11. Patrimonio como sistema

Todo esto debe alimentar una única lógica:

```text
Patrimonio neto =
cuentas netas
+ activos
+ inversiones financieras
- deudas
```

Una modificación en cualquiera de estos elementos debe reflejarse correctamente en:

- Inicio;
- Reportes;
- Patrimonio;
- gráficos;
- composiciones;
- históricos.

No crear cálculos diferentes por pantalla.

---

# 12. UX consistente con Cuentas

Tomá la página actual de detalle de `Caja ARS` como referencia de profundidad y estructura, no para copiarla literalmente.

Quiero que exista consistencia en:

- header;
- título;
- subtítulo;
- hero/resumen;
- KPIs;
- listas;
- editar;
- menú de acciones;
- navegación;
- spacing;
- bordes;
- tipografía.

Pero cada tipo debe mostrar información específica de su dominio.

No quiero tres páginas idénticas cambiando solamente los labels.

---

# 13. Edición desde la página de detalle

La acción principal de editar debe seguir estando disponible desde la página.

Puede abrir un modal si el formulario sigue siendo pequeño.

Si el formulario empieza a crecer demasiado, utilizar una página/ruta de edición.

No transformar automáticamente todos los formularios en páginas largas.

Elegir según complejidad.

---

# 14. Estados vacíos

Resolver correctamente escenarios como:

### Activo sin historial

```text
Todavía no hay historial de valuaciones.

Registrá una nueva valuación para empezar a ver
la evolución de este activo.
```

### Activo sin deuda

No mostrar un bloque vacío de deuda.

### Inversión sin cotización

Explicar que no se pudo obtener un precio actual.

---

# 15. Evitar duplicación

Antes de implementar, revisar los componentes actuales.

Crear abstracciones donde realmente exista estructura compartida:

```text
PatrimonyDetailLayout
PatrimonyHero
ValuationSummary
ValuationHistory
LinkedEntityCard
EquitySummary
Money
Trend
DetailMetric
```

No crear:

```text
AssetHeader
DebtHeader
InvestmentHeader
```

si terminan siendo tres copias casi idénticas.

Mantener componentes especializados sólo cuando el dominio lo requiera.

---

# 16. Resultado esperado

Quiero que Patrimonio pase de sentirse como:

> “una lista de valores que puedo editar”

a sentirse como:

> “un lugar donde puedo entender cuánto tengo, cómo está evolucionando, qué parte realmente me pertenece y por qué cambió”.

En particular:

```text
Departamento
$90 M
↓
Hipoteca
-$45 M
↓
Equity real
$45 M
```

y:

```text
Bitcoin
Capital invertido: US$ 2.750
Valor actual: US$ 3.200
Resultado: +US$ 450
Rentabilidad: +16,4%
```

son ejemplos del tipo de información que debería poder entenderse entrando al detalle.

Primero inspeccioná el código, el dominio, las entidades y los componentes existentes. Después implementá la solución aprovechando patrones ya presentes y evitando duplicación.
