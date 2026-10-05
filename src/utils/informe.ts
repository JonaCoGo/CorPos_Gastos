// ==========================================
// INFORME DEL MERCADO — lógica pura (sin React ni Firebase)
// Cuánto se gastó por categoría y por supermercado en un mes, comparado con el
// promedio de los meses anteriores.
// ==========================================

import { Compra } from '../types/models';
import { comprasDelMes } from './finanzas';

export interface FilaInforme {
  nombre: string;
  total: number;
  pct: number;                    // participación en el total del mes (0–100)
  promedioAnterior: number | null; // promedio mensual en los meses de comparación (null si no hay meses)
  variacionPct: number | null;     // vs promedioAnterior (null si no hay base para comparar)
}

export interface ProductoTop {
  itemId: string;
  nombre: string;
  total: number;
  qty: number;
  unit: string;
}

export interface CambioPrecio {
  itemId: string;
  nombre: string;
  unit: string;
  precioAnterior: number;
  precioActual: number;
  variacionPct: number;
}

export interface InformeMercado {
  monthKey: string;
  total: number;
  viajes: number;
  mesesComparados: string[];
  promedioAnterior: number | null;
  variacionPct: number | null;
  porCategoria: FilaInforme[];
  porSupermercado: FilaInforme[];
  topProductos: ProductoTop[];
  cambiosPrecio: CambioPrecio[];
}

const variacion = (actual: number, base: number | null): number | null =>
  base && base > 0 ? ((actual - base) / base) * 100 : null;

// Meses anteriores a `monthKey` que tienen compras, los `n` más recientes.
export function mesesDeComparacion(compras: Compra[], monthKey: string, n = 3): string[] {
  const meses = Array.from(new Set(compras.map((c) => c.monthKey))).filter((k) => k && k < monthKey).sort();
  return meses.slice(-n);
}

function agrupar(compras: Compra[], clave: (c: Compra) => string): Map<string, number> {
  const m = new Map<string, number>();
  compras.forEach((c) => m.set(clave(c), (m.get(clave(c)) || 0) + c.total));
  return m;
}

function filas(
  actual: Compra[],
  anteriores: Compra[],
  nMeses: number,
  clave: (c: Compra) => string,
  totalMes: number
): FilaInforme[] {
  const hoy = agrupar(actual, clave);
  const antes = agrupar(anteriores, clave);
  return Array.from(hoy.entries())
    .map(([nombre, total]) => {
      const promedioAnterior = nMeses > 0 ? (antes.get(nombre) || 0) / nMeses : null;
      return {
        nombre,
        total,
        pct: totalMes > 0 ? (total / totalMes) * 100 : 0,
        promedioAnterior,
        variacionPct: variacion(total, promedioAnterior),
      };
    })
    .sort((a, b) => b.total - a.total);
}

// Precio por unidad más reciente de cada producto dentro de un grupo de compras.
function ultimoPrecio(compras: Compra[]): Map<string, Compra> {
  const m = new Map<string, Compra>();
  [...compras]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((c) => m.set(c.itemId, c));
  return m;
}

export function informeMercado(compras: Compra[], monthKey: string, nMesesComparar = 3): InformeMercado {
  const delMes = comprasDelMes(compras, monthKey);
  const mesesComparados = mesesDeComparacion(compras, monthKey, nMesesComparar);
  const anteriores = compras.filter((c) => mesesComparados.includes(c.monthKey));
  const n = mesesComparados.length;

  const total = delMes.reduce((s, c) => s + c.total, 0);
  const promedioAnterior = n > 0 ? anteriores.reduce((s, c) => s + c.total, 0) / n : null;

  const productos = new Map<string, ProductoTop>();
  delMes.forEach((c) => {
    const p = productos.get(c.itemId) ?? { itemId: c.itemId, nombre: c.itemName, total: 0, qty: 0, unit: c.unit };
    p.total += c.total;
    p.qty += c.qty;
    productos.set(c.itemId, p);
  });

  const precioAntes = ultimoPrecio(compras.filter((c) => c.monthKey && c.monthKey < monthKey));
  const cambiosPrecio: CambioPrecio[] = [];
  ultimoPrecio(delMes).forEach((hoy, itemId) => {
    const antes = precioAntes.get(itemId);
    // Solo se compara en la misma unidad: $/lb contra $/und no dice nada.
    if (!antes || antes.unit !== hoy.unit || antes.pricePer <= 0 || antes.pricePer === hoy.pricePer) return;
    cambiosPrecio.push({
      itemId,
      nombre: hoy.itemName,
      unit: hoy.unit,
      precioAnterior: antes.pricePer,
      precioActual: hoy.pricePer,
      variacionPct: ((hoy.pricePer - antes.pricePer) / antes.pricePer) * 100,
    });
  });

  return {
    monthKey,
    total,
    viajes: new Set(delMes.map((c) => `${c.date}__${c.supermarket}`)).size,
    mesesComparados,
    promedioAnterior,
    variacionPct: variacion(total, promedioAnterior),
    porCategoria: filas(delMes, anteriores, n, (c) => c.category || 'Otros', total),
    porSupermercado: filas(delMes, anteriores, n, (c) => c.supermarket || 'Sin lugar', total),
    topProductos: Array.from(productos.values()).sort((a, b) => b.total - a.total).slice(0, 5),
    cambiosPrecio: cambiosPrecio.sort((a, b) => Math.abs(b.variacionPct) - Math.abs(a.variacionPct)).slice(0, 5),
  };
}
