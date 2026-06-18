# Plan de mejoras — CorPos APP Gastos

> Última actualización: 2026-06-18
> Objetivo: app web terminada y lista para migrar a React Native sin reescribir lógica de negocio.

---

## Cómo leer este plan

Cada ítem tiene:
- **Impacto** — valor para el usuario final (Alto / Medio / Bajo)
- **Esfuerzo** — tiempo estimado de implementación (S = horas, M = 1-2 días, L = 3+ días)
- **Bloquea migración** — si esto debe estar antes de React Native

Las fases son orientativas. Dentro de cada fase podemos reordenar según prioridad.

---

## Fase 1 — Pulir lo existente (diseño + UX inmediato)

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 1.1 | Reemplazar emojis del bottom nav por SVG icons (Lucide React) | Alto | S | Sí |
| 1.2 | Skeleton loader en carga inicial de Firestore | Medio | S | No |
| 1.3 | ProgressBar mejorada: gradiente + borde redondeado | Bajo | S | No |
| 1.4 | Aria-labels y roles básicos en modales y botones | Medio | S | No |

**Meta de fase:** la app se ve y se siente como producto terminado, no prototipo.

---

## Fase 2 — Medios de pago 💳

**Contexto:** Marcela y Jonatan tienen Bancolombia (ahorro) y Nu (TC). Están evaluando unificar salarios en una sola cuenta conjunta.

**Modelo de datos propuesto:**

```ts
// En AppConfig — configurable por el usuario
paymentMethods: PaymentMethod[];

interface PaymentMethod {
  id: string;           // "bancolombia_marce", "nu_jona", etc.
  label: string;        // "Bancolombia Marcela"
  type: "ahorro" | "credito" | "efectivo" | "otro";
  owner: "marcela" | "jonatan" | "conjunto";
  color?: string;       // para chips visuales
  active: boolean;
}
```

**Dónde aplica:**
- `FamilyExpense` — campo opcional `paymentMethodId?: string`
- `PersonalExpense` — campo opcional `paymentMethodId?: string`
- `Extra` — campo opcional `paymentMethodId?: string`
- `Compra` (mercado) — campo opcional `paymentMethodId?: string`

**UX:** chip selector compacto al registrar/editar un gasto. No obligatorio — si no se selecciona, queda sin medio de pago registrado.

**Reportes que habilita:**
- Cuánto se pagó desde cada cuenta en el mes
- Conciliación: "lo que registré en Bancolombia debe coincidir con el extracto"
- Historial de uso de TC Nu (para saber cuánto viene en el estado de cuenta)

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 2.1 | Modelo `PaymentMethod` en `types/models.ts` | Alto | S | Sí |
| 2.2 | CRUD de medios de pago en TabSettings | Alto | M | Sí |
| 2.3 | Selector de medio de pago en gastos familiares | Alto | M | Sí |
| 2.4 | Selector de medio de pago en gastos personales | Alto | M | Sí |
| 2.5 | Selector de medio de pago en extras | Medio | S | Sí |
| 2.6 | Selector de medio de pago en compras del mercado | Medio | S | Sí |
| 2.7 | Resumen de uso por medio de pago en Dashboard | Alto | M | Sí |

**Meta de fase:** trazabilidad completa de cada peso gastado — con qué cuenta y de quién.

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

## Fase 4 — Gráficas y tendencias 📈

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 4.1 | Instalar Recharts (liviano, compatible con RN vía Victory Native) | — | S | Sí |
| 4.2 | Gráfica de barras: gasto por categoría del hogar en el mes actual | Alto | M | Sí |
| 4.3 | Gráfica de líneas: evolución del gasto total mes a mes (últimos 6 meses) | Alto | M | Sí |
| 4.4 | Gráfica de dona: distribución personal vs hogar vs extras | Medio | S | Sí |
| 4.5 | Tendencia de extras por categoría (últimos 3 meses) | Medio | M | Sí |

**Meta de fase:** el Dashboard muestra el panorama financiero real de un vistazo, no solo números.

---

## Fase 5 — Exportación y reportes 📄

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 5.1 | Exportar resumen del mes a PDF (jsPDF o html2canvas) | Alto | M | No* |
| 5.2 | Exportar lista de compras del mercado a PDF | Medio | S | No* |
| 5.3 | Resumen anual: tabla de 12 meses con totales | Alto | M | Sí |
| 5.4 | Exportar datos completos a JSON (respaldo manual) | Bajo | S | Sí |

> \* La exportación PDF no migra a React Native directamente pero el modelo de datos sí. En RN se usaría una librería nativa equivalente.

**Meta de fase:** Marcela puede generar el cierre de mes y compartirlo sin capturas de pantalla.

---

## Fase 6 — Autenticación y multi-dispositivo 🔐

> Prerrequisito para hacer la app pública o multiusuario.

| # | Feature | Impacto | Esfuerzo | Migración |
|---|---------|---------|---------|-----------|
| 6.1 | Firebase Auth con Google login | Alto | M | Sí |
| 6.2 | Firestore rules por UID (datos privados por usuario) | Alto | S | Sí |
| 6.3 | Pantalla de login / onboarding inicial | Alto | M | Sí |
| 6.4 | Soporte multi-familia (preparación para app pública) | Alto | L | Sí |

**Meta de fase:** la app puede usarla cualquier persona, con sus propios datos, de forma segura.

---

## Fase 7 — React Native (migración)

> Solo arrancar esta fase cuando Fase 1–4 estén completas y Fase 6 al menos en 6.1–6.3.

| # | Feature | Impacto | Esfuerzo |
|---|---------|---------|---------|
| 7.1 | Setup Expo + estructura de proyecto RN | — | M |
| 7.2 | Migrar `utils/finanzas.ts` y `services/firestore.ts` sin cambios | — | S |
| 7.3 | Migrar `store/useAppStore.ts` sin cambios | — | S |
| 7.4 | Migrar `types/models.ts` sin cambios | — | S |
| 7.5 | Reescribir componentes UI en React Native Paper o Tamagui | Alto | L |
| 7.6 | Navegación con React Navigation | — | M |
| 7.7 | Notificaciones con Expo Notifications (reemplaza PWA) | Alto | S |
| 7.8 | Build APK/IPA y publicación en stores | Alto | L |

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
| Fase 1 | 🟡 En progreso (1.1 pendiente, 1.2–1.4 pendientes) |
| Fase 2 | ⬜ Pendiente |
| Fase 3 | ⬜ Pendiente |
| Fase 4 | ⬜ Pendiente |
| Fase 5 | ⬜ Pendiente |
| Fase 6 | ⬜ Pendiente |
| Fase 7 | ⬜ Pendiente |
