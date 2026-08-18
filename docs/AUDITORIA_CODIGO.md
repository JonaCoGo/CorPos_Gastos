# Auditoría técnica y registro de fixes — CorPos APP Gastos

> Última actualización: 2026-08-18

---

## Estado general

| Aspecto | Estado |
|---------|--------|
| TypeCheck | ✅ 0 errores |
| Build | ✅ Producción en ~4s |
| Seguridad Firestore | ✅ Reglas por UID/familia |
| Auth | ✅ Firebase Auth (Google login) |
| Tests | 🔴 Ninguno |
| Lint/Format | 🔴 No configurado |
| Dependencias | 6 runtime + 11 dev |

---

## Hallazgos de auditoría (2026-06-30)

### Resueltos

| # | Hallazgo | Estado | Fecha fix |
|---|----------|--------|-----------|
| 1 | Firestore abierto al mundo (`allow read, write: if true`) | ✅ Resuelto | 2026-08-18 |
| 2 | Documento global compartido (`corpos/shared`) | ✅ Resuelto | 2026-08-18 |
| 3 | TypeScript no pasaba (4 errores) | ✅ Resuelto | 2026-08-18 |
| 4 | `apple-mobile-web-app-capable` deprecated | ⚠️ Pendiente menor |

### Pendientes

| # | Hallazgo | Severidad | Recomendación |
|---|----------|-----------|---------------|
| 5 | Sin tests unitarios | Alta | Tests para `computeSummary`, `convertQty`, `calculateMercadoTotals` |
| 6 | Dependencias con vulnerabilidades | Media | `npm audit fix`, actualizar Firebase |
| 7 | Sourcemaps en producción | Media | Desactivar `sourcemap: true` en Vite |
| 8 | Sin lint/format | Baja | ESLint + Prettier |
| 9 | localStorage expone datos financieros | Baja | Aceptar riesgo o cifrar |
| 10 | Sin control de concurrencia en Firestore | Baja | `updateDoc` en vez de `setDoc` completo |
| 11 | Firestore guarda todo en un solo documento | Baja | Separar por mes/subcolección (escala) |
| 12 | Chunk principal ~654KB | Baja | `manualChunks` para Firebase y lucide-react |
| 13 | Modales sin focus trap | Baja | Accesibilidad |
| 14 | Google Fonts externo | Baja | Self-host para offline/privacidad |

---

## Registro de fixes — Fase 4 (2026-08-18)

Historial de bugs encontrados y resueltos durante la implementación de Firebase Auth + Firestore por familia.

### Fix 1: API key con comillas en Vercel

**Síntoma:** `auth/api-key-not-valid.-please-pass-a-valid-api-key` al hacer `signInWithPopup`.

**Causa:** El `VITE_FIREBASE_API_KEY` en Vercel tenía comillas dobles alrededor del valor (`"AIzaSy..."`). Vite lee `.env` con dotenv (que strips comillas automáticamente), pero Vercel lee de `process.env` directamente, así que las comillas se incluían literalmente en la key.

**Evidencia:** el URL de la request mostraba `key=%22AIzaSy...%22` donde `%22` = `"`.

**Fix:** Borrar y recrear la env var en Vercel sin comillas.

**Lección:** Cuando se copia un valor desde Firebase Console (que lo muestra entre comillas), hay que pegar SOLO el valor, sin las comillas.

### Fix 2: Firestore rules sin publicar

**Síntoma:** `Missing or insufficient permissions` al leer `users/{uid}` después del login.

**Causa:** Las reglas de Firestore se actualizan POR SEPARADO del deploy de Vercel. Había que publicarlas desde Firebase Console → Firestore → Reglas → Publicar.

**Fix:** Pegar las reglas correctas y hacer click en "Publicar". Esperar ~30 segundos de propagación.

**Lección:** Las reglas de Firestore no se despliegan con `git push`. Hay que publicarlas manualmente o con `firebase deploy --only firestore:rules`.

### Fix 3: writeBatch + exists() conflict

**Síntoma:** `Missing or insufficient permissions` al crear la familia (después del fix 2).

**Causa:** `createFamily()` usaba un `writeBatch` para crear familia, miembro y datos juntos. Firestore rules evalúa `exists()` contra el estado **actual** de la BD (no los cambios pendientes del batch). Cuando el batch intenta escribir `data/current`, la regla verifica `exists(families/{id}/members/{uid})` — pero el member doc todavía no existe (es parte del mismo batch).

**Fix:** Separar en dos operaciones:
1. Batch: crear familia + miembro + usuario doc
2. `setDoc` separado: crear `data/current` (ahora el member ya existe)

**Lección:** En Firestore, `exists()` en rules solo ve el estado committed de la BD, no los cambios pendientes en un `writeBatch`. Si necesitás que un doc exista para que otro pase la validación, hay que commitearlos por separado.

### Fix 4: signInWithRedirect causaba loop

**Síntoma:** Login con Google en browser: elegir cuenta → volver a pantalla de login (sin error visible).

**Causa:** `signInWithRedirect` navega toda la página. Después de Google auth, la app recarga desde cero pero `onAuthChange` no se activaba correctamente con el resultado del redirect. El usuario terminaba de vuelta en el LoginScreen.

**Fix:** Volver a `signInWithPopup` para browser (que funciona correctamente desde que se corrigieron las comillas de la API key). Mantener `signInWithRedirect` solo para Capacitor (el popup no funciona en WebView).

**Código final en `auth.ts`:**
```ts
if (isNative) {
  await signInWithRedirect(auth, provider);  // Capacitor
} else {
  const cred = await signInWithPopup(auth, provider);  // Browser
}
```

### Fix 5: Auto-creación de familia con datos vacíos

**Síntoma:** Al hacer login, la app creaba una familia automáticamente con datos semilla (junio 2026 vacío) en vez de mostrar el OnboardingScreen para migrar datos existentes.

**Causa:** `App.tsx` tenía lógica que verificaba `hasLegacyData()` (localStorage) y auto-creaba una familia con esos datos. En el browser, localStorage tenía datos viejos de sesiones anteriores que no coincidían con los datos reales en Firestore.

**Fix:** Eliminar la auto-creación. Siempre mostrar OnboardingScreen cuando no hay `familyId`. El usuario elige "Crear mi familia" y la app migra los datos desde `corpos/shared`.

### Fix 6: App crashea si Firestore rules fallan

**Síntoma:** La app se quedaba en pantalla de carga infinita si `getUserFamilyId()` lanzaba un error de permisos.

**Causa:** No había try/catch en la llamada a `getUserFamilyId()`. Un error no capturado rompía el flujo de auth.

**Fix:** Envolver `getUserFamilyId()` y `loadLegacyData()` en try/catch. Si fallan, mostrar OnboardingScreen en vez de crashear.

---

## Configuración Firebase requerida

Para que la app funcione, estos pasos son obligatorios:

### Firebase Console
1. **Authentication → Sign-in method**: habilitar Google
2. **Authentication → Configuración → Dominios autorizados**: agregar `corpos-gastos.vercel.app`
3. **Firestore Database → Reglas**: publicar las reglas (ver `firestore.rules`)

### Google Cloud Console
1. **APIs y servicios → Credenciales**: verificar que la API key tenga Identity Toolkit API habilitada
2. **APIs y servicios → Pantalla de consentimiento**: debe estar "En producción"

### Vercel
1. **Environment Variables**: verificar que `VITE_FIREBASE_API_KEY` NO tenga comillas
2. Las 6 env vars de Firebase deben estar configuradas: `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`
