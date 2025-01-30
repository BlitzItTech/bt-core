/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
// import fonts from 'unplugin-fonts/vite'

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
      external: ['vue', 'pinia', 'vue-router', '@vueuse/core'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'pinia',
          vuetify: 'Vuetify',
          // html2pdf: 'html2pdf.js'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vuetify']
  },
  plugins: [
    vue({ template: { transformAssetUrls }}),
    vuetify({ 
      autoImport: true,
      // styles: 'none'
    }),
    dts({ rollupTypes: true }),
    // fonts({
    //   google: {
    //     families: [ {
    //       name: 'Roboto',
    //       styles: 'wght@100;300;400;500;700;900',
    //     }],
    //   },
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})