import { App } from 'vue'
import { createApi } from './composables/api'
import { createAuth, type GetAuthUrl, type AuthSubscription } from './composables/auth'
import { BaseCosmeticTheme, createCosmetics, UseCosmeticsOptions } from './composables/cosmetics'
import { createDates } from './composables/dates'
import { createDemo } from './composables/demo'
import { createFilters } from './composables/filters'
import { createNavigation, type NavigationItem } from './composables/navigation'
import { createPresets } from './composables/presets'
import { createPWA } from './composables/pwa'
import { createStoreBuilder } from './composables/stores'
import { RemovableRef } from '@vueuse/core'

import BTSpan from './components/BT-Span.vue'

export interface CoreApp {
    install(app: App) : void
}

export interface CreateCoreOptions extends UseCosmeticsOptions<BaseCosmeticTheme> {
    defaultCacheExpiryHours?: number
    navItems?: NavigationItem[]

    getAuthUrl: GetAuthUrl
    presets: any
    setCredentials?: (state: RemovableRef<any>, payload: any) => void
    subscriptionOptions?: AuthSubscription[]
}

export function createCore(options: CreateCoreOptions): CoreApp {
    
    return {
        install(app: App) {
            // const core = this

            //register components
            app.component('bt-span', BTSpan)

            //define globals
            // app.config.globalProperties.$btcore = core

            const cosmetics = createCosmetics(options)
            
            const demo = createDemo()
            
            const navigation = createNavigation(options)

            const presets = createPresets(options)

            const auth = createAuth({ 
                demo: demo,
                getAuthItem: navigation.findItem,
                getAuthUrl: options.getAuthUrl,
                setCredentials: options.setCredentials,
                subscriptionOptions: options.subscriptionOptions
            })

            const api = createApi({
                auth: auth,
                findPath: navigation.findPath,
                useBearerToken: true
            })

            const dates = createDates({
                getTimeZone: auth.getTimeZone
            })

            const filters = createFilters({
                dates: dates
            })

            const pwa = createPWA()

            const storeBuilder = createStoreBuilder({
                api,
                auth
            })

            //provide
            app.provide('bt-api', api)
            app.provide('bt-auth', auth)
            app.provide('bt-cosmetics', cosmetics)
            app.provide('bt-dates', dates)
            app.provide('bt-demo', demo)
            app.provide('bt-filters', filters)
            app.provide('bt-navigation', navigation)
            app.provide('bt-presets', presets)
            app.provide('bt-pwa', pwa)
            app.provide('bt-store', storeBuilder)
        }
    }
}