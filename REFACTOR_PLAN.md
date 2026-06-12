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
- [ ] *Pendiente*: Ejecutar `npm install` y probar que la app arranca correctamente con `npm run dev`.

### 📝 Bitácora de Cambios

#### [2026-06-13] - Fase 1: Archivos de Configuración Creados
- Se creó `REFACTOR_PLAN.md` para documentar el progreso.
- Se creó `vite.config.js` en la raíz con configuración para React y puerto 3000.
- Se movió `index.html` a la raíz y se añadió el script de entrada de Vite (`/src/index.jsx`).
- Se actualizó `package.json`: se eliminó `react-scripts`, se añadieron `vite` y `@vitejs/plugin-react`, y se actualizaron los scripts (`dev`, `build`, `preview`).
- Se creó `src/index.jsx` y se vaciaron los antiguos `public/index.html` y `src/index.js` para evitar conflictos.

### ⚪ FASE 2: Introducción de TypeScript y Tipos
**Objetivo**: Tipar la aplicación para ganar seguridad y documentación viva.
- [ ] Instalar TypeScript y configurar `tsconfig.json`.
- [ ] Renombrar archivos de `.jsx` a `.tsx`.
- [ ] Crear `src/types/index.ts` con las interfaces principales (`Gasto`, `Salario`, `ItemMercado`, `Usuario`).

### ⚪ FASE 3: Extracción de Servicios y Lógica (Hooks)
**Objetivo**: Separar la lógica de negocio de la UI para que sea reutilizable en React Native.
- [ ] Crear `src/services/firebase.ts` (lógica de conexión y CRUD).
- [ ] Crear `src/hooks/useFinanzas.ts` (cálculos globales, saldos, proporciones).
- [ ] Crear `src/hooks/useMercado.ts` (lógica de lista y historial de compras).

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

### [Fecha Actual] - Inicio de Fase 1
- Se crea el plan de refactorización.
- Se inicia la migración de CRA a Vite.
