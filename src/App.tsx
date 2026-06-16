import { useEffect } from "react";
import { db } from "./firebase";
import { MONTH_NAMES } from "./constants";
import { computeSummary } from './utils/finanzas';
import { useAppStore } from './store/useAppStore';
import MainLayout from './layouts/MainLayout';

import { TabDashboard, TabFamilyExpenses, TabPersonalExpenses, TabSalaries, TabHistory, TabExtras, TabMercado } from './features';

export default function App() {
  const data = useAppStore((s) => s.data);
  const tab = useAppStore((s) => s.tab);
  const synced = useAppStore((s) => s.synced);
  
  const setTab = useAppStore((s) => s.setTab);
  const updateMercado = useAppStore((s) => s.updateMercado);
  const updateMonth = useAppStore((s) => s.updateMonth);
  const selectMonth = useAppStore((s) => s.selectMonth);
  const addMonth = useAppStore((s) => s.addMonth);
  const deleteMonth = useAppStore((s) => s.deleteMonth);
  const checkAndAdvanceMonth = useAppStore((s) => s.checkAndAdvanceMonth);
  const initFirestoreSync = useAppStore((s) => s.initFirestoreSync);

  useEffect(() => {
    checkAndAdvanceMonth();
  }, [data.currentKey, checkAndAdvanceMonth]);

  useEffect(() => {
    const unsub = initFirestoreSync();
    return () => unsub();
  }, [initFirestoreSync]);

  const currentMonth = data.months[data.currentKey];
  const summary = currentMonth ? computeSummary({...currentMonth, mercado: data.mercado}) : null;

  // Derived state for layout
  const syncStatus = !db ? "offline" : synced ? "synced" : "connecting";
  const monthLabel = currentMonth ? `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}` : "";

  if (!currentMonth) return <div style={{ padding: 32, textAlign: "center" }}>Sin datos</div>;

  // Render active tab
  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <TabDashboard monthData={currentMonth} summary={summary} />;
      case "family":
        return <TabFamilyExpenses monthData={currentMonth} mercado={data.mercado || { items: [], compras: [] }} onUpdate={updateMonth} />;
      case "extras":
        return <TabExtras monthData={currentMonth} onUpdate={updateMonth} />;
      case "mercado":
        return <TabMercado mercado={data.mercado || { items: [], compras: [] }} onUpdate={updateMercado} />;
      case "personal":
        return <TabPersonalExpenses monthData={currentMonth} onUpdate={updateMonth} />;
      case "salaries":
        return <TabSalaries monthData={currentMonth} onUpdate={updateMonth} />;
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
      default:
        return null;
    }
  };

  return (
    <MainLayout tab={tab} setTab={setTab} syncStatus={syncStatus} monthLabel={monthLabel}>
      {renderTab()}
    </MainLayout>
  );
}
