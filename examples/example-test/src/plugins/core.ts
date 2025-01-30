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
    demo: {
        apis: [
            {
                data: [
                    { id: '1', text: 'testing' },
                    { id: '2', text: 'second' }
                ],
                nav: 'test',
                path: '/treat',
            },
            {
                data: [{ id: '2', text: 'second' }],
                nav: 'tester',
                path: '/treat/2',
            }
        ],
        startInDemo: false
    },
    includeComponents: true,
    navigation: {
        navItems: [{
            name: 'test',
            path: 'treat'
        }]
    },
    urls: {
        getEnv: () => { return 'development' },
        production: {},
        development: {},
        staging: {}
    }
})