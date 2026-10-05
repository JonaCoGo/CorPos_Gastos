import { useState, useMemo, useEffect } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Btn, Field, Modal, Label, PaymentChips } from '../../components/ui';
import { UNITS } from '../../constants';
import { COP, parseFlexibleNumber, convertQty, comprasDelMes } from '../../utils/finanzas';
import { Mercado, Compra } from '../../types/models';
import { Pagador, useMercadoConfig } from './useMercadoConfig';
import { useAppStore } from '../../store/useAppStore';
import { etiquetaMes, sectionTitleStyle } from './componentes';

interface VistaHistorialProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
  monthKey: string;
}

export function VistaHistorial({ mercado, onUpdate, monthKey }: VistaHistorialProps) {
  const { names, paymentMethods, supermarkets, methodsFor } = useMercadoConfig();
  const items   = mercado?.items   || [];
  const compras = mercado?.compras || [];
  const months = useAppStore((s) => s.data.months);

  const [mesVisto, setMesVisto] = useState(monthKey);
  useEffect(() => { setMesVisto(monthKey); }, [monthKey]);
  const comprasMes = useMemo(() => comprasDelMes(compras, mesVisto), [compras, mesVisto]);
  // Meses con compras o creados en la app, del más reciente al más viejo
  const mesesDisponibles = useMemo(
    () => Array.from(new Set([...Object.keys(months), ...compras.map((c) => c.monthKey), monthKey, mesVisto])).filter(Boolean).sort().reverse(),
    [months, compras, monthKey, mesVisto]
  );

  const [confirmDelCompra,  setConfirmDelCompra]  = useState<Compra | null>(null);
  const [confirmDelTrip,    setConfirmDelTrip]    = useState<string | null>(null);
  const [expandedTrip,      setExpandedTrip]      = useState<string | null>(null);
  const [editingTrip,       setEditingTrip]       = useState<string | null>(null);
  const [editTripForm,      setEditTripForm]      = useState<{ paidBy: Pagador; paymentMethodId: string; supermarket: string; monthKey: string }>({ paidBy: 'conjunto', paymentMethodId: "", supermarket: supermarkets[0], monthKey });
  const [editingCompra,     setEditingCompra]     = useState<Compra | null>(null);
  const [editCompraForm,    setEditCompraForm]    = useState<{ qty: string; pricePer: string; unit: string; supermarket: string; paidBy: Pagador; paymentMethodId: string }>({ qty: "1", pricePer: "0", unit: "und", supermarket: supermarkets[0], paidBy: 'conjunto', paymentMethodId: "" });

  const totalCompras = useMemo(() => comprasMes.reduce((s, c) => s + c.total, 0), [comprasMes]);

  const trips = useMemo(() => {
    const map = new Map<string, { key: string; date: string; supermarket: string; items: Compra[]; total: number }>();
    comprasMes.forEach((c) => {
      const key = `${c.date}__${c.supermarket}`;
      if (!map.has(key)) map.set(key, { key, date: c.date, supermarket: c.supermarket, items: [], total: 0 });
      const t = map.get(key)!;
      t.items.push(c); t.total += c.total;
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [comprasMes]);

  const openEditCompra = (c: Compra) => {
    setEditingCompra(c);
    setEditCompraForm({ qty: String(c.qty), pricePer: String(c.pricePer), unit: c.unit, supermarket: c.supermarket, paidBy: c.paidBy ?? 'conjunto', paymentMethodId: c.paymentMethodId ?? "" });
  };

  const saveEditCompra = () => {
    if (!editingCompra) return;
    const item = items.find((i) => i.id === editingCompra.itemId);
    const targetUnit = item?.unit ?? editCompraForm.unit;
    const rawQty = parseFlexibleNumber(editCompraForm.qty) || 1;
    const qty = convertQty(rawQty, editCompraForm.unit, targetUnit);
    const pricePer = parseFlexibleNumber(editCompraForm.pricePer) || editingCompra.pricePer;
    const total = qty * pricePer;
    const paidBy = editCompraForm.paidBy;
    const updated: Compra = {
      ...editingCompra,
      qty, pricePer, total,
      unit: targetUnit,
      supermarket: editCompraForm.supermarket,
      paidBy,
      marcelaAmount:  paidBy === 'marcela'  ? total : 0,
      jonatanAmount:  paidBy === 'jonatan'  ? total : 0,
      conjuntoAmount: paidBy === 'conjunto' ? total : 0,
      paymentMethodId: editCompraForm.paymentMethodId || undefined,
    };
    onUpdate({ ...mercado, compras: compras.map((c) => c.id === editingCompra.id ? updated : c) });
    setEditingCompra(null);
  };

  const tripAEditar = trips.find((t) => t.key === editingTrip);
  const tripABorrar = trips.find((t) => t.key === confirmDelTrip);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={sectionTitleStyle}>
          {trips.length} viaje{trips.length !== 1 ? "s" : ""} · {COP(totalCompras)}
        </div>
        <select value={mesVisto} onChange={(e) => { setMesVisto(e.target.value); setExpandedTrip(null); }} aria-label="Mes del historial"
          style={{ padding: "7px 10px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)" }}>
          {mesesDisponibles.map((k) => <option key={k} value={k}>{etiquetaMes(k)}{k === monthKey ? " (activo)" : ""}</option>)}
        </select>
      </div>
      {trips.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🧾</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin compras aún</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>No hay viajes registrados en {etiquetaMes(mesVisto)}.</div>
        </Card>
      ) : (
        trips.map((trip) => {
          const isOpen = expandedTrip === trip.key;
          return (
            <Card key={trip.key} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => setExpandedTrip(isOpen ? null : trip.key)}
                  style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-body)", textAlign: "left" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🛒</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)" }}>{trip.supermarket}</span>
                      <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface2)", borderRadius: 99, padding: "2px 8px" }}>
                        {trip.items.length} producto{trip.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 3 }}>{trip.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{COP(trip.total)}</span>
                    {isOpen ? <ChevronUp size={16} color="var(--text2)" /> : <ChevronDown size={16} color="var(--text2)" />}
                  </div>
                </button>
                <button onClick={() => {
                  const first = trip.items[0];
                  setEditingTrip(trip.key);
                  setEditTripForm({ paidBy: first?.paidBy ?? 'conjunto', paymentMethodId: first?.paymentMethodId ?? "", supermarket: trip.supermarket, monthKey: mesVisto });
                }} aria-label="Editar viaje"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: "14px 6px 14px 0", display: "flex", alignItems: "center" }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => setConfirmDelTrip(trip.key)} aria-label="Eliminar viaje"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "14px 14px 14px 0", display: "flex", alignItems: "center" }}>
                  <Trash2 size={16} />
                </button>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {trip.items.map((c, idx) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderBottom: idx < trip.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.itemName}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
                          {c.qty} {c.unit} · {COP(c.pricePer)}/{c.unit}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{COP(c.total)}</span>
                        <button onClick={() => openEditCompra(c)} aria-label="Editar compra"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", display: "flex", padding: 4 }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setConfirmDelCompra(c)} aria-label="Eliminar"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: 4 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Modal: eliminar viaje */}
      <Modal open={!!confirmDelTrip} onClose={() => setConfirmDelTrip(null)} title="¿Eliminar viaje completo?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{tripABorrar?.items.length} producto{tripABorrar?.items.length !== 1 ? "s" : ""}</strong> del viaje a <strong>{tripABorrar?.supermarket}</strong> del {tripABorrar?.date}.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDelTrip(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => {
            const ids = new Set(tripABorrar?.items.map((c) => c.id));
            onUpdate({ ...mercado, compras: compras.filter((c) => !ids.has(c.id)) });
            setConfirmDelTrip(null);
            if (expandedTrip === confirmDelTrip) setExpandedTrip(null);
          }} style={{ flex: 1 }}>Eliminar viaje</Btn>
        </div>
      </Modal>

      {/* Modal: editar viaje completo (pagador + supermercado) */}
      <Modal open={!!editingTrip} onClose={() => setEditingTrip(null)} title={tripAEditar ? `Editar · ${tripAEditar.supermarket} ${tripAEditar.date}` : ""}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>Mes al que pertenece</div>
          <select value={editTripForm.monthKey} onChange={(e) => setEditTripForm((f) => ({ ...f, monthKey: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {mesesDisponibles.map((k) => <option key={k} value={k}>{etiquetaMes(k)}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>Supermercado</div>
          <select value={editTripForm.supermarket} onChange={(e) => setEditTripForm((f) => ({ ...f, supermarket: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {supermarkets.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>¿Quién pagó?</div>
          <div style={{ display: "flex", gap: 6 }}>
            {([{ id: 'marcela', label: names.marcela }, { id: 'jonatan', label: names.jonatan }, { id: 'conjunto', label: 'Los dos' }] as const).map((p) => (
              <button key={p.id} onClick={() => setEditTripForm((f) => ({ ...f, paidBy: p.id, paymentMethodId: "" }))} style={{
                flex: 1, padding: "9px 4px", borderRadius: 10, border: "2px solid",
                borderColor: editTripForm.paidBy === p.id ? "var(--accent)" : "var(--border)",
                background: editTripForm.paidBy === p.id ? "var(--accent)" : "var(--surface2)",
                color: editTripForm.paidBy === p.id ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
        {paymentMethods.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>Medio de pago (aplica a todos los ítems del viaje)</div>
            <PaymentChips methods={methodsFor(editTripForm.paidBy)} selectedId={editTripForm.paymentMethodId || undefined} onChange={(id) => setEditTripForm((f) => ({ ...f, paymentMethodId: id ?? "" }))} ownerNames={names} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" onClick={() => setEditingTrip(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={() => {
            if (!tripAEditar) return;
            const paidBy = editTripForm.paidBy;
            const pmId = editTripForm.paymentMethodId || undefined;
            const newSupermarket = editTripForm.supermarket;
            const tripIds = new Set(tripAEditar.items.map((c) => c.id));
            const updated = compras.map((c) => {
              if (!tripIds.has(c.id)) return c;
              return { ...c, paidBy, marcelaAmount: paidBy === 'marcela' ? c.total : 0, jonatanAmount: paidBy === 'jonatan' ? c.total : 0, conjuntoAmount: paidBy === 'conjunto' ? c.total : 0, paymentMethodId: pmId, supermarket: newSupermarket, monthKey: editTripForm.monthKey };
            });
            onUpdate({ ...mercado, compras: updated });
            setEditingTrip(null);
          }} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Modal: editar compra individual */}
      <Modal open={!!editingCompra} onClose={() => setEditingCompra(null)} title={`Editar · ${editingCompra?.itemName ?? ""}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Field label="Cantidad" value={editCompraForm.qty} onChange={(v) => setEditCompraForm((f) => ({ ...f, qty: v }))} />
          <Field label="Precio unitario" value={editCompraForm.pricePer} onChange={(v) => setEditCompraForm((f) => ({ ...f, pricePer: v }))} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Unidad</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {UNITS.map((u) => (
              <button key={u.id} onClick={() => setEditCompraForm((f) => ({ ...f, unit: u.id }))} style={{
                padding: "6px 12px", borderRadius: 8, border: "2px solid",
                borderColor: editCompraForm.unit === u.id ? "var(--accent)" : "var(--border)",
                background: editCompraForm.unit === u.id ? "var(--accent)" : "var(--surface2)",
                color: editCompraForm.unit === u.id ? "#fff" : "var(--text2)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              }}>{u.id}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Supermercado</Label>
          <select value={editCompraForm.supermarket} onChange={(e) => setEditCompraForm((f) => ({ ...f, supermarket: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            {supermarkets.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>¿Quién pagó?</Label>
          <div style={{ display: "flex", gap: 6 }}>
            {([{ id: 'marcela', label: names.marcela }, { id: 'jonatan', label: names.jonatan }, { id: 'conjunto', label: 'Los dos' }] as const).map((p) => (
              <button key={p.id} onClick={() => setEditCompraForm((f) => ({ ...f, paidBy: p.id, paymentMethodId: "" }))} style={{
                flex: 1, padding: "9px 4px", borderRadius: 10, border: "2px solid",
                borderColor: editCompraForm.paidBy === p.id ? "var(--accent)" : "var(--border)",
                background: editCompraForm.paidBy === p.id ? "var(--accent)" : "var(--surface2)",
                color: editCompraForm.paidBy === p.id ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
        {paymentMethods.length > 0 && (
          <PaymentChips
            methods={methodsFor(editCompraForm.paidBy)}
            selectedId={editCompraForm.paymentMethodId || undefined}
            onChange={(id) => setEditCompraForm((f) => ({ ...f, paymentMethodId: id ?? "" }))}
            ownerNames={names}
            label="Medio de pago (opcional)"
          />
        )}
        {editingCompra && (() => {
          const item = items.find((i) => i.id === editingCompra.itemId);
          const targetUnit = item?.unit ?? editCompraForm.unit;
          const qty = convertQty(parseFlexibleNumber(editCompraForm.qty) || 0, editCompraForm.unit, targetUnit);
          const pricePer = parseFlexibleNumber(editCompraForm.pricePer) || 0;
          return (
            <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Total estimado</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                {COP(qty * pricePer)}
              </div>
            </div>
          );
        })()}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setEditingCompra(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEditCompra} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </Modal>

      {/* Modal: eliminar compra individual */}
      <Modal open={!!confirmDelCompra} onClose={() => setConfirmDelCompra(null)} title="¿Eliminar compra?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar la compra de <strong>{confirmDelCompra?.itemName}</strong> del {confirmDelCompra?.date}.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDelCompra(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => {
            onUpdate({ ...mercado, compras: compras.filter((x) => x.id !== confirmDelCompra!.id) });
            setConfirmDelCompra(null);
          }} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </>
  );
}
