import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { useActions } from '../src/composables/actions'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { withSetup } from './utils'
import { createApi } from '../src/composables/api'


const handlers = [
    http.get('https://test-api/get/1', () => {
        return HttpResponse.json({
            data: { id: '1', test: 'a' },
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
            data: [{ id: 'a', test: 'a' }, { id: 'b', test: 'b' }],
            count: 2,
            filters: ['test', 'test two']
        })
    }),
    http.post('https://test-api/post', () => {
        return HttpResponse.json({ data: { id: 'a', other: 'b' } })
    })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => server.resetHandlers())


describe.sequential('actions with api store', () => {
    const [api] = withSetup(() => createApi({
        findPath() {
            return 'https://test-api/'
        },
    }))

    const actions = useActions({
        nav: 'test-api-actions'
    })
    

    test('api post', async () => {
        const itemAdd = { id: 'a', other: 'b' }
        const res = await actions.apiPost({
            additionalUrl: '/post',
            api,
            data: itemAdd
        })

        expect(res).toEqual({ data: { id: 'a', other: 'b' } })
    })

    test('api get', async () => {
        const res = await actions.apiGet({
            additionalUrl: '/get',
            api,
            id: '1'
        })

        expect(res).toEqual({
            data: { id: '1', test: 'a' },
            count: 0,
            filters: ['test']
        })
    })

    test('api get error', async () => {
        const res = await actions.apiGet({
            api,
            id: '2'
        })

        expect(res).toBeUndefined()
    })

})