// vite.config.ts
import { defineConfig } from "file:///C:/Users/andre/source/repos/bt-core/core/node_modules/vite/dist/node/index.js";
import path from "path";
import vue from "file:///C:/Users/andre/source/repos/bt-core/core/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import dts from "file:///C:/Users/andre/source/repos/bt-core/core/node_modules/vite-plugin-dts/dist/index.mjs";
import vuetify, { transformAssetUrls } from "file:///C:/Users/andre/source/repos/bt-core/core/node_modules/vite-plugin-vuetify/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\andre\\source\\repos\\bt-core\\core";
var vite_config_default = defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    fileParallelism: false
  },
  build: {
    lib: {
      entry: path.resolve(__vite_injected_original_dirname, "./src/index.ts"),
      formats: ["es"]
    },
    rollupOptions: {
      external: ["vue", "pinia", "vue-router", "@vueuse/core"],
      output: {
        globals: {
          vue: "Vue",
          pinia: "pinia",
          vuetify: "Vuetify"
          // html2pdf: 'html2pdf.js'
        }
      }
    }
  },
  optimizeDeps: {
    include: ["vuetify"]
  },
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vuetify({
      autoImport: true
      // styles: 'none'
    }),
    dts({ rollupTypes: true })
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
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbmRyZVxcXFxzb3VyY2VcXFxccmVwb3NcXFxcYnQtY29yZVxcXFxjb3JlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbmRyZVxcXFxzb3VyY2VcXFxccmVwb3NcXFxcYnQtY29yZVxcXFxjb3JlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hbmRyZS9zb3VyY2UvcmVwb3MvYnQtY29yZS9jb3JlL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJ1xuaW1wb3J0IHZ1ZXRpZnksIHsgdHJhbnNmb3JtQXNzZXRVcmxzIH0gZnJvbSAndml0ZS1wbHVnaW4tdnVldGlmeSdcbi8vIGltcG9ydCBmb250cyBmcm9tICd1bnBsdWdpbi1mb250cy92aXRlJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2hhcHB5LWRvbScsXG4gICAgZmlsZVBhcmFsbGVsaXNtOiBmYWxzZVxuICB9LFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9pbmRleC50cycpLFxuICAgICAgZm9ybWF0czogWydlcyddXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWyd2dWUnLCAncGluaWEnLCAndnVlLXJvdXRlcicsICdAdnVldXNlL2NvcmUnLCAnaHRtbDJwZGYuanMnXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgdnVlOiAnVnVlJyxcbiAgICAgICAgICBwaW5pYTogJ3BpbmlhJyxcbiAgICAgICAgICB2dWV0aWZ5OiAnVnVldGlmeScsXG4gICAgICAgICAgLy8gaHRtbDJwZGY6ICdodG1sMnBkZi5qcydcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWyd2dWV0aWZ5J11cbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSh7IHRlbXBsYXRlOiB7IHRyYW5zZm9ybUFzc2V0VXJscyB9fSksXG4gICAgdnVldGlmeSh7IFxuICAgICAgYXV0b0ltcG9ydDogdHJ1ZSxcbiAgICAgIC8vIHN0eWxlczogJ25vbmUnXG4gICAgfSksXG4gICAgZHRzKHsgcm9sbHVwVHlwZXM6IHRydWUgfSksXG4gICAgLy8gZm9udHMoe1xuICAgIC8vICAgZ29vZ2xlOiB7XG4gICAgLy8gICAgIGZhbWlsaWVzOiBbIHtcbiAgICAvLyAgICAgICBuYW1lOiAnUm9ib3RvJyxcbiAgICAvLyAgICAgICBzdHlsZXM6ICd3Z2h0QDEwMDszMDA7NDAwOzUwMDs3MDA7OTAwJyxcbiAgICAvLyAgICAgfV0sXG4gICAgLy8gICB9LFxuICAgIC8vIH0pXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKVxuICAgIH1cbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sU0FBUztBQUNoQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxXQUFXLDBCQUEwQjtBQUw1QyxJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixpQkFBaUI7QUFBQSxFQUNuQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxLQUFLLFFBQVEsa0NBQVcsZ0JBQWdCO0FBQUEsTUFDL0MsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLE9BQU8sU0FBUyxjQUFjLGdCQUFnQixhQUFhO0FBQUEsTUFDdEUsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsS0FBSztBQUFBLFVBQ0wsT0FBTztBQUFBLFVBQ1AsU0FBUztBQUFBO0FBQUEsUUFFWDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFNBQVM7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsSUFBSSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxDQUFDO0FBQUEsSUFDdkMsUUFBUTtBQUFBLE1BQ04sWUFBWTtBQUFBO0FBQUEsSUFFZCxDQUFDO0FBQUEsSUFDRCxJQUFJLEVBQUUsYUFBYSxLQUFLLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTM0I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
