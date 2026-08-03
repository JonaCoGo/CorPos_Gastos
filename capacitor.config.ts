/// <reference types="@capgo/capacitor-updater" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.corpos.gastos',
  appName: 'CorPos',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      // Sin backend de Capgo: revisamos y aplicamos las actualizaciones nosotros mismos
      // (ver src/hooks/useOtaUpdate.ts) contra un version.json que hospedamos en Vercel.
      autoUpdate: false,
    },
  },
};

export default config;
