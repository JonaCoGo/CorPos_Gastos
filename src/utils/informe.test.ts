import { describe, it, expect } from 'vitest';
import { informeMercado, mesesDeComparacion } from './informe';
import { Compra } from '../types/models';

let n = 0;
const compra = (monthKey: string, category: string, total: number, over: Partial<Compra> = {}): Compra => ({
  id: `c${n++}`, itemId: `i_${category}`, itemName: category, qty: 1, unit: 'und', pricePer: total, total,
  supermarket: 'D1', date: `${monthKey}-10`, notes: '',
  marcelaAmount: 0, jonatanAmount: 0, conjuntoAmount: total, paidBy: 'conjunto',
  monthKey, category,
  ...over,
});

describe('informeMercado', () => {
  const compras = [
    compra('2026-07', 'Carnes y proteínas', 100000),
    compra('2026-08', 'Carnes y proteínas', 200000),
    compra('2026-09', 'Carnes y proteínas', 300000),
    compra('2026-09', 'Frutas', 40000),
    compra('2026-10', 'Carnes y proteínas', 150000, { supermarket: 'OR' }),
    compra('2026-10', 'Frutas', 30000),
    compra('2026-10', 'Verduras', 20000),
  ];

  it('suma solo el mes pedido y calcula la participación por categoría', () => {
    const inf = informeMercado(compras, '2026-10');
    expect(inf.total).toBe(200000);
    expect(inf.porCategoria.map((f) => [f.nombre, f.total, f.pct])).toEqual([
      ['Carnes y proteínas', 150000, 75],
      ['Frutas', 30000, 15],
      ['Verduras', 20000, 10],
    ]);
  });

  it('compara contra el promedio de los últimos 3 meses con compras', () => {
    const inf = informeMercado(compras, '2026-10');
    expect(inf.mesesComparados).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(inf.promedioAnterior).toBeCloseTo(640000 / 3);
    const carnes = inf.porCategoria[0];
    expect(carnes.promedioAnterior).toBe(200000);
    expect(carnes.variacionPct).toBe(-25);
    // categoría que antes no se compraba: promedio 0, sin variación calculable
    const verduras = inf.porCategoria[2];
    expect(verduras.promedioAnterior).toBe(0);
    expect(verduras.variacionPct).toBeNull();
  });

  it('primer mes con compras: sin meses de comparación', () => {
    const inf = informeMercado(compras, '2026-07');
    expect(inf.mesesComparados).toEqual([]);
    expect(inf.promedioAnterior).toBeNull();
    expect(inf.porCategoria[0].variacionPct).toBeNull();
  });

  it('mes sin compras: total cero y listas vacías', () => {
    const inf = informeMercado(compras, '2026-11');
    expect(inf.total).toBe(0);
    expect(inf.porCategoria).toEqual([]);
    expect(inf.viajes).toBe(0);
  });

  it('agrupa por supermercado y cuenta viajes (fecha + lugar)', () => {
    const inf = informeMercado(compras, '2026-10');
    expect(inf.porSupermercado.map((f) => [f.nombre, f.total])).toEqual([['OR', 150000], ['D1', 50000]]);
    expect(inf.viajes).toBe(2);
  });

  it('compras sin categoría van a "Otros"', () => {
    const inf = informeMercado([compra('2026-10', '', 5000, { category: undefined })], '2026-10');
    expect(inf.porCategoria[0].nombre).toBe('Otros');
  });
});

describe('cambios de precio', () => {
  const precio = (monthKey: string, date: string, pricePer: number, unit = 'lb') =>
    compra(monthKey, 'Verduras', pricePer, { itemId: 'tomate', itemName: 'Tomate', pricePer, unit, date });

  it('compara el último precio del mes con el último precio anterior, misma unidad', () => {
    const inf = informeMercado([
      precio('2026-08', '2026-08-05', 2000),
      precio('2026-09', '2026-09-05', 2500),
      precio('2026-10', '2026-10-02', 2600),
      precio('2026-10', '2026-10-20', 3000),
    ], '2026-10');
    expect(inf.cambiosPrecio).toEqual([
      { itemId: 'tomate', nombre: 'Tomate', unit: 'lb', precioAnterior: 2500, precioActual: 3000, variacionPct: 20 },
    ]);
  });

  it('no compara precios en unidades distintas ni precios iguales', () => {
    expect(informeMercado([precio('2026-09', '2026-09-05', 2500, 'und'), precio('2026-10', '2026-10-05', 3000)], '2026-10').cambiosPrecio).toEqual([]);
    expect(informeMercado([precio('2026-09', '2026-09-05', 2500), precio('2026-10', '2026-10-05', 2500)], '2026-10').cambiosPrecio).toEqual([]);
  });
});

describe('mesesDeComparacion', () => {
  it('toma los N meses anteriores más recientes, saltando meses sin compras', () => {
    const c = ['2026-03', '2026-05', '2026-06', '2026-08', '2026-10'].map((m) => compra(m, 'Frutas', 1));
    expect(mesesDeComparacion(c, '2026-10')).toEqual(['2026-05', '2026-06', '2026-08']);
  });
});
