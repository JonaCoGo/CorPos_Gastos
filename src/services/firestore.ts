import { db } from "../firebase";
import { doc, onSnapshot, setDoc, runTransaction, DocumentReference } from "firebase/firestore";
import { STORAGE_KEY, familyStorageKey, SEED_MARKET_ITEMS, SUPERMARKETS } from "../constants";
import { createEmptyMonth, asignarMesACompras, getMonthKey } from "../utils/finanzas";
import { migrarListaUnica } from "../utils/listas";
import { AppData, AppConfig, PaymentMethod } from "../types/models";

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "banc_marce", label: "Bancolombia", type: "ahorro",  owner: "marcela",  color: "#FBBF24", active: true },
  { id: "nu_marce",   label: "Nu",          type: "credito", owner: "marcela",  color: "#820AD1", active: true },
  { id: "banc_jona",  label: "Bancolombia", type: "ahorro",  owner: "jonatan",  color: "#FBBF24", active: true },
  { id: "nu_jona",    label: "Nu",          type: "credito", owner: "jonatan",  color: "#820AD1", active: true },
];

const DEFAULT_CONFIG: AppConfig = {
  marcelaName: "",
  jonatanName: "",
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
    d.mercado = { ...d.mercado, items: SEED_MARKET_ITEMS, compras: d.mercado?.compras || [] };
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

  if (d.mercado?.compras?.length) {
    const { compras, changed: comprasChanged } = asignarMesACompras(
      d.mercado.compras,
      d.mercado.items || [],
      d.currentKey || getMonthKey(new Date().getFullYear(), new Date().getMonth() + 1)
    );
    if (comprasChanged) {
      d.mercado = { ...d.mercado, compras };
      changed = true;
    }
  }

  if (d.mercado && d.mercado.lista !== undefined) {
    const { mercado } = migrarListaUnica(
      d.mercado,
      d.currentKey || getMonthKey(new Date().getFullYear(), new Date().getMonth() + 1)
    );
    d.mercado = mercado;
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

// Compras sin `monthKey` = datos anteriores a la separación del mercado por mes.
// Antes de migrarlas se guarda una copia intacta del documento en
// families/{id}/data/backup_pre_mercado_por_mes (se puede restaurar a mano).
function needsMercadoBackup(raw: any): boolean {
  return (raw?.mercado?.compras || []).some((c: any) => !c.monthKey);
}

// La migración se escribe en una transacción que relee el documento del servidor:
// así no pisa cambios hechos entre el snapshot y la escritura (ej. un viaje
// registrado mientras tanto). El respaldo se crea solo si no existe, para que
// siempre sea el documento original y no uno ya parcialmente migrado.
async function persistMigration(ref: DocumentReference, backupRef: DocumentReference): Promise<void> {
  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const raw = snap.data();
    const backupSnap = needsMercadoBackup(raw) ? await tx.get(backupRef) : null;
    const { data, changed } = migrateData(JSON.parse(JSON.stringify(raw)));
    if (!changed) return;
    if (backupSnap && !backupSnap.exists()) {
      tx.set(backupRef, { ...raw, backupAt: new Date().toISOString() });
    }
    tx.set(ref, JSON.parse(JSON.stringify(data)));
  });
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

/**
 * Carga datos desde localStorage.
 * - Con familyId: carga datos scoped a esa familia (aislamiento multi-familia)
 * - Sin familyId (init): intenta migrar desde la clave legacy unscoped
 */
export function loadData(familyId?: string): AppData {
  const key = familyId ? familyStorageKey(familyId) : STORAGE_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { data, changed } = migrateData(parsed);
      if (changed) localStorage.setItem(key, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.error("Error cargando datos de localStorage:", e);
  }

  // Si hay familyId pero no hay datos en localStorage, retorna datos vacíos.
  // La suscripción a Firestore se encargará de cargar los datos remotos.
  // NUNCA usar la semilla de datos reales aquí — causaría fuga de datos
  // entre familias (ver changelog 2026-08-20).
  if (familyId) {
    return createInitialData();
  }

  // Semilla inicial (Junio 2026) — solo para el primer usuario sin familyId (legacy)
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
  localStorage.setItem(key, JSON.stringify(d));
  return d;
}

// ─── SAVE (localStorage + Firestore por familia) ─────────────────────────────

export function saveData(d: AppData, familyId?: string | null): Promise<void> {
  if (familyId) {
    localStorage.setItem(familyStorageKey(familyId), JSON.stringify(d));
  }

  if (db && familyId) {
    const sanitized = JSON.parse(JSON.stringify(d));
    return setDoc(doc(db, "families", familyId, "data", "current"), sanitized)
      .catch((e) => console.error("Firestore save error:", e));
  }

  return Promise.resolve();
}

// ─── IMPORTAR BACKUP (JSON exportado desde Ajustes) ──────────────────────────

/**
 * Reemplaza los datos de la familia con un backup. Antes guarda el estado
 * actual en families/{id}/data/backup_pre_import para poder deshacerlo a mano.
 * El backup pasa por migrateData, así un JSON de una versión vieja de la app
 * (ej. compras sin monthKey, lista única) queda en el modelo actual.
 * Espera a que Firestore confirme antes de resolver: si se recarga antes, la
 * suscripción entrega los datos viejos y el import parece no funcionar.
 */
export async function importarBackup(parsed: unknown, familyId: string, actual: AppData): Promise<void> {
  const p = parsed as any;
  if (!p || typeof p !== "object" || !p.months || typeof p.months !== "object" || !p.currentKey) {
    throw new Error("Formato inválido");
  }
  const { data } = migrateData(JSON.parse(JSON.stringify(p)));
  // Sin saveData a propósito: ese se traga los errores de Firestore, y aquí un
  // fallo debe llegar a la pantalla en vez de reportar un import exitoso.
  if (db) {
    await setDoc(
      doc(db, "families", familyId, "data", "backup_pre_import"),
      { ...JSON.parse(JSON.stringify(actual)), backupAt: new Date().toISOString() }
    );
    await setDoc(doc(db, "families", familyId, "data", "current"), JSON.parse(JSON.stringify(data)));
  }
  localStorage.setItem(familyStorageKey(familyId), JSON.stringify(data));
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
  const scopedKey = familyStorageKey(familyId);
  const backupRef = doc(db, "families", familyId, "data", "backup_pre_mercado_por_mes");

  // Suscripción a cambios en tiempo real
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        let remote = snap.data() as any;
        let { data, changed } = migrateData(JSON.parse(JSON.stringify(remote)));

        if (firestoreIsEmpty(data)) {
          // Firestore vacío: intentar cargar desde localStorage SCOPED a esta familia
          const local = loadData(familyId);
          if (!firestoreIsEmpty(local)) {
            setDoc(ref, JSON.parse(JSON.stringify(local))).catch(console.error);
            onData(local);
            onSyncChange(true);
            return;
          }
        }

        if (changed) {
          // Sin red la transacción falla y se reintenta en el próximo snapshot.
          persistMigration(ref, backupRef).catch(console.error);
        }

        onData(data);
        localStorage.setItem(scopedKey, JSON.stringify(data));
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
