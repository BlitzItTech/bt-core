import { tryOnMounted } from '@vueuse/core'
import { ref, type Ref } from 'vue'

export interface SWEvent extends Event {
    detail: any
}

let updateListener: void | undefined 
let controllerChangeListener: void | undefined
let promptListener: void | undefined
let isUpdating = false

const canInstallApp = ref(false)
const canUpdateApp = ref(false)
const prompt: Ref<any> = ref()
const sWorker: Ref<any> = ref()

export function usePWA() {

    function notifyUpdateAvailable(e: any) {
        sWorker.value = e.detail
        canUpdateApp.value = true
    }

    function controllerChanged() {
        if (isUpdating) return
        isUpdating = true
        window.location.reload()
    }

    function installApp() {
        prompt.value?.prompt()
        canInstallApp.value = false
    }

    function isInstalled() {
        // For iOS
        // if (window.navigator.standalone) return true

        // For Android
        if (window.matchMedia('(display-mode: standalone)').matches) return true

        // If neither is true, it's not installed
        return false
    }

    function storePrompt(e: Event) {
        e.preventDefault()
        canInstallApp.value = true
        prompt.value = e
    }

    function updateApp() {
        canUpdateApp.value = false

        if (!sWorker.value || !sWorker.value.waiting)
            return

        sWorker.value.waiting.postMessage({ type: 'SKIP_WAITING' })
    }

    tryOnMounted(() => {
        if (updateListener == null) {
            updateListener = document.addEventListener('swUpdated', notifyUpdateAvailable, { once: true })
        }

        if (controllerChangeListener == null)
            controllerChangeListener = navigator.serviceWorker.addEventListener('controllerchange', controllerChanged)
    
        if (promptListener == null)
            promptListener = window.addEventListener('beforeinstallprompt', storePrompt)
    })

    return {
        canInstallApp,
        canUpdateApp,
        installApp,
        isInstalled,
        updateApp
    }
}