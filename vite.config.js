import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Berkas statis yang akan dipra-cache agar aplikasi berjalan luring
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,

        // Strategi NetworkFirst untuk API Google Apps Script:
        // Selalu coba ambil data terbaru dari jaringan terlebih dahulu.
        // Jika gagal (sinyal buruk / luring), tampilkan data dari cache terakhir.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apps-script-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24 jam
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gemini-api',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 jam
              },
              networkTimeoutSeconds: 15,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Google Fonts dan aset statis eksternal
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      // Konfigurasi manifes web lengkap untuk instalasi PWA
      manifest: {
        name: 'Monitoring DTSEN ULP Salatiga Kota',
        short_name: 'DTSEN Salkot',
        description: 'Aplikasi Pemantauan Kinerja DTSEN ULP Salatiga Kota – Rekap paskabayar & prabayar secara real-time.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        orientation: 'portrait-primary',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Input Laporan',
            short_name: 'Input',
            description: 'Tambah laporan kinerja harian',
            url: '/?tab=input',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
          },
          {
            name: 'Rekap Petugas',
            short_name: 'Petugas',
            description: 'Lihat rekap kinerja semua petugas',
            url: '/?tab=officer_recap',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
          },
        ],
      },

      // Dev mode agar Service Worker aktif saat development juga
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  base: '/',
})
