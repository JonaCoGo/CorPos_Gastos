# 💼 CorPos — Gestión de Gastos Familiares

App web para Marcela y Jonatan. Salarios, gastos del hogar, gastos personales, lista del mercado e historial mensual.

## 🚀 Cómo publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub
2. Ve a [vercel.com](https://vercel.com) → New Project → importa el repo
3. Vercel detecta automáticamente que es React → Deploy
4. En ~2 minutos tienes una URL pública que los dos pueden usar

## 🔥 Conectar Firebase (sincronización en tiempo real)

1. Crea un proyecto en [firebase.google.com](https://firebase.google.com)
2. Activa **Firestore Database** en modo prueba
3. Ve a ⚙️ Configuración → General → Tus apps → Web (</>)
4. Copia las credenciales en `src/firebase.js`
5. Instala el SDK: `npm install firebase`
6. Descomenta el código en `src/firebase.js`

## 💻 Desarrollo local

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000)
