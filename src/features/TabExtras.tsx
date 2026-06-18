import { useState } from "react";
import { Trash2 } from 'lucide-react';
import { Avatar, Card, Btn, Field, Modal, Label, Select, PaymentChips } from '../components/ui';
import { EXTRA_CATS } from '../constants';
import { COP } from '../utils/finanzas';
import { MonthData, Extra, Persona } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabExtrasProps {
  monthData: MonthData;
  onUpdate: (data: MonthData) => void;
}

export function TabExtras({ monthData, onUpdate }: TabExtrasProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };
  const paymentMethods = config?.paymentMethods ?? [];

  const extras = monthData.extras || [];
  const [showAdd, setShowAdd]   = useState(false);
  const [confirmDel, setConfirmDel] = useState<Extra | null>(null);
  const [form, setForm] = useState<{ person: Persona; amount: string; category: string; desc: string; date: string; paymentMethodId: string }>({ person: "jonatan", amount: "", category: "Comida rápida", desc: "", date: new Date().toISOString().slice(0, 10), paymentMethodId: "" });

  const addExtra = () => {
    if (!form.amount) return;
    const newE = { id: `ex_${Date.now()}`, person: form.person, amount: Number(form.amount), category: form.category, desc: form.desc, date: form.date, paymentMethodId: form.paymentMethodId || undefined };
    setShowAdd(false);
    setForm({ person: "jonatan", amount: "", category: "Comida rápida", desc: "", date: new Date().toISOString().slice(0, 10), paymentMethodId: "" });
    onUpdate({ ...monthData, extras: [...extras, newE] });
  };

  const deleteExtra = (id: string) => {
    setConfirmDel(null);
    onUpdate({ ...monthData, extras: extras.filter((e) => e.id !== id) });
  };

  const totalMarcela = extras.filter((e: Extra) => e.person === "marcela").reduce((s: number, e: Extra) => s + e.amount, 0);
  const totalJonatan = extras.filter((e: Extra) => e.person === "jonatan").reduce((s: number, e: Extra) => s + e.amount, 0);

  // Group by category for summary
  const byCat = extras.reduce((acc: Record<string, number>, e: Extra) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header totals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ n: "marcela", total: totalMarcela }, { n: "jonatan", total: totalJonatan }].map(({ n, total }) => (
          <Card key={n} style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Avatar name={n} size={22} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{names[n as keyof typeof names]}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--danger)", fontFamily: "var(--font-display)" }}>{COP(total)}</div>
            <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>en extras este mes</div>
          </Card>
        ))}
      </div>

      {/* By category summary */}
      {Object.keys(byCat).length > 0 && (
        <Card style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>Por categoría</div>
          {Object.entries(byCat).sort(([, a], [, b]) => b - a).map(([cat, total]) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "var(--text1)" }}>{cat}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{COP(total)}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Action button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
          {extras.length} gasto{extras.length !== 1 ? "s" : ""} extra{extras.length !== 1 ? "s" : ""}
        </div>
        <Btn variant="primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "8px 14px" }}>+ Añadir</Btn>
      </div>

      {/* List */}
      {extras.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🧾</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin gastos extra este mes</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Registra comida rápida, médico, transporte o cualquier gasto que no sea fijo.</div>
          <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Añadir gasto extra</Btn>
        </Card>
      ) : (
        [...extras].reverse().map((e: Extra) => (
          <Card key={e.id} style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Avatar name={e.person} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{e.category}</div>
                  {e.desc && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 1 }}>{e.desc}</div>}
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{e.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--danger)", fontFamily: "var(--font-display)" }}>{COP(e.amount)}</div>
                <button onClick={() => setConfirmDel(e)}
                  aria-label="Eliminar gasto extra"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "2px", display: "flex", alignItems: "center" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))
      )}

      {/* Modal: añadir extra */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo gasto extra">
        <div style={{ marginBottom: 14 }}>
          <Label>¿Quién pagó?</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["jonatan", "marcela"] as Persona[]).map((p) => (
              <button key={p} onClick={() => setForm({ ...form, person: p })} style={{
                padding: "10px", borderRadius: 10, border: "2px solid",
                borderColor: form.person === p ? (p === "marcela" ? "var(--marce)" : "var(--jona)") : "var(--border)",
                background: form.person === p ? (p === "marcela" ? "var(--marce)" : "var(--jona)") : "var(--surface2)",
                color: form.person === p ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Avatar name={p} size={18} />
                <span>{names[p]}</span>
              </button>
            ))}
          </div>
        </div>
        <Field label="Valor (COP)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="15000" />
        <Select label="Categoría" value={form.category} onChange={(v) => setForm({ ...form, category: v })}>
          {EXTRA_CATS.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Field label="Descripción (opcional)" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} type="text" placeholder="Ej: Pizza con Marcela" />
        <Field label="Fecha" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
        <PaymentChips
          methods={paymentMethods}
          selectedId={form.paymentMethodId || undefined}
          onChange={(id) => setForm({ ...form, paymentMethodId: id ?? "" })}
          ownerNames={names}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addExtra} disabled={!form.amount} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar gasto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.category}</strong> de {COP(confirmDel?.amount ?? 0)}.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteExtra(confirmDel!.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}
