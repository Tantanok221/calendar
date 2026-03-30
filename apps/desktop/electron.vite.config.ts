import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolveDesktopEnvDir } from './config/envDir'

const envDir = resolveDesktopEnvDir(__dirname)

export default defineConfig({
  main: {
    envDir
  },
  preload: {
    envDir
  },
  renderer: {
    envDir,
    server: {
      port: 4173,
      strictPort: true
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
