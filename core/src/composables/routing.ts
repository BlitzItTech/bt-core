import { RouteLocationNormalized } from "vue-router"
import { inject } from "vue"
import type { BTNavigation } from "./navigation.ts"
import type { BTAuth } from "./auth.ts"
import type { BTDemo } from "./demo.ts"
import { navigationKey, authKey, demoKey } from "../types.ts"
import { useTabTitle } from "./urls.ts"
import { isNullOrEmpty } from "./helpers.ts"


export function guardRoute(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    restrictedName: string,
    loggedInHome: string) {
    const nav = inject<BTNavigation>(navigationKey)!
    const auth = inject<BTAuth>(authKey)!
    const demo = inject<BTDemo>(demoKey)!

    const navItem = nav.findItem((to.meta.nav ?? to.name) as string) ?? undefined
    const requiresAuth = to.meta.requiresAuth !== false || (navItem != null && navItem.requiresAuth !== false)
    
    // const isDemo = to.query.isDemo === 'true' || from.query.isDemo === 'true'
    const metaPermissions = to.meta.permissions as string[] ?? []
    const metaSubscriptions = to.meta.subscriptions as string[] ?? []

    function setTabTitle() {
        //update tab title
        document.title = `${demo.isDemoing.value ? '(Demo) ' : ''}${useTabTitle() ?? ''}`
    }

    if (to.query.isDemo === 'true' && !demo.isDemoing.value)
        demo.startDemo();

    if (!requiresAuth) {
        setTabTitle()
        nav.updateNavigationChange(to, from)

        if (to.path == '/' && auth.tryLogin() && isNullOrEmpty(from.name?.toString()))
            return { name: loggedInHome }
    }
    else {
        if (demo.isDemoing.value) {
            setTabTitle()
            nav.updateNavigationChange(to, from)
        }
        else {
            // if (demo.isDemoing.value) {
            //     demo.endDemo(false)
            //     setTabTitle()
            //     return { path: '/' }
            // }

            setTabTitle()

            if (auth.tryLogin()) {
                const subCodes = navItem?.subscriptions ?? []
                const permissions = navItem?.permissions ?? []

                subCodes.push(...metaSubscriptions);
                permissions.push(...metaPermissions);

                if (auth.doShow(subCodes, permissions, 'view')) {
                    //proceed
                    nav.updateNavigationChange(to, from)
                    return
                }
                else {
                    return { name: restrictedName }
                }
            }
            else {
                auth.login(window.location.pathname)
                return { name: restrictedName }
            }
        }
    }
}

// export function guardRoute(
//     to: RouteLocationNormalized,
//     from: RouteLocationNormalized,
//     restrictedName: string,
//     loggedInHome: string) {
//     const nav = inject<BTNavigation>(navigationKey)!
//     const auth = inject<BTAuth>(authKey)!
//     const demo = inject<BTDemo>(demoKey)!

//     const navItem = nav.findItem((to.meta.nav ?? to.name) as string) ?? undefined
//     const requiresAuth = to.meta.requiresAuth !== false || (navItem != null && navItem.requiresAuth !== false)
//     const isDemo = to.query.isDemo === 'true' || from.query.isDemo === 'true'
//     const metaPermissions = to.meta.permissions as string[] ?? []
//     const metaSubscriptions = to.meta.subscriptions as string[] ?? []

//     function setTabTitle() {
//         //update tab title
//         document.title = `${demo.isDemoing.value ? '(Demo) ' : ''}${useTabTitle() ?? ''}`
//     }

//     if (!requiresAuth) {
//         setTabTitle()
//         nav.updateNavigationChange(to, from)

//         if (to.path == '/' && auth.tryLogin() && isNullOrEmpty(from.name?.toString()))
//             return { name: loggedInHome }
//     }
//     else {
//         if (isDemo) {
//             if (!demo.isDemoing.value)
//                 demo.startDemo()

//             setTabTitle()
//             nav.updateNavigationChange(to, from)
//         }
//         else {
//             if (demo.isDemoing.value) {
//                 demo.endDemo(false)
//                 setTabTitle()
//                 return { path: '/' }
//             }

//             setTabTitle()

//             if (auth.tryLogin()) {
//                 const subCodes = navItem?.subscriptions ?? []
//                 const permissions = navItem?.permissions ?? []

//                 subCodes.push(...metaSubscriptions);
//                 permissions.push(...metaPermissions);

//                 if (auth.doShow(subCodes, permissions, 'view')) {
//                     //proceed
//                     nav.updateNavigationChange(to, from)
//                     return
//                 }
//                 else {
//                     return { name: restrictedName }
//                 }
//             }
//             else {
//                 auth.login(window.location.pathname)
//                 return { name: restrictedName }
//             }
//         }
//     }
// }