import { useState, useMemo } from "react";
import { Card, Btn, Field, Modal, Label } from '../components/ui';
import { SUPERMARKETS, UNITS, ALL_CATS } from '../constants';
import { COP } from '../utils/finanzas';
import { Mercado, ItemMercado, Compra } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabMercadoProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
}

export function TabMercado({ mercado, onUpdate }: TabMercadoProps) {
  const config = useAppStore((s) => s.data.config);
  const names = {
    marcela: config?.marcelaName ?? "Marcela",
    jonatan: config?.jonatanName ?? "Jonatan",
  };

  const items   = mercado?.items   || [];
  const compras = mercado?.compras || [];

  const [view,       setView]       = useState("compras");
  const [filterCat,  setFilterCat]  = useState("Todas");
  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [showCompra, setShowCompra] = useState(false);
  const [confirmDel, setConfirmDel] = useState<ItemMercado | null>(null);
  const [confirmDelCompra, setConfirmDelCompra] = useState<Compra | null>(null);

  const [addForm, setAddForm] = useState({ name: "", pricePer: "", unit: "und", supermarket: "D1", category: "Despensa" });
  const [compraForm, setCompraForm] = useState({ itemId: "", qty: "", pricePer: "", supermarket: "D1", date: new Date().toISOString().slice(0, 10), notes: "", person: "marcela" });
  const [searchProd, setSearchProd] = useState("");
  
  // Memoize filtered items for the compra modal search - only recompute when items or searchProd changes
  const filteredItems = useMemo(() => {
    return items.filter((i: ItemMercado) => i.name.toLowerCase().includes(searchProd.toLowerCase()));
  }, [items, searchProd]);

  const saveItem = () => {
    if (!addForm.name || !addForm.pricePer) return;
    const newItem: ItemMercado = { id: `item_${Date.now()}`, name: addForm.name, pricePer: Number(addForm.pricePer), unit: addForm.unit, supermarket: addForm.supermarket, category: addForm.category };
    onUpdate({ ...mercado, items: [...items, newItem] });
    setShowAdd(false);
    setAddForm({ name: "", pricePer: "", unit: "und", supermarket: "D1", category: "Despensa" });
  };

  const updateItem = (id: string, changes: Partial<ItemMercado>) => {
    onUpdate({ ...mercado, items: items.map((i: ItemMercado) => i.id === id ? { ...i, ...changes } : i) });
  };

  const deleteItem = (id: string) => {
    onUpdate({ ...mercado, items: items.filter((i: ItemMercado) => i.id !== id), compras: compras.filter((c: Compra) => c.itemId !== id) });
    setConfirmDel(null);
  };

  const registerCompra = () => {
    if (!compraForm.itemId || !compraForm.qty) return;
    const item = items.find((i: ItemMercado) => i.id === compraForm.itemId);
    if (!item) return;
    const qty   = Number(compraForm.qty);
    const pricePer = Number(compraForm.pricePer) || item.pricePer;
    const total = pricePer * qty;
    const marcelaAmount = compraForm.person === "marcela" ? total : compraForm.person === "jonatan" ? 0 : total / 2;
    const jonatanAmount = compraForm.person === "jonatan" ? total : compraForm.person === "marcela" ? 0 : total / 2;
    const newC: Compra  = {
      id: `compra_${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      pricePer,
      total,
      supermarket: compraForm.supermarket,
      date: compraForm.date,
      notes: compraForm.notes,
      marcelaAmount,
      jonatanAmount
    };
    onUpdate({ ...mercado, compras: [newC, ...compras] });
    setShowCompra(false);
    setCompraForm({ itemId: "", qty: "", pricePer: "", supermarket: "D1", date: new Date().toISOString().slice(0, 10), notes: "", person: "marcela" });
    setSearchProd("");
  };

  const compraItem = items.find((i: ItemMercado) => i.id === compraForm.itemId);
  const pricePerForPreview = Number(compraForm.pricePer) || compraItem?.pricePer || 0;
  
  // Memoize compra preview calculation
  const compraPreview = useMemo(() => {
    return compraItem && compraForm.qty && pricePerForPreview > 0 ? pricePerForPreview * Number(compraForm.qty) : null;
  }, [compraItem, compraForm.qty, pricePerForPreview]);

  // Memoize filtered items for the main list view - only recompute when items, filterCat, or search changes
  const filtered = useMemo(() => {
    return items.filter((i: ItemMercado) => {
      const matchCat  = filterCat === "Todas" || i.category === filterCat;
      const matchText = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchText;
    });
  }, [items, filterCat, search]);

  // Memoize total compras calculation - only recompute when compras changes
  const totalCompras = useMemo(() => {
    return compras.reduce((s: number, c: Compra) => s + c.total, 0);
  }, [compras]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toggle */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 12, padding: 4, gap: 4 }}>
        {[{ id: "compras", label: "🧾 Compras" }, { id: "lista", label: "🧺 Productos" }].map((v) => (
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
            filtered.map((item: ItemMercado) => (
              <ItemCard
                key={item.id} item={item}
                lastCompras={compras.filter((c: any) => c.itemId === item.id).slice(0, 2)}
                onUpdate={(changes: Partial<ItemMercado>) => updateItem(item.id, changes)}
                onDelete={() => setConfirmDel(item)}
                onComprar={(priceOverride?: number, qtyOverride?: string) => { setCompraForm({ ...compraForm, itemId: item.id, supermarket: item.supermarket, pricePer: priceOverride ? String(priceOverride) : String(item.pricePer), qty: qtyOverride || "" }); setShowCompra(true); }}
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
            compras.map((c: Compra) => (
              <Card key={c.id} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{c.itemName}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{c.qty} {c.unit} · {COP(c.pricePer)}/{c.unit} · {c.supermarket}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{c.date}{c.notes ? ` · ${c.notes}` : ""}</div>
                    {(c.marcelaAmount !== undefined || c.jonatanAmount !== undefined) && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text2)" }}>
                        {c.marcelaAmount > 0 && (
                          <div>{names.marcela}: {COP(c.marcelaAmount)}</div>
                        )}
                        {c.jonatanAmount > 0 && (
                          <div>{names.jonatan}: {COP(c.jonatanAmount)}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{COP(c.total)}</div>
                    <button onClick={() => setConfirmDelCompra(c)}
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
      <Modal open={showCompra} onClose={() => { setShowCompra(false); setSearchProd(""); }} title="Registrar compra">
        <div style={{ marginBottom: 14 }}>
          <Label>Producto</Label>
          <input
            placeholder="🔍 Buscar producto..."
            value={searchProd}
            onChange={(e) => setSearchProd(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", marginBottom: 8 }}
          />
          <select value={compraForm.itemId} onChange={(e) => {
            const it = items.find((i: any) => i.id === e.target.value);
            setCompraForm({ ...compraForm, itemId: e.target.value, supermarket: it?.supermarket || "D1", pricePer: it ? String(it.pricePer) : "" });
          }} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)" }}>
            <option value="">— Selecciona —</option>
            {filteredItems.map((i: ItemMercado) => <option key={i.id} value={i.id}>{i.name} · {COP(i.pricePer)}/{i.unit}</option>)}
          </select>
        </div>
        <Field label="Precio" value={compraForm.pricePer} onChange={(v) => setCompraForm({ ...compraForm, pricePer: v })} placeholder="895" />
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
                <span>{p === "ambos" ? "Ambos" : p === "marcela" ? names.marcela : names.jonatan}</span>
              </button>
            ))}
          </div>
        </div>
        <Field label={`Cantidad${compraItem ? ` (${compraItem.unit})` : ""}`} value={compraForm.qty} onChange={(v) => setCompraForm({ ...compraForm, qty: v })} placeholder="1" />
        {compraPreview !== null && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Total estimado</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--success)", fontFamily: "var(--font-display)" }}>{COP(compraPreview)}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{compraForm.qty} {compraItem?.unit} × {COP(pricePerForPreview)}</div>
            {compraForm.person !== "" && (
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)" }}>
                {compraForm.person === "marcela" && (
                  <div>{names.marcela} paga: {COP(compraPreview)}</div>
                )}
                {compraForm.person === "jonatan" && (
                  <div>{names.jonatan} paga: {COP(compraPreview)}</div>
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

      {/* Modal: confirmar eliminar compra */}
      <Modal open={!!confirmDelCompra} onClose={() => setConfirmDelCompra(null)} title="¿Eliminar compra?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar la compra de <strong>{confirmDelCompra?.itemName}</strong> del {confirmDelCompra?.date}. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDelCompra(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => { onUpdate({ ...mercado, compras: compras.filter((x: Compra) => x.id !== confirmDelCompra!.id) }); setConfirmDelCompra(null); }} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── ItemCard: edición inline completa + calculadora con precio editable ─────
function ItemCard({ item, lastCompras, onUpdate, onDelete, onComprar }: any) {
  const [expanded,     setExpanded]     = useState(false);
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
          {/* Header — siempre visible, clic para expandir */}
          <div
            onClick={() => setExpanded((e) => !e)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)", marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{item.category} · {item.supermarket} · {COP(item.pricePer)}/{item.unit}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontSize: 14 }}>✏️</button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontSize: 14 }}>🗑</button>
              <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 2 }}>{expanded ? "▲" : "▼"}</span>
            </div>
          </div>

          {/* Detalle expandible */}
          {expanded && (
          <div style={{ marginTop: 12 }}>
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
            <Btn variant="secondary" onClick={() => onComprar(priceForCalc, qty)} style={{ width: "100%", fontSize: 13, padding: "11px", marginBottom: priceChanged ? 8 : 0 }}>
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
              {lastCompras.map((c: any) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>
                  <span>{c.date} · {c.qty} {c.unit} a {COP(c.pricePer)} · {c.supermarket}</span>
                  <span style={{ fontWeight: 600, color: "var(--text1)" }}>{COP(c.total)}</span>
                </div>
              ))}
            </div>
          )}
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
