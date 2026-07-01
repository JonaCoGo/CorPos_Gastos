import { useState, useMemo } from "react";
import { ShoppingCart, Pencil, Trash2, ChevronDown, ChevronUp, Check, ClipboardList } from 'lucide-react';
import { Card, Btn, Field, Modal, Label, PaymentChips } from '../components/ui';
import { SUPERMARKETS, UNITS, ALL_CATS } from '../constants';
import { COP } from '../utils/finanzas';
import { Mercado, ItemMercado, Compra, ListaItem } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabMercadoProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
}

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
  const lista   = mercado?.lista   || [];

  const [view, setView] = useState<"lista" | "hacer" | "historial" | "productos">("lista");

  // ── Estado vista "lista" ────────────────────────────────────────────────────
  const [filterCatL,   setFilterCatL]   = useState("Todas");
  const [searchL,      setSearchL]      = useState("");
  const [listaSupermarket, setListaSupermarket] = useState(SUPERMARKETS[0]);

  // ── Estado vista "hacer mercado" ────────────────────────────────────────────
  const [supermarket,  setSupermarket]  = useState(SUPERMARKETS[0]);
  const [paymentId,    setPaymentId]    = useState<string>("");
  const [tripPaidBy,   setTripPaidBy]   = useState<'marcela' | 'jonatan' | 'conjunto'>('conjunto');
  const [cart,         setCart]         = useState<Record<string, CartEntry>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [filterCatH,   setFilterCatH]   = useState("Todas");
  const [searchH,      setSearchH]      = useState("");
  const [listaLoaded,  setListaLoaded]  = useState(false);

  // ── Estado vista "historial" ────────────────────────────────────────────────
  const [confirmDelCompra,  setConfirmDelCompra]  = useState<Compra | null>(null);
  const [confirmDelTrip,    setConfirmDelTrip]    = useState<string | null>(null);
  const [expandedTrip,      setExpandedTrip]      = useState<string | null>(null);
  const [editingTrip,       setEditingTrip]       = useState<string | null>(null);
  const [editTripForm,      setEditTripForm]      = useState<{ paidBy: 'marcela' | 'jonatan' | 'conjunto'; paymentMethodId: string; supermarket: string }>({ paidBy: 'conjunto', paymentMethodId: "", supermarket: SUPERMARKETS[0] });
  const [editingCompra,     setEditingCompra]     = useState<Compra | null>(null);
  const [editCompraForm,    setEditCompraForm]    = useState<{ qty: string; pricePer: string; unit: string; supermarket: string; paidBy: 'marcela' | 'jonatan' | 'conjunto' }>({ qty: "1", pricePer: "0", unit: "und", supermarket: SUPERMARKETS[0], paidBy: 'conjunto' });

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

  const cartTotal = useMemo(() => Object.values(cart).reduce((s, e) => s + (Number(e.qty) || 0) * (Number(e.pricePer) || 0), 0), [cart]);
  const cartCount = Object.keys(cart).length;

  // Cargar lista en el carrito
  const cargarLista = () => {
    if (lista.length === 0) return;
    const newCart: Record<string, CartEntry> = {};
    lista.forEach((li) => {
      newCart[li.itemId] = { itemId: li.itemId, qty: String(li.qty), pricePer: String(li.pricePer), unit: li.unit, paidBy: tripPaidBy };
    });
    setCart(newCart);
    setListaLoaded(true);
    setView("hacer");
  };

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
        itemId: item.id, itemName: item.name,
        qty, unit, pricePer, total,
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
    const updatedItems = items.map((item) => {
      const e = cart[item.id];
      if (e && Number(e.pricePer) && Number(e.pricePer) !== item.pricePer)
        return { ...item, pricePer: Number(e.pricePer) };
      return item;
    });
    onUpdate({ ...mercado, items: updatedItems, compras: [...nuevasCompras, ...compras], lista: [] });
    setCart({});
    setExpandedItem(null);
    setListaLoaded(false);
    setView("historial");
  };

  // ── Helpers lista ────────────────────────────────────────────────────────────
  const inLista = (itemId: string) => lista.some((l) => l.itemId === itemId);

  const toggleLista = (item: ItemMercado) => {
    if (inLista(item.id)) {
      onUpdate({ ...mercado, lista: lista.filter((l) => l.itemId !== item.id) });
    } else {
      const nuevo: ListaItem = {
        id: `li_${Date.now()}_${item.id}`,
        itemId: item.id, itemName: item.name,
        qty: 1, unit: item.unit,
        pricePer: item.pricePer,
        supermarket: listaSupermarket,
      };
      onUpdate({ ...mercado, lista: [...lista, nuevo] });
    }
  };

  const updateListaItem = (itemId: string, changes: Partial<ListaItem>) => {
    onUpdate({ ...mercado, lista: lista.map((l) => l.itemId === itemId ? { ...l, ...changes } : l) });
  };

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const itemsLista = useMemo(() => items.filter((i) => {
    const matchCat  = filterCatL === "Todas" || i.category === filterCatL;
    const matchText = i.name.toLowerCase().includes(searchL.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCatL, searchL]);

  const itemsHacer = useMemo(() => items.filter((i) => {
    const matchCat  = filterCatH === "Todas" || i.category === filterCatH;
    const matchText = i.name.toLowerCase().includes(searchH.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCatH, searchH]);

  const filtered = useMemo(() => items.filter((i) => {
    const matchCat  = filterCat === "Todas" || i.category === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCat, search]);

  const totalCompras = useMemo(() => compras.reduce((s, c) => s + c.total, 0), [compras]);

  const trips = useMemo(() => {
    const map = new Map<string, { key: string; date: string; supermarket: string; items: Compra[]; total: number }>();
    compras.forEach((c) => {
      const key = `${c.date}__${c.supermarket}`;
      if (!map.has(key)) map.set(key, { key, date: c.date, supermarket: c.supermarket, items: [], total: 0 });
      const t = map.get(key)!;
      t.items.push(c); t.total += c.total;
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [compras]);

  const saveItem = () => {
    if (!addForm.name || !addForm.pricePer) return;
    const newItem: ItemMercado = { id: `item_${Date.now()}`, name: addForm.name, pricePer: Number(addForm.pricePer), unit: addForm.unit, supermarket: addForm.supermarket, category: addForm.category };
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

  const openEditCompra = (c: Compra) => {
    setEditingCompra(c);
    setEditCompraForm({ qty: String(c.qty), pricePer: String(c.pricePer), unit: c.unit, supermarket: c.supermarket, paidBy: c.paidBy ?? 'conjunto' });
  };

  const saveEditCompra = () => {
    if (!editingCompra) return;
    const qty = Number(editCompraForm.qty) || 1;
    const pricePer = Number(editCompraForm.pricePer) || editingCompra.pricePer;
    const total = qty * pricePer;
    const paidBy = editCompraForm.paidBy;
    const updated: Compra = {
      ...editingCompra,
      qty, pricePer, total,
      unit: editCompraForm.unit,
      supermarket: editCompraForm.supermarket,
      paidBy,
      marcelaAmount:  paidBy === 'marcela'  ? total : 0,
      jonatanAmount:  paidBy === 'jonatan'  ? total : 0,
      conjuntoAmount: paidBy === 'conjunto' ? total : 0,
    };
    onUpdate({ ...mercado, compras: compras.map((c) => c.id === editingCompra.id ? updated : c) });
    setEditingCompra(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toggle de vistas */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 12, padding: 4, gap: 4 }}>
        {[
          { id: "lista",     label: "📋 Lista" },
          { id: "hacer",     label: "🛒 Hacer" },
          { id: "historial", label: "🧾 Historial" },
          { id: "productos", label: "🧺 Items" },
        ].map((v) => (
          <button key={v.id} onClick={() => setView(v.id as typeof view)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer",
            background: view === v.id ? "var(--surface)" : "transparent",
            color: view === v.id ? "var(--text1)" : "var(--text2)",
            fontWeight: view === v.id ? 700 : 500, fontSize: 10, fontFamily: "var(--font-body)",
            boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s",
            position: "relative",
          }}>
            {v.label}
            {v.id === "lista" && lista.length > 0 && (
              <span style={{ position: "absolute", top: 2, right: 4, background: "var(--accent)", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 900, padding: "1px 5px", lineHeight: 1.4 }}>
                {lista.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === "lista" && (
        <>
          {/* Supermercado de la lista */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>
              ¿Dónde van a comprar?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SUPERMARKETS.map((s) => (
                <button key={s} onClick={() => setListaSupermarket(s)} style={{
                  padding: "8px 14px", borderRadius: 99, border: "2px solid",
                  borderColor: listaSupermarket === s ? "var(--accent)" : "var(--border)",
                  background: listaSupermarket === s ? "var(--accent)" : "var(--surface2)",
                  color: listaSupermarket === s ? "#fff" : "var(--text2)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                }}>{s}</button>
              ))}
            </div>
          </Card>

          {/* Items en la lista actual */}
          {lista.length > 0 && (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>
                Lista actual · {lista.length} producto{lista.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lista.map((li) => (
                  <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{li.itemName}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{COP(li.pricePer)}/{li.unit} · {li.supermarket}</div>
                    </div>
                    <input
                      type="number"
                      value={li.qty}
                      onChange={(e) => updateListaItem(li.itemId, { qty: Number(e.target.value) || 1 })}
                      style={{ width: 56, padding: "6px 8px", borderRadius: 8, border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontWeight: 700, textAlign: "right", fontFamily: "var(--font-body)", outline: "none" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text2)", minWidth: 20 }}>{li.unit}</span>
                    <button onClick={() => onUpdate({ ...mercado, lista: lista.filter((l) => l.itemId !== li.itemId) })} aria-label="Quitar de lista"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Búsqueda + categorías */}
          <input
            placeholder="🔍 Buscar producto..."
            value={searchL} onChange={(e) => setSearchL(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ALL_CATS.map((cat) => (
              <button key={cat} onClick={() => setFilterCatL(cat)} style={{
                whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                background: filterCatL === cat ? "var(--accent)" : "var(--surface2)",
                color: filterCatL === cat ? "#fff" : "var(--text2)",
              }}>{cat}</button>
            ))}
          </div>

          {/* Catálogo para agregar a lista */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {itemsLista.map((item) => {
              const checked = inLista(item.id);
              const liItem = lista.find((l) => l.itemId === item.id);
              return (
                <div key={item.id} style={{
                  background: "var(--surface)", borderRadius: 12,
                  border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                  overflow: "hidden", transition: "border-color 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
                    <button onClick={() => toggleLista(item)} aria-label={checked ? "Quitar de lista" : "Agregar a lista"} style={{
                      width: 26, height: 26, borderRadius: "50%", border: "2px solid",
                      borderColor: checked ? "var(--accent)" : "var(--border)",
                      background: checked ? "var(--accent)" : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? "var(--text1)" : "var(--text2)" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{item.category} · {COP(item.pricePer)}/{item.unit}</div>
                    </div>
                    {checked && liItem && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number"
                          value={liItem.qty}
                          onChange={(e) => updateListaItem(item.id, { qty: Number(e.target.value) || 1 })}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 52, padding: "5px 7px", borderRadius: 8, border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontSize: 13, fontWeight: 700, textAlign: "right", fontFamily: "var(--font-body)", outline: "none" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--text2)" }}>{item.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra ir al mercado */}
          {lista.length > 0 && (
            <div style={{ position: "sticky", bottom: 12, zIndex: 10 }}>
              <button onClick={cargarLista} style={{
                width: "100%", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16,
                padding: "16px 18px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
              }}>
                <ClipboardList size={18} /> Listo, voy al mercado ({lista.length} producto{lista.length !== 1 ? "s" : ""})
              </button>
            </div>
          )}
        </>
      )}

      {/* ── HACER MERCADO ─────────────────────────────────────────────────── */}
      {view === "hacer" && (
        <>
          {/* Banner lista cargada */}
          {listaLoaded && lista.length === 0 && (
            <Card style={{ background: "rgba(79,70,229,0.07)", border: "1.5px solid var(--accent)", padding: "12px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                ✅ Lista cargada en el carrito — ajusta precios y cantidades en el mercado
              </div>
            </Card>
          )}

          {/* Banner lista pendiente */}
          {lista.length > 0 && cartCount === 0 && (
            <Card style={{ background: "rgba(79,70,229,0.07)", border: "1.5px solid var(--accent)", padding: "12px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>
                📋 Tienes una lista de {lista.length} producto{lista.length !== 1 ? "s" : ""}
              </div>
              <Btn variant="primary" onClick={cargarLista} style={{ width: "100%" }}>Cargar lista en el carrito</Btn>
            </Card>
          )}

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
                }}>{s}</button>
              ))}
            </div>
          </Card>

          {/* Quién paga */}
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
              <PaymentChips methods={paymentMethods} selectedId={paymentId || undefined} onChange={(id) => setPaymentId(id ?? "")} ownerNames={names} />
            </Card>
          )}

          {/* Búsqueda + categorías */}
          <input
            placeholder="🔍 Buscar producto..."
            value={searchH} onChange={(e) => setSearchH(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ALL_CATS.map((cat) => (
              <button key={cat} onClick={() => setFilterCatH(cat)} style={{
                whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                background: filterCatH === cat ? "var(--accent)" : "var(--surface2)",
                color: filterCatH === cat ? "#fff" : "var(--text2)",
              }}>{cat}</button>
            ))}
          </div>

          {items.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧺</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin productos</div>
              <Btn variant="secondary" onClick={() => setView("productos")}>Ir a Items</Btn>
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
                const enLista = inLista(item.id);

                return (
                  <div key={item.id} style={{
                    background: "var(--surface)", borderRadius: 14,
                    border: `2px solid ${checked ? "var(--accent)" : enLista ? "rgba(79,70,229,0.35)" : "var(--border)"}`,
                    overflow: "hidden", transition: "border-color 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                      <button onClick={() => toggleCart(item)} aria-label={checked ? "Quitar del carrito" : "Agregar"} style={{
                        width: 28, height: 28, borderRadius: "50%", border: "2px solid",
                        borderColor: checked ? "var(--accent)" : "var(--border)",
                        background: checked ? "var(--accent)" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: checked ? 700 : 500, color: checked ? "var(--text1)" : "var(--text2)" }}>
                          {item.name} {enLista && !checked ? <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>· en lista</span> : null}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{item.category} · {COP(item.pricePer)}/{item.unit}</div>
                      </div>
                      {checked && total !== null && (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{COP(total)}</div>
                          <div style={{ fontSize: 10, color: "var(--text2)" }}>{qty} {unit}</div>
                        </div>
                      )}
                      {checked && (
                        <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", padding: 4, display: "flex", flexShrink: 0 }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                    {checked && isExpanded && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", background: "var(--surface2)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 6 }}>Cantidad</div>
                            <input type="number" value={entry.qty} onChange={(e) => updateCartEntry(item.id, { qty: e.target.value })}
                              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, fontSize: 16, fontWeight: 700, textAlign: "right", border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontFamily: "var(--font-body)", outline: "none" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: priceChanged ? "var(--jona)" : "var(--text2)", marginBottom: 6 }}>
                              Precio hoy {priceChanged ? "↑" : ""}
                            </div>
                            <input type="number" value={entry.pricePer} onChange={(e) => updateCartEntry(item.id, { pricePer: e.target.value })}
                              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, fontSize: 16, fontWeight: 700, textAlign: "right", border: `2px solid ${priceChanged ? "var(--jona)" : "var(--border)"}`, background: priceChanged ? "#fff7f0" : "var(--surface)", color: priceChanged ? "var(--jona)" : "var(--text1)", fontFamily: "var(--font-body)", outline: "none" }} />
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {cartCount > 0 && (
            <div style={{ position: "sticky", bottom: 12, zIndex: 10 }}>
              <div style={{ background: "var(--accent)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                    {cartCount} producto{cartCount !== 1 ? "s" : ""} · {supermarket}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", lineHeight: 1 }}>{COP(cartTotal)}</div>
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
                      setEditTripForm({ paidBy: first?.paidBy ?? 'conjunto', paymentMethodId: first?.paymentMethodId ?? "", supermarket: trip.supermarket });
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
            </Card>
          ) : (
            filtered.map((item) => (
              <ProductCard key={item.id} item={item} onUpdate={(changes) => updateItem(item.id, changes)} onDelete={() => setConfirmDel(item)} />
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

      {/* Modal: eliminar producto */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="¿Eliminar producto?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar <strong>{confirmDel?.name}</strong>. También se eliminarán sus compras del historial.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDel(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => deleteItem(confirmDel!.id)} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>

      {/* Modal: eliminar viaje */}
      <Modal open={!!confirmDelTrip} onClose={() => setConfirmDelTrip(null)} title="¿Eliminar viaje completo?">
        {(() => {
          const trip = trips.find((t) => t.key === confirmDelTrip);
          return (
            <>
              <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
                Vas a eliminar <strong>{trip?.items.length} producto{trip?.items.length !== 1 ? "s" : ""}</strong> del viaje a <strong>{trip?.supermarket}</strong> del {trip?.date}.
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

      {/* Modal: editar viaje completo (pagador + supermercado) */}
      {(() => {
        const trip = trips.find((t) => t.key === editingTrip);
        return (
          <Modal open={!!editingTrip} onClose={() => setEditingTrip(null)} title={trip ? `Editar · ${trip.supermarket} ${trip.date}` : ""}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>Supermercado</div>
              <select value={editTripForm.supermarket} onChange={(e) => setEditTripForm((f) => ({ ...f, supermarket: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
                {SUPERMARKETS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 8 }}>¿Quién pagó?</div>
              <div style={{ display: "flex", gap: 6 }}>
                {([{ id: 'marcela', label: names.marcela }, { id: 'jonatan', label: names.jonatan }, { id: 'conjunto', label: 'Los dos' }] as const).map((p) => (
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
                <PaymentChips methods={paymentMethods} selectedId={editTripForm.paymentMethodId || undefined} onChange={(id) => setEditTripForm((f) => ({ ...f, paymentMethodId: id ?? "" }))} ownerNames={names} />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn variant="secondary" onClick={() => setEditingTrip(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="primary" onClick={() => {
                if (!trip) return;
                const paidBy = editTripForm.paidBy;
                const pmId = editTripForm.paymentMethodId || undefined;
                const newSupermarket = editTripForm.supermarket;
                const tripIds = new Set(trip.items.map((c) => c.id));
                const updated = compras.map((c) => {
                  if (!tripIds.has(c.id)) return c;
                  return { ...c, paidBy, marcelaAmount: paidBy === 'marcela' ? c.total : 0, jonatanAmount: paidBy === 'jonatan' ? c.total : 0, conjuntoAmount: paidBy === 'conjunto' ? c.total : 0, paymentMethodId: pmId, supermarket: newSupermarket };
                });
                onUpdate({ ...mercado, compras: updated });
                setEditingTrip(null);
              }} style={{ flex: 1 }}>Guardar</Btn>
            </div>
          </Modal>
        );
      })()}

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
            {SUPERMARKETS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>¿Quién pagó?</Label>
          <div style={{ display: "flex", gap: 6 }}>
            {([{ id: 'marcela', label: names.marcela }, { id: 'jonatan', label: names.jonatan }, { id: 'conjunto', label: 'Los dos' }] as const).map((p) => (
              <button key={p.id} onClick={() => setEditCompraForm((f) => ({ ...f, paidBy: p.id }))} style={{
                flex: 1, padding: "9px 4px", borderRadius: 10, border: "2px solid",
                borderColor: editCompraForm.paidBy === p.id ? "var(--accent)" : "var(--border)",
                background: editCompraForm.paidBy === p.id ? "var(--accent)" : "var(--surface2)",
                color: editCompraForm.paidBy === p.id ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
        {editingCompra && (
          <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Total estimado</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
              {COP((Number(editCompraForm.qty) || 0) * (Number(editCompraForm.pricePer) || 0))}
            </div>
          </div>
        )}
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
    </div>
  );
}

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
