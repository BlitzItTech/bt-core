import { createCore } from '../../../../core/src/core'

export default createCore({
    auth: {

    },
    cosmetics: {
        defaultDarkTheme: {
            primary: '#1d5474',
            secondary: '#192233',
            accent: '#7fcbf7',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
            'bgd-primary': '#192233'
        },
        defaultLightTheme: {
            primary: '#192233',
            secondary: '#192233',
            accent: '#2a76a2',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
            'bgd-primary': '#192233'
        },
        defaultTheme: 'light',
    },
    includeComponents: true,
    navigation: {
        navItems: []
    },
    urls: {
        getEnv: () => { return 'development' },
        production: {},
        development: {},
        staging: {}
    }
})