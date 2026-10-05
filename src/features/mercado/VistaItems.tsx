import { useState, useMemo } from "react";
import { Pencil, Trash2 } from 'lucide-react';
import { Card, Btn, Field, Modal, Label } from '../../components/ui';
import { UNITS, ALL_CATS } from '../../constants';
import { COP } from '../../utils/finanzas';
import { Mercado, ItemMercado } from '../../types/models';
import { useMercadoConfig } from './useMercadoConfig';
import { CategoryChips, SearchInput } from './componentes';

interface VistaItemsProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
}

export function VistaItems({ mercado, onUpdate }: VistaItemsProps) {
  const { supermarkets } = useMercadoConfig();
  const items   = mercado?.items   || [];
  const compras = mercado?.compras || [];

  const [filterCat,  setFilterCat]  = useState("Todas");
  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [confirmDel, setConfirmDel] = useState<ItemMercado | null>(null);
  const [addForm, setAddForm] = useState({ name: "", pricePer: "", unit: "und", supermarket: supermarkets[0], category: "Despensa" });

  const filtered = useMemo(() => items.filter((i) => {
    const matchCat  = filterCat === "Todas" || i.category === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCat, search]);

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

  return (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        <SearchInput value={search} onChange={setSearch} style={{ flex: 1 }} />
        <Btn variant="primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: "9px 14px", whiteSpace: "nowrap" }}>+ Nuevo</Btn>
      </div>
      <CategoryChips value={filterCat} onChange={setFilterCat} />
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
          <ProductCard key={item.id} item={item} supermarkets={supermarkets} onUpdate={(changes) => updateItem(item.id, changes)} onDelete={() => setConfirmDel(item)} />
        ))
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
            {supermarkets.map((s) => <option key={s}>{s}</option>)}
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
    </>
  );
}

function ProductCard({ item, supermarkets, onUpdate, onDelete }: { item: ItemMercado; supermarkets: string[]; onUpdate: (c: Partial<ItemMercado>) => void; onDelete: () => void }) {
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
            {supermarkets.map((s) => <option key={s}>{s}</option>)}
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
