import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";
import { app } from "../firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export type AuthUser = User;

/**
 * Login con Google usando redirect (funciona en web, PWA y Capacitor).
 * signInWithPopup falla con "API key not valid" por un bug del iframe de Google Identity Services.
 */
export async function loginWithGoogle(): Promise<AuthUser | null> {
  try {
    console.log("[Auth] Starting signInWithRedirect...");
    await signInWithRedirect(auth, provider);
    return null; // nunca llega acá — la página recarga
  } catch (err) {
    console.error("[Auth] Login failed:", (err as any).code, (err as any).message);
    throw err;
  }
}

/**
 * Maneja el resultado del redirect después de volver de Google.
 * Llamar una vez al inicio de la app.
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
