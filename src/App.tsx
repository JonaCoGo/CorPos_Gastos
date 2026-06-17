import { useEffect, useMemo, useState, useCallback, Suspense, lazy } from "react";
import { db } from "./firebase";
import { MONTH_NAMES } from "./constants";
import { computeSummary } from './utils/finanzas';
import { useAppStore } from './store/useAppStore';
import MainLayout from './layouts/MainLayout';
import { Toast } from './components/ui';
import { TabMore } from './features/TabMore';

const TabDashboard        = lazy(() => import('./features/TabDashboard').then(m => ({ default: m.TabDashboard })));
const TabFamilyExpenses   = lazy(() => import('./features/TabFamilyExpenses').then(m => ({ default: m.TabFamilyExpenses })));
const TabPersonalExpenses = lazy(() => import('./features/TabPersonalExpenses').then(m => ({ default: m.TabPersonalExpenses })));
const TabSalaries         = lazy(() => import('./features/TabSalaries').then(m => ({ default: m.TabSalaries })));
const TabHistory          = lazy(() => import('./features/TabHistory').then(m => ({ default: m.TabHistory })));
const TabExtras           = lazy(() => import('./features/TabExtras').then(m => ({ default: m.TabExtras })));
const TabMercado          = lazy(() => import('./features/TabMercado').then(m => ({ default: m.TabMercado })));

export default function App() {
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

  const syncStatus = !db ? "offline" : synced ? "synced" : "connecting";
  const monthLabel = currentMonth ? `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}` : "";

  if (!currentMonth) return <div style={{ padding: 32, textAlign: "center" }}>Sin datos</div>;

  const withToast = (fn: (d: typeof currentMonth) => void, msg: string) =>
    (d: typeof currentMonth) => { fn(d); showToast(msg); };

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <TabDashboard monthData={currentMonth} summary={summary!} />;
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
      case "more":
        return <TabMore onGoTo={setTab} />;
      default:
        return null;
    }
  };

  return (
    <MainLayout tab={tab} setTab={setTab} syncStatus={syncStatus} monthLabel={monthLabel}>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text2)', fontSize: '1.2rem' }}>
          Cargando...
        </div>
      }>
        {renderTab()}
      </Suspense>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </MainLayout>
  );
}
