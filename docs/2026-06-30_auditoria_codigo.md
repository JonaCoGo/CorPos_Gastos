# Auditoría técnica — CorPos APP Gastos — 2026-06-30

Hallazgos de la auditoría de código de ese día. Es un punto en el tiempo: el estado de cada hallazgo no se mantiene aquí. Los hallazgos 1–4 no llevaban severidad ni recomendación en el registro original. Lo que sigue abierto está en `hoja_de_ruta.md`; la configuración de Firebase, en `firebase.md`.

| # | Hallazgo | Severidad | Recomendación |
|---|----------|-----------|---------------|
| 1 | Firestore abierto al mundo (`allow read, write: if true`) | — | — |
| 2 | Documento global compartido (`corpos/shared`) | — | — |
| 3 | TypeScript no pasaba (4 errores) | — | — |
| 4 | `apple-mobile-web-app-capable` deprecated | — | — |
| 5 | Sin tests unitarios | Alta | Tests para `computeSummary`, `convertQty`, `calculateMercadoTotals` |
| 6 | Dependencias con vulnerabilidades | Media | `npm audit fix`, actualizar Firebase |
| 7 | Sourcemaps en producción | Media | Desactivar `sourcemap: true` en Vite |
| 8 | Sin lint/format | Baja | ESLint + Prettier |
| 9 | localStorage expone datos financieros | Baja | Aceptar riesgo o cifrar |
| 10 | Sin control de concurrencia en Firestore | Baja | `updateDoc` en vez de `setDoc` completo |
| 11 | Firestore guarda todo en un solo documento | Baja | Separar por mes/subcolección (escala) |
| 12 | Chunk principal ~654KB | Baja | `manualChunks` para Firebase y lucide-react |
| 13 | Modales sin focus trap | Baja | Accesibilidad |
| 14 | Google Fonts externo | Baja | Self-host para offline/privacidad |
