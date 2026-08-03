import { useEffect, useMemo, useState, useCallback, Suspense, lazy } from "react";
import { Capacitor } from "@capacitor/core";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { db } from "./firebase";
import { MONTH_NAMES, SW_LAST_CHECK_KEY } from "./constants";
import { computeSummary } from './utils/finanzas';
import { useAppStore } from './store/useAppStore';
import MainLayout from './layouts/MainLayout';
import { Toast, AppSkeleton } from './components/ui';
import { TabMore } from './features/TabMore';
import { useNotifications } from './hooks/useNotifications';
import { useOtaUpdate } from './hooks/useOtaUpdate';

// autoUpdate: SW se actualiza en silencio, sin banner ni botón.
// Ojo: el navegador solo revisa si hay SW nuevo cuando algo se lo pide — una PWA
// instalada en el celular casi nunca hace esa revisión sola (se "reanuda", no navega).
// Por eso forzamos el chequeo cada hora y cada vez que se reabre la app.
const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

// El registro del service worker vive en un componente aparte que solo se monta
// en la web: dentro de la app nativa (Android) el WebView de Capacitor también
// soporta service workers, y uno registrado ahí interceptaría los assets viejos
// por encima de las actualizaciones en caliente de CapacitorUpdater.
function PwaUpdater() {
  useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        localStorage.setItem(SW_LAST_CHECK_KEY, new Date().toISOString());
        registration.update().catch(() => {});
      };

      // Revisión inmediata al registrar el SW, y luego periódica
      checkForUpdate();
      setInterval(checkForUpdate, SW_UPDATE_CHECK_INTERVAL_MS);

      // Revisión inmediata al volver a primer plano (reabrir desde el celular) —
      // el momento en el que más probablemente se perdió una actualización.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    },
  });
  return null;
}

const TabDashboard        = lazy(() => import('./features/TabDashboard').then(m => ({ default: m.TabDashboard })));
const TabFamilyExpenses   = lazy(() => import('./features/TabFamilyExpenses').then(m => ({ default: m.TabFamilyExpenses })));
const TabPersonalExpenses = lazy(() => import('./features/TabPersonalExpenses').then(m => ({ default: m.TabPersonalExpenses })));
const TabSalaries         = lazy(() => import('./features/TabSalaries').then(m => ({ default: m.TabSalaries })));
const TabHistory          = lazy(() => import('./features/TabHistory').then(m => ({ default: m.TabHistory })));
const TabExtras           = lazy(() => import('./features/TabExtras').then(m => ({ default: m.TabExtras })));
const TabMercado          = lazy(() => import('./features/TabMercado').then(m => ({ default: m.TabMercado })));
const TabSettings         = lazy(() => import('./features/TabSettings').then(m => ({ default: m.TabSettings })));

export default function App() {
  useOtaUpdate();

  const data   = useAppStore((s) => s.data);
  const tab    = useAppStore((s) => s.tab);
  const synced = useAppStore((s) => s.synced);

  const setTab               = useAppStore((s) => s.setTab);
  const updateMercado        = useAppStore((s) => s.updateMercado);
  const updateMonth          = useAppStore((s) => s.updateMonth);
  const selectMonth          = useAppStore((s) => s.selectMonth);
  const addMonth             = useAppStore((s) => s.addMonth);
  const deleteMonth          = useAppStore((s) => s.deleteMonth);
  const checkAndAdvanceMonth = useAppStore((s) => s.checkAndAdvanceMonth);
  const initFirestoreSync    = useAppStore((s) => s.initFirestoreSync);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => { checkAndAdvanceMonth(); }, [data.currentKey, checkAndAdvanceMonth]);
  useEffect(() => { const unsub = initFirestoreSync(); return () => unsub(); }, [initFirestoreSync]);

  const currentMonth = data.months[data.currentKey];

  const summary = useMemo(() =>
    currentMonth ? computeSummary({ ...currentMonth, mercado: data.mercado }) : null,
    [currentMonth, data.mercado]
  );

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  useNotifications(currentMonth ?? null, data.mercado ?? null, notifPermission);

  const syncStatus = !db ? "offline" : synced ? "synced" : "connecting";
  const monthLabel = currentMonth ? `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}` : "";

  const isNative = Capacitor.isNativePlatform();

  if (!currentMonth) return (
    <>
      {!isNative && <PwaUpdater />}
      <MainLayout tab={tab} setTab={setTab} syncStatus={syncStatus} monthLabel="">
        <AppSkeleton />
      </MainLayout>
    </>
  );

  const withToast = (fn: (d: typeof currentMonth) => void, msg: string) =>
    (d: typeof currentMonth) => { fn(d); showToast(msg); };

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <TabDashboard monthData={currentMonth} summary={summary!} mercado={data.mercado} />;
      case "family":
        return <TabFamilyExpenses monthData={currentMonth} mercado={data.mercado || { items: [], compras: [] }} onUpdate={withToast(updateMonth, "Gasto del hogar guardado")} />;
      case "extras":
        return <TabExtras monthData={currentMonth} onUpdate={withToast(updateMonth, "Gasto extra guardado")} />;
      case "mercado":
        return <TabMercado mercado={data.mercado || { items: [], compras: [] }} onUpdate={updateMercado} />;
      case "personal":
        return <TabPersonalExpenses monthData={currentMonth} onUpdate={withToast(updateMonth, "Gasto personal guardado")} />;
      case "salaries":
        return <TabSalaries monthData={currentMonth} onUpdate={withToast(updateMonth, "Salarios guardados")} />;
      case "history":
        return (
          <TabHistory
            allMonths={data.months}
            currentKey={data.currentKey}
            mercado={data.mercado}
            onSelectMonth={selectMonth}
            onNewMonth={addMonth}
            onDeleteMonth={deleteMonth}
          />
        );
      case "settings":
        return <TabSettings onPermissionGranted={() => setNotifPermission('granted')} />;
      case "more":
        return <TabMore onGoTo={setTab} />;
      default:
        return null;
    }
  };

  return (
    <>
      {!isNative && <PwaUpdater />}
      <MainLayout tab={tab} setTab={setTab} syncStatus={syncStatus} monthLabel={monthLabel}>
        <Suspense fallback={<AppSkeleton />}>
          {renderTab()}
        </Suspense>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </MainLayout>
    </>
  );
}
