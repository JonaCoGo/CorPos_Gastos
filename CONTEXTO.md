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

## Estado actual (2026-06-22)

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
