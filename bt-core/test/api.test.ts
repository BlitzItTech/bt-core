import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { useApi } from '../src/composables/api'
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

describe('default api', () => {
    const api = useApi({
        findPath: () => 'https://test-api/',
        defaultThrowError: false
    })

    test('get', async () => {
        const res = await api.get<any>({ additionalUrl: 'get', id: '1', nav: 'test' })
        expect(res).not.toBeNull()
        expect(res.data.test).toEqual('a')
        expect(res.filters[0]).toEqual('test')
    })

    test('get fails', async () => {
        const res = await api.get<any>({ additionalUrl: 'get', id: '2', nav: 'test' })
        expect(res.status).toEqual(304)
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

// describe('default api fails', () => {

// })