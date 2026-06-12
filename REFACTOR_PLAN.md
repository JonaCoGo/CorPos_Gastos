# Plan de Refactorización: APP_CorPos_Gastos

## 🎯 Objetivo General
Transformar la aplicación monolítica actual (un solo archivo `App.jsx` de ~1500 líneas con Create React App) en una arquitectura modular, escalable y tipada, preparando el terreno para una futura migración a React Native (Android/iOS).

## 📋 Estado Actual
- **Stack**: React 18.2, Firebase Firestore, Create React App (CRA).
- **Estructura**: Monolito en `src/App.jsx`, lógica de negocio y UI mezcladas.
- **Deuda Técnica**: Falta de tipado, reglas de Firestore abiertas, sin tests, recálculos sin memoización.

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
- [ ] **Paso 3.3**: Crear `src/hooks/useFinanzas.ts` (hook que envuelve la lógica de `utils/finanzas.ts` con estado de React).
- [ ] **Paso 3.4**: Crear `src/hooks/useMercado.ts` (lógica de lista y historial de compras).

### ⚪ FASE 4: Descomposición de la UI (Componentes)
**Objetivo**: Dividir el `App.jsx` en componentes pequeños y manejables.
- [ ] Crear `src/components/ui/` (Button, Card, Modal, Input, ProgressBar).
- [ ] Crear `src/components/features/` (DashboardView, HogarView, MercadoView, etc.).
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
