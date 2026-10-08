# Configuración de Firebase, Google Cloud y Vercel · APP Gastos

Pasos obligatorios para que la app funcione en un proyecto de Firebase nuevo o al revisar uno roto.

## Firebase Console
1. **Authentication → Sign-in method:** habilitar Google.
2. **Authentication → Configuración → Dominios autorizados:** agregar `corpos-gastos.vercel.app`. Sin esto tampoco funciona el login en la app Android.
3. **Firestore Database → Reglas:** publicar el contenido de `firestore.rules`. Las reglas **no** se despliegan con `git push` ni con Vercel: se publican desde la consola o con `firebase deploy --only firestore:rules`, y tardan ~30 s en propagarse.

## Google Cloud Console
1. **APIs y servicios → Credenciales:** la API key debe tener habilitada la Identity Toolkit API.
2. **APIs y servicios → Pantalla de consentimiento:** en estado "En producción".

## Vercel
1. **Environment Variables:** las 6 variables de `.env.example` (`VITE_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`).
2. Pegar **solo el valor, sin comillas**. Firebase Console muestra los valores entre comillas; en local Vite las quita, pero Vercel las incluye literalmente y el login falla con `auth/api-key-not-valid`.

## Cosas a saber al tocar el código
- **`exists()` en las reglas solo ve lo ya escrito**, no lo pendiente dentro de un `writeBatch`. Por eso `createFamily` crea primero familia + miembro + usuario en un batch y después `data/current` aparte: la regla de `data/` exige que el miembro ya exista.
- **Login:** `signInWithPopup` en el navegador y `signInWithRedirect` en Capacitor (el popup no funciona en el WebView). El redirect en el navegador causaba un bucle de vuelta al login.
