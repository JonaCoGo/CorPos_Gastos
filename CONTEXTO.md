# CONTEXTO: APP_CorPos_Gastos

## Propósito

App web de gestión financiera personal y familiar para Marcela y Jonatan. Cubre salarios, gastos del hogar, gastos personales, extras, mercado mensual con historial de compras e historial por mes. Instalable como PWA en Android e iOS.

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript (strict) |
| Build | Vite |
| Estado global | Zustand |
| Backend/DB | Firebase Firestore (tiempo real) |
| Persistencia local | localStorage (respaldo offline) |
| PWA | vite-plugin-pwa (generateSW, workbox) |
| Hosting | Vercel (CI/CD desde GitHub) |
| URL producción | https://corpos-gastos.vercel.app/ |

## Estructura de `src/`

- **`constants.ts`**: Constantes globales, listas de íconos, supermercados, unidades, categorías y 70 semillas de productos (`SEED_MARKET_ITEMS`).
- **`types/models.ts`**: Interfaces TypeScript que reflejan Firestore/localStorage (`MonthData`, `FamilyExpense`, `PersonalExpense`, `Extra`, `Mercado`, `Compra`, `AppConfig`, `AppData`, `ResumenFinanciero`, etc.).
- **`utils/finanzas.ts`**: Lógica de negocio pura sin dependencias React ni Firebase. Reutilizable en React Native.
- **`components/ui/`**: Primitivas UI: `Avatar`, `Btn`, `Card`, `Field`, `Label`, `Modal`, `ProgressBar`, `Select`, `Toast`, `PaymentChips`. Exportadas desde `index.ts`.
- **`features/`**: Vistas por pestaña — `TabDashboard`, `TabFamilyExpenses`, `TabPersonalExpenses`, `TabSalaries`, `TabHistory`, `TabExtras`, `TabMercado`, `TabMore`, `TabSettings`.
- **`services/firestore.ts`**: `loadData` (carga con migraciones), `saveData` (localStorage + Firestore), `subscribeToFirestore` (suscripción en tiempo real).
- **`store/useAppStore.ts`**: Store Zustand con estado global y acciones.
- **`hooks/useNotifications.ts`**: Lógica de notificaciones push (Web Notifications API).
- **`App.tsx`**: Enrutador de pestañas + banner de actualización PWA (`useRegisterSW`).
- **`layouts/MainLayout.tsx`**: Layout con header y bottom nav de 5 tabs + "⋯ Más".

## Modelo de datos (`AppData`)

```ts
{
  months: Record<string, MonthData>;
  currentKey: string;                // mes activo (ej: "2026-06")
  mercado: { items: ItemMercado[]; compras: Compra[] };
  config: { marcelaName: string; jonatanName: string; paymentMethods: PaymentMethod[] };
}
```

### FamilyExpense (campo relevante)

```ts
{
  id, label, icon, budget: number;
  monthlyAmount?: number;   // override del budget para este mes
  marcela: number;
  jonatan: number;
  conjunto?: number;        // pagado desde fondo conjunto
  active, disableNext, paymentMethodId?
}
```

### Compra (campo relevante)

```ts
{
  id, itemId, itemName, qty, unit, pricePer, total, supermarket, date, notes;
  marcelaAmount: number;
  jonatanAmount: number;
  conjuntoAmount?: number;
  paidBy?: 'marcela' | 'jonatan' | 'conjunto';
  paymentMethodId?
}
```

## Reglas de trabajo

1. Ejecutar siempre con herramientas reales — escribir el archivo, no describirlo.
2. Antes de tocar código, leer este archivo.
3. Actualizar este `CONTEXTO.md` al terminar cada sesión.
4. No exponer credenciales ni rutas internas al cliente.
5. Commits con formato `tipo(app-gastos): descripción`.

## Estado actual (2026-06-30)

- **Producción estable** en https://corpos-gastos.vercel.app/
- **0 errores TypeScript**. Build limpio en ~3s.
- PWA instalada en Android (Chrome) e iPhone (Safari).
- Firestore sincronizando en tiempo real. Offline funcional vía localStorage.
- Actualizaciones automáticas: banner "🔄 Nueva versión disponible" aparece sin reinstalar la app.

## Funcionalidades completas

### Dashboard
- Resumen salarios → neto disponible por persona
- Gastos del hogar: pagado vs presupuesto, ideal por persona, faltante
- Pagos conjuntos (🤝) reducen el aporte individual proporcionalmente
- Saldo libre estimado por persona
- Resumen por medio de pago

### Gastos del hogar
- Lista de categorías con presupuesto, pagado, barra de progreso
- Modal de edición: presupuesto base + monto real este mes (optional override)
- Campos Marcela / Jonatan / Los dos — formato COP al salir del campo (onBlur)
- Indicador en tiempo real: falta cubrir / cubierto / excedido
- Inactivar categorías para el mes o para el siguiente
- Mercado integrado: los totales se calculan desde las compras reales

### Gastos personales
- Por persona, con día del mes y estado pagado/pendiente
- Notificaciones automáticas el día de vencimiento

### Extras
- Gastos imprevistos por persona con categoría y medio de pago

### Mercado
- **Hacer mercado**: seleccionar dónde, quién paga (aplica a todos los items), con qué medio, y escoger productos de la lista
- Panel expandido por producto: cantidad, precio y unidad
- Registrar viaje en un toque → va al historial
- **Historial**: agrupado por viaje (fecha + supermercado), expandible, con total y desglose
  - Editar viaje completo: cambiar quién pagó y medio de pago (aplica a todos los items del viaje)
  - Eliminar viaje completo o item individual
- **Productos**: catálogo editable, precios se actualizan automáticamente si cambian durante un viaje

### Configuración
- Nombres de cada persona
- Medios de pago (CRUD con color, tipo y titular)
- Activar notificaciones
- Reset de compras del mercado

## Plan de mejoras

Ver [`PLAN_MEJORAS.md`](./PLAN_MEJORAS.md).

---

## Historial de cambios

### [2026-08-03] — Indicador visible de versión y revisión de actualización

El chequeo de actualización del service worker es un proceso interno sin ninguna señal visible — no había forma de confirmar que estuviera funcionando sin conectar el celular a devtools remoto. Se agregó una card "Versión de la app" en Ajustes:

- **Versión instalada**: fecha/hora del build actual (`__BUILD_TIME__`, constante inyectada por Vite en build time vía `define`, ver `vite.config.js` y `vite-env.d.ts`).
- **Última revisión de actualización**: timestamp guardado en `localStorage` (`SW_LAST_CHECK_KEY` en `constants.ts`) cada vez que `App.tsx` dispara `registration.update()` — al registrar el SW, cada hora, y al volver la app a primer plano.
- Botón **"Revisar ahora"** para forzar el chequeo manualmente y ver el timestamp cambiar al instante.

QA manual en navegador: card renderiza correctamente, muestra fecha de build y "aún no revisada" en dev (esperado — el SW real no se registra en modo dev). La validación completa de "hace X min" con SW real requiere el próximo deploy.

### [2026-08-03] — Fix real de actualización PWA (sin borrar caché/historial)

**Síntoma reportado:** las actualizaciones nunca llegaban solas — había que borrar el historial del navegador del celular para ver la versión nueva, tanto en Android como iOS.

**Causa raíz:** el service worker solo revisa si hay versión nueva cuando el navegador decide hacerlo por su cuenta (típicamente en una navegación real), y una PWA agregada a la pantalla de inicio casi nunca navega — el sistema operativo la "reanuda" congelada. No había ningún chequeo periódico forzado en el código, así que en la práctica el SW nunca se enteraba de que había una versión nueva. Además faltaba `skipWaiting: true` explícito en Workbox (solo estaba `clientsClaim`), lo que podía dejar una versión nueva "esperando" sin activarse.

- `vite.config.js`: agregado `workbox.skipWaiting: true`.
- `App.tsx`: `useRegisterSW` ahora fuerza `registration.update()` cada hora mientras la app está abierta, y además al instante cada vez que la app vuelve a primer plano (`visibilitychange` → `visible`) — el momento típico de reabrir la PWA desde el celular. El reload automático al detectar versión nueva ya lo maneja `registerType: 'autoUpdate'` internamente (evento `activated` → `window.location.reload()`), no se duplicó esa lógica.
- **Pendiente de validar en producción real:** este mecanismo no se puede probar completo en dev — necesita un deploy real y probar en los celulares (Android y iPhone) reabriendo la app después de que salga una versión nueva, sin tocar caché/historial manualmente.
- `0 errores TypeScript`, build de producción verificado.

### [2026-08-03] — Supermercados configurables (CRUD + quick-add)

**Problema:** `SUPERMARKETS` era una constante fija en `constants.ts` — no había forma de agregar un supermercado nuevo desde la app.

- **Modelo:** `AppConfig.supermarkets: string[]` (antes vivía solo en `constants.ts`). Migración automática en `services/firestore.ts`: si `config.supermarkets` no existe, se siembra con la constante `SUPERMARKETS` (ahora usada solo como default/semilla, importada como `DEFAULT_SUPERMARKETS` en `TabMercado`).
- **Ajustes** (`TabSettings`): nueva card "Supermercados" — agregar/eliminar, mismo patrón que medios de pago.
- **Mercado** (`TabMercado`): botón "+ Nuevo" inline en los selectores de "¿Dónde van a comprar?" (Lista) y "¿Dónde vas hoy?" (Hacer) — agrega el lugar a `config.supermarkets` y lo selecciona de inmediato, sin salir del flujo. Los `<select>` de Productos, editar viaje y editar compra ahora leen de `config.supermarkets`.
- QA manual en navegador (datos reales de producción): agregado "Justo y Bueno" desde Mercado, confirmado que aparece también en Ajustes, eliminado tras validar.
- `0 errores TypeScript`, build de producción verificado.

### [2026-08-03] — Instancia separada para otra familia (sin multi-usuario)

Jonatan quiere compartir la app con su hermano y su esposa sin mezclar datos. Se descartó multi-usuario con Auth (sobre-ingeniería para 2 hogares conocidos, no un producto para terceros desconocidos) a favor de **desplegar una segunda instancia independiente** del mismo código: proyecto de Firebase propio + proyecto de Vercel propio, cada uno con su `.env` distinto (`firebase.ts` ya lee todo de `import.meta.env.VITE_FIREBASE_*`, cero cambios de código necesarios). Ver guía de despliegue en `docs/`.

### [2026-08-03] — Medios de pago independientes por persona (Gastos del hogar + Mercado)

**Problema:** un gasto ya se dividía en montos por persona (Marcela / Jonatan / fondo conjunto), pero solo admitía **un** medio de pago para todo el registro — sin trazabilidad cuando cada quien paga su parte desde su propia cuenta (ej. Bancolombia de Marcela vs. Bancolombia de Jonatan).

- **Modelo:** `FamilyExpense.paymentMethodId` (único) → `paymentMethodByPerson?: { marcela?, jonatan?, conjunto? }`. Migración automática en `services/firestore.ts` (loadData + subscribeToFirestore): asigna el medio antiguo a cada persona que tuviera monto > 0 en ese gasto.
- **Gastos del hogar** (`TabFamilyExpenses`): selector de cuenta independiente debajo de cada campo de monto (Marcela / Jonatan / Los dos), solo visible si ese monto es > 0. La categoría "Mercado" no lo muestra — su detalle real vive en cada compra.
- **Mercado** (`TabMercado`): `Compra.paymentMethodId` ya era por ítem, pero "Hacer mercado" forzaba un solo medio de pago a todo el carrito. Ahora cada ítem del carrito tiene su propio selector (filtrado a cuentas del pagador de ese ítem + cuentas conjuntas), y el modal de editar compra individual también lo permite editar. El bulk-edit de "viaje completo" se mantiene como atajo (aplica un pagador + cuenta a todos los ítems del viaje de una vez).
- **Dashboard** (resumen por medio de pago): ajustado a sumar por persona vía `paymentMethodByPerson`. De paso corrige un doble conteo latente: la categoría "Mercado" de gastos del hogar ya no se computa ahí (su total ya se cuenta vía `mercado.compras`).
- QA manual en navegador (datos reales de producción vía Firestore): confirmado que Marcela y Jonatan pueden seleccionar cuentas distintas para su parte del mismo gasto sin pisarse; cancelado sin guardar tras validar.
- `0 errores TypeScript`, build de producción verificado (`npm run build`).

### [2026-07-03] — Skill agent-browser disponible para QA

- Skill `agent-browser` (Vercel Labs) instalado globalmente en `~/.claude/skills/` — CLI de automatización de navegador para probar la app en un browser real (navegación, clicks, screenshots) en vez de solo describir el comportamiento esperado.
- Aplica al rol 🧪 QA de este proyecto: usarlo para validar flujos críticos (mercado, fondo conjunto, PWA) antes de cerrar tareas con cambios de UI.

### [2026-06-30] — Fix botón Actualizar PWA

- Eliminado conflicto entre `registerType: 'prompt'` y `skipWaiting: true` en workbox
- `handleAppUpdate` simplificado a `updateServiceWorker(true)` — el plugin maneja el reload automáticamente
- El botón "Actualizar" ahora funciona correctamente al hacer deploy

### [2026-06-22] — Fondo conjunto con balance real

- `FondoConjunto` (`aporteMarcela`, `aporteJonatan`) agregado a `MonthData`
- `computeSummary` descuenta el aporte al fondo del saldo libre de cada persona
- `saldoFondo` = total depositado − total gastado como conjunto
- `TabSalaries`: card "🤝 Fondo Conjunto" para registrar aportes mensuales
- `TabDashboard`: card con desglose (quién aportó, cuánto se gastó, saldo disponible) y alerta de déficit



### [2026-06-19] — Mercado UX + pagos conjuntos + formato COP + actualización PWA

**Mercado — rediseño de flujo:**
- Reemplazado modal por producto con checklist + carrito (estilo checklist)
- Selector de supermercado, quién paga (nivel de viaje) y medio de pago al inicio
- Panel expandido por item: solo cantidad, precio y unidad
- Historial agrupado por viaje con card expandible
- Editar quién pagó y medio de pago a nivel de viaje completo (Pencil en cabecera)
- Eliminar viaje completo desde la cabecera del card
- Selector de unidad por viaje (banana = paquete en D1, kg en plaza)

**Pagos conjuntos (gastos del hogar):**
- Campo `conjunto` en cada gasto → reduce el aporte individual proporcionalmente
- `monthlyAmount` como override del presupuesto base para el mes actual
- Tarjeta muestra el presupuesto tachado + monto real cuando hay override
- Fix: limpiar `monthlyAmount` a 0 lo elimina (deja de tachar)

**Formato COP en inputs:**
- `CopField`: type text + inputMode numeric — muestra número al editar, `$300.000` al salir

**PWA — actualización sin reinstalar:**
- `registerType: 'prompt'` + `useRegisterSW` → banner morado "🔄 Nueva versión disponible" con botón Actualizar
- `skipWaiting: true` + `clientsClaim: true` en workbox

**Notificaciones:**
- Fix pantalla en blanco al otorgar permiso: eliminado `window.location.reload()`, reemplazado por callback chain `TabSettings → App → useNotifications`

### [2026-06-18] — Medios de pago + nombres configurables

- Modelo `PaymentMethod` (ahorro / crédito / efectivo / conjunto)
- CRUD en TabSettings, selector en todos los tabs
- Resumen por cuenta en Dashboard
- `AppConfig`: `marcelaName`, `jonatanName`, `paymentMethods`
- Todos los tabs usan nombres desde config

### [2026-06-17] — Refactor completo

- Arquitectura modular: Zustand, lazy loading, `services/firestore.ts` desacoplado
- Dark mode automático, bottom nav, Toast, ProgressBar, componentes UI
- 0 errores TypeScript
