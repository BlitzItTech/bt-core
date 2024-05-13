import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { BaseCosmeticTheme, createCosmetics, useCosmetics, useLocalCosmetics } from '../src/composables/cosmetics'
import { withSetup } from './utils'
import { createVuetify } from 'vuetify'


describe.sequential('default cosmetics', () => {
    const [vuetify, app] = withSetup(() => createVuetify({
        theme: useLocalCosmetics({
            defaultTheme: 'dark',
            dark: { primary: 'a' },
            light: { primary: 'b' }
        })
    }))

    let cosmetics = createCosmetics<any>({
        defaultDarkTheme: { primary: 'a' },
        defaultLightTheme: { primary: 'b' },
        defaultDrawer: true,
        defaultDrawerStick: true,
        defaultTheme: 'dark',
        vuetifyInstance: vuetify.theme
    })

    test('create', () => {
        expect(cosmetics.state).not.toBeNull()
    })

    test('use cosmetics', () => {
        expect(cosmetics.state.value).toEqual(useCosmetics().state.value)
    })

    test('toggle drawer', () => {
        expect(cosmetics.state.value.drawer).toEqual(true)
        cosmetics.toggleDrawer()
        expect(cosmetics.state.value.drawer).toEqual(false)
    })

    test('toggle drawer stick', () => {
        expect(cosmetics.state.value.drawerStick).toEqual(true)
        cosmetics.toggleDrawerStick()
        expect(cosmetics.state.value.drawerStick).toEqual(false)
    })

    test('toggle light dark', () => {
        expect(cosmetics.state.value.theme).toEqual('dark')
        expect(vuetify.theme.global.name.value).toEqual('dark')
        cosmetics.toggleLightDark()
        expect(cosmetics.state.value.theme).toEqual('light')
        expect(vuetify.theme.global.name.value).toEqual('light')
        cosmetics.toggleLightDark()
    })

    test('toggle temp color', () => {
        cosmetics.setTemporaryColor('#111111')
        expect(vuetify.theme.themes.value.dark.colors.primary).toEqual('#111111')
        expect(vuetify.theme.themes.value.light.colors.primary).toEqual('#111111')
        cosmetics.undoTemporaryColor()
        expect(vuetify.theme.themes.value.dark.colors.primary).toEqual('a')
        expect(vuetify.theme.themes.value.light.colors.primary).toEqual('b')
    })

    test('reset cosmetics to prior', () => {
        vuetify.theme.themes.value.dark.colors.primary = '#222222'
        cosmetics.resetCosmetics(false)
        expect(vuetify.theme.themes.value.dark.colors.primary).toEqual('a')
    })

    test('reset cosmetics to default', () => {
        vuetify.theme.themes.value.dark.colors.primary = '#222222'
        cosmetics.resetCosmetics(true)
        expect(vuetify.theme.themes.value.dark.colors.primary).toEqual('a')
    })

})