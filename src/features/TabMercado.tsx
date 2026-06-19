import { useState, useMemo } from "react";
import { ShoppingCart, Pencil, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Card, Btn, Field, Modal, Label, PaymentChips } from '../components/ui';
import { SUPERMARKETS, UNITS, ALL_CATS } from '../constants';
import { COP } from '../utils/finanzas';
import { Mercado, ItemMercado, Compra } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabMercadoProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
}

// ── Cart item: qué tiene seleccionado el usuario en este viaje ────────────────
interface CartEntry {
  itemId: string;
  qty: string;
  pricePer: string;
  unit: string;
  paidBy: 'marcela' | 'jonatan' | 'conjunto';
}

export function TabMercado({ mercado, onUpdate }: TabMercadoProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };
  const paymentMethods = config?.paymentMethods ?? [];

  const items   = mercado?.items   || [];
  const compras = mercado?.compras || [];

  const [view, setView] = useState<"hacer" | "historial" | "productos">("hacer");

  // ── Estado vista "hacer mercado" ────────────────────────────────────────────
  const [supermarket,   setSupermarket]   = useState(SUPERMARKETS[0]);
  const [paymentId,     setPaymentId]     = useState<string>("");
  const [tripPaidBy,    setTripPaidBy]    = useState<'marcela' | 'jonatan' | 'conjunto'>('conjunto');
  const [cart,          setCart]          = useState<Record<string, CartEntry>>({});
  const [expandedItem,  setExpandedItem]  = useState<string | null>(null);
  const [filterCatH,    setFilterCatH]    = useState("Todas");
  const [searchH,       setSearchH]       = useState("");

  // ── Estado vista "historial" ────────────────────────────────────────────────
  const [confirmDelCompra, setConfirmDelCompra] = useState<Compra | null>(null);
  const [confirmDelTrip,  setConfirmDelTrip]  = useState<string | null>(null);
  const [expandedTrip,    setExpandedTrip]    = useState<string | null>(null);
  const [editingTrip,     setEditingTrip]     = useState<string | null>(null);
  const [editTripForm,    setEditTripForm]    = useState<{ paidBy: 'marcela' | 'jonatan' | 'conjunto'; paymentMethodId: string }>({ paidBy: 'conjunto', paymentMethodId: "" });

  // ── Estado vista "productos" ────────────────────────────────────────────────
  const [filterCat,  setFilterCat]  = useState("Todas");
  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [confirmDel, setConfirmDel] = useState<ItemMercado | null>(null);
  const [addForm, setAddForm] = useState({ name: "", pricePer: "", unit: "und", supermarket: "D1", category: "Despensa" });

  // ── Helpers carrito ─────────────────────────────────────────────────────────
  const inCart = (id: string) => !!cart[id];

  const setTripPayer = (payer: 'marcela' | 'jonatan' | 'conjunto') => {
    setTripPaidBy(payer);
    setCart((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], paidBy: payer }; });
      return next;
    });
  };

  const toggleCart = (item: ItemMercado) => {
    if (inCart(item.id)) {
      const next = { ...cart };
      delete next[item.id];
      setCart(next);
      if (expandedItem === item.id) setExpandedItem(null);
    } else {
      setCart({ ...cart, [item.id]: { itemId: item.id, qty: "1", pricePer: String(item.pricePer), unit: item.unit, paidBy: tripPaidBy } });
      setExpandedItem(item.id);
    }
  };

  const updateCartEntry = (id: string, changes: Partial<CartEntry>) => {
    setCart((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }));
  };

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((s, e) => {
      const qty = Number(e.qty) || 0;
      const price = Number(e.pricePer) || 0;
      return s + qty * price;
    }, 0);
  }, [cart]);

  const cartCount = Object.keys(cart).length;

  const registrarViaje = () => {
    if (cartCount === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const nuevasCompras: Compra[] = Object.values(cart).map((e) => {
      const item = items.find((i) => i.id === e.itemId)!;
      const qty = Number(e.qty) || 1;
      const pricePer = Number(e.pricePer) || item.pricePer;
      const unit = e.unit || item.unit;
      const total = qty * pricePer;
      const paidBy = e.paidBy || 'conjunto';
      return {
        id: `compra_${Date.now()}_${e.itemId}`,
        itemId: item.id,
        itemName: item.name,
        qty,
        unit,
        pricePer,
        total,
        supermarket,
        date: today,
        notes: "",
        marcelaAmount:  paidBy === 'marcela'  ? total : 0,
        jonatanAmount:  paidBy === 'jonatan'  ? total : 0,
        conjuntoAmount: paidBy === 'conjunto' ? total : 0,
        paidBy,
        paymentMethodId: paymentId || undefined,
      };
    });
    // Actualizar precios base si cambiaron
    const updatedItems = items.map((item) => {
      const e = cart[item.id];
      if (e && Number(e.pricePer) && Number(e.pricePer) !== item.pricePer) {
        return { ...item, pricePer: Number(e.pricePer) };
      }
      return item;
    });
    onUpdate({ ...mercado, items: updatedItems, compras: [...nuevasCompras, ...compras] });
    setCart({});
    setExpandedItem(null);
    setView("historial");
  };

  // ── Productos filtrados para "hacer mercado" ─────────────────────────────────
  const itemsHacer = useMemo(() => {
    return items.filter((i) => {
      const matchCat  = filterCatH === "Todas" || i.category === filterCatH;
      const matchText = i.name.toLowerCase().includes(searchH.toLowerCase());
      return matchCat && matchText;
    });
  }, [items, filterCatH, searchH]);

  // ── Productos filtrados para "lista/productos" ───────────────────────────────
  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchCat  = filterCat === "Todas" || i.category === filterCat;
      const matchText = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchText;
    });
  }, [items, filterCat, search]);

  const totalCompras = useMemo(() => compras.reduce((s, c) => s + c.total, 0), [compras]);

  // Agrupar compras por viaje (fecha + supermercado)
  const trips = useMemo(() => {
    const map = new Map<string, { key: string; date: string; supermarket: string; items: Compra[]; total: number }>();
    compras.forEach((c) => {
      const key = `${c.date}__${c.supermarket}`;
      if (!map.has(key)) map.set(key, { key, date: c.date, supermarket: c.supermarket, items: [], total: 0 });
      const t = map.get(key)!;
      t.items.push(c);
      t.total += c.total;
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [compras]);

  // ── Productos: guardar nuevo ─────────────────────────────────────────────────
  const saveItem = () => {
    if (!addForm.name || !addForm.pricePer) return;
    const newItem: ItemMercado = {
      id: `item_${Date.now()}`,
      name: addForm.name,
      pricePer: Number(addForm.pricePer),
      unit: addForm.unit,
      supermarket: addForm.supermarket,
      category: addForm.category,
    };
    onUpdate({ ...mercado, items: [...items, newItem] });
    setShowAdd(false);
    setAddForm({ name: "", pricePer: "", unit: "und", supermarket: "D1", category: "Despensa" });
  };

  const deleteItem = (id: string) => {
    onUpdate({ ...mercado, items: items.filter((i) => i.id !== id), compras: compras.filter((c) => c.itemId !== id) });
    setConfirmDel(null);
  };

  const updateItem = (id: string, changes: Partial<ItemMercado>) => {
    onUpdate({ ...mercado, items: items.map((i) => i.id === id ? { ...i, ...changes } : i) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toggle de vistas */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 12, padding: 4, gap: 4 }}>
        {[
          { id: "hacer",     label: "🛒 Hacer mercado" },
          { id: "historial", label: "🧾 Historial" },
          { id: "productos", label: "🧺 Productos" },
        ].map((v) => (
          <button key={v.id} onClick={() => setView(v.id as typeof view)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer",
            background: view === v.id ? "var(--surface)" : "transparent",
            color: view === v.id ? "var(--text1)" : "var(--text2)",
            fontWeight: view === v.id ? 700 : 500, fontSize: 11, fontFamily: "var(--font-body)",
            boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s",
          }}>{v.label}</button>
        ))}
      </div>

      {/* ── HACER MERCADO ─────────────────────────────────────────────────── */}
      {view === "hacer" && (
        <>
          {/* Supermercado */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>
              ¿Dónde vas hoy?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SUPERMARKETS.map((s) => (
                <button key={s} onClick={() => setSupermarket(s)} style={{
                  padding: "8px 14px", borderRadius: 99, border: "2px solid",
                  borderColor: supermarket === s ? "var(--accent)" : "var(--border)",
                  background: supermarket === s ? "var(--accent)" : "var(--surface2)",
                  color: supermarket === s ? "#fff" : "var(--text2)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                }}>{s}</button>
              ))}
            </div>
          </Card>

          {/* Quién paga este viaje */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>
              ¿Quién paga?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { id: 'marcela',  label: names.marcela },
                { id: 'jonatan',  label: names.jonatan },
                { id: 'conjunto', label: 'Los dos' },
              ] as const).map((p) => (
                <button key={p.id} onClick={() => setTripPayer(p.id)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, border: "2px solid",
                  borderColor: tripPaidBy === p.id ? "var(--accent)" : "var(--border)",
                  background: tripPaidBy === p.id ? "var(--accent)" : "var(--surface2)",
                  color: tripPaidBy === p.id ? "#fff" : "var(--text2)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                }}>{p.label}</button>
              ))}
            </div>
          </Card>

          {/* Medio de pago */}
          {paymentMethods.length > 0 && (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>
                ¿Con qué se paga?
              </div>
              <PaymentChips
                methods={paymentMethods}
                selectedId={paymentId || undefined}
                onChange={(id) => setPaymentId(id ?? "")}
                ownerNames={names}
              />
            </Card>
          )}

          {/* Búsqueda + categorías */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="🔍 Buscar producto..."
              value={searchH} onChange={(e) => setSearchH(e.target.value)}
              style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ALL_CATS.map((cat) => (
              <button key={cat} onClick={() => setFilterCatH(cat)} style={{
                whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                background: filterCatH === cat ? "var(--accent)" : "var(--surface2)",
                color: filterCatH === cat ? "#fff" : "var(--text2)",
              }}>{cat}</button>
            ))}
          </div>

          {/* Lista de productos */}
          {items.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧺</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin productos</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>Agrega productos en la pestaña Productos para empezar.</div>
              <Btn variant="secondary" onClick={() => setView("productos")}>Ir a Productos</Btn>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {itemsHacer.map((item) => {
                const checked = inCart(item.id);
                const entry = cart[item.id];
                const isExpanded = expandedItem === item.id;
                const pricePer = checked ? (Number(entry.pricePer) || item.pricePer) : item.pricePer;
                const unit = checked ? (entry.unit || item.unit) : item.unit;
                const qty = checked ? (Number(entry.qty) || 1) : 1;
                const total = checked ? pricePer * qty : null;
                const priceChanged = checked && Number(entry.pricePer) > 0 && Number(entry.pricePer) !== item.pricePer;

                return (
                  <div key={item.id} style={{
                    background: "var(--surface)", borderRadius: 14,
                    border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                    overflow: "hidden", transition: "border-color 0.15s",
                  }}>
                    {/* Fila principal */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleCart(item)}
                        aria-label={checked ? "Quitar del carrito" : "Agregar al carrito"}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", border: "2px solid",
                          borderColor: checked ? "var(--accent)" : "var(--border)",
                          background: checked ? "var(--accent)" : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 0.15s",
                        }}>
                        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
                      </button>

                      {/* Nombre + info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: checked ? 700 : 500, color: checked ? "var(--text1)" : "var(--text2)" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
                          {item.category} · {COP(item.pricePer)}/{item.unit}
                        </div>
                      </div>

                      {/* Total o precio */}
                      {checked && total !== null ? (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{COP(total)}</div>
                          <div style={{ fontSize: 10, color: "var(--text2)" }}>{qty} {unit}</div>
                        </div>
                      ) : null}

                      {/* Expandir/colapsar (solo si está en carrito) */}
                      {checked && (
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: 4, display: "flex", flexShrink: 0 }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>

                    {/* Panel expandido: editar qty, precio y unidad */}
                    {checked && isExpanded && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", background: "var(--surface2)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 6 }}>Cantidad</div>
                            <input
                              type="number"
                              value={entry.qty}
                              onChange={(e) => updateCartEntry(item.id, { qty: e.target.value })}
                              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, fontSize: 16, fontWeight: 700, textAlign: "right", border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontFamily: "var(--font-body)", outline: "none" }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: priceChanged ? "var(--jona)" : "var(--text2)", marginBottom: 6 }}>
                              Precio hoy {priceChanged ? "↑" : ""}
                            </div>
                            <input
                              type="number"
                              value={entry.pricePer}
                              onChange={(e) => updateCartEntry(item.id, { pricePer: e.target.value })}
                              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, fontSize: 16, fontWeight: 700, textAlign: "right", border: `2px solid ${priceChanged ? "var(--jona)" : "var(--border)"}`, background: priceChanged ? "#fff7f0" : "var(--surface)", color: priceChanged ? "var(--jona)" : "var(--text1)", fontFamily: "var(--font-body)", outline: "none" }}
                            />
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 6 }}>Unidad</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {UNITS.map((u) => (
                              <button key={u.id} onClick={() => updateCartEntry(item.id, { unit: u.id })} style={{
                                padding: "6px 12px", borderRadius: 8, border: "2px solid",
                                borderColor: unit === u.id ? "var(--accent)" : "var(--border)",
                                background: unit === u.id ? "var(--accent)" : "var(--surface)",
                                color: unit === u.id ? "#fff" : "var(--text2)",
                                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                              }}>{u.id}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 6 }}>¿Quién paga?</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {([
                              { id: 'marcela',  label: names.marcela },
                              { id: 'jonatan',  label: names.jonatan },
                              { id: 'conjunto', label: 'Los dos' },
                            ] as const).map((p) => (
                              <button key={p.id} onClick={() => updateCartEntry(item.id, { paidBy: p.id })} style={{
                                flex: 1, padding: "7px 4px", borderRadius: 8, border: "2px solid",
                                borderColor: entry.paidBy === p.id ? "var(--accent)" : "var(--border)",
                                background: entry.paidBy === p.id ? "var(--accent)" : "var(--surface)",
                                color: entry.paidBy === p.id ? "#fff" : "var(--text2)",
                                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                              }}>{p.label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Barra inferior de carrito */}
          {cartCount > 0 && (
            <div style={{ position: "sticky", bottom: 12, zIndex: 10 }}>
              <div style={{ background: "var(--accent)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                    {cartCount} producto{cartCount !== 1 ? "s" : ""} · {supermarket}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                    {COP(cartTotal)}
                  </div>
                </div>
                <button onClick={registrarViaje} style={{
                  background: "#fff", color: "var(--accent)", border: "none", borderRadius: 12,
                  padding: "10px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <ShoppingCart size={16} /> Registrar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORIAL ─────────────────────────────────────────────────────── */}
      {view === "historial" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
            {trips.length} viaje{trips.length !== 1 ? "s" : ""} · {COP(totalCompras)}
          </div>
          {trips.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧾</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin compras aún</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Registra un viaje al mercado.</div>
            </Card>
          ) : (
            trips.map((trip) => {
              const isOpen = expandedTrip === trip.key;
              return (
                <Card key={trip.key} style={{ padding: 0, overflow: "hidden" }}>
                  {/* Cabecera del viaje */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => setExpandedTrip(isOpen ? null : trip.key)}
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
                      setEditTripForm({ paidBy: first?.paidBy ?? 'conjunto', paymentMethodId: first?.paymentMethodId ?? "" });
                    }} aria-label="Editar viaje"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: "14px 6px 14px 0", display: "flex", alignItems: "center" }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmDelTrip(trip.key)} aria-label="Eliminar viaje completo"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "14px 14px 14px 0", display: "flex", alignItems: "center" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Detalle expandido */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {trip.items.map((c, idx) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderBottom: idx < trip.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.itemName}</div>
                            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
                              {c.qty} {c.unit} · {COP(c.pricePer)}/{c.unit}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{COP(c.total)}</span>
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
        </>
      )}

      {/* ── PRODUCTOS ─────────────────────────────────────────────────────── */}
      {view === "productos" && (
        <>
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
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ALL_CATS.map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{
                whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                background: filterCat === cat ? "var(--accent)" : "var(--surface2)",
                color: filterCat === cat ? "#fff" : "var(--text2)",
              }}>{cat}</button>
            ))}
          </div>
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
              <ProductCard
                key={item.id} item={item}
                onUpdate={(changes) => updateItem(item.id, changes)}
                onDelete={() => setConfirmDel(item)}
              />
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

      {/* Modal: confirmar eliminar producto */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar producto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.name}</strong>. También se eliminarán sus compras del historial.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteItem(confirmDel!.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>

      {/* Modal: confirmar eliminar viaje completo */}
      <Modal open={!!confirmDelTrip} onClose={() => setConfirmDelTrip(null)} title="¿Eliminar viaje completo?">
        {(() => {
          const trip = trips.find((t) => t.key === confirmDelTrip);
          return (
            <>
              <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
                Vas a eliminar <strong>{trip?.items.length} producto{trip?.items.length !== 1 ? "s" : ""}</strong> del viaje a <strong>{trip?.supermarket}</strong> del {trip?.date}. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="secondary" onClick={() => setConfirmDelTrip(null)} style={{ flex: 1 }}>Cancelar</Btn>
                <Btn variant="danger" onClick={() => {
                  const ids = new Set(trip?.items.map((c) => c.id));
                  onUpdate({ ...mercado, compras: compras.filter((c) => !ids.has(c.id)) });
                  setConfirmDelTrip(null);
                  if (expandedTrip === confirmDelTrip) setExpandedTrip(null);
                }} style={{ flex: 1 }}>Eliminar viaje</Btn>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Modal: editar pagador y medio de pago del viaje completo */}
      {(() => {
        const trip = trips.find((t) => t.key === editingTrip);
        return (
          <Modal open={!!editingTrip} onClose={() => setEditingTrip(null)} title={trip ? `Editar · ${trip.supermarket} ${trip.date}` : ""}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>¿Quién pagó?</div>
              <div style={{ display: "flex", gap: 6 }}>
                {([
                  { id: 'marcela',  label: names.marcela },
                  { id: 'jonatan',  label: names.jonatan },
                  { id: 'conjunto', label: 'Los dos' },
                ] as const).map((p) => (
                  <button key={p.id} onClick={() => setEditTripForm((f) => ({ ...f, paidBy: p.id }))} style={{
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
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>Medio de pago</div>
                <PaymentChips
                  methods={paymentMethods}
                  selectedId={editTripForm.paymentMethodId || undefined}
                  onChange={(id) => setEditTripForm((f) => ({ ...f, paymentMethodId: id ?? "" }))}
                  ownerNames={names}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn variant="secondary" onClick={() => setEditingTrip(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="primary" onClick={() => {
                if (!trip) return;
                const paidBy = editTripForm.paidBy;
                const pmId = editTripForm.paymentMethodId || undefined;
                const tripIds = new Set(trip.items.map((c) => c.id));
                const updated = compras.map((c) => {
                  if (!tripIds.has(c.id)) return c;
                  return {
                    ...c, paidBy,
                    marcelaAmount:  paidBy === 'marcela'  ? c.total : 0,
                    jonatanAmount:  paidBy === 'jonatan'  ? c.total : 0,
                    conjuntoAmount: paidBy === 'conjunto' ? c.total : 0,
                    paymentMethodId: pmId,
                  };
                });
                onUpdate({ ...mercado, compras: updated });
                setEditingTrip(null);
              }} style={{ flex: 1 }}>Guardar</Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Modal: confirmar eliminar compra */}
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
    </div>
  );
}

// ── ProductCard: edición del catálogo (sin calculadora) ───────────────────────
function ProductCard({ item, onUpdate, onDelete }: { item: ItemMercado; onUpdate: (c: Partial<ItemMercado>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: item.name, pricePer: String(item.pricePer), unit: item.unit, supermarket: item.supermarket, category: item.category });

  const saveEdit = () => {
    onUpdate({ name: editForm.name, pricePer: Number(editForm.pricePer) || item.pricePer, unit: editForm.unit, supermarket: editForm.supermarket, category: editForm.category });
    setEditing(false);
  };

  if (editing) {
    return (
      <Card style={{ padding: "14px 16px" }}>
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
          <Btn variant="secondary" onClick={() => { setEditForm({ name: item.name, pricePer: String(item.pricePer), unit: item.unit, supermarket: item.supermarket, category: item.category }); setEditing(false); }} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEdit} style={{ flex: 1 }}>Guardar cambios</Btn>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{item.category} · {item.supermarket} · {COP(item.pricePer)}/{item.unit}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setEditing(true)} aria-label="Editar"
            style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "var(--text2)", display: "flex", alignItems: "center" }}>
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} aria-label="Eliminar"
            style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "var(--text2)", display: "flex", alignItems: "center" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}
