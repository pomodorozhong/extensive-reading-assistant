import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vite'

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

// Limits what the published page can run and where it can send data, including the Gemini key.
// Radix Themes and React set inline style attributes, so styles need 'unsafe-inline'.
// The dev server injects inline scripts for hot reload, so the policy applies to builds only.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://generativelanguage.googleapis.com",
  "img-src 'self' data:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  }
}

export default defineConfig({
  plugins: [
    react(),
    contentSecurityPolicy(),
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
