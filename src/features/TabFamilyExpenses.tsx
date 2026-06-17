import { useState, useMemo } from "react";
import { Avatar, Card, Btn, Field, Modal, Label, ProgressBar } from '../components/ui';
import { ICONS } from '../constants';
import { COP, calculateMercadoTotals } from '../utils/finanzas';
import { MonthData, Mercado, FamilyExpense } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabFamilyExpensesProps {
  monthData: MonthData;
  mercado: Mercado;
  onUpdate: (data: MonthData) => void;
}

export function TabFamilyExpenses({ monthData, mercado, onUpdate }: TabFamilyExpensesProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };

  const [editCat, setEditCat] = useState<FamilyExpense | null>(null);
  const [editForm, setEditForm] = useState({ marcela: "", jonatan: "", budget: "", label: "", icon: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ label: "", budget: "", icon: "📦" });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [confirmDel, setConfirmDel] = useState<FamilyExpense | null>(null);

  const mercadoTotals = useMemo(() => calculateMercadoTotals(mercado), [mercado]);

  const openEdit = (cat: FamilyExpense) => {
    setEditCat(cat);
    if (cat.id === "mercado") {
      setEditForm({
        marcela: String(mercadoTotals.marcela),
        jonatan: String(mercadoTotals.jonatan),
        budget: String(cat.budget || 0),
        label: cat.label,
        icon: cat.icon
      });
    } else {
      setEditForm({
        marcela: String(cat.marcela || 0),
        jonatan: String(cat.jonatan || 0),
        budget: String(cat.budget || 0),
        label: cat.label,
        icon: cat.icon
      });
    }
  };

  const saveEdit = () => {
    if (editCat && editCat.id === "mercado") {
      const updated = monthData.familyExpenses.map((c: FamilyExpense) =>
        c.id === editCat.id
          ? { ...c, marcela: mercadoTotals.marcela, jonatan: mercadoTotals.jonatan, budget: Number(editForm.budget) || 0, label: editForm.label, icon: editForm.icon }
          : c
      );
      onUpdate({ ...monthData, familyExpenses: updated });
    } else {
      const updated = monthData.familyExpenses.map((c: FamilyExpense) =>
        c.id === editCat!.id
          ? { ...c, marcela: Number(editForm.marcela) || 0, jonatan: Number(editForm.jonatan) || 0, budget: Number(editForm.budget) || 0, label: editForm.label, icon: editForm.icon }
          : c
      );
      onUpdate({ ...monthData, familyExpenses: updated });
    }
    setEditCat(null);
  };

  const toggleFamilyActive = (id: string) => {
    const updated = monthData.familyExpenses.map((c: FamilyExpense) => c.id === id ? { ...c, disableNext: !c.disableNext } : c);
    onUpdate({ ...monthData, familyExpenses: updated });
  };

  const addCategory = () => {
    if (!addForm.label) return;
    const newCat: FamilyExpense = {
      id: `custom_${Date.now()}`, label: addForm.label,
      budget: Number(addForm.budget) || 0, icon: addForm.icon,
      marcela: 0, jonatan: 0, active: true, disableNext: false,
    };
    onUpdate({ ...monthData, familyExpenses: [...monthData.familyExpenses, newCat] });
    setShowAdd(false);
    setAddForm({ label: "", budget: "", icon: "📦" });
  };

  const deleteCategory = (id: string) => {
    onUpdate({ ...monthData, familyExpenses: monthData.familyExpenses.filter((c) => c.id !== id) });
    setConfirmDel(null);
  };

  const totalBudget = monthData.familyExpenses.reduce((s: number, c: FamilyExpense) => s + (c.budget || 0), 0);
  const totalPaid = monthData.familyExpenses.reduce((s: number, c: FamilyExpense) => {
    if (c.id === "mercado") return s + mercadoTotals.marcela + mercadoTotals.jonatan;
    return s + (c.marcela || 0) + (c.jonatan || 0);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>Gastos del Hogar</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{COP(totalPaid)} pagado / {COP(totalBudget)} presupuesto</div>
        </div>
        <Btn variant="primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "8px 14px" }}>+ Nuevo</Btn>
      </div>

      {monthData.familyExpenses.map((cat: FamilyExpense) => {
        const isMercado = cat.id === "mercado";
        const catTotals = isMercado ? mercadoTotals : { marcela: cat.marcela || 0, jonatan: cat.jonatan || 0 };
        const total = catTotals.marcela + catTotals.jonatan;
        const isActive = cat.active !== false;
        const over = total > cat.budget && cat.budget > 0 && isActive;
        return (
          <Card key={cat.id} onClick={() => isActive ? openEdit(cat) : null} style={{ border: over ? "1.5px solid var(--danger)" : "1px solid var(--border)", opacity: isActive ? 1 : 0.45 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Presupuesto: {COP(cat.budget)}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: over ? "var(--danger)" : "var(--text1)" }}>{COP(total)}</div>
                  {over && <div style={{ fontSize: 10, color: "var(--danger)" }}>⚠ Excedido</div>}
                  {!isActive && <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 700 }}>INACTIVO ESTE MES</div>}
                  {isActive && cat.disableNext && <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>⏸ Próximo mes inactivo</div>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFamilyActive(cat.id); }}
                  title={!isActive ? "Reactivar próximo mes" : cat.disableNext ? "Cancelar desactivación" : "Desactivar desde próximo mes"}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "4px", lineHeight: 1 }}>
                  {!isActive ? "▶️" : cat.disableNext ? "↩️" : "⏸️"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDel(cat); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 16, padding: "4px", lineHeight: 1 }}>🗑</button>
              </div>
            </div>
            {cat.budget > 0 && (
              <div style={{ marginTop: 10 }}>
                <ProgressBar value={total} max={cat.budget} height={6} />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {[{ n: "marcela", v: catTotals.marcela }, { n: "jonatan", v: catTotals.jonatan }].map(({ n, v }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)" }}>
                  <Avatar name={names[n as keyof typeof names]} persona={n} size={16} />{COP(v)}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Edit modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={editCat ? `${editCat.icon} ${editCat.label}` : ""}>
        <Field label="Presupuesto mensual" value={editForm.budget} onChange={(v) => setEditForm({ ...editForm, budget: v })} />
        {editCat && editCat.id === "mercado" ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <Label>Pagado por {names.marcela} (desde compras)</Label>
              <Field
                label={`Pagado por ${names.marcela}`}
                value={mercadoTotals.marcela}
                onChange={() => {}}
                disabled
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label>Pagado por {names.jonatan} (desde compras)</Label>
              <Field
                label={`Pagado por ${names.jonatan}`}
                value={mercadoTotals.jonatan}
                onChange={() => {}}
                disabled
              />
            </div>
          </>
        ) : (
          <>
            <Field label={`Pagado por ${names.marcela}`} value={editForm.marcela} onChange={(v) => setEditForm({ ...editForm, marcela: v })} />
            <Field label={`Pagado por ${names.jonatan}`} value={editForm.jonatan} onChange={(v) => setEditForm({ ...editForm, jonatan: v })} />
          </>
        )}
        {/* Icon selector */}
        <div style={{ marginBottom: 14 }}>
          <Label>Icono</Label>
          <button onClick={() => setShowEditIconPicker(!showEditIconPicker)}
            style={{ fontSize: 28, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
            {editForm.icon || "📦"}
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
        <Field label="Nombre de la categoría" value={editForm.label} onChange={(v) => setEditForm({ ...editForm, label: v })} type="text" placeholder="Ej: Servicios" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setEditCat(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEdit} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva categoría">
        <div style={{ marginBottom: 14 }}>
          <Label>Icono</Label>
          <button onClick={() => setShowIconPicker(!showIconPicker)}
            style={{ fontSize: 28, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
            {addForm.icon}
          </button>
          {showIconPicker && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, background: "var(--surface2)", borderRadius: 10, padding: 10 }}>
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => { setAddForm({ ...addForm, icon: ic }); setShowIconPicker(false); }}
                  style={{ fontSize: 22, background: addForm.icon === ic ? "var(--accent)" : "none", border: "none", borderRadius: 8, padding: "4px 6px", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="Nombre del gasto" value={addForm.label} onChange={(v) => setAddForm({ ...addForm, label: v })} type="text" placeholder="Ej: Gimnasio" />
        <Field label="Presupuesto mensual" value={addForm.budget} onChange={(v) => setAddForm({ ...addForm, budget: v })} placeholder="0" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addCategory} disabled={!addForm.label} style={{ flex: 1 }}>Añadir</Btn>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar gasto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.icon} {confirmDel?.label}</strong>. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteCategory(confirmDel!.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}
