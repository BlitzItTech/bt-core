import { RemovableRef, useStorage } from '@vueuse/core'
import { useTheme } from 'vuetify';

interface CosmeticData {
    dark?: BaseCosmeticTheme,
    drawer?: boolean,
    drawerStick?: boolean,
    light?: BaseCosmeticTheme,
    theme?: string
}

export interface BaseCosmeticTheme {
    primary: string,
    secondary: string,
    accent: string,
    error: string,
    info: string,
    success: string,
    warning: string,
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
}

export interface BTCosmetics {
    state: CosmeticData
    initiate: () => void
    resetCosmetics: (toDefault: boolean) => void
    setTemporaryColor: (color: string) => void
    toggleDrawer: () => void
    toggleDrawerStick: () => void
    toggleLightDark: () => void
    undoTemporaryColor: () => void
}

let defaults: any = {}
let state: RemovableRef<CosmeticData>

export function useCosmetics(): BTCosmetics {
    const themeManager = useTheme()

    /**used for initiating the themes and colors from storage when the web app is loaded */
    function loadCosmetics() {
        themeManager.global.name.value = state.value.theme!
        
        //load dark colors
        let darkColors = themeManager.themes.value.dark.colors
        let storedDarkTheme = state.value.dark!
        const darkThemeKeys = Object.keys(storedDarkTheme)
        darkThemeKeys.forEach(darkKey => {
            const k = darkKey as keyof typeof storedDarkTheme
            darkColors[darkKey] = storedDarkTheme[k]
        })
        
        let lightColors = themeManager.themes.value.light.colors
        let storedLightTheme = state.value.light!
        const lightThemeKeys = Object.keys(storedLightTheme)
        lightThemeKeys.forEach(lightKey => {
            const lKey = lightKey as keyof typeof storedLightTheme
            lightColors[lKey] = storedLightTheme[lKey]
        })
    }
    
    /**resets to the default colors or last saved colors of the current theme */
    function resetCosmetics(toDefault: boolean) {
        themeManager.global.name.value = state.value.theme!

        if (themeManager.global.name.value == 'dark') {
            //dark
            if (toDefault)
                state.value.dark = { ...(defaults.defaultDarkTheme ?? defaultDark) };

            themeManager.themes.value.dark = {
                ...themeManager.themes.value.dark,
                colors: {
                    ...themeManager.themes.value.dark.colors,
                    ...state.value.dark
                }
            }
        }
        else {
            //light
            if (toDefault)
                state.value.light = { ...(defaults.defaultLightTheme ?? defaultLight) };

            themeManager.themes.value.light = {
                ...themeManager.themes.value.light,
                colors: {
                    ...themeManager.themes.value.light.colors,
                    ...state.value.light
                }
            }
        }
    }

    /**sets a temporary primary color that is not saved but is applied to cosmetics */
    function setTemporaryColor(color: string) {
        const dark = themeManager.themes.value.dark
        const light = themeManager.themes.value.light

        dark.colors.primary = color
        light.colors.primary = color
        
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color)
    }

    function toggleDrawer() {
        state.value.drawer = !state.value.drawer
    }

    function toggleDrawerStick() {
        state.value.drawerStick = !state.value.drawerStick
    }

    function toggleLightDark() {
        state.value.theme = state.value.theme == 'dark' ? 'light' : 'dark'
        themeManager.global.name.value = state.value.theme
    }
    
    function undoTemporaryColor() {
        const dark = themeManager.themes.value.dark
        const light = themeManager.themes.value.light

        dark.colors.primary = (state.value.dark ?? defaults.defaultDarkTheme ?? defaultDark).primary
        light.colors.primary = (state.value.light ?? defaults.defaultLightTheme ?? defaultLight).primary

        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", '')
    }

    return {
        state: state.value,
        initiate: loadCosmetics,
        resetCosmetics,
        setTemporaryColor,
        toggleDrawer,
        toggleDrawerStick,
        toggleLightDark,
        undoTemporaryColor
    }
}

export function createCosmetics<T extends BaseCosmeticTheme>(options: UseCosmeticsOptions<T>) {
    state = useStorage<CosmeticData>('cosmetics', {
        theme: options.defaultTheme ?? 'light',
        light: options.defaultLightTheme ?? defaultLight,
        dark: options.defaultDarkTheme ?? defaultDark,
        drawer: options.defaultDrawer ?? true,
        drawerStick: options.defaultDrawerStick ?? false
    })

    defaults = options
}