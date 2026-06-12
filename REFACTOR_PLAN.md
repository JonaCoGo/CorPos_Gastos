# Plan de Refactorización: APP_CorPos_Gastos

## 🎯 Objetivo General
Transformar la aplicación monolítica actual (un solo archivo `App.jsx` de ~1500 líneas con Create React App) en una arquitectura modular, escalable y tipada, preparando el terreno para una futura migración a React Native (Android/iOS).

## 📋 Estado Actual
- **Stack**: React 18.2, Vite, TypeScript, Firebase Firestore, Vercel.
- **Estructura**: `App.tsx` ya no es un monolito puro. La lógica de negocio pura está en `src/utils/finanzas.ts`, los tipos en `src/types/models.ts`, y las constantes en `src/constants.ts`. 
- **Deuda Técnica Pendiente**: `App.tsx` aún contiene componentes UI, vistas (tabs) y la integración directa con Firebase/Estado. Reglas de Firestore abiertas, sin tests, recálculos sin memoización.

---

## 🗺️ Fases del Plan

### 🟢 FASE 1: Modernización del Entorno (Vite + Preparación)
**Objetivo**: Reemplazar Create React App por Vite para mejorar la velocidad de desarrollo y preparar el entorno para TypeScript.
- [x] Crear este archivo de seguimiento (`REFACTOR_PLAN.md`).
- [x] Mover `public/index.html` a la raíz del proyecto.
- [x] Crear `vite.config.js`.
- [x] Actualizar `package.json` (scripts y dependencias).
- [x] Renombrar `src/index.js` a `src/index.jsx`.
- [x] Ejecutar `npm install` y probar que la app arranca correctamente con `npm run dev`.
- [x] Configurar Git local y conectar con repositorio remoto de GitHub.
- [x] Resolver conflictos de merge (mantener configuración Vite) y subir cambios a GitHub.
- [x] Despliegue automático en Vercel con la nueva configuración de Vite.

### 📝 Bitácora de Cambios

#### [2026-06-13] - Fase 1: Archivos de Configuración Creados
- Se creó `REFACTOR_PLAN.md` para documentar el progreso.
- Se creó `vite.config.js` en la raíz con configuración para React y puerto 3000.
- Se movió `index.html` a la raíz y se añadió el script de entrada de Vite (`/src/index.jsx`).
- Se actualizó `package.json`: se eliminó `react-scripts`, se añadieron `vite` y `@vitejs/plugin-react`, y se actualizaron los scripts (`dev`, `build`, `preview`).
- Se creó `src/index.jsx` y se vaciaron los antiguos `public/index.html` y `src/index.js` para evitar conflictos.

### 🟡 FASE 2: Introducción de TypeScript y Tipos
**Objetivo**: Tipar la aplicación para ganar seguridad y documentación viva.
- [x] Instalar TypeScript y configurar `tsconfig.json`.
- [x] Renombrar archivos de `.jsx` a `.tsx`.
- [x] Crear `src/types/index.ts` con las interfaces principales (`Gasto`, `Salario`, `ItemMercado`, `Usuario`).

### 🟡 FASE 3: Extracción de Servicios y Lógica (Hooks)
**Objetivo**: Separar la lógica de negocio de la UI para que sea reutilizable en React Native.
- [x] **Paso 3.1**: Crear `src/constants.ts` y extraer todas las constantes, listas, semillas y configuraciones (`STORAGE_KEY`, `FIRESTORE_DOC`, `defaultPersonalExpenses`, `defaultFamilyCategories`, `ICONS`, `MONTH_NAMES`, `EXTRA_CATS`, `SUPERMARKETS`, `UNITS`, `ALL_CATS`, `SEED_MARKET_ITEMS`).
- [x] **Paso 3.2**: Crear `src/utils/finanzas.ts` (lógica de negocio pura: cálculos financieros, formatters, helpers de fecha) y `src/types/models.ts` (interfaces reales de los datos de la app: `MonthData`, `FamilyExpense`, `PersonalExpense`, `Extra`, `Mercado`, `Compra`, `ResumenFinanciero`).
- [x] **Paso 3.5**: Crear `src/services/firestore.ts` y extraer la lógica de Firebase/LocalStorage (`loadData`, `saveData`, `subscribeToFirestore`).

### ⚪ FASE 4: Descomposición de la UI (Componentes)
**Objetivo**: Dividir el `App.jsx` en componentes pequeños y manejables.
- [x] Crear `src/components/ui/` (Avatar, Btn, Card, Field, Label, Modal, ProgressBar).
- [x] Crear `src/features/` (TabDashboard, TabFamilyExpenses, TabPersonalExpenses, TabSalaries, TabHistory, TabExtras, TabMercado).
- [ ] Crear `src/layouts/MainLayout.tsx` (estructura general y navegación inferior).

### ⚪ FASE 5: Gestión de Estado y Optimización
**Objetivo**: Mejorar el rendimiento y simplificar el flujo de datos.
- [ ] Evaluar e integrar Zustand para estado global (si aplica).
- [ ] Implementar `useMemo` y `useCallback` en cálculos pesados.
- [ ] Lazy loading de vistas (React.lazy + Suspense).

### ⚪ FASE 6: Seguridad y Despliegue
**Objetivo**: Asegurar los datos y preparar para producción.
- [ ] Implementar reglas de Firestore restrictivas.
- [ ] Configurar variables de entorno para las credenciales de Firebase (`.env`).
- [ ] Actualizar configuración de Vercel para Vite.

---

## 📝 Bitácora de Cambios

### [2026-06-13] - Fase 2: Configuración de TypeScript y Tipos Iniciales
- Se instalaron las dependencias de TypeScript (`typescript`, `@types/react`, `@types/react-dom`, `@types/node`).
- Se creó `tsconfig.json` con la configuración estándar de Vite + React, habilitando modo estricto (`strict: true`) para máxima seguridad en los cálculos financieros.
- Se creó `tsconfig.node.json` para la configuración de Vite.
- Se creó el directorio `src/types/` y el archivo `src/types/index.ts` con las interfaces principales del dominio: `Usuario`, `GastoHogar`, `GastoExtra`, `ItemMercado`, `GastoPersonal`, `HistorialCompra`, `ResumenFinanciero`.
- Se renombraron los archivos de entrada de la aplicación: `src/index.jsx` a `src/index.tsx` y `src/App.jsx` a `src/App.tsx`.
- Se actualizó `index.html` para apuntar al nuevo script de entrada `/src/index.tsx`.
- Se vació el antiguo `src/index.js` para evitar confusiones.
- **Fase 2 completada al 100%. La aplicación ahora soporta TypeScript y tiene una base de tipos sólida para la refactorización.**

### [2026-06-13] - Fase 1: Migración a Vite y Flujo de Git Completada
- Se ejecutó `npm install` y la app arrancó correctamente en `http://localhost:3000/` usando Vite.
- Se inicializó Git localmente y se conectó con el repositorio remoto (`JonaCoGo/CorPos_Gastos`).
- Se realizó `git pull` con `--allow-unrelated-histories` para combinar el historial local (Vite) con el remoto (CRA).
- Se resolvieron conflictos en `package.json`, `public/index.html` y `src/index.js` usando `git checkout --ours` para mantener la configuración de Vite.
- Se subió exitosamente la nueva configuración a GitHub (`git push origin main`).
- Vercel detectó los cambios y desplegó la nueva versión impulsada por Vite automáticamente.
- **Fase 1 completada al 100%. El entorno de desarrollo está modernizado y el flujo de despliegue profesional (Local -> GitHub -> Vercel) está activo.**

### [2026-06-13] - Fase 3.1: Extracción de Constantes y Semillas
- Se creó el archivo `src/constants.ts`.
- Se extrajeron de `src/App.tsx` todas las constantes, listas y datos semilla:
  - `STORAGE_KEY`, `FIRESTORE_DOC`
  - `defaultPersonalExpenses`, `defaultFamilyCategories`
  - `ICONS`, `MONTH_NAMES`, `EXTRA_CATS`, `SUPERMARKETS`, `UNITS`, `ALL_CATS`
  - `SEED_MARKET_ITEMS` (los 70 productos iniciales del mercado).
- Se actualizó `src/App.tsx` para importar estas constantes desde `./constants` y se eliminaron las definiciones originales.
- Se eliminó la función interna `getSeedItems()` de `loadData()` y se reemplazó su uso por `SEED_MARKET_ITEMS`.
- **Paso 3.1 completado. El archivo `App.tsx` se redujo en ~200 líneas de "ruido" (datos estáticos), dejando solo la lógica y la UI.

### [2026-06-13] - Fase 3.2: Extracción de Lógica de Negocio Pura (Cerebro Financiero)
- Se creó el directorio `src/utils/`.
- Se creó `src/types/models.ts` con las interfaces reales que reflejan exactamente la estructura de datos que se guarda en Firestore/LocalStorage (`MonthData`, `FamilyExpense`, `PersonalExpense`, `Extra`, `Mercado`, `Compra`, `ResumenFinanciero`, etc.).
- Se creó `src/utils/finanzas.ts` y se extrajeron de `src/App.tsx` todas las funciones puras de lógica de negocio:
  - `COP(n)`: Formatter de moneda colombiana.
  - `getMonthKey(year, month)`: Helper para generar claves de mes.
  - `createEmptyMonth(...)`: Función para crear un mes vacío con carry-over de estados.
  - `calculateMercadoTotals(mercado)`: Calcula totales de compras por persona.
  - `computeSummary(monthData)`: El cerebro financiero (neto, proporciones, aportes, saldos libres).
- Se actualizó `src/App.tsx` para importar estas funciones desde `./utils/finanzas` y se eliminaron las definiciones originales.
- **Paso 3.2 completado. Toda la lógica financiera está ahora en un archivo separado, 100% tipado con TypeScript, sin dependencias de React ni Firebase. Esto significa que este código es directamente reutilizable en la futura app de React Native.**

### [2026-06-13] - Actualización de Documentación para Continuidad
- Se creó `CONTEXTO.md` en la raíz del proyecto para que cualquier nueva instancia de la IA pueda retomar el trabajo inmediatamente.
- Se añadieron las "Reglas de Oro para la IA" en `CONTEXTO.md` para garantizar que siempre se usen las herramientas de archivos reales y no se alucinen cambios.
- Se actualizó este `REFACTOR_PLAN.md` con el estado actual de la arquitectura y los próximos pasos exactos.

### [2026-06-13] - Fase 3.3 (UI): Extracción de Componentes UI "Tontos"
- Se creó el directorio `src/components/ui/`.
- Se extrajeron 7 componentes primitivos de `src/App.tsx` hacia sus propios archivos, tipándolos estrictamente con TypeScript:
  - `Avatar.tsx`: Avatar circular con colores dinámicos.
  - `Btn.tsx`: Botón con 6 variantes (primary, secondary, danger, marce, jona, ghost).
  - `Card.tsx`: Contenedor con sombra, bordes y hover effect.
  - `Field.tsx`: Input con Label integrado. Se añadió soporte para la prop `disabled` (corrigiendo un bug silencioso en los campos de mercado).
  - `Label.tsx`: Etiqueta de texto en mayúsculas.
  - `Modal.tsx`: Overlay oscuro con animación slideUp y cierre por clic fuera.
  - `ProgressBar.tsx`: Barra de progreso con cambio de color al llegar al 100%.
- Se creó `src/components/ui/index.ts` como barrel file para importar todos los componentes fácilmente.
- Se actualizó `src/App.tsx` para importar desde `./components/ui`, eliminando ~200 líneas de código de la UI.
- **Paso completado. La base de componentes UI está separada, tipada y lista para ser reutilizada.**

### [2026-06-13] - Fase 3.4 (Features): Extracción de Vistas de Pestañas
- Se creó el directorio `src/features/`.
- Se extrajeron 7 vistas completas de `src/App.tsx` hacia sus propios archivos, tipándolas con TypeScript:
  - `TabDashboard.tsx`: Vista de resumen financiero (salarios, gastos hogar, saldo libre).
  - `TabFamilyExpenses.tsx`: Vista de gastos del hogar con edición, creación y eliminación de categorías.
  - `TabPersonalExpenses.tsx`: Vista de gastos personales de Marcela y Jonatan.
  - `TabSalaries.tsx`: Vista de configuración de salarios brutos.
  - `TabHistory.tsx`: Vista de historial de meses con creación y eliminación.
  - `TabExtras.tsx`: Vista de gastos extras con categorías y totales por persona.
  - `TabMercado.tsx`: Vista de lista de productos y historial de compras (incluye `ItemCard` inline).
- Se creó `src/features/index.ts` como barrel file para importar todas las vistas fácilmente.
- Se actualizó `src/App.tsx` para importar desde `./features`, eliminando ~1000 líneas de código de las vistas.
- **Fase 3.4 completada. `App.tsx` ahora solo contiene la lógica de estado, Firebase y el enrutamiento de pestañas. El archivo pasó de ~1500 líneas a menos de 200.**

### [2026-06-13] - Fase 3.5 (Firebase Service): Extracción de Servicio de Datos
- Se creó el directorio `src/services/`.
- Se creó `src/services/firestore.ts` y se extrajeron de `src/App.tsx` todas las funciones de persistencia y sincronización:
  - `loadData()`: Carga datos desde localStorage, aplica migraciones (semillas de mercado) y genera el mes semilla inicial si no hay datos.
  - `saveData(d)`: Guarda datos en localStorage como respaldo y los sincroniza con Firestore.
  - `subscribeToFirestore(onData, onSyncChange)`: Se suscribe a los cambios en tiempo real de Firestore, empuja datos locales si la nube está vacía, y notifica el estado de sincronización.
- Se actualizó `src/App.tsx` para importar desde `./services/firestore`, eliminando toda la lógica directa de Firebase (`doc`, `onSnapshot`, `setDoc`, `getDoc`) y reduciendo el `useEffect` de sincronización a solo 3 líneas.
- **Paso 3.5 completado. `App.tsx` ahora está completamente desacoplado de la implementación de Firebase. Si en el futuro se cambia a Supabase o AsyncStorage (React Native), solo hay que reescribir `src/services/firestore.ts` sin tocar la UI ni la lógica de negocio.**

---

## 🚀 Próximos Pasos Inmediatos (Para el siguiente chat)

1. **Fase 4 (State Management)**: Evaluar e integrar Zustand para manejar el estado global, reemplazando los múltiples `useState` en `App.tsx`.
2. **Fase 5 (Optimization)**: Implementar `useMemo` y `useCallback` en cálculos pesados, lazy loading de vistas.
3. **Fase 6 (Security & Deploy)**: Reglas de Firestore restrictivas, variables de entorno para Firebase (.env).
