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
  if (!mercado || !mercado.compras) return { marcela: 0, jonatan: 0 };

  const marcelaTotal = mercado.compras.reduce((sum, compra) => sum + (compra.marcelaAmount || 0), 0);
  const jonatanTotal = mercado.compras.reduce((sum, compra) => sum + (compra.jonatanAmount || 0), 0);

  return { marcela: marcelaTotal, jonatan: jonatanTotal };
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

  // Gastos del hogar
  const totalFamilyBudget = familyExpenses.reduce((s, c) => s + (c.budget || 0), 0);

  const mercadoTotals = calculateMercadoTotals(mercado);

  const totalFamilyPaidMarcela = familyExpenses.reduce((sum, cat) => {
    if (cat.id === 'mercado') {
      return sum + mercadoTotals.marcela;
    }
    return sum + (cat.marcela || 0);
  }, 0);

  const totalFamilyPaidJonatan = familyExpenses.reduce((sum, cat) => {
    if (cat.id === 'mercado') {
      return sum + mercadoTotals.jonatan;
    }
    return sum + (cat.jonatan || 0);
  }, 0);

  const totalFamilyPaid = totalFamilyPaidMarcela + totalFamilyPaidJonatan;
  const totalFamilyPending = Math.max(0, totalFamilyBudget - totalFamilyPaid);

  // Aporte ideal = proporción del presupuesto total
  const aporteFamiliarMarcela = totalFamilyBudget * ratio.marcela;
  const aporteFamiliarJonatan = totalFamilyBudget * ratio.jonatan;

  // Saldo libre = neto - aporte ideal al hogar - gastos extra propios
  const saldoMarcela = netoMarcela - aporteFamiliarMarcela - extrasTotalMarcela;
  const saldoJonatan = netoJonatan - aporteFamiliarJonatan - extrasTotalJonatan;

  // Balance real: quién pagó de más o de menos respecto al presupuesto total
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
    aporteFamiliarMarcela,
    aporteFamiliarJonatan,
    aportePagadoIdealMarcela: aporteFamiliarMarcela,
    aportePagadoIdealJonatan: aporteFamiliarJonatan,
    saldoMarcela,
    saldoJonatan,
    diffMarcela,
    diffJonatan,
  };
}
