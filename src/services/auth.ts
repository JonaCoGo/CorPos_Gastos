import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { app } from "../firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const isNative = Capacitor.isNativePlatform();

export type AuthUser = User;

/**
 * Login con Google.
 * - Browser: usa popup (funciona correctamente con la API key corregida).
 * - Capacitor: usa redirect (el popup no funciona en WebView).
 */
export async function loginWithGoogle(): Promise<AuthUser | null> {
  try {
    if (isNative) {
      console.log("[Auth] Capacitor — using signInWithRedirect");
      await signInWithRedirect(auth, provider);
      return null;
    }
    console.log("[Auth] Browser — using signInWithPopup");
    const cred = await signInWithPopup(auth, provider);
    console.log("[Auth] Popup login successful:", cred.user.email);
    return cred.user;
  } catch (err) {
    console.error("[Auth] Login failed:", (err as any).code, (err as any).message);
    throw err;
  }
}

/**
 * Maneja el resultado del redirect (Capacitor).
 */
export async function handleRedirectResult(): Promise<AuthUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("[Auth] Redirect login successful:", result.user.email);
      return result.user;
    }
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
