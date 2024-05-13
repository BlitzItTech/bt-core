/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    fileParallelism: false
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'luxon', 'vuetify', /vuetify\/.+/, 'vue-router', '@vueuse/core'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'pinia',
          vuetify: 'Vuetify',
          'vue-router': 'vue-router',
          '@vueuse/core': '@vueuse/core'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vuetify', 'pinia', 'vue', 'vue-router', '@vueuse/core']
  },
  plugins: [
    vue({ template: { transformAssetUrls }}),
    vuetify({ autoImport: true }),
    dts({ rollupTypes: true })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})