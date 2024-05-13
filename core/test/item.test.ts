import { describe, test, expect, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'
import { useItem, type ItemProps, type UseItemOptions } from '../src/composables/item'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { defineComponent } from 'vue'
import { withSetup } from './utils'
import { createApi } from '../src/composables/api'
import { createStoreBuilder } from '../src/composables/stores'
import { createAuth } from '../src/composables/auth'
import { createNavigation } from '../src/composables/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { twiddleThumbs } from '../src/composables/helpers'

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

const setupItem = (props: ItemProps, options?: UseItemOptions) => {
    return withSetup(() => {
        const api = createApi({})

        const auth = createAuth({})

        const router = createRouter({
            history: createWebHistory(),
            routes: []
        })

        const navigation = createNavigation({})

        return {
            api: api,
            store: createStoreBuilder({
                api: api,
                auth,
                navigation
            }),
            router,
            auth,
            navigation,
            item: useItem(props, options)
        }
    })
}

describe.sequential('default item no api', () => {
    const carOne = { model: 'carolla', brand: 'toyota', plate: 'abc' }
    const carTwo = { model: 'camry', brand: 'toyota', plate: 'def' }
    const carThree = { model: 'magna', brand: 'mits', plate: 'ghi' }
    const carFour = { model: 'bt-50', brand: 'mazda', plate: 'jkl' }
    const cars = [carOne, carTwo, carThree]

    const [{ item }, app] = setupItem({
        eager: true,
        item: carOne,
        storeMode: 'session',
        storageMode: 'session',
        useBladeSrc: false,
        useRouteSrc: false
    }, { })

    test('basic eager setup', () => {
        //items is loaded into list
        expect(item.asyncItem.value).toEqual(carOne)
        expect(item.isChanged.value).toEqual(false)
        expect(item.isDeletable.value).toEqual(true)
        expect(item.isEditing.value).toEqual(false)
        expect(item.isEditable.value).toEqual(true)
        expect(item.isLoading.value).toEqual(false)
        expect(item.isRestorable.value).toEqual(false)
        expect(item.isSaveable.value).toEqual(true)
        expect(item.mode.value).toEqual('view')
    })

    test('changes not tracked by default', () => {
        item.asyncItem.value.model = 'carol'
        expect(item.isChanged.value).toEqual(false)
    })

})


describe.sequential('tracked item no api', () => {
    const carOne = { model: 'carolla', brand: 'toyota', plate: 'abc' }

    const [{ item }, app] = setupItem({
        eager: true,
        item: carOne,
        storeMode: 'session',
        storageMode: 'session',
        trackChanges: true,
        useBladeSrc: false,
        useRouteSrc: false
    }, { })

    test('basic eager setup', () => {
        //items is loaded into list
        expect(item.asyncItem.value).toEqual(carOne)
        expect(item.isChanged.value).toEqual(false)
        expect(item.isDeletable.value).toEqual(true)
        expect(item.isEditing.value).toEqual(false)
        expect(item.isEditable.value).toEqual(true)
        expect(item.isLoading.value).toEqual(false)
        expect(item.isRestorable.value).toEqual(false)
        expect(item.isSaveable.value).toEqual(true)
        expect(item.mode.value).toEqual('view')
    })

    test('changes tracked', async () => {
        item.asyncItem.value.model = 'carol'
        await twiddleThumbs(500)
        expect(item.isChanged.value).toEqual(true)
    })

})