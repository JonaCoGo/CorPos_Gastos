# Plan de mejoras — CorPos APP Gastos

> Última actualización: 2026-06-18
> Objetivo: app web terminada y lista para migrar a React Native sin reescribir lógica de negocio.

---

## Cómo leer este plan

Cada ítem tiene:
- **Impacto** — valor para el usuario final (Alto / Medio / Bajo)
- **Esfuerzo** — tiempo estimado de implementación (S = horas, M = 1-2 días, L = 3+ días)
- **Bloquea migración** — si esto debe estar antes de React Native

---

## ✅ Fase 1 — Pulir lo existente (diseño + UX inmediato)

| # | Feature | Estado |
|---|---------|--------|
| 1.1 | SVG icons con Lucide React (bottom nav + acciones) | ✅ |
| 1.2 | Skeleton loader en carga inicial de Firestore | ✅ |
| 1.3 | ProgressBar mejorada: gradiente + borde redondeado | ✅ |
| 1.4 | Aria-labels y roles básicos en modales y botones | ✅ |

---

## ✅ Fase 2 — Medios de pago 💳

**Contexto:** Marcela y Jonatan tienen Bancolombia (ahorro) y Nu (TC). Están evaluando unificar salarios en una sola cuenta conjunta.

| # | Feature | Estado |
|---|---------|--------|
| 2.1 | Modelo `PaymentMethod` en `types/models.ts` | ✅ |
| 2.2 | CRUD de medios de pago en TabSettings | ✅ |
| 2.3 | Selector en gastos familiares | ✅ |
| 2.4 | Selector en gastos personales | ✅ |
| 2.5 | Selector en extras | ✅ |
| 2.6 | Selector en compras del mercado | ✅ |
| 2.7 | Resumen por medio de pago en Dashboard | ✅ |

---

## Fase 3 — Notificaciones y recordatorios 🔔

**Contexto:** gastos personales tienen campo `day` (día del mes). Eso ya es la base para recordatorios.

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 3.1 | PWA manifest + service worker base | Alto | S | Sí |
| 3.2 | Notificación push: gastos personales sin pagar en su día | Alto | M | Sí |
| 3.3 | Notificación push: gastos del hogar pendientes (configurable) | Alto | M | Sí |
| 3.4 | Resumen semanal del estado del mes | Medio | M | No |
| 3.5 | Recordatorio de cerrar el mes (último día) | Bajo | S | No |

**Meta de fase:** la app avisa sin que tengas que entrar a revisar.

---

## Fase 4 — Autenticación y multi-dispositivo 🔐

> Prerrequisito para hacer la app pública o multiusuario.

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 4.1 | Firebase Auth con Google login | Alto | M | Sí |
| 4.2 | Firestore rules por UID (datos privados por usuario) | Alto | S | Sí |
| 4.3 | Pantalla de login / onboarding inicial | Alto | M | Sí |
| 4.4 | Soporte multi-familia (preparación para app pública) | Alto | L | Sí |

**Meta de fase:** la app puede usarla cualquier persona, con sus propios datos, de forma segura.

---

## Fase 5 — React Native (migración)

> Solo arrancar esta fase cuando Fases 3 y 4 estén completas.

| # | Feature | Impacto | Esfuerzo |
|---|---------|---------|---------|
| 5.1 | Setup Expo + estructura de proyecto RN | — | M |
| 5.2 | Migrar `utils/finanzas.ts` y `services/firestore.ts` sin cambios | — | S |
| 5.3 | Migrar `store/useAppStore.ts` sin cambios | — | S |
| 5.4 | Migrar `types/models.ts` sin cambios | — | S |
| 5.5 | Reescribir componentes UI en React Native Paper o Tamagui | Alto | L |
| 5.6 | Navegación con React Navigation | — | M |
| 5.7 | Notificaciones con Expo Notifications (reemplaza PWA) | Alto | S |
| 5.8 | Build APK/IPA y publicación en stores | Alto | L |

**Ventaja actual:** `utils/`, `services/`, `store/` y `types/` se mueven sin tocar una línea. Solo se reescriben los componentes visuales.

---

## Backlog (ideas a evaluar)

- Modo "solo lectura" para compartir el resumen con un tercero (link público temporal)
- Integración con Bancolombia Open Finance (si eventualmente abre API pública en Colombia)
- Presupuesto anual vs ejecutado
- Categorías personalizables en extras (actualmente las define `EXTRA_CATS` en constants)
- Modo oscuro seleccionable manualmente (además del automático por sistema)
- Widget de saldo libre para pantalla de inicio (React Native)

---

## Estado del proyecto al 2026-06-18

| Fase | Estado |
|------|--------|
| Fase 1 — Diseño + UX | ✅ Completa |
| Fase 2 — Medios de pago | ✅ Completa |
| Fase 3 — Notificaciones | ⬜ Pendiente |
| Fase 4 — Auth + multi-dispositivo | ⬜ Pendiente |
| Fase 5 — React Native | ⬜ Pendiente |
