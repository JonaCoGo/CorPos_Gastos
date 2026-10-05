import { useState, useMemo } from "react";
import { Trash2, Check, ClipboardList } from 'lucide-react';
import { Card } from '../../components/ui';
import { COP } from '../../utils/finanzas';
import { Mercado, ItemMercado, ListaItem } from '../../types/models';
import { useMercadoConfig } from './useMercadoConfig';
import { CategoryChips, QtyTextInput, SearchInput, SupermarketChips, sectionTitleStyle } from './componentes';

interface VistaListaProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
  onIrAlMercado: () => void;
}

export function VistaLista({ mercado, onUpdate, onIrAlMercado }: VistaListaProps) {
  const { supermarkets, addSupermarket } = useMercadoConfig();
  const items = mercado?.items || [];
  const lista = mercado?.lista || [];

  const [filterCat, setFilterCat] = useState("Todas");
  const [search,    setSearch]    = useState("");
  const [listaSupermarket, setListaSupermarket] = useState(supermarkets[0]);

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

  const itemsFiltrados = useMemo(() => items.filter((i) => {
    const matchCat  = filterCat === "Todas" || i.category === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCat, search]);

  return (
    <>
      <Card>
        <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>¿Dónde van a comprar?</div>
        <SupermarketChips supermarkets={supermarkets} value={listaSupermarket} onChange={setListaSupermarket} onAdd={addSupermarket} />
      </Card>

      {lista.length > 0 && (
        <Card>
          <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>
            Lista actual · {lista.length} producto{lista.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lista.map((li) => (
              <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{li.itemName}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{COP(li.pricePer)}/{li.unit} · {li.supermarket}</div>
                </div>
                <QtyTextInput
                  value={li.qty}
                  onCommit={(qty) => updateListaItem(li.itemId, { qty })}
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

      <SearchInput value={search} onChange={setSearch} />
      <CategoryChips value={filterCat} onChange={setFilterCat} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {itemsFiltrados.map((item) => {
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
                    <QtyTextInput
                      value={liItem.qty}
                      onCommit={(qty) => updateListaItem(item.id, { qty })}
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

      {lista.length > 0 && (
        <div style={{ position: "sticky", bottom: 12, zIndex: 10 }}>
          <button onClick={onIrAlMercado} style={{
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
  );
}
