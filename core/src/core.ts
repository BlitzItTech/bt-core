import { App } from 'vue'
import { createApi, CreateApiOptions } from './composables/api.ts'
import { CreateAuthOptions, createAuth, type AuthSubscription } from './composables/auth.ts'
import { BaseCosmeticTheme, createCosmetics, UseCosmeticsOptions } from './composables/cosmetics.ts'
import { createDates } from './composables/dates.ts'
import { createDemo, CreateDemoOptions } from './composables/demo.ts'
import { createFilters } from './composables/filters.ts'
import { CreateHeightOptions, useHeights } from './composables/heights.ts'
import { CreateMenuOptions, createMenu } from './composables/menu.ts'
import { UseNavigationOptions, createNavigation } from './composables/navigation.ts'
import { createPresets } from './composables/presets.ts'
import { createPWA } from './composables/pwa.ts'
import { createBlobStoreBuilder, createStoreBuilder } from './composables/stores.ts'
import { CreateUrlOptions, createUrl } from './composables/urls.ts'
import { DisplayInstance, ThemeInstance } from 'vuetify'
import { navigationKey, authKey, urlsKey, demoKey } from './types.ts'
// import VueDraggableResizable  from 'vue-draggable-resizable'

import BTAvatar from './components/BT-Avatar.vue'
import BTBladeItem from './components/BT-Blade-Item.vue'
import BTBladeItems from './components/BT-Blade-Items.vue'
import BTBlade from './components/BT-Blade.vue'
import BTBtn from './components/BT-Btn.vue'
import BTCameraOverlay from './components/BT-Camera-Overlay.vue'
import BTCol from './components/BT-Col.vue'
import BTCosmeticsMenu from './components/BT-Cosmetics-Menu.vue'
import BTCron from './components/BT-Cron.vue'
import BTDate from './components/BT-Date.vue'
import BTDragCounter from './components/BT-Drag-Counter.vue'
import BTEntity from './components/BT-Entity.vue'
import BTError from './components/BT-Error.vue'
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
import BTImageSelect from './components/BT-Image-Select.vue'
import BTJson from './components/BT-Json.vue'
import BTLoader from './components/BT-Loader.vue'
import BTNavSidebar from './components/BT-Nav-Sidebar.vue'
import BTNumber from './components/BT-Number.vue'
import BTNumpad from './components/BT-Numpad.vue'
import BTSelectInline from './components/BT-Select-Inline.vue'
import BTSelectListBox from './components/BT-Select-List-Box.vue'
import BTSelect from './components/BT-Select.vue'
import BTSignature from './components/BT-Signature.vue'
import BTSignatureOverlay from './components/BT-Signature-Overlay.vue'
import BTSlider from './components/BT-Slider.vue'
import BTSpan from './components/BT-Span.vue'
import BTStatusItem from './components/BT-Status-Item.vue'
import BTTags from './components/BT-Tags.vue'
import { Router } from 'vue-router'
import { createAssistant, CreateAssistantOptions } from './composables/assistant.ts'
import { createFeedback, CreateFeedbackOptions } from './composables/feedback.ts'

export interface CoreApp {
    install(app: App, options: any) : void
}

export interface InstallCoreOptions {
    vuetifyInstance?: ThemeInstance
    vuetifyDisplay?: DisplayInstance
    router?: Router
}

export interface CreateCoreOptions {
    api?: CreateApiOptions
    assistant?: CreateAssistantOptions
    auth: CreateAuthOptions
    cosmetics?: UseCosmeticsOptions<BaseCosmeticTheme>
    demo?: CreateDemoOptions
    feedback?: CreateFeedbackOptions
    filters?: any
    // defaultCacheExpiryHours?: number
    heights?: CreateHeightOptions,
    includeComponents?: boolean
    // getAuthQuery: (redirectPath?: string, state?: string) => string
    menu?: CreateMenuOptions
    navigation?: UseNavigationOptions
    // navItems?: NavigationItem[]
    presets?: any
    // setCredentials?: (state: RemovableRef<any>, payload: any) => void
    /**suboptions */
    subscriptionOptions?: AuthSubscription[]
    urls: CreateUrlOptions
    usePWA?: boolean
}

export function createCore(options: CreateCoreOptions): CoreApp {
    return {
        install(app: App, installOptions: InstallCoreOptions) {
            if (options.includeComponents == true) {
                //register components
                // app.component('vue-draggable-resizable', VueDraggableResizable)
                app.component('bt-avatar', BTAvatar)
                app.component('bt-blade-item', BTBladeItem)
                app.component('bt-blade-items', BTBladeItems)
                app.component('bt-blade', BTBlade)
                app.component('bt-btn', BTBtn)
                app.component('bt-camera-overlay', BTCameraOverlay)
                app.component('bt-col', BTCol)
                app.component('bt-cosmetics-menu', BTCosmeticsMenu)
                app.component('bt-cron', BTCron)
                app.component('bt-date', BTDate)
                app.component('bt-drag-counter', BTDragCounter)
                app.component('bt-entity', BTEntity)
                app.component('bt-error', BTError)
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
                app.component('bt-image-uploader', BTImageSelect)
                app.component('bt-json', BTJson)
                app.component('bt-loader', BTLoader)
                app.component('bt-nav-sidebar', BTNavSidebar)
                app.component('bt-number', BTNumber)
                app.component('bt-numpad', BTNumpad)
                app.component('bt-select-inline', BTSelectInline)
                app.component('bt-select-list-box', BTSelectListBox)
                app.component('bt-select', BTSelect)
                app.component('bt-signature', BTSignature)
                app.component('bt-signature-overlay', BTSignatureOverlay)
                app.component('bt-slider', BTSlider)
                app.component('bt-span', BTSpan)
                app.component('bt-status-item', BTStatusItem)
                app.component('bt-tags', BTTags)
            }
            
            //define globals
            // app.config.globalProperties.$btcore = core
            options.cosmetics ??= {}

            options.cosmetics.vuetifyInstance ??= installOptions.vuetifyInstance
            
            createAssistant(options.assistant ?? { items: [] })

            const urls = createUrl(options.urls)

            createCosmetics(options.cosmetics)

            const navigation = createNavigation(options.navigation ?? {})
            
            options.heights ??= {}

            options.heights.display ??= installOptions.vuetifyDisplay

            options.heights.navigation ??= navigation

            useHeights(options.heights)

            const menu = createMenu(options.menu)
            
            createPresets(options)

            options.auth.menu ??= menu
            options.auth.router ??= installOptions.router
            options.auth.getAuthItem = navigation.findItem

            const auth = createAuth(options.auth)

            if (options.demo != null)
                options.demo.auth ??= auth
            
            const demo = createDemo(options.demo)
            
            const api = createApi({
                ...options.api,
                auth: auth,
                demo: demo,
                findPath: navigation.findPath,
                useBearerToken: true
            })

            const dates = createDates({
                getTimeZone: () => auth.timeZone.value
            })

            createFeedback(options.feedback)

            createFilters({
                auth: auth,
                dates: dates,
                demo: demo,
                filters: options.filters
            })

            options.usePWA ??= true

            if (options.usePWA)
                createPWA()

            createStoreBuilder({
                api,
                auth,
                dates,
                demo,
                navigation
            })

            createBlobStoreBuilder({
                api,
                auth,
                dates,
                demo,
                navigation
            })

            app.provide(navigationKey, navigation)
            app.provide(authKey, auth)
            app.provide(demoKey, demo)
            app.provide(urlsKey, urls)
        }
    }
}