import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore, useWholeLastUpdateStore } from '../src/composables/stores'
import { useApi } from '../src/composables/api'
import { describe, test, expect, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createApp } from 'vue'
import { withSetup } from './utils'

const handlers = [
    http.get('https://test-api/get/1', () => {
        return HttpResponse.json({
            data: { test: 'a' }
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
        return HttpResponse.json({ data: { test: 'c', rowVersion: 2 } })
    })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => {
    server.resetHandlers()
})

describe('use session store with no api no caching', () => {
    const [api, app] = withSetup(() => useApi())

    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)

    const store = useSessionStore({
        storageMode: 'session',
        storeName: 'sesh'
    })()

    test('all session activity', async () => {
        await store.post<any>({ data: { id: '1', test: 'a' }})
        let postRes = await store.get<any>({ id: '1' })
        expect(postRes.data).toEqual({ id: '1', test: 'a' })
        await store.patch<any>({ nav: 'test', data: { id: '1', test: 'b' }})
        postRes = await store.get<any>({ id: '1' })
        expect(postRes.data).toEqual({ id: '1', test: 'b' })
        await store.deleteItem({ id: '1' })
        postRes = await store.get<any>({ id: '1' })
        expect(postRes).toEqual(undefined)
    })
})

describe('use session store with api no caching', () => {
    const [api, app] = withSetup(() => useApi({
        findPath: () => 'https://test-api/',
        defaultThrowError: false
    }))

    const pinia = createPinia()
    app.use(pinia)

    setActivePinia(pinia)

    const store = useSessionStore({
        storageMode: 'session',
        api: api,
        storeName: 'test'
    })()

    test('get', async () => {
        const res = await store.get<any>({ nav: 'test', id: '1' })
        expect(res).toEqual({ data: { test: 'a' }})
        expect(store.searchMemory['test_no-user-id_1']).toEqual({ data: { test: 'a' }})
    })

    test('get all', async () => {
        const res = await store.getAll<any>({ nav: 'test' })
        expect(res).toEqual({
            data: [{test: 'a' },{test: 'b'}],
            count: 2,
            filters: ['test', 'test two']
        })
    })

    test('post', async () => {
        const res = await store.post<any>({ nav: 'test', data: { test: 'a', id: '11' }})
        expect(res).not.toBeNull()
        //gets api post return
        let getRes = await store.get<any>({ nav: 'test', id: '11' })
        expect(getRes.data).toEqual({ test: 'b' })
    })

    test('patch', async () => {
        const res = await store.patch<any>({ nav: 'test', data: { test: 'a', id: '1', rowVersion: 1 }})
        let getRes = await store.get<any>({ nav: 'test', id: '1' })
        expect(getRes.data.rowVersion).toEqual(2)
    })

})