import { describe, test, expect } from 'vitest'
import { ListEvents, ListProps, UseListOptions, useList } from '../src/composables/list'
import { withSetup, withSetupAndRouter } from './utils'
import { CreateMenuOptions, createMenu, useMenu } from '../src/composables/menu'
import { createAuth } from '../src/composables/auth'
import { createNavigation } from '../src/composables/navigation'
import { createRouter, createWebHistory } from 'vue-router'

const setupList = (routes: any[], navItems: any[], menuOptions: CreateMenuOptions) => {
    return withSetupAndRouter(() => {
        const auth = createAuth({

        })

        const navigation = createNavigation({
            navItems: navItems
        })

        createMenu(menuOptions)

        return {
            auth,
            menu: useMenu(),
            navigation,
        }
    }, routes)
}

describe.sequential('default menu functionality', () => {
    
    const [{ menu }, app] = setupList(
        [{
        name: 'bt-test',
        meta: {
            menuGroup: 'test'
        },
        path: '',
        component: () => {}
    },
    {
        name: 'bt-a',
        meta: {
            menuGroup: 'test',
            nav: 'bt-a'
        },
        path: '',
        component: () => {}
    },
    {
        name: 'bt-b',
        path: '',
        component: () => {}
    }],
    [
        {
            name: 'bt-test'
        },
        {
            name: 'bt-a',
        }
    ],
    {
        default: 'test',
        groups: [
            {
                displayName: 'test',
                isGroup: true
            }
        ],
        useRoutes: true
    })


    test('defaults', () => {
        expect(menu.currentGroup.value).toEqual('test')
        expect(menu.groupOptions.value.length).toEqual(1)
        expect(menu.sidebarNavItems.value).toEqual([
            {
                displayName: undefined,
                icon: undefined,
                permissions: [],
                requiresAuth: true,
                routeName: 'bt-test',
                subFilters: [],
                subscriptions: []
            },
            {
                displayName: 'Bt A',
                icon: undefined,
                permissions: [],
                requiresAuth: true,
                routeName: 'bt-a',
                subFilters: [],
                subscriptions: []
            }
        ])
    })
})