# Plan de mejoras — CorPos APP Gastos

> Última actualización: 2026-08-18

---

## Estado de fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Diseño + UX | ✅ Completa |
| Fase 2 | Medios de pago | ✅ Completa |
| Fase 3 | Notificaciones + PWA | ✅ Completa |
| Fase 4 | Auth + datos privados | ✅ Completa |
| Fase 5 | React Native | ⬜ Pendiente (evaluar si aplica) |

---

## Pendientes cercanos

| Prioridad | Tarea | Descripción |
|-----------|-------|-------------|
| 🔴 Alta | Tests unitarios | `computeSummary`, `convertQty`, `calculateMercadoTotals`, `createEmptyMonth`. Son funciones puras de cálculo financiero — un bug = dinero mal asignado. |
| 🟡 Media | `npm audit fix` | 20 vulnerabilidades (14 moderadas, 6 altas), mayoría de `@capacitor/cli` y Firebase. |
| 🟡 Media | Eliminar `corpos/shared` | Backup temporal. Eliminar después de confirmar que la migración funciona en producción para todos los miembros. |
| 🟡 Media | manualChunks en Vite | Separar Firebase y lucide-react del chunk principal (~654KB → ~170KB gzip). |
| 🟢 Baja | Sourcemaps en producción | Desactivar `sourcemap: true` en `vite.config.js`. |
| 🟢 Baja | ESLint + Prettier | No hay lint ni formatter configurado. |
| 🟢 Baja | apple-mobile-web-app-capable | Warning deprecation en consola. Cambiar meta tag en `index.html`. |

---

## Fase 5 — React Native (evaluar)

> Solo considerar si la experiencia web/PWA resulta insuficiente.
> La arquitectura ya está desacoplada: `utils/`, `services/`, `store/` y `types/` se mueven sin cambios.

| # | Feature |
|---|---------|
| 5.1 | Setup Expo |
| 5.2 | Migrar utils, services, store y types sin cambios |
| 5.3 | Reescribir componentes UI en React Native Paper o Tamagui |
| 5.4 | Navegación con React Navigation |
| 5.5 | Notificaciones con Expo Notifications |
| 5.6 | Build APK/IPA y publicación en stores |

---

## Backlog (ideas futuras)

- Presupuesto anual vs ejecutado
- Modo oscuro seleccionable manual
- Categorías personalizables en extras
- Modo solo lectura: link para compartir resumen del mes
- Widget de saldo libre para pantalla de inicio
- Integración Bancolombia Open Finance
- Control de concurrencia: usar `updateDoc` en vez de `setDoc` completo
- Separar Firestore por subcolecciones (mes, mercado, config) para escalar
