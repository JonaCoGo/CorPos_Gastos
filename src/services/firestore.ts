import { db } from "../firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { FIRESTORE_DOC, STORAGE_KEY, SEED_MARKET_ITEMS } from "../constants";
import { createEmptyMonth } from "../utils/finanzas";
import { AppData, AppConfig, PaymentMethod } from "../types/models";

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
};

/**
 * Carga los datos desde localStorage.
 * Si no hay datos, inicializa con el mes semilla de Junio 2026.
 */
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migración: si mercado está vacío, inyectar semillas
      if (!parsed.mercado || !parsed.mercado.items || parsed.mercado.items.length === 0) {
        parsed.mercado = { items: SEED_MARKET_ITEMS, compras: parsed.mercado?.compras || [] };
      }
      // Migración: si config no existe, agregar defaults
      if (!parsed.config) {
        parsed.config = DEFAULT_CONFIG;
      }
      // Migración: si config existe pero no tiene paymentMethods
      if (parsed.config && !parsed.config.paymentMethods) {
        parsed.config.paymentMethods = DEFAULT_PAYMENT_METHODS;
      }
      // Migración: normalizar categoría "Mercado" custom a id canónico 'mercado'
      // Migración: convertir fondoConjunto { aporteMarcela, aporteJonatan } al nuevo formato con transferencias
      if (parsed.months) {
        Object.values(parsed.months).forEach((month: any) => {
          if (!month.familyExpenses) return;
          const hasMercadoId = month.familyExpenses.some((c: any) => c.id === 'mercado');
          if (!hasMercadoId) {
            month.familyExpenses = month.familyExpenses.map((c: any) =>
              c.label?.trim().toLowerCase() === 'mercado' ? { ...c, id: 'mercado' } : c
            );
          }
          if (month.fondoConjunto && !Array.isArray(month.fondoConjunto.transferencias)) {
            const transferencias = [];
            if (month.fondoConjunto.aporteMarcela > 0)
              transferencias.push({ id: `mig_m_${month.key}`, persona: 'marcela', monto: month.fondoConjunto.aporteMarcela, fecha: `${month.key}-01` });
            if (month.fondoConjunto.aporteJonatan > 0)
              transferencias.push({ id: `mig_j_${month.key}`, persona: 'jonatan', monto: month.fondoConjunto.aporteJonatan, fecha: `${month.key}-01` });
            month.fondoConjunto = { transferencias };
          }
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error("Error cargando datos de localStorage:", e);
  }
  
  // Semilla inicial (Junio 2026)
  const jun = createEmptyMonth(2026, 6, { marcela: 1803858, jonatan: 2021241 });
  jun.familyExpenses = jun.familyExpenses.map((c) => {
    const map = {
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
    return { ...c, ...(map[c.id as keyof typeof map] || {}) };
  });
  
  const months = { "2026-06": jun };
  const d = { months, currentKey: "2026-06", mercado: { items: SEED_MARKET_ITEMS, compras: [] }, config: DEFAULT_CONFIG };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  return d;
}

/**
 * Guarda los datos en localStorage y en Firestore (si está disponible).
 */
export function saveData(d: AppData) {
  // Siempre guardar en localStorage como respaldo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

  // Guardar en Firestore — JSON.parse/stringify elimina valores undefined que Firestore rechaza
  if (db) {
    const [col, docId] = FIRESTORE_DOC.split("/");
    const sanitized = JSON.parse(JSON.stringify(d));
    setDoc(doc(db, col, docId), sanitized).catch((e) => console.error("Firestore save error:", e));
  }
}

/**
 * Se suscribe a los cambios en tiempo real de Firestore.
 * Si Firestore está vacío, empuja los datos locales inicialmente.
 * 
 * @param onData Callback que se ejecuta cuando llegan datos nuevos de Firestore.
 * @param onSyncChange Callback para notificar el estado de la sincronización.
 * @returns Función para cancelar la suscripción (unsubscribe).
 */
export function subscribeToFirestore(
  onData: (data: AppData) => void,
  onSyncChange: (synced: boolean) => void
) {
  if (!db) {
    onSyncChange(false);
    return () => {};
  }

  const [col, docId] = FIRESTORE_DOC.split("/");
  const ref = doc(db, col, docId);

  // Primera carga: si Firestore está vacío, empujar datos locales
  getDoc(ref).then((snap) => {
    if (!snap.exists()) {
      const local = loadData();
      setDoc(ref, local).catch(console.error);
    }
  });

  // Suscripción a cambios en tiempo real
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const remote = snap.data() as AppData;
        let changed = false;
        if (!remote.mercado || !remote.mercado.items || remote.mercado.items.length === 0) {
          remote.mercado = { items: SEED_MARKET_ITEMS, compras: remote.mercado?.compras || [] };
          changed = true;
        }
        if (!remote.config) {
          remote.config = DEFAULT_CONFIG;
          changed = true;
        }
        if (remote.config && !remote.config.paymentMethods) {
          remote.config.paymentMethods = DEFAULT_PAYMENT_METHODS;
          changed = true;
        }
        // Migración: normalizar categoría "Mercado" custom a id canónico 'mercado'
        // Migración: convertir fondoConjunto { aporteMarcela, aporteJonatan } al nuevo formato con transferencias
        if (remote.months) {
          Object.values(remote.months).forEach((month: any) => {
            if (!month.familyExpenses) return;
            const hasMercadoId = month.familyExpenses.some((c: any) => c.id === 'mercado');
            if (!hasMercadoId) {
              month.familyExpenses = month.familyExpenses.map((c: any) =>
                c.label?.trim().toLowerCase() === 'mercado' ? { ...c, id: 'mercado' } : c
              );
              changed = true;
            }
            if (month.fondoConjunto && !Array.isArray(month.fondoConjunto.transferencias)) {
              const transferencias: any[] = [];
              if (month.fondoConjunto.aporteMarcela > 0)
                transferencias.push({ id: `mig_m_${month.key}`, persona: 'marcela', monto: month.fondoConjunto.aporteMarcela, fecha: `${month.key}-01` });
              if (month.fondoConjunto.aporteJonatan > 0)
                transferencias.push({ id: `mig_j_${month.key}`, persona: 'jonatan', monto: month.fondoConjunto.aporteJonatan, fecha: `${month.key}-01` });
              month.fondoConjunto = { transferencias };
              changed = true;
            }
          });
        }
        if (changed) setDoc(ref, remote).catch(console.error);

        onData(remote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
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
