import { useState, useMemo } from "react";
import { parseFlexibleNumber, convertQty } from '../../utils/finanzas';
import { Mercado, ItemMercado, Compra } from '../../types/models';
import { Pagador } from './useMercadoConfig';

export interface CartEntry {
  itemId: string;
  qty: string;
  pricePer: string;
  unit: string;
  paidBy: Pagador;
  paymentMethodId: string;
}

// El carrito vive en el contenedor de Mercado (no en la vista "Hacer") para que
// no se pierda al cambiar entre Lista / Hacer / Historial a mitad del mercado.
export function useCarrito(mercado: Mercado, onUpdate: (data: Mercado) => void, defaultSupermarket: string) {
  const items = mercado?.items || [];
  const compras = mercado?.compras || [];
  const lista = mercado?.lista || [];

  const [supermarket,  setSupermarket]  = useState(defaultSupermarket);
  const [tripPaidBy,   setTripPaidBy]   = useState<Pagador>('conjunto');
  const [cart,         setCart]         = useState<Record<string, CartEntry>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [listaLoaded,  setListaLoaded]  = useState(false);

  const inCart = (id: string) => !!cart[id];

  const setTripPayer = (payer: Pagador) => {
    setTripPaidBy(payer);
    setCart((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], paidBy: payer, paymentMethodId: "" }; });
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
      setCart({ ...cart, [item.id]: { itemId: item.id, qty: "1", pricePer: String(item.pricePer), unit: item.unit, paidBy: tripPaidBy, paymentMethodId: "" } });
      setExpandedItem(item.id);
    }
  };

  const updateCartEntry = (id: string, changes: Partial<CartEntry>) => {
    setCart((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }));
  };

  const cartTotal = useMemo(() => Object.values(cart).reduce((s, e) => {
    const item = items.find((i) => i.id === e.itemId);
    if (!item) return s;
    const qty = convertQty(parseFlexibleNumber(e.qty) || 0, e.unit || item.unit, item.unit);
    const pricePer = parseFlexibleNumber(e.pricePer) || item.pricePer;
    return s + qty * pricePer;
  }, 0), [cart, items]);
  const cartCount = Object.keys(cart).length;

  const cargarLista = () => {
    if (lista.length === 0) return false;
    const newCart: Record<string, CartEntry> = {};
    lista.forEach((li) => {
      newCart[li.itemId] = { itemId: li.itemId, qty: String(li.qty), pricePer: String(li.pricePer), unit: li.unit, paidBy: tripPaidBy, paymentMethodId: "" };
    });
    setCart(newCart);
    setListaLoaded(true);
    return true;
  };

  const registrarViaje = () => {
    if (cartCount === 0) return false;
    const today = new Date().toISOString().slice(0, 10);
    const nuevasCompras: Compra[] = Object.values(cart).map((e) => {
      const item = items.find((i) => i.id === e.itemId)!;
      const rawQty = parseFlexibleNumber(e.qty) || 1;
      const pricePer = parseFlexibleNumber(e.pricePer) || item.pricePer;
      const enteredUnit = e.unit || item.unit;
      // Se guarda siempre en la unidad del producto (ej. lb) aunque se haya
      // pesado en otra (ej. la báscula en kg) — así el historial queda consistente.
      const qty = convertQty(rawQty, enteredUnit, item.unit);
      const unit = item.unit;
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
        paymentMethodId: e.paymentMethodId || undefined,
      };
    });
    const updatedItems = items.map((item) => {
      const e = cart[item.id];
      if (e && parseFlexibleNumber(e.pricePer) && parseFlexibleNumber(e.pricePer) !== item.pricePer)
        return { ...item, pricePer: parseFlexibleNumber(e.pricePer) };
      return item;
    });
    onUpdate({ ...mercado, items: updatedItems, compras: [...nuevasCompras, ...compras], lista: [] });
    setCart({});
    setExpandedItem(null);
    setListaLoaded(false);
    return true;
  };

  return {
    supermarket, setSupermarket,
    tripPaidBy, setTripPayer,
    cart, inCart, toggleCart, updateCartEntry, cartTotal, cartCount,
    expandedItem, setExpandedItem,
    listaLoaded,
    cargarLista, registrarViaje,
  };
}

export type Carrito = ReturnType<typeof useCarrito>;
