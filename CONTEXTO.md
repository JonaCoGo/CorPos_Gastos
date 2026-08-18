# CONTEXTO: APP_CorPos_Gastos

## Propósito

App web de gestión financiera personal y familiar para Marcela y Jonatan. Cubre salarios, gastos del hogar, gastos personales, extras, mercado mensual con historial de compras e historial por mes. Disponible como web/PWA (Android e iOS vía navegador) y como app Android nativa instalable (Capacitor) con actualización de código en caliente — ver `docs/DISTRIBUCION_ANDROID.md`.

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript (strict) |
| Build | Vite |
| Estado global | Zustand |
| Auth | Firebase Auth (Google login) |
| Backend/DB | Firebase Firestore (tiempo real, por familia) |
| Persistencia local | localStorage (respaldo offline) |
| PWA (web) | vite-plugin-pwa (generateSW, workbox) |
| App Android nativa | Capacitor (`android/`) — mismo código React envuelto en WebView |
| Actualización en caliente (Android) | @capgo/capacitor-updater, self-hosted (sin cuenta Capgo) — ver `src/hooks/useOtaUpdate.ts` y `scripts/build-ota-bundle.mjs` |
| Hosting | Vercel (CI/CD desde GitHub) |
| URL producción | https://corpos-gastos.vercel.app/ |

## Estructura de `src/`

- **`constants.ts`**: Constantes globales, listas de íconos, supermercados, unidades, categorías y 70 semillas de productos (`SEED_MARKET_ITEMS`).
- **`types/models.ts`**: Interfaces TypeScript que reflejan Firestore/localStorage (`MonthData`, `FamilyExpense`, `PersonalExpense`, `Extra`, `Mercado`, `Compra`, `AppConfig`, `AppData`, `ResumenFinanciero`, etc.).
- **`utils/finanzas.ts`**: Lógica de negocio pura sin dependencias React ni Firebase. Reutilizable en React Native.
- **`components/ui/`**: Primitivas UI: `Avatar`, `Btn`, `Card`, `Field`, `Label`, `Modal`, `ProgressBar`, `Select`, `Toast`, `PaymentChips`. Exportadas desde `index.ts`.
- **`features/`**: Vistas por pestaña — `TabDashboard`, `TabFamilyExpenses`, `TabPersonalExpenses`, `TabSalaries`, `TabHistory`, `TabExtras`, `TabMercado`, `TabMore`, `TabSettings`.
- **`services/auth.ts`**: Login/logout con Google (`loginWithGoogle`, `logout`, `onAuthChange`).
- **`services/familyService.ts`**: Crear familia (`createFamily`), unirse con código (`joinFamily`), regenerar código (`regenerateInviteCode`).
- **`services/firestore.ts`**: `loadData` (carga con migraciones), `saveData` (localStorage + Firestore por familia), `subscribeToFirestore` (suscripción en tiempo real), `loadLegacyData` (migración desde `corpos/shared`).
- **`features/LoginScreen.tsx`**: Pantalla de login con botón Google.
- **`features/OnboardingScreen.tsx`**: Onboarding: crear familia (con nombre configurable) o unirse con código de invitación.
- **`store/useAppStore.ts`**: Store Zustand con estado global (user, familyId, data) y acciones.
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

## Estado actual (2026-08-18)

- **Producción estable** en https://corpos-gastos.vercel.app/
- **0 errores TypeScript**. Build limpio en ~4s.
- **Firebase Auth (Google login)** + Firestore por familia — datos aislados por hogar.
- PWA instalada en Android (Chrome) e iPhone (Safari).
- Firestore sincronizando en tiempo real por familia. Offline funcional vía localStorage.
- Actualizaciones automáticas: banner "🔄 Nueva versión disponible" aparece sin reinstalar la app.
- Múltiples familias: cada familia tiene sus propios datos, invite code para unirse.

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
- Supermercados (CRUD + quick-add desde Mercado)
- Activar notificaciones
- Reset de compras del mercado
- **Compartir familia**: código de invitación de 6 caracteres (regenerable)
- **Cerrar sesión**: botón de logout en Ajustes
- **Versión de la app**: fecha de build + última revisión de actualización

## Plan de mejoras

Ver [`PLAN_MEJORAS.md`](./PLAN_MEJORAS.md).

---

## Historial de cambios

### [2026-08-18] — Firebase Auth + Firestore por familia (Fase 4)

**Problema:** Firestore estaba completamente abierto (`allow read, write: if true`). Cualquier persona con la URL podía leer, modificar o borrar todos los datos financieros (salarios, gastos, nombres reales). La Fase 4 del PLAN_MEJORAS estaba pendiente desde el inicio.

**Decisión arquitectónica (confirmada con Jonatan):**
- Login con Google (un toque, sin contraseña).
- Modelo multi-familia: cada familia tiene sus datos aislados en Firestore.
- Código de invitación de 6 caracteres para agregar miembros.
- Migración automática de datos existentes (`corpos/shared`) al primer login.
- Nombre de familia configurable desde el onboarding.

**Archivos creados:**
- `src/services/auth.ts` — Login/logout con Google. Browser usa `signInWithPopup`, Capacitor usa `signInWithRedirect`.
- `src/services/familyService.ts` — Crear familia (`createFamily` en 2 pasos), unirse con código (`joinFamily`), regenerar código (`regenerateInviteCode`).
- `src/features/LoginScreen.tsx` — Pantalla de login con botón Google, mensajes de error específicos por tipo.
- `src/features/OnboardingScreen.tsx` — Onboarding: crear familia (con nombre) o unirse con código.

**Archivos modificados:**
- `src/firebase.ts` — Exporta `app` (antes solo exportaba `db`).
- `src/services/firestore.ts` — Reescrito: rutas por `families/{familyId}/data/current`, `loadLegacyData()` para migración, `createInitialData()` para familias nuevas.
- `src/store/useAppStore.ts` — Agrega `user`, `familyId`, `authReady` al estado; `saveData` pasa `familyId`; `initFirestoreSync` requiere `familyId`.
- `src/App.tsx` — Wrapper auth: LoginScreen → OnboardingScreen → app normal. Try/catch en `getUserFamilyId` para no crashear si las reglas fallan. Eliminada auto-creación de familia (siempre muestra onboarding).
- `src/features/TabSettings.tsx` — Cards "Compartir familia" (invite code + copiar + regenerar) y "Cerrar sesión" (logout + info de usuario).
- `firestore.rules` — Reglas completas por UID/familia.

**Modelo Firestore nuevo:**
```
users/{uid} → { familyId, displayName, email }
families/{familyId} → { name, createdAt, createdBy, inviteCode }
  members/{uid} → { role: 'admin'|'member', displayName, joinedAt }
  data/current → AppData completa (mismo modelo, cero cambios en types)
```

**Migración de datos existentes:**
- Primer login de Jonatan: `getUserFamilyId` retorna null → OnboardingScreen detecta datos en `corpos/shared` → usuario crea familia → datos se migran.
- `corpos/shared` queda como backup de solo lectura temporal (reglas: `allow read: if request.auth != null; allow write: if false;`).
- Marcela: se le comparte el código de invitación → se une a la misma familia.
- Hermano: crea su propia familia independiente con sus propios datos.

**Flujo de usuario:**
1. Sin sesión → LoginScreen (botón Google)
2. Con sesión, sin familia → OnboardingScreen (crear familia con nombre, o unirse con código)
3. Con sesión + familia → App normal (Firestore por familia)

**Lo que NO cambió:** types, utils/finanzas.ts, todos los features (tabs), UI completa.

**Verificado:** `npx tsc --noEmit` limpio, `npm run build` exitoso (~4s), bundle principal ~654KB.

**Bugs resueltos durante implementación:**
- **API key con comillas en Vercel:** el `VITE_FIREBASE_API_KEY` en Vercel tenía `"` alrededor del valor, causando `auth/api-key-not-valid` al hacer `signInWithPopup`. Causa: Vite lee `.env` con dotenv (que strips comillas), pero Vercel lee de `process.env` directamente.
- **Firestore rules sin publicar:** el error `Missing or insufficient permissions` al leer `users/{uid}` indicaba que las reglas no se habían publicado desde Firebase Console.
- **writeBatch + exists() conflict:** `createFamily` usaba un `writeBatch` para crear familia, miembro y datos juntos. Pero Firestore rules evalúa `exists()` contra el estado actual de la BD (no los cambios pendientes del batch), así que `data/current` fallaba porque `members/{uid}` no existía aún. Fix: separar en dos operaciones — primero familia+miembro, después datos.
- **signInWithRedirect causaba loop:** el redirect de Google volvía a la app pero `onAuthChange` no se activaba correctamente. Fix: volver a `signInWithPopup` para browser (que funciona desde que se corrigieron las comillas de la API key), mantener `signInWithRedirect` solo para Capacitor (WebView).
- **Auto-creación de familia con datos vacíos:** la app creaba automáticamente una familia con datos semilla si `hasLegacyData()` era true en el browser (localStorage viejo). Fix: eliminar auto-creación, siempre mostrar OnboardingScreen para que el usuario migre datos manualmente.

### [2026-08-03] — Conversión de unidades lb/kg en cantidad de Mercado

Después del fix de entrada decimal (ver entrada siguiente), Jonatan reportó que el problema seguía: la Cebolla de Huevo está a $1.950/lb, pero al pesar en la báscula (que da el peso en kg, ej. 0.75) la app multiplicaba directo 0.75 × 1.950 sin convertir, dando un precio incorrecto — la app no sabía que "0.75" estaba en kg y el precio estaba fijado en lb. **No era un problema de parseo del número (ya arreglado), sino de conversión de unidades: faltaba del todo.**

**Decisión confirmada con Jonatan (afecta cálculos de dinero, se consultó antes de programar):** usar **1 libra = 500 g**, la convención de plaza/supermercado en Colombia (no la libra científica de 453.6 g) — así es como él pesa y cobra en la práctica.

**Fix:**
- `convertQty(qty, fromUnit, toUnit)` nuevo en `src/utils/finanzas.ts`, con tabla `kg: 1000, lb: 500, gr: 1` gramos por unidad.
- El selector "Unidad" del carrito (que ya existía) ahora sí convierte: si pesás en una unidad distinta a la del producto (ej. producto en lb, pesás en kg), el total se calcula convirtiendo la cantidad a la unidad del producto antes de multiplicar por el precio.
- Al registrar el viaje (`registrarViaje`), la compra se guarda siempre en la unidad canónica del producto (ej. lb), con la cantidad ya convertida — así el historial no queda con unidades mezcladas para el mismo producto.
- Mismo tratamiento en editar compra individual (`saveEditCompra` y el total estimado del modal).

**Verificado en navegador:** Cebolla de Huevo ($1.950/lb) con cantidad 0.75 y unidad "kg" da **$2.925** (0.75 kg = 1.5 lb × $1.950), no los $1.462 que daba antes de convertir. `npx tsc --noEmit` limpio.

### [2026-08-03] — Fix entrada decimal en cantidad/precio de Mercado (báscula en lb/kg)

Jonatan reportó que al pesar productos por libra (ej. plátano verde, la báscula marca "1.250" = 1 lb con 250 g) la app no aceptaba el número: escribir "1250" lo tomaba como 1250 unidades, "1.250" o ".750" no se dejaban escribir o no cuadraban. **Causa raíz:** los inputs de cantidad/precio eran `<input type="number">`, cuyo comportamiento de sanitización de decimales depende del teclado numérico del celular — en locale es-CO el teclado suele exigir "," como separador y bloquear el ".", lo que invalida el campo (el navegador lo vacía o rechaza el carácter).

**Fix:**
- `parseFlexibleNumber` / `sanitizeDecimalInput` nuevos en `src/utils/finanzas.ts` — aceptan tanto "," como "." como separador decimal y normalizan a ".".
- `components/ui/Field.tsx`: los campos numéricos ahora son `type="text" inputMode="decimal"` (conserva el teclado numérico del celular pero sin la validación nativa que rompía el "."); el valor se sanitiza en cada `onChange`. Afecta Cantidad/Precio en los modales de editar compra y editar/crear producto.
- `TabMercado.tsx`: cantidad y precio del carrito ("Hacer mercado") con el mismo tratamiento; todos los `Number(...)` sobre esos campos pasaron a `parseFlexibleNumber(...)`.
- Cantidad en la vista "Lista" (bindeada directo a un número en el store, no a un string local) necesitaba un fix distinto: nuevo componente `QtyTextInput` con buffer de texto propio que solo se resincroniza contra el valor real cuando el input pierde el foco — así no se pierde el "." mientras la persona todavía está escribiendo el decimal.

**Verificado en navegador:** en "Hacer mercado", escribir "1.250" en Cantidad da 1.25 und (total $14.313 = 1.25 × $11.450); escribir "0,750" se normaliza a "0.750" y calcula 0.75 und correctamente. En "Lista", el campo de cantidad permite escribir "1.5" letra por letra sin resetearse. `npx tsc --noEmit` limpio.

### [2026-08-03] — App Android nativa (Capacitor) con actualización en caliente

Después de varios intentos de arreglar el flujo de actualización de la PWA (ver entradas anteriores de hoy), Jonatan seguía teniendo que borrar la app + historial del navegador para ver versiones nuevas — confirmado como **limitación real de PWAs instaladas en iOS/Android** (WebAPK en Android revisa manifest/SW con su propio calendario interno, ~1 vez al día, sin API para forzarlo; iOS es aún más agresivo cacheando "web clips"). Se decidió no seguir peleando con eso y envolver la misma app en una **app Android nativa real** con Capacitor. iOS queda pendiente (Jonatan no tiene Mac disponible por ahora — Xcode es obligatorio para compilar iOS).

**Decisiones de arquitectura (confirmadas con Jonatan):**
- Solo Android por ahora, no iPhone.
- Actualización de código **en caliente** (no reinstalar manualmente en cada cambio) — se evaluó y se descartó "reinstalar cuando haya cambios grandes" por ser más simple pero perpetuar la fricción que se quería resolver.
- Compartir datos en familia (Marcela+Jonatan viendo lo mismo) ya estaba resuelto por el modelo de instancia compartida (Firestore `corpos/shared`) — no cambia con este pivote, se preserva tal cual.

**Qué se agregó:**
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` — wrapper nativo. `capacitor.config.ts` (`appId: com.corpos.gastos`, `webDir: dist`).
- `android/` — proyecto nativo generado con `npx cap add android`, commiteado a git (carpetas de build ignoradas, ver `.gitignore`).
- `@capgo/capacitor-updater` (self-hosted, sin cuenta/servicio de Capgo) — permite reemplazar el código JS/HTML/CSS dentro de la app instalada sin pasar por ningún store. Lógica de chequeo en `src/hooks/useOtaUpdate.ts`: revisa `https://corpos-gastos.vercel.app/updates/version.json` al abrir la app y cada hora; si la versión difiere, descarga y aplica el bundle nuevo solo. `notifyAppReady()` obligatorio en cada arranque para no revertir automáticamente.
- `scripts/build-ota-bundle.mjs` (`postbuild` en `package.json`) — zippea el `dist/` de cada build y escribe `dist/updates/version.json`; como `dist/` se despliega tal cual a Vercel, cada `git push` a main deja la actualización disponible sin pasos manuales. Mantiene solo los últimos 5 bundles para no acumular basura.
- `App.tsx`: el registro del service worker (`PwaUpdater`) ahora solo se monta si `!Capacitor.isNativePlatform()` — dentro del WebView de Android un SW registrado interceptaría archivos viejos por encima de las actualizaciones en caliente de CapacitorUpdater. La web (Vercel) sigue funcionando exactamente igual que antes.
- `docs/DISTRIBUCION_ANDROID.md`: guía completa para Jonatan — instalar Android Studio, generar el keystore de firma (**crítico: hacer backup, perderlo impide firmar actualizaciones nativas futuras para instalaciones existentes**), compilar el APK, distribuirlo por link directo (sin Play Store), y qué tipo de cambios sí requieren reinstalar (solo cambios nativos: nuevo plugin, ícono, permisos — no cambios de código normales).

**Pendiente / no ejecutable desde acá:** instalar Android Studio, generar el keystore, compilar y firmar el primer APK, y probarlo en un celular real son pasos que Jonatan tiene que correr en su máquina — no hay Android SDK/JDK en este entorno para hacerlo. QA verificado hasta donde se pudo: `npx cap add android` y `npx cap sync` corren limpios, `0 errores TypeScript`, build web completo (incluyendo el bundle OTA) verificado, la web en el navegador sigue funcionando idéntico sin errores de consola.

### [2026-08-03] — Fix botón "Revisar ahora" sin feedback

Jonatan reportó que el botón "Revisar ahora" (Ajustes → Versión de la app) no parecía hacer nada. Causa: el `localStorage.setItem` y el `setNow` que refrescan el texto vivían **dentro** del `.then()` de `navigator.serviceWorker.getRegistration()` — si esa promesa no resolvía como se esperaba, no había ningún cambio visible ni señal de error.

- `checkNow` ahora actualiza el timestamp y dispara el re-render **de inmediato, de forma síncrona**, sin depender de la promesa del service worker. El `registration.update()` real sigue intentándose después, como best-effort.
- El botón muestra "✅ Revisado" por 2 segundos como confirmación visual (mismo patrón que "Guardar nombres").
- QA en navegador: confirmado que el timestamp en `localStorage` cambia al clic y el botón muestra el estado de confirmación.

Nota aparte para Jonatan: la primera vez que se despliega el fix de actualización PWA, todavía hace falta un refresh manual una vez — un service worker viejo no puede auto-mejorar su propia lógica de revisión hasta que la versión nueva (con esa lógica) quede activa. De ahí en adelante no debería volver a pasar.

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

### [2026-08-03] — Instancia separada para otra familia (OBSOLETO — ver Fase 4 del 2026-08-18)

**Esta funcionalidad fue reemplazada por el sistema de familias con Firebase Auth (Fase 4).** Ya no es necesario desplegar instancias separadas — cada familia tiene sus datos aislados en Firestore bajo `families/{familyId}/data/current`. La guía en `docs/DESPLIEGUE_INSTANCIA_SEPARADA.md` queda como referencia histórica.

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
