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

function saveData(d) {
  // Always save to localStorage as backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  // Save to Firestore if available
  if (db) {
    const [col, docId] = FIRESTORE_DOC.split("/");
    setDoc(doc(db, col, docId), d).catch((e) => console.error("Firestore save error:", e));
  }
}



// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const bg = name === "marcela" ? "var(--marce)" : "var(--jona)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", background: bg,
      color: "#fff", fontWeight: 700, fontSize: size * 0.42, flexShrink: 0,
      fontFamily: "var(--font-display)",
    }}>{name === "marcela" ? "M" : "J"}</span>
  );
}

function ProgressBar({ value, max, color = "var(--accent)", height = 8 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", borderRadius: 99, width: `${pct}%`,
        background: pct >= 100 ? "var(--danger)" : color,
        transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "var(--surface)", borderRadius: 16, padding: "18px 20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid var(--border)",
      cursor: onClick ? "pointer" : "default",
      transition: onClick ? "transform 0.15s, box-shadow 0.15s" : "none",
      ...style,
    }}
    onMouseEnter={onClick ? (e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; } : undefined}
    onMouseLeave={onClick ? (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; } : undefined}
    >{children}</div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 6 }}>{children}</div>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 20, padding: "24px",
        width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        maxHeight: "90vh", overflowY: "auto", animation: "slideUp 0.2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "var(--surface2)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "var(--text2)" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "number", placeholder = "" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)",
          background: "var(--surface2)", color: "var(--text1)", fontSize: 15,
          outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", style = {}, disabled = false }) {
  const variants = {
    primary: { background: "var(--accent)", color: "#fff" },
    secondary: { background: "var(--surface2)", color: "var(--text1)" },
    danger: { background: "#fee2e2", color: "var(--danger)" },
    marce: { background: "var(--marce)", color: "#fff" },
    jona: { background: "var(--jona)", color: "#fff" },
    ghost: { background: "none", color: "var(--text2)", border: "1.5px solid var(--border)" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      padding: "10px 18px", borderRadius: 10, border: "none", cursor: disabled ? "default" : "pointer",
      fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)", opacity: disabled ? 0.5 : 1,
      transition: "opacity 0.15s, transform 0.1s",
      ...variants[variant], ...style,
    }}>{children}</button>
  );
}

// ─── TAB: DASHBOARD ───────────────────────────────────────────────────────────
function TabDashboard({ monthData, summary }) {
  const { ratio, totalNeto, netoMarcela, netoJonatan,
    personalTotalMarcela, personalTotalJonatan,
    extrasTotalMarcela, extrasTotalJonatan,
    totalFamilyBudget, totalFamilyPaid, totalFamilyPending,
    totalFamilyPaidMarcela, totalFamilyPaidJonatan,
    aporteFamiliarMarcela, aporteFamiliarJonatan,
    aportePagadoIdealMarcela, aportePagadoIdealJonatan,
    saldoMarcela, saldoJonatan, diffMarcela, diffJonatan } = summary;

  // Calcular faltantes para llegar al ideal
  const faltanteMarcela = Math.max(0, aporteFamiliarMarcela - totalFamilyPaidMarcela);
  const faltanteJonatan = Math.max(0, aporteFamiliarJonatan - totalFamilyPaidJonatan);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Salarios */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Salarios — {MONTH_NAMES[monthData.month]} {monthData.year}
        </div>
        {[
          { n: "marcela", bruto: monthData.salaries.marcela, personal: personalTotalMarcela, neto: netoMarcela },
          { n: "jonatan", bruto: monthData.salaries.jonatan, personal: personalTotalJonatan, neto: netoJonatan },
        ].map(({ n, bruto, personal, neto }) => (
          <div key={n} style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Avatar name={n} size={26} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{n}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text2)" }}>{(ratio[n] * 100).toFixed(1)}% del aporte</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Salario bruto</span>
                <span style={{ fontWeight: 600 }}>{COP(bruto)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>− Gastos personales</span>
                <span style={{ fontWeight: 600, color: "var(--danger)" }}>−{COP(personal)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Neto disponible</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: n === "marcela" ? "var(--marce)" : "var(--jona)", fontFamily: "var(--font-display)" }}>{COP(neto)}</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Total neto disponible</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{COP(totalNeto)}</span>
        </div>
      </Card>

      {/* Gastos familiares */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Gastos del Hogar</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Pagado</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{COP(totalFamilyPaid)} / {COP(totalFamilyBudget)}</span>
        </div>
        <ProgressBar value={totalFamilyPaid} max={totalFamilyBudget} height={10} />
        <div style={{ marginTop: 12 }}>
          {totalFamilyPending > 0 ? (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#92400e" }}>⏳ Por pagar</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#92400e" }}>{COP(totalFamilyPending)}</span>
            </div>
          ) : totalFamilyPaid > 0 ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ ¡Todos los gastos cubiertos!</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {[{ label: "Pagó Marcela", val: totalFamilyPaidMarcela, n: "marcela", ideal: aportePagadoIdealMarcela },
            { label: "Pagó Jonatan", val: totalFamilyPaidJonatan, n: "jonatan", ideal: aportePagadoIdealJonatan }].map(({ label, val, n, ideal }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: `var(--${n})` }}>{COP(val)}</div>
              <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>Ideal: {COP(ideal)}</div>
            </div>
          ))}
        </div>
        {(faltanteMarcela >= 1000 || faltanteJonatan >= 1000) && (<div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
            {faltanteMarcela >= 1000 && (<div style={{ color: "var(--danger)", marginBottom: 4 }}>
                Marcela le falta pagar {COP(faltanteMarcela)} para llegar al ideal</div>
            )}
            {faltanteJonatan >= 1000 && (<div style={{ color: "var(--danger)" }}>
                Jonatan le falta pagar {COP(faltanteJonatan)} para llegar al ideal</div>
            )}</div>
        )}
      </Card>

      {/* Saldo libre */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Saldo Libre Estimado</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ n: "marcela", saldo: saldoMarcela, aporte: aporteFamiliarMarcela },
            { n: "jonatan", saldo: saldoJonatan, aporte: aporteFamiliarJonatan }].map(({ n, saldo, aporte }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Avatar name={n} size={24} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "capitalize" }}>{n}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Aporte ideal al hogar</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{COP(aporte)}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Gastos extra</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", marginBottom: 8 }}>−{COP(n === "marcela" ? extrasTotalMarcela : extrasTotalJonatan)}</div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>Queda libre</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: saldo >= 0 ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-display)" }}>
                  {COP(saldo)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)", padding: "8px 10px", background: "#f0f4ff", borderRadius: 8 }}>
          Saldo libre = neto disponible − aporte proporcional al hogar
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: HOGAR ───────────────────────────────────────────────────────────────
function TabFamilyExpenses({ monthData, mercado, onUpdate }) {
  const [editCat, setEditCat] = useState(null);
  const [editForm, setEditForm] = useState({ marcela: "", jonatan: "", budget: "", label: "", icon: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ label: "", budget: "", icon: "📦" });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);


  const openEdit = (cat) => {
    setEditCat(cat);
    // For Mercado category, use computed values from compras
    if (cat.id === "mercado") {
      const mercadoTotals = calculateMercadoTotals(mercado);
      setEditForm({
        marcela: mercadoTotals.marcela,
        jonatan: mercadoTotals.jonatan,
        budget: cat.budget || 0,
        label: cat.label,
        icon: cat.icon
      });
    } else {
      setEditForm({
        marcela: cat.marcela || 0,
        jonatan: cat.jonatan || 0,
        budget: cat.budget || 0,
        label: cat.label,
        icon: cat.icon
      });
    }
  };

  const saveEdit = () => {
    // For Mercado category, preserve the computed marcela/jonatan values from compras
    if (editCat && editCat.id === "mercado") {
      const mercadoTotals = calculateMercadoTotals(mercado);
      const updated = monthData.familyExpenses.map((c) =>
        c.id === editCat.id
          ? { ...c, marcela: mercadoTotals.marcela, jonatan: mercadoTotals.jonatan, budget: Number(editForm.budget) || 0, label: editForm.label, icon: editForm.icon }
          : c
      );
      onUpdate({ ...monthData, familyExpenses: updated });
    } else {
      const updated = monthData.familyExpenses.map((c) =>
        c.id === editCat.id
          ? { ...c, marcela: Number(editForm.marcela) || 0, jonatan: Number(editForm.jonatan) || 0, budget: Number(editForm.budget) || 0, label: editForm.label, icon: editForm.icon }
          : c
      );
      onUpdate({ ...monthData, familyExpenses: updated });
    }
    setEditCat(null);
  };
  const toggleFamilyActive = (id) => {
    // Only toggles disableNext — current month calculations unaffected
    const updated = monthData.familyExpenses.map((c) => c.id === id ? { ...c, disableNext: !c.disableNext } : c);
    onUpdate({ ...monthData, familyExpenses: updated });
  };

  const addCategory = () => {
    if (!addForm.label) return;
    const newCat = {
      id: `custom_${Date.now()}`, label: addForm.label,
      budget: Number(addForm.budget) || 0, icon: addForm.icon,
      marcela: 0, jonatan: 0,
    };
    onUpdate({ ...monthData, familyExpenses: [...monthData.familyExpenses, newCat] });
    setShowAdd(false);
    setAddForm({ label: "", budget: "", icon: "📦" });
  };

  const deleteCategory = (id) => {
    onUpdate({ ...monthData, familyExpenses: monthData.familyExpenses.filter((c) => c.id !== id) });
    setConfirmDel(null);
  };

  const totalBudget = monthData.familyExpenses.reduce((s, c) => s + (c.budget || 0), 0);
  const totalPaid = monthData.familyExpenses.reduce((s, c) => {
    // For Mercado category, use computed values from compras
    if (c.id === "mercado") {
      const mercadoTotals = calculateMercadoTotals(mercado);
      return s + mercadoTotals.marcela + mercadoTotals.jonatan;
    }
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

      {monthData.familyExpenses.map((cat) => {
        // For Mercado category, use computed values from compras for display
        const isMercado = cat.id === "mercado";
        const mercadoTotals = isMercado ? calculateMercadoTotals(mercado) : { marcela: cat.marcela || 0, jonatan: cat.jonatan || 0 };
        const total = mercadoTotals.marcela + mercadoTotals.jonatan;
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
              {[{ n: "marcela", v: mercadoTotals.marcela }, { n: "jonatan", v: mercadoTotals.jonatan }].map(({ n, v }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)" }}>
                  <Avatar name={n} size={16} />{COP(v)}
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
              <Label>Pagado por Marcela (desde compras)</Label>
              <Field
                label="Pagado por Marcela"
                value={calculateMercadoTotals(mercado).marcela}
                onChange={(v) => {/* Read-only - ignore changes */}}
                disabled
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label>Pagado por Jonatan (desde compras)</Label>
              <Field
                label="Pagado por Jonatan"
                value={calculateMercadoTotals(mercado).jonatan}
                onChange={(v) => {/* Read-only - ignore changes */}}
                disabled
              />
            </div>
          </>
        ) : (
          <>
            <Field label="Pagado por Marcela" value={editForm.marcela} onChange={(v) => setEditForm({ ...editForm, marcela: v })} />
            <Field label="Pagado por Jonatan" value={editForm.jonatan} onChange={(v) => setEditForm({ ...editForm, jonatan: v })} />
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
        {/* Label (name) input */}
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
          <Btn variant="danger" onClick={() => deleteCategory(confirmDel.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── TAB: PERSONAL ────────────────────────────────────────────────────────────
function TabPersonalExpenses({ monthData, onUpdate }) {
  const [addModal, setAddModal] = useState(null);
  const [form, setForm] = useState({ desc: "", amount: "", day: "" });
  const [editExpense, setEditExpense] = useState(null);
  const [editForm, setEditForm] = useState({ desc: "", amount: "", day: "", icon: "" });
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);

  const togglePaid = (person, id) => {
    const updated = { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].map((e) => e.id === id ? { ...e, paid: !e.paid } : e) };
    onUpdate({ ...monthData, personalExpenses: updated });
  };
  const toggleActive = (person, id) => {
    // Toggles disableNext — affects next month only, not current
    const updated = { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].map((e) => e.id === id ? { ...e, disableNext: !e.disableNext } : e) };
    onUpdate({ ...monthData, personalExpenses: updated });
  };

  const addExpense = () => {
    const newExp = {
      id: Date.now(),
      desc: form.desc,
      amount: Number(form.amount) || 0,
      day: Number(form.day) || null,
      paid: false,
      icon: form.icon || "💰"
    };
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [addModal]: [...monthData.personalExpenses[addModal], newExp] } });
    setAddModal(null);
    setForm({ desc: "", amount: "", day: "", icon: "" });
  };

  const openEditExpense = (person, expense) => {
    setEditExpense({ person, expense });
    setEditForm({
      desc: expense.desc,
      amount: expense.amount || "",
      day: expense.day || "",
      icon: expense.icon || ""
    });
  };

  const saveEditExpense = () => {
    const { person, expense } = editExpense;
    const updatedExpenses = monthData.personalExpenses[person].map((e) =>
      e.id === expense.id
        ? { ...e, desc: editForm.desc, amount: Number(editForm.amount) || 0, day: Number(editForm.day) || null, icon: editForm.icon || "💰" }
        : e
    );
    const updatedPersonalExpenses = { ...monthData.personalExpenses, [person]: updatedExpenses };
    onUpdate({ ...monthData, personalExpenses: updatedPersonalExpenses });
    setEditExpense(null);
  };

  const deleteExpense = (person, id) => {
    onUpdate({ ...monthData, personalExpenses: { ...monthData.personalExpenses, [person]: monthData.personalExpenses[person].filter((e) => e.id !== id) } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {["jonatan", "marcela"].map((person) => {
        const expenses = monthData.personalExpenses[person] || [];
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const paidAmt = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
        return (
          <Card key={person}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={person} size={32} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{person}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{COP(paidAmt)} pagado / {COP(total)}</div>
                </div>
              </div>
              <Btn variant={person === "marcela" ? "marce" : "jona"} style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setAddModal(person); setForm({ desc: "", amount: "", day: "" }); }}>+ Añadir</Btn>
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
                    <button onClick={(e) => { e.stopPropagation(); toggleActive(person, e.id); }} title="Reactivar el próximo mes"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>▶️</button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); toggleActive(person, e.id); }} title={e.disableNext ? "Cancelar desactivación" : "Desactivar desde el próximo mes"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>
                      {e.disableNext ? "↩️" : "⏸️"}
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteExpense(person, e.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, padding: "2px 4px" }}>🗑</button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <Modal open={!!addModal} onClose={() => setAddModal(null)} title={`Añadir gasto — ${addModal === "marcela" ? "Marcela" : "Jonatan"}`}>
        <Field label="Descripción" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} type="text" placeholder="Ej: Gym" />
        <Field label="Valor (COP)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="50000" />
        <Field label="Día del mes (opcional)" value={form.day} onChange={(v) => setForm({ ...form, day: v })} placeholder="15" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setAddModal(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addExpense} disabled={!form.desc || !form.amount} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editExpense} onClose={() => setEditExpense(null)} title={`Editar gasto — ${editExpense?.person === "marcela" ? "Marcela" : "Jonatan"}`}>
        <Field label="Descripción" value={editForm.desc} onChange={(v) => setEditForm({ ...editForm, desc: v })} type="text" placeholder="Ej: Gym" />
        <Field label="Valor (COP)" value={editForm.amount} onChange={(v) => setEditForm({ ...editForm, amount: v })} placeholder="50000" />
        <Field label="Día del mes (opcional)" value={editForm.day} onChange={(v) => setEditForm({ ...editForm, day: v })} placeholder="15" />
        {/* Icon selector */}
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
    </div>
  );
}

// ─── TAB: SALARIOS ────────────────────────────────────────────────────────────
function TabSalaries({ monthData, onUpdate }) {
  const personalTotalMarcela = (monthData.personalExpenses?.marcela || []).reduce((s, e) => s + (e.amount || 0), 0);
  const personalTotalJonatan = (monthData.personalExpenses?.jonatan || []).reduce((s, e) => s + (e.amount || 0), 0);

  const [form, setForm] = useState({
    marcela: monthData.salaries.marcela || "",
    jonatan: monthData.salaries.jonatan || "",
  });

  const save = () => {
    onUpdate({ ...monthData, salaries: { marcela: Number(form.marcela) || 0, jonatan: Number(form.jonatan) || 0 } });
  };

  const netoMarce = Math.max(0, (Number(form.marcela) || 0) - personalTotalMarcela);
  const netoJona  = Math.max(0, (Number(form.jonatan)  || 0) - personalTotalJonatan);
  const totalNeto = netoMarce + netoJona;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 4 }}>
          Salarios — {MONTH_NAMES[monthData.month]} {monthData.year}
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16, padding: "8px 10px", background: "#f0f4ff", borderRadius: 8, lineHeight: 1.6 }}>
          Ingresa el <strong>salario bruto</strong> de cada uno. La app descuenta los gastos personales automáticamente para calcular el neto y los aportes al hogar.
        </div>
        {[
          { n: "marcela", neto: netoMarce, personal: personalTotalMarcela },
          { n: "jonatan", neto: netoJona,  personal: personalTotalJonatan },
        ].map(({ n, neto, personal }) => (
          <div key={n} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Avatar name={n} size={22} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{n}</span>
            </div>
            <Field
              label="Salario bruto"
              value={form[n]}
              onChange={(v) => setForm({ ...form, [n]: v })}
              placeholder="Ej: 2000000"
            />
            {(Number(form[n]) > 0) && (
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, display: "flex", flexDirection: "column", gap: 5, marginTop: -6, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text2)" }}>
                  <span>− Gastos personales</span>
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>−{COP(personal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                  <span style={{ fontWeight: 700 }}>Neto disponible</span>
                  <span style={{ fontWeight: 800, color: n === "marcela" ? "var(--marce)" : "var(--jona)" }}>{COP(neto)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <Btn variant="primary" onClick={save} style={{ width: "100%", marginTop: 4 }}>Guardar salarios</Btn>
      </Card>

      {totalNeto > 0 && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Distribución de aportes (sobre neto)</div>
          {[{ n: "marcela", v: netoMarce }, { n: "jonatan", v: netoJona }].map(({ n, v }) => {
            const pct = totalNeto > 0 ? (v / totalNeto * 100).toFixed(1) : 0;
            return (
              <div key={n} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={n} size={20} />
                    <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{n}</span>
                  </span>
                  <span style={{ color: "var(--text2)" }}>{pct}% · {COP(v)}</span>
                </div>
                <ProgressBar value={v} max={totalNeto} color={n === "marcela" ? "var(--marce)" : "var(--jona)"} height={8} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}


// ─── TAB: HISTORIAL ───────────────────────────────────────────────────────────
function TabHistory({ allMonths, currentKey, mercado, onSelectMonth, onNewMonth, onDeleteMonth }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ year: 2026, month: 7, marcela: "", jonatan: "" });

  const create = () => {
    const key = getMonthKey(form.year, form.month);
    if (allMonths[key]) { alert("Ese mes ya existe"); return; }
    onNewMonth(Number(form.year), Number(form.month), { marcela: Number(form.marcela) || 0, jonatan: Number(form.jonatan) || 0 });
    setShowNew(false);
  };

  const sorted = Object.values(allMonths).sort((a, b) => b.key.localeCompare(a.key));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
          Historial de Meses
        </div>
        <Btn variant="primary" onClick={() => setShowNew(true)} style={{ fontSize: 13, padding: "8px 14px" }}>+ Nuevo mes</Btn>
      </div>

      {sorted.map((m) => {
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
            <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
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


// ─── TAB: EXTRAS ──────────────────────────────────────────────────────────────


function TabExtras({ monthData, onUpdate }) {
  const extras = monthData.extras || [];
  const [showAdd, setShowAdd]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({ person: "jonatan", amount: "", category: "Comida rápida", desc: "", date: new Date().toISOString().slice(0, 10) });

  const addExtra = () => {
    if (!form.amount) return;
    const newE = { id: `ex_${Date.now()}`, person: form.person, amount: Number(form.amount), category: form.category, desc: form.desc, date: form.date };
    onUpdate({ ...monthData, extras: [...extras, newE] });
    setShowAdd(false);
    setForm({ person: "jonatan", amount: "", category: "Comida rápida", desc: "", date: new Date().toISOString().slice(0, 10) });
  };

  const deleteExtra = (id) => {
    onUpdate({ ...monthData, extras: extras.filter((e) => e.id !== id) });
    setConfirmDel(null);
  };

  const totalMarcela = extras.filter((e) => e.person === "marcela").reduce((s, e) => s + e.amount, 0);
  const totalJonatan = extras.filter((e) => e.person === "jonatan").reduce((s, e) => s + e.amount, 0);

  // Group by category for summary
  const byCat = extras.reduce((acc, e) => {
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
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "capitalize" }}>{n}</span>
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
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
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
        [...extras].reverse().map((e) => (
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
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, padding: "2px" }}>🗑</button>
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
            {["jonatan", "marcela"].map((p) => (
              <button key={p} onClick={() => setForm({ ...form, person: p })} style={{
                padding: "10px", borderRadius: 10, border: "2px solid",
                borderColor: form.person === p ? (p === "marcela" ? "var(--marce)" : "var(--jona)") : "var(--border)",
                background: form.person === p ? (p === "marcela" ? "var(--marce)" : "var(--jona)") : "var(--surface2)",
                color: form.person === p ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Avatar name={p} size={18} />
                <span style={{ textTransform: "capitalize" }}>{p}</span>
              </button>
            ))}
          </div>
        </div>
        <Field label="Valor (COP)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="15000" />
        <div style={{ marginBottom: 14 }}>
          <Label>Categoría</Label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {EXTRA_CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Field label="Descripción (opcional)" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} type="text" placeholder="Ej: Pizza con Marcela" />
        <Field label="Fecha" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={addExtra} disabled={!form.amount} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar gasto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.category}</strong> de {COP(confirmDel?.amount)}.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteExtra(confirmDel.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── TAB: MERCADO ─────────────────────────────────────────────────────────────


function TabMercado({ mercado, onUpdate }) {
  const items   = mercado?.items   || [];
  const compras = mercado?.compras || [];

  const [view,       setView]       = useState("lista");
  const [filterCat,  setFilterCat]  = useState("Todas");
  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [showCompra, setShowCompra] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const [addForm, setAddForm] = useState({ name: "", pricePer: "", unit: "und", supermarket: "D1", category: "Despensa" });
  const [compraForm, setCompraForm] = useState({ itemId: "", qty: "", supermarket: "D1", date: new Date().toISOString().slice(0, 10), notes: "", person: "marcela" });

  const saveItem = () => {
    if (!addForm.name || !addForm.pricePer) return;
    const newItem = { id: `item_${Date.now()}`, name: addForm.name, pricePer: Number(addForm.pricePer), unit: addForm.unit, supermarket: addForm.supermarket, category: addForm.category };
    onUpdate({ ...mercado, items: [...items, newItem] });
    setShowAdd(false);
    setAddForm({ name: "", pricePer: "", unit: "und", supermarket: "D1", category: "Despensa" });
  };

  const updateItem = (id, changes) => {
    onUpdate({ ...mercado, items: items.map((i) => i.id === id ? { ...i, ...changes } : i) });
  };

  const deleteItem = (id) => {
    onUpdate({ ...mercado, items: items.filter((i) => i.id !== id), compras: compras.filter((c) => c.itemId !== id) });
    setConfirmDel(null);
  };

  const registerCompra = () => {
    if (!compraForm.itemId || !compraForm.qty) return;
    const item = items.find((i) => i.id === compraForm.itemId);
    if (!item) return;
    const qty   = Number(compraForm.qty);
    const total = item.pricePer * qty;
    const marcelaAmount = compraForm.person === "marcela" ? total : compraForm.person === "jonatan" ? 0 : total / 2;
    const jonatanAmount = compraForm.person === "jonatan" ? total : compraForm.person === "marcela" ? 0 : total / 2;
    const newC  = {
      id: `compra_${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      pricePer: item.pricePer,
      total,
      supermarket: compraForm.supermarket,
      date: compraForm.date,
      notes: compraForm.notes,
      marcelaAmount,
      jonatanAmount
    };
    onUpdate({ ...mercado, compras: [newC, ...compras] });
    setShowCompra(false);
    setCompraForm({ itemId: "", qty: "", supermarket: "D1", date: new Date().toISOString().slice(0, 10), notes: "", person: "marcela" });
  };

  const compraItem = items.find((i) => i.id === compraForm.itemId);
  const compraPreview = compraItem && compraForm.qty ? compraItem.pricePer * Number(compraForm.qty) : null;

  const filtered = items.filter((i) => {
    const matchCat  = filterCat === "Todas" || i.category === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  const totalCompras = compras.reduce((s, c) => s + c.total, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toggle */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 12, padding: 4, gap: 4 }}>
        {[{ id: "lista", label: "🧺 Productos" }, { id: "compras", label: "🧾 Compras" }].map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer",
            background: view === v.id ? "var(--surface)" : "transparent",
            color: view === v.id ? "var(--text1)" : "var(--text2)",
            fontWeight: view === v.id ? 700 : 500, fontSize: 13, fontFamily: "var(--font-body)",
            boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s",
          }}>{v.label}</button>
        ))}
      </div>

      {view === "lista" && (
        <>
          {/* Search + add */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="🔍 Buscar producto..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
            <Btn variant="primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "9px 14px", whiteSpace: "nowrap" }}>+ Nuevo</Btn>
          </div>

          {/* Category filter pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ALL_CATS.map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{
                whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                background: filterCat === cat ? "var(--accent)" : "var(--surface2)",
                color: filterCat === cat ? "#fff" : "var(--text2)",
                transition: "all 0.15s",
              }}>{cat}</button>
            ))}
          </div>

          {/* Register compra shortcut */}
          {items.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <Btn variant="secondary" onClick={() => setShowCompra(true)} style={{ fontSize: 12, padding: "7px 14px" }}>🧾 Registrar compra</Btn>
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>
            {filtered.length} de {items.length} producto{items.length !== 1 ? "s" : ""}
          </div>

          {filtered.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin resultados</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Prueba con otra categoría o búsqueda.</div>
            </Card>
          ) : (
            filtered.map((item) => (
              <ItemCard
                key={item.id} item={item}
                lastCompras={compras.filter((c) => c.itemId === item.id).slice(0, 2)}
                onUpdate={(changes) => updateItem(item.id, changes)}
                onDelete={() => setConfirmDel(item)}
                onComprar={() => { setCompraForm({ ...compraForm, itemId: item.id, supermarket: item.supermarket }); setShowCompra(true); }}
              />
            ))
          )}
        </>
      )}

      {view === "compras" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
              {compras.length} compra{compras.length !== 1 ? "s" : ""} · {COP(totalCompras)}
            </div>
            <Btn variant="primary" onClick={() => setShowCompra(true)} style={{ fontSize: 12, padding: "7px 12px" }} disabled={items.length === 0}>+ Registrar</Btn>
          </div>
          {compras.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧾</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin compras aún</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Registra una compra desde la lista de productos.</div>
            </Card>
          ) : (
            compras.map((c) => (
              <Card key={c.id} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{c.itemName}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{c.qty} {c.unit} · {COP(c.pricePer)}/{c.unit} · {c.supermarket}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{c.date}{c.notes ? ` · ${c.notes}` : ""}</div>
                    {c.marcelaAmount !== undefined || c.jonatanAmount !== undefined && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text2)" }}>
                        {c.marcelaAmount > 0 && (
                          <div>Marcela: {COP(c.marcelaAmount)}</div>
                        )}
                        {c.jonatanAmount > 0 && (
                          <div>Jonatan: {COP(c.jonatanAmount)}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{COP(c.total)}</div>
                    <button onClick={() => { if (window.confirm("¿Eliminar compra?")) onUpdate({ ...mercado, compras: compras.filter((x) => x.id !== c.id) }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 11, marginTop: 4 }}>🗑 eliminar</button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </>
      )}

      {/* Modal: añadir producto */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo producto">
        <Field label="Nombre" value={addForm.name} onChange={(v) => setAddForm({ ...addForm, name: v })} type="text" placeholder="Ej: Tomate chonto" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Precio" value={addForm.pricePer} onChange={(v) => setAddForm({ ...addForm, pricePer: v })} placeholder="895" />
          <div>
            <Label>Unidad</Label>
            <select value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
              {UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Categoría</Label>
          <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {ALL_CATS.filter((c) => c !== "Todas").map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Supermercado habitual</Label>
          <select value={addForm.supermarket} onChange={(e) => setAddForm({ ...addForm, supermarket: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {SUPERMARKETS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveItem} disabled={!addForm.name || !addForm.pricePer} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Modal: registrar compra */}
      <Modal open={showCompra} onClose={() => setShowCompra(false)} title="Registrar compra">
        <div style={{ marginBottom: 14 }}>
          <Label>Producto</Label>
          <select value={compraForm.itemId} onChange={(e) => {
            const it = items.find((i) => i.id === e.target.value);
            setCompraForm({ ...compraForm, itemId: e.target.value, supermarket: it?.supermarket || "D1" });
          }} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            <option value="">— Selecciona —</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} · {COP(i.pricePer)}/{i.unit}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>¿Quién pagó?</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["jonatan", "marcela", "ambos"].map((p) => (
              <button key={p} onClick={() => setCompraForm({ ...compraForm, person: p })} style={{
                padding: "10px", borderRadius: 10, border: "2px solid",
                borderColor: compraForm.person === p ? (p === "marcela" ? "var(--marce)" : p === "jonatan" ? "var(--jona)" : "var(--accent)") : "var(--border)",
                background: compraForm.person === p ? (p === "marcela" ? "var(--marce)" : p === "jonatan" ? "var(--jona)" : "var(--accent)") : "var(--surface2)",
                color: compraForm.person === p ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <span>{p === "ambos" ? "Ambos" : p === "marcela" ? "Marcela" : "Jonatan"}</span>
              </button>
            ))}
          </div>
        </div>
        <Field label={`Cantidad${compraItem ? ` (${compraItem.unit})` : ""}`} value={compraForm.qty} onChange={(v) => setCompraForm({ ...compraForm, qty: v })} placeholder="1" />
        {compraPreview !== null && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Total estimado</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--success)", fontFamily: "var(--font-display)" }}>{COP(compraPreview)}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{compraForm.qty} {compraItem?.unit} × {COP(compraItem?.pricePer)}</div>
            {compraForm.person !== "" && (
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)" }}>
                {compraForm.person === "marcela" && (
                  <div>Marcela paga: {COP(compraPreview)}</div>
                )}
                {compraForm.person === "jonatan" && (
                  <div>Jonatan paga: {COP(compraPreview)}</div>
                )}
                {compraForm.person === "ambos" && (
                  <div>Cada uno paga: {COP(compraPreview / 2)}</div>
                )}
              </div>
            )}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <Label>Supermercado</Label>
          <select value={compraForm.supermarket} onChange={(e) => setCompraForm({ ...compraForm, supermarket: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {SUPERMARKETS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Field label="Fecha" value={compraForm.date} onChange={(v) => setCompraForm({ ...compraForm, date: v })} type="date" />
        <Field label="Notas (opcional)" value={compraForm.notes} onChange={(v) => setCompraForm({ ...compraForm, notes: v })} type="text" placeholder="Ej: Estaba en oferta" />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setShowCompra(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={registerCompra} disabled={!compraForm.itemId || !compraForm.qty} style={{ flex: 1 }}>Registrar</Btn>
        </div>
      </Modal>

      {/* Modal: confirmar eliminar */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar producto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.name}</strong>. También se eliminarán sus compras del historial.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteItem(confirmDel.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── ItemCard: edición inline completa + calculadora con precio editable ─────
function ItemCard({ item, lastCompras, onUpdate, onDelete, onComprar }) {
  const [editing,      setEditing]      = useState(false);
  const [qty,          setQty]          = useState("");
  const [currentPrice, setCurrentPrice] = useState(String(item.pricePer));
  const [editForm,     setEditForm]     = useState({ name: item.name, pricePer: item.pricePer, unit: item.unit, supermarket: item.supermarket, category: item.category });

  const priceForCalc = Number(currentPrice) || 0;
  const total        = qty !== "" && !isNaN(Number(qty)) && priceForCalc > 0 ? priceForCalc * Number(qty) : null;
  const priceChanged = priceForCalc > 0 && priceForCalc !== item.pricePer;

  const saveEdit = () => {
    onUpdate({ name: editForm.name, pricePer: Number(editForm.pricePer) || item.pricePer, unit: editForm.unit, supermarket: editForm.supermarket, category: editForm.category });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditForm({ name: item.name, pricePer: item.pricePer, unit: item.unit, supermarket: item.supermarket, category: item.category });
    setEditing(false);
  };

  return (
    <Card style={{ padding: "14px 16px" }}>
      {!editing ? (
        <>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)", marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{item.category} · {item.supermarket}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setEditing(true)}
                style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontSize: 14 }}>✏️</button>
              <button onClick={onDelete}
                style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontSize: 14 }}>🗑</button>
            </div>
          </div>

          {/* Calculadora */}
          <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "14px" }}>

            {/* Fila 1: Precio base (solo lectura) + Precio hoy (editable) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {/* Precio base */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 5 }}>
                  💾 Precio base
                </div>
                <div style={{
                  padding: "9px 12px", borderRadius: 9, background: "var(--surface)",
                  border: "2px solid var(--border)", fontSize: 15, fontWeight: 700,
                  color: "var(--text2)", textAlign: "right",
                }}>
                  {COP(item.pricePer)}
                </div>
                <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 3, textAlign: "right" }}>por {item.unit}</div>
              </div>

              {/* Precio hoy */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: priceChanged ? "var(--jona)" : "var(--text2)", marginBottom: 5 }}>
                  🏷️ Precio hoy
                </div>
                <input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "9px 12px", borderRadius: 9, fontSize: 15, fontWeight: 700, textAlign: "right",
                    border: `2px solid ${priceChanged ? "var(--jona)" : "var(--border)"}`,
                    background: priceChanged ? "#fff7f0" : "var(--surface)",
                    color: priceChanged ? "var(--jona)" : "var(--text1)",
                    fontFamily: "var(--font-body)", outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e)  => (e.target.style.borderColor = priceChanged ? "var(--jona)" : "var(--border)")}
                />
                {priceChanged ? (
                  <div style={{ fontSize: 9, color: "var(--jona)", marginTop: 3, fontWeight: 600, textAlign: "right" }}>
                    ↑ precio cambió
                  </div>
                ) : (
                  <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 3, textAlign: "right" }}>edita si cambió</div>
                )}
              </div>
            </div>

            {/* Fila 2: Cantidad + Unidad */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {/* Cantidad */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 5 }}>
                  📦 Cantidad
                </div>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "9px 12px", borderRadius: 9, fontSize: 15, fontWeight: 700, textAlign: "right",
                    border: "2px solid var(--border)", background: "var(--surface)",
                    color: "var(--text1)", fontFamily: "var(--font-body)", outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Unidad */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 5 }}>
                  📐 Unidad
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {UNITS.map((u) => (
                    <button key={u.id} onClick={() => onUpdate({ unit: u.id })} style={{
                      padding: "7px 4px", borderRadius: 7, border: "2px solid",
                      borderColor: item.unit === u.id ? "var(--accent)" : "var(--border)",
                      background: item.unit === u.id ? "var(--accent)" : "var(--surface)",
                      color: item.unit === u.id ? "#fff" : "var(--text2)",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                      transition: "all 0.12s",
                    }}>{u.id}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total */}
            <div style={{
              borderRadius: 10, padding: "12px 14px", marginBottom: 10, textAlign: "center",
              background: total !== null ? "#f0fdf4" : "var(--surface)",
              border: `1.5px solid ${total !== null ? "#86efac" : "var(--border)"}`,
            }}>
              {total !== null ? (
                <>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Total estimado</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--success)", fontFamily: "var(--font-display)", lineHeight: 1 }}>{COP(total)}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 5 }}>
                    {qty} {item.unit} × {COP(priceForCalc)}
                    {priceChanged && <span style={{ color: "var(--jona)", marginLeft: 4 }}>(precio hoy)</span>}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text2)", padding: "4px 0" }}>
                  Ingresa cantidad para ver el total
                </div>
              )}
            </div>

            {/* Botones */}
            <Btn variant="secondary" onClick={onComprar} style={{ width: "100%", fontSize: 13, padding: "11px", marginBottom: priceChanged ? 8 : 0 }}>
              🧾 Guardar compra
            </Btn>
            {priceChanged && (
              <button
                onClick={() => { onUpdate({ pricePer: priceForCalc }); setCurrentPrice(String(priceForCalc)); }}
                style={{ width: "100%", fontSize: 12, background: "none", border: "2px solid var(--jona)", borderRadius: 9, cursor: "pointer", color: "var(--jona)", fontFamily: "var(--font-body)", fontWeight: 700, padding: "9px 0" }}>
                💾 Guardar {COP(priceForCalc)} como precio base
              </button>
            )}
          </div>

          {/* Últimas compras */}
          {lastCompras.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 5 }}>Últimas compras</div>
              {lastCompras.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>
                  <span>{c.date} · {c.qty} {c.unit} a {COP(c.pricePer)} · {c.supermarket}</span>
                  <span style={{ fontWeight: 600, color: "var(--text1)" }}>{COP(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Modo edición */
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 12 }}>Editando producto</div>
          <Field label="Nombre" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} type="text" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Precio" value={editForm.pricePer} onChange={(v) => setEditForm({ ...editForm, pricePer: v })} />
            <div>
              <Label>Unidad</Label>
              <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", marginBottom: 14 }}>
                {UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Label>Categoría</Label>
            <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
              {ALL_CATS.filter((c) => c !== "Todas").map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Label>Supermercado</Label>
            <select value={editForm.supermarket} onChange={(e) => setEditForm({ ...editForm, supermarket: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
              {SUPERMARKETS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={cancelEdit} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn variant="primary" onClick={saveEdit} style={{ flex: 1 }}>Guardar cambios</Btn>
          </div>
        </div>
      )}
    </Card>
  );
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

  const updateMercado = useCallback((updated) => {
    const newData = { ...data, mercado: updated };
    setData(newData);
    saveData(newData);
  }, [data]);

  const currentMonth = data.months[data.currentKey];

  const updateMonth = useCallback((updated) => {
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
