import { describe, it, expect } from 'vitest';
import {
  listasDelMes,
  crearLista,
  mesAnteriorConListas,
  copiarListasMesAnterior,
  quitarComprados,
  listasPorCopiar,
  migrarListaUnica,
} from './listas';
import { ListaItem, ListaMercado } from '../types/models';

const li = (itemId: string, qty = 1): ListaItem => ({
  id: `li_${itemId}`, itemId, itemName: itemId, qty, unit: 'und', pricePer: 1000, supermarket: 'D1',
});

const lista = (name: string, monthKey: string, items: ListaItem[] = []): ListaMercado =>
  ({ ...crearLista(name, 'D1', monthKey, items) });

describe('listas por mes', () => {
  const listas = [
    lista('OR', '2026-09', [li('arroz', 2), li('leche')]),
    lista('D1', '2026-09', [li('jabon')]),
    lista('OR', '2026-10', [li('huevos')]),
  ];

  it('listasDelMes filtra por mes', () => {
    expect(listasDelMes(listas, '2026-09').map((l) => l.name)).toEqual(['OR', 'D1']);
    expect(listasDelMes(listas, '2026-11')).toEqual([]);
  });

  it('mesAnteriorConListas toma el mes más reciente anterior con listas', () => {
    expect(mesAnteriorConListas(listas, '2026-11')).toBe('2026-10');
    expect(mesAnteriorConListas(listas, '2026-10')).toBe('2026-09');
    expect(mesAnteriorConListas(listas, '2026-09')).toBeNull();
  });

  it('copiar listas del mes anterior crea copias con ids nuevos y cantidades', () => {
    const res = copiarListasMesAnterior(listas.slice(0, 2), '2026-10');
    const oct = listasDelMes(res, '2026-10');
    expect(oct.map((l) => l.name)).toEqual(['OR', 'D1']);
    expect(oct[0].items.map((i) => [i.itemId, i.qty])).toEqual([['arroz', 2], ['leche', 1]]);
    expect(oct[0].id).not.toBe(listas[0].id);
    // el mes de origen queda intacto
    expect(listasDelMes(res, '2026-09')).toHaveLength(2);
  });

  it('copiar trae la lista completa aunque el mes anterior ya se haya comprado todo', () => {
    const sep = quitarComprados(lista('OR', '2026-09', [li('arroz', 2), li('leche')]), ['arroz', 'leche']);
    expect(sep.items).toHaveLength(0);
    const oct = listasDelMes(copiarListasMesAnterior([sep], '2026-10'), '2026-10');
    expect(oct[0].items.map((i) => [i.itemId, i.qty])).toEqual([['arroz', 2], ['leche', 1]]);
    expect(oct[0].comprados).toBeUndefined();
  });

  it('sin nada por copiar devuelve el mismo arreglo (no escribe en Firestore)', () => {
    expect(listasPorCopiar(listas, '2026-10').map((l) => l.name)).toEqual(['D1']);
    const yaCopiadas = copiarListasMesAnterior(listas, '2026-10');
    expect(copiarListasMesAnterior(yaCopiadas, '2026-10')).toBe(yaCopiadas);
  });

  it('copiar no duplica una lista que ya existe con el mismo nombre en el mes', () => {
    const res = copiarListasMesAnterior(listas, '2026-10');
    expect(listasDelMes(res, '2026-10').map((l) => l.name)).toEqual(['OR', 'D1']);
  });
});

describe('quitarComprados', () => {
  it('solo quita lo comprado; lo demás queda pendiente y lo comprado se recuerda', () => {
    const l = lista('OR', '2026-10', [li('arroz'), li('leche'), li('pan')]);
    const r = quitarComprados(l, ['arroz', 'pan']);
    expect(r.items.map((i) => i.itemId)).toEqual(['leche']);
    expect(r.comprados!.map((i) => i.itemId)).toEqual(['arroz', 'pan']);
  });

  it('producto en el carrito que no estaba en la lista no se agrega a comprados', () => {
    const r = quitarComprados(lista('OR', '2026-10', [li('arroz')]), ['arroz', 'chocolate']);
    expect(r.comprados!.map((i) => i.itemId)).toEqual(['arroz']);
  });
});

describe('migrarListaUnica', () => {
  it('convierte la lista única en una lista del mes activo y elimina el campo viejo', () => {
    const { mercado, changed } = migrarListaUnica({ items: [], compras: [], lista: [li('arroz')] }, '2026-10');
    expect(changed).toBe(true);
    expect(mercado.lista).toBeUndefined();
    expect(mercado.listas).toHaveLength(1);
    expect(mercado.listas![0]).toMatchObject({ name: 'Lista', monthKey: '2026-10', supermarket: 'D1' });
  });

  it('un celular desactualizado que reescribe la lista vieja se fusiona, no duplica', () => {
    const primera = migrarListaUnica({ items: [], compras: [], lista: [li('arroz')] }, '2026-10').mercado;
    const otraVez = migrarListaUnica({ ...primera, lista: [li('arroz'), li('pan')] }, '2026-10').mercado;
    expect(otraVez.listas).toHaveLength(1);
    expect(otraVez.listas![0].items.map((i) => i.itemId)).toEqual(['arroz', 'pan']);
  });

  it('lista vacía: solo quita el campo viejo', () => {
    const { mercado } = migrarListaUnica({ items: [], compras: [], lista: [] }, '2026-10');
    expect(mercado.lista).toBeUndefined();
    expect(mercado.listas).toEqual([]);
  });

  it('sin campo viejo no cambia nada (idempotente)', () => {
    const m = { items: [], compras: [], listas: [] };
    expect(migrarListaUnica(m, '2026-10')).toEqual({ mercado: m, changed: false });
  });
});
