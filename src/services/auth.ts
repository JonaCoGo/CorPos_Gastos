import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { app } from "../firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const isNative = Capacitor.isNativePlatform();

export type AuthUser = User;

/**
 * Login con Google.
 * - En web (navegador/PWA): usa popup (funciona bien).
 * - En Capacitor (app nativa): usa redirect (el popup no funciona en WebView).
 */
export async function loginWithGoogle(): Promise<AuthUser | null> {
  if (isNative) {
    // Redirect: navega toda la página. Al volver, getRedirectResult resuelve.
    await signInWithRedirect(auth, provider);
    return null; // nunca llega acá — la página recarga
  }
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

/**
 * Maneja el resultado del redirect (solo relevante en Capacitor).
 * Llamar una vez al inicio de la app para completar el login si vino de un redirect.
 */
export async function handleRedirectResult(): Promise<AuthUser | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

export function logout(): Promise<void> {
  return signOut(auth);
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth };
