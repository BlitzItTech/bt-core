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


import BTBtn from './components/BT-Btn.vue'
import BTCol from './components/BT-Col.vue'
import BTFieldCheckbox from './components/BT-Field-Checkbox.vue'
import BTFieldDate from './components/BT-Field-Date.vue'
import BTFieldEntity from './components/BT-Field-Entity.vue'
import BTFieldSelect from './components/BT-Field-Select.vue'
import BTFieldString from './components/BT-Field-String.vue'
import BTFieldSwitch from './components/BT-Field-Switch.vue'
import BTFieldTags from './components/BT-Field-Tags.vue'
import BTFieldTextarea from './components/BT-Field-Textarea.vue'
import BTFieldTrigger from './components/BT-Field-Trigger.vue'
import BTHeaderOption from './components/BT-Header-Option.vue'
import BTJson from './components/BT-Json.vue'
import BTSelectListBox from './components/BT-Select-List-Box.vue'
import BTSelect from './components/BT-Select.vue'
import BTSnack from './components/BT-Snack.vue'
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
            app.component('bt-btn', BTBtn)
            app.component('bt-col', BTCol)
            app.component('bt-field-checkbox', BTFieldCheckbox)
            app.component('bt-field-date', BTFieldDate)
            app.component('bt-field-entity', BTFieldEntity)
            app.component('bt-field-select', BTFieldSelect)
            app.component('bt-field-string', BTFieldString)
            app.component('bt-field-switch', BTFieldSwitch)
            app.component('bt-field-tags', BTFieldTags)
            app.component('bt-field-text-area', BTFieldTextarea)
            app.component('bt-field-trigger', BTFieldTrigger)
            app.component('bt-header-option', BTHeaderOption)
            app.component('bt-json', BTJson)
            app.component('bt-select-list-box', BTSelectListBox)
            app.component('bt-select', BTSelect)
            app.component('bt-snack', BTSnack)
            app.component('bt-span', BTSpan)

            //define globals
            // app.config.globalProperties.$btcore = core

            createCosmetics(options)
            
            const demo = createDemo()
            
            const navigation = createNavigation(options)

            createPresets(options)

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

            createFilters({
                dates: dates
            })

            createPWA()

            createStoreBuilder({
                api,
                auth
            })

            // //provide
            // app.provide('bt-api', api)
            // app.provide('bt-auth', auth)
            // // app.provide('bt-cosmetics', cosmetics)
            // app.provide('bt-dates', dates)
            // app.provide('bt-demo', demo)
            // app.provide('bt-filters', filters)
            // app.provide('bt-navigation', navigation)
            // app.provide('bt-presets', presets)
            // app.provide('bt-pwa', pwa)
            // app.provide('bt-store', storeBuilder)
        }
    }
}