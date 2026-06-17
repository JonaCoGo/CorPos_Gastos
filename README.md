# CorPos — Gestión de Gastos Familiares

App web para gestión financiera personal y familiar. Administra salarios, gastos del hogar, gastos personales, extras, mercado mensual e historial por mes.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript (modo estricto) |
| Build | Vite |
| Estado global | Zustand |
| Base de datos | Firebase Firestore (sincronización en tiempo real) |
| Persistencia local | localStorage (respaldo offline) |
| Hosting | Vercel (CI/CD automático desde GitHub) |

## Estructura

```
src/
├── App.tsx                  # Enrutador de pestañas, estado global via Zustand
├── firebase.ts              # Inicialización Firebase (vars de entorno)
├── constants.ts             # Constantes, iconos, semillas de mercado
├── types/models.ts          # Interfaces TypeScript (MonthData, Mercado, AppConfig…)
├── utils/finanzas.ts        # Lógica de negocio pura (sin dependencias React/Firebase)
├── services/firestore.ts    # Carga, guardado y suscripción a Firestore
├── store/useAppStore.ts     # Store Zustand (estado + acciones)
├── components/ui/           # Primitivas: Avatar, Btn, Card, Field, Label, Modal, Select, Toast
├── features/                # Vistas por pestaña: Dashboard, Hogar, Personal, Extras, Mercado, Historial, Salarios, Configuración
└── layouts/MainLayout.tsx   # Layout principal con bottom nav
```

## Pestañas disponibles

- **Dashboard** — resumen financiero del mes
- **Hogar** — gastos familiares compartidos
- **Personal** — gastos individuales de cada persona
- **Extras** — gastos imprevistos o variables
- **Mercado** — lista de productos + historial de compras
- **⋯ Más** → Salarios / Historial / Configuración

## Desarrollo local

```bash
npm install
npm run dev
```

Crea `.env` en la raíz con las variables Firebase:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Deploy

Conecta el repositorio a [Vercel](https://vercel.com). El deploy es automático en cada push a `main`. Configura las mismas variables de entorno en el dashboard de Vercel.
