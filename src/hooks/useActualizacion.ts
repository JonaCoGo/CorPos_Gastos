import { useEffect } from "react";
import { create } from "zustand";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { SW_LAST_CHECK_KEY } from "../constants";

// Manifest de la última versión publicada (scripts/build-ota-bundle.mjs).
// `version` es la misma marca que cada build lleva compilada en __BUILD_TIME__,
// así que comparar ambas dice con certeza si esta copia de la app está vieja.
const VERSION_URL = "https://corpos-gastos.vercel.app/updates/version.json";
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

interface VersionPublicada { version: string; url: string }

interface ActualizacionState {
  publicada: string | null;
  hayNueva: boolean;
  actualizando: boolean;
  revisar: () => Promise<void>;
  actualizar: () => Promise<void>;
}

async function leerVersionPublicada(): Promise<VersionPublicada | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const v = await res.json();
    return v?.version && v?.url ? v : null;
  } catch {
    return null;
  }
}

// App Android: descarga el bundle web nuevo y lo activa (recarga la app).
async function aplicarOta(v: VersionPublicada): Promise<void> {
  const { bundle } = await CapacitorUpdater.current();
  if (bundle.version === v.version) return; // ya descargado: evita bucle de recargas
  const nuevo = await CapacitorUpdater.download({ version: v.version, url: v.url });
  await CapacitorUpdater.set({ id: nuevo.id });
}

// Navegador / PWA: equivale a "desinstalar y borrar el historial de Chrome",
// pero solo para esta app: quita el service worker y su caché de archivos y
// recarga desde el servidor. No toca localStorage ni IndexedDB, así que la
// sesión y los datos se conservan.
async function reinstalarWeb(): Promise<void> {
  const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
  await Promise.all(regs.map((r) => r.unregister()));
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.reload();
}

export const useActualizacionStore = create<ActualizacionState>((set) => ({
  publicada: null,
  hayNueva: false,
  actualizando: false,

  revisar: async () => {
    if (import.meta.env.DEV) return; // en `npm run dev` el build local no se compara con producción
    localStorage.setItem(SW_LAST_CHECK_KEY, new Date().toISOString());
    const v = await leerVersionPublicada();
    if (!v) return;
    const hayNueva = v.version > __BUILD_TIME__;
    set({ publicada: v.version, hayNueva });
    if (!hayNueva) return;

    if (Capacitor.isNativePlatform()) {
      await aplicarOta(v).catch(() => {});
    } else {
      // Camino normal: el service worker nuevo se instala y recarga solo (autoUpdate).
      // Si se queda pegado, el aviso de "Actualizar" permite forzarlo.
      navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {});
    }
  },

  actualizar: async () => {
    set({ actualizando: true });
    try {
      if (Capacitor.isNativePlatform()) {
        const v = await leerVersionPublicada();
        if (v) await aplicarOta(v);
        set({ actualizando: false });
      } else {
        await reinstalarWeb();
      }
    } catch {
      set({ actualizando: false });
    }
  },
}));

export function useActualizacion() {
  const revisar = useActualizacionStore((s) => s.revisar);

  useEffect(() => {
    // Obligatorio en cada arranque de la app Android: si no se llama, el plugin
    // revierte al bundle anterior.
    if (Capacitor.isNativePlatform()) CapacitorUpdater.notifyAppReady().catch(() => {});

    revisar();
    const id = setInterval(revisar, CHECK_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [revisar]);
}
