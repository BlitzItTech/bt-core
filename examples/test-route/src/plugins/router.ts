/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import type { RouteLocationNormalized } from 'vue-router'
import { guardRoute } from '../../../../core/src/composables/routing'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // extendRoutes: (routes: any) => {
  //   console.log(routes)
  //   return setupLayouts(routes)
  // }
  extendRoutes: setupLayouts,
})

// router.beforeEach((to: any, from: any) => {
//   console.log(to)
// })

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  return guardRoute(to, from, { name: 'restricted' })
})

export default router
