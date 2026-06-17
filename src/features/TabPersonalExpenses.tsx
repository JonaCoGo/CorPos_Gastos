import { useState } from "react";
import { Avatar, Card, Btn, Field, Modal, Label, ProgressBar } from '../components/ui';
import { ICONS } from '../constants';
import { COP } from '../utils/finanzas';
import { MonthData, PersonalExpense } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabPersonalExpensesProps {
  monthData: MonthData;
  onUpdate: (data: MonthData) => void;
}

type Persona = 'marcela' | 'jonatan';
interface EditTarget { person: Persona; expense: PersonalExpense; }

export function TabPersonalExpenses({ monthData, onUpdate }: TabPersonalExpensesProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };

  const [addModal, setAddModal] = useState<string | null>(null);
  const [form, setForm] = useState({ desc: "", amount: "", day: "", icon: "" });
  const [editExpense, setEditExpense] = useState<EditTarget | null>(null);
  const [editForm, setEditForm] = useState({ desc: "", amount: "", day: "", icon: "" });
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ person: Persona; expense: PersonalExpense } | null>(null);

  const togglePaid = (person: Persona, id: number) => {
    const updated = { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].map((e: PersonalExpense) => e.id === id ? { ...e, paid: !e.paid } : e) };
    onUpdate({ ...monthData, personalExpenses: updated });
  };
  const toggleActive = (person: Persona, id: number) => {
    const updated = { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].map((e: PersonalExpense) => e.id === id ? { ...e, disableNext: !e.disableNext } : e) };
    onUpdate({ ...monthData, personalExpenses: updated });
  };

  const addExpense = () => {
    const newExp: PersonalExpense = {
      id: Date.now(),
      desc: form.desc,
      amount: Number(form.amount) || 0,
      day: Number(form.day) || null,
      paid: false,
      icon: form.icon || "💰"
    };
    const p = addModal! as Persona;
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [p]: [...monthData.personalExpenses[p], newExp] } });
    setAddModal(null);
    setForm({ desc: "", amount: "", day: "", icon: "" });
  };

  const openEditExpense = (person: Persona, expense: PersonalExpense) => {
    setEditExpense({ person, expense });
    setEditForm({
      desc: expense.desc,
      amount: String(expense.amount ?? ""),
      day: String(expense.day ?? ""),
      icon: expense.icon || ""
    });
  };

  const saveEditExpense = () => {
    if (!editExpense) return;
    const person = editExpense.person as Persona;
    const { expense } = editExpense;
    const updatedExpenses = monthData.personalExpenses[person].map((e: PersonalExpense) =>
      e.id === expense.id
        ? { ...e, desc: editForm.desc, amount: Number(editForm.amount) || 0, day: Number(editForm.day) || null, icon: editForm.icon || "💰" }
        : e
    );
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [person]: updatedExpenses } });
    setEditExpense(null);
  };

  const deleteExpense = (person: Persona, id: number) => {
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].filter((e: PersonalExpense) => e.id !== id) } });
    setConfirmDel(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {(["jonatan", "marcela"] as Persona[]).map((person) => {
        const expenses: PersonalExpense[] = monthData.personalExpenses[person] || [];
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const paidAmt = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
        return (
          <Card key={person}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={person} size={32} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{names[person]}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{COP(paidAmt)} pagado / {COP(total)}</div>
                </div>
              </div>
              <Btn variant={person === "marcela" ? "marce" : "jona"} style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setAddModal(person); setForm({ desc: "", amount: "", day: "", icon: "" }); }}>+ Añadir</Btn>
            </div>
            <ProgressBar value={paidAmt} max={total} color={person === "marcela" ? "var(--marce)" : "var(--jona)"} height={6} />
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
              {expenses.map((e) => (
                <div key={e.id} onClick={() => openEditExpense(person, e)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: "var(--surface2)", borderRadius: 10,
                  opacity: e.active === false ? 0.4 : e.paid ? 0.6 : 1,
                  cursor: "pointer"
                }}>
                  <input type="checkbox" checked={!!e.paid} onChange={() => togglePaid(person, e.id)}
                    onClick={(ev) => ev.stopPropagation()}
                    disabled={e.active === false}
                    style={{ width: 18, height: 18, cursor: e.active === false ? "default" : "pointer", accentColor: person === "marcela" ? "var(--marce)" : "var(--jona)", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 20 }}>{e.icon || "💰"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, textDecoration: e.paid || e.active === false ? "line-through" : "none", color: e.active === false ? "var(--text2)" : "var(--text1)" }}>{e.desc}</div>
                      {e.day && <div style={{ fontSize: 11, color: "var(--text2)" }}>Día {e.day}</div>}
                      {e.active === false && <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>INACTIVO ESTE MES</div>}
                      {e.active !== false && e.disableNext && <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>⏸ Se desactiva el próximo mes</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: e.active === false ? "var(--text2)" : "var(--text1)" }}>{COP(e.amount)}</div>
                  {e.active === false ? (
                    <button onClick={(ev) => { ev.stopPropagation(); toggleActive(person, e.id); }} title="Reactivar el próximo mes"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>▶️</button>
                  ) : (
                    <button onClick={(ev) => { ev.stopPropagation(); toggleActive(person, e.id); }} title={e.disableNext ? "Cancelar desactivación" : "Desactivar desde el próximo mes"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>
                      {e.disableNext ? "↩️" : "⏸️"}
                    </button>
                  )}
                  <button onClick={(ev) => { ev.stopPropagation(); setConfirmDel({ person, expense: e }); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, padding: "2px 4px" }}>🗑</button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <Modal open={!!addModal} onClose={() => setAddModal(null)} title={`Añadir gasto — ${addModal === "marcela" ? names.marcela : names.jonatan}`}>
        <Field label="Descripción" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} type="text" placeholder="Ej: Gym" />
        <Field label="Valor (COP)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="50000" />
        <Field label="Día del mes (opcional)" value={form.day} onChange={(v) => setForm({ ...form, day: v })} placeholder="15" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setAddModal(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addExpense} disabled={!form.desc || !form.amount} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editExpense} onClose={() => setEditExpense(null)} title={`Editar gasto — ${editExpense?.person === "marcela" ? names.marcela : names.jonatan}`}>
        <Field label="Descripción" value={editForm.desc} onChange={(v) => setEditForm({ ...editForm, desc: v })} type="text" placeholder="Ej: Gym" />
        <Field label="Valor (COP)" value={editForm.amount} onChange={(v) => setEditForm({ ...editForm, amount: v })} placeholder="50000" />
        <Field label="Día del mes (opcional)" value={editForm.day} onChange={(v) => setEditForm({ ...editForm, day: v })} placeholder="15" />
        <div style={{ marginBottom: 14 }}>
          <Label>Icono</Label>
          <button onClick={() => setShowEditIconPicker(!showEditIconPicker)}
            style={{ fontSize: 28, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
            {editForm.icon || "💰"}
          </button>
          {showEditIconPicker && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, background: "var(--surface2)", borderRadius: 10, padding: 10 }}>
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => { setEditForm({ ...editForm, icon: ic }); setShowEditIconPicker(false); }}
                  style={{ fontSize: 22, background: editForm.icon === ic ? "var(--accent)" : "none", border: "none", borderRadius: 8, padding: "4px 6px", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setEditExpense(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEditExpense} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar gasto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.expense.icon || "💰"} {confirmDel?.expense.desc}</strong> ({COP(confirmDel?.expense.amount ?? 0)}). Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteExpense(confirmDel!.person, confirmDel!.expense.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}
