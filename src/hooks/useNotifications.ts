import { useEffect, useRef } from 'react';
import { MonthData, Mercado } from '../types/models';
import { COP } from '../utils/finanzas';

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

export function useNotifications(monthData: MonthData | null, _mercado: Mercado | null) {
  const checked = useRef(false);

  useEffect(() => {
    if (!monthData) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!getNotifEnabled()) return;
    if (checked.current) return;

    const lastCheck = localStorage.getItem(STORAGE_KEY);
    const today = todayKey();
    if (lastCheck === today) return; // ya se revisó hoy

    checked.current = true;
    localStorage.setItem(STORAGE_KEY, today);

    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    // Gastos personales sin pagar cuyo día ya pasó o es hoy
    const allPersonal = [
      ...( monthData.personalExpenses?.marcela || []),
      ...( monthData.personalExpenses?.jonatan || []),
    ];
    const overdue = allPersonal.filter(
      (e) => e.active !== false && !e.paid && e.day != null && (e.day as number) <= dayOfMonth
    );
    if (overdue.length === 1) {
      notify('💸 Gasto pendiente', `${overdue[0].icon || '💰'} ${overdue[0].desc} — ${COP(overdue[0].amount)}`, 'personal-overdue');
    } else if (overdue.length > 1) {
      notify('💸 Gastos pendientes', `Tenés ${overdue.length} gastos personales sin pagar este mes`, 'personal-overdue');
    }

    // Gastos del hogar sin pagar
    const familyUnpaid = (monthData.familyExpenses || []).filter((e) => !e.paid);
    if (familyUnpaid.length > 0) {
      const totalUnpaid = familyUnpaid.reduce((s, e) => s + (e.marcela || 0) + (e.jonatan || 0), 0);
      notify('🏠 Hogar pendiente', `${familyUnpaid.length} gasto${familyUnpaid.length > 1 ? 's' : ''} del hogar por pagar — ${COP(totalUnpaid)}`, 'family-unpaid');
    }

    // Resumen semanal — domingo
    if (new Date().getDay() === 0) {
      const familyPaid = (monthData.familyExpenses || []).filter((e) => e.paid);
      const pctFamily = monthData.familyExpenses?.length
        ? Math.round((familyPaid.length / monthData.familyExpenses.length) * 100)
        : 0;
      notify('📊 Resumen semanal', `Hogar: ${pctFamily}% pagado. ${overdue.length > 0 ? `${overdue.length} personales pendientes.` : 'Personales al día ✅'}`, 'weekly');
    }

    // Recordatorio cierre de mes — últimos 3 días
    if (dayOfMonth >= daysInMonth - 2) {
      const allPaid = familyUnpaid.length === 0 && overdue.length === 0;
      notify(
        '📅 Cierre de mes',
        allPaid ? '¡Todo pagado! Podés cerrar el mes cuando quieras.' : 'Quedan gastos pendientes antes de cerrar el mes.',
        'month-end'
      );
    }
  }, [monthData, checked]);
}
