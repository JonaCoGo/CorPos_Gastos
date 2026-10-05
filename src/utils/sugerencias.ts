// ==========================================
// MERCADO SUGERIDO — lógica pura (sin React ni Firebase)
// Propone qué comprar este mes según lo que se compró en los meses anteriores.
// ==========================================

import { Compra, ItemMercado, ListaMercado } from '../types/models';
import { mesesDeComparacion } from './informe';
import { crearLista, listaCompleta, listasDelMes } from './listas';

export interface Sugerencia {
  itemId: string;
  itemName: string;
  qty: number;           // mediana de lo comprado por mes, en la unidad del producto
  unit: string;
  pricePer: number;      // último precio pagado
  supermarket: string;   // donde más veces se ha comprado
  mesesComprado: number; // en cuántos de los meses analizados se compró
}

export interface GrupoSugerido {
  supermarket: string;
  items: Sugerencia[];
  total: number;
}

export interface ResultadoSugerencia {
  mesesAnalizados: string[];
  minMeses: number;
  grupos: GrupoSugerido[];
}

const UNIDADES_ENTERAS = new Set(['und', 'paq']);

export function mediana(valores: number[]): number {
  const v = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

// Unidades y paquetes se redondean hacia arriba (no se compran 1,5 jabones);
// el peso queda con un decimal.
export function redondearCantidad(qty: number, unit: string): number {
  if (UNIDADES_ENTERAS.has(unit)) return Math.max(1, Math.ceil(qty - 1e-9));
  return Math.max(0.1, Math.round(qty * 10) / 10);
}

/**
 * Un producto se sugiere si se compró en al menos 2 de los últimos 3 meses con
 * compras (o en el único mes, si solo hay uno). Así no entra lo que se compró
 * una sola vez por antojo. Se excluyen productos archivados y los que ya están
 * en alguna lista del mes.
 */
export function sugerirMercado(
  compras: Compra[],
  monthKey: string,
  items: ItemMercado[],
  listas: ListaMercado[] = [],
  nMeses = 3
): ResultadoSugerencia {
  const mesesAnalizados = mesesDeComparacion(compras, monthKey, nMeses);
  const minMeses = Math.min(2, mesesAnalizados.length);
  const activos = new Map(items.filter((i) => i.active !== false).map((i) => [i.id, i]));
  const yaEnListas = new Set(listasDelMes(listas, monthKey).flatMap((l) => listaCompleta(l).map((it) => it.itemId)));

  const porItem = new Map<string, Compra[]>();
  compras
    .filter((c) => mesesAnalizados.includes(c.monthKey) && activos.has(c.itemId) && !yaEnListas.has(c.itemId))
    .forEach((c) => porItem.set(c.itemId, [...(porItem.get(c.itemId) || []), c]));

  const sugerencias: Sugerencia[] = [];
  porItem.forEach((cs, itemId) => {
    const item = activos.get(itemId)!;
    const qtyPorMes = new Map<string, number>();
    cs.forEach((c) => qtyPorMes.set(c.monthKey, (qtyPorMes.get(c.monthKey) || 0) + c.qty));
    if (qtyPorMes.size < minMeses) return;

    const ordenadas = [...cs].sort((a, b) => a.date.localeCompare(b.date));
    const ultima = ordenadas[ordenadas.length - 1];

    const veces = new Map<string, number>();
    ordenadas.forEach((c) => veces.set(c.supermarket, (veces.get(c.supermarket) || 0) + 1));
    // Empate: gana el lugar de la compra más reciente
    const supermarket = [...veces.entries()].reduce((mejor, actual) =>
      actual[1] > mejor[1] || (actual[1] === mejor[1] && actual[0] === ultima.supermarket) ? actual : mejor
    )[0];

    sugerencias.push({
      itemId,
      itemName: item.name,
      qty: redondearCantidad(mediana([...qtyPorMes.values()]), item.unit),
      unit: item.unit,
      pricePer: ultima.pricePer,
      supermarket,
      mesesComprado: qtyPorMes.size,
    });
  });

  const grupos = new Map<string, GrupoSugerido>();
  sugerencias
    .sort((a, b) => a.itemName.localeCompare(b.itemName, 'es'))
    .forEach((s) => {
      const g = grupos.get(s.supermarket) ?? { supermarket: s.supermarket, items: [], total: 0 };
      g.items.push(s);
      g.total += s.qty * s.pricePer;
      grupos.set(s.supermarket, g);
    });

  return {
    mesesAnalizados,
    minMeses,
    grupos: [...grupos.values()].sort((a, b) => b.total - a.total),
  };
}

// Pasa las sugerencias aceptadas a las listas del mes: van a la lista de su
// supermercado si ya existe, o a una lista nueva con el nombre del lugar.
export function aplicarSugerencias(
  listas: ListaMercado[],
  monthKey: string,
  aceptadas: Sugerencia[]
): { listas: ListaMercado[]; listaIds: string[] } {
  let resultado = [...listas];
  const listaIds: string[] = [];
  // "D1" y "d1" son el mismo lugar
  const porLugar = new Map<string, Sugerencia[]>();
  aceptadas.forEach((s) => {
    const clave = s.supermarket.trim().toLowerCase();
    porLugar.set(clave, [...(porLugar.get(clave) || []), s]);
  });

  porLugar.forEach((sugs) => {
    const supermarket = sugs[0].supermarket;
    const nuevos = sugs.map((s) => ({
      id: `li_${Date.now()}_${s.itemId}`, itemId: s.itemId, itemName: s.itemName,
      qty: s.qty, unit: s.unit, pricePer: s.pricePer, supermarket,
    }));
    const existente = listasDelMes(resultado, monthKey)
      .find((l) => l.supermarket.trim().toLowerCase() === supermarket.trim().toLowerCase());
    if (existente) {
      const yaEstan = new Set(existente.items.map((it) => it.itemId));
      resultado = resultado.map((l) => l.id === existente.id
        ? { ...l, items: [...l.items, ...nuevos.filter((it) => !yaEstan.has(it.itemId))] }
        : l);
      listaIds.push(existente.id);
    } else {
      const nueva = crearLista(supermarket || 'Mercado', supermarket, monthKey, nuevos);
      resultado = [...resultado, nueva];
      listaIds.push(nueva.id);
    }
  });
  return { listas: resultado, listaIds };
}
