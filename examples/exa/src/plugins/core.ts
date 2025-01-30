import { createCore } from '../../../../core/src/core'

export default createCore({
    assistant: {
        items: [
            {
                description: 'description description description description description description',
                icon: '$youtube',
                id: 'a',
                routeNames: ['/a'],
                subtitle: 'How To Do Rostering',
                title: 'Rostering',
                url: 'https://www.youtube.com/watch?v=mVl6RVG8kds&list=PL5dySLuP_j8sHXuiiF2Mic9YO2F8V6Q6P'
            },
            {
                description: 'description description description description description description',
                icon: '$youtube',
                id: 'b',
                routeNames: ['my-route'],
                subtitle: 'How To Do Rostering',
                tags: ['one'],
                title: 'Rostering',
                url: 'https://www.youtube.com/watch?v=mVl6RVG8kds&list=PL5dySLuP_j8sHXuiiF2Mic9YO2F8V6Q6P'
            }
        ]
    },
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
        defaultTheme: 'dark',
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
        getProfiles: () => [
            {
                id: 'a',
                isDefault: true,
                profileAvatarURL: 'favicon.ico',
                profileIcon: '$plus',
                profileName: 'Basic User',
                description: 'See what it feels like to be a basic user with basic permissions.'
            },
            {
                id: 'b',
                profileAvatarURL: 'favicon.ico',
                profileName: 'Admin User',
                description: 'See what it feels like to have admin access.'
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