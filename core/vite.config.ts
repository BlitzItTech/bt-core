/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom'
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'vuetify'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  plugins: [
    vue(),
    dts()
    // dts({ rollupTypes: true })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})