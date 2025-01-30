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
const showIOSPrompt = ref(false)

export interface BTPWA {
    canInstallApp: Ref<boolean>
    canUpdateApp: Ref<boolean>
    installApp: () => void
    isInstalled: () => boolean
    showIOSPrompt: Ref<boolean>
    updateApp: () => void
}

let current: BTPWA

export function usePWA(): BTPWA {
    return current
}

export function createPWA(): BTPWA {

    // const isIOS = computed(() => {
    //     const userAgent = window.navigator.userAgent.toLowerCase()
    //     return /iphone|ipad|ipod/.test(userAgent)
    // })

    // function isBrowserIOSIPadSafari() {
    //     return !!(
    //       userAgent.match(/Macintosh/) &&
    //       navigator.maxTouchPoints &&
    //       navigator.maxTouchPoints > 1
    //     );
    //   }

    function isDesktopSafari() {
        const isSafari =
          userAgent.includes("Safari") &&
          !userAgent.includes("Chrome") &&
          !userAgent.includes("Edg");
        const isDesktop =
          userAgent.includes("Macintosh") || userAgent.includes("Windows");
    
        return isSafari && isDesktop;
      }

    function isDeviceIOS() {
        return matchesUserAgent(/iPhone|iPad|iPod/) || isDesktopSafari(); // || isBrowserIOSIPadSafari()
    }

    const userAgent = window.navigator.userAgent;
    function matchesUserAgent(regex: RegExp): boolean {
        return !!userAgent.match(regex);
    }

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
        if (prompt.value != null) {
            prompt.value?.prompt()
            canInstallApp.value = false
        }
        else if (isDeviceIOS()) {
            showIOSPrompt.value = true
        }
    }

    function isInstalled() {
        // For iOS
        // For Android
        return (
        !!("standalone" in window.navigator && window.navigator.standalone) ||
        !!(window.matchMedia('(display-mode: standalone)').matches))
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

        if (isDeviceIOS() && !isInstalled())
            canInstallApp.value = true
    })

    current = {
        canInstallApp,
        canUpdateApp,
        installApp,
        isInstalled,
        showIOSPrompt,
        updateApp
    }

    return current
}