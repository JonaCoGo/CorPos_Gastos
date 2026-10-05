// Aislamiento entre meses: lo que se crea, edita o borra en un mes nunca debe
// cambiar los meses anteriores. Los meses nuevos heredan del mes anterior.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebase', () => ({ db: null }));

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
});

const { useAppStore } = await import('./useAppStore');
const { createEmptyMonth, calculateMercadoTotals } = await import('../utils/finanzas');
import type { AppData, Compra, FamilyExpense, MonthData } from '../types/models';

const arriendo: FamilyExpense = { id: 'arriendo', label: 'Arriendo', icon: '🏠', budget: 800000, marcela: 0, jonatan: 800000, active: true, disableNext: false };
const mercadoCat: FamilyExpense = { id: 'mercado', label: 'Mercado', icon: '🛒', budget: 600000, marcela: 0, jonatan: 0, active: true, disableNext: false };

const compra = (id: string, monthKey: string, total: number): Compra => ({
  id, itemId: 'arroz', itemName: 'Arroz', qty: 1, unit: 'und', pricePer: total, total, supermarket: 'D1',
  date: `${monthKey}-10`, notes: '', marcelaAmount: 0, jonatanAmount: 0, conjuntoAmount: total, paidBy: 'conjunto',
  monthKey, category: 'Despensa',
});

function datosBase(): AppData {
  const sep = createEmptyMonth(2026, 9, { marcela: 1, jonatan: 1 }, null,
    { marcela: [{ id: 1, desc: 'Celular', amount: 50000, day: 5, paid: true, icon: '📱' }], jonatan: [] },
    [arriendo, mercadoCat]);
  sep.familyExpenses = sep.familyExpenses.map((c) => c.id === 'arriendo' ? { ...c, jonatan: 800000 } : c);
  sep.extras = [{ id: 'e1', person: 'marcela', amount: 20000, category: 'Mecato', desc: 'Helado', date: '2026-09-03' }];
  const oct = createEmptyMonth(2026, 10, sep.salaries, sep);
  return {
    months: { '2026-09': sep, '2026-10': oct },
    currentKey: '2026-10',
    mercado: {
      items: [],
      compras: [compra('s1', '2026-09', 300000), compra('o1', '2026-10', 100000)],
      listas: [
        { id: 'ls', name: 'OR', supermarket: 'OR', monthKey: '2026-09', items: [] },
        { id: 'lo', name: 'OR', supermarket: 'OR', monthKey: '2026-10', items: [] },
      ],
    },
    config: { marcelaName: 'M', jonatanName: 'J', paymentMethods: [], supermarkets: ['D1'] },
  };
}

const st = () => useAppStore.getState();
const mes = (k: string) => st().data.months[k] as MonthData;

describe('aislamiento entre meses', () => {
  let septiembreOriginal: string;

  beforeEach(() => {
    store.clear();
    useAppStore.setState({ data: datosBase(), familyId: null });
    septiembreOriginal = JSON.stringify(mes('2026-09'));
  });

  it('agregar un gasto del hogar en octubre no aparece en septiembre', () => {
    const oct = mes('2026-10');
    st().updateMonth({ ...oct, familyExpenses: [...oct.familyExpenses, { ...arriendo, id: 'gym', label: 'Gimnasio' }] });
    expect(mes('2026-10').familyExpenses.map((c) => c.id)).toContain('gym');
    expect(JSON.stringify(mes('2026-09'))).toBe(septiembreOriginal);
  });

  it('borrar un gasto del hogar en octubre no lo borra de septiembre', () => {
    const oct = mes('2026-10');
    st().updateMonth({ ...oct, familyExpenses: oct.familyExpenses.filter((c) => c.id !== 'arriendo') });
    expect(mes('2026-10').familyExpenses.map((c) => c.id)).not.toContain('arriendo');
    expect(JSON.stringify(mes('2026-09'))).toBe(septiembreOriginal);
  });

  it('editar o borrar gastos personales y extras en octubre no toca septiembre', () => {
    const oct = mes('2026-10');
    st().updateMonth({
      ...oct,
      personalExpenses: { ...oct.personalExpenses, marcela: oct.personalExpenses.marcela.map((e) => ({ ...e, amount: 99, paid: true })) },
      extras: [],
      salaries: { marcela: 5, jonatan: 5 },
    });
    expect(mes('2026-10').personalExpenses.marcela[0].amount).toBe(99);
    expect(JSON.stringify(mes('2026-09'))).toBe(septiembreOriginal);
  });

  it('borrar las compras de octubre deja intacto el mercado de septiembre', () => {
    const m = st().data.mercado;
    st().updateMercado({ ...m, compras: m.compras.filter((c) => c.monthKey !== '2026-10') });
    expect(calculateMercadoTotals(st().data.mercado, '2026-09').conjunto).toBe(300000);
    expect(calculateMercadoTotals(st().data.mercado, '2026-10').conjunto).toBe(0);
  });

  it('un mes nuevo hereda los gastos del mes anterior (con pagos en cero), no los de meses viejos', () => {
    const oct = mes('2026-10');
    st().updateMonth({ ...oct, familyExpenses: [...oct.familyExpenses, { ...arriendo, id: 'gym', label: 'Gimnasio', jonatan: 70000 }] });
    st().selectMonth('2026-09'); // aunque se esté viendo septiembre…
    st().addMonth(2026, 11, { marcela: 1, jonatan: 1 });
    const nov = mes('2026-11');
    expect(nov.familyExpenses.map((c) => c.id)).toContain('gym'); // …hereda de octubre
    expect(nov.familyExpenses.every((c) => c.marcela === 0 && c.jonatan === 0)).toBe(true);
    expect(nov.extras).toEqual([]);
    expect(calculateMercadoTotals(st().data.mercado, '2026-11').conjunto).toBe(0);
    expect(JSON.stringify(mes('2026-09'))).toBe(septiembreOriginal);
  });

  it('editar el mes nuevo no cambia el mes del que heredó', () => {
    st().addMonth(2026, 11, { marcela: 1, jonatan: 1 });
    const octAntes = JSON.stringify(mes('2026-10'));
    const nov = mes('2026-11');
    st().updateMonth({ ...nov, familyExpenses: nov.familyExpenses.map((c) => ({ ...c, label: 'cambiado', budget: 1 })) });
    expect(JSON.stringify(mes('2026-10'))).toBe(octAntes);
  });

  it('eliminar octubre borra solo sus datos (incluido su mercado) y activa el mes más reciente', () => {
    st().deleteMonth('2026-10');
    expect(st().data.months['2026-10']).toBeUndefined();
    expect(st().data.currentKey).toBe('2026-09');
    expect(st().data.mercado.compras.map((c) => c.id)).toEqual(['s1']);
    expect(st().data.mercado.listas!.map((l) => l.id)).toEqual(['ls']);
    expect(JSON.stringify(mes('2026-09'))).toBe(septiembreOriginal);
  });

  it('eliminar un mes que no es el activo no cambia el mes activo', () => {
    st().deleteMonth('2026-09');
    expect(st().data.currentKey).toBe('2026-10');
    expect(st().data.mercado.compras.map((c) => c.id)).toEqual(['o1']);
  });
});
