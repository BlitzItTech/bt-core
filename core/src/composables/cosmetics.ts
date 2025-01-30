import type { ThemeInstance } from 'vuetify'
import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

interface CosmeticData {
    dark?: BaseCosmeticTheme,
    drawer?: boolean,
    drawerStick?: boolean,
    light?: BaseCosmeticTheme,
    theme?: string
}

export interface BaseCosmeticTheme extends Record<string, string> {
    primary: string,
    // secondary?: string,
    // accent?: string,
    // error?: string,
    // info?: string,
    // success?: string,
    // warning?: string,
}

const defaultLight: BaseCosmeticTheme = {
    primary: '#192233',
    secondary: '#192233',
    accent: '#2a76a2',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00'
}

const defaultDark: BaseCosmeticTheme = {
    primary: '#1d5474',
    secondary: '#192233',
    accent: '#7fcbf7',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00'
}

export interface UseCosmeticsOptions<T extends BaseCosmeticTheme> {
    defaultDarkTheme?: T
    defaultLightTheme?: T
    defaultDrawer?: boolean
    defaultDrawerStick?: boolean
    defaultTheme?: string
    vuetifyInstance?: ThemeInstance
}

export interface BTCosmetics {
    state: Ref<CosmeticData>
    currentSet: ComputedRef<BaseCosmeticTheme>
    resetCosmetics: (toDefault: boolean) => void
    saveState: () => void
    setTemporaryColor: (color: string) => void
    toggleDrawer: () => void
    toggleDrawerStick: () => void
    toggleLightDark: () => void
    updateDrawer: (isOpen: boolean) => void
    undoTemporaryColor: () => void
}

// let defaults: any = {}
// let state: RemovableRef<CosmeticData>
let current: BTCosmetics

export function useCosmetics(): BTCosmetics {
    return current
}

export interface UseLocalCosmeticsOptions {
    defaultTheme?: string
    dark?: any
    light?: any
}

/**Returns a theme options object to pass into the create vuetify theme options */
export function useLocalCosmetics(options?: UseLocalCosmeticsOptions): any {
    const str = localStorage.getItem('cosmetics')
    let r: CosmeticData
    if (str != null && str.length > 0)
        r = JSON.parse(str)

    r ??= {}
    r.dark ??= options?.dark
    r.light ??= options?.light
    r.theme ??= options?.defaultTheme

    return {
        defaultTheme: r.theme ?? 'dark',
        themes: {
            dark: {
                colors: r.dark
            },
            light: {
                colors: r.light
            }
        }
    }
}

export function createCosmetics<T extends BaseCosmeticTheme>(options: UseCosmeticsOptions<T>) {
    const state = ref<CosmeticData>({})
    let themeManager = options.vuetifyInstance

    function load() {
        const str = localStorage.getItem('cosmetics')
        if (str != null && str.length > 0)
            state.value = JSON.parse(str)
        else
            state.value = {
                theme: options.defaultTheme ?? 'light',
                light: { ...defaultLight, ...options.defaultLightTheme },
                dark: { ...defaultDark, ...options.defaultDarkTheme },
                drawer: options.defaultDrawer ?? true,
                drawerStick: options.defaultDrawerStick ?? false
            }
    }

    function save() {
        localStorage.setItem('cosmetics', JSON.stringify(state.value))
    }

    /**resets to the default colors or last saved colors of the current theme */
    function resetCosmetics(toDefault: boolean) {
        if (themeManager != null) {
            themeManager.global.name.value = state.value.theme!
            let color

            if (themeManager.global.name.value == 'dark') {
                //dark
                if (toDefault)
                    state.value.dark = { ...defaultDark, ...options.defaultDarkTheme };
    
                themeManager.themes.value.dark = {
                    ...themeManager.themes.value.dark,
                    colors: {
                        ...themeManager.themes.value.dark.colors,
                        ...state.value.dark
                    }
                }

                color = themeManager.themes.value.dark.colors.primary
            }
            else {
                //light
                if (toDefault)
                    state.value.light = { ...defaultLight, ...options.defaultLightTheme };
    
                themeManager.themes.value.light = {
                    ...themeManager.themes.value.light,
                    colors: {
                        ...themeManager.themes.value.light.colors,
                        ...state.value.light
                    }
                }

                color = themeManager.themes.value.light.colors.primary
            }

            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color)
            save()
        }
    }

    /**sets a temporary primary color that is not saved but is applied to cosmetics */
    function setTemporaryColor(color: string) {
        if (themeManager != null) {
            const dark = themeManager.themes.value.dark
            const light = themeManager.themes.value.light
    
            dark.colors.primary = color
            light.colors.primary = color
            
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color)
        }
    }

    function toggleDrawer() {
        state.value.drawer = !state.value.drawer
        save()
    }

    function updateDrawer(isOpen: boolean) {
        state.value.drawer = isOpen
        save()
    }

    function toggleDrawerStick() {
        state.value.drawerStick = !state.value.drawerStick
        save()
    }

    function toggleLightDark() {
        state.value.theme = state.value.theme == 'dark' ? 'light' : 'dark'
        if (themeManager != null)
            themeManager.global.name.value = state.value.theme

        save()
    }

    function undoTemporaryColor() {
        if (themeManager != null) {
            const dark = themeManager.themes.value.dark
            const light = themeManager.themes.value.light
    
            dark.colors.primary = (state.value.dark ?? { ...defaultDark, ...options.defaultDarkTheme }).primary
            light.colors.primary = (state.value.light ?? { ...defaultLight, ...options.defaultLightTheme }).primary
    
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", '')
        }
    }

    load()

    watch(state, () => {
        save()
    })

    current = {
        state: state,
        currentSet: computed(() => state.value.theme == 'dark' ? state.value.dark as BaseCosmeticTheme : state.value.light as BaseCosmeticTheme),
        resetCosmetics,
        saveState: save,
        setTemporaryColor,
        toggleDrawer,
        toggleDrawerStick,
        toggleLightDark,
        updateDrawer,
        undoTemporaryColor
    }

    return current
}