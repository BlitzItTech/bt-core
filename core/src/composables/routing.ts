import { RouteLocationNormalized } from "vue-router"
import { inject } from "vue"
import type { BTNavigation } from "./navigation.ts"
import type { BTAuth } from "./auth.ts"
import type { BTDemo } from "./demo.ts"
import { navigationKey, authKey, demoKey } from "../types.ts"

export function guardRoute(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    restrictedName: string) {
    const nav = inject<BTNavigation>(navigationKey)!
    const auth = inject<BTAuth>(authKey)!
    const demo = inject<BTDemo>(demoKey)!

    const navItem = nav.findItem((to.meta.nav ?? to.name) as string) ?? undefined
    const requiresAuth = to.meta.requiresAuth !== false || (navItem != null && navItem.requiresAuth !== false)
    const isDemo = to.query.isDemo === 'true'

    // nav.updateHistory(to, from)
    
    if (!requiresAuth) {
        nav.updateNavigationChange(to, from)
        // nav.updateNavigationProperties(navItem)
    }
    else {
        if (isDemo) {
            if (auth.isLoggedIn.value)
                auth.logout()
            
            if (!demo.isDemoing.value)
                demo.startDemo()
        }
        else {
            if (demo.isDemoing.value)
                demo.endDemo()

            if (auth.tryLogin()) {
                const subCodes = navItem?.subscriptions ?? []
                const permissions = navItem?.permissions ?? []

                if (auth.doShow(subCodes, permissions, 'view')) {
                    //proceed
                    nav.updateNavigationChange(to, from)
                    return
                }
                else {
                    return restrictedName
                }
            }
            else {
                auth.login(window.location.pathname)
                return restrictedName
            }
        }
    }
}