import { useState, useCallback, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import {
  STORAGE_KEY,
  FIRESTORE_DOC,
  defaultPersonalExpenses,
  defaultFamilyCategories,
  ICONS,
  MONTH_NAMES,
  EXTRA_CATS,
  SUPERMARKETS,
  UNITS,
  ALL_CATS,
  SEED_MARKET_ITEMS
} from "./constants";
import { COP, getMonthKey, createEmptyMonth, calculateMercadoTotals, computeSummary } from './utils/finanzas';

import { TabDashboard, TabFamilyExpenses, TabPersonalExpenses, TabSalaries, TabHistory, TabExtras, TabMercado } from './features';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate: if mercado missing or items empty, inject seed
      if (!parsed.mercado || !parsed.mercado.items || parsed.mercado.items.length === 0) {
        parsed.mercado = { items: SEED_MARKET_ITEMS, compras: parsed.mercado?.compras || [] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {}
  // salaries = salario BRUTO; la app descuenta personales automáticamente
  const jun = createEmptyMonth(2026, 6, { marcela: 1803858, jonatan: 2021241 });
  jun.familyExpenses = jun.familyExpenses.map((c) => {
    const map = {
      arriendo: { marcela: 0, jonatan: 800000 },
      mercado: { marcela: 600000, jonatan: 0 },
      servicios: { marcela: 300000, jonatan: 0 },
      pasajes: { marcela: 410000, jonatan: 100000 },
      tc: { marcela: 0, jonatan: 0 },
      ahorro_salidas: { marcela: 0, jonatan: 0 },
      ahorro_personal: { marcela: 0, jonatan: 0 },
      internet_planes: { marcela: 0, jonatan: 145000 },
      credi_ahorros: { marcela: 0, jonatan: 50000 },
      otros: { marcela: 0, jonatan: 0 },
    };
    return { ...c, ...(map[c.id] || {}) };
  });
  const months = { "2026-06": jun };
  const d = { months, currentKey: "2026-06", mercado: { items: SEED_MARKET_ITEMS, compras: [] } };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  return d;
}

function saveData(d: any) {
  // Always save to localStorage as backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  // Save to Firestore if available
  if (db) {
    const [col, docId] = FIRESTORE_DOC.split("/");
    setDoc(doc(db, col, docId), d).catch((e) => console.error("Firestore save error:", e));
  }
}

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [tab, setTab] = useState("dashboard");
  const [synced, setSynced] = useState(false);

  // Auto-advance: if today's month is newer than currentKey, create it automatically
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayKey = getMonthKey(currentYear, currentMonth);
    if (!data.months[todayKey] && data.currentKey && data.currentKey < todayKey) {
      // Copy last known salaries as starting point
      const lastMonth = data.months[data.currentKey];
      const newMonth = createEmptyMonth(currentYear, currentMonth, lastMonth?.salaries || { marcela: 0, jonatan: 0 });
      const nd = { ...data, months: { ...data.months, [todayKey]: newMonth }, currentKey: todayKey };
      setData(nd);
      saveData(nd);
    }

  }, [data.currentKey]);

  // ── Firestore real-time sync ──────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const [col, docId] = FIRESTORE_DOC.split("/");
    const ref = doc(db, col, docId);

    // First load: push local data to Firestore if Firestore is empty
    getDoc(ref).then((snap) => {
      if (!snap.exists()) {
        const local = loadData();
        setDoc(ref, local).catch(console.error);
      }
    });

    // Subscribe to real-time changes
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const remote = snap.data();
        // Migrate mercado if empty
        if (!remote.mercado || !remote.mercado.items || remote.mercado.items.length === 0) {
          remote.mercado = { items: SEED_MARKET_ITEMS, compras: remote.mercado?.compras || [] };
          setDoc(ref, remote).catch(console.error);
        }
        setData(remote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        setSynced(true);
      }
    }, (err) => {
      console.error("Firestore listen error:", err);
      setSynced(false);
    });

    return () => unsub();
  }, []);

  const updateMercado = useCallback((updated: any) => {
    const newData = { ...data, mercado: updated };
    setData(newData);
    saveData(newData);
  }, [data]);

  const currentMonth = data.months[data.currentKey];

  const updateMonth = useCallback((updated: any) => {
    const newData = { ...data, months: { ...data.months, [updated.key]: updated } };
    setData(newData);
    saveData(newData);
  }, [data]);

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
              onSelectMonth={(key) => { const nd = { ...data, currentKey: key }; setData(nd); saveData(nd); setTab("dashboard"); }}
              onNewMonth={(year, month, salaries) => {
                const prevM = data.months[data.currentKey] || null;
                const m = createEmptyMonth(year, month, salaries, prevM);
                const nd = { months: { ...data.months, [m.key]: m }, currentKey: m.key };
                setData(nd); saveData(nd); setTab("dashboard");
              }}
              onDeleteMonth={(key) => {
                const months = { ...data.months };
                delete months[key];
                const keys = Object.keys(months);
                const nd = { months, currentKey: keys[keys.length - 1] || null };
                setData(nd); saveData(nd);
              }}
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
