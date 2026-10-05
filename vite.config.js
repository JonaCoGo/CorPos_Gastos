import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Identificador único del build: lo ve la app (__BUILD_TIME__) y lo publica
// scripts/build-ota-bundle.mjs en /updates/version.json. Si no coinciden, la app
// sabe con certeza que está corriendo una versión vieja.
const BUILD_TIME = new Date().toISOString()

const buildIdPlugin = {
  name: 'corpos-build-id',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'build-id.json', source: JSON.stringify({ buildTime: BUILD_TIME }) })
  },
}

export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  plugins: [
    react(),
    buildIdPlugin,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'CorPos — Gastos familiares',
        short_name: 'CorPos',
        description: 'Gestión de gastos familiares para Marcela y Jonatan',
        theme_color: '#4f46e5',
        background_color: '#f4f5f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
        // /updates/ (version.json y bundles OTA) nunca debe salir del service worker
        navigateFallbackDenylist: [/^\/updates\//],
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production'
  }
}))
