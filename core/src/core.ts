import { App } from 'vue'
import { createApi } from './composables/api.ts'
import { CreateAuthOptions, createAuth, type AuthSubscription } from './composables/auth.ts'
import { BaseCosmeticTheme, createCosmetics, UseCosmeticsOptions } from './composables/cosmetics.ts'
import { createDates } from './composables/dates.ts'
import { createDemo } from './composables/demo.ts'
import { createFilters } from './composables/filters.ts'
import { CreateMenuOptions, createMenu } from './composables/menu.ts'
import { createNavigation, type NavigationItem } from './composables/navigation.ts'
import { createPresets } from './composables/presets.ts'
import { createPWA } from './composables/pwa.ts'
import { createStoreBuilder } from './composables/stores.ts'
import { CreateUrlOptions, createUrl } from './composables/urls.ts'
import { ThemeInstance } from 'vuetify'
// import 'vuetify/styles'
// import VuetifyUseDialog from 'vuetify-use-dialog'

// import BTTest from './components/BT-Test.vue'
// import BTBtn from './components/BT-Btn.vue'
// import BTCol from './components/BT-Col.vue'
// import BTFieldCheckbox from './components/BT-Field-Checkbox.vue'
// import BTFieldDate from './components/BT-Field-Date.vue'
// import BTFieldEntity from './components/BT-Field-Entity.vue'
// import BTFieldSelect from './components/BT-Field-Select.vue'
// import BTFieldString from './components/BT-Field-String.vue'
// import BTFieldSwitch from './components/BT-Field-Switch.vue'
// import BTFieldTags from './components/BT-Field-Tags.vue'
// import BTFieldTextarea from './components/BT-Field-Textarea.vue'
// import BTFieldTrigger from './components/BT-Field-Trigger.vue'
// import BTHeaderOption from './components/BT-Header-Option.vue'
// import BTJson from './components/BT-Json.vue'
// import BTSelectListBox from './components/BT-Select-List-Box.vue'
// import BTSelect from './components/BT-Select.vue'
// import BTSnack from './components/BT-Snack.vue'
// import BTSpan from './components/BT-Span.vue'

export interface CoreApp {
    install(app: App, options: any) : void
}

export interface InstallCoreOptions {
    vuetifyInstance?: ThemeInstance
}

export interface CreateCoreOptions extends UseCosmeticsOptions<BaseCosmeticTheme> {
    auth: CreateAuthOptions
    defaultCacheExpiryHours?: number
    // getAuthQuery: (redirectPath?: string, state?: string) => string
    menu?: CreateMenuOptions
    navItems?: NavigationItem[]
    presets: any
    // setCredentials?: (state: RemovableRef<any>, payload: any) => void
    /**suboptions */
    subscriptionOptions?: AuthSubscription[]
    urls: CreateUrlOptions
}

export function createCore(options: CreateCoreOptions): CoreApp {
    return {
        install(app: App, installOptions: InstallCoreOptions) {
            console.log(app)
            //register components
            // app.component('bt-test', BTTest)
            // app.component('bt-btn', BTBtn)
            // app.component('bt-col', BTCol)
            // app.component('bt-field-checkbox', BTFieldCheckbox)
            // app.component('bt-field-date', BTFieldDate)
            // app.component('bt-field-entity', BTFieldEntity)
            // app.component('bt-field-select', BTFieldSelect)
            // app.component('bt-field-string', BTFieldString)
            // app.component('bt-field-switch', BTFieldSwitch)
            // app.component('bt-field-tags', BTFieldTags)
            // app.component('bt-field-text-area', BTFieldTextarea)
            // app.component('bt-field-trigger', BTFieldTrigger)
            // app.component('bt-header-option', BTHeaderOption)
            // app.component('bt-json', BTJson)
            // app.component('bt-select-list-box', BTSelectListBox)
            // app.component('bt-select', BTSelect)
            // app.component('bt-snack', BTSnack)
            // app.component('bt-span', BTSpan)

            //define globals
            // app.config.globalProperties.$btcore = core
            options.vuetifyInstance ??= installOptions.vuetifyInstance
            
            // app.use(VuetifyUseDialog)

            createUrl(options.urls)

            createCosmetics(options)

            const demo = createDemo()

            const navigation = createNavigation(options)
            
            createPresets(options)

            options.auth.demo ??= demo
            options.auth.getAuthItem = navigation.findItem

            const auth = createAuth(options.auth)

            createMenu(options.menu)

            const api = createApi({
                auth: auth,
                findPath: navigation.findPath,
                useBearerToken: true
            })

            const dates = createDates({
                getTimeZone: () => auth.timeZone.value
            })

            createFilters({
                dates: dates
            })

            createPWA()

            createStoreBuilder({
                api,
                auth,
                navigation
            })

        }
    }
}