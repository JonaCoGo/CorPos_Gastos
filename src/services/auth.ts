import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { app } from "../firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export type AuthUser = User;

export function loginWithGoogle(): Promise<AuthUser> {
  return signInWithPopup(auth, provider).then((cred) => cred.user);
}

export function logout(): Promise<void> {
  return signOut(auth);
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth };
