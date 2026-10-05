import { useState, useMemo } from "react";
import { Trash2, Check, ClipboardList, Copy, Plus } from 'lucide-react';
import { Card, Btn, Field, Modal, Label } from '../../components/ui';
import { COP, itemsActivos } from '../../utils/finanzas';
import { listasDelMes, crearLista, nuevoItemDeLista, mesAnteriorConListas, copiarListasMesAnterior, listasPorCopiar } from '../../utils/listas';
import { Mercado, ItemMercado, ListaItem, ListaMercado } from '../../types/models';
import { useMercadoConfig } from './useMercadoConfig';
import { CategoryChips, QtyTextInput, SearchInput, SupermarketChips, etiquetaMes, sectionTitleStyle } from './componentes';

interface VistaListaProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
  monthKey: string;
  onIrAlMercado: (listaId: string) => void;
}

export function VistaLista({ mercado, onUpdate, monthKey, onIrAlMercado }: VistaListaProps) {
  const { supermarkets, addSupermarket } = useMercadoConfig();
  const items  = itemsActivos(mercado?.items);
  const listas = mercado?.listas || [];
  const listasMes = useMemo(() => listasDelMes(listas, monthKey), [listas, monthKey]);
  const mesAnterior = mesAnteriorConListas(listas, monthKey);
  const hayPorCopiar = listasPorCopiar(listas, monthKey).length > 0;

  const [listaSelId, setListaSelId] = useState<string | null>(listasMes[0]?.id ?? null);
  const lista = listasMes.find((l) => l.id === listaSelId) ?? listasMes[0] ?? null;

  const [filterCat, setFilterCat] = useState("Todas");
  const [search,    setSearch]    = useState("");
  const [showNueva, setShowNueva] = useState(false);
  const [nuevaForm, setNuevaForm] = useState({ name: "", supermarket: supermarkets[0] ?? "" });
  const [confirmDelLista, setConfirmDelLista] = useState(false);

  const actualizarLista = (id: string, cambios: Partial<ListaMercado>) =>
    onUpdate({ ...mercado, listas: listas.map((l) => l.id === id ? { ...l, ...cambios } : l) });

  const guardarNueva = () => {
    const name = nuevaForm.name.trim();
    if (!name) return;
    const nueva = crearLista(name, nuevaForm.supermarket, monthKey);
    onUpdate({ ...mercado, listas: [...listas, nueva] });
    setListaSelId(nueva.id);
    setShowNueva(false);
    setNuevaForm({ name: "", supermarket: supermarkets[0] ?? "" });
  };

  const copiarMesAnterior = () => {
    const nuevas = copiarListasMesAnterior(listas, monthKey);
    if (nuevas === listas) return;
    onUpdate({ ...mercado, listas: nuevas });
    const primera = listasDelMes(nuevas, monthKey)[0];
    if (primera) setListaSelId(primera.id);
  };

  const borrarLista = () => {
    if (!lista) return;
    onUpdate({ ...mercado, listas: listas.filter((l) => l.id !== lista.id) });
    setListaSelId(null);
    setConfirmDelLista(false);
  };

  const inLista = (itemId: string) => !!lista?.items.some((l) => l.itemId === itemId);

  const toggleLista = (item: ItemMercado) => {
    if (!lista) return;
    actualizarLista(lista.id, {
      items: inLista(item.id)
        ? lista.items.filter((l) => l.itemId !== item.id)
        : [...lista.items, nuevoItemDeLista(item, lista.supermarket)],
    });
  };

  const updateListaItem = (itemId: string, changes: Partial<ListaItem>) => {
    if (!lista) return;
    actualizarLista(lista.id, { items: lista.items.map((l) => l.itemId === itemId ? { ...l, ...changes } : l) });
  };

  const itemsFiltrados = useMemo(() => items.filter((i) => {
    const matchCat  = filterCat === "Todas" || i.category === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCat, search]);

  const totalEstimado = lista ? lista.items.reduce((s, li) => s + li.qty * li.pricePer, 0) : 0;

  return (
    <>
      {/* Listas del mes */}
      <Card>
        <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>Listas de {etiquetaMes(monthKey)}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {listasMes.map((l) => {
            const sel = lista?.id === l.id;
            return (
              <button key={l.id} onClick={() => setListaSelId(l.id)} style={{
                padding: "8px 14px", borderRadius: 99, border: "2px solid",
                borderColor: sel ? "var(--accent)" : "var(--border)",
                background: sel ? "var(--accent)" : "var(--surface2)",
                color: sel ? "#fff" : "var(--text2)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
              }}>
                {l.name} · {l.items.length === 0 && (l.comprados?.length ?? 0) > 0 ? "✅" : l.items.length}
              </button>
            );
          })}
          <button onClick={() => setShowNueva(true)} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "8px 14px", borderRadius: 99, border: "2px dashed var(--border)",
            background: "transparent", color: "var(--text2)",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
          }}><Plus size={14} /> Nueva lista</button>
        </div>
        {mesAnterior && hayPorCopiar && (
          <Btn variant="secondary" onClick={copiarMesAnterior} style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Copy size={15} /> Copiar listas de {etiquetaMes(mesAnterior)}
          </Btn>
        )}
      </Card>

      {!lista ? (
        <Card style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin listas este mes</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>Crea una lista por cada lugar donde mercan (ej. OR, D1, plaza).</div>
          <Btn variant="primary" onClick={() => setShowNueva(true)}>Crear lista</Btn>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={sectionTitleStyle}>¿Dónde se compra «{lista.name}»?</div>
              <button onClick={() => setConfirmDelLista(true)} aria-label="Eliminar lista"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: 4 }}>
                <Trash2 size={15} />
              </button>
            </div>
            <SupermarketChips supermarkets={supermarkets} value={lista.supermarket}
              onChange={(s) => actualizarLista(lista.id, { supermarket: s, items: lista.items.map((it) => ({ ...it, supermarket: s })) })}
              onAdd={addSupermarket} />
          </Card>

          {lista.items.length === 0 && (lista.comprados?.length ?? 0) > 0 && (
            <Card style={{ textAlign: "center", padding: "16px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>
                ✅ Todo comprado · {lista.comprados!.length} producto{lista.comprados!.length !== 1 ? "s" : ""}
              </div>
            </Card>
          )}

          {lista.items.length > 0 && (
            <Card>
              <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>
                Pendientes · {lista.items.length} producto{lista.items.length !== 1 ? "s" : ""} · ≈ {COP(totalEstimado)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lista.items.map((li) => (
                  <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{li.itemName}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{COP(li.pricePer)}/{li.unit}</div>
                    </div>
                    <QtyTextInput
                      value={li.qty}
                      onCommit={(qty) => updateListaItem(li.itemId, { qty })}
                      style={{ width: 56, padding: "6px 8px", borderRadius: 8, border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontWeight: 700, textAlign: "right", fontFamily: "var(--font-body)", outline: "none" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text2)", minWidth: 20 }}>{li.unit}</span>
                    <button onClick={() => actualizarLista(lista.id, { items: lista.items.filter((l) => l.itemId !== li.itemId) })} aria-label="Quitar de lista"
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
              const liItem = lista.items.find((l) => l.itemId === item.id);
              const enOtra = !checked ? listasMes.find((l) => l.id !== lista.id && l.items.some((it) => it.itemId === item.id)) : undefined;
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
                      <div style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? "var(--text1)" : "var(--text2)" }}>
                        {item.name} {enOtra && <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>· en {enOtra.name}</span>}
                      </div>
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

          {lista.items.length > 0 && (
            <div style={{ position: "sticky", bottom: 12, zIndex: 10 }}>
              <button onClick={() => onIrAlMercado(lista.id)} style={{
                width: "100%", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 16,
                padding: "16px 18px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
              }}>
                <ClipboardList size={18} /> Voy al mercado con «{lista.name}» ({lista.items.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal: nueva lista */}
      <Modal open={showNueva} onClose={() => setShowNueva(false)} title="Nueva lista">
        <Field label="Nombre" value={nuevaForm.name} onChange={(v) => setNuevaForm({ ...nuevaForm, name: v })} type="text" placeholder="Ej: OR, D1 quincena, Plaza" />
        <div style={{ marginBottom: 14 }}>
          <Label>¿Dónde se compra?</Label>
          <SupermarketChips supermarkets={supermarkets} value={nuevaForm.supermarket}
            onChange={(s) => setNuevaForm((f) => ({ ...f, supermarket: s }))} onAdd={addSupermarket} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setShowNueva(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="primary" onClick={guardarNueva} disabled={!nuevaForm.name.trim()} style={{ flex: 1 }}>Crear</Btn>
        </div>
      </Modal>

      {/* Modal: eliminar lista */}
      <Modal open={confirmDelLista} onClose={() => setConfirmDelLista(false)} title="¿Eliminar lista?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Vas a eliminar la lista <strong>{lista?.name}</strong>{lista && lista.items.length > 0 ? <> con {lista.items.length} producto{lista.items.length !== 1 ? "s" : ""} pendiente{lista.items.length !== 1 ? "s" : ""}</> : null}. Las compras ya registradas no se afectan.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmDelLista(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={borrarLista} style={{ flex: 1 }}>Eliminar</Btn>
        </div>
      </Modal>
    </>
  );
}
