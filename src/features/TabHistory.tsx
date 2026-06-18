import { useState } from "react";
import { Card, Btn, Field, Modal, Select } from '../components/ui';
import { MONTH_NAMES } from '../constants';
import { COP, computeSummary, getMonthKey } from '../utils/finanzas';
import { MonthData, Mercado } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabHistoryProps {
  allMonths: Record<string, MonthData>;
  currentKey: string;
  mercado: Mercado;
  onSelectMonth: (key: string) => void;
  onNewMonth: (year: number, month: number, salaries: { marcela: number; jonatan: number }) => void;
  onDeleteMonth: (key: string) => void;
}

export function TabHistory({ allMonths, currentKey, mercado, onSelectMonth, onNewMonth, onDeleteMonth }: TabHistoryProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ year: 2026, month: 7, marcela: "", jonatan: "" });
  const [dupError, setDupError] = useState(false);
  const [confirmDelMonth, setConfirmDelMonth] = useState<MonthData | null>(null);

  const create = () => {
    const key = getMonthKey(form.year, form.month);
    if (allMonths[key]) { setDupError(true); return; }
    onNewMonth(Number(form.year), Number(form.month), { marcela: Number(form.marcela) || 0, jonatan: Number(form.jonatan) || 0 });
    setShowNew(false);
    setDupError(false);
  };

  const sorted = (Object.values(allMonths) as MonthData[]).sort((a, b) => b.key.localeCompare(a.key));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
          Historial de Meses
        </div>
        <Btn variant="primary" onClick={() => setShowNew(true)} style={{ fontSize: 13, padding: "8px 14px" }}>+ Nuevo mes</Btn>
      </div>

      {sorted.map((m) => {
        const s = computeSummary({ ...m, mercado });
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
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>{names[n as keyof typeof names]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: saldo >= 0 ? "var(--success)" : "var(--danger)" }}>{COP(saldo)}</span>
                </div>
              ))}
            </div>
            {!isActive && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelMonth(m); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 12 }}>
                  🗑 Eliminar mes
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Modal: nuevo mes */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setDupError(false); }} title="Nuevo mes">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Año" value={form.year} onChange={(v) => { setForm({ ...form, year: Number(v) }); setDupError(false); }} />
          <Select label="Mes" value={form.month} onChange={(v) => { setForm({ ...form, month: Number(v) }); setDupError(false); }}>
            {MONTH_NAMES.slice(1).map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </Select>
        </div>
        {dupError && (
          <div style={{ background: "var(--surface2)", border: "1px solid var(--danger)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>
            ⚠ Ese mes ya existe. Selecciona otro.
          </div>
        )}
        <Field label={`Salario ${names.marcela}`} value={form.marcela} onChange={(v) => setForm({ ...form, marcela: v })} placeholder="Ej: 1379597" currency />
        <Field label={`Salario ${names.jonatan}`} value={form.jonatan} onChange={(v) => setForm({ ...form, jonatan: v })} placeholder="Ej: 1475402" currency />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => { setShowNew(false); setDupError(false); }} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={create} style={{ flex: 1 }}>Crear</Btn>
        </div>
      </Modal>

      {/* Modal: confirmar eliminar mes */}
      <Modal open={!!confirmDelMonth} onClose={() => setConfirmDelMonth(null)} title="¿Eliminar mes?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDelMonth ? `${MONTH_NAMES[confirmDelMonth.month]} ${confirmDelMonth.year}` : ""}</strong>. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDelMonth(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => { onDeleteMonth(confirmDelMonth!.key); setConfirmDelMonth(null); }} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}
