import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves project sites under /<repo-name>/. The deploy workflow
// sets BASE_PATH to that; local dev/preview default to '/'.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Flying Kitty: Find Cloudy',
        short_name: 'Cloudy',
        description: 'Help Flying Kitty find Cloudy hidden among the clouds!',
        id: base,
        start_url: base,
        scope: base,
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#7dbfee',
        theme_color: '#7dbfee',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Precache everything the game needs (JS, sprites, icons, manifest)
        // so an installed app works fully offline.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true
      }
    })
  ]
});
