import { useState } from "react";
import { Trash2, Pause, Play, Undo2 } from 'lucide-react';
import { Avatar, Card, Btn, Field, Modal, Label, ProgressBar, PaymentChips } from '../components/ui';
import { ICONS } from '../constants';
import { COP } from '../utils/finanzas';
import { MonthData, PersonalExpense, TransferenciaFondo } from '../types/models';
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
  const paymentMethods = config?.paymentMethods ?? [];

  const [fondoModal, setFondoModal] = useState(false);
  const [fondoForm, setFondoForm] = useState<{ persona: 'marcela' | 'jonatan'; monto: string }>({ persona: 'marcela', monto: '' });
  const [confirmDelTransf, setConfirmDelTransf] = useState<TransferenciaFondo | null>(null);

  const transferencias = monthData.fondoConjunto?.transferencias ?? [];
  const aporteMarcela = transferencias.filter(t => t.persona === 'marcela').reduce((s, t) => s + t.monto, 0);
  const aporteJonatan = transferencias.filter(t => t.persona === 'jonatan').reduce((s, t) => s + t.monto, 0);
  const totalFondo = aporteMarcela + aporteJonatan;

  const addTransferencia = () => {
    if (!fondoForm.monto) return;
    const nueva: TransferenciaFondo = {
      id: `tf_${Date.now()}`,
      persona: fondoForm.persona,
      monto: Number(fondoForm.monto) || 0,
      fecha: new Date().toISOString().slice(0, 10),
    };
    onUpdate({ ...monthData, fondoConjunto: { transferencias: [...transferencias, nueva] } });
    setFondoModal(false);
    setFondoForm({ persona: 'marcela', monto: '' });
  };

  const deleteTransferencia = (id: string) => {
    onUpdate({ ...monthData, fondoConjunto: { transferencias: transferencias.filter(t => t.id !== id) } });
    setConfirmDelTransf(null);
  };

  const [addModal, setAddModal] = useState<string | null>(null);
  const [form, setForm] = useState({ desc: "", amount: "", day: "", icon: "", paymentMethodId: "" });
  const [editExpense, setEditExpense] = useState<EditTarget | null>(null);
  const [editForm, setEditForm] = useState({ desc: "", amount: "", day: "", icon: "", paymentMethodId: "" });
  const [showAddIconPicker, setShowAddIconPicker] = useState(false);
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
      icon: form.icon || "💰",
      paymentMethodId: form.paymentMethodId || undefined,
    };
    const p = addModal! as Persona;
    setAddModal(null);
    setShowAddIconPicker(false);
    setForm({ desc: "", amount: "", day: "", icon: "", paymentMethodId: "" });
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [p]: [...monthData.personalExpenses[p], newExp] } });
  };

  const openEditExpense = (person: Persona, expense: PersonalExpense) => {
    setEditExpense({ person, expense });
    setEditForm({
      desc: expense.desc,
      amount: String(expense.amount ?? ""),
      day: String(expense.day ?? ""),
      icon: expense.icon || "",
      paymentMethodId: expense.paymentMethodId ?? "",
    });
  };

  const saveEditExpense = () => {
    if (!editExpense) return;
    const person = editExpense.person as Persona;
    const { expense } = editExpense;
    const updatedExpenses = monthData.personalExpenses[person].map((e: PersonalExpense) =>
      e.id === expense.id
        ? { ...e, desc: editForm.desc, amount: Number(editForm.amount) || 0, day: Number(editForm.day) || null, icon: editForm.icon || "💰", paymentMethodId: editForm.paymentMethodId || undefined }
        : e
    );
    setEditExpense(null);
    setShowEditIconPicker(false);
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [person]: updatedExpenses } });
  };

  const deleteExpense = (person: Persona, id: number) => {
    setConfirmDel(null);
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].filter((e: PersonalExpense) => e.id !== id) } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Fondo Conjunto */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>🤝 Fondo Conjunto</div>
          <Btn variant="primary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setFondoModal(true)}>+ Transferencia</Btn>
        </div>

        {transferencias.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", padding: "12px 0" }}>Sin transferencias este mes</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {transferencias.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--surface2)", borderRadius: 10 }}>
                <Avatar name={t.persona} size={22} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{names[t.persona]}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{t.fecha}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{COP(t.monto)}</span>
                <button onClick={() => setConfirmDelTransf(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "2px 4px" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
          {[{ persona: 'marcela' as const, aporte: aporteMarcela }, { persona: 'jonatan' as const, aporte: aporteJonatan }].map(({ persona, aporte }) => (
            <div key={persona} style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>{names[persona]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: persona === 'marcela' ? "var(--marce)" : "var(--jona)" }}>{COP(aporte)}</div>
            </div>
          ))}
        </div>
        {totalFondo > 0 && (
          <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)", fontWeight: 600 }}>Total en el fondo</span>
            <span style={{ fontWeight: 800, color: "var(--accent)" }}>{COP(totalFondo)}</span>
          </div>
        )}
      </Card>

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
              <Btn variant={person === "marcela" ? "marce" : "jona"} style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setAddModal(person); setForm({ desc: "", amount: "", day: "", icon: "", paymentMethodId: "" }); }}>+ Añadir</Btn>
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
                    <button onClick={(ev) => { ev.stopPropagation(); toggleActive(person, e.id); }} aria-label="Reactivar el próximo mes"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                      <Play size={14} />
                    </button>
                  ) : (
                    <button onClick={(ev) => { ev.stopPropagation(); toggleActive(person, e.id); }} aria-label={e.disableNext ? "Cancelar desactivación" : "Desactivar desde el próximo mes"}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                      {e.disableNext ? <Undo2 size={14} /> : <Pause size={14} />}
                    </button>
                  )}
                  <button onClick={(ev) => { ev.stopPropagation(); setConfirmDel({ person, expense: e }); }}
                    aria-label="Eliminar gasto"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <Modal open={!!addModal} onClose={() => { setAddModal(null); setShowAddIconPicker(false); }} title={`Añadir gasto — ${addModal === "marcela" ? names.marcela : names.jonatan}`}>
        <div style={{ marginBottom: 14 }}>
          <Label>Icono</Label>
          <button onClick={() => setShowAddIconPicker(!showAddIconPicker)} aria-label="Elegir icono"
            style={{ fontSize: 28, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
            {form.icon || "💰"}
          </button>
          {showAddIconPicker && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, background: "var(--surface2)", borderRadius: 10, padding: 10 }}>
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => { setForm({ ...form, icon: ic }); setShowAddIconPicker(false); }}
                  style={{ fontSize: 22, background: form.icon === ic ? "var(--accent)" : "none", border: "none", borderRadius: 8, padding: "4px 6px", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="Descripción" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} type="text" placeholder="Ej: Gym" />
        <Field label="Valor (COP)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="50000" />
        <Field label="Día del mes (opcional)" value={form.day} onChange={(v) => setForm({ ...form, day: v })} placeholder="15" />
        <PaymentChips
          methods={paymentMethods}
          selectedId={form.paymentMethodId || undefined}
          onChange={(id) => setForm({ ...form, paymentMethodId: id ?? "" })}
          ownerNames={names}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => { setAddModal(null); setShowAddIconPicker(false); }} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addExpense} disabled={!form.desc || !form.amount} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editExpense} onClose={() => setEditExpense(null)} title={`Editar gasto — ${editExpense?.person === "marcela" ? names.marcela : names.jonatan}`}>
        <Field label="Descripción" value={editForm.desc} onChange={(v) => setEditForm({ ...editForm, desc: v })} type="text" placeholder="Ej: Gym" />
        <Field label="Valor (COP)" value={editForm.amount} onChange={(v) => setEditForm({ ...editForm, amount: v })} placeholder="50000" />
        <Field label="Día del mes (opcional)" value={editForm.day} onChange={(v) => setEditForm({ ...editForm, day: v })} placeholder="15" />
        <PaymentChips
          methods={paymentMethods}
          selectedId={editForm.paymentMethodId || undefined}
          onChange={(id) => setEditForm({ ...editForm, paymentMethodId: id ?? "" })}
          ownerNames={names}
        />
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

      {/* Modal: nueva transferencia al fondo */}
      <Modal open={fondoModal} onClose={() => setFondoModal(false)} title="Registrar transferencia al fondo">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>¿Quién transfirió?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(['marcela', 'jonatan'] as const).map((p) => (
              <button key={p} onClick={() => setFondoForm(f => ({ ...f, persona: p }))} style={{
                flex: 1, padding: "9px 4px", borderRadius: 10, border: "2px solid",
                borderColor: fondoForm.persona === p ? (p === 'marcela' ? "var(--marce)" : "var(--jona)") : "var(--border)",
                background: fondoForm.persona === p ? (p === 'marcela' ? "var(--marce)" : "var(--jona)") : "var(--surface2)",
                color: fondoForm.persona === p ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
              }}>{names[p]}</button>
            ))}
          </div>
        </div>
        <Field label="Monto transferido" value={fondoForm.monto} onChange={(v) => setFondoForm(f => ({ ...f, monto: v }))} placeholder="Ej: 150000" currency />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setFondoModal(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addTransferencia} disabled={!fondoForm.monto} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Modal: confirmar eliminar transferencia */}
      <Modal open={!!confirmDelTransf} onClose={() => setConfirmDelTransf(null)} title="¿Eliminar transferencia?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar la transferencia de <strong>{confirmDelTransf ? names[confirmDelTransf.persona] : ''}</strong> por <strong>{COP(confirmDelTransf?.monto ?? 0)}</strong>.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDelTransf(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteTransferencia(confirmDelTransf!.id)} style={{ flex: 1 }}>Eliminar</Btn>
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
