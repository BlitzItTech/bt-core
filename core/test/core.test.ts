import { describe, test, expect, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'
//import { useCo } from '../src/composables/list'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createApp } from 'vue'
import { withSetup } from './utils'
import { createCore } from '../src/core'

const handlers = [
    http.get('https://test-api/order/get/1', () => {
        return HttpResponse.json({
            data: { test: 'a' }
        })
    }),
    http.get('https://test-api/order/get/2', () => {
        return new HttpResponse('not found', {
            status: 304
        })
    }),
    http.get('https://test-api/order/getAll', () => {
        return HttpResponse.json({
            data: [{ test: 'a' }, { test: 'b' }],
            count: 2,
            filters: ['test', 'test two']
        })
    }),
    http.post('https://test-api/order/post', () => {
        return HttpResponse.json({ data: { test: 'b' } })
    }),
    http.patch('https://test-api/order/patch', () => {
        return HttpResponse.json({ data: { test: 'c', rowVersion: 2 } })
    })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => {
    server.resetHandlers()
})

describe.sequential('default list', () => {
    const [core, app] = withSetup(() => {
        createCore({
            auth: {

            },
            navItems: [
                {
                    name: 'test',
                    path: '/order'
                }
            ],
            presets: {},
            urls: {
                production: {
                    data: 'https://test-api'
                },
                staging: {
                    data: 'https://test-api'
                },
                development: {
                    data: 'https://test-api'
                }
            }
        })
    })
    
    test('basics', () => {
        expect('t').toEqual('t')
    })

})