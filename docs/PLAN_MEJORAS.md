# Plan de mejoras — CorPos APP Gastos

> Última actualización: 2026-08-18
> Objetivo: app web estable en producción → migración opcional a React Native cuando tenga sentido.

---

## Estado al 2026-06-19

| Fase | Estado |
|------|--------|
| Fase 1 — Diseño + UX | ✅ Completa |
| Fase 2 — Medios de pago | ✅ Completa |
| Fase 3 — Notificaciones + PWA | ✅ Completa |
| Fase 4 — Auth + datos privados | ✅ Completa |
| Fase 5 — React Native | ⬜ Pendiente (evaluar si aplica) |

---

## ✅ Fase 1 — Diseño + UX

- Lucide React en bottom nav y acciones
- Skeleton loader en carga inicial
- ProgressBar con gradiente
- Dark mode automático
- Toast/snackbar en acciones
- Bottom nav con 5 tabs + "⋯ Más"
- Aria-labels en modales y botones

---

## ✅ Fase 2 — Medios de pago

- Modelo `PaymentMethod` (ahorro / crédito / efectivo / conjunto)
- CRUD en TabSettings con color y titular
- Selector en gastos del hogar, personales, extras y mercado
- Resumen por cuenta en Dashboard

---

## ✅ Fase 3 — Notificaciones + PWA

- PWA instalable en Android (Chrome) e iPhone (Safari → "Añadir a pantalla de inicio")
- URL producción: https://corpos-gastos.vercel.app/
- Notificaciones push: gastos personales sin pagar en su día
- Banner "🔄 Nueva versión disponible" — un toque actualiza sin reinstalar
- Workbox con `skipWaiting` + `clientsClaim`

---

## ✅ Fase 4 — Autenticación y datos privados 🔐 (2026-08-18)

| # | Feature | Estado |
|---|---------|--------|
| 4.1 | Firebase Auth con Google login | ✅ `services/auth.ts` — login/logout/escucha auth |
| 4.2 | Firestore rules por UID + familia | ✅ `firestore.rules` — reglas completas |
| 4.3 | Pantalla de login + onboarding | ✅ `LoginScreen.tsx` + `OnboardingScreen.tsx` |
| 4.4 | Soporte multi-familia | ✅ `familyService.ts` — crear/unirse con código |

**Modelo Firestore:**
```
users/{uid} → { familyId, displayName, email }
families/{familyId} → { name, inviteCode }
  members/{uid} → { role, displayName, joinedAt }
  data/current → AppData completa
```

**Migración:** auto-migración desde `corpos/shared` + localStorage en primer login.
**Pendiente:** eliminar `corpos/shared` después de confirmar migración en producción.

---

## Fase 5 — React Native (evaluar)

> Solo considerar si la experiencia web como PWA resulta insuficiente.
> La arquitectura ya está desacoplada: `utils/`, `services/`, `store/` y `types/` se mueven sin cambios.

| # | Feature |
|---|---------|
| 5.1 | Setup Expo |
| 5.2 | Migrar utils, services, store y types sin cambios |
| 5.3 | Reescribir componentes UI en React Native Paper o Tamagui |
| 5.4 | Navegación con React Navigation |
| 5.5 | Notificaciones con Expo Notifications (reemplaza PWA SW) |
| 5.6 | Build APK/IPA y publicación en stores |

---

## Backlog (ideas a evaluar en el futuro)

- Proyecto separado **CorPos_APP_Finanzas**: saldo real de cuentas, cajero efectivo, tarjeta de crédito, múltiples fuentes de ingreso
- Presupuesto anual vs ejecutado
- Modo oscuro seleccionable manualmente (además del automático)
- Categorías personalizables en extras
- Modo solo lectura: link para compartir resumen del mes
- Widget de saldo libre para pantalla de inicio (React Native)
- Integración Bancolombia Open Finance (si abren API pública en Colombia)
