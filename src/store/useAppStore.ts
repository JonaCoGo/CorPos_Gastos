import { create } from "zustand";
import { AppData, MonthData, Mercado, AppConfig } from "../types/models";
import {
  loadData,
  saveData,
  subscribeToFirestore,
  createInitialData,
} from "../services/firestore";
import { createEmptyMonth, getMonthKey } from "../utils/finanzas";
import { AuthUser } from "../services/auth";

/**
 * Store Global de la Aplicación (Zustand)
 * - Maneja estado de auth (user, familyId, authReady)
 * - Maneja datos de la app (data, tab, synced, firestoreReady)
 * - Cada acción que modifica `data` persiste en localStorage + Firestore (por familia)
 */
interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: AuthUser | null;
  familyId: string | null;
  authReady: boolean;

  // ── Datos ─────────────────────────────────────────────────────────────────
  data: AppData;
  tab: string;
  synced: boolean;
  firestoreReady: boolean;

  // ── Auth actions ──────────────────────────────────────────────────────────
  setAuth: (user: AuthUser | null, familyId: string | null) => void;
  setFamilyId: (familyId: string) => void;

  // ── UI actions ────────────────────────────────────────────────────────────
  setTab: (tab: string) => void;

  // ── Data actions ──────────────────────────────────────────────────────────
  updateMercado: (mercado: Mercado) => void;
  resetMercadoCompras: () => void;
  resetAllData: () => Promise<void>;
  updateConfig: (config: AppConfig) => void;
  updateMonth: (updatedMonth: MonthData) => void;
  selectMonth: (key: string) => void;
  addMonth: (
    year: number,
    month: number,
    salaries: { marcela: number; jonatan: number }
  ) => void;
  deleteMonth: (key: string) => void;
  checkAndAdvanceMonth: () => void;

  // ── Inicialización ────────────────────────────────────────────────────────
  initFirestoreSync: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  familyId: null,
  authReady: false,

  // ── Datos ─────────────────────────────────────────────────────────────────
  data: loadData(),
  tab: "dashboard",
  synced: false,
  firestoreReady: false,

  // ── Auth actions ──────────────────────────────────────────────────────────

  setAuth: (user, familyId) => {
    // Si hay familyId, cargar datos scoped a esa familia desde localStorage
    // Esto evita que datos de otra familia (en la misma clave legacy) se mezclen
    if (familyId) {
      const scopedData = loadData(familyId);
      set({ user, familyId, authReady: true, data: scopedData });
    } else {
      set({ user, familyId, authReady: true });
    }
  },

  setFamilyId: (familyId) => {
    set({ familyId, firestoreReady: false });
  },

  // ── UI actions ────────────────────────────────────────────────────────────

  setTab: (tab) => set({ tab }),

  // ── Data actions ──────────────────────────────────────────────────────────

  updateMercado: (mercado) => {
    const { data, familyId } = get();
    const newData = { ...data, mercado };
    set({ data: newData });
    saveData(newData, familyId);
  },

  resetMercadoCompras: () => {
    const { data, familyId } = get();
    const newData = { ...data, mercado: { ...data.mercado, compras: [] } };
    set({ data: newData });
    saveData(newData, familyId);
  },

  resetAllData: async () => {
    const { familyId } = get();
    const newData = createInitialData();
    set({ data: newData });
    await saveData(newData, familyId);
  },

  updateConfig: (config) => {
    const { data, familyId } = get();
    const newData = { ...data, config };
    set({ data: newData });
    saveData(newData, familyId);
  },

  updateMonth: (updatedMonth) => {
    const { data, familyId } = get();
    const newData = {
      ...data,
      months: { ...data.months, [updatedMonth.key]: updatedMonth },
    };
    set({ data: newData });
    saveData(newData, familyId);
  },

  selectMonth: (key) => {
    const { familyId } = get();
    const newData = { ...get().data, currentKey: key };
    set({ data: newData, tab: "dashboard" });
    saveData(newData, familyId);
  },

  addMonth: (year, month, salaries) => {
    const { data, familyId } = get();
    const prevM = data.months[data.currentKey] || null;
    const newMonth = createEmptyMonth(year, month, salaries, prevM);
    const newData = {
      months: { ...data.months, [newMonth.key]: newMonth },
      currentKey: newMonth.key,
      mercado: data.mercado,
      config: data.config,
    };
    set({ data: newData, tab: "dashboard" });
    saveData(newData, familyId);
  },

  deleteMonth: (key) => {
    const { data, familyId } = get();
    const months = { ...data.months };
    delete months[key];
    const keys = Object.keys(months);
    const newData = {
      months,
      currentKey: keys[keys.length - 1] || "",
      mercado: data.mercado,
      config: data.config,
    };
    set({ data: newData });
    saveData(newData, familyId);
  },

  checkAndAdvanceMonth: () => {
    const { data, firestoreReady, familyId } = get();
    if (!firestoreReady) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayKey = getMonthKey(currentYear, currentMonth);

    if (
      !data.months[todayKey] &&
      data.currentKey &&
      data.currentKey < todayKey
    ) {
      const lastMonth = data.months[data.currentKey];
      const newMonth = createEmptyMonth(
        currentYear,
        currentMonth,
        lastMonth?.salaries || { marcela: 0, jonatan: 0 }
      );
      const newData = {
        ...data,
        months: { ...data.months, [todayKey]: newMonth },
        currentKey: todayKey,
      };
      set({ data: newData });
      saveData(newData, familyId);
    }
  },

  // ── Inicialización ────────────────────────────────────────────────────────

  initFirestoreSync: () => {
    const { familyId } = get();
    return subscribeToFirestore(
      familyId!,
      (remoteData) => {
        set({ data: remoteData, firestoreReady: true });
        get().checkAndAdvanceMonth();
      },
      (syncStatus) => set({ synced: syncStatus })
    );
  },
}));
