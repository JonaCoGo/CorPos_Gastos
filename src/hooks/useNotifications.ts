import { useEffect, useRef } from 'react';
import { MonthData, Mercado } from '../types/models';
import { COP, calculateMercadoTotals } from '../utils/finanzas';

const STORAGE_KEY = 'corpos_notif_last_check';
const NOTIF_ENABLED_KEY = 'corpos_notif_enabled';

export function getNotifEnabled(): boolean {
  return localStorage.getItem(NOTIF_ENABLED_KEY) !== 'false';
}

export function setNotifEnabled(val: boolean) {
  localStorage.setItem(NOTIF_ENABLED_KEY, val ? 'true' : 'false');
}

export async function requestNotifPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

function notify(title: string, body: string, tag: string) {
  if (Notification.permission !== 'granted') return;
  if (!getNotifEnabled()) return;
  new Notification(title, { body, tag, icon: '/icon.svg', badge: '/icon.svg' });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type FamilyExpense = MonthData['familyExpenses'][number];

export function useNotifications(monthData: MonthData | null, mercado: Mercado | null, permission?: NotificationPermission) {
  const checked = useRef(false);

  useEffect(() => {
    if (permission === 'granted') checked.current = false;
  }, [permission]);

  useEffect(() => {
    if (!monthData) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!getNotifEnabled()) return;
    if (checked.current) return;

    const lastCheck = localStorage.getItem(STORAGE_KEY);
    const today = todayKey();
    if (lastCheck === today) return;

    checked.current = true;
    localStorage.setItem(STORAGE_KEY, today);

    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const allPersonal = [
      ...(monthData.personalExpenses?.marcela || []),
      ...(monthData.personalExpenses?.jonatan || []),
    ];
    const overdue = allPersonal.filter(
      (expense) => expense.active !== false && !expense.paid && expense.day != null && expense.day <= dayOfMonth
    );

    if (overdue.length === 1) {
      notify('💸 Gasto pendiente', `${overdue[0].icon || '💰'} ${overdue[0].desc} — ${COP(overdue[0].amount)}`, 'personal-overdue');
    } else if (overdue.length > 1) {
      notify('💸 Gastos pendientes', `Tenés ${overdue.length} gastos personales sin pagar este mes`, 'personal-overdue');
    }

    const mercadoTotals = calculateMercadoTotals(mercado);
    const getFamilyPaidAmount = (expense: FamilyExpense) => {
      if (expense.id === 'mercado') {
        return mercadoTotals.marcela + mercadoTotals.jonatan + mercadoTotals.conjunto;
      }
      return (expense.marcela || 0) + (expense.jonatan || 0) + (expense.conjunto || 0);
    };
    const isFamilyCovered = (expense: FamilyExpense) => {
      const expected = expense.monthlyAmount ?? expense.budget ?? 0;
      return expected <= 0 || getFamilyPaidAmount(expense) >= expected;
    };

    const activeFamilyExpenses = (monthData.familyExpenses || []).filter((expense) => expense.active !== false);
    const familyUnpaid = activeFamilyExpenses.filter((expense) => !isFamilyCovered(expense));
    if (familyUnpaid.length > 0) {
      const totalUnpaid = familyUnpaid.reduce((sum, expense) => {
        const expected = expense.monthlyAmount ?? expense.budget ?? 0;
        return sum + Math.max(0, expected - getFamilyPaidAmount(expense));
      }, 0);
      notify('🏠 Hogar pendiente', `${familyUnpaid.length} gasto${familyUnpaid.length > 1 ? 's' : ''} del hogar por pagar — ${COP(totalUnpaid)}`, 'family-unpaid');
    }

    if (new Date().getDay() === 0) {
      const familyPaid = activeFamilyExpenses.filter(isFamilyCovered);
      const pctFamily = activeFamilyExpenses.length
        ? Math.round((familyPaid.length / activeFamilyExpenses.length) * 100)
        : 0;
      notify('📊 Resumen semanal', `Hogar: ${pctFamily}% pagado. ${overdue.length > 0 ? `${overdue.length} personales pendientes.` : 'Personales al día ✅'}`, 'weekly');
    }

    if (dayOfMonth >= daysInMonth - 2) {
      const allPaid = familyUnpaid.length === 0 && overdue.length === 0;
      notify(
        '📅 Cierre de mes',
        allPaid ? '¡Todo pagado! Podés cerrar el mes cuando quieras.' : 'Quedan gastos pendientes antes de cerrar el mes.',
        'month-end'
      );
    }
  }, [monthData, mercado]);
}
