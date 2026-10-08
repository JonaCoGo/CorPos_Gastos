# CONTEXTO: APP CorPos Gastos

> Foto del sistema al 2026-10-08

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
| `utils/informe.ts` | Lógica pura del informe de mercado (por categoría, por lugar, comparación con meses anteriores, cambios de precio). Pruebas en `informe.test.ts` |
| `utils/sugerencias.ts` | Lógica pura del mercado sugerido y de pasarlo a las listas. Pruebas en `sugerencias.test.ts` |
| `utils/listas.ts` | Lógica pura de listas de mercado (por mes, copiar, quitar comprados, migración). Pruebas en `listas.test.ts` |
| `utils/finanzas.ts` | Lógica de negocio pura (sin dependencias React/Firebase). Reutilizable en React Native. Pruebas en `finanzas.test.ts` (Vitest, `npm test`) |
| `components/ui/` | Primitivas UI con barrel export (`index.ts`): `Avatar`, `Btn`, `Card`, `Field`, `Label`, `Modal`, `ProgressBar`, `Select`, `Skeleton` / `AppSkeleton`, `Toast`, `PaymentChips` |
| `features/` | Vistas por pestaña (lazy-loaded) |
| `features/mercado/` | Módulo Mercado: `TabMercado` (contenedor) + `VistaLista`, `VistaHacer`, `VistaHistorial`, `VistaInforme`, `VistaItems`, hooks `useCarrito` y `useMercadoConfig` |
| `services/auth.ts` | Login/logout con Google (popup en browser, redirect en Capacitor) |
| `services/familyService.ts` | Crear familia, unirse con código, regenerar código |
| `services/firestore.ts` | Carga/migración de datos, save (localStorage + Firestore), suscripción en tiempo real, `createInitialData` |
| `store/useAppStore.ts` | Store Zustand con estado global (user, familyId, data) |
| `hooks/useNotifications.ts` | Notificaciones push (Web Notifications API) |
| `hooks/useActualizacion.ts` | Detecta versión nueva comparando `__BUILD_TIME__` con `/updates/version.json`. Android: OTA (Capacitor). Navegador/PWA: el SW se actualiza solo; si se atasca, el aviso "Actualizar" quita SW + caché y recarga sin tocar los datos |
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
    → AppData completa (mismo modelo que localStorage, clave `corpos_budget_v6_{familyId}`)

  data/backup_pre_mercado_por_mes
    → copia intacta de data/current tomada antes de migrar las compras a monthKey
```

## Modelo `AppData`

```ts
{
  months: Record<string, MonthData>;    // ej: { "2026-06": MonthData, "2026-07": MonthData }
  currentKey: string;                    // mes activo
  mercado: { items: ItemMercado[]; compras: Compra[]; listas?: ListaMercado[] };
  // Cada Compra lleva monthKey (mes al que pertenece) y category (snapshot).
  // Los totales de mercado de un mes solo cuentan las compras con su monthKey.
  // Cada ListaMercado pertenece a un mes y a un supermercado (ej. "OR", "D1").
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
- `families/{familyId}/data/{docId}` (`current` y el respaldo): solo miembros pueden leer/escribir
- `corpos/{docId}`: bloqueado por completo (`allow read, write: if false`) — documento legacy previo a los datos por familia (ADR 0002)
- Las reglas viven en `firestore.rules` y se publican aparte del deploy (`docs/firebase.md`).

## Funcionalidades

### Meses (aislamiento)
- Cada mes es independiente: crear, editar o borrar en un mes no cambia ningún otro (cubierto por `store/useAppStore.test.ts`)
- Un mes nuevo hereda gastos del hogar y personales del mes inmediatamente anterior, con pagos en cero; extras y mercado arrancan vacíos
- Eliminar un mes borra también sus compras y listas del mercado
- Globales a propósito: nombres, medios de pago, supermercados y catálogo de productos

### Dashboard
- Resumen salarios → neto disponible por persona
- Gastos del hogar: pagado vs presupuesto, ideal por persona, faltante
- Pagos conjuntos (🤝) reducen el aporte individual
- Saldo libre estimado por persona
- Resumen por medio de pago

### Configuración (arranca en esta pantalla para familias nuevas)
- Nombres de cada persona
- **Salarios** del mes con cálculo de neto y distribución de aportes
- Medios de pago (CRUD con color, tipo y titular)
- Supermercados (CRUD + quick-add desde Mercado)
- Backup: exportar a `.json` y restaurar desde ese archivo
- Notificaciones, reiniciar todos los datos de la familia, compartir familia (código de invitación), cerrar sesión
- Versión de la app con su estado real de actualización

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
- **Compras por mes**: cada compra pertenece al mes activo al registrarla; cada mes muestra y suma solo su mercado
- **Listas por mes**: varias listas (una por lugar de compra), copiar las del mes anterior; al registrar solo salen de la lista los productos comprados
- **Mercado sugerido**: propone productos habituales (≥ 2 de los últimos 3 meses) con cantidad típica, último precio y lugar habitual; se aceptan y quedan en las listas del mes
- **Hacer mercado**: escoger lista, supermercado, quién paga, medio de pago, selección de productos
- Panel por producto: cantidad, precio, unidad (con conversión kg/lb)
- **Historial**: por mes (selector), agrupado por viaje, expandible, con total y desglose
- **Informe** (por mes): total vs. promedio de 3 meses, gasto por categoría y por lugar de compra, productos que más pesaron y cambios de precio
- Editar viaje completo (incluido moverlo a otro mes) o item individual
- **Productos**: catálogo editable con precios auto-actualizados; eliminar archiva el producto sin borrar su historial

## Arquitectura técnica

- **Pestañas:** Dashboard, Gastos del hogar, Personales, Extras, Mercado, Historial, Ajustes y Más. Todas menos Más se cargan lazy (`App.tsx`).
- **Migraciones inline**: cuando cambia un modelo (ej. `paymentMethodId` → `paymentMethodByPerson`), se detecta al cargar y se transforma automáticamente
- **Doble persistencia**: localStorage (offline + inmediato) + Firestore (sync en tiempo real por familia)
- **Aislamiento por familia**: con `familyId`, la carga nunca devuelve datos de otro origen; una familia nueva arranca vacía (ADR 0002)
- **OTA updates** (Android): el build genera un bundle zip que se sirve desde Vercel; Capacitor lo descarga y aplica sin reinstalar, sin el servicio de Capgo (`autoUpdate: false`). `version.json` lleva la misma marca que el build (`build-id.json`), así la app sabe con certeza si está vieja. La app revisa al abrirse y cada hora.
- **Service worker solo en navegador**: `PwaUpdater` no se monta dentro de la app Android, porque el SW interceptaría los archivos viejos por encima de la OTA.
- **Aviso de actualización**: banner "Hay una versión nueva de la app" + estado real en Ajustes → Versión de la app

## Comandos y entornos

| Para qué | Comando |
|---|---|
| Desarrollo | `npm run dev` (puerto 3000) |
| Pruebas | `npm test` (Vitest, `*.test.ts` junto al código) |
| Tipos | `npx tsc --noEmit` |
| Build | `npm run build` (el `postbuild` genera el bundle OTA y `dist/updates/version.json`) |
| Copiar el build al proyecto Android | `npx cap sync android` |

- Antes de cada commit: `tsc --noEmit`, `npm test` y `npm run build` sin errores.
- **Producción:** push a `main` → Vercel despliega. Variables `VITE_FIREBASE_*` según `.env.example` (local en `.env`, producción en Vercel).
- **App Android:** `versionCode 1` / `versionName "1.0"` (`android/app/build.gradle`); los cambios de código llegan por OTA, solo un cambio nativo exige APK nuevo.
- **Scope de commits:** `app-gastos\<modulo>` (ej. `feat(app-gastos\mercado): ...`), con el formato de `CLAUDE.md`.

## Documentación

| Pregunta | Dónde |
|---|---|
| ¿Qué es y qué hace hoy? | este archivo |
| ¿Qué falta, qué está abierto o sin validar? | `docs/hoja_de_ruta.md` |
| ¿Por qué se decidió así? | `docs/adr/` (0001 mercado por mes · 0002 aislamiento por familia) |
| ¿Cómo se configuran Firebase, Google Cloud y Vercel? | `docs/firebase.md` |
| ¿Cómo se compila, firma y distribuye el APK? | `docs/DISTRIBUCION_ANDROID.md` |
| ¿Qué encontró la auditoría de código de junio? | `docs/2026-06-30_auditoria_codigo.md` |
| ¿Cómo arranco en local? | `README.md` |
| ¿Qué se hizo y cuándo? | `git log --oneline` |
