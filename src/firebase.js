import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6j_u8FcwmVq5SQXjomHTCacXgOCZCXug",
  authDomain: "corpos-budget.firebaseapp.com",
  projectId: "corpos-budget",
  storageBucket: "corpos-budget.firebasestorage.app",
  messagingSenderId: "529456191448",
  appId: "1:529456191448:web:336aa93faa018966de84ad"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
