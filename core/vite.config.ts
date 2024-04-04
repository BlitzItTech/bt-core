/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
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
    // vue({
    //   template: { transformAssetUrls }
    // }),
    vue(),
    dts(),
    vuetify()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})