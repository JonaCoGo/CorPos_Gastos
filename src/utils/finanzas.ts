// ==========================================
// LÓGICA DE NEGOCIO PURA (FINANZAS)
// Este archivo contiene SOLO funciones matemáticas y de negocio.
// NO contiene UI, NO contiene React, NO contiene Firebase.
// Es 100% reutilizable en la futura app de React Native.
// ==========================================

import {
  MonthData,
  Mercado,
  ResumenFinanciero,
  MercadoTotals,
  FamilyExpense,
  PersonalExpense,
  Salarios,
} from '../types/models';

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
export const COP = (n: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0);

// ─── ENTRADA DECIMAL FLEXIBLE ─────────────────────────────────────────────────
// El teclado numérico de Android en locale es-CO suele mostrar "," como separador
// decimal y bloquea el "." (o viceversa según el teclado). Estas funciones aceptan
// ambos separadores en los inputs de texto para que no se pierda lo que se escribe
// (ej. el peso que marca la báscula: 1.250 lb o 1,250 lb).
export function sanitizeDecimalInput(raw: string): string {
  let v = raw.replace(",", ".");
  v = v.replace(/[^0-9.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  return v;
}

export function parseFlexibleNumber(raw: string): number {
  const n = Number(sanitizeDecimalInput(raw));
  return Number.isFinite(n) ? n : 0;
}

// ─── CONVERSIÓN DE UNIDADES DE PESO ───────────────────────────────────────────
// 1 libra = 500 g — convención de plaza/supermercado en Colombia (no la libra
// científica de 453.6 g), que es como Jonatan y Marcela pesan y cobran en la
// práctica. Permite pesar en la unidad que marque la báscula (kg, lb o gr) y
// convertir al precio por unidad configurado en el producto (ej. $/lb).
const WEIGHT_UNIT_TO_GRAMS: Record<string, number> = { kg: 1000, lb: 500, gr: 1 };

export function convertQty(qty: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return qty;
  const fromG = WEIGHT_UNIT_TO_GRAMS[fromUnit];
  const toG = WEIGHT_UNIT_TO_GRAMS[toUnit];
  if (!fromG || !toG) return qty;
  return (qty * fromG) / toG;
}

// ─── HELPERS DE FECHA ─────────────────────────────────────────────────────────
export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ─── CREAR MES VACÍO ──────────────────────────────────────────────────────────
export function createEmptyMonth(
  year: number,
  month: number,
  salaries: Salarios = { marcela: 0, jonatan: 0 },
  prevMonth: MonthData | null = null,
  defaultPersonalExpenses: Record<string, PersonalExpense[]> = { marcela: [], jonatan: [] },
  defaultFamilyCategories: FamilyExpense[] = []
): MonthData {
  const carryPersonal = (person: 'marcela' | 'jonatan'): PersonalExpense[] => {
    const prev = prevMonth?.personalExpenses?.[person] || defaultPersonalExpenses[person];
    return prev.map((e) => ({
      ...e,
      paid: false,
      disableNext: false,
      active: e.disableNext ? false : true,
    }));
  };

  const carryFamily = (): FamilyExpense[] => {
    const prev = prevMonth?.familyExpenses || defaultFamilyCategories;
    return prev.map((c) => ({
      ...c,
      marcela: 0,
      jonatan: 0,
      conjunto: 0,
      monthlyAmount: undefined,
      disableNext: false,
      active: c.disableNext ? false : true,
    }));
  };

  return {
    key: getMonthKey(year, month),
    year,
    month,
    salaries: { ...salaries },
    familyExpenses: prevMonth
      ? carryFamily()
      : defaultFamilyCategories.map((c) => ({ ...c, marcela: 0, jonatan: 0, active: true, disableNext: false })),
    personalExpenses: {
      jonatan: carryPersonal('jonatan'),
      marcela: carryPersonal('marcela'),
    },
    extras: [],
  };
}

// ─── CALCULAR TOTALES DE MERCADO ──────────────────────────────────────────────
export function calculateMercadoTotals(mercado: Mercado | null | undefined): MercadoTotals {
  if (!mercado || !mercado.compras) return { marcela: 0, jonatan: 0, conjunto: 0 };

  const marcela  = mercado.compras.reduce((s, c) => s + (c.marcelaAmount  || 0), 0);
  const jonatan  = mercado.compras.reduce((s, c) => s + (c.jonatanAmount  || 0), 0);
  const conjunto = mercado.compras.reduce((s, c) => s + (c.conjuntoAmount || 0), 0);

  return { marcela, jonatan, conjunto };
}

// ─── COMPUTAR RESUMEN FINANCIERO ──────────────────────────────────────────────
// salaries = salario BRUTO de cada uno
// neto = bruto - suma de gastos personales fijos registrados
// Aporte al hogar se reparte proporcionalmente al neto
// Saldo libre = neto - aporte proporcional al hogar
export function computeSummary(monthData: MonthData & { mercado?: Mercado }): ResumenFinanciero {
  const { salaries, familyExpenses, personalExpenses, mercado } = monthData;
  const extras = monthData.extras || [];

  const personalTotalMarcela = (personalExpenses?.marcela || []).reduce((s, e) => s + (e.amount || 0), 0);
  const personalTotalJonatan = (personalExpenses?.jonatan || []).reduce((s, e) => s + (e.amount || 0), 0);

  const extrasTotalMarcela = extras.filter((e) => e.person === 'marcela').reduce((s, e) => s + (e.amount || 0), 0);
  const extrasTotalJonatan = extras.filter((e) => e.person === 'jonatan').reduce((s, e) => s + (e.amount || 0), 0);

  // Neto = bruto - personales
  const netoMarcela = Math.max(0, (salaries.marcela || 0) - personalTotalMarcela);
  const netoJonatan = Math.max(0, (salaries.jonatan || 0) - personalTotalJonatan);
  const totalNeto = netoMarcela + netoJonatan;

  // Proporción de aporte de cada uno según su neto
  const ratio = totalNeto > 0
    ? { marcela: netoMarcela / totalNeto, jonatan: netoJonatan / totalNeto }
    : { marcela: 0.5, jonatan: 0.5 };

  // Gastos del hogar — usa monthlyAmount como override del budget cuando está definido
  const totalFamilyBudget = familyExpenses.reduce((s, c) => s + (c.monthlyAmount ?? c.budget ?? 0), 0);

  const mercadoTotals = calculateMercadoTotals(mercado);

  const totalFamilyPaidMarcela = familyExpenses.reduce((sum, cat) => {
    if (cat.id === 'mercado') return sum + mercadoTotals.marcela;
    return sum + (cat.marcela || 0);
  }, 0);

  const totalFamilyPaidJonatan = familyExpenses.reduce((sum, cat) => {
    if (cat.id === 'mercado') return sum + mercadoTotals.jonatan;
    return sum + (cat.jonatan || 0);
  }, 0);

  const totalFamilyPaidConjunto = familyExpenses.reduce((sum, cat) => {
    if (cat.id === 'mercado') return sum + mercadoTotals.conjunto;
    return sum + (cat.conjunto || 0);
  }, 0);

  // Aportes al fondo conjunto — cuentan directamente como pago al hogar por cada persona
  const transferencias = monthData.fondoConjunto?.transferencias ?? [];
  const aporteFondoMarcela = transferencias.filter(t => t.persona === 'marcela').reduce((s, t) => s + t.monto, 0);
  const aporteFondoJonatan = transferencias.filter(t => t.persona === 'jonatan').reduce((s, t) => s + t.monto, 0);

  // El pago total de cada persona incluye lo que metió al fondo (para calcular su faltante individual)
  const pagoTotalMarcela = totalFamilyPaidMarcela + aporteFondoMarcela;
  const pagoTotalJonatan = totalFamilyPaidJonatan + aporteFondoJonatan;
  // totalFamilyPaid = solo lo que se gastó realmente (directo + gastado del fondo)
  // los depósitos al fondo NO cuentan como pagado hasta que se gasten
  const totalFamilyPaid = totalFamilyPaidMarcela + totalFamilyPaidJonatan + totalFamilyPaidConjunto;
  const totalFamilyPending = Math.max(0, totalFamilyBudget - totalFamilyPaid);

  // Obligación ideal por persona sobre el presupuesto total
  const portionIndividual = totalFamilyBudget;
  const aporteFamiliarMarcela = portionIndividual * ratio.marcela;
  const aporteFamiliarJonatan = portionIndividual * ratio.jonatan;

  // Saldo del fondo = total depositado - total gastado como "conjunto"
  const saldoFondo = (aporteFondoMarcela + aporteFondoJonatan) - totalFamilyPaidConjunto;

  // Saldo libre = neto − obligación ideal al hogar − extras
  // El fondo es el mecanismo de pago, no una deducción adicional
  const saldoMarcela = netoMarcela - aporteFamiliarMarcela - extrasTotalMarcela;
  const saldoJonatan = netoJonatan - aporteFamiliarJonatan - extrasTotalJonatan;

  const diffMarcela = totalFamilyPaidMarcela - aporteFamiliarMarcela;
  const diffJonatan = totalFamilyPaidJonatan - aporteFamiliarJonatan;

  return {
    ratio,
    totalNeto,
    netoMarcela,
    netoJonatan,
    personalTotalMarcela,
    personalTotalJonatan,
    extrasTotalMarcela,
    extrasTotalJonatan,
    totalFamilyBudget,
    totalFamilyPaid,
    totalFamilyPending,
    totalFamilyPaidMarcela,
    totalFamilyPaidJonatan,
    totalFamilyPaidConjunto,
    aporteFamiliarMarcela,
    aporteFamiliarJonatan,
    aportePagadoIdealMarcela: aporteFamiliarMarcela,
    aportePagadoIdealJonatan: aporteFamiliarJonatan,
    saldoMarcela,
    saldoJonatan,
    diffMarcela,
    diffJonatan,
    aporteFondoMarcela,
    aporteFondoJonatan,
    pagoTotalMarcela,
    pagoTotalJonatan,
    saldoFondo,
  };
}
