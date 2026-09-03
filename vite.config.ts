import react from '@vitejs/plugin-react'
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

export default defineConfig({
  plugins: [react()],
  base: pagesBase(),
})
