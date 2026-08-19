import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { createInitialData } from "./firestore";

// ─── IDs y códigos ───────────────────────────────────────────────────────────

function generateFamilyId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "fam_";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I/O/0/1 para evitar confusión
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Crear familia ─────────────────────────────────────────────────────────

export async function createFamily(
  uid: string,
  familyName: string,
  displayName: string,
  email: string
): Promise<string> {
  const familyId = generateFamilyId();
  const inviteCode = generateInviteCode();

  // Paso 1: Crear familia + miembro + usuario (sin data/current)
  // Firestore rules verifican exists() contra el estado actual de la BD,
  // así que el miembro debe existir ANTES de poder escribir en data/.
  const batch1 = writeBatch(db);
  batch1.set(doc(db, "families", familyId), {
    name: familyName,
    createdAt: new Date().toISOString(),
    createdBy: uid,
    inviteCode,
  });
  batch1.set(doc(db, "families", familyId, "members", uid), {
    role: "admin",
    displayName,
    joinedAt: new Date().toISOString(),
  });
  batch1.set(doc(db, "users", uid), {
    familyId,
    displayName,
    email,
  });
  await batch1.commit();

  // Paso 2: Guardar datos vacíos (ahora el member doc ya existe, las rules lo permiten)
  await setDoc(doc(db, "families", familyId, "data", "current"), createInitialData());

  return familyId;
}

// ─── Unirse a familia con código de invitación ────────────────────────────────

export async function joinFamily(
  uid: string,
  inviteCode: string,
  displayName: string,
  email: string
): Promise<string> {
  // 1. Buscar la familia por inviteCode
  const q = query(collection(db, "families"), where("inviteCode", "==", inviteCode.toUpperCase()));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Código de invitación no válido");
  }

  const familyDoc = snap.docs[0];
  const familyId = familyDoc.id;

  // 2. Verificar que el usuario no esté ya en una familia
  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists() && userSnap.data().familyId) {
    throw new Error("Ya perteneces a una familia");
  }

  const batch = writeBatch(db);

  // 3. Agregar al usuario como member
  batch.set(doc(db, "families", familyId, "members", uid), {
    role: "member",
    displayName,
    joinedAt: new Date().toISOString(),
  });

  // 4. Actualizar doc del usuario
  batch.set(doc(db, "users", uid), {
    familyId,
    displayName,
    email,
  });

  await batch.commit();
  return familyId;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

export async function getUserFamilyId(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data().familyId ?? null;
}

export async function getInviteCode(familyId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return snap.data().inviteCode ?? null;
}

export async function regenerateInviteCode(familyId: string, uid: string): Promise<string> {
  // Verificar que es admin
  const memberSnap = await getDoc(doc(db, "families", familyId, "members", uid));
  if (!memberSnap.exists() || memberSnap.data().role !== "admin") {
    throw new Error("Solo el administrador puede regenerar el código");
  }

  const newCode = generateInviteCode();
  await updateDoc(doc(db, "families", familyId), { inviteCode: newCode });
  return newCode;
}

export async function getFamilyName(familyId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return snap.data().name ?? null;
}
