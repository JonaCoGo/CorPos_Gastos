# ADR 0002 · Aislamiento de datos por familia
*2026-08-20 · Estado: aceptada e implementada*

## Contexto
Al pasar de un documento único (`corpos/shared`) a datos por familia hubo tres fugas de datos reales entre familias (2026-08-18 a 2026-08-20):
- `localStorage` usaba una sola clave para todas las familias, así que los datos de una se sincronizaban al Firestore de otra.
- El onboarding de un usuario nuevo leía `corpos/shared` (los datos reales de Jonatan, legible por cualquier autenticado) y lo ofrecía como "datos existentes": una familia nueva terminó con los salarios y gastos de Jonatan.
- `loadData(familyId)` sin datos locales devolvía la semilla con los datos reales de Jonatan, y la suscripción a Firestore, al ver la familia "vacía", la subía.

## Decisión
1. **Cada familia tiene su propio espacio de `localStorage`** (`corpos_budget_v6_{familyId}`).
2. **Una familia nueva siempre arranca con datos vacíos.** `createFamily` no migra nada, y `loadData` con `familyId` y sin datos locales devuelve `createInitialData()`. La semilla nunca se usa con `familyId`.
3. **`corpos/{docId}` queda bloqueado en las reglas** (`allow read, write: if false`), sin excepción. El flujo de migración legacy se eliminó.
4. **Cada familia puede reiniciar sus datos** desde Ajustes ("Reiniciar todos mis datos"), sin intervención manual en Firestore. El reinicio espera a que Firestore confirme la escritura antes de limpiar `localStorage` y recargar; si recarga antes, la suscripción devuelve los datos viejos.
5. **Sin nombres reales por defecto en la UI:** donde falta configuración se muestra "Persona 1" / "Persona 2".

## Consecuencias
- Cualquier cambio en la carga de datos (`services/firestore.ts`) debe conservar que con `familyId` nunca se devuelven datos de otro origen.
- La semilla con datos reales sigue en `services/firestore.ts` para el caso sin `familyId`.
