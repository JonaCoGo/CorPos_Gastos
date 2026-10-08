# Hoja de ruta · APP Gastos
*Actualizada: 2026-10-08. Solo lo que falta o está abierto: lo que se cierra se borra (queda en `git log`), lo que cambió del sistema pasa al `CONTEXTO.md` y las decisiones a `docs/adr/`. El mapa de documentos está en el `CONTEXTO.md`.*

## Próximos pasos

1. **Vulnerabilidades de dependencias** (2026-10-08). `npm audit` reporta 29 (3 críticas, 13 altas, 13 moderadas). Revisar `npm audit fix` y actualizar Firebase sin romper el build.
2. **Borrar el documento legacy `corpos/shared`** de la consola de Firestore. Las reglas ya lo bloquean (`corpos/{docId}`: `if false`), pero el documento puede seguir existiendo. En el código queda la constante muerta `FIRESTORE_DOC` (`src/constants.ts:3`).
3. **Separar el chunk principal** (2026-10-08): pesa ~668 KB sin comprimir. `manualChunks` en `vite.config.js` para Firebase y lucide-react.

## Supuestos sin validar

- **Mercado sugerido con datos reales** (2026-10-05). El historial de compras previo a "compras por mes" se perdió con el antiguo "Reiniciar compras", así que las sugerencias solo aparecen cuando haya un mes completo registrado (noviembre de 2026 en adelante). Revisar en noviembre que propongan algo útil.
- **Tamaño del documento de Firestore** (2026-10-05). Todo vive en `data/current` (límite 1 MB). Estimado: ~10–15 KB por mes de compras, años de margen. Medirlo con datos reales.

## Deuda técnica

- **Sin lint ni formatter** (2026-06-30): ESLint + Prettier.
- **`convertQty` sin prueba** (2026-10-08). Las demás funciones de cálculo (`calculateMercadoTotals`, `createEmptyMonth`, informe, listas, sugerencias) sí tienen.
- **Meta `apple-mobile-web-app-capable` obsoleta** en `index.html:8` (2026-06-30): da warning en consola.
- **Modales sin focus trap** (2026-06-30). `Modal.tsx` solo cierra con Escape.
- **Google Fonts desde el CDN** (2026-06-30) en `LoginScreen`, `OnboardingScreen` y `MainLayout`: alojarlas en el proyecto para offline y privacidad.
- **Sin control de concurrencia** (2026-06-30). El guardado normal reescribe `data/current` completo con `setDoc`; dos celulares editando a la vez pueden pisarse. Evaluar `updateDoc` por campo.
- **Todo en un solo documento** (2026-06-30). Separar por subcolecciones (mes, mercado, config) si el tamaño o la concurrencia lo exigen.
- **Datos financieros en `localStorage` sin cifrar** (2026-06-30). Decidir si se acepta el riesgo (es el respaldo offline del propio celular) o se cifra.
- **`src/features/TabSalaries.tsx` sin uso** (2026-10-08): los salarios viven en Ajustes y nadie importa ese archivo.

## Ideas futuras

- **React Native** en vez de la app Capacitor, solo si la experiencia actual resulta insuficiente. `utils/`, `services/`, `store/` y `types/` ya están desacoplados de React DOM.
- Presupuesto anual vs. ejecutado.
- Modo oscuro seleccionable a mano (hoy sigue al sistema).
- Categorías personalizables en extras.
- Modo solo lectura: link para compartir el resumen del mes.
- Widget de saldo libre para la pantalla de inicio.
- Integración con Bancolombia Open Finance.
