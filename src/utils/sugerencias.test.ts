import { describe, it, expect } from 'vitest';
import { sugerirMercado, mediana, redondearCantidad, aplicarSugerencias, Sugerencia } from './sugerencias';
import { Compra, ItemMercado, ListaMercado } from '../types/models';

const item = (id: string, unit = 'und', over: Partial<ItemMercado> = {}): ItemMercado =>
  ({ id, name: id, pricePer: 1000, unit, supermarket: 'D1', category: 'Despensa', ...over });

let n = 0;
const compra = (itemId: string, monthKey: string, qty: number, over: Partial<Compra> = {}): Compra => ({
  id: `c${n++}`, itemId, itemName: itemId, qty, unit: 'und', pricePer: 1000, total: qty * 1000,
  supermarket: 'D1', date: `${monthKey}-10`, notes: '', marcelaAmount: 0, jonatanAmount: 0,
  conjuntoAmount: qty * 1000, paidBy: 'conjunto', monthKey, category: 'Despensa', ...over,
});

const items = [item('arroz'), item('leche'), item('helado'), item('tomate', 'lb'), item('jabon')];

describe('sugerirMercado', () => {
  const compras = [
    compra('arroz', '2026-07', 2), compra('arroz', '2026-08', 3), compra('arroz', '2026-09', 2),
    compra('leche', '2026-08', 6), compra('leche', '2026-09', 4),
    compra('helado', '2026-09', 1), // una sola vez: antojo, no se sugiere
  ];

  it('sugiere lo comprado en al menos 2 de los últimos 3 meses', () => {
    const r = sugerirMercado(compras, '2026-10', items);
    expect(r.mesesAnalizados).toEqual(['2026-07', '2026-08', '2026-09']);
    const ids = r.grupos.flatMap((g) => g.items.map((i) => i.itemId));
    expect(ids).toEqual(['arroz', 'leche']);
  });

  it('cantidad = mediana de lo comprado por mes (resiste un mes atípico)', () => {
    const r = sugerirMercado(compras, '2026-10', items);
    const s = Object.fromEntries(r.grupos.flatMap((g) => g.items.map((i) => [i.itemId, i.qty])));
    expect(s.arroz).toBe(2);
    expect(s.leche).toBe(5);
  });

  it('suma varias compras del mismo producto dentro del mes', () => {
    const r = sugerirMercado([
      compra('arroz', '2026-08', 1), compra('arroz', '2026-08', 1, { date: '2026-08-25' }),
      compra('arroz', '2026-09', 2),
    ], '2026-10', items);
    expect(r.grupos[0].items[0].qty).toBe(2);
  });

  it('con un solo mes de historia sugiere todo lo de ese mes', () => {
    const r = sugerirMercado([compra('helado', '2026-09', 1)], '2026-10', items);
    expect(r.minMeses).toBe(1);
    expect(r.grupos[0].items[0].itemId).toBe('helado');
  });

  it('sin historia no sugiere nada', () => {
    const r = sugerirMercado([], '2026-10', items);
    expect(r.mesesAnalizados).toEqual([]);
    expect(r.grupos).toEqual([]);
  });

  it('agrupa por el lugar donde más se compra y usa el último precio', () => {
    const r = sugerirMercado([
      compra('tomate', '2026-08', 2, { supermarket: 'Plaza', unit: 'lb', pricePer: 2000, date: '2026-08-05' }),
      compra('tomate', '2026-09', 3, { supermarket: 'Plaza', unit: 'lb', pricePer: 2500, date: '2026-09-05' }),
      compra('tomate', '2026-09', 1, { supermarket: 'D1', unit: 'lb', pricePer: 2600, date: '2026-09-20' }),
      compra('arroz', '2026-08', 1, { supermarket: 'D1' }), compra('arroz', '2026-09', 1, { supermarket: 'D1' }),
    ], '2026-10', items);
    const tomate = r.grupos.flatMap((g) => g.items).find((i) => i.itemId === 'tomate')!;
    expect(tomate.supermarket).toBe('Plaza');
    expect(tomate.pricePer).toBe(2600);
    expect(r.grupos.map((g) => g.supermarket).sort()).toEqual(['D1', 'Plaza']);
  });

  it('excluye productos archivados y los que ya están en una lista del mes', () => {
    const lista: ListaMercado = {
      id: 'l', name: 'OR', supermarket: 'OR', monthKey: '2026-10', items: [],
      comprados: [{ id: 'x', itemId: 'leche', itemName: 'leche', qty: 1, unit: 'und', pricePer: 1, supermarket: 'OR' }],
    };
    const conArchivado = items.map((i) => i.id === 'arroz' ? { ...i, active: false } : i);
    const r = sugerirMercado(compras, '2026-10', conArchivado, [lista]);
    expect(r.grupos).toEqual([]);
  });

  it('no usa compras del mes actual ni futuras para sugerir', () => {
    const r = sugerirMercado([compra('arroz', '2026-10', 9), compra('arroz', '2026-11', 9)], '2026-10', items);
    expect(r.grupos).toEqual([]);
  });
});

describe('helpers', () => {
  it('mediana par e impar', () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 6])).toBe(5);
  });

  it('redondeo: unidades hacia arriba, peso a un decimal', () => {
    expect(redondearCantidad(2.5, 'und')).toBe(3);
    expect(redondearCantidad(2, 'paq')).toBe(2);
    expect(redondearCantidad(0.2, 'und')).toBe(1);
    expect(redondearCantidad(1.26, 'lb')).toBe(1.3);
  });
});

describe('aplicarSugerencias', () => {
  const sug = (itemId: string, supermarket: string): Sugerencia =>
    ({ itemId, itemName: itemId, qty: 2, unit: 'und', pricePer: 1000, supermarket, mesesComprado: 2 });

  it('agrega a la lista del mismo supermercado y crea listas para los lugares que no tienen', () => {
    const existente: ListaMercado = { id: 'l1', name: 'Lista D1', supermarket: 'D1', monthKey: '2026-10',
      items: [{ id: 'a', itemId: 'arroz', itemName: 'arroz', qty: 1, unit: 'und', pricePer: 1, supermarket: 'D1' }] };
    const otroMes: ListaMercado = { ...existente, id: 'l0', monthKey: '2026-09', supermarket: 'OR' };
    const { listas, listaIds } = aplicarSugerencias([otroMes, existente], '2026-10',
      [sug('arroz', 'D1'), sug('leche', 'd1'), sug('carne', 'OR')]);
    const d1 = listas.find((l) => l.id === 'l1')!;
    expect(d1.items.map((i) => i.itemId)).toEqual(['arroz', 'leche']); // arroz no se duplica
    const or = listas.find((l) => l.monthKey === '2026-10' && l.supermarket === 'OR')!;
    expect(or.name).toBe('OR');
    expect(or.items.map((i) => [i.itemId, i.qty])).toEqual([['carne', 2]]);
    expect(listas.find((l) => l.id === 'l0')).toEqual(otroMes); // otro mes intacto
    expect(listaIds).toEqual(['l1', or.id]);
  });
});
