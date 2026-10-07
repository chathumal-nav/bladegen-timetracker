import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',   // NEW: use our own service worker file
      srcDir: 'src',                  // NEW: where the file lives
      filename: 'sw.js',              // NEW: the file name
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'BladeGen Time Tracker',
        short_name: 'BladeGen',
        description: 'Team time tracking',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F4F6FB',
        theme_color: '#3547E0',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // The old "workbox: { ... }" block is GONE. It only works with the
      // auto-generated service worker, and is ignored with injectManifest.
    }),
  ],
})