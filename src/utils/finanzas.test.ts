import { describe, it, expect } from 'vitest';
import {
  calculateMercadoTotals,
  computeSummary,
  comprasDelMes,
  asignarMesACompras,
  fechaLocalISO,
  itemsActivos,
  createEmptyMonth,
} from './finanzas';
import { Compra, FamilyExpense, ItemMercado, Mercado } from '../types/models';

const compra = (over: Partial<Compra>): Compra => ({
  id: 'c', itemId: 'i1', itemName: 'Arroz', qty: 1, unit: 'und', pricePer: 1000, total: 1000,
  supermarket: 'D1', date: '2026-09-15', notes: '',
  marcelaAmount: 0, jonatanAmount: 0, conjuntoAmount: 1000, paidBy: 'conjunto',
  monthKey: '2026-09', category: 'Despensa',
  ...over,
});

const mercadoCat: FamilyExpense = {
  id: 'mercado', label: 'Mercado', icon: '🛒', budget: 600000,
  marcela: 0, jonatan: 0, active: true, disableNext: false,
};

describe('compras por mes', () => {
  const mercado: Mercado = {
    items: [],
    compras: [
      compra({ id: 'sep1', monthKey: '2026-09', total: 100000, conjuntoAmount: 100000 }),
      compra({ id: 'sep2', monthKey: '2026-09', total: 50000, conjuntoAmount: 0, marcelaAmount: 50000, paidBy: 'marcela' }),
      compra({ id: 'oct1', monthKey: '2026-10', date: '2026-10-02', total: 80000, conjuntoAmount: 0, jonatanAmount: 80000, paidBy: 'jonatan' }),
    ],
  };

  it('calculateMercadoTotals solo suma las compras del mes pedido', () => {
    expect(calculateMercadoTotals(mercado, '2026-09')).toEqual({ marcela: 50000, jonatan: 0, conjunto: 100000 });
    expect(calculateMercadoTotals(mercado, '2026-10')).toEqual({ marcela: 0, jonatan: 80000, conjunto: 0 });
  });

  it('un mes nuevo sin compras arranca en cero (no arrastra el mes anterior)', () => {
    expect(calculateMercadoTotals(mercado, '2026-11')).toEqual({ marcela: 0, jonatan: 0, conjunto: 0 });
  });

  it('calculateMercadoTotals tolera mercado nulo', () => {
    expect(calculateMercadoTotals(null, '2026-09')).toEqual({ marcela: 0, jonatan: 0, conjunto: 0 });
  });

  it('computeSummary de cada mes usa solo su propio mercado', () => {
    const sep = { ...createEmptyMonth(2026, 9, { marcela: 0, jonatan: 0 }, null, undefined, [mercadoCat]), mercado };
    const oct = { ...createEmptyMonth(2026, 10, { marcela: 0, jonatan: 0 }, null, undefined, [mercadoCat]), mercado };
    expect(computeSummary(sep).totalFamilyPaid).toBe(150000);
    expect(computeSummary(oct).totalFamilyPaid).toBe(80000);
  });

  it('comprasDelMes ignora compras de otros meses', () => {
    expect(comprasDelMes(mercado.compras, '2026-09').map((c) => c.id)).toEqual(['sep1', 'sep2']);
  });
});

describe('asignarMesACompras (migración)', () => {
  const items: ItemMercado[] = [
    { id: 'i1', name: 'Arroz', pricePer: 1000, unit: 'und', supermarket: 'D1', category: 'Despensa' },
  ];

  it('asigna monthKey desde la fecha y la categoría desde el producto', () => {
    const vieja = compra({ monthKey: undefined as unknown as string, category: undefined, date: '2026-08-31' });
    const { compras, changed } = asignarMesACompras([vieja], items, '2026-10');
    expect(changed).toBe(true);
    expect(compras[0].monthKey).toBe('2026-08');
    expect(compras[0].category).toBe('Despensa');
  });

  it('producto ya borrado del catálogo → categoría "Otros"', () => {
    const vieja = compra({ itemId: 'no-existe', monthKey: undefined as unknown as string, category: undefined });
    expect(asignarMesACompras([vieja], items, '2026-10').compras[0].category).toBe('Otros');
  });

  it('fecha vacía o con otro formato → mes de respaldo (nunca "" ni basura)', () => {
    const sinFecha = compra({ id: 'a', date: '', monthKey: undefined as unknown as string });
    const otroFormato = compra({ id: 'b', date: '05/10/2026', monthKey: undefined as unknown as string });
    const { compras } = asignarMesACompras([sinFecha, otroFormato], items, '2026-10');
    expect(compras.map((c) => c.monthKey)).toEqual(['2026-10', '2026-10']);
    // segunda pasada: ya no hay nada que migrar (sin bucle de escrituras)
    expect(asignarMesACompras(compras, items, '2026-10').changed).toBe(false);
  });

  it('no toca compras ya migradas (idempotente) y respeta el mes asignado', () => {
    // Compra hecha el 30/09 pero asignada a octubre: la fecha no debe pisar el mes
    const nueva = compra({ date: '2026-09-30', monthKey: '2026-10' });
    const { compras, changed } = asignarMesACompras([nueva], items, '2026-10');
    expect(changed).toBe(false);
    expect(compras[0]).toBe(nueva);
  });
});

describe('fechaLocalISO', () => {
  it('usa la fecha local, no UTC (30/09 a las 11:30 p.m. sigue siendo 30/09)', () => {
    const d = new Date(2026, 8, 30, 23, 30); // 30 de septiembre, 11:30 p.m. hora local
    expect(fechaLocalISO(d)).toBe('2026-09-30');
  });

  it('rellena mes y día con cero', () => {
    expect(fechaLocalISO(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});

describe('itemsActivos', () => {
  it('oculta productos archivados y conserva los que no tienen el campo', () => {
    const base = { pricePer: 1, unit: 'und', supermarket: 'D1', category: 'Otros' };
    const items: ItemMercado[] = [
      { id: 'a', name: 'A', ...base },
      { id: 'b', name: 'B', ...base, active: false },
      { id: 'c', name: 'C', ...base, active: true },
    ];
    expect(itemsActivos(items).map((i) => i.id)).toEqual(['a', 'c']);
  });
});

describe('createEmptyMonth con mes previo', () => {
  it('arrastra gastos del hogar y personales, con pagos en cero', () => {
    const prev = createEmptyMonth(2026, 9, { marcela: 1, jonatan: 1 }, null,
      { marcela: [{ id: 1, desc: 'Celular', amount: 50000, day: 5, paid: true, icon: '📱' }], jonatan: [] },
      [{ ...mercadoCat, marcela: 300000 }]);
    const next = createEmptyMonth(2026, 10, prev.salaries, prev);
    expect(next.familyExpenses).toHaveLength(1);
    expect(next.familyExpenses[0].marcela).toBe(0);
    expect(next.personalExpenses.marcela[0].desc).toBe('Celular');
    expect(next.personalExpenses.marcela[0].paid).toBe(false);
  });
});
