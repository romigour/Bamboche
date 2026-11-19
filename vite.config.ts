import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { buildDefines } from './build-info.mjs';

export default defineConfig({
  base: './',
  define: buildDefines(),
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Bamboche',
        short_name: 'Bamboche',
        description: 'Jeux de soirée sur un seul téléphone',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1A1033',
        theme_color: '#1A1033',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}'],
        navigateFallback: 'index.html',
        // sons et photos des Cris d'animaux : hors précache, téléchargés à la première partie
        runtimeCaching: [
          {
            urlPattern: /\/animaux\/[^/]+\.(?:mp3|webp)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'bamboche-animaux' },
          },
        ],
      },
    }),
  ],
});
