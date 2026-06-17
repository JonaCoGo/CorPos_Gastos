import { create } from 'zustand';
import { AppData, MonthData, Mercado, AppConfig } from '../types/models';
import { loadData, saveData, subscribeToFirestore } from '../services/firestore';
import { createEmptyMonth, getMonthKey } from '../utils/finanzas';

/**
 * Store Global de la Aplicación (Zustand)
 * Centraliza todo el estado (data, tab, synced) y las acciones para modificarlo.
 * Cada acción que modifica `data` automáticamente llama a `saveData` para persistir.
 */
interface AppState {
  // ── Estado ──────────────────────────────────────────────────────────────────
  data: AppData;
  tab: string;
  synced: boolean;

  // ── Acciones de UI ──────────────────────────────────────────────────────────
  setTab: (tab: string) => void;

  // ── Acciones de Datos (modifican estado + persisten) ────────────────────────
  updateMercado: (mercado: Mercado) => void;
  resetMercadoCompras: () => void;
  updateConfig: (config: AppConfig) => void;
  updateMonth: (updatedMonth: MonthData) => void;
  selectMonth: (key: string) => void;
  addMonth: (year: number, month: number, salaries: { marcela: number; jonatan: number }) => void;
  deleteMonth: (key: string) => void;
  checkAndAdvanceMonth: () => void;

  // ── Inicialización ──────────────────────────────────────────────────────────
  initFirestoreSync: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Inicializar estado con datos locales (localStorage o semilla)
  data: loadData(),
  tab: 'dashboard',
  synced: false,

  setTab: (tab) => set({ tab }),

  // ── Acciones de Datos ────────────────────────────────────────────────────────
  
  updateMercado: (mercado) => {
    const newData = { ...get().data, mercado };
    set({ data: newData });
    saveData(newData);
  },

  resetMercadoCompras: () => {
    const { data } = get();
    const newData = { ...data, mercado: { ...data.mercado, compras: [] } };
    set({ data: newData });
    saveData(newData);
  },

  updateConfig: (config) => {
    const newData = { ...get().data, config };
    set({ data: newData });
    saveData(newData);
  },

  updateMonth: (updatedMonth) => {
    const { data } = get();
    const newData = {
      ...data,
      months: { ...data.months, [updatedMonth.key]: updatedMonth }
    };
    set({ data: newData });
    saveData(newData);
  },

  selectMonth: (key) => {
    const newData = { ...get().data, currentKey: key };
    set({ data: newData, tab: 'dashboard' });
    saveData(newData);
  },

  addMonth: (year, month, salaries) => {
    const { data } = get();
    const prevM = data.months[data.currentKey] || null;
    const newMonth = createEmptyMonth(year, month, salaries, prevM);
    const newData = {
      months: { ...data.months, [newMonth.key]: newMonth },
      currentKey: newMonth.key,
      mercado: data.mercado,
      config: data.config,
    };
    set({ data: newData, tab: 'dashboard' });
    saveData(newData);
  },

  deleteMonth: (key) => {
    const { data } = get();
    const months = { ...data.months };
    delete months[key];
    const keys = Object.keys(months);
    const newData = {
      months,
      currentKey: keys[keys.length - 1] || '',
      mercado: data.mercado,
      config: data.config,
    };
    set({ data: newData });
    saveData(newData);
  },

  checkAndAdvanceMonth: () => {
    const { data } = get();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayKey = getMonthKey(currentYear, currentMonth);
    
    if (!data.months[todayKey] && data.currentKey && data.currentKey < todayKey) {
      const lastMonth = data.months[data.currentKey];
      const newMonth = createEmptyMonth(currentYear, currentMonth, lastMonth?.salaries || { marcela: 0, jonatan: 0 });
      const newData = {
        ...data,
        months: { ...data.months, [todayKey]: newMonth },
        currentKey: todayKey
      };
      set({ data: newData });
      saveData(newData);
    }
  },

  // ── Inicialización ──────────────────────────────────────────────────────────
  
  initFirestoreSync: () => {
    return subscribeToFirestore(
      (remoteData) => set({ data: remoteData }),
      (syncStatus) => set({ synced: syncStatus })
    );
  }
}));
