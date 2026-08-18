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
  try {
    if (isNative) {
      // Redirect: navega toda la página. Al volver, getRedirectResult resuelve.
      console.log("[Auth] Capacitor detected — using signInWithRedirect");
      await signInWithRedirect(auth, provider);
      return null; // nunca llega acá — la página recarga
    }
    console.log("[Auth] Browser detected — using signInWithPopup");
    const cred = await signInWithPopup(auth, provider);
    console.log("[Auth] Popup login successful:", cred.user.email);
    return cred.user;
  } catch (err) {
    console.error("[Auth] Login failed:", (err as any).code, (err as any).message);
    throw err;
  }
}

/**
 * Maneja el resultado del redirect (solo relevante en Capacitor).
 * Llamar una vez al inicio de la app para completar el login si vino de un redirect.
 */
export async function handleRedirectResult(): Promise<AuthUser | null> {
  try {
    console.log("[Auth] Checking redirect result...");
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("[Auth] Redirect login successful:", result.user.email);
      return result.user;
    }
    console.log("[Auth] No redirect result found");
    return null;
  } catch (err) {
    console.error("[Auth] Redirect result error:", (err as any).code, (err as any).message);
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
