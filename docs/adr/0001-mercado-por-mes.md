# ADR 0001 · Mercado por mes
*2026-10-05 · Estado: aceptada e implementada (fases M1–M4; decisiones D1–D5 respondidas por Jonatan el 2026-10-05)*

## Contexto
El mercado vivía fuera de los meses (`AppData.mercado` global) y ningún cálculo filtraba por mes. Un mes nuevo mostraba el mercado del anterior, el total de la categoría "Mercado" sumaba todos los meses, y "Reiniciar compras" —la única forma de limpiar— borraba el histórico completo. Eliminar un producto del catálogo borraba también sus compras. Había una sola lista para todos los lugares de compra, sin informe por categoría ni sugerencias.

## Decisión

1. **Una compra pertenece al mes activo en la app, no al mes de su fecha** (D1). `Compra.monthKey = data.currentKey` al registrar. Así el mercado hecho el día 30 se puede cargar al mes siguiente. Las compras viejas se migraron con `monthKey = date.slice(0, 7)`, dentro de una transacción que relee el servidor y deja `data/backup_pre_mercado_por_mes` solo si no existe.
2. **Se elimina "Reiniciar compras"** (D3): el mes nuevo arranca vacío por construcción, y los viajes se pueden borrar uno por uno desde el historial.
3. **Eliminar un producto lo archiva** (`active: false`): sale del catálogo y su historial queda intacto.
4. **Listas por mes, varias por mes** (una por lugar de compra), con "Copiar listas del mes anterior" (D4). Al registrar un viaje solo salen de la lista los productos comprados. No hay campo `done`: una lista sin pendientes y con comprados se muestra como terminada.
5. **La compra guarda un snapshot de la categoría** del producto, para que recategorizar no reescriba los informes de meses pasados.
6. **Frutas y Verduras quedan como categorías separadas** (D2), como ya estaban en el catálogo.
7. **Reglas del mercado sugerido:** producto sugerido si se compró en ≥ 2 de los últimos 3 meses con compras (≥ 1 si solo hay un mes); cantidad = mediana mensual (resiste un mes atípico); último precio pagado; lugar = donde más veces se compró.
8. **El módulo se parte en `features/mercado/`** (D5): contenedor más una vista por pestaña.

## Consecuencias
- El historial de compras anterior a esta decisión se había perdido con el antiguo "Reiniciar", así que el sugerido tarda un mes completo en dar algo útil.
- Las funciones de cálculo reciben el mes (`calculateMercadoTotals(mercado, monthKey)`) y viven como lógica pura en `utils/` con pruebas.
