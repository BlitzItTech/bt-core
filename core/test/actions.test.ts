import { setActivePinia, createPinia } from 'pinia'
import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { useActions, type GetOptions } from '../src/composables/actions'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createSessionStoreDefinition, createWholeLastUpdateStoreDefinition } from '../src/composables/stores'
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
    }),
    http.patch('https://test-api/patch', () => {
        return HttpResponse.json({ data: { id: 'a', other: 'c' } })
    })
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => server.resetHandlers())


describe.sequential('actions with api store', () => {
    const [api, app] = withSetup(() => createApi({
        findPath() {
            return 'https://test-api/'
        },
    }))

    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)

    const store = createSessionStoreDefinition({
        storageMode: 'session',
        storeName: 'test-store',
        api: api
    })

    let f = false

    const actions = useActions({
        nav: 'test-store',
        onFinished: () => {
            f = true
        },
        store: store 
    })
    
    test('add new item', async () => {
        const itemAdd = { id: 'a', other: 'b' }
        const res = await actions.saveItem({
            data: itemAdd,
            mode: 'new'
        })

        expect(res).toEqual(itemAdd)
    })

    test('update new item', async () => {
        const itemUpdate = { id: 'a', other: 'c' }
        const res = await actions.saveItem({
            data: itemUpdate
        })

        expect(res).toEqual({ id: 'a', other: 'c' })
    })
    
    test('get item by id succeeds', async () => {
        const res = await actions.getItem({
            id: '1'
        })

        expect(res).toEqual({ id: '1', test: 'a' })
    })

    test('get all succeeds', async () => {
        const res = await actions.getAllItems({})
        expect(res).toEqual({
            data: [{ id: 'a', test: 'a' }, { id: 'b', test: 'b' }],
            count: 2,
            filters: ['test', 'test two']
        })
    })

    test('get all finishes', async () => {
        let isFinished = false
        f = false
        await actions.getAllItems({
            // onFinished: undefined
            onFinished: () => {
                isFinished = true
            }
        })

        expect(isFinished).toEqual(true)
        expect(f).toEqual(false)
    })

    // test('add another item', async () => {
    //     const itemAdd = { id: 'aa', other: 'c' }
    //     const res = await actions.saveItem({
    //         data: itemAdd,
    //         mode: 'new'
    //     })

    //     expect(res).toEqual(itemAdd)

    //     const getRes = await actions.getAllItems({})

    //     expect(getRes.data).toEqual([
    //         { id: 'aa', other: 'c' },
    //         { id: 'a', other: 'b' }
    //     ])
    // })

    // test('update item', async () => {
    //     const itemUpdate = { id: 'aa', other: 'd' }
    //     const res = await actions.saveItem({
    //         data: itemUpdate
    //     })

    //     expect(res).toEqual(itemUpdate)

    //     const getRes = await actions.getAllItems({})

    //     expect(getRes.data).toEqual([
    //         { id: 'aa', other: 'd' },
    //         { id: 'a', other: 'b' }
    //     ])
    // })

    // test('delete item by id', async () => {
    //     const res = await actions.deleteItem({
    //         id: 'a'
    //     })

    //     expect(res).toBeUndefined()

    //     const getRes = await actions.getAllItems({})

    //     expect(getRes.data).toEqual([
    //         { id: 'aa', other: 'd' }
    //     ])
    // })

    // test('delete nonexisting item does nothing successfully', async () => {
    //     const res = await actions.deleteItem({
    //         id: 'b'
    //     })

    //     expect(res).toBeUndefined()

    //     const getRes = await actions.getAllItems({})

    //     expect(getRes.data).toEqual([
    //         { id: 'aa', other: 'd' }
    //     ])
    // })

    // test('delete item by data with id', async () => {
    //     const res = await actions.deleteItem({
    //         data: {
    //             id: 'aa'
    //         }
    //     })

    //     expect(res).toBeUndefined()

    //     const getRes = await actions.getAllItems({})

    //     expect(getRes.data).toEqual([])
    // })
})

describe('basic custom actions', () => {
    const actions = useActions({})

    test('logs errors', () => {
        actions.logError('err')
        expect(actions.actionErrorMsg.value).toEqual('err')
    })

    test('custom delete actions', async () => {
        let deleteList = ['one', 'two']
        let suceeded = false

        //delete succeeds
        await actions.deleteItem({
            onDeleteAsync: async (item: any) => {
                deleteList = deleteList.filter(z => z !== item)
                return Promise.resolve(undefined)
            },
            onDeleteSuccessAsync: async (item: any) => {
                suceeded = true
                return Promise.resolve(undefined)
            },
            data: 'one'
        })

        expect(deleteList).toEqual(['two'])
        expect(suceeded).toEqual(true)

        //delete not succeeds
        await actions.deleteItem({
            onDeleteAsync: async (item: any) => {
                deleteList = deleteList.filter(z => z !== item)
                return Promise.resolve('err')
            },
            onDeleteSuccessAsync: async (item: any) => {
                suceeded = false
                return Promise.resolve(undefined)
            },
            data: 'three'
        })
        
        expect(deleteList).toEqual(['two'])
        expect(suceeded).toEqual(true)

    })

    test('custom can delete', async (item: any) => {
        let deleted = false
        let canDo = true

        await actions.deleteItem({
            onCanDeleteAsync: async (item: any) => {
                canDo = false
                return Promise.resolve('nope')
            },
            onDeleteAsync: async (item: any) => {
                deleted = true
                return Promise.resolve(undefined)
            },
            data: 'test'
        })

        expect(deleted).toEqual(false)
        expect(canDo).toEqual(false)
    })

    test('custom get actions', async () => {
        let res = await actions.getItem({
            onGetAsync: async (opt?: GetOptions) => {
                return Promise.resolve('test')
            },
            onGetSuccessAsync: async (item: any, opt?: GetOptions) => {
                expect(item).toEqual('test')
                return Promise.resolve('success')
            }
        })

        expect(res).toEqual('success')
    })

    test('custom get all actions', async () => {
        let res = await actions.getAllItems({
            onGetAsync: async (opt?: GetOptions) => {
                return Promise.resolve('test')
            },
            onGetSuccessAsync: async (item: any, opt?: GetOptions) => {
                expect(item).toEqual('test')
                return Promise.resolve('success')
            }
        })

        expect(res).toEqual('success')
    })

})

describe.sequential('default actions', () => {
    const itemGet = { id: 'test', other: 't' }
    const items = [itemGet, { id: 'test two' }, { id: 'test three' }]
    const actions = useActions({ items })

    test('logs errors', () => {
        actions.logError('err')
        expect(actions.actionErrorMsg.value).toEqual('err')
    })

    test('delete data id action', async () => {
        let suceeded = false

        //delete succeeds
        await actions.deleteItem({
            onDeleteSuccessAsync: async (item: any) => {
                suceeded = true
                return Promise.resolve(undefined)
            },
            data: { id: 'test two' }
        })

        expect(items).toEqual([
            { id: 'test', other: 't' },
            { id: 'test three' }
        ])
        expect(suceeded).toEqual(true)
    })

    test('delete id action', async () => {
        let suceeded = false

        //delete not succeeds
        await actions.deleteItem({
            onDeleteSuccessAsync: async (item: any) => {
                suceeded = true
                return Promise.resolve(undefined)
            },
            id: 'test three'
        })
        
        expect(items).toEqual([
            { id: 'test', other: 't' }
        ])
        expect(suceeded).toEqual(true)
    })

    test('get actions', async () => {
        let res = await actions.getItem({
            data: { id: 'test' }
        })

        expect(res).toEqual(itemGet)
    })

    test('save add action', async () => {
        const itemAdd = { id: 'test four', other: 'a' }
        let res = await actions.saveItem({
            data: itemAdd
        })

        expect(items).toEqual([
            { id: 'test', other: 't' },
            { id: 'test four', other: 'a' }
        ])

        expect(res).toEqual(itemAdd)
    })

    test('save update action', async () => {
        const itemUpdate = { id: 'test', other: 'b' }
        let res = await actions.saveItem({
            data: itemUpdate
        })

        expect(items).toEqual([
            { id: 'test', other: 'b' },
            { id: 'test four', other: 'a' }
        ])

        expect(res).toEqual(itemUpdate)
    })

    test('custom get all actions', async () => {
        let res = await actions.getAllItems({})

        expect(res).toEqual([
            { id: 'test', other: 'b' },
            { id: 'test four', other: 'a' }
        ])
        
        expect(items).toEqual(res)
    })

})

describe.sequential('actions with non-api store', () => {
    const [api, app] = withSetup(() => createApi())

    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)

    const store = createWholeLastUpdateStoreDefinition({
        storageMode: 'session',
        storeName: 'test-storie'
    })

    const actions = useActions({
        store: store
    })

    test('add new item', async () => {
        const itemAdd = { id: 'a', other: 'b' }
        const res = await actions.saveItem({
            data: itemAdd,
            mode: 'new',
            // nav: 'test-store'
        })

        expect(res).toEqual(itemAdd)

        const getRes = await actions.getAllItems({})

        expect(getRes.data).toEqual([{ id: 'a', other: 'b' }])
    })
    
    test('get item by id', async () => {
        const res = await actions.getItem({
            id: 'a'
        })

        expect(res).toEqual({ id: 'a', other: 'b' })
    })

    test('add another item', async () => {
        const itemAdd = { id: 'aa', other: 'c' }
        const res = await actions.saveItem({
            data: itemAdd,
            mode: 'new'
        })

        expect(res).toEqual(itemAdd)

        const getRes = await actions.getAllItems({})

        expect(getRes.data).toEqual([
            { id: 'aa', other: 'c' },
            { id: 'a', other: 'b' }
        ])
    })

    test('update item', async () => {
        const itemUpdate = { id: 'aa', other: 'd' }
        const res = await actions.saveItem({
            data: itemUpdate
        })

        expect(res).toEqual(itemUpdate)

        const getRes = await actions.getAllItems({})

        expect(getRes.data).toEqual([
            { id: 'aa', other: 'd' },
            { id: 'a', other: 'b' }
        ])
    })

    test('delete item by id', async () => {
        const res = await actions.deleteItem({
            id: 'a'
        })

        expect(res).toBeUndefined()

        const getRes = await actions.getAllItems({})

        expect(getRes.data).toEqual([
            { id: 'aa', other: 'd' }
        ])
    })

    test('delete nonexisting item does nothing successfully', async () => {
        const res = await actions.deleteItem({
            id: 'b'
        })

        expect(res).toBeUndefined()

        const getRes = await actions.getAllItems({})

        expect(getRes.data).toEqual([
            { id: 'aa', other: 'd' }
        ])
    })

    test('delete item by data with id', async () => {
        const res = await actions.deleteItem({
            data: {
                id: 'aa'
            }
        })

        expect(res).toBeUndefined()

        const getRes = await actions.getAllItems({})

        expect(getRes.data).toEqual([])
    })
})