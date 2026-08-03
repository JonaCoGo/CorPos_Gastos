import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

// Dónde vive el manifest de la última versión del bundle web (generado en cada
// build por scripts/build-ota-bundle.mjs y desplegado junto al resto en Vercel).
const VERSION_URL = "https://corpos-gastos.vercel.app/updates/version.json";
const OTA_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Actualización en caliente del código web dentro de la app nativa (Android).
 * No hace nada quien corre en el navegador — ahí sigue mandando el service worker/PWA.
 */
export function useOtaUpdate() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Obligatorio en cada arranque: si no se llama, el plugin revierte al bundle anterior.
    CapacitorUpdater.notifyAppReady().catch(() => {});

    const checkForUpdate = async () => {
      try {
        const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const { version, url } = await res.json();
        if (!version || !url) return;

        const { bundle } = await CapacitorUpdater.current();
        if (version === bundle.version) return;

        const newBundle = await CapacitorUpdater.download({ version, url });
        await CapacitorUpdater.set({ id: newBundle.id });
      } catch {
        // Sin conexión o backend caído: seguimos con el bundle que ya está activo.
      }
    };

    checkForUpdate();
    const id = setInterval(checkForUpdate, OTA_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
