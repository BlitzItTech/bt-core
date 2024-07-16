/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import core from './core'
import pinia from './pinia'
// import router from './router'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  // app.use(router)
  app.use(vuetify)
  app.use(core, { vuetifyInstance: vuetify.theme })
  app.use(pinia)
}
