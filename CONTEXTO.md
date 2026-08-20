# CONTEXTO: APP CorPos Gastos

> Última actualización: 2026-08-20

## Propósito

App web de gestión financiera familiar para parejas. Cubre salarios, gastos del hogar, gastos personales, extras, mercado mensual con historial de compras e historial por mes. Cada familia tiene sus datos aislados en Firestore. Disponible como web/PWA y como app Android nativa (Capacitor) con actualización en caliente.

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript (strict) |
| Build | Vite |
| Estado global | Zustand |
| Auth | Firebase Auth (Google login) |
| Backend/DB | Firebase Firestore (tiempo real, por familia) |
| Persistencia local | localStorage (respaldo offline) |
| PWA | vite-plugin-pwa (generateSW, workbox) |
| App Android | Capacitor (`android/`) — mismo código React en WebView |
| OTA updates | @capgo/capacitor-updater (self-hosted, sin Capgo) |
| Hosting | Vercel (CI/CD desde GitHub) |
| URL producción | https://corpos-gastos.vercel.app/ |

## Estructura de `src/`

| Directorio | Descripción |
|---|---|
| `constants.ts` | Constantes globales, supermercados, unidades, 70 semillas de productos (`SEED_MARKET_ITEMS`) |
| `types/models.ts` | Interfaces TypeScript (`MonthData`, `FamilyExpense`, `PersonalExpense`, `Mercado`, `Compra`, `AppConfig`, `AppData`, etc.) |
| `utils/finanzas.ts` | Lógica de negocio pura (sin dependencias React/Firebase). Reutilizable en React Native |
| `components/ui/` | Primitivas UI: `Avatar`, `Btn`, `Card`, `Field`, `Label`, `Modal`, `ProgressBar`, `Select`, `Toast`, `PaymentChips` |
| `features/` | Vistas por pestaña (lazy-loaded) |
| `services/auth.ts` | Login/logout con Google (popup en browser, redirect en Capacitor) |
| `services/familyService.ts` | Crear familia, unirse con código, regenerar código |
| `services/firestore.ts` | Carga/migración de datos, save (localStorage + Firestore), suscripción en tiempo real, `createInitialData` |
| `store/useAppStore.ts` | Store Zustand con estado global (user, familyId, data) |
| `hooks/useNotifications.ts` | Notificaciones push (Web Notifications API) |
| `hooks/useOtaUpdate.ts` | Actualización en caliente para Capacitor |
| `App.tsx` | Wrapper auth + enrutador de pestañas + PWA updater |
| `layouts/MainLayout.tsx` | Layout con header y bottom nav |

## Modelo de datos Firestore

```
users/{uid}
  → { familyId, displayName, email }

families/{familyId}
  → { name, createdAt, createdBy, inviteCode }

  members/{uid}
    → { role: 'admin' | 'member', displayName, joinedAt }

  data/current
    → AppData completa (mismo modelo que localStorage)
```

## Modelo `AppData`

```ts
{
  months: Record<string, MonthData>;    // ej: { "2026-06": MonthData, "2026-07": MonthData }
  currentKey: string;                    // mes activo
  mercado: { items: ItemMercado[]; compras: Compra[] };
  config: {
    marcelaName: string;
    jonatanName: string;
    paymentMethods: PaymentMethod[];
    supermarkets: string[];
  };
}
```

## Flujo de usuario

```
1. Sin sesión → LoginScreen (botón "Entrar con Google")
2. Con sesión, sin familia → OnboardingScreen
   ├── "Crear mi familia" (con nombre configurable) → siempre arranca con datos vacíos
   └── "Unirme a una familia" (código de 6 caracteres)
3. Con sesión + familia → App normal (Firestore por familia)
```

## Reglas Firestore

- `users/{uid}`: cada usuario lee/escribe solo su documento
- `families/{familyId}`: cualquier usuario autenticado puede leer (necesario para buscar por inviteCode); solo miembros pueden actualizar
- `families/{familyId}/members/{uid}`: cualquier autenticado puede crear su propio doc de miembro; admin puede eliminar miembros
- `families/{familyId}/data/current`: solo miembros pueden leer/escribir
- `corpos/{docId}`: bloqueado por completo (`allow read, write: if false`) — backup legacy de la migración a familias, ya completada. Ver Changelog 2026-08-19.

## Funcionalidades

### Dashboard
- Resumen salarios → neto disponible por persona
- Gastos del hogar: pagado vs presupuesto, ideal por persona, faltante
- Pagos conjuntos (🤝) reducen el aporte individual
- Saldo libre estimado por persona
- Resumen por medio de pago

### Gastos del hogar
- Lista de categorías con presupuesto, pagado, barra de progreso
- Modal de edición: presupuesto base + monto real este mes (override)
- Campos Marcela / Jonatan / Los dos — formato COP
- Inactivar categorías para el mes o para el siguiente
- Mercado integrado: totales calculados desde compras reales

### Gastos personales
- Por persona, con día del mes y estado pagado/pendiente
- Notificaciones automáticas el día de vencimiento

### Extras
- Gastos imprevistos por persona con categoría y medio de pago

### Mercado
- **Hacer mercado**: supermercado, quién paga, medio de pago, selección de productos
- Panel por producto: cantidad, precio, unidad (con conversión kg/lb)
- **Historial**: agrupado por viaje, expandible, con total y desglose
- Editar viaje completo o item individual
- **Productos**: catálogo editable con precios auto-actualizados

### Configuración
- Nombres de cada persona
- Medios de pago (CRUD con color, tipo y titular)
- Supermercados (CRUD + quick-add desde Mercado)
- Activar notificaciones
- Reset de compras del mercado
- **Compartir familia**: código de invitación de 6 caracteres (regenerable)
- **Zona de peligro — Reiniciar todos mis datos**: borrado completo de la familia actual (nombres, salarios, medios de pago, supermercados, gastos, historial de meses, compras); conserva solo el catálogo de productos del mercado. Requiere escribir "REINICIAR" para confirmar. Irreversible.
- **Cerrar sesión**: logout
- **Versión de la app**: fecha de build + última revisión de actualización

## Arquitectura técnica

- **9 módulos lazy-loaded**: Dashboard, Gastos del hogar, Personales, Extras, Mercado, Salarios, Historial, Ajustes, Más
- **12 primitivas UI** reutilizables con barrel export
- **Migraciones inline**: cuando cambia un modelo (ej. `paymentMethodId` → `paymentMethodByPerson`), se detecta al cargar y se transforma automáticamente
- **Doble persistencia**: localStorage (offline + inmediato) + Firestore (sync en tiempo real por familia)
- **OTA updates**: el build genera un bundle zip que se sirve desde Vercel; Capacitor lo descarga y aplica sin reinstalar

- **2026-08-20**: Corregido bug crítico de fuga de datos entre familias — `loadData(familyId)` caía en un fallback que retornaba la semilla de datos reales de Jonatan (salarios, nombres, gastos) cuando no encontraba datos en localStorage para una familia nueva. Esto provocaba que `subscribeToFirestore`, al detectar Firestore "vacío" (datos iniciales con todo en cero), subiera los datos reales de Jonatan al Firestore de la nueva familia. Fix: cuando `familyId` está presente y no hay datos en localStorage, `loadData` ahora retorna `createInitialData()` (datos vacíos) en vez de la semilla. También se eliminó el `localStorage.removeItem` del flujo de reset (era contraproducente) y se agregó redirección automática a Ajustes después del onboarding.

## Changelog reciente

- **2026-08-18**: Corregido bug de unión a familia — reglas Firestore permitían leer `families` solo a miembros, bloqueando el lookup por `inviteCode` para nuevos usuarios. Ahora cualquier autenticado puede leer la colección `families`.
- **2026-08-19**: Corregido bug crítico de aislamiento — localStorage usaba una sola clave (`corpos_budget_v6`) para todas las familias, permitiendo que datos de una familia se sincronizaran al Firestore de otra. Ahora cada familia tiene su propio espacio de localStorage (`corpos_budget_v6_{familyId}`).
- **2026-08-19**: Corregido bug crítico de fuga de datos — cualquier usuario nuevo sin familia disparaba `loadLegacyData()` en el onboarding, que leía el documento único `corpos/shared` (backup de la migración inicial de Jonatan, legible por cualquier autenticado según las reglas de Firestore). Al crear familia, esos datos se ofrecían como "datos existentes" y se copiaban tal cual a la familia nueva — pasó con el hermano de Jonatan, que terminó con los salarios y gastos reales de Jonatan en su propia familia. Fix: se eliminó por completo el flujo de migración legacy (ya había cumplido su propósito) — `createFamily` ahora siempre arranca con datos vacíos, y las reglas de Firestore bloquean `corpos/{docId}` sin excepción. Se agregó además "Reiniciar todos mis datos" en Ajustes para que cualquier familia pueda autolimpiarse sin intervención manual en Firestore.
- **2026-08-19**: Corregido bug de "Reiniciar todos mis datos" — el botón recargaba la página antes de que la escritura a Firestore completara (race condition). Al recargar, la suscripción `onSnapshot` entregaba los datos viejos del servidor y sobreescribía el estado local, haciendo que el reset pareciera no funcionar. Fix: `resetAllData` ahora es async y espera a que `setDoc` termine; luego limpia localStorage de la familia y recarga. `saveData` ahora retorna `Promise<void>`.

## Reglas de trabajo

1. Escribir código real, no describirlo
2. Actualizar este `CONTEXTO.md` al terminar cada sesión
3. No exponer credenciales ni rutas internas
4. Commits con formato `tipo(app-gastos): descripción`
5. Verificar `tsc --noEmit` y `npm run build` antes de cada commit
