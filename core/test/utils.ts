import { createApp } from 'vue'
import { RouteRecordRaw, createWebHistory, createRouter } from 'vue-router'

export function withSetup(composable) {
    let result
    const app = createApp({
        setup() {
            result = composable()
            return () => {}
        }
    })

    app.mount(document.createElement('div'))

    return [result, app]
}

export function withSetupAndRouter(composable, routes: RouteRecordRaw[]) {
    let result
    const app = createApp({
        setup() {
            result = composable()
            return () => {}
        }
    })

    const router = createRouter({
        history: createWebHistory(),
        routes: routes
    })

    app.use(router)

    app.mount(document.createElement('div'))

    return [result, router, app]
}