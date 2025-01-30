import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { createApi } from '../src/composables/api'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createAuth } from '../src/composables/auth'
import { createDemo, useDemo } from '../src/composables/demo'


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

describe.sequential('default api', () => {
    const api = createApi({
        findPath: () => 'https://test-api/',
        // defaultThrowError: false
    })

    test('get', async () => {
        const res = await api.get<any>({ additionalUrl: 'get', id: '1', nav: 'test' })
        expect(res).not.toBeNull()
        expect(res.data.test).toEqual('a')
        expect(res.filters[0]).toEqual('test')
    })


    test('get fails without error', async () => {
        const res = await api.get<any>({ throwError: false, additionalUrl: 'get', id: '2', nav: 'test' })
        expect(res).toBeUndefined()
    })

    test('get fails', async () => {
        try {
            await api.get<any>({ additionalUrl: 'get', id: '2', nav: 'test' })
        }
        catch (err: any) {
            expect(err.message).toEqual('304 Not Modified not found')
        }
    })

    test('getAll', async () => {
        const res = await api.get<any>({ additionalUrl: 'getAll', nav: 'test' })
        expect(res).not.toBeNull()
        expect(res.data.length).toEqual(2)
        expect(res.count).toEqual(2)
        expect(res.filters[0]).toEqual('test')
        expect(res.filters[1]).toEqual('test two')
    })

    test('post', async () => {
        const res = await api.post<any>({ additionalUrl: 'post', nav: 'test', data: { data: 'a' }})
        expect(res).not.toBeNull()
        expect(res).toEqual({ data: { test: 'b' } })
    })

    test('patch', async () => {
        const res = await api.patch<any>({ additionalUrl: 'patch', nav: 'test', data: { data: 'a' }})
        expect(res).not.toBeNull()
        expect(res).toEqual({ data: { test: 'c' } })
    })
})

describe.sequential('api using demo', () => {
    const carOne = {
        id: '1',
        model: 'svu',
        plate: 'abc'
    }

    const carTwo = {
        id: '2',
        model: 'sedan',
        plate: 'def'
    }

    const demo = createDemo({
        apis: [
            {
                nav: 'cars',
                data: [carOne, carTwo]
            },
            {
                nav: 'utes',
                data: []
            },
            {
                nav: 'custom patch',
                data: [{ id: '1' }],
                patchAction: (list: any[], item: any) => {
                    const existing = list.find(z => z.id == item.id)
                    existing.version = 2
                    return existing
                }
            },
            {
                nav: 'svus',
                data: []
            },
            {
                nav: 'custom',
                postAction: (list: any[], item: any) => {
                    item.test = 'a'
                    list.push(item)
                    return item
                },
                getAction: (list: any, id?: string) => {
                    return { test: true }
                },
                getAllAction: (list: any, params: any) => {
                    return ['test']
                },
                data: [{ id: '1', treat: true }]
            },
            {

                path: '/sub',
                data: ['test one two three']
            }
        ]
    })

    const api = createApi({
        findPath: () => 'https://test-api/',
        demo
    })

    demo.startDemo()

    test('get', async () => {
        const res = await api.get<any>({ id: '1', nav: 'cars' })
        expect(res).toEqual({ data: carOne })
    })

    test('get fails', async () => {
        let res = await api.get<any>({ throwError: false, id: '3', nav: 'cars' })
        expect(res).toBeUndefined()

        try {
            res = await api.get<any>({ id: '3', nav: 'cars' })
            expect(res).toBeUndefined()
        }
        catch (err: any) {
            expect(err).toBeUndefined()
        }
    })


    test('getAll', async () => {
        const res = await api.getAll<any>({ nav: 'cars' })
        expect(res).not.toBeNull()
        expect(res.data.length).toEqual(2)
        expect(res.count).toEqual(2)
        expect(res.data).toEqual([carOne, carTwo])
    })

    test('post', async () => {
        const res = await api.post<any>({ nav: 'utes', data: { data: 'a' }})
        expect(res).toEqual({ data: { data: 'a', id: '1' }})
    })

    test('patch', async () => {
        const res = await api.patch<any>({ nav: 'utes', data: { data: 'b', id: '1' }})
        expect(res).toEqual({ data: { data: 'b', id: '1' }})
        const getRes = await api.getAll<any>({ nav: 'utes'})
        expect(getRes.data).toEqual([{ data: 'b', id: '1' }])
    })

    test('delete', async () => {
        const res = await api.deleteItem({ nav: 'utes', id: '1' })
        expect(res).toBeUndefined()
        const getRes = await api.getAll<any>({ nav: 'utes'})
        expect(getRes.data).toEqual([])
    })
})

describe.sequential('api bearer token', () => {
    const auth = createAuth({

    })

    auth.credentials.value.token = 'asdf'
    auth.credentials.value.isLoggedIn = true

    const api = createApi({
        auth: auth,
        findPath: () => 'https://test-api/',
        defaultThrowError: false
    })

    test('loading bearer token', async () => {
        const res = await api.get<any>({ additionalUrl: 'get', id: '1', nav: 'test' })
        expect(res).not.toBeNull()
        expect(res.data.test).toEqual('a')
        expect(res.filters[0]).toEqual('test')
    })

    test('get fails', async () => {
        const headers = api.buildHeaders({})
        expect(headers).toEqual({ "Content-Type": "application/json", "authorization": "bearer asdf" })
    })
})