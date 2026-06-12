import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Mantenemos el puerto 3000 al que estabas acostumbrado con CRA
    open: true  // Abre el navegador automáticamente al iniciar
  },
  build: {
    outDir: 'dist', // Vite usa 'dist' por defecto, pero lo dejamos explícito
    sourcemap: true
  }
})
