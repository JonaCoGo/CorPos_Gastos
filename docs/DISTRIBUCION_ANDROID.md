# App Android (Capacitor) — build, firma y distribución

Mismo código React/Vite, envuelto con [Capacitor](https://capacitorjs.com/) como app Android real. Las actualizaciones de código llegan solas (ver más abajo) — no hace falta Play Store ni que nadie reinstale nada, salvo en casos puntuales.

## Auth en Capacitor

La app usa Firebase Auth con Google login. En el navegador se usa `signInWithPopup` (abre una ventana emergente), pero en Capacitor/WebView el popup no funciona — se usa `signInWithRedirect` en su lugar. Esto significa:

1. Al tocar "Entrar con Google", la app navega a la pantalla de Google (no abre popup).
2. El usuario elige su cuenta de Google.
3. Google redirige de vuelta a la app.
4. La app procesa el resultado del redirect y continúa.

**Dominios autorizados:** el dominio de la app (`corpos-gastos.vercel.app`) DEBE estar en la lista de dominios autorizados de Firebase Console → Authentication → Configuración → Dominios autorizados.

## Requisitos para compilar (una sola vez)

1. Instalar **Android Studio** (incluye el JDK y el Android SDK — no hace falta instalarlos aparte): [developer.android.com/studio](https://developer.android.com/studio)
2. Abrir la carpeta `android/` de este proyecto con Android Studio ("Open" → seleccionar la carpeta `android`). La primera vez va a descargar componentes del SDK y sincronizar Gradle — puede tardar varios minutos.

## Generar el keystore de firma (una sola vez, para siempre)

Toda app Android debe firmarse con una clave. **La primera vez que firmes la app, esa clave queda ligada a ella para siempre** — perderla significa que nunca más vas a poder publicar una actualización nativa para los celulares que ya la tengan instalada (tocaría desinstalar y volver a instalar una app "distinta" en cada celular).

En Android Studio: **Build → Generate Signed Bundle / APK → APK → Create new...**
- Elegí una carpeta **fuera del repositorio de git** para guardar el archivo `.jks` (ej. una carpeta personal, o un gestor de contraseñas que soporte archivos adjuntos).
- Guardá la contraseña del keystore y la del alias en un lugar seguro — sin ellas tampoco podés volver a firmar.
- **Hacé un backup de este archivo ya mismo** (nube personal, USB, lo que sea) — es la pieza más fácil de perder y la más cara de perder.

## Compilar el APK firmado

**Build → Generate Signed Bundle / APK → APK** → seleccionar el keystore ya creado → **release** → Finish.

El `.apk` queda en `android/app/release/`. Ese es el archivo que se comparte.

## Distribuir a la familia (sin Play Store)

1. Enviá el archivo `.apk` por el medio que uses normalmente (WhatsApp, Drive, un link de descarga).
2. En el celular de cada persona, al intentar instalarlo Android va a advertir "no verificado" o similar — es esperado al no venir de Play Store. Deben permitir instalar desde esa fuente una sola vez (Android pide confirmación, no hay que cambiar configuración global de antemano en versiones recientes).
3. Listo — abre y funciona como cualquier app instalada, con ícono propio.

## Cómo llegan las actualizaciones después de instalada

**Cambios de código (lo normal — casi todo lo que se hace en este proyecto):**
No hace falta reinstalar nada. Al hacer `git push` a `main`, Vercel redeploya, y el script `postbuild` ya dejó el `version.json` con la versión nueva accesible en producción. La app revisa esa URL al abrirse y cada hora mientras está abierta — si detecta versión distinta, descarga el código nuevo y lo aplica sola, sin intervención de nadie.

**Cambios nativos (raros — agregar un plugin de Capacitor, cambiar ícono/nombre/permisos de la app):**
Estos sí requieren generar un APK nuevo (subir `versionCode`/`versionName` en `android/app/build.gradle` primero) y que cada quien lo reinstale una vez, igual que la primera instalación.

## Comandos útiles

```bash
# Después de cualquier cambio de código, antes de abrir Android Studio:
npm run build
npx cap sync android
```

`npx cap sync` copia el `dist/` más reciente al proyecto Android y actualiza plugins nativos si cambiaron. Hace falta correrlo después de cada `npm run build` antes de compilar un APK nuevo — aunque, como se explica arriba, la mayoría de los cambios de código **no necesitan un APK nuevo en absoluto**, solo el deploy normal a Vercel.
