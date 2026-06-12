import { useState } from "react";
import { Card, Btn, Field, Modal, Label } from '../components/ui';
import { MONTH_NAMES } from '../constants';
import { COP, computeSummary, getMonthKey } from '../utils/finanzas';

interface TabHistoryProps {
  allMonths: any;
  currentKey: string;
  mercado: any;
  onSelectMonth: (key: string) => void;
  onNewMonth: (year: number, month: number, salaries: { marcela: number, jonatan: number }) => void;
  onDeleteMonth: (key: string) => void;
}

export function TabHistory({ allMonths, currentKey, mercado, onSelectMonth, onNewMonth, onDeleteMonth }: TabHistoryProps) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ year: 2026, month: 7, marcela: "", jonatan: "" });

  const create = () => {
    const key = getMonthKey(form.year, form.month);
    if (allMonths[key]) { alert("Ese mes ya existe"); return; }
    onNewMonth(Number(form.year), Number(form.month), { marcela: Number(form.marcela) || 0, jonatan: Number(form.jonatan) || 0 });
    setShowNew(false);
  };

  const sorted = Object.values(allMonths).sort((a: any, b: any) => b.key.localeCompare(a.key));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
          Historial de Meses
        </div>
        <Btn variant="primary" onClick={() => setShowNew(true)} style={{ fontSize: 13, padding: "8px 14px" }}>+ Nuevo mes</Btn>
      </div>

      {sorted.map((m: any) => {
        const s = computeSummary({...m, mercado});
        const isActive = m.key === currentKey;
        return (
          <Card key={m.key} onClick={() => onSelectMonth(m.key)}
            style={{ border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)" }}>
                  {MONTH_NAMES[m.month]} {m.year}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Neto total: {COP(s.totalNeto)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{COP(s.totalFamilyPaid)} pagado</div>
                {s.totalFamilyPending > 0 && <div style={{ fontSize: 11, color: "var(--danger)" }}>{COP(s.totalFamilyPending)} pendiente</div>}
                {isActive && <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, marginTop: 4 }}>● ACTIVO</div>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              {[{ n: "marcela", saldo: s.saldoMarcela }, { n: "jonatan", saldo: s.saldoJonatan }].map(({ n, saldo }) => (
                <div key={n} style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--text2)", textTransform: "capitalize" }}>{n}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: saldo >= 0 ? "var(--success)" : "var(--danger)" }}>{COP(saldo)}</span>
                </div>
              ))}
            </div>
            {!isActive && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={(e) => { e.stopPropagation(); if (window.confirm("¿Eliminar este mes?")) onDeleteMonth(m.key); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 12 }}>
                  🗑 Eliminar mes
                </button>
              </div>
            )}
          </Card>
        );
      })}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nuevo mes">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Año" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
          <div>
            <Label>Mes</Label>
            <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value as any })}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
              {MONTH_NAMES.slice(1).map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
            </select>
          </div>
        </div>
        <Field label="Neto Marcela" value={form.marcela} onChange={(v) => setForm({ ...form, marcela: v })} placeholder="Ej: 1379597" />
        <Field label="Neto Jonatan" value={form.jonatan} onChange={(v) => setForm({ ...form, jonatan: v })} placeholder="Ej: 1475402" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setShowNew(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={create} style={{ flex: 1 }}>Crear</Btn>
        </div>
      </Modal>
    </div>
  );
}
