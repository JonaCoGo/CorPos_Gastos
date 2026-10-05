# Plan de mejoras — Mercado

> Creado: 2026-10-05 · Estado: **M1–M4 implementadas (2026-10-05)** · plan completo

| Fase | Estado |
|---|---|
| M1 — Compras por mes | ✅ Implementada |
| M2 — Varias listas | ✅ Implementada |
| M3 — Informe | ✅ Implementada |
| M4 — Sugerido | ✅ Implementada |

Origen: reporte de Jonatan sobre el uso real del módulo Mercado (compras que se arrastran entre meses, borrado que afecta todos los meses, una sola lista para varios lugares, sin informe por categoría, sin sugerencias).

---

## 1. Diagnóstico (validado contra el código)

### 1.1 Bug crítico — las compras no pertenecen a ningún mes ✅ confirmado

`AppData.mercado` es **global**, vive fuera de `months`:

```ts
AppData { months: Record<string, MonthData>; mercado: { items, compras, lista } }
```

Cada `Compra` tiene `date`, pero **ningún cálculo filtra por mes**. Consecuencias:

| Síntoma | Dónde nace |
|---|---|
| Mes nuevo arranca mostrando el mercado del mes anterior | `TabMercado` historial lista **todas** las compras (`trips` sobre `compras` completo) |
| El total de la categoría "Mercado" del mes suma compras de **todos** los meses | `calculateMercadoTotals(mercado)` en `utils/finanzas.ts` suma todo `compras` |
| El historial de meses muestra el mismo mercado en todos los meses (y crece) | `TabHistory` → `computeSummary({ ...m, mercado })` con el mercado global |
| "Reiniciar compras del mercado" borra el mercado de **todos** los meses | `resetMercadoCompras` en `store/useAppStore.ts` hace `compras: []` |
| Eliminar un producto del catálogo borra sus compras de todo el historial | `deleteItem` en `TabMercado` filtra `compras` por `itemId` |

El "Reiniciar" era la única forma de "limpiar" el mes nuevo, y por diseño destruye el histórico. Ese es exactamente el problema reportado.

### 1.2 Bugs relacionados encontrados en la revisión

| # | Bug | Impacto |
|---|---|---|
| B2 | **Fecha en UTC**: `new Date().toISOString().slice(0, 10)` al registrar viaje. En Colombia (UTC-5), después de las 7 p.m. la compra queda con fecha del día siguiente. | El último día del mes después de las 7 p.m. la compra cae en el mes siguiente. Se vuelve grave apenas se filtre por mes. |
| B3 | **Avance automático de mes sin arrastre**: `checkAndAdvanceMonth` llama `createEmptyMonth` sin `prevMonth`. | Si el mes nuevo lo crea la app sola (primer ingreso del mes), arranca **sin gastos del hogar ni personales**. El botón "+ Nuevo mes" sí arrastra. |
| B4 | **Registrar viaje vacía toda la lista** (`lista: []`), aunque no se hayan comprado todos los productos. | Lo que no se compró se pierde de la lista. |

### 1.3 Funcionalidades faltantes ✅ confirmadas

| Necesidad | Estado actual |
|---|---|
| Varias listas (OR, D1, plaza…) y escoger cuál usar al mercar | Una sola `lista?: ListaItem[]`. El campo `supermarket` existe por ítem pero la lista es única. |
| Informe: cuánto en frutas/verduras, carne, aseo… | No existe. `Compra` no guarda categoría (solo `ItemMercado` la tiene). |
| Mercado sugerido según meses anteriores | No existe. |

---

## 2. Propuesta

### Fase M1 — Compras por mes (bug crítico) 🔴

**Modelo:** agregar `monthKey` a `Compra` (ej. `"2026-10"`).

```ts
interface Compra { ...; monthKey: string; category?: string; }
```

- **Al registrar un viaje**, `monthKey = data.currentKey` (el mes activo en la app), no la fecha. Así, si el mercado del mes se hace el 30 del mes anterior, se puede asignar al mes correcto escogiendo el mes activo. *(Ver decisión D1.)*
- **Migración inline** en `services/firestore.ts` (patrón ya usado): compras sin `monthKey` → `monthKey = date.slice(0, 7)`. Sin pérdida de datos; backup previo del doc `data/current`.
- `calculateMercadoTotals(mercado, monthKey)` filtra por mes. `computeSummary` y `TabHistory` pasan el mes → cada mes muestra **su** mercado.
- Historial de Mercado muestra el mes activo (con selector para ver otros meses).
- **"Reiniciar compras del mercado" se elimina** — ya no hace falta: el mes nuevo arranca vacío por construcción. Si se quiere conservar, que sea "borrar compras **de este mes**" con confirmación.
- `deleteItem`: ya no borra compras del historial; el producto se **archiva** (`active: false`) y desaparece del catálogo, pero el histórico queda intacto.
- Fix B2: fecha local (`yyyy-mm-dd` con `getFullYear/getMonth/getDate`).
- Fix B3: `checkAndAdvanceMonth` pasa `lastMonth` como `prevMonth`.

**Validación:** tests unitarios de `calculateMercadoTotals` por mes, migración (compras sin `monthKey`), fecha local a las 11 p.m., avance automático con arrastre.

### Fase M2 — Varias listas 🟡

**Modelo:** reemplazar `lista?: ListaItem[]` por:

```ts
interface ListaMercado {
  id: string;
  name: string;          // "OR", "D1 quincena", "Plaza"
  supermarket: string;   // lugar por defecto de la lista
  monthKey: string;      // mes al que pertenece
  items: ListaItem[];
  done: boolean;         // se marca al registrar el viaje
}
Mercado { ...; listas: ListaMercado[] }
```

- Vista **Lista**: pestañas/chips con las listas del mes + "Nueva lista". Un producto puede estar en una lista u otra (o en ambas).
- Vista **Hacer**: "¿Qué lista vas a usar?" → carga esa lista y fija su supermercado.
- Al registrar: solo se quitan de la lista los productos **comprados**; si quedan pendientes, la lista sigue abierta (fix B4). Si se compró todo, se marca `done`.
- "Duplicar lista del mes anterior" como atajo (sirve de puente hasta M4).
- Migración: la `lista` actual se convierte en una `ListaMercado` llamada "Lista" del mes activo.

### Fase M3 — Informe del mercado 🟡

- Al registrar, la compra guarda **snapshot de `category`** del producto (si después se recategoriza el producto, el histórico no cambia). Migración: compras viejas toman la categoría actual del producto.
- Nueva vista **📊 Informe** dentro de Mercado, por mes:
  - Total por categoría (barra horizontal + % del total).
  - Total por supermercado.
  - Comparativo contra el promedio de los últimos 3 meses (▲/▼ por categoría).
  - Top productos por gasto y variación de precio de los más comprados.
- Lógica en función pura `resumenMercadoPorCategoria(compras, monthKey)` en `utils/` con tests — la UI solo pinta.

### Fase M4 — Mercado sugerido 🟢

- Función pura `sugerirLista(compras, monthKeyActual, { mesesAtras: 3 })`:
  - Producto sugerido si se compró en **≥ 2 de los últimos 3 meses**.
  - Cantidad sugerida = **mediana** de la cantidad mensual comprada (resistente a un mes atípico).
  - Precio estimado = último precio pagado; supermercado sugerido = donde más se ha comprado ese producto.
- En la vista Lista: botón "✨ Sugerir lista" → muestra la propuesta agrupada por supermercado, con total estimado; se aceptan/quitan productos antes de crear una o varias listas (una por supermercado, encaja con M2).
- Requiere ≥ 2 meses con compras con `monthKey` (M1) para dar algo útil.

**Implementado en M1 (2026-10-05):**
- `Compra.monthKey` + `Compra.category` (snapshot). `ItemMercado.active` para archivar.
- `calculateMercadoTotals(mercado, monthKey)`; `computeSummary` usa `monthData.key`. Filtran por mes: dashboard (incluye resumen por medio de pago), gastos del hogar, historial de meses y notificaciones.
- Migración `asignarMesACompras` en `migrateData` (fecha inválida → mes activo). Se persiste con una **transacción** que relee el documento del servidor (no pisa cambios hechos entre el snapshot y la escritura) y crea `data/backup_pre_mercado_por_mes` con el documento original **solo si no existe**.
- Revisión QA (2026-10-05): corregidos carrera en la escritura de la migración, respaldo sobrescribible, posible bucle con fechas inválidas, selector de mes desincronizado y productos archivados colados al cargar la lista.
- Historial de Mercado con selector de mes; editar viaje permite moverlo a otro mes.
- Vista Hacer avisa cuando el mes activo no es el mes del calendario y muestra el mes en la barra de registro.
- Eliminado "Reiniciar compras del mercado" (store + Ajustes).
- Fixes B2 (`fechaLocalISO`) y B3 (`checkAndAdvanceMonth` arrastra el mes previo). B4 queda para M2.
- Vitest + `src/utils/finanzas.test.ts` (13 pruebas).

**Implementado en M2 (2026-10-05):**
- `Mercado.listas: ListaMercado[]` (`name`, `supermarket`, `monthKey`, `items` = pendientes, `comprados` = ya comprados este mes). Lógica pura en `src/utils/listas.ts` + `listas.test.ts`.
- Vista Lista: chips con las listas del mes, crear / eliminar, supermercado por lista, total estimado, aviso "en <otra lista>" en el catálogo, "Copiar listas de <mes anterior>" (no duplica nombres existentes).
- Vista Hacer: "¿Qué lista vas a usar?" carga la lista al carrito y fija su supermercado.
- Registrar viaje quita de la lista solo lo comprado (fix B4); lo demás queda pendiente.
- Migración `migrarListaUnica`: la lista única vieja pasa a ser "Lista" del mes activo.
- Sin campo `done`: una lista sin pendientes y con comprados se muestra como ✅.
- Revisión QA (2026-10-05): copiar ahora trae la lista completa (pendientes + comprados; antes copiaba listas vacías a fin de mes), la migración fusiona en vez de duplicar si un celular desactualizado reescribe la lista vieja, confirmación antes de reemplazar un carrito con otra lista, selector de lista visible con carrito vacío, la lista cargada deja de contar al cambiar de mes, botón de copiar oculto si no hay nada por copiar.

**Implementado en M3 (2026-10-05):**
- Pestaña **📊 Informe** en Mercado, con selector de mes (compartido con Historial: `useMesConsultado` + `SelectorMes`).
- Total del mes como cifra principal + viajes y categorías + variación vs. el promedio de los últimos 3 meses con compras (o "primer mes" si no hay base).
- Barras por categoría y por lugar de compra: una sola serie → un solo color (`--accent`), ordenadas de mayor a menor, valor y % en texto; debajo, variación vs. promedio con flecha + texto ("Nuevo" si antes no se compraba).
- Top 5 productos por gasto y top 5 cambios de precio (último precio del mes vs. la compra anterior, solo en la misma unidad; ▲/▼ + texto, no solo color).
- Lógica pura en `src/utils/informe.ts` + `informe.test.ts` (9 pruebas). Las categorías salen del snapshot `Compra.category` (M1), así recategorizar un producto no reescribe meses pasados.
- Revisado visualmente con datos de ejemplo a 375 px, en modo claro y oscuro.

**Implementado en M4 (2026-10-05):**
- Botón **✨ Sugerir mercado (N)** en Lista (visible cuando hay al menos un mes anterior con compras).
- `sugerirMercado` (`src/utils/sugerencias.ts`): producto sugerido si se compró en ≥ 2 de los últimos 3 meses con compras (≥ 1 si solo hay un mes); cantidad = mediana mensual, redondeada hacia arriba en und/paq y a un decimal en peso; último precio pagado; lugar = donde más veces se compró (empate → el más reciente). Excluye archivados y lo que ya está en alguna lista del mes (pendiente o comprado).
- Modal con la propuesta agrupada por lugar, todo marcado; se desmarca lo que no se necesita. `aplicarSugerencias` agrega a la lista del mismo lugar en el mes o crea una lista con el nombre del lugar.
- 12 pruebas en `sugerencias.test.ts`. Probado de punta a punta en vista previa (sugerir → desmarcar → crear listas).
- Nota: el historial de compras se perdió con el "Reiniciar" previo a M1, así que las sugerencias aparecen a partir de que haya un mes completo registrado (noviembre en adelante).

### Orden y dependencias

```
M1 (bug, bloqueante) ──► M2 (listas) ──► M4 (sugerido)
                    └──► M3 (informe)
```

M1 va primero y solo: arregla el dato. M3 y M2 son independientes entre sí. M4 depende de M1 y aprovecha M2.

### Transversal

- **Tests:** hoy no hay ninguno. Propongo agregar **Vitest** (devDependency, mismo ecosistema de Vite, cero config) para cubrir las funciones puras nuevas y las existentes de `finanzas.ts`. Ya estaba como pendiente 🔴 en `PLAN_MEJORAS.md`.
- **Tamaño del documento Firestore:** todo vive en `data/current` (límite 1 MB). Estimado ~10–15 KB/mes de compras → años de margen. No se toca ahora; queda anotado.
- `TabMercado.tsx` ya tiene 1.100 líneas. Con M2–M4 conviene partirlo en `features/mercado/` (Lista, Hacer, Historial, Items, Informe). Es cambio de estructura → requiere aprobación.

---

## 3. Decisiones (Jonatan)

Respondidas el 2026-10-05:
- **D1:** mes activo. ✅
- **D2:** Frutas y Verduras se mantienen como categorías separadas (ya lo están en el catálogo). ✅
- **D3:** eliminar "Reiniciar compras". ✅
- **D5:** partir `TabMercado.tsx` en `features/mercado/`. ✅ (se hizo antes de M1)
- **D4:** listas **por mes**, con "Copiar listas del mes anterior". ✅

Tabla original:

| # | Pregunta | Recomendación |
|---|---|---|
| D1 | ¿Una compra pertenece al **mes activo en la app** o al **mes de la fecha** en que se hizo? | Mes activo — permite cargar al mes correcto el mercado hecho el 30. |
| D2 | Categorías del informe: ¿"Frutas" y "Verduras" juntas como "Frutas y verduras", o separadas? ¿Hace falta poder crear categorías propias? | Unificar en "Frutas y verduras" y permitir categorías configurables en Ajustes. |
| D3 | ¿Se conserva "Reiniciar compras" como "borrar compras de este mes", o se elimina? | Eliminar; borrar viajes individuales ya existe en el historial. |
| D4 | ¿Las listas son por mes (se cierran) o permanentes (ej. "Lista OR" reutilizable cada mes)? | Por mes + "duplicar del mes anterior". |
| D5 | Partir `TabMercado.tsx` en `features/mercado/` | Sí, al empezar M2. |
