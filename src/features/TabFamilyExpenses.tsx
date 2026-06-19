import { useState, useMemo } from "react";
import { Trash2, Pause, Play, Undo2 } from 'lucide-react';
import { Avatar, Card, Btn, Field, Modal, Label, ProgressBar, PaymentChips } from '../components/ui';
import { ICONS } from '../constants';
import { COP, calculateMercadoTotals } from '../utils/finanzas';
import { MonthData, Mercado, FamilyExpense } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabFamilyExpensesProps {
  monthData: MonthData;
  mercado: Mercado;
  onUpdate: (data: MonthData) => void;
}

// Input numérico: muestra número crudo al editar, formato $COP al salir
function CopField({ label, value, onChange, disabled, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const num = Number(value) || 0;
  const displayValue = focused
    ? (value === "0" ? "" : value)
    : (num > 0 ? COP(num) : "");

  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw || "0");
        }}
        onFocus={(e) => { setFocused(true); if (!disabled) e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e)  => { setFocused(false); e.target.style.borderColor = "var(--border)"; }}
        disabled={disabled}
        placeholder="$0"
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "10px 12px", borderRadius: 10, fontSize: 15, fontWeight: 700,
          border: "1.5px solid var(--border)", background: disabled ? "var(--surface2)" : "var(--surface)",
          color: "var(--text1)", fontFamily: "var(--font-body)", outline: "none",
        }}
      />
      {hint && <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export function TabFamilyExpenses({ monthData, mercado, onUpdate }: TabFamilyExpensesProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };
  const paymentMethods = config?.paymentMethods ?? [];

  const [editCat, setEditCat] = useState<FamilyExpense | null>(null);
  const [editForm, setEditForm] = useState({
    marcela: "", jonatan: "", conjunto: "", budget: "", monthlyAmount: "",
    label: "", icon: "", paymentMethodId: "",
  });
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
        conjunto: String(mercadoTotals.conjunto),
        budget: String(cat.budget || 0),
        monthlyAmount: cat.monthlyAmount != null ? String(cat.monthlyAmount) : "",
        label: cat.label, icon: cat.icon,
        paymentMethodId: cat.paymentMethodId ?? "",
      });
    } else {
      setEditForm({
        marcela: String(cat.marcela || 0),
        jonatan: String(cat.jonatan || 0),
        conjunto: String(cat.conjunto || 0),
        budget: String(cat.budget || 0),
        monthlyAmount: cat.monthlyAmount != null ? String(cat.monthlyAmount) : "",
        label: cat.label, icon: cat.icon,
        paymentMethodId: cat.paymentMethodId ?? "",
      });
    }
  };

  const saveEdit = () => {
    if (!editCat) return;
    const pmId = editForm.paymentMethodId || undefined;
    const catId = editCat.id;
    const isMercado = catId === "mercado";
    const monthlyAmount = Number(editForm.monthlyAmount) > 0 ? Number(editForm.monthlyAmount) : undefined;
    const updated = monthData.familyExpenses.map((c: FamilyExpense) =>
      c.id === catId
        ? isMercado
          ? { ...c, marcela: mercadoTotals.marcela, jonatan: mercadoTotals.jonatan, conjunto: mercadoTotals.conjunto, budget: Number(editForm.budget) || 0, monthlyAmount, label: editForm.label, icon: editForm.icon, paymentMethodId: pmId }
          : { ...c, marcela: Number(editForm.marcela) || 0, jonatan: Number(editForm.jonatan) || 0, conjunto: Number(editForm.conjunto) || 0, budget: Number(editForm.budget) || 0, monthlyAmount, label: editForm.label, icon: editForm.icon, paymentMethodId: pmId }
        : c
    );
    setEditCat(null);
    onUpdate({ ...monthData, familyExpenses: updated });
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
      marcela: 0, jonatan: 0, conjunto: 0, active: true, disableNext: false,
    };
    setShowAdd(false);
    setAddForm({ label: "", budget: "", icon: "📦" });
    onUpdate({ ...monthData, familyExpenses: [...monthData.familyExpenses, newCat] });
  };

  const deleteCategory = (id: string) => {
    setConfirmDel(null);
    onUpdate({ ...monthData, familyExpenses: monthData.familyExpenses.filter((c) => c.id !== id) });
  };

  const totalBudget = monthData.familyExpenses.reduce((s: number, c: FamilyExpense) => s + (c.monthlyAmount ?? c.budget ?? 0), 0);
  const totalPaid = monthData.familyExpenses.reduce((s: number, c: FamilyExpense) => {
    if (c.id === "mercado") return s + mercadoTotals.marcela + mercadoTotals.jonatan + mercadoTotals.conjunto;
    return s + (c.marcela || 0) + (c.jonatan || 0) + (c.conjunto || 0);
  }, 0);

  // Cálculo del restante en el modal de edición
  const editEffective = Number(editForm.monthlyAmount) || Number(editForm.budget) || 0;
  const editMarcela   = Number(editForm.marcela)  || 0;
  const editJonatan   = Number(editForm.jonatan)  || 0;
  const editConjunto  = Number(editForm.conjunto) || 0;
  const editPagado    = editMarcela + editJonatan + editConjunto;
  const editRestante  = editEffective - editPagado;

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
        const pMarcela  = isMercado ? mercadoTotals.marcela  : (cat.marcela  || 0);
        const pJonatan  = isMercado ? mercadoTotals.jonatan  : (cat.jonatan  || 0);
        const pConjunto = isMercado ? mercadoTotals.conjunto : (cat.conjunto || 0);
        const total     = pMarcela + pJonatan + pConjunto;
        const effective = cat.monthlyAmount ?? cat.budget;
        const isActive  = cat.active !== false;
        const over      = total > effective && effective > 0 && isActive;

        return (
          <Card key={cat.id} onClick={() => isActive ? openEdit(cat) : null}
            style={{ border: over ? "1.5px solid var(--danger)" : "1px solid var(--border)", opacity: isActive ? 1 : 0.45 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                    {cat.monthlyAmount != null
                      ? <><span style={{ textDecoration: "line-through", marginRight: 4 }}>{COP(cat.budget)}</span><span style={{ color: "var(--accent)" }}>{COP(cat.monthlyAmount)} real</span></>
                      : <>Presupuesto: {COP(cat.budget)}</>
                    }
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: over ? "var(--danger)" : "var(--text1)" }}>{COP(total)}</div>
                  {over && <div style={{ fontSize: 10, color: "var(--danger)" }}>⚠ Excedido</div>}
                  {!isActive && <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 700 }}>INACTIVO</div>}
                  {isActive && cat.disableNext && <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>⏸ Próx. mes inactivo</div>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFamilyActive(cat.id); }}
                  aria-label="Activar/desactivar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "4px", display: "flex" }}>
                  {!isActive ? <Play size={16} /> : cat.disableNext ? <Undo2 size={16} /> : <Pause size={16} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDel(cat); }}
                  aria-label="Eliminar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: "4px", display: "flex" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {effective > 0 && (
              <div style={{ marginTop: 10 }}>
                <ProgressBar value={total} max={effective} height={6} />
              </div>
            )}
            {/* Desglose por pagador */}
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              {pMarcela > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)" }}>
                  <Avatar name={names.marcela} persona="marcela" size={16} />{COP(pMarcela)}
                </div>
              )}
              {pJonatan > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)" }}>
                  <Avatar name={names.jonatan} persona="jonatan" size={16} />{COP(pJonatan)}
                </div>
              )}
              {pConjunto > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)" }}>
                  <span style={{ fontSize: 14 }}>🤝</span>{COP(pConjunto)}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* ── Modal: editar gasto ────────────────────────────────────────────── */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={editCat ? `${editCat.icon} ${editCat.label}` : ""}>

        {/* Presupuesto base */}
        <CopField label="Presupuesto base" value={editForm.budget}
          onChange={(v) => setEditForm({ ...editForm, budget: v })} />

        {/* Monto real este mes */}
        <CopField label="Monto real este mes (opcional — deja vacío si fue igual al presupuesto)"
          value={editForm.monthlyAmount}
          onChange={(v) => setEditForm({ ...editForm, monthlyAmount: v })} />

        {editEffective > 0 && (
          <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>Total a cubrir este mes</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)" }}>{COP(editEffective)}</span>
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

        {/* Campos de pago */}
        {editCat?.id === "mercado" ? (
          <>
            <CopField label={`Pagó ${names.marcela} (desde compras)`} value={editForm.marcela} onChange={() => {}} disabled />
            <CopField label={`Pagó ${names.jonatan} (desde compras)`} value={editForm.jonatan} onChange={() => {}} disabled />
            <CopField label="Los dos (desde compras conjuntas)" value={editForm.conjunto} onChange={() => {}} disabled />
          </>
        ) : (
          <>
            <CopField
              label={`Pagó ${names.marcela}`}
              value={editForm.marcela}
              onChange={(v) => setEditForm({ ...editForm, marcela: v })}
              hint={editEffective > 0 && Number(v => v) >= 0 ? undefined : undefined}
            />
            <CopField
              label={`Pagó ${names.jonatan}`}
              value={editForm.jonatan}
              onChange={(v) => setEditForm({ ...editForm, jonatan: v })}
            />
            <CopField
              label="Los dos (fondo conjunto)"
              value={editForm.conjunto}
              onChange={(v) => setEditForm({ ...editForm, conjunto: v })}
            />
          </>
        )}

        {/* Restante en tiempo real */}
        {editEffective > 0 && (
          <div style={{
            borderRadius: 10, padding: "10px 14px", marginBottom: 14,
            background: editRestante < 0 ? "#fef2f2" : editRestante === 0 ? "#f0fdf4" : "var(--surface2)",
            border: `1px solid ${editRestante < 0 ? "var(--danger)" : editRestante === 0 ? "var(--success)" : "var(--border)"}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>
              {editRestante < 0 ? "⚠ Excedido en" : editRestante === 0 ? "✅ Cubierto completo" : "Falta cubrir"}
            </span>
            {editRestante !== 0 && (
              <span style={{ fontSize: 15, fontWeight: 800, color: editRestante < 0 ? "var(--danger)" : "var(--text1)" }}>
                {COP(Math.abs(editRestante))}
              </span>
            )}
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

        {/* Icono y nombre */}
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

        <Field label="Nombre de la categoría" value={editForm.label}
          onChange={(v) => setEditForm({ ...editForm, label: v })} type="text" placeholder="Ej: Servicios" />

        <PaymentChips
          methods={paymentMethods}
          selectedId={editForm.paymentMethodId || undefined}
          onChange={(id) => setEditForm({ ...editForm, paymentMethodId: id ?? "" })}
          ownerNames={names}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setEditCat(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEdit} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* ── Modal: nueva categoría ────────────────────────────────────────── */}
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
        <Field label="Nombre del gasto" value={addForm.label}
          onChange={(v) => setAddForm({ ...addForm, label: v })} type="text" placeholder="Ej: Gimnasio" />
        <Field label="Presupuesto mensual" value={addForm.budget}
          onChange={(v) => setAddForm({ ...addForm, budget: v })} placeholder="0" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addCategory} disabled={!addForm.label} style={{ flex: 1 }}>Añadir</Btn>
        </div>
      </Modal>

      {/* ── Modal: confirmar eliminar ─────────────────────────────────────── */}
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
