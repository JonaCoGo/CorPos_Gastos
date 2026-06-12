import { useEffect } from "react";
import { db } from "./firebase";
import { MONTH_NAMES } from "./constants";
import { computeSummary } from './utils/finanzas';
import { useAppStore } from './store/useAppStore';

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

  const tabs = [
    { id: "dashboard", label: "Resumen", icon: "📊" },
    { id: "family",    label: "Hogar",   icon: "🏠" },
    { id: "extras",    label: "Extras",  icon: "💸" },
    { id: "mercado",   label: "Mercado", icon: "🛒" },
    { id: "personal",  label: "Personal",icon: "👤" },
    { id: "salaries",  label: "Salarios",icon: "💰" },
    { id: "history",   label: "Historial",icon:"📅" },
  ];

  if (!currentMonth) return <div style={{ padding: 32, textAlign: "center" }}>Sin datos</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root {
          --font-display: 'Sora', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --bg: #f4f5f7;
          --surface: #ffffff;
          --surface2: #f0f1f4;
          --border: #e4e5ea;
          --text1: #1a1b1f;
          --text2: #6b7280;
          --accent: #4f46e5;
          --marce: #e05a8a;
          --jona: #0ea5e9;
          --success: #059669;
          --danger: #dc2626;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-body); background: var(--bg); color: var(--text1); -webkit-font-smoothing: antialiased; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 88 }}>
        {/* Header */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                💼 Cor<span style={{ color: "var(--accent)" }}>Pos</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: db ? (synced ? "var(--success)" : "#f59e0b") : "var(--text2)" }} />
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{db ? (synced ? "Sincronizado" : "Conectando...") : "Sin sincronización"}</div>
              </div>
            </div>
            <div style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)" }}>
              {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "18px 14px" }}>
          {tab === "dashboard" && <TabDashboard monthData={currentMonth} summary={summary} />}
          {tab === "family" && <TabFamilyExpenses monthData={currentMonth} mercado={data.mercado || { items: [], compras: [] }} onUpdate={updateMonth} />}
          {tab === "extras" && <TabExtras monthData={currentMonth} onUpdate={updateMonth} />}
          {tab === "mercado" && <TabMercado mercado={data.mercado || { items: [], compras: [] }} onUpdate={updateMercado} />}
          {tab === "personal" && <TabPersonalExpenses monthData={currentMonth} onUpdate={updateMonth} />}
          {tab === "salaries" && <TabSalaries monthData={currentMonth} onUpdate={updateMonth} />}
          {tab === "history" && (
            <TabHistory
              allMonths={data.months}
              currentKey={data.currentKey}
              mercado={data.mercado}
              onSelectMonth={selectMonth}
              onNewMonth={addMonth}
              onDeleteMonth={deleteMonth}
            />
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "8px 0 14px", zIndex: 100 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                background: "none", border: "none", cursor: "pointer",
                color: tab === t.id ? "var(--accent)" : "var(--text2)",
                padding: "4px 10px", borderRadius: 10, transition: "color 0.15s",
              }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 500, fontFamily: "var(--font-body)" }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
