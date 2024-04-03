import { createNavigation } from '../src/composables/navigation'
import { describe, expect, test } from 'vitest'

describe("navigation", () => {
    const nav = createNavigation({
        defaultCacheExpiryHours: 3,
        navItems: [
            {
                name: 'test-nav'
            },
            {
                name: 'navA',
                background: 'b',
                displayName: 'discs',
                hideAppBar: true,
                hideNavigation: true,
                hesitate: true,
                icon: 'mdi-plus',
                path: '/testing/one',
                children: [
                    {
                        name: 'navB',
                        cacheExpiryHours: 4,
                        children: [
                            {
                                archiveName: 'nav-archive',
                                aliases: ['nav-alias', 'nav-alia'],
                                name: 'navC',
                                path: '/test/alias'
                            }
                        ],
                        singleName: 'navone'
                    }
                ]
            }
        ]
    })

    test('find archive name', () => {
        expect(nav.findArchiveName('navC')).toEqual('nav-archive')
        expect(nav.findArchiveName('navB')).toEqual(undefined)
        expect(nav.findArchiveName('navD')).toEqual(undefined)
    })

    test('find cache length', () => {
        expect(nav.findCacheHours('navC')).toEqual(3)
        expect(nav.findCacheHours('navB')).toEqual(4)
    })

    test('find display', () => {
        expect(nav.findDisplay('test-nav')).toEqual(undefined)
        expect(nav.findDisplay('navA')).toEqual('discs')
    })

    test('find icon', () => {
        expect(nav.findIcon('test-nav')).toEqual(undefined)
        expect(nav.findIcon('navA')).toEqual('mdi-plus')
    })

    test('find item', () => {
        expect(nav.findItem('test-nav')).not.toBeNull()
        expect(nav.findItem('test-navs')).toBeNull()
        expect(nav.findItem('test-nav')?.name).toEqual('test-nav')
        expect(nav.findItem('nav-alias')?.name).toEqual('navC')
    })

    test('find store name', () => {
        expect(nav.findStoreName('navA')).toEqual('navA')
        expect(nav.findStoreName('navB')).toEqual('navB')
        expect(nav.findStoreName('test-nav')).toEqual('test-nav')
    })

    test('find path', () => {
        expect(nav.findPath('test-nav')).toEqual('')
        expect(nav.findPath('navA')).toEqual('/testing/one')
        expect(nav.findPath('nav-alias')).toEqual('/test/alias')
    })

    test('find single display', () => {
        expect(nav.findSingleDisplay('navA')).toEqual('disc')
        expect(nav.findSingleDisplay('navB')).toEqual('navone')
    })

    test('update nav props', () => {
        nav.updateNavigationProperties('test-nav')

        expect(nav.showAppBar.value).toEqual(true)
        expect(nav.showAppNavigation.value).toEqual(true)
        expect(nav.backgroundName.value).toEqual(undefined)
        expect(nav.hesitate.value).toEqual(false)

        nav.updateNavigationProperties('navA')

        expect(nav.showAppBar.value).toEqual(false)
        expect(nav.showAppNavigation.value).toEqual(false)
        expect(nav.backgroundName.value).toEqual('b')
        expect(nav.hesitate.value).toEqual(true)
    })
})