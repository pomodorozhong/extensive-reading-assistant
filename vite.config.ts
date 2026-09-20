import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

function pagesBase(): string {
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE
  }

  const repo = process.env.GITHUB_REPOSITORY
  if (process.env.GITHUB_ACTIONS && repo) {
    const name = repo.split('/')[1]
    if (name.endsWith('.github.io')) {
      return '/'
    }
    return `/${name}/`
  }

  return '/'
}

const base = pagesBase()

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      scope: base,
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: base,
        name: 'Extensive Reading Assistant',
        short_name: 'Reading',
        description: 'Practice English with level-appropriate stories and word explanations.',
        lang: 'en-US',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#863bff',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  base,
})
