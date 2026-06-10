import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['assets/cloud.png', 'assets/cloudy.png', 'assets/flying-kitty.png'],
      manifest: {
        name: 'Flying Kitty: Find Cloudy',
        short_name: 'Cloudy',
        description: 'Help Flying Kitty find Cloudy hidden among the clouds!',
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
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
      }
    })
  ]
});
