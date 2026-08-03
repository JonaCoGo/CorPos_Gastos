# Desplegar una instancia separada (otra familia)

Guía para dar esta misma app a otra pareja/familia (ej. el hermano de Jonatan) **sin mezclar datos** con la instancia de producción actual (`corpos-gastos.vercel.app`).

## Por qué una instancia separada y no multi-usuario

La app no tiene login ni separación de datos por usuario — `FIRESTORE_DOC = "corpos/shared"` en `src/constants.ts` es un único documento fijo que usa todo el que entre a la URL. Agregar autenticación y aislamiento de datos por hogar dentro de la misma app es una reescritura grande (Auth, invitaciones, migración del documento actual a un esquema multi-hogar) que solo se justifica si en el futuro esto se ofrece como producto a terceros desconocidos. Para compartir con una familia conocida, desplegar una segunda copia independiente resuelve el problema en minutos y con cero riesgo sobre los datos actuales.

El código ya está preparado para esto: `src/firebase.ts` lee toda la configuración desde variables de entorno (`import.meta.env.VITE_FIREBASE_*`). No hace falta tocar una sola línea de código — solo crear un segundo backend y apuntar un segundo deploy a él.

## Pasos

### 1. Crear un proyecto de Firebase nuevo

1. Ir a [console.firebase.google.com](https://console.firebase.google.com) → **Crear proyecto** (ej. `corpos-gastos-hermano`).
2. Dentro del proyecto: **Compilación → Firestore Database → Crear base de datos** (modo producción, región `southamerica-east1` o la más cercana).
3. **Configuración del proyecto → Agregar app → Web (`</>`)**. Copiar el objeto `firebaseConfig` que aparece — de ahí salen los 6 valores que van al `.env`.
4. En **Reglas de Firestore**, usar temporalmente las mismas reglas que ya tiene la instancia actual (revisar en la consola del proyecto original y replicar) — no hay auth, así que las reglas solo deben permitir lectura/escritura al documento `corpos/shared` de ese proyecto.

### 2. Crear un proyecto de Vercel nuevo

1. En [vercel.com](https://vercel.com) → **Add New → Project**.
2. Importar el **mismo repositorio de GitHub** que ya usa `corpos-gastos.vercel.app` (mismo código, no se duplica el repo).
3. En **Environment Variables**, cargar los 6 valores del `firebaseConfig` del proyecto Firebase nuevo (paso 1.3):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. Deploy. Vercel asigna una URL propia (ej. `corpos-gastos-hermano.vercel.app`), o se puede configurar un dominio personalizado.

### 3. Primer uso

1. El hermano y su esposa entran a la URL nueva. Como el documento de Firestore está vacío, la app carga la semilla inicial (mes en cero, productos de mercado por defecto).
2. En **Ajustes → Nombres a mostrar**, cambian "Marcela"/"Jonatan" por sus propios nombres.
3. Configuran sus propios medios de pago y supermercados igual que Jonatan lo hizo — todo eso vive en `config`, por hogar, sin nada compartido con la instancia original.

## Mantenimiento a futuro

Como ambas instancias corren el **mismo código** desde el mismo repo:
- Un cambio de código (bug fix, feature nueva) se hace una sola vez y se hace push a la rama que ambos proyectos de Vercel siguen — los dos deploys se actualizan solos.
- Los datos siguen sin mezclarse nunca: cada proyecto de Vercel apunta a su propio proyecto de Firebase.
- Si en el futuro se necesita una feature que solo aplique a una de las dos familias, ahí sí hay que evaluar si conviene una rama separada o una bandera de configuración — no es el caso hoy.

## Qué necesita hacer Jonatan (esto no se puede automatizar)

Los pasos 1 y 2 requieren cuentas reales (Google/Firebase, GitHub, Vercel) y decisiones de facturación — son acciones que debe ejecutar Jonatan directamente en las consolas de Firebase y Vercel, no algo que se resuelva por código.
