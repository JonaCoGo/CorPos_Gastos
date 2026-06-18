# CONTEXTO: APP_CorPos_Gastos

## Propósito

App web de gestión financiera personal y familiar para Marcela y Jonatan. Cubre salarios, gastos del hogar, gastos personales, extras, mercado mensual con historial de compras e historial por mes. Objetivo a futuro: migrar a React Native (Android/iOS).

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript (strict) |
| Build | Vite |
| Estado global | Zustand |
| Backend/DB | Firebase Firestore (tiempo real) |
| Persistencia local | localStorage (respaldo offline) |
| Hosting | Vercel (CI/CD desde GitHub) |

## Estructura de `src/`

- **`constants.ts`**: Constantes globales, listas de íconos, supermercados, unidades, categorías y 70 semillas de productos (`SEED_MARKET_ITEMS`).
- **`types/models.ts`**: Interfaces TypeScript que reflejan Firestore/localStorage (`MonthData`, `FamilyExpense`, `PersonalExpense`, `Extra`, `Mercado`, `Compra`, `AppConfig`, `AppData`, `ResumenFinanciero`, etc.).
- **`utils/finanzas.ts`**: Lógica de negocio pura sin dependencias React ni Firebase. Reutilizable en React Native.
- **`components/ui/`**: Primitivas UI: `Avatar`, `Btn`, `Card`, `Field`, `Label`, `Modal`, `ProgressBar`, `Select`, `Toast`. Exportadas desde `index.ts`.
- **`features/`**: Vistas por pestaña — `TabDashboard`, `TabFamilyExpenses`, `TabPersonalExpenses`, `TabSalaries`, `TabHistory`, `TabExtras`, `TabMercado`, `TabMore`, `TabSettings`. Exportadas desde `index.ts`.
- **`services/firestore.ts`**: `loadData` (carga con migraciones), `saveData` (localStorage + Firestore), `subscribeToFirestore` (suscripción en tiempo real). Desacoplado de la UI.
- **`store/useAppStore.ts`**: Store Zustand con todo el estado global (`data`, `tab`, `synced`) y acciones (`updateMonth`, `updateMercado`, `resetMercadoCompras`, `updateConfig`, `addMonth`, `deleteMonth`, etc.).
- **`App.tsx`**: Enrutador de pestañas ultraligero (~100 líneas). Solo consume el store y renderiza la pestaña activa.
- **`layouts/MainLayout.tsx`**: Layout con header y bottom nav de 5 tabs + "⋯ Más".

## Modelo de datos (`AppData`)

```ts
{
  months: Record<string, MonthData>;   // historial mensual
  currentKey: string;                  // mes activo (ej: "2026-06")
  mercado: { items: ItemMercado[]; compras: Compra[] };
  config: { marcelaName: string; jonatanName: string };
}
```

## Reglas de trabajo

1. Ejecutar siempre con herramientas reales — escribir el archivo, no describirlo.
2. Antes de tocar código, leer este archivo.
3. Actualizar este `CONTEXTO.md` al terminar cada sesión.
4. No exponer credenciales ni rutas internas al cliente.
5. Commits con formato `tipo(app-gastos): descripción`.

## Estado actual (2026-06-18)

- **Producción estable** en Vercel con Firestore sincronizando.
- **0 errores TypeScript**.
- Refactor completo: arquitectura modular, Zustand, lazy loading, dark mode, bottom nav.

## Plan de mejoras

Ver [`PLAN_MEJORAS.md`](./PLAN_MEJORAS.md) — 7 fases desde pulir diseño hasta migración a React Native.

## Próximos pasos

- **Configuración de nombres** ✅ implementado (`AppConfig`, `TabSettings`)
- **Reset mercado** ✅ implementado (`resetMercadoCompras`, botón en Configuración)
- ~~Propagar nombres configurables al resto de tabs~~ ✅ completo — todos los tabs usan `config.marcelaName`/`config.jonatanName`.
- Preparación para app pública: autenticación básica, multi-usuario.
- Migración a React Native (base ya desacoplada en `utils/finanzas.ts` y `services/firestore.ts`).

---

## Historial de cambios

### [2026-06-17] — Configuración de nombres + reset mercado + TabSettings

- **`AppConfig`** añadido a `types/models.ts`: `{ marcelaName, jonatanName }`.
- **`AppData.config`** propagado en store, firestore (seed + migración de datos existentes).
- **`useAppStore`**: nuevas acciones `updateConfig` y `resetMercadoCompras`.
- **`TabSettings`** creado: edición de nombres a mostrar + botón de reinicio de compras del mercado (con confirmación Modal).
- **`TabMore`**: nueva opción ⚙️ Configuración.
- **`TabDashboard`** y **`TabMercado`**: usan `config.marcelaName` / `config.jonatanName` en lugar de strings hardcodeados.
- **`README.md`** actualizado: refleja stack real (Vite, Zustand, TypeScript strict).
- Migración automática: datos existentes sin `config` reciben defaults al cargar.

### [2026-06-17] — Auditoría post-refactor y corrección de bugs

- `REFACTOR_PLAN.md` eliminado (plan completado al 100%).
- `src/types/index.ts` eliminado (reemplazado por `types/models.ts`).
- `TabHistory`: `window.confirm` reemplazado por Modal propio. Props tipados.
- `TabPersonalExpenses`: Modal de confirmación en `deleteExpense`. Tipo `Persona` eliminando `any`.
- `TabSalaries`: Props tipados.
- `App.tsx`: aserción `summary!` para non-null garantizado por guard.

### [2026-06-17] — Mejoras visuales y corrección de errores TypeScript

- 0 errores TypeScript (vite/client ref, non-null assertions, noUnusedLocals, DocumentData cast).
- Toast/snackbar en Hogar, Extras, Personal y Salarios.
- Dark mode con `prefers-color-scheme: dark`.
- Transiciones de pestaña (`tabIn`).
- Bottom nav: 5 tabs + "⋯ Más" (agrupa Salarios, Historial, Configuración).
- Componente `Select` reutilizable.
- `Field` con prop `currency` (formato COP al perder foco).
- Fix checkbox en TabPersonalExpenses (stopPropagation).
- `.env` local creado, Firestore rules corregidas.

### [2026-06-18] — Nombres configurables completos + mejoras de diseño

- **TabSalaries**: distribución de aportes usaba `{n}` crudo — corregido a `names[n]`.
- **TabHistory**: importado `useAppStore`; modal "Nuevo mes" ahora muestra `Salario {nombre}` en vez de "Neto Marcela/Jonatan"; cards del historial muestran nombres configurados; banner de duplicado usa variables CSS.
- **Colores dark-mode**: banners hardcodeados (`#fffbeb`, `#f0fdf4`, `#f0f4ff`, `#fef2f2`) reemplazados por `var(--surface2)` + colores semánticos en TabDashboard, TabHistory y TabSalaries.
- **Bottom nav**: tab activo tiene fondo sutil (`accent + 1a`) y punto indicador debajo del ícono.
- **TabMore**: íconos en contenedor pill, chevron en caja, diseño más limpio.
- **0 errores TypeScript**.

### [2026-06-17] — TabMercado: compras primero + productos colapsados

- Compras como vista por defecto; Productos pasa a segundo lugar.
- `ItemCard` colapsado: solo muestra nombre/categoría/precio. Al clic despliega calculadora completa.
