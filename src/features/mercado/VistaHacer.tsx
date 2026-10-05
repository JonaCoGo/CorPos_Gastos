import { useState, useMemo } from "react";
import { ShoppingCart, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Card, Btn, PaymentChips } from '../../components/ui';
import { UNITS } from '../../constants';
import { COP, sanitizeDecimalInput, parseFlexibleNumber, convertQty } from '../../utils/finanzas';
import { Mercado } from '../../types/models';
import { useMercadoConfig } from './useMercadoConfig';
import { Carrito } from './useCarrito';
import { CategoryChips, SearchInput, SupermarketChips, sectionTitleStyle } from './componentes';

interface VistaHacerProps {
  mercado: Mercado;
  carrito: Carrito;
  onCargarLista: () => void;
  onRegistrar: () => void;
  onIrAItems: () => void;
}

export function VistaHacer({ mercado, carrito, onCargarLista, onRegistrar, onIrAItems }: VistaHacerProps) {
  const { names, paymentMethods, supermarkets, addSupermarket, methodsFor } = useMercadoConfig();
  const items = mercado?.items || [];
  const lista = mercado?.lista || [];
  const {
    supermarket, setSupermarket, tripPaidBy, setTripPayer,
    cart, inCart, toggleCart, updateCartEntry, cartTotal, cartCount,
    expandedItem, setExpandedItem, listaLoaded,
  } = carrito;

  const [filterCat, setFilterCat] = useState("Todas");
  const [search,    setSearch]    = useState("");

  const itemsFiltrados = useMemo(() => items.filter((i) => {
    const matchCat  = filterCat === "Todas" || i.category === filterCat;
    const matchText = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  }), [items, filterCat, search]);

  const inLista = (itemId: string) => lista.some((l) => l.itemId === itemId);

  return (
    <>
      {listaLoaded && lista.length === 0 && (
        <Card style={{ background: "rgba(79,70,229,0.07)", border: "1.5px solid var(--accent)", padding: "12px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
            ✅ Lista cargada en el carrito — ajusta precios y cantidades en el mercado
          </div>
        </Card>
      )}

      {lista.length > 0 && cartCount === 0 && (
        <Card style={{ background: "rgba(79,70,229,0.07)", border: "1.5px solid var(--accent)", padding: "12px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>
            📋 Tienes una lista de {lista.length} producto{lista.length !== 1 ? "s" : ""}
          </div>
          <Btn variant="primary" onClick={onCargarLista} style={{ width: "100%" }}>Cargar lista en el carrito</Btn>
        </Card>
      )}

      <Card>
        <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>¿Dónde vas hoy?</div>
        <SupermarketChips supermarkets={supermarkets} value={supermarket} onChange={setSupermarket} onAdd={addSupermarket} />
      </Card>

      <Card>
        <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>¿Quién paga?</div>
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

      {paymentMethods.length > 0 && (
        <Card style={{ background: "rgba(79,70,229,0.05)", padding: "10px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>
            💡 El medio de pago se escoge por producto — expande cada ítem del carrito para asignarlo.
          </div>
        </Card>
      )}

      <SearchInput value={search} onChange={setSearch} />
      <CategoryChips value={filterCat} onChange={setFilterCat} />

      {items.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🧺</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin productos</div>
          <Btn variant="secondary" onClick={onIrAItems}>Ir a Items</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {itemsFiltrados.map((item) => {
            const checked = inCart(item.id);
            const entry = cart[item.id];
            const isExpanded = expandedItem === item.id;
            const pricePer = checked ? (parseFlexibleNumber(entry.pricePer) || item.pricePer) : item.pricePer;
            const unit = checked ? (entry.unit || item.unit) : item.unit;
            const qty = checked ? (parseFlexibleNumber(entry.qty) || 1) : 1;
            const qtyEnItemUnit = checked ? convertQty(qty, unit, item.unit) : qty;
            const total = checked ? pricePer * qtyEnItemUnit : null;
            const priceChanged = checked && parseFlexibleNumber(entry.pricePer) > 0 && parseFlexibleNumber(entry.pricePer) !== item.pricePer;
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
                        <input type="text" inputMode="decimal" value={entry.qty} onChange={(e) => updateCartEntry(item.id, { qty: sanitizeDecimalInput(e.target.value) })}
                          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, fontSize: 16, fontWeight: 700, textAlign: "right", border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontFamily: "var(--font-body)", outline: "none" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: priceChanged ? "var(--jona)" : "var(--text2)", marginBottom: 6 }}>
                          Precio hoy {priceChanged ? "↑" : ""}
                        </div>
                        <input type="text" inputMode="decimal" value={entry.pricePer} onChange={(e) => updateCartEntry(item.id, { pricePer: sanitizeDecimalInput(e.target.value) })}
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
                    {paymentMethods.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text2)", marginBottom: 6 }}>
                          ¿Con qué paga {entry.paidBy === 'conjunto' ? 'el fondo conjunto' : names[entry.paidBy]}?
                        </div>
                        <PaymentChips
                          methods={methodsFor(entry.paidBy)}
                          selectedId={entry.paymentMethodId || undefined}
                          onChange={(id) => updateCartEntry(item.id, { paymentMethodId: id ?? "" })}
                          ownerNames={names}
                          label=""
                        />
                      </div>
                    )}
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
            <button onClick={onRegistrar} style={{
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
  );
}
