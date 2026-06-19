# CorPos — Gestión de Gastos Familiares

App web PWA para gestión financiera personal y familiar. Administra salarios, gastos del hogar, gastos personales, extras, mercado mensual e historial por mes. Instalable en Android e iPhone sin pasar por tiendas de apps.

**URL producción:** https://corpos-gastos.vercel.app/

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript (modo estricto) |
| Build | Vite |
| Estado global | Zustand |
| Base de datos | Firebase Firestore (sincronización en tiempo real) |
| Persistencia local | localStorage (respaldo offline) |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Vercel (CI/CD automático desde GitHub) |

## Funcionalidades

- **Dashboard** — resumen financiero: salarios, neto, aportes proporcionales, saldo libre, pagos conjuntos, resumen por cuenta
- **Gastos del hogar** — categorías compartidas con presupuesto, monto real del mes, pagos por Marcela / Jonatan / Los dos
- **Gastos personales** — fijos individuales con día de vencimiento y notificación
- **Extras** — gastos imprevistos por persona y categoría
- **Mercado** — checklist de compras por supermercado, historial agrupado por viaje, edición de quién pagó
- **Historial** — cierre y revisión de meses anteriores
- **Configuración** — nombres, medios de pago, notificaciones

## Estructura

```
src/
├── App.tsx                  # Enrutador de pestañas + banner de actualización PWA
├── firebase.ts              # Inicialización Firebase (vars de entorno)
├── constants.ts             # Constantes, íconos, semillas de mercado
├── types/models.ts          # Interfaces TypeScript
├── utils/finanzas.ts        # Lógica de negocio pura (sin React ni Firebase)
├── services/firestore.ts    # Carga, guardado y suscripción Firestore
├── store/useAppStore.ts     # Store Zustand
├── hooks/useNotifications.ts
├── components/ui/           # Primitivas: Avatar, Btn, Card, Field, Modal, PaymentChips…
├── features/                # Vistas por pestaña
└── layouts/MainLayout.tsx   # Layout con bottom nav
```

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

Push a `main` → Vercel despliega automáticamente. Los usuarios con la app instalada ven el banner "🔄 Nueva versión disponible" y actualizan con un toque, sin reinstalar.

## Instalación como PWA

**Android:** abrí la URL en Chrome → menú → "Añadir a pantalla de inicio"  
**iPhone:** abrí la URL en Safari → botón compartir → "Añadir a pantalla de inicio"
