# CONTEXTO: APP_CorPos_Gastos

## 🎯 Propósito del Proyecto
Aplicación web para la gestión de gastos familiares de **Marcela y Jonatan**. Administra salarios, gastos del hogar, gastos personales, lista del mercado con historial de compras, gastos extras y proyecciones mensuales. El objetivo final es tener una app web modular y, eventualmente, migrar a React Native para Android/iOS.

## 🏗️ Arquitectura y Stack Actual
| Componente | Tecnología |
|---|---|
| Frontend | React 18.2 |
| Build Tool | Vite (migrado desde Create React App) |
| Lenguaje | TypeScript (modo estricto) |
| Backend/DB | Firebase Firestore (tiempo real) |
| Hosting | Vercel (despliegue automático desde GitHub) |

## 📁 Estructura Actual del Código (src/)
El proyecto ya no es un monolito puro. Se ha refactorizado parcialmente siguiendo el plan en `REFACTOR_PLAN.md`:

- **`src/constants.ts`**: Contiene todas las constantes, listas, iconos, supermercados y las 70 semillas de productos del mercado (`SEED_MARKET_ITEMS`).
- **`src/types/models.ts`**: Define las interfaces reales de TypeScript que reflejan la estructura de datos guardada en Firestore/LocalStorage (`MonthData`, `FamilyExpense`, `PersonalExpense`, `Extra`, `Mercado`, `Compra`, `ResumenFinanciero`, etc.).
- **`src/utils/finanzas.ts`**: Contiene **toda la lógica de negocio pura** (funciones matemáticas y de negocio) extraída del `App.tsx`. Incluye `COP` (formatter), `getMonthKey`, `createEmptyMonth`, `calculateMercadoTotals`, y `computeSummary`. Este código no tiene dependencias de React ni Firebase, por lo que es 100% reutilizable en React Native.
- **`src/components/ui/`**: Contiene los 7 componentes UI "tontos" (primitivas) extraídos de `App.tsx`: `Avatar`, `Btn`, `Card`, `Field`, `Label`, `Modal`, `ProgressBar`. Todos están tipados con TypeScript y exportados desde un `index.ts` barrel file.
- **`src/features/`**: Contiene las 7 vistas de las pestañas extraídas de `App.tsx`: `TabDashboard`, `TabFamilyExpenses`, `TabPersonalExpenses`, `TabSalaries`, `TabHistory`, `TabExtras`, `TabMercado`. Todas están tipadas con TypeScript y exportadas desde un `index.ts` barrel file.
- **`src/services/firestore.ts`**: Contiene **toda la lógica de persistencia y sincronización** extraída de `App.tsx`. Incluye `loadData` (carga desde localStorage con migraciones y semillas), `saveData` (guarda en localStorage y Firestore), y `subscribeToFirestore` (suscripción en tiempo real a Firestore con callbacks para datos y estado de sincronización). Esto desacopla completamente la UI de Firebase, permitiendo cambiar a Supabase o AsyncStorage (React Native) solo reescribiendo este archivo.
- **`src/App.tsx`**: Ahora es un archivo ligero (~150 líneas) que solo contiene el estado global (`useState`), el enrutamiento de pestañas y la estructura general de la app. Toda la lógica de negocio, las vistas y la persistencia están separadas.

## 🚨 REGLAS DE ORO PARA LA IA (¡LEER ANTES DE ACTUAR!)
Como CTO virtual y Arquitecto de Software, debes seguir estas reglas estrictamente para evitar errores y pérdida de tiempo del usuario:

1. **EJECUTA, NO SOLO DESCRIBAS**: **SIEMPRE** debes usar las herramientas de `Filesystem-*` (read, write, edit, move, etc.) para realizar los cambios reales en los archivos. **NUNCA** digas "He creado el archivo X" si no has ejecutado la herramienta `Filesystem-write_file` o `Filesystem-edit_file` para crearlo. El usuario ya se ha quejado de alucinaciones donde solo se describe el código pero no se escribe en el disco.
2. **DOCUMENTA SIEMPRE**: Después de cada paso completado con éxito, **SIEMPRE** debes actualizar `REFACTOR_PLAN.md` añadiendo una entrada en la "Bitácora de Cambios" con la fecha, qué se hizo y marcando el paso como completado.
3. **VERIFICA ANTES DE DESTRUIR**: Antes de borrar archivos o hacer cambios destructivos, confirma con el usuario o asegúrate de tener una copia de seguridad.
4. **SIGUE EL PLAN**: El plan de refactorización paso a paso está detallado en `REFACTOR_PLAN.md`. No te saltes fases. Si vas a empezar una fase nueva, lee primero los archivos actuales para entender exactamente qué hay.
5. **FLUJO DE TRABAJO**: El usuario se encarga de hacer `git add`, `git commit` y `git push` a GitHub (desde donde Vercel despliega automáticamente). Tú solo te encargas de escribir el código y actualizar la documentación.

## 🚀 Próximos Pasos Inmediatos
Para saber exactamente qué hacer a continuación, **lee el archivo `REFACTOR_PLAN.md`**. 
Los próximos pasos lógicos son:
- **Fase 4**: Evaluar e integrar Zustand para el estado global.
- **Fase 5**: Implementar optimizaciones de rendimiento (`useMemo`, `useCallback`, lazy loading).
- **Fase 6**: Reglas de Firestore restrictivas, variables de entorno para Firebase (.env).

---
*Última actualización: 2026-06-13. Fase 3.5 (Firebase Service) completada.*
