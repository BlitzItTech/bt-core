import { setActivePinia, createPinia } from 'pinia'
import { createSessionStoreDefinition, createWholeLastUpdateStoreDefinition } from '../src/composables/stores'
import { createApi } from '../src/composables/api'
import { describe, test, expect, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createApp } from 'vue'
import { withSetup } from './utils'

const handlers = [
    http.get('https://api/get/1', () => {
        return HttpResponse.json({
            data: { test: 'g' }
        })
    }),
    http.get('https://api/getAll', () => {
        return HttpResponse.json({
            data: [{ test: 'a', id: '1' }, { test: 'b', id: '2' }],
            count: 2,
            filters: ['test', 'test two']
        })
    }),
    http.post('https://api/post', () => {
        return HttpResponse.json({ data: { test: 'd', id: '11' } })
    }),
    http.patch('https://api/patch', () => {
        return HttpResponse.json({ data: { test: 'e', rowVersion: 2 } })
    })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => {
    server.resetHandlers()
})

describe('use last update store no api no caching', () => {
    const [api, app] = withSetup(() => createApi({
        findPath: () => 'https://api/',
        defaultThrowError: false
    }))

    const pinia = createPinia()
    app.use(pinia)

    setActivePinia(pinia)

    const store = createWholeLastUpdateStoreDefinition({
        api: undefined,
        storageMode: 'session',
        storeName: 'whole'
    })()

    test('all session activity', async () => {

        await store.post<any>({ data: { id: '1', test: 'a' }})
        await store.post<any>({ data: { id: '2', test: 'b' }})
        await store.post<any>({ data: { id: '3', test: 'c' }})

        let postRes = await store.get<any>({ id: '1' })
        expect(postRes.data).toEqual({ id: '1', test: 'a' })

        await store.patch<any>({ data: { id: '1', test: 'd' }})
        postRes = await store.get<any>({ id: '1' })
        expect(postRes.data).toEqual({ id: '1', test: 'd' })

        let getAll = await store.getAll<any>({})
        expect(getAll.data.length).toEqual(3)
        expect(getAll.count).toEqual(3)


        await store.deleteItem({ data: { id: '1' }})
        postRes = await store.get<any>({ id: '1' })
        expect(postRes.data).toEqual(undefined)

        getAll = await store.getAll<any>({})
        expect(getAll.data.length).toEqual(2)
        expect(getAll.count).toEqual(2)
    })

})


describe('use last update store with api no caching', () => {
    const [api, app] = withSetup(() => createApi({
        findPath: () => 'https://api/',
        defaultThrowError: false
    }))

    const pinia = createPinia()
        app.use(pinia)
        setActivePinia(pinia)

    const store = createWholeLastUpdateStoreDefinition({
        storageMode: 'session',
        api: api,
        storeName: 'whole-api'
    })()

    test('get', async () => {
        const res = await store.get<any>({ id: '1' })
        expect(res.data).toEqual({ test: 'a', id: '1' })
        let getAll = await store.getAll<any>({})
        expect(getAll.data.length).toEqual(2)
        expect(getAll.count).toEqual(2)
    })


    test('get all', async () => {
        const res = await store.getAll<any>({})
        expect(res).toEqual({
            data: [{test: 'a', id: '1' },{test: 'b', id: '2' }],
            count: 2,
            filters: []
        })
    })
    

    test('post', async () => {
        const res = await store.post<any>({ data: { test: 'a', id: '11' }})
        expect(res).not.toBeNull()
        
        //gets api post return
        let getRes = await store.get<any>({ id: '11' })
        expect(getRes.data).toEqual({ test: 'd', id: '11' })
    })

    test('patch', async () => {
        const res = await store.patch<any>({ data: { test: 'a', id: '1', rowVersion: 1 }})
        let getRes = await store.get<any>({ id: '1' })
        expect(getRes.data.rowVersion).toEqual(2)
    })

})