import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { AuthItem, createAuth, useAuth } from '../src/composables/auth'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createApi } from '../src/composables/api'

const handlers = [
    http.get('https://test-api/refreshtoken', () => {
        return HttpResponse.json({ data: '123' })
    }),

    // http.get('https://test-api/get/2', () => {
    //     return new HttpResponse('not found', {
    //         status: 304
    //     })
    // }),
    // http.get('https://test-api/getAll', () => {
    //     return HttpResponse.json({
    //         data: [{ test: 'a' }, { test: 'b' }],
    //         count: 2,
    //         filters: ['test', 'test two']
    //     })
    // }),
    // http.post('https://test-api/post', () => {
    //     return HttpResponse.json({ data: { test: 'b' } })
    // }),
    // http.patch('https://test-api/patch', () => {
    //     return HttpResponse.json({ data: { test: 'c' } })
    // })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => server.resetHandlers())

describe.sequential('auth', () => {
    let auth = createAuth({
        defaultTimeZone: 'Aus',
        getAuthItem: () => {
            return {
                nav: 'normal'
            } as AuthItem
        },
        tokenRefreshPath: 'https://test-api/refreshtoken',
        useTokenRefresh: true
    })

    createApi({

    })
    
    test('creates successfully', () => {
        const state = auth.authState
        const creds = auth.credentials.value
        
        expect(state).not.toBeNull()
        expect(auth.credentials).not.toBeNull()
        expect(creds.timeZone).toEqual('Aus')
    })

    test('refreshes', async () => {
        await auth.tryRefreshToken()
    })

})