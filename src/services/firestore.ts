import { db } from "../firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { STORAGE_KEY, SEED_MARKET_ITEMS, SUPERMARKETS } from "../constants";
import { createEmptyMonth } from "../utils/finanzas";
import { AppData, AppConfig, PaymentMethod } from "../types/models";

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "banc_marce", label: "Bancolombia", type: "ahorro",  owner: "marcela",  color: "#FBBF24", active: true },
  { id: "nu_marce",   label: "Nu",          type: "credito", owner: "marcela",  color: "#820AD1", active: true },
  { id: "banc_jona",  label: "Bancolombia", type: "ahorro",  owner: "jonatan",  color: "#FBBF24", active: true },
  { id: "nu_jona",    label: "Nu",          type: "credito", owner: "jonatan",  color: "#820AD1", active: true },
];

const DEFAULT_CONFIG: AppConfig = {
  marcelaName: "Marcela",
  jonatanName: "Jonatan",
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  supermarkets: SUPERMARKETS,
};

// ─── HELPERS DE MIGRACIÓN ────────────────────────────────────────────────────
// Se ejecutan sobre datos cargados desde Firestore O localStorage.
// Son idempotentes: correrlas más de una vez no duplica nada.

function migrateData(data: any): { data: AppData; changed: boolean } {
  let changed = false;
  const d = { ...data };

  if (!d.mercado || !d.mercado.items || d.mercado.items.length === 0) {
    d.mercado = { items: SEED_MARKET_ITEMS, compras: d.mercado?.compras || [] };
    changed = true;
  }
  if (!d.config) {
    d.config = DEFAULT_CONFIG;
    changed = true;
  }
  if (d.config && !d.config.paymentMethods) {
    d.config.paymentMethods = DEFAULT_PAYMENT_METHODS;
    changed = true;
  }
  if (d.config && !d.config.supermarkets) {
    d.config.supermarkets = SUPERMARKETS;
    changed = true;
  }
  if (!d.currentKey) {
    const keys = Object.keys(d.months || {});
    d.currentKey = keys.length > 0 ? keys[keys.length - 1] : "";
    changed = true;
  }

  if (d.months) {
    Object.values(d.months).forEach((month: any) => {
      if (!month.familyExpenses) return;

      const hasMercadoId = month.familyExpenses.some((c: any) => c.id === "mercado");
      if (!hasMercadoId) {
        month.familyExpenses = month.familyExpenses.map((c: any) =>
          c.label?.trim().toLowerCase() === "mercado" ? { ...c, id: "mercado" } : c
        );
        changed = true;
      }

      if (month.fondoConjunto && !Array.isArray(month.fondoConjunto.transferencias)) {
        const transferencias: any[] = [];
        if (month.fondoConjunto.aporteMarcela > 0)
          transferencias.push({ id: `mig_m_${month.key}`, persona: "marcela", monto: month.fondoConjunto.aporteMarcela, fecha: `${month.key}-01` });
        if (month.fondoConjunto.aporteJonatan > 0)
          transferencias.push({ id: `mig_j_${month.key}`, persona: "jonatan", monto: month.fondoConjunto.aporteJonatan, fecha: `${month.key}-01` });
        month.fondoConjunto = { transferencias };
        changed = true;
      }

      const hasOldPaymentId = month.familyExpenses.some((c: any) => c.paymentMethodId && !c.paymentMethodByPerson);
      if (hasOldPaymentId) {
        month.familyExpenses = month.familyExpenses.map((c: any) => {
          if (!c.paymentMethodId || c.paymentMethodByPerson) return c;
          const paymentMethodByPerson: Record<string, string> = {};
          if ((c.marcela  || 0) > 0) paymentMethodByPerson.marcela  = c.paymentMethodId;
          if ((c.jonatan  || 0) > 0) paymentMethodByPerson.jonatan  = c.paymentMethodId;
          if ((c.conjunto || 0) > 0) paymentMethodByPerson.conjunto = c.paymentMethodId;
          const { paymentMethodId, ...rest } = c;
          return { ...rest, paymentMethodByPerson };
        });
        changed = true;
      }
    });
  }

  return { data: d as AppData, changed };
}

// ─── DATOS VACÍOS (para familias nuevas sin migración) ───────────────────────

export function createInitialData(): AppData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const emptyMonth = createEmptyMonth(year, month);
  return {
    months: { [key]: emptyMonth },
    currentKey: key,
    mercado: { items: SEED_MARKET_ITEMS, compras: [] },
    config: {
      marcelaName: "",
      jonatanName: "",
      paymentMethods: [],
      supermarkets: [],
    },
  };
}

// ─── CARGA DESDE LOCALSTORAGE ────────────────────────────────────────────────

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { data, changed } = migrateData(parsed);
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.error("Error cargando datos de localStorage:", e);
  }

  // Semilla inicial (Junio 2026)
  const jun = createEmptyMonth(2026, 6, { marcela: 1803858, jonatan: 2021241 });
  jun.familyExpenses = jun.familyExpenses.map((c) => {
    const map: Record<string, any> = {
      arriendo: { marcela: 0, jonatan: 800000 },
      mercado: { marcela: 600000, jonatan: 0 },
      servicios: { marcela: 300000, jonatan: 0 },
      pasajes: { marcela: 410000, jonatan: 100000 },
      tc: { marcela: 0, jonatan: 0 },
      ahorro_salidas: { marcela: 0, jonatan: 0 },
      ahorro_personal: { marcela: 0, jonatan: 0 },
      internet_planes: { marcela: 0, jonatan: 145000 },
      credi_ahorros: { marcela: 0, jonatan: 50000 },
      otros: { marcela: 0, jonatan: 0 },
    };
    return { ...c, ...(map[c.id] || {}) };
  });

  const months = { "2026-06": jun };
  const d: AppData = {
    months,
    currentKey: "2026-06",
    mercado: { items: SEED_MARKET_ITEMS, compras: [] },
    config: DEFAULT_CONFIG,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  return d;
}

// ─── CARGA DESDE LEGACY (corpos/shared) — para migración de Jonatan ──────────

export async function loadLegacyData(): Promise<AppData | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "corpos", "shared"));
    if (!snap.exists()) return null;
    const raw = snap.data() as any;
    if (!raw.months || Object.keys(raw.months).length === 0) return null;
    const { data } = migrateData(raw);
    return data;
  } catch {
    return null;
  }
}

// ─── SAVE (localStorage + Firestore por familia) ─────────────────────────────

export function saveData(d: AppData, familyId?: string | null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

  if (db && familyId) {
    const sanitized = JSON.parse(JSON.stringify(d));
    setDoc(doc(db, "families", familyId, "data", "current"), sanitized)
      .catch((e) => console.error("Firestore save error:", e));
  }
}

// ─── SUBSCRIBE TO FIRESTORE (por familia) ────────────────────────────────────

function firestoreIsEmpty(data: AppData): boolean {
  if (!data?.months) return true;
  return Object.values(data.months).every((month: any) => {
    const hasFamily = (month.familyExpenses || []).some(
      (c: any) => (c.marcela || 0) + (c.jonatan || 0) + (c.conjunto || 0) > 0
    );
    const hasPersonal = [
      ...(month.personalExpenses?.marcela || []),
      ...(month.personalExpenses?.jonatan || []),
    ].some((e: any) => e.amount > 0);
    const hasExtras = (month.extras || []).length > 0;
    const hasSalary =
      (month.salaries?.marcela || 0) + (month.salaries?.jonatan || 0) > 0;
    return !hasFamily && !hasPersonal && !hasExtras && !hasSalary;
  });
}

export function subscribeToFirestore(
  familyId: string,
  onData: (data: AppData) => void,
  onSyncChange: (synced: boolean) => void
): () => void {
  if (!db || !familyId) {
    onSyncChange(false);
    return () => {};
  }

  const ref = doc(db, "families", familyId, "data", "current");

  // Suscripción a cambios en tiempo real
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        let remote = snap.data() as any;
        let { data, changed } = migrateData(remote);

        if (firestoreIsEmpty(data)) {
          const local = loadData();
          if (!firestoreIsEmpty(local)) {
            setDoc(ref, JSON.parse(JSON.stringify(local))).catch(console.error);
            onData(local);
            onSyncChange(true);
            return;
          }
        }

        if (changed) setDoc(ref, JSON.parse(JSON.stringify(data))).catch(console.error);

        onData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        onSyncChange(true);
      }
    },
    (err) => {
      console.error("Firestore listen error:", err);
      onSyncChange(false);
    }
  );

  return unsub;
}
