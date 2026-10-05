import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebase', () => ({ db: null }));

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
});

const { importarBackup, createInitialData } = await import('./firestore');
const { familyStorageKey } = await import('../constants');

describe('importarBackup', () => {
  beforeEach(() => store.clear());

  it('rechaza un JSON que no es un backup de la app', async () => {
    await expect(importarBackup({ hola: 1 }, 'fam1', createInitialData())).rejects.toThrow('Formato inválido');
    await expect(importarBackup(null, 'fam1', createInitialData())).rejects.toThrow('Formato inválido');
    expect(store.size).toBe(0);
  });

  it('guarda el backup en el espacio de la familia, migrado al modelo actual', async () => {
    const viejo = {
      months: { '2026-09': { key: '2026-09', year: 2026, month: 9 } },
      currentKey: '2026-09',
      mercado: {
        items: [{ id: 'i1', name: 'Arroz', pricePer: 1000, unit: 'und', supermarket: 'D1', category: 'Despensa' }],
        compras: [{ id: 'c1', itemId: 'i1', itemName: 'Arroz', qty: 1, unit: 'und', pricePer: 1000, total: 1000, supermarket: 'D1', date: '2026-09-10', notes: '', marcelaAmount: 0, jonatanAmount: 0, conjuntoAmount: 1000 }],
        lista: [{ id: 'l1', itemId: 'i1', itemName: 'Arroz', qty: 2, unit: 'und', pricePer: 1000, supermarket: 'D1' }],
      },
    };
    await importarBackup(viejo, 'fam1', createInitialData());
    const guardado = JSON.parse(store.get(familyStorageKey('fam1'))!);
    expect(guardado.mercado.compras[0].monthKey).toBe('2026-09');
    expect(guardado.mercado.lista).toBeUndefined();
    expect(guardado.mercado.listas[0].items[0].itemId).toBe('i1');
    expect(guardado.config).toBeDefined();
  });
});
