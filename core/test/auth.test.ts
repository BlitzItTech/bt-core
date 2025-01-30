import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { AuthItem, createAuth, useAuth } from '../src/composables/auth'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'


const handlers = [
    http.get('https://test-api/get/1', () => {
        return HttpResponse.json({
            data: { test: 'a' },
            count: 0,
            filters: ['test']
        })
    }),
    http.get('https://test-api/get/2', () => {
        return new HttpResponse('not found', {
            status: 304
        })
    }),
    http.get('https://test-api/getAll', () => {
        return HttpResponse.json({
            data: [{ test: 'a' }, { test: 'b' }],
            count: 2,
            filters: ['test', 'test two']
        })
    }),
    http.post('https://test-api/post', () => {
        return HttpResponse.json({ data: { test: 'b' } })
    }),
    http.patch('https://test-api/patch', () => {
        return HttpResponse.json({ data: { test: 'c' } })
    })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => server.resetHandlers())

describe.sequential('default auth', () => {
    const authItems = [
        {
            ignoreSuspension: false,
            permissions: ['car'],
            subscriptions: ['free'],
            nav: 'car'
        }, {
            ignoreSuspension: false,
            permissions: ['ute'],
            subscriptions: ['cust'],
            nav: 'ute'
        }, {
            ignoreSuspension: false,
            permissions: ['ute', 'car'],
            subscriptions: ['supp'],
            nav: 'both'
        }, {
            permissions: ['car'],
            subscriptions: ['free'],
            nav: 'both-with-children',
            children: [
                {
                    permissions: ['ute'],
                    subscriptions: ['cust'],
                    nav: 'child-one'
                },
                {
                    permissions: ['car'],
                    subscriptions: ['supp'],
                    nav: 'child-two'
                }
            ]
        }, {
            requiresAuth: false,
            nav: 'no-auth',
            permissions: ['tractor']
        }]

    let auth = createAuth({
        defaultTimeZone: 'Aus',
        getAuthItem: (navName?: string | AuthItem) => {
            const r = authItems.find(x => x.nav == navName) as AuthItem
            return r ?? undefined
        },
        subscriptionOptions: [
            { code: 'free', value: 0 },
            { code: 'cust', value: 1 },
            { code: 'supp', value: 2},
            { code: 'cour', value: 3 }
        ]
    })
    
    test('creates successfully', () => {
        const state = auth.authState
        const creds = auth.credentials.value
        
        expect(state).not.toBeNull()
        expect(auth.credentials).not.toBeNull()
        expect(creds.timeZone).toEqual('Aus')
    })

    test('use successfully', () => {
        const a = useAuth()

        expect(a.authState).toEqual(auth.authState)
    })
    
    test('defaults time zone', () => {
        expect(auth.timeZone.value).toEqual('Aus')
    })

    test('resets auth state', () => {
        const original = auth.authState.value
        auth.resetAuthState()

        expect(original).not.toEqual(auth.authState.value)
        expect(original).not.toBeNull()
        expect(auth.authState.value).not.toBeNull()
    })

    test('auth allows anything when not requiring auth', () => {
        expect(auth.canEdit('no-auth')).toEqual(true)
        expect(auth.canView('no-auth')).toEqual(true)
    })
    
    test('global admin access', () => {
        auth.credentials.value = {
            isGlobalAdmin: true,
            isLoggedIn: true,
            userPermissions: ['tractor.view']
        }

        expect(auth.canEdit('car')).toEqual(true)
        expect(auth.canEdit('ute')).toEqual(true)
        expect(auth.canEdit('both')).toEqual(true)

        expect(auth.canView('car')).toEqual(true)
        expect(auth.canView('ute')).toEqual(true)
        expect(auth.canView('both')).toEqual(true)
    })

    test('can only view everything', () => {
        auth.credentials.value = {
            isGlobalAdmin: false,
            isLoggedIn: true,
            userPermissions: ['everything.view']
        }

        expect(auth.canEdit('car')).toEqual(false)
        expect(auth.canEdit('ute')).toEqual(false)
        expect(auth.canEdit('both')).toEqual(false)

        expect(auth.canView('car')).toEqual(true)
        expect(auth.canView('ute')).toEqual(true)
        expect(auth.canView('both')).toEqual(true)
    })

    test('can edit everything', () => {
        auth.credentials.value = {
            isGlobalAdmin: false,
            isLoggedIn: true,
            userPermissions: ['everything.edit']
        }

        expect(auth.canEdit('car')).toEqual(true)
        expect(auth.canEdit('ute')).toEqual(true)
        expect(auth.canEdit('both')).toEqual(true)

        expect(auth.canView('car')).toEqual(true)
        expect(auth.canView('ute')).toEqual(true)
        expect(auth.canView('both')).toEqual(true)
    })

    test('can permit accordingly', () => {
        auth.credentials.value = {
            isGlobalAdmin: false,
            subscriptionCode: 'cust',
            userPermissions: ['car.view', 'ute.edit']
        }

        expect(auth.canEdit('car')).toEqual(false)
        expect(auth.canEdit('ute')).toEqual(true)
        expect(auth.canEdit('both')).toEqual(false)

        expect(auth.canView('car')).toEqual(true)
        expect(auth.canView('ute')).toEqual(true)
        expect(auth.canView('both')).toEqual(true)
    })

    test('do show accordingly with subscription in mind', () => {
        auth.credentials.value = {
            isGlobalAdmin: false,
            subscriptionCode: 'free',
            userPermissions: ['car.view', 'ute.edit']
        }

        expect(auth.doShowByNav('car')).toEqual(true)
        expect(auth.doShowByNav('ute')).toEqual(false)
        expect(auth.doShowByNav('both')).toEqual(false)

        auth.credentials.value = {
            isGlobalAdmin: false,
            subscriptionCode: 'cust',
            userPermissions: ['car.view', 'ute.edit']
        }

        expect(auth.doShowByNav('car')).toEqual(true)
        expect(auth.doShowByNav('ute')).toEqual(true)
        expect(auth.doShowByNav('both')).toEqual(false)

        auth.credentials.value = {
            isGlobalAdmin: false,
            subscriptionCode: 'supp',
            userPermissions: ['car.view', 'ute.edit']
        }

        expect(auth.doShowByNav('car')).toEqual(true)
        expect(auth.doShowByNav('ute')).toEqual(true)
        expect(auth.doShowByNav('both')).toEqual(true)

        auth.credentials.value = {
            isGlobalAdmin: false,
            subscriptionCode: 'cust',
            userPermissions: ['car.view', 'ute.edit']
        }

        expect(auth.doShowByNav('both-with-children')).toEqual(true)
    })
})