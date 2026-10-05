// ==========================================
// LISTAS DE MERCADO — lógica pura (sin React ni Firebase)
// Cada lista pertenece a un mes y a un lugar de compra (ej. "OR", "D1").
// ==========================================

import { ItemMercado, ListaItem, ListaMercado, Mercado } from '../types/models';

export function listasDelMes(listas: ListaMercado[] | null | undefined, monthKey: string): ListaMercado[] {
  return (listas || []).filter((l) => l.monthKey === monthKey);
}

export function crearLista(name: string, supermarket: string, monthKey: string, items: ListaItem[] = []): ListaMercado {
  return { id: `lista_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, supermarket, monthKey, items };
}

export function nuevoItemDeLista(item: ItemMercado, supermarket: string): ListaItem {
  return {
    id: `li_${Date.now()}_${item.id}`,
    itemId: item.id, itemName: item.name,
    qty: 1, unit: item.unit,
    pricePer: item.pricePer,
    supermarket,
  };
}

// Mes más reciente, anterior a `monthKey`, que tenga listas.
export function mesAnteriorConListas(listas: ListaMercado[] | null | undefined, monthKey: string): string | null {
  const meses = Array.from(new Set((listas || []).map((l) => l.monthKey))).filter((k) => k < monthKey).sort();
  return meses.length ? meses[meses.length - 1] : null;
}

// Pendientes + comprados, sin repetir producto: la lista tal como se armó.
export function listaCompleta(lista: ListaMercado): ListaItem[] {
  const vistos = new Set<string>();
  return [...lista.items, ...(lista.comprados || [])].filter((it) => {
    if (vistos.has(it.itemId)) return false;
    vistos.add(it.itemId);
    return true;
  });
}

const mismoNombre = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Listas del mes anterior que todavía no existen (por nombre) en el mes destino.
export function listasPorCopiar(listas: ListaMercado[], monthKeyDestino: string): ListaMercado[] {
  const origen = mesAnteriorConListas(listas, monthKeyDestino);
  if (!origen) return [];
  const destino = listasDelMes(listas, monthKeyDestino);
  return listasDelMes(listas, origen).filter((l) => !destino.some((d) => mismoNombre(d.name, l.name)));
}

// Copia las listas del mes anterior al mes destino, completas (lo que estaba
// pendiente y lo que ya se compró), con ids nuevos y todo como pendiente.
export function copiarListasMesAnterior(listas: ListaMercado[], monthKeyDestino: string): ListaMercado[] {
  const copias = listasPorCopiar(listas, monthKeyDestino).map((l) =>
    crearLista(l.name, l.supermarket, monthKeyDestino, listaCompleta(l).map((it) => ({ ...it, id: `li_${Date.now()}_${it.itemId}` })))
  );
  return copias.length ? [...listas, ...copias] : listas;
}

// Al registrar un viaje solo salen de la lista los productos comprados (pasan a
// `comprados`); lo que no se consiguió queda pendiente para el próximo viaje.
export function quitarComprados(lista: ListaMercado, itemIdsComprados: string[]): ListaMercado {
  const comprados = new Set(itemIdsComprados);
  const salen = lista.items.filter((it) => comprados.has(it.itemId));
  const yaComprados = (lista.comprados || []).filter((it) => !comprados.has(it.itemId));
  return {
    ...lista,
    items: lista.items.filter((it) => !comprados.has(it.itemId)),
    comprados: [...yaComprados, ...salen],
  };
}

// Migración: la lista única (`mercado.lista`) pasa a ser una lista del mes activo.
export function migrarListaUnica(mercado: Mercado, monthKey: string): { mercado: Mercado; changed: boolean } {
  if (mercado.lista === undefined) return { mercado, changed: false };
  const { lista, ...resto } = mercado;
  let listas = [...(mercado.listas || [])];
  if (lista && lista.length > 0) {
    // Un celular con la versión vieja puede volver a escribir `lista` después de
    // migrada: se fusiona en la "Lista" del mes en vez de crear otra cada vez.
    const existente = listas.find((l) => l.monthKey === monthKey && l.name === 'Lista');
    if (existente) {
      const nuevos = lista.filter((it) => !existente.items.some((e) => e.itemId === it.itemId));
      listas = listas.map((l) => l === existente ? { ...l, items: [...l.items, ...nuevos] } : l);
    } else {
      listas.push(crearLista('Lista', lista[0].supermarket || '', monthKey, lista));
    }
  }
  return { mercado: { ...resto, listas }, changed: true };
}
